package rbac

import (
	"sync"
	"testing"
	"time"

	"vibecms/internal/events"
)

// TestPublish_EmitsRoleLifecycleEvents covers the contract the SDUI broadcaster
// relies on: every role mutation publishes "role.<op>" with at least an "id"
// field so it gets fanned out as ENTITY_CHANGED { entity: "role", id }.
//
// Without this, the admin shell never invalidates its boot manifest when a
// capability is edited and the sidebar appears stale.
func TestPublish_EmitsRoleLifecycleEvents(t *testing.T) {
	tests := []struct {
		name   string
		action string
	}{
		{"created", "role.created"},
		{"updated", "role.updated"},
		{"deleted", "role.deleted"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			bus := events.New()
			h := NewRoleHandler(nil, bus)

			var (
				mu         sync.Mutex
				gotAction  string
				gotPayload events.Payload
				received   = make(chan struct{})
			)
			bus.Subscribe(tc.action, func(action string, p events.Payload) {
				mu.Lock()
				gotAction = action
				gotPayload = p
				mu.Unlock()
				close(received)
			})

			h.publish(tc.action, 42, "editor")

			select {
			case <-received:
			case <-time.After(time.Second):
				t.Fatalf("expected %q event, got nothing", tc.action)
			}

			mu.Lock()
			defer mu.Unlock()
			if gotAction != tc.action {
				t.Errorf("action: got %q, want %q", gotAction, tc.action)
			}
			if gotPayload["id"] != 42 {
				t.Errorf("payload id: got %v, want 42", gotPayload["id"])
			}
			if gotPayload["role_id"] != 42 {
				t.Errorf("payload role_id: got %v, want 42", gotPayload["role_id"])
			}
			if gotPayload["slug"] != "editor" {
				t.Errorf("payload slug: got %v, want %q", gotPayload["slug"], "editor")
			}
		})
	}
}

// TestPublish_NoBus is a guard: handlers wired without an event bus (e.g. some
// test setups) must not panic. The role write itself is the source of truth;
// publishing is best-effort.
func TestPublish_NoBus(t *testing.T) {
	h := NewRoleHandler(nil, nil)
	// Should not panic.
	h.publish("role.updated", 1, "x")
}
