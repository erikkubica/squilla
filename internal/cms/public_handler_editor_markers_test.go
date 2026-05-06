package cms

import (
	"encoding/json"
	"strings"
	"testing"

	"squilla/internal/models"
)

// roleWithNodeAccess builds a Role whose capabilities give the given
// node type the given access level. Mirrors the JSONB shape that
// auth.GetNodeAccess parses.
func roleWithNodeAccess(slug, nodeType, access string) models.Role {
	caps := map[string]any{
		"nodes": map[string]any{
			nodeType: map[string]any{
				"access": access,
				"scope":  "all",
			},
		},
	}
	raw, _ := json.Marshal(caps)
	return models.Role{ID: 1, Slug: slug, Capabilities: models.JSONB(raw)}
}

func sampleBlocks() []map[string]interface{} {
	return []map[string]interface{}{
		{"type": "hero", "fields": map[string]any{"heading": "Hi"}},
		{"type": "text", "fields": map[string]any{"body": "Hello"}},
	}
}

func sampleRendered() []string {
	return []string{
		`<section class="hero">Hi</section>`,
		`<p>Hello</p>`,
	}
}

// TestWrapBlocksWithEditorMarkers_AnonymousReturnsUnchanged — the
// strongest privacy guarantee in this layer: anonymous visitors must
// never see editor markers, otherwise admin presence leaks via page
// source.
func TestWrapBlocksWithEditorMarkers_AnonymousReturnsUnchanged(t *testing.T) {
	rendered := sampleRendered()
	got := wrapBlocksWithEditorMarkers(rendered, sampleBlocks(), nil, "page")
	for i, html := range got {
		if html != rendered[i] {
			t.Errorf("anonymous render[%d] mutated: got %q, want %q", i, html, rendered[i])
		}
	}
}

// TestWrapBlocksWithEditorMarkers_ReadOnlyUserUnchanged — a user with
// only read access must not get markers. Markers signal "I can edit",
// and emitting them for read-only users would be confusing at best
// (UI would offer edit affordances) and a permission leak at worst.
func TestWrapBlocksWithEditorMarkers_ReadOnlyUserUnchanged(t *testing.T) {
	rendered := sampleRendered()
	user := &models.User{ID: 5, Email: "viewer@x", Role: roleWithNodeAccess("viewer", "page", "read")}
	got := wrapBlocksWithEditorMarkers(rendered, sampleBlocks(), user, "page")
	for i, html := range got {
		if strings.Contains(html, "squilla:block:") {
			t.Errorf("read-only user got markers in render[%d]: %q", i, html)
		}
	}
}

// TestWrapBlocksWithEditorMarkers_WriteUserGetsMarkers — happy path:
// admin / editor with write access on this node type sees a start +
// end marker around each block, with the slug embedded.
func TestWrapBlocksWithEditorMarkers_WriteUserGetsMarkers(t *testing.T) {
	rendered := sampleRendered()
	user := &models.User{ID: 1, Email: "admin@x", Role: roleWithNodeAccess("admin", "page", "write")}
	got := wrapBlocksWithEditorMarkers(rendered, sampleBlocks(), user, "page")
	if len(got) != 2 {
		t.Fatalf("expected 2 wrapped blocks, got %d", len(got))
	}

	wants := []struct{ start, end, body string }{
		{"<!--squilla:block:start:0:hero-->", "<!--squilla:block:end:0-->", `<section class="hero">Hi</section>`},
		{"<!--squilla:block:start:1:text-->", "<!--squilla:block:end:1-->", `<p>Hello</p>`},
	}
	for i, w := range wants {
		if !strings.HasPrefix(got[i], w.start) {
			t.Errorf("render[%d] missing start marker %q: %q", i, w.start, got[i])
		}
		if !strings.HasSuffix(got[i], w.end) {
			t.Errorf("render[%d] missing end marker %q: %q", i, w.end, got[i])
		}
		if !strings.Contains(got[i], w.body) {
			t.Errorf("render[%d] body %q lost: %q", i, w.body, got[i])
		}
	}
}

// TestWrapBlocksWithEditorMarkers_NodeTypeScopedAccess — write access
// on one node type doesn't grant markers on another. A user who can
// edit "post" but only read "page" must see no markers on a page.
func TestWrapBlocksWithEditorMarkers_NodeTypeScopedAccess(t *testing.T) {
	rendered := sampleRendered()
	user := &models.User{ID: 7, Email: "editor@x", Role: roleWithNodeAccess("editor", "post", "write")}
	got := wrapBlocksWithEditorMarkers(rendered, sampleBlocks(), user, "page")
	for i, html := range got {
		if strings.Contains(html, "squilla:block:") {
			t.Errorf("user with write only on 'post' got markers on 'page' render[%d]: %q", i, html)
		}
	}
}

// TestWrapBlocksWithEditorMarkers_MaliciousSlugEscaped — block_types.slug
// is operator-supplied. A malicious slug like `x-->evil<!--` must not
// break out of the comment context, even though markers are admin-only.
func TestWrapBlocksWithEditorMarkers_MaliciousSlugEscaped(t *testing.T) {
	blocks := []map[string]interface{}{
		{"type": "x-->evil<!--", "fields": map[string]any{}},
	}
	rendered := []string{`<div>ok</div>`}
	user := &models.User{ID: 1, Email: "a@x", Role: roleWithNodeAccess("admin", "page", "write")}
	got := wrapBlocksWithEditorMarkers(rendered, blocks, user, "page")
	if len(got) != 1 {
		t.Fatalf("expected 1 wrapped block")
	}
	if strings.Contains(got[0], "-->evil<!--") {
		t.Errorf("malicious slug not escaped: %q", got[0])
	}
}

// TestWrapBlocksWithEditorMarkers_LengthMismatchSkipsWrap — defensive:
// if rendered/blocks slice lengths drift (future refactor regression),
// emit no markers rather than mis-paired ones.
func TestWrapBlocksWithEditorMarkers_LengthMismatchSkipsWrap(t *testing.T) {
	user := &models.User{ID: 1, Email: "a@x", Role: roleWithNodeAccess("admin", "page", "write")}
	rendered := []string{"<a/>"}
	blocks := []map[string]interface{}{
		{"type": "hero"},
		{"type": "text"},
	}
	got := wrapBlocksWithEditorMarkers(rendered, blocks, user, "page")
	if got[0] != "<a/>" {
		t.Errorf("expected unchanged render on length mismatch, got %q", got[0])
	}
}
