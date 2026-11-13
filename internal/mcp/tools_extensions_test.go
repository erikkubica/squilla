package mcp

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"squilla/internal/cms"
	"squilla/internal/events"
	"squilla/internal/models"
	pb "squilla/pkg/plugin/proto"
)

// extHarness is a server with one user per role and a recording plugin.
type extHarness struct {
	s       *Server
	calls   []*pb.PluginHTTPRequest
	respond func(*pb.PluginHTTPRequest) *pb.PluginHTTPResponse
	admin   *models.McpToken // role holds view_stats + manage_stats
	viewer  *models.McpToken // role holds view_stats only
	nobody  *models.McpToken // role holds neither
}

func newExtHarness(t *testing.T) *extHarness {
	t.Helper()
	s, db := newTestServer(t, &fakeAPI{})
	if err := db.AutoMigrate(&models.Role{}, &models.User{}); err != nil {
		t.Fatal(err)
	}
	h := &extHarness{s: s}
	mk := func(id int, caps string, scope string) *models.McpToken {
		role := models.Role{ID: id, Slug: "r" + string(rune('0'+id)), Name: "r", Capabilities: models.JSONB(caps)}
		if err := db.Create(&role).Error; err != nil {
			t.Fatal(err)
		}
		user := models.User{ID: id, Email: "u" + string(rune('0'+id)) + "@example.test", RoleID: id}
		if err := db.Create(&user).Error; err != nil {
			t.Fatal(err)
		}
		return &models.McpToken{ID: id, UserID: id, Scope: scope}
	}
	h.admin = mk(1, `{"admin_access":true,"view_stats":true,"manage_stats":true}`, ScopeFull)
	h.viewer = mk(2, `{"admin_access":true,"view_stats":true}`, ScopeFull)
	h.nobody = mk(3, `{"admin_access":true}`, ScopeRead)

	reg := cms.NewAdminRouteRegistry()
	reg.Set("stats", cms.CompileAdminRoutes([]cms.AdminRouteEntry{
		{Method: "GET", Path: "/**", RequiredCapability: "view_stats"},
		{Method: "*", Path: "/**", RequiredCapability: "manage_stats"},
	}))
	s.SetAdminRoutes(reg)
	s.extCall = func(_ context.Context, slug string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
		if slug != "stats" {
			return nil, errExtensionNotRunning
		}
		h.calls = append(h.calls, req)
		if h.respond != nil {
			return h.respond(req), nil
		}
		return &pb.PluginHTTPResponse{StatusCode: 200, Body: []byte(`{"ok":1}`)}, nil
	}
	return h
}

func statsTools() []cms.McpToolEntry {
	return []cms.McpToolEntry{
		{Name: "summary", Description: "Totals.", Method: "GET", Path: "/summary"},
		{Name: "goals.update", Description: "Edit a goal.", Method: "PUT", Path: "/goals/{id}"},
		{Name: "goals.delete", Description: "Delete a goal.", Method: "DELETE", Path: "/goals/{id}", Class: "full"},
	}
}

func (h *extHarness) last(t *testing.T) *pb.PluginHTTPRequest {
	t.Helper()
	if len(h.calls) == 0 {
		t.Fatal("plugin was not called")
	}
	return h.calls[len(h.calls)-1]
}

func TestExtensionTools_RegisterCallAndDrop(t *testing.T) {
	h := newExtHarness(t)
	if w := h.s.RegisterExtensionTools("stats", statsTools()); len(w) != 0 {
		t.Fatalf("warnings: %v", w)
	}

	// GET: arguments become query parameters, JSON passes through.
	text, isErr := callTool(t, h.s, h.admin, "ext.stats.summary", map[string]any{"from": "2026-11-01", "limit": 5, "f.page": "/x", "skip": nil})
	if isErr || text != `{"ok":1}` {
		t.Fatalf("summary = %q err=%v", text, isErr)
	}
	req := h.last(t)
	if req.Method != "GET" || req.Path != "/summary" || req.UserId != 1 || req.Headers["X-User-Email"] != "u1@example.test" {
		t.Fatalf("request = %+v", req)
	}
	if q := req.QueryParams; q["from"] != "2026-11-01" || q["limit"] != "5" || q["f.page"] != "/x" || len(q) != 3 {
		t.Fatalf("query = %v", q)
	}

	// PUT: {id} fills the path, the rest is the JSON body.
	if _, isErr := callTool(t, h.s, h.admin, "ext.stats.goals.update", map[string]any{"id": 7, "name": "Lead"}); isErr {
		t.Fatal("update failed")
	}
	req = h.last(t)
	if req.Method != "PUT" || req.Path != "/goals/7" || string(req.Body) != `{"name":"Lead"}` || req.Headers["Content-Type"] != "application/json" {
		t.Fatalf("request = %+v body=%s", req, req.Body)
	}

	// The guide's index groups them under ext.<slug>.
	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 3 {
		t.Fatalf("tools_by_domain[ext.stats] = %v", got)
	}

	h.s.DropExtensionTools("stats")
	out := rpc(t, h.s, h.admin, "tools/call", map[string]any{"name": "ext.stats.summary", "arguments": map[string]any{}})
	if out["error"] == nil {
		t.Fatalf("dropped tool still callable: %v", out)
	}
	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 0 {
		t.Fatalf("catalog still lists %v", got)
	}
	for _, e := range h.s.toolIndex() {
		if e.Name == "core.guide" {
			return
		}
	}
	t.Fatal("dropping extension tools removed core tools from the catalog")
}

func TestExtensionTools_Authorization(t *testing.T) {
	h := newExtHarness(t)
	h.s.RegisterExtensionTools("stats", statsTools())

	// Scope: a mutating tool defaults to class "full".
	content := &models.McpToken{ID: 8, UserID: 1, Scope: ScopeContent}
	if text, isErr := callTool(t, h.s, content, "ext.stats.goals.update", map[string]any{"id": 1}); !isErr || !strings.Contains(text, "scope_denied") {
		t.Fatalf("content token on a full tool: %q err=%v", text, isErr)
	}
	// Role: full scope, but the owner lacks manage_stats.
	if text, isErr := callTool(t, h.s, h.viewer, "ext.stats.goals.delete", map[string]any{"id": 1}); !isErr || !strings.Contains(text, "manage_stats") {
		t.Fatalf("viewer delete: %q err=%v", text, isErr)
	}
	// Role: a read token whose owner lacks view_stats gets nothing.
	if text, isErr := callTool(t, h.s, h.nobody, "ext.stats.summary", nil); !isErr || !strings.Contains(text, "view_stats") {
		t.Fatalf("nobody summary: %q err=%v", text, isErr)
	}
	if len(h.calls) != 0 {
		t.Fatalf("plugin reached despite denial: %d calls", len(h.calls))
	}
	// The viewer can read.
	if _, isErr := callTool(t, h.s, h.viewer, "ext.stats.summary", nil); isErr {
		t.Fatal("viewer summary denied")
	}
}

func TestExtensionTools_PathArgumentsCannotReroute(t *testing.T) {
	h := newExtHarness(t)
	h.s.RegisterExtensionTools("stats", statsTools())
	for _, id := range []any{"../settings", "1/../../settings", "a?x=1", "%2e%2e", "..", ".", "...", "", "1 ", "1\n", "1\x00", "a\\b", "1;x", "é", strings.Repeat("a", 129)} {
		if _, isErr := callTool(t, h.s, h.admin, "ext.stats.goals.delete", map[string]any{"id": id}); !isErr {
			t.Errorf("id %q accepted", id)
		}
	}
	if len(h.calls) != 0 {
		t.Fatalf("plugin reached with a bad path segment: %+v", h.calls[0])
	}
}

func TestExtensionTools_PluginErrorsAndText(t *testing.T) {
	h := newExtHarness(t)
	h.s.RegisterExtensionTools("stats", statsTools())
	h.respond = func(*pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
		return &pb.PluginHTTPResponse{StatusCode: 400, Body: []byte(`{"error":"INVALID_DATE","message":"from must be YYYY-MM-DD"}`)}
	}
	if text, isErr := callTool(t, h.s, h.admin, "ext.stats.summary", nil); !isErr || !strings.Contains(text, "INVALID_DATE") {
		t.Fatalf("400 = %q err=%v", text, isErr)
	}
	h.respond = func(*pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
		return &pb.PluginHTTPResponse{StatusCode: 200, Headers: map[string]string{"Content-Type": "text/csv"}, Body: []byte("a,b\n1,2\n")}
	}
	text, isErr := callTool(t, h.s, h.admin, "ext.stats.summary", nil)
	var got map[string]string
	if isErr || json.Unmarshal([]byte(text), &got) != nil || got["content_type"] != "text/csv" || got["body"] != "a,b\n1,2\n" {
		t.Fatalf("csv = %q err=%v", text, isErr)
	}
}

func TestExtensionTools_InvalidEntriesAreSkipped(t *testing.T) {
	h := newExtHarness(t)
	w := h.s.RegisterExtensionTools("stats", []cms.McpToolEntry{
		{Name: "ok", Description: "d", Path: "/ok"},
		{Name: "Bad Name", Description: "d", Path: "/x"},
		{Name: "nodesc", Path: "/x"},
		{Name: "relpath", Description: "d", Path: "x"},
		{Name: "dots", Description: "d", Path: "/a/../b"},
		{Name: "slash", Description: "d", Path: "/x/"},
		{Name: "double", Description: "d", Path: "/a//b"},
		{Name: "dotseg", Description: "d", Path: "/a/./b"},
		{Name: "escaped", Description: "d", Path: "/a%2fb"},
		{Name: "sneaky", Description: "d", Method: "POST", Path: "/x", Class: "read"},
		{Name: "schema", Description: "d", Path: "/x", InputSchema: json.RawMessage(`{"type":"array"}`)},
		{Name: "ok", Description: "dup", Path: "/ok2"},
	})
	if len(w) != 11 {
		t.Fatalf("warnings = %d: %v", len(w), w)
	}
	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 1 || got[0] != "ext.stats.ok" {
		t.Fatalf("registered = %v", got)
	}
	if w := h.s.RegisterExtensionTools("Bad/Slug", statsTools()); len(w) != 1 {
		t.Fatalf("bad slug warnings = %v", w)
	}
}

func TestExtensionTools_FollowActivationEvents(t *testing.T) {
	h := newExtHarness(t)
	bus := events.New()
	h.s.SubscribeExtensionTools(bus)
	active := true
	h.s.extManifest = func(slug string) ([]cms.McpToolEntry, bool) {
		if slug != "stats" || !active {
			return nil, false
		}
		return statsTools()[:1], true
	}

	bus.PublishSync("extension.activated", events.Payload{"slug": "stats"})
	if _, isErr := callTool(t, h.s, h.admin, "ext.stats.summary", map[string]any{"from": "2026-11-01"}); isErr {
		t.Fatal("tool not registered on activation")
	}
	// A deactivation event for an extension that is still active changes nothing.
	bus.PublishSync("extension.deactivated", events.Payload{"slug": "stats"})
	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 1 {
		t.Fatalf("forged deactivation dropped tools: %v", got)
	}
	active = false
	bus.PublishSync("extension.deactivated", events.Payload{"slug": "stats"})
	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 0 {
		t.Fatalf("tools survive deactivation: %v", got)
	}
}

// Any extension with events:emit can publish extension.activated. The
// payload must not be able to plant tools: not for an unknown slug, not
// under another extension's slug, and not from a manifest of its choosing.
func TestExtensionTools_ForgedActivationEventPlantsNothing(t *testing.T) {
	h := newExtHarness(t)
	bus := events.New()
	h.s.SubscribeExtensionTools(bus)
	h.s.extManifest = func(slug string) ([]cms.McpToolEntry, bool) {
		if slug == "stats" {
			return statsTools()[:1], true // the registry's manifest: summary only
		}
		return nil, false
	}

	dir := t.TempDir()
	evil := `{"slug":"stats","mcp_tools":[{"name":"leak","description":"x","class":"read","method":"GET","path":"/goals/1"}]}`
	if err := os.WriteFile(filepath.Join(dir, "extension.json"), []byte(evil), 0o644); err != nil {
		t.Fatal(err)
	}
	bus.PublishSync("extension.activated", events.Payload{"slug": "stats", "path": dir})
	bus.PublishSync("extension.activated", events.Payload{"slug": "ghost", "path": dir})

	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 1 || got[0] != "ext.stats.summary" {
		t.Fatalf("ext.stats tools = %v, want only the registered manifest's", got)
	}
	if got := h.s.toolsByDomain()["ext.ghost"]; len(got) != 0 {
		t.Fatalf("tools planted for an unregistered slug: %v", got)
	}
}

// Without a registry to consult, nothing is exposed.
func TestExtensionTools_NoRegistryFailsClosed(t *testing.T) {
	h := newExtHarness(t)
	bus := events.New()
	h.s.SubscribeExtensionTools(bus)
	bus.PublishSync("extension.activated", events.Payload{"slug": "stats", "path": t.TempDir()})
	if got := h.s.toolsByDomain()["ext.stats"]; len(got) != 0 {
		t.Fatalf("tools registered without a loader: %v", got)
	}
}

// Every bundled extension's mcp_tools must register cleanly.
func TestBundledExtensionManifests_McpToolsAreValid(t *testing.T) {
	manifests, _ := filepath.Glob("../../extensions/*/extension.json")
	if len(manifests) == 0 {
		t.Skip("no bundled extensions found")
	}
	declared := 0
	h := newExtHarness(t)
	for _, path := range manifests {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		var m cms.ExtensionManifest
		if err := json.Unmarshal(data, &m); err != nil {
			t.Fatalf("%s: %v", path, err)
		}
		if len(m.McpTools) == 0 {
			continue
		}
		declared += len(m.McpTools)
		if w := h.s.RegisterExtensionTools(m.Slug, m.McpTools); len(w) != 0 {
			t.Errorf("%s: %v", m.Slug, w)
		}
		if got := h.s.toolsByDomain()["ext."+m.Slug]; len(got) != len(m.McpTools) {
			t.Errorf("%s: %d of %d tools registered", m.Slug, len(got), len(m.McpTools))
		}
		// Every {placeholder} must be a declared, required argument.
		for _, d := range m.McpTools {
			var schema struct {
				Properties map[string]any `json:"properties"`
				Required   []string       `json:"required"`
			}
			_ = json.Unmarshal(d.InputSchema, &schema)
			for _, ph := range reExtToolParam.FindAllStringSubmatch(d.Path, -1) {
				if _, ok := schema.Properties[ph[1]]; !ok || !strings.Contains(","+strings.Join(schema.Required, ",")+",", ","+ph[1]+",") {
					t.Errorf("%s.%s: path placeholder {%s} is not a required property", m.Slug, d.Name, ph[1])
				}
			}
		}
	}
	if declared == 0 {
		t.Error("no bundled extension declares mcp_tools")
	}
}
