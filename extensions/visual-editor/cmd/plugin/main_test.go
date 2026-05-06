package main

import (
	"encoding/json"
	"strings"
	"testing"

	pb "squilla/pkg/plugin/proto"
)

// TestHandleRenderBodyEnd_AnonymousNoScript — the most important
// guarantee: when the kernel reports user=null, this extension must
// return an empty body. Otherwise every public-page response would
// leak the editor bootstrap to anonymous visitors.
func TestHandleRenderBodyEnd_AnonymousNoScript(t *testing.T) {
	p := &VisualEditorPlugin{}
	payload, _ := json.Marshal(map[string]any{
		"node": map[string]any{"id": 1, "node_type": "page"},
		"user": nil,
	})
	resp, err := p.handleRenderBodyEnd(payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Handled {
		t.Errorf("expected Handled=true, got false")
	}
	if len(resp.Result) != 0 {
		t.Errorf("expected empty result for anonymous, got %q", resp.Result)
	}
}

// TestHandleRenderBodyEnd_NonAdminUserNoScript — a logged-in user with
// a non-admin role (e.g. "viewer") still must not get the editor.
func TestHandleRenderBodyEnd_NonAdminUserNoScript(t *testing.T) {
	p := &VisualEditorPlugin{}
	payload, _ := json.Marshal(map[string]any{
		"node": map[string]any{"id": 1, "node_type": "page"},
		"user": map[string]any{"id": 5, "email": "v@x", "role_slug": "viewer"},
	})
	resp, err := p.handleRenderBodyEnd(payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.Result) != 0 {
		t.Errorf("expected empty result for viewer, got %q", resp.Result)
	}
}

// TestHandleRenderBodyEnd_AdminGetsBootstrap — happy path: admin user
// receives a config script + module script tag. The config must include
// the node id so the editor knows which node it's editing without an
// extra HTTP round-trip.
func TestHandleRenderBodyEnd_AdminGetsBootstrap(t *testing.T) {
	p := &VisualEditorPlugin{}
	payload, _ := json.Marshal(map[string]any{
		"node": map[string]any{
			"id":            42,
			"node_type":     "page",
			"language_code": "en",
			"full_url":      "/about",
		},
		"user": map[string]any{"id": 1, "email": "a@x", "role_slug": "admin"},
	})
	resp, err := p.handleRenderBodyEnd(payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	got := string(resp.Result)
	if !strings.Contains(got, `id="__squilla_vedit_config"`) {
		t.Errorf("missing config script: %q", got)
	}
	if !strings.Contains(got, `"nodeId":42`) {
		t.Errorf("config does not embed node id: %q", got)
	}
	if !strings.Contains(got, `src="/admin/api/ext/visual-editor/static/editor.js"`) {
		t.Errorf("missing module script tag: %q", got)
	}
}

// TestHandleRenderBodyEnd_EmptyPayloadHandledFalse — defensive: if the
// kernel ever invokes the handler with a zero-length payload, we report
// Handled=false rather than emitting tags blindly.
func TestHandleRenderBodyEnd_EmptyPayloadHandledFalse(t *testing.T) {
	p := &VisualEditorPlugin{}
	resp, err := p.handleRenderBodyEnd(nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Handled {
		t.Errorf("expected Handled=false for empty payload")
	}
}

// TestHandleHTTPRequest_StaticAssetServed — the embedded editor.js
// stub must round-trip through HandleHTTPRequest at GET
// /static/editor.js. Cache-control is informational; content-type is
// correctness-critical (so browsers execute the module).
func TestHandleHTTPRequest_StaticAssetServed(t *testing.T) {
	p := &VisualEditorPlugin{}
	req := &pb.PluginHTTPRequest{Method: "GET", Path: "/static/editor.js"}
	resp, err := p.HandleHTTPRequest(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("status=%d, want 200", resp.StatusCode)
	}
	if !strings.HasPrefix(resp.Headers["Content-Type"], "application/javascript") {
		t.Errorf("Content-Type=%q, want application/javascript prefix", resp.Headers["Content-Type"])
	}
	if len(resp.Body) == 0 {
		t.Errorf("body empty, expected editor.js content")
	}
}

// TestHandleHTTPRequest_PathTraversalRejected — even though embed.FS
// doesn't traverse, reject ".." paths early so a confused proxy can't
// read sibling files. The handler should treat any traversal as 404.
func TestHandleHTTPRequest_PathTraversalRejected(t *testing.T) {
	p := &VisualEditorPlugin{}
	for _, bad := range []string{"/static/../main.go", "/static/../../etc/passwd", "/static/x\x00.js"} {
		req := &pb.PluginHTTPRequest{Method: "GET", Path: bad}
		resp, _ := p.HandleHTTPRequest(req)
		if resp.StatusCode != 404 {
			t.Errorf("path %q should 404, got %d", bad, resp.StatusCode)
		}
	}
}

// TestHandleHTTPRequest_NonGet404 — only GET/HEAD are allowed; the
// editor never POSTs to its own static path.
func TestHandleHTTPRequest_NonGet404(t *testing.T) {
	p := &VisualEditorPlugin{}
	req := &pb.PluginHTTPRequest{Method: "POST", Path: "/static/editor.js"}
	resp, _ := p.HandleHTTPRequest(req)
	if resp.StatusCode != 404 {
		t.Errorf("POST to static should 404, got %d", resp.StatusCode)
	}
}
