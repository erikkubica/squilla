package main

import (
	"embed"
	"encoding/json"
	"path"
	"strings"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"

	"squilla/internal/coreapi"
	vibeplugin "squilla/pkg/plugin"
	coreapipb "squilla/pkg/plugin/coreapipb"
	pb "squilla/pkg/plugin/proto"
)

// VisualEditorPlugin owns the live front-end block editor. It does two
// things:
//
//  1. Subscribes to render.body_end and, for users with node-write
//     access, returns a <script> tag that bootstraps the editor on the
//     public page. Anonymous and read-only visitors get an empty
//     string — the script never reaches them.
//
//  2. Serves the editor's static bundle (editor.js / editor.css) via
//     /admin/api/ext/visual-editor/static/* so the script tag from (1)
//     resolves. The bundle is built by extensions/visual-editor/editor-ui
//     and embedded at compile time.
//
// All save operations go through the existing PATCH /admin/api/nodes
// endpoint — this extension introduces no new write paths, so all
// existing CSRF + capability gates apply unchanged.
type VisualEditorPlugin struct {
	host *coreapi.GRPCHostClient
}

//go:embed assets/*
var staticAssets embed.FS

func (p *VisualEditorPlugin) GetSubscriptions() ([]*pb.Subscription, error) {
	// Priority 100: well after seo-extension (priority 50 on render.head)
	// and other content-shaping extensions. The editor script must be
	// last in body_end so it runs after analytics and theme scripts have
	// initialized — otherwise its DOM walk of block markers could race
	// against late-loaded theme widgets that re-render content.
	return []*pb.Subscription{
		{EventName: "render.body_end", Priority: 100},
	}, nil
}

func (p *VisualEditorPlugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	switch action {
	case "render.body_end":
		return p.handleRenderBodyEnd(payload)
	}
	return &pb.EventResponse{Handled: false}, nil
}

// handleRenderBodyEnd inspects the kernel-supplied user payload and,
// for admins / role=admin users, returns a tiny bootstrap that loads
// the editor module. The bootstrap also seeds window.__SQUILLA_VEDIT
// with per-page context (node id, csrf-equivalent already-on-cookie
// session, language) so the editor module doesn't need a second HTTP
// round-trip just to learn what it's editing.
//
// The full payload shape is established by internal/cms/render_hooks.go:
//
//	{ action, node, settings, translations, user }
//
// where user is null for anonymous visitors. We gate solely on
// user.role_slug == "admin" for v1; per-node-type write capabilities
// are enforced again on the actual PATCH so a leaked script tag still
// can't escalate.
func (p *VisualEditorPlugin) handleRenderBodyEnd(payload []byte) (*pb.EventResponse, error) {
	if len(payload) == 0 {
		return &pb.EventResponse{Handled: false}, nil
	}

	var ctx struct {
		Node map[string]any `json:"node"`
		User map[string]any `json:"user"`
	}
	if err := json.Unmarshal(payload, &ctx); err != nil {
		return &pb.EventResponse{Handled: false, Error: "parse payload: " + err.Error()}, nil
	}

	// Anonymous visitor → no script. This is the privacy gate; without
	// it, every public-page response would leak admin tooling source.
	if ctx.User == nil {
		return &pb.EventResponse{Handled: true, Result: nil}, nil
	}

	roleSlug, _ := ctx.User["role_slug"].(string)
	if roleSlug != "admin" {
		// v1: only admins. Future: check per-node-type write capability
		// via a host call so editors with nodes:page:write but no admin
		// role still get the overlay.
		return &pb.EventResponse{Handled: true, Result: nil}, nil
	}

	// Build the per-page bootstrap config. Embed as JSON inside a
	// <script type="application/json"> tag so the editor module reads
	// it without an extra fetch and without us templating user-supplied
	// values into JS where they'd need stricter escaping.
	cfg := map[string]any{
		"nodeId":       ctx.Node["id"],
		"nodeType":     ctx.Node["node_type"],
		"languageCode": ctx.Node["language_code"],
		"fullURL":      ctx.Node["full_url"],
	}
	cfgJSON, err := json.Marshal(cfg)
	if err != nil {
		return &pb.EventResponse{Handled: true, Error: "encode config: " + err.Error()}, nil
	}

	html := strings.Join([]string{
		`<script type="application/json" id="__squilla_vedit_config">`,
		string(cfgJSON),
		`</script>`,
		`<script type="module" src="/admin/api/ext/visual-editor/static/editor.js" defer></script>`,
	}, "")

	return &pb.EventResponse{Handled: true, Result: []byte(html)}, nil
}

func (p *VisualEditorPlugin) Shutdown() error { return nil }

func (p *VisualEditorPlugin) Initialize(hostConn *grpc.ClientConn) error {
	p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	return nil
}

// HandleHTTPRequest serves the embedded editor bundle. The kernel's
// extension proxy exposes us at /admin/api/ext/visual-editor/* and
// already enforces session auth — anonymous requests never reach this
// handler.
//
// Routes:
//
//	GET /static/<path>   →  embedded asset (editor.js, editor.css, …)
//	*                    →  404
func (p *VisualEditorPlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	method := strings.ToUpper(req.GetMethod())
	reqPath := req.GetPath()

	if method != "GET" && method != "HEAD" {
		return notFound(), nil
	}

	// The proxy strips /admin/api/ext/visual-editor and forwards the
	// remainder. We accept either "/static/foo" or "static/foo" to be
	// robust to leading-slash differences across kernel versions.
	trimmed := strings.TrimPrefix(reqPath, "/")
	if !strings.HasPrefix(trimmed, "static/") {
		return notFound(), nil
	}
	rel := strings.TrimPrefix(trimmed, "static/")

	// Reject any path traversal early. embed.FS resolves through the
	// filesystem-style API and would refuse "..", but we don't want
	// the request to even reach FS.ReadFile if the path is fishy.
	if rel == "" || strings.Contains(rel, "..") || strings.ContainsRune(rel, '\x00') {
		return notFound(), nil
	}

	body, err := staticAssets.ReadFile("assets/" + rel)
	if err != nil {
		return notFound(), nil
	}

	return &pb.PluginHTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": contentType(rel),
			// Editor bundle is content-addressed by the build (dev iter
			// can use ?v= cache-buster); 1 hour is a safe default.
			"Cache-Control": "public, max-age=3600",
		},
		Body: body,
	}, nil
}

func notFound() *pb.PluginHTTPResponse {
	return &pb.PluginHTTPResponse{
		StatusCode: 404,
		Headers:    map[string]string{"Content-Type": "text/plain; charset=utf-8"},
		Body:       []byte("not found"),
	}
}

// contentType returns a content-type for the given asset path. We only
// ship JS / CSS / map files in v1; images would land in the theme or
// media-manager.
func contentType(rel string) string {
	switch strings.ToLower(path.Ext(rel)) {
	case ".js", ".mjs":
		return "application/javascript; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".map", ".json":
		return "application/json; charset=utf-8"
	case ".svg":
		return "image/svg+xml"
	case ".woff2":
		return "font/woff2"
	default:
		return "application/octet-stream"
	}
}

func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		VersionedPlugins: map[int]goplugin.PluginSet{
			2: {"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &VisualEditorPlugin{}}},
		},
		GRPCServer: vibeplugin.NewGRPCServer,
	})
}
