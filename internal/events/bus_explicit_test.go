package events

import (
	"sync/atomic"
	"testing"
)

func TestHasExplicitHandlers_IgnoresOtherFlavours(t *testing.T) {
	bus := New()
	bus.SubscribeAll(func(_ string, _ Payload) {})
	bus.SubscribeResult("http.requests", func(_ string, _ Payload) string { return "" })
	bus.SubscribeErr("http.requests", func(_ string, _ Payload) error { return nil })

	if bus.HasExplicitHandlers("http.requests") {
		t.Fatal("wildcard/result/err handlers must not count as explicit")
	}
	unsub := bus.Subscribe("http.requests", func(_ string, _ Payload) {})
	if !bus.HasExplicitHandlers("http.requests") {
		t.Fatal("expected explicit handler after Subscribe")
	}
	unsub()
	if bus.HasExplicitHandlers("http.requests") {
		t.Fatal("expected no explicit handler after unsubscribe")
	}
}

// TestPublishExplicitSync_SkipsWildcard proves the event never reaches
// SubscribeAll listeners and that explicit handlers run synchronously in
// registration order.
func TestPublishExplicitSync_SkipsWildcard(t *testing.T) {
	bus := New()
	var wildcard atomic.Int32
	bus.SubscribeAll(func(_ string, _ Payload) { wildcard.Add(1) })

	var order []int
	bus.Subscribe("http.requests", func(_ string, p Payload) { order = append(order, 1) })
	bus.Subscribe("http.requests", func(_ string, p Payload) { panic("boom") })
	bus.Subscribe("http.requests", func(_ string, p Payload) { order = append(order, 3) })
	bus.Subscribe("other", func(_ string, _ Payload) { order = append(order, 99) })

	bus.PublishExplicitSync("http.requests", Payload{"records": []any{}})

	// No goroutines are used, so the slice is complete on return.
	if len(order) != 2 || order[0] != 1 || order[1] != 3 {
		t.Fatalf("unexpected call order %v", order)
	}
	if wildcard.Load() != 0 {
		t.Fatalf("wildcard listener saw explicit-only event %d times", wildcard.Load())
	}
}
