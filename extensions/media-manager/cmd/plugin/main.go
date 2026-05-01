package main

import (
	"context"
	"os"
	"strconv"
	"strings"
	"sync"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"

	// Register WebP decoder so image.Decode can read WebP files.
	_ "golang.org/x/image/webp"

	// Pure Go WebP encoder via WebAssembly (no CGO required).

	"squilla/internal/coreapi"
	vibeplugin "squilla/pkg/plugin"
	coreapipb "squilla/pkg/plugin/coreapipb"
	pb "squilla/pkg/plugin/proto"
)

const tableName = "media_files"
const sizesTable = "media_image_sizes"

// bulkJobProgress tracks progress of a long-running bulk operation.
type bulkJobProgress struct {
	mu        sync.Mutex
	Running   bool   `json:"running"`
	Total     int    `json:"total"`
	Processed int    `json:"processed"`
	Failed    int    `json:"failed"`
	Savings   int64  `json:"total_saved"`
	Status    string `json:"status"` // "idle", "running", "done", "error"
}

func (p *bulkJobProgress) reset(total int) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Running = true
	p.Total = total
	p.Processed = 0
	p.Failed = 0
	p.Savings = 0
	p.Status = "running"
}

func (p *bulkJobProgress) advance(saved int64, failed bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if failed {
		p.Failed++
	} else {
		p.Processed++
		p.Savings += saved
	}
}

func (p *bulkJobProgress) finish() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Running = false
	p.Status = "done"
}

func (p *bulkJobProgress) snapshot() map[string]any {
	p.mu.Lock()
	defer p.mu.Unlock()
	return map[string]any{
		"running":     p.Running,
		"total":       p.Total,
		"processed":   p.Processed,
		"failed":      p.Failed,
		"total_saved": p.Savings,
		"status":      p.Status,
	}
}

// MediaManagerPlugin implements the ExtensionPlugin interface.
type MediaManagerPlugin struct {
	host               *coreapi.GRPCHostClient
	storageDir         string   // base storage path (e.g. "storage")
	cacheLocks         sync.Map // per-path mutexes to prevent thundering herd
	reoptimizeProgress bulkJobProgress
	restoreProgress    bulkJobProgress
}

func (p *MediaManagerPlugin) GetSubscriptions() ([]*pb.Subscription, error) {
	return []*pb.Subscription{
		{EventName: "theme.activated", Priority: 50},
		{EventName: "theme.deactivated", Priority: 50},
		{EventName: "extension.activated", Priority: 50},
		{EventName: "extension.deactivated", Priority: 50},
	}, nil
}

func (p *MediaManagerPlugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	switch action {
	case "theme.activated":
		if err := p.handleOwnedAssetsActivated(payload, ownerTheme); err != nil {
			return &pb.EventResponse{Handled: true, Error: err.Error()}, nil
		}
		return &pb.EventResponse{Handled: true}, nil
	case "theme.deactivated":
		if err := p.handleOwnedAssetsDeactivated(payload, ownerTheme); err != nil {
			return &pb.EventResponse{Handled: true, Error: err.Error()}, nil
		}
		return &pb.EventResponse{Handled: true}, nil
	case "extension.activated":
		if err := p.handleOwnedAssetsActivated(payload, ownerExtension); err != nil {
			return &pb.EventResponse{Handled: true, Error: err.Error()}, nil
		}
		return &pb.EventResponse{Handled: true}, nil
	case "extension.deactivated":
		if err := p.handleOwnedAssetsDeactivated(payload, ownerExtension); err != nil {
			return &pb.EventResponse{Handled: true, Error: err.Error()}, nil
		}
		return &pb.EventResponse{Handled: true}, nil
	default:
		return &pb.EventResponse{Handled: false}, nil
	}
}

// ---------------------------------------------------------------------------
// Theme & extension asset import / purge
// (theme.activated, theme.deactivated, extension.activated, extension.deactivated)
// ---------------------------------------------------------------------------

// ownerKind distinguishes theme-owned vs extension-owned asset rows in
// media_files. The column names, storage prefix, and payload field that
// carries the owner identifier all vary per kind.
type ownerKind int

func toInt(v any) (int, bool) {
	switch x := v.(type) {
	case int:
		return x, true
	case int32:
		return int(x), true
	case int64:
		return int(x), true
	case float64:
		return int(x), true
	case float32:
		return int(x), true
	case string:
		if n, err := strconv.Atoi(x); err == nil {
			return n, true
		}
	}
	return 0, false
}

// toUint coerces a row column (int/int64/float64) to uint for ID parameters.
func toUint(v any) (uint, bool) {
	switch x := v.(type) {
	case uint:
		return x, true
	case int:
		return uint(x), true
	case int32:
		return uint(x), true
	case int64:
		return uint(x), true
	case float64:
		return uint(x), true
	case string:
		if n, err := strconv.ParseUint(x, 10, 64); err == nil {
			return uint(n), true
		}
	}
	return 0, false
}

// slugify is a minimal theme-name to path-safe slug (spaces, slashes → dash,
// ASCII-lowercase). Used for the storage path `media/theme/<slug>/<key>.ext`.
func slugify(name string) string {
	s := strings.ToLower(name)
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "/", "-")
	s = strings.ReplaceAll(s, "\\", "-")
	return s
}

func (p *MediaManagerPlugin) Shutdown() error {
	return nil
}

func (p *MediaManagerPlugin) Initialize(hostConn *grpc.ClientConn) error {
	p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	p.storageDir = "storage"
	if dir := os.Getenv("STORAGE_DIR"); dir != "" {
		p.storageDir = dir
	}

	// Seed default image sizes if the table is empty.
	p.seedDefaultSizes()

	// Seed optimizer settings so keys exist on fresh installs — keeps the
	// UI's initial read consistent and avoids "record not found" log noise
	// from GetSetting probes across the rest of the plugin.
	p.seedOptimizerDefaults()

	return nil
}

// seedOptimizerDefaults writes default values for any optimizer setting
// keys that aren't yet present. Idempotent — existing keys are left
// untouched so user-set values are preserved across plugin restarts.
func (p *MediaManagerPlugin) seedOptimizerDefaults() {
	ctx := context.Background()
	for key, defaultVal := range optimizerSettingDefaults {
		existing, err := p.host.GetSetting(ctx, key)
		if err == nil && existing != "" {
			continue
		}
		if err := p.host.SetSetting(ctx, key, defaultVal); err != nil {
			continue
		}
	}
}

// seedDefaultSizes ensures the default image sizes exist in the database.
// This runs on plugin startup so sizes are available even on fresh installs.
func (p *MediaManagerPlugin) seedDefaultSizes() {
	ctx := context.Background()

	// Check if sizes already exist.
	result, err := p.host.DataQuery(ctx, sizesTable, coreapi.DataStoreQuery{Limit: 1})
	if err != nil {
		return
	}
	if result.Total > 0 {
		return // Already seeded.
	}

	defaults := []map[string]any{
		{"name": "thumbnail", "width": 150, "height": 150, "mode": "crop", "source": "default", "quality": 0},
		{"name": "medium", "width": 250, "height": 250, "mode": "fit", "source": "default", "quality": 0},
		{"name": "large", "width": 500, "height": 500, "mode": "fit", "source": "default", "quality": 0},
	}

	for _, size := range defaults {
		if _, err := p.host.DataCreate(ctx, sizesTable, size); err != nil {
			// Ignore duplicate errors (race condition with another instance).
			continue
		}
	}

	// Notify core to refresh its in-memory registry.
	_ = p.host.Emit(ctx, "media:sizes_changed", map[string]any{"action": "seeded"})
}

func (p *MediaManagerPlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	path := strings.TrimSuffix(req.GetPath(), "/")
	method := strings.ToUpper(req.GetMethod())
	ctx := context.Background()

	// Public route: GET /media/cache/{size}/{path...}
	// This comes from the public extension proxy with the full URL path.
	if method == "GET" && strings.HasPrefix(path, "/media/cache/") {
		return p.handlePublicCacheRequest(ctx, req)
	}

	// Public route: GET /media/{path...} — auto WebP conversion
	// Intercepts all media file requests; serves WebP when browser accepts it.
	if method == "GET" && strings.HasPrefix(path, "/media/") && !strings.HasPrefix(path, "/media/cache/") {
		return p.handlePublicMediaRequest(ctx, req)
	}

	// Route: POST /upload
	if method == "POST" && (path == "/upload" || path == "upload") {
		return p.handleUpload(ctx, req)
	}

	// Route: GET / (list)
	if method == "GET" && (path == "" || path == "/") {
		return p.handleList(ctx, req)
	}

	// --- Optimizer routes ---

	// GET /optimizer/settings
	if method == "GET" && path == "/optimizer/settings" {
		return p.handleGetOptimizerSettings(ctx)
	}
	// PUT /optimizer/settings
	if method == "PUT" && path == "/optimizer/settings" {
		return p.handleUpdateOptimizerSettings(ctx, req.GetBody())
	}
	// GET /optimizer/sizes
	if method == "GET" && path == "/optimizer/sizes" {
		return p.handleListSizes(ctx)
	}
	// POST /optimizer/sizes
	if method == "POST" && path == "/optimizer/sizes" {
		return p.handleCreateSize(ctx, req.GetBody())
	}
	// DELETE /optimizer/sizes/:name
	if method == "DELETE" && strings.HasPrefix(path, "/optimizer/sizes/") {
		name := strings.TrimPrefix(path, "/optimizer/sizes/")
		if name == "" {
			return jsonError(400, "MISSING_NAME", "Size name is required"), nil
		}
		return p.handleDeleteSize(ctx, name)
	}
	// POST /optimizer/cache/clear
	if method == "POST" && path == "/optimizer/cache/clear" {
		return p.handleClearAllCache(ctx)
	}
	// POST /optimizer/cache/clear/:size
	if method == "POST" && strings.HasPrefix(path, "/optimizer/cache/clear/") {
		sizeName := strings.TrimPrefix(path, "/optimizer/cache/clear/")
		if sizeName == "" {
			return jsonError(400, "MISSING_SIZE", "Size name is required"), nil
		}
		return p.handleClearSizeCache(ctx, sizeName)
	}
	// GET /optimizer/stats — optimization statistics
	if method == "GET" && path == "/optimizer/stats" {
		return p.handleOptimizerStats(ctx)
	}
	// POST /optimizer/reoptimize-all — re-optimize all images with current settings (async)
	if method == "POST" && path == "/optimizer/reoptimize-all" {
		return p.handleReoptimizeAll(ctx, false)
	}
	// POST /optimizer/optimize-pending — optimize only images that haven't been optimized yet (async)
	if method == "POST" && path == "/optimizer/optimize-pending" {
		return p.handleReoptimizeAll(ctx, true)
	}
	// GET /optimizer/reoptimize-progress — poll progress of bulk re-optimize
	if method == "GET" && path == "/optimizer/reoptimize-progress" {
		return jsonResponse(200, map[string]any{"data": p.reoptimizeProgress.snapshot()}), nil
	}
	// POST /optimizer/restore-all — restore all images to originals (async)
	if method == "POST" && path == "/optimizer/restore-all" {
		return p.handleRestoreAll(ctx)
	}
	// GET /optimizer/restore-progress — poll progress of bulk restore
	if method == "GET" && path == "/optimizer/restore-progress" {
		return jsonResponse(200, map[string]any{"data": p.restoreProgress.snapshot()}), nil
	}

	// --- Media routes with ID ---

	// POST /:id/restore — restore original image
	if method == "POST" && strings.HasSuffix(path, "/restore") {
		idPart := strings.TrimSuffix(strings.TrimPrefix(path, "/"), "/restore")
		if rid, err := strconv.ParseUint(idPart, 10, 64); err == nil && rid > 0 {
			return p.handleRestoreOriginal(ctx, uint(rid))
		}
	}
	// POST /:id/reoptimize — re-optimize single image
	if method == "POST" && strings.HasSuffix(path, "/reoptimize") {
		idPart := strings.TrimSuffix(strings.TrimPrefix(path, "/"), "/reoptimize")
		if rid, err := strconv.ParseUint(idPart, 10, 64); err == nil && rid > 0 {
			return p.handleReoptimize(ctx, uint(rid))
		}
	}

	// --- Media CRUD routes with ID ---

	// Route with ID: GET /:id, PUT /:id, DELETE /:id
	id := extractID(path, req.GetPathParams())
	if id == 0 {
		return jsonError(404, "NOT_FOUND", "Route not found"), nil
	}

	switch method {
	case "GET":
		return p.handleGet(ctx, id)
	case "PUT":
		return p.handleUpdate(ctx, id, req.GetBody())
	case "DELETE":
		return p.handleDelete(ctx, id)
	default:
		return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
	}
}

// handleList handles GET / — returns paginated media files.
func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		VersionedPlugins: map[int]goplugin.PluginSet{
			2: {"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &MediaManagerPlugin{}}},
		},
		GRPCServer: vibeplugin.NewGRPCServer,
	})
}

// handlePublicMediaRequest handles GET /media/{path} — serves the original file
// but auto-converts to WebP if the browser accepts it and WebP is enabled.
// This acts like Apache's mod_rewrite + WebP Express.
