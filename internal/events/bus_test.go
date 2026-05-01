package events

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestPublish_FanOut(t *testing.T) {
	bus := New()
	var aHits atomic.Int32
	var bHits atomic.Int32

	bus.Subscribe("user.created", func(_ string, _ Payload) { aHits.Add(1) })
	bus.Subscribe("user.created", func(_ string, _ Payload) { bHits.Add(1) })

	bus.Publish("user.created", Payload{"id": 1})

	// Publish runs handlers in goroutines; wait briefly for them.
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if aHits.Load() == 1 && bHits.Load() == 1 {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatalf("expected both handlers to fire; got a=%d b=%d", aHits.Load(), bHits.Load())
}

func TestPublishSync_BlocksUntilDone(t *testing.T) {
	bus := New()
	completed := make(chan struct{})

	bus.Subscribe("slow.op", func(_ string, _ Payload) {
		time.Sleep(20 * time.Millisecond)
		close(completed)
	})

	start := time.Now()
	bus.PublishSync("slow.op", nil)
	elapsed := time.Since(start)

	if elapsed < 20*time.Millisecond {
		t.Fatalf("PublishSync returned before handler completed (%v)", elapsed)
	}
	select {
	case <-completed:
	default:
		t.Fatal("handler did not complete before PublishSync returned")
	}
}

func TestPublishCollect_OrderedNonEmpty(t *testing.T) {
	bus := New()
	bus.SubscribeResult("render", func(_ string, _ Payload) string { return "first" })
	bus.SubscribeResult("render", func(_ string, _ Payload) string { return "" }) // empty result is dropped
	bus.SubscribeResult("render", func(_ string, _ Payload) string { return "third" })

	results := bus.PublishCollect("render", nil)
	if len(results) != 2 {
		t.Fatalf("expected 2 non-empty results, got %d (%v)", len(results), results)
	}
	if results[0] != "first" || results[1] != "third" {
		t.Fatalf("expected [first, third], got %v", results)
	}
}

func TestPanicInHandler_DoesNotKillBus(t *testing.T) {
	bus := New()
	var safeFired atomic.Int32

	bus.Subscribe("danger", func(_ string, _ Payload) { panic("boom") })
	bus.Subscribe("danger", func(_ string, _ Payload) { safeFired.Add(1) })

	bus.Publish("danger", nil)

	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if safeFired.Load() == 1 {
			break
		}
		time.Sleep(time.Millisecond)
	}
	// And a subsequent publish should still work — bus must be alive.
	bus.Publish("danger", nil)
	deadline = time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if safeFired.Load() == 2 {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatalf("safe handler did not fire twice after panic; got %d", safeFired.Load())
}

func TestUnsubscribe_DropsHandler(t *testing.T) {
	bus := New()
	var hits atomic.Int32
	unsub := bus.Subscribe("ping", func(_ string, _ Payload) { hits.Add(1) })

	bus.PublishSync("ping", nil)
	if got := hits.Load(); got != 1 {
		t.Fatalf("expected 1 hit before unsubscribe, got %d", got)
	}
	unsub()
	bus.PublishSync("ping", nil)
	if got := hits.Load(); got != 1 {
		t.Fatalf("expected handler to be dropped, got %d hits", got)
	}
	// Calling unsub twice must be safe.
	unsub()
}

func TestSubscribeAll_Unsubscribe(t *testing.T) {
	bus := New()
	var seen atomic.Int32
	unsub := bus.SubscribeAll(func(_ string, _ Payload) { seen.Add(1) })

	bus.PublishSync("a", nil)
	bus.PublishSync("b", nil)
	if seen.Load() != 2 {
		t.Fatalf("expected 2 hits across both events, got %d", seen.Load())
	}
	unsub()
	bus.PublishSync("c", nil)
	if seen.Load() != 2 {
		t.Fatalf("SubscribeAll handler still firing after unsubscribe (got %d)", seen.Load())
	}
}

func TestSubscribeResult_Unsubscribe(t *testing.T) {
	bus := New()
	unsub := bus.SubscribeResult("render", func(_ string, _ Payload) string { return "x" })

	if got := bus.PublishCollect("render", nil); len(got) != 1 {
		t.Fatalf("expected 1 result before unsubscribe, got %v", got)
	}
	unsub()
	if got := bus.PublishCollect("render", nil); len(got) != 0 {
		t.Fatalf("expected 0 results after unsubscribe, got %v", got)
	}
}

// TestConcurrent_SubscribeAndPublish runs Subscribes and Publishes from
// many goroutines under -race. Without proper locking inside the bus,
// the race detector flags the underlying slice mutations. Run with
// `go test -race ./internal/events/...` to exercise the assertion.
func TestConcurrent_SubscribeAndPublish(t *testing.T) {
	bus := New()
	const N = 100
	var wg sync.WaitGroup
	wg.Add(N * 2)
	for i := 0; i < N; i++ {
		go func() {
			defer wg.Done()
			bus.Subscribe("concurrent", func(_ string, _ Payload) {})
		}()
		go func() {
			defer wg.Done()
			bus.Publish("concurrent", nil)
		}()
	}
	wg.Wait()
	// We don't assert on hit counts — the test exists to prove the race
	// detector stays clean.
}

func TestHasHandlers(t *testing.T) {
	bus := New()
	if bus.HasHandlers("nope") {
		t.Fatal("expected no handlers for unknown action")
	}
	unsub := bus.Subscribe("known", func(_ string, _ Payload) {})
	if !bus.HasHandlers("known") {
		t.Fatal("expected handler after Subscribe")
	}
	unsub()
	if bus.HasHandlers("known") {
		t.Fatal("expected no handlers after Unsubscribe")
	}

	// SubscribeErr must register as a handler too — CoreAPI.SendEmail uses
	// HasHandlers to decide whether to short-circuit with "no provider".
	unsub = bus.SubscribeErr("email.send", func(_ string, _ Payload) error { return nil })
	if !bus.HasHandlers("email.send") {
		t.Fatal("expected SubscribeErr to register as a handler")
	}
	unsub()
	if bus.HasHandlers("email.send") {
		t.Fatal("expected SubscribeErr handler to drop on unsubscribe")
	}

	// SubscribeResult should also count.
	unsub = bus.SubscribeResult("forms:render", func(_ string, _ Payload) string { return "" })
	if !bus.HasHandlers("forms:render") {
		t.Fatal("expected SubscribeResult to register as a handler")
	}
	unsub()
}

func TestPublishRequest_ReturnsFirstError(t *testing.T) {
	bus := New()
	first := errors.New("first failure")
	called := atomic.Int32{}

	bus.SubscribeErr("email.send", func(_ string, _ Payload) error {
		called.Add(1)
		return first
	})
	// Second handler must NOT run once the first errors — callers expect
	// short-circuit semantics (the first provider's failure is the result;
	// fanning out to a backup provider is the extension's job, not the bus's).
	bus.SubscribeErr("email.send", func(_ string, _ Payload) error {
		called.Add(1)
		return errors.New("second failure")
	})

	err := bus.PublishRequest("email.send", Payload{"to": "alice@example.com"})
	if !errors.Is(err, first) {
		t.Fatalf("expected first error, got %v", err)
	}
	if got := called.Load(); got != 1 {
		t.Fatalf("expected short-circuit after first failure; got %d calls", got)
	}
}

func TestPublishRequest_NilOnAllSuccess(t *testing.T) {
	bus := New()
	bus.SubscribeErr("ok", func(_ string, _ Payload) error { return nil })
	bus.SubscribeErr("ok", func(_ string, _ Payload) error { return nil })

	if err := bus.PublishRequest("ok", nil); err != nil {
		t.Fatalf("expected nil, got %v", err)
	}
}

func TestPublishRequest_NilWhenNoHandler(t *testing.T) {
	bus := New()
	// No handler registered. Returning nil here is intentional — callers
	// that need to distinguish "no provider" from "succeeded" are required
	// to consult HasHandlers first (see CoreAPI.SendEmail).
	if err := bus.PublishRequest("nobody.listening", nil); err != nil {
		t.Fatalf("expected nil when no handler registered, got %v", err)
	}
}

func TestPublishRequest_PanicBecomesError(t *testing.T) {
	bus := New()
	bus.SubscribeErr("crashy", func(_ string, _ Payload) error { panic("boom") })

	err := bus.PublishRequest("crashy", nil)
	if err == nil {
		t.Fatal("expected non-nil error after handler panic")
	}
}

func TestSubscribeErr_Unsubscribe(t *testing.T) {
	bus := New()
	hits := atomic.Int32{}
	unsub := bus.SubscribeErr("ping", func(_ string, _ Payload) error {
		hits.Add(1)
		return nil
	})

	_ = bus.PublishRequest("ping", nil)
	if hits.Load() != 1 {
		t.Fatalf("expected 1 hit before unsubscribe, got %d", hits.Load())
	}
	unsub()
	_ = bus.PublishRequest("ping", nil)
	if hits.Load() != 1 {
		t.Fatalf("handler still firing after unsubscribe (got %d)", hits.Load())
	}
	// Calling unsub twice must be safe.
	unsub()
}

// TestPublishRequest_BlocksUntilDone proves the Sync semantics — the call
// returns only after every handler has finished. The email-manager
// extraction depends on this so SendEmail propagates SMTP errors before
// the request handler returns 200 to the client.
func TestPublishRequest_BlocksUntilDone(t *testing.T) {
	bus := New()
	completed := make(chan struct{})

	bus.SubscribeErr("slow.send", func(_ string, _ Payload) error {
		time.Sleep(15 * time.Millisecond)
		close(completed)
		return nil
	})

	start := time.Now()
	_ = bus.PublishRequest("slow.send", nil)
	elapsed := time.Since(start)

	if elapsed < 15*time.Millisecond {
		t.Fatalf("PublishRequest returned before handler completed (%v)", elapsed)
	}
	select {
	case <-completed:
	default:
		t.Fatal("handler did not complete before PublishRequest returned")
	}
}
