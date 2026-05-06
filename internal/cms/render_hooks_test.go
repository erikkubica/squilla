package cms

import (
	"testing"

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
