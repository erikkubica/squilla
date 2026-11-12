package sdui

import (
	"net/http/httptest"
	"testing"
	"time"

	"squilla/internal/events"

	"github.com/gofiber/fiber/v2"
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

// expectNone asserts nothing arrives on ch within a short window.
func expectNone(t *testing.T, ch chan SSEEvent) {
	t.Helper()
	select {
	case ev := <-ch:
		t.Fatalf("expected no SSE event, got %+v", ev)
	case <-time.After(150 * time.Millisecond):
	}
}

// TestBroadcaster_DropsPasswordResetEvents is the regression test for the
// reset-token leak: any admin_access holder can open the stream, so the
// reset event (which carries reset_url / reset_token for the email
// extension) must never reach it, in any shape.
func TestBroadcaster_DropsPasswordResetEvents(t *testing.T) {
	bus := events.New()
	b := NewBroadcaster(bus)
	ch := b.Subscribe()
	defer b.Unsubscribe(ch)

	bus.PublishSync("user.password_reset_requested", events.Payload{
		"user_id": 1, "reset_url": "https://x/reset?token=abc", "reset_token": "abc",
	})
	expectNone(t, ch)

	// Same data republished under another name is still dropped.
	bus.PublishSync("custom.mailed", events.Payload{"id": 1, "reset_token": "abc"})
	expectNone(t, ch)
}

// TestBroadcaster_NoPayloadForwarded asserts the invalidation events carry
// only routing fields, never the publisher's payload.
func TestBroadcaster_NoPayloadForwarded(t *testing.T) {
	cases := []struct {
		action  string
		payload events.Payload
		want    string
	}{
		{"node.updated", events.Payload{"id": 3, "title": "secret draft", "author_email": "a@b.c"}, "ENTITY_CHANGED"},
		{"setting.updated", events.Payload{"key": "smtp_password", "value": "hunter2"}, "SETTING_CHANGED"},
		{"extension.activated", events.Payload{"slug": "x", "manifest": "{}"}, "NAV_STALE"},
	}
	for _, tc := range cases {
		t.Run(tc.action, func(t *testing.T) {
			bus := events.New()
			b := NewBroadcaster(bus)
			ch := b.Subscribe()
			defer b.Unsubscribe(ch)

			bus.PublishSync(tc.action, tc.payload)
			ev := drainOne(t, ch)
			if ev.Type != tc.want {
				t.Fatalf("type = %q, want %q", ev.Type, tc.want)
			}
			if ev.Data != nil {
				t.Fatalf("Data must be empty, got %#v", ev.Data)
			}
			if tc.want == "SETTING_CHANGED" && ev.Key != "smtp_password" {
				t.Fatalf("key = %q", ev.Key)
			}
		})
	}
}

func TestBroadcaster_IDMustBeScalar(t *testing.T) {
	bus := events.New()
	b := NewBroadcaster(bus)
	ch := b.Subscribe()
	defer b.Unsubscribe(ch)
	bus.PublishSync("thing.updated", events.Payload{"id": map[string]any{"secret": "x"}})
	if ev := drainOne(t, ch); ev.ID != nil {
		t.Fatalf("non-scalar id forwarded: %#v", ev.ID)
	}
}

func TestBroadcaster_PerUserStreamCap(t *testing.T) {
	b := NewBroadcaster(events.New())
	for i := 0; i < maxStreamsPerUser; i++ {
		if !b.acquireUserSlot(5) {
			t.Fatalf("slot %d refused", i)
		}
	}
	if b.acquireUserSlot(5) {
		t.Fatal("slot over cap granted")
	}
	if !b.acquireUserSlot(6) {
		t.Fatal("other user must not be affected")
	}
	b.releaseUserSlot(5)
	if !b.acquireUserSlot(5) {
		t.Fatal("released slot not reusable")
	}
}

func TestBroadcaster_CloseRejectsNewStreams(t *testing.T) {
	b := NewBroadcaster(events.New())
	b.Close()
	b.Close() // idempotent
	app := fiber.New()
	app.Get("/events", b.Handler())
	resp, err := app.Test(httptest.NewRequest("GET", "/events", nil))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != fiber.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 after Close", resp.StatusCode)
	}
}
