package cms

import (
	"testing"
	"time"

	"squilla/internal/models"
)

// TestBuildHookUserPayload_AnonymousReturnsNil — render-hook subscribers
// distinguish admin from anonymous on `payload["user"] == nil`. The
// visual-editor extension's gate depends on this contract.
func TestBuildHookUserPayload_AnonymousReturnsNil(t *testing.T) {
	got := buildHookUserPayload(nil)
	if got != nil {
		t.Fatalf("expected nil payload for anonymous user, got %v", got)
	}
}

// TestBuildHookUserPayload_AuthenticatedShape — locks in the keys
// extensions rely on (id, email, role_slug). Adding fields is fine;
// renaming or dropping these is a breaking change for subscribers.
func TestBuildHookUserPayload_AuthenticatedShape(t *testing.T) {
	user := &models.User{
		ID:    42,
		Email: "admin@example.com",
		Role:  models.Role{ID: 1, Slug: "admin"},
	}

	got := buildHookUserPayload(user)
	if got == nil {
		t.Fatal("expected non-nil payload for authenticated user")
	}

	if id, ok := got["id"].(int); !ok || id != 42 {
		t.Errorf("payload[id] = %v, want 42", got["id"])
	}
	if email, ok := got["email"].(string); !ok || email != "admin@example.com" {
		t.Errorf("payload[email] = %v, want admin@example.com", got["email"])
	}
	if slug, ok := got["role_slug"].(string); !ok || slug != "admin" {
		t.Errorf("payload[role_slug] = %v, want admin", got["role_slug"])
	}
}

// TestBuildHookUserPayload_RoleNotPreloaded — when a caller forgets to
// preload the Role association, role_slug should be empty (not panic).
// Subscribers gating on role_slug == "admin" simply see false.
func TestBuildHookUserPayload_RoleNotPreloaded(t *testing.T) {
	user := &models.User{ID: 1, Email: "u@example.com"}
	got := buildHookUserPayload(user)
	if got == nil {
		t.Fatal("expected non-nil payload")
	}
	if slug, _ := got["role_slug"].(string); slug != "" {
		t.Errorf("payload[role_slug] = %q, want empty when Role unloaded", slug)
	}
}

// TestBuildHookNodePayload_GenericKeys — locks in the generic node keys
// added for render-hook subscribers (timestamps, blocks, layout, author).
func TestBuildHookNodePayload_GenericKeys(t *testing.T) {
	created := time.Date(2026, 1, 2, 3, 4, 5, 0, time.UTC)
	updated := time.Date(2026, 2, 3, 4, 5, 6, 0, time.UTC)
	published := time.Date(2026, 3, 4, 5, 6, 7, 0, time.UTC)
	layout := "landing"
	fullName := "Jane Doe"

	node := &models.ContentNode{
		ID:          7,
		Title:       "Hello",
		Slug:        "hello",
		FullURL:     "/hello",
		NodeType:    "page",
		CreatedAt:   created,
		UpdatedAt:   updated,
		PublishedAt: &published,
		LayoutSlug:  &layout,
		BlocksData:  models.JSONB(`[{"type":"hero","fields":{"title":"Hi"}}]`),
		Author:      &models.User{ID: 3, Email: "jane@example.com", FullName: &fullName},
	}

	got := buildHookNodePayload(node, NodeData{})

	if got["created_at"] != "2026-01-02T03:04:05Z" {
		t.Errorf("created_at = %v", got["created_at"])
	}
	if got["updated_at"] != "2026-02-03T04:05:06Z" {
		t.Errorf("updated_at = %v", got["updated_at"])
	}
	if got["published_at"] != "2026-03-04T05:06:07Z" {
		t.Errorf("published_at = %v", got["published_at"])
	}
	if got["layout"] != "landing" {
		t.Errorf("layout = %v, want landing", got["layout"])
	}
	blocks, ok := got["blocks"].([]map[string]interface{})
	if !ok || len(blocks) != 1 || blocks[0]["type"] != "hero" {
		t.Errorf("blocks = %#v, want one hero block", got["blocks"])
	}
	author, ok := got["author"].(map[string]any)
	if !ok || author["name"] != "Jane Doe" {
		t.Errorf("author = %#v, want {name: Jane Doe}", got["author"])
	}
	if _, has := author["email"]; has {
		t.Error("author must not include email")
	}
}

// TestBuildHookNodePayload_OptionalKeysAbsent — unpublished nodes with no
// layout or loaded author omit those keys; blocks is always an array.
func TestBuildHookNodePayload_OptionalKeysAbsent(t *testing.T) {
	node := &models.ContentNode{ID: 1, Title: "Draft", BlocksData: models.JSONB(`[]`)}

	got := buildHookNodePayload(node, NodeData{})

	if v, has := got["published_at"]; has && v != nil {
		t.Errorf("published_at = %v, want absent/nil when PublishedAt is nil", v)
	}
	if _, has := got["layout"]; has {
		t.Error("layout should be omitted when LayoutSlug is nil")
	}
	if _, has := got["author"]; has {
		t.Error("author should be omitted when Author is not loaded")
	}
	if blocks, ok := got["blocks"].([]map[string]interface{}); !ok || blocks == nil {
		t.Errorf("blocks = %#v, want non-nil empty slice", got["blocks"])
	}
}
