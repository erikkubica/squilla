package sdui

import (
	"testing"
	"time"

	"vibecms/internal/events"
)

// drainOne waits for a single event from the broadcaster client channel,
// or fails the test after a short timeout. Used to make routing assertions
// deterministic without relying on time.Sleep.
func drainOne(t *testing.T, ch chan SSEEvent) SSEEvent {
	t.Helper()
	select {
	case ev := <-ch:
		return ev
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for SSE event")
		return SSEEvent{}
	}
}

// TestBroadcaster_RoutesRoleEventsAsEntityChanged proves that publishing
// "role.updated" on the bus produces an ENTITY_CHANGED SSE message with
// entity="role" and the id extracted from the payload — which is what the
// admin shell hooks into to invalidate its boot manifest.
func TestBroadcaster_RoutesRoleEventsAsEntityChanged(t *testing.T) {
	bus := events.New()
	b := NewBroadcaster(bus)

	ch := b.Subscribe()
	defer b.Unsubscribe(ch)

	bus.Publish("role.updated", events.Payload{"id": 7, "role_id": 7, "slug": "editor"})

	ev := drainOne(t, ch)
	if ev.Type != "ENTITY_CHANGED" {
		t.Errorf("type: got %q, want ENTITY_CHANGED", ev.Type)
	}
	if ev.Entity != "role" {
		t.Errorf("entity: got %q, want %q", ev.Entity, "role")
	}
	if ev.Op != "updated" {
		t.Errorf("op: got %q, want %q", ev.Op, "updated")
	}
	// extractID prefers "id" first; either field is acceptable to the consumer.
	if ev.ID != 7 {
		t.Errorf("id: got %v, want 7", ev.ID)
	}
}

// TestBroadcaster_RoutesRoleCreatedAndDeleted is a guard against accidentally
// regressing only the updated path — created and deleted must travel the same
// route so the boot invalidation fires in all three cases.
func TestBroadcaster_RoutesRoleCreatedAndDeleted(t *testing.T) {
	for _, action := range []string{"role.created", "role.deleted"} {
		t.Run(action, func(t *testing.T) {
			bus := events.New()
			b := NewBroadcaster(bus)
			ch := b.Subscribe()
			defer b.Unsubscribe(ch)

			bus.Publish(action, events.Payload{"id": 11})
			ev := drainOne(t, ch)
			if ev.Type != "ENTITY_CHANGED" || ev.Entity != "role" {
				t.Errorf("got %+v, want ENTITY_CHANGED entity=role", ev)
			}
		})
	}
}
