package sdui

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"squilla/internal/events"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

// sseClientBuffer is the per-client SSE event buffer. Sized to absorb a
// short burst (e.g. the slew of NAV_STALE events fired when an extension
// activates) without dropping; over that, the client is considered slow
// and events drop rather than block the publisher.
const sseClientBuffer = 64

// maxStreamsPerUser caps concurrent SSE streams per account. The admin UI
// elects one leader tab per browser, so a handful covers several browsers
// and devices; beyond that a stolen or scripted session can't pin an
// unbounded number of goroutines and sockets.
const maxStreamsPerUser = 8

// Broadcaster manages Server-Sent Events connections and pushes events
// to connected admin clients. It wires into the event bus to automatically
// forward relevant state changes.
type Broadcaster struct {
	mu         sync.RWMutex
	clients    map[chan SSEEvent]*clientStats
	perUser    map[int]int   // open streams per user id (guarded by mu)
	done       chan struct{} // closed on shutdown; every stream writer exits
	doneOnce   sync.Once
	totalDrops atomic.Uint64 // diagnostic — incremented every time a per-client buffer was full and an event was dropped.
}

// clientStats tracks per-client diagnostics. Kept off the hot path of
// the broadcast loop — only updated on drops, read by /admin/api/stats.
type clientStats struct {
	connectedAt time.Time
	dropped     atomic.Uint64
}

// NewBroadcaster creates a new Broadcaster and subscribes to the event bus.
// A single SubscribeAll handler routes every backend event to one of the
// typed SSE events consumed by the admin client.
func NewBroadcaster(eventBus *events.EventBus) *Broadcaster {
	b := &Broadcaster{
		clients: make(map[chan SSEEvent]*clientStats),
		perUser: make(map[int]int),
		done:    make(chan struct{}),
	}
	eventBus.SubscribeAll(b.route)
	return b
}

// route maps a backend event.Bus action to the SSE event(s) the admin UI
// expects. See the SSEEvent type comment in types.go for the taxonomy.
//
// A single backend event may fan out into multiple SSE events — e.g. a
// node_type.updated both flips the sidebar (NAV_STALE) and invalidates the
// entity's own query caches (ENTITY_CHANGED).
//
// SECURITY: every admin_access holder (authors and editors included) can
// open the stream, so raw event payloads are NEVER forwarded except for
// the explicit toast events. Invalidation signals carry only the routing
// fields (type/entity/op/id or the setting key); the client refetches
// through capability-checked endpoints. Payloads routinely contain data a
// low-privilege admin must not see (password-reset tokens, email
// addresses, secret settings, form submissions).
func (b *Broadcaster) route(action string, payload events.Payload) {
	if isSensitiveAction(action, payload) {
		return
	}

	// Pass-through notifications for toasts. These are the only events
	// whose payload is meant for display.
	if action == "notify" || action == "user.notification" {
		b.Broadcast(SSEEvent{Type: "NOTIFY", Data: notifyData(payload)})
		return
	}

	// Settings have their own channel because query keys are scoped by key.
	if action == "setting.updated" {
		key, _ := payload["key"].(string)
		b.Broadcast(SSEEvent{Type: "SETTING_CHANGED", Key: key})
		return
	}

	// Navigation-affecting events: sidebar + boot manifest need a refetch.
	switch action {
	case "extension.activated", "extension.deactivated",
		"theme.activated", "theme.deactivated",
		"taxonomies:register":
		b.Broadcast(SSEEvent{Type: "NAV_STALE"})
		return
	}

	// Everything else is an entity CRUD event of the form "<entity>.<op>".
	entity, op := splitEntityAction(action)
	if entity == "" {
		return // unknown shape — drop silently
	}
	ev := SSEEvent{
		Type:   "ENTITY_CHANGED",
		Entity: entity,
		Op:     op,
		ID:     scalarID(extractID(payload)),
	}
	b.Broadcast(ev)

	// node_type changes also rebuild the sidebar.
	if entity == "node_type" {
		b.Broadcast(SSEEvent{Type: "NAV_STALE"})
	}
}

// sensitiveActions are never routed to the admin stream at all — not even
// as a payload-free invalidation — because their mere timing/target is
// security-relevant (e.g. "a reset was requested for user 1").
var sensitiveActions = map[string]bool{
	"user.password_reset_requested": true,
	"user.password_reset_completed": true,
	"user.login":                    true,
}

// sensitiveKeys mark a payload as auth material regardless of action name,
// so an extension re-publishing reset data under another name is dropped
// too.
var sensitiveKeys = []string{"reset_token", "reset_url", "password", "password_hash", "token"}

func isSensitiveAction(action string, payload events.Payload) bool {
	if sensitiveActions[action] {
		return true
	}
	for _, k := range sensitiveKeys {
		if _, ok := payload[k]; ok {
			return true
		}
	}
	return false
}

// notifyData keeps only the display fields of a toast payload.
func notifyData(p events.Payload) map[string]interface{} {
	out := map[string]interface{}{}
	for _, k := range []string{"message", "variant", "title"} {
		if v, ok := p[k]; ok {
			out[k] = v
		}
	}
	return out
}

// scalarID keeps an id only when it is a plain scalar, so a publisher that
// puts a struct/map under "id" can't smuggle a payload through.
func scalarID(v interface{}) interface{} {
	switch v.(type) {
	case nil:
		return nil
	case string, bool, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, float32, float64:
		return v
	default:
		return nil
	}
}

// splitEntityAction splits "layout_block.updated" → ("layout_block", "updated").
// Returns ("", "") if the action is not a dotted entity.op form.
func splitEntityAction(action string) (string, string) {
	for i := 0; i < len(action); i++ {
		if action[i] == '.' {
			return action[:i], action[i+1:]
		}
	}
	return "", ""
}

// extractID pulls an id-shaped field out of a payload. Backend publishers use
// a few different field names — "id" is canonical, but some older publishers
// emit "user_id", "node_id", etc. We accept any of them.
func extractID(p events.Payload) interface{} {
	for _, k := range []string{"id", "user_id", "node_id", "menu_id", "layout_id",
		"layout_block_id", "block_type_id", "template_id", "taxonomy_id", "term_id",
		"role_id", "node_type_id", "extension_id"} {
		if v, ok := p[k]; ok {
			return v
		}
	}
	return nil
}

// StopOnContext closes every open stream once ctx is cancelled. Without it
// the SSE writers never notice shutdown and hold app.Shutdown open until
// its timeout.
func (b *Broadcaster) StopOnContext(ctx context.Context) {
	go func() {
		<-ctx.Done()
		b.Close()
	}()
}

// Close ends every open stream and refuses new ones. Safe to call twice.
func (b *Broadcaster) Close() {
	b.doneOnce.Do(func() { close(b.done) })
}

// acquireUserSlot reserves a stream slot for userID, returning false when
// the user already holds maxStreamsPerUser streams.
func (b *Broadcaster) acquireUserSlot(userID int) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.perUser[userID] >= maxStreamsPerUser {
		return false
	}
	b.perUser[userID]++
	return true
}

func (b *Broadcaster) releaseUserSlot(userID int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.perUser[userID] <= 1 {
		delete(b.perUser, userID)
		return
	}
	b.perUser[userID]--
}

// Subscribe creates a new client channel that will receive broadcast events.
func (b *Broadcaster) Subscribe() chan SSEEvent {
	ch := make(chan SSEEvent, sseClientBuffer)
	b.mu.Lock()
	b.clients[ch] = &clientStats{connectedAt: time.Now()}
	b.mu.Unlock()
	return ch
}

// Unsubscribe removes a client channel from the broadcaster.
// The channel is NOT closed — the stream writer exits via heartbeat
// timeout or write error, and the channel is garbage collected.
func (b *Broadcaster) Unsubscribe(ch chan SSEEvent) {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.clients, ch)
}

// Broadcast sends an event to all connected clients. Events are dropped
// for slow clients rather than blocking the broadcaster — slow consumers
// must never delay event delivery for the rest of the fleet. Per-client
// drop counts are tracked so /admin/api/stats can flag stale subscribers.
func (b *Broadcaster) Broadcast(event SSEEvent) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for ch, stats := range b.clients {
		select {
		case ch <- event:
		default:
			n := stats.dropped.Add(1)
			b.totalDrops.Add(1)
			// Log every 100th drop per client — frequent enough to surface
			// the issue, infrequent enough not to flood logs.
			if n%100 == 1 {
				log.Printf("sdui: SSE client dropped %d events (slow consumer)", n)
			}
		}
	}
}

// TotalDrops returns the cumulative number of dropped SSE events across
// all clients since process start. Exposed for monitoring.
func (b *Broadcaster) TotalDrops() uint64 {
	return b.totalDrops.Load()
}

// ClientCount returns the number of connected SSE clients (for diagnostics).
func (b *Broadcaster) ClientCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.clients)
}

// Handler returns a Fiber handler that serves a Server-Sent Events stream.
//
// Key insight: c.Context().SetBodyStreamWriter() is asynchronous in
// fasthttp — it registers a callback that runs later during response
// writing. The handler returns nil immediately. Therefore:
//   - We must NOT defer Unsubscribe at the handler level (it would close
//     the channel before the stream writer starts).
//   - All cleanup lives inside the stream writer callback.
//   - A heartbeat ticker keeps the TCP connection alive and lets us detect
//     disconnected clients within 30 seconds.
func (b *Broadcaster) Handler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		select {
		case <-b.done:
			return sseError(c, fiber.StatusServiceUnavailable, "SHUTTING_DOWN", "Server is shutting down")
		default:
		}
		userID := 0
		if u, ok := c.Locals("user").(*models.User); ok && u != nil {
			userID = u.ID
		}
		if !b.acquireUserSlot(userID) {
			return sseError(c, fiber.StatusTooManyRequests, "TOO_MANY_STREAMS", "Too many open event streams for this account")
		}

		c.Set("Content-Type", "text/event-stream")
		c.Set("Cache-Control", "no-cache")
		c.Set("Connection", "keep-alive")
		c.Set("X-Accel-Buffering", "no") // Disable nginx buffering

		// Subscribe creates a channel — we clean it up inside the
		// stream writer, NOT via defer, because SetBodyStreamWriter
		// is async and the handler returns before streaming begins.
		ch := b.Subscribe()

		c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
			// Cleanup when the stream ends (client disconnect or error).
			defer b.Unsubscribe(ch)
			defer b.releaseUserSlot(userID)

			// Send initial connected event so the client knows the stream is live.
			writeSSE(w, SSEEvent{Type: "CONNECTED", Data: nil})

			// Heartbeat: send an SSE comment every 15 seconds to keep the
			// connection alive through proxies, load balancers, and browser
			// idle timeouts. SSE comments start with ":" and are ignored by
			// the EventSource API.
			heartbeat := time.NewTicker(15 * time.Second)
			defer heartbeat.Stop()

			for {
				select {
				case <-b.done:
					return
				case event, ok := <-ch:
					if !ok {
						// Channel was removed — shouldn't happen since we
						// don't close channels in Unsubscribe, but handle it.
						return
					}
					if !writeSSE(w, event) {
						return // write error — client gone
					}

				case <-heartbeat.C:
					// SSE comment (ignored by EventSource) keeps the TCP
					// connection warm and lets us detect dead clients.
					if !writeSSEComment(w) {
						return // write error — client gone
					}
				}
			}
		})

		return nil
	}
}

// writeSSE serializes an event and writes it to the stream.
// Returns false if the write failed (client disconnected).
func writeSSE(w *bufio.Writer, event SSEEvent) bool {
	data, err := json.Marshal(event)
	if err != nil {
		return true // skip malformed events, don't kill the stream
	}
	_, err = fmt.Fprintf(w, "event: message\ndata: %s\n\n", data)
	if err != nil {
		return false
	}
	return w.Flush() == nil
}

// writeSSEComment sends an SSE comment line. Comments are ignored by
// the EventSource API but keep the connection alive.
func writeSSEComment(w *bufio.Writer) bool {
	_, err := w.WriteString(": heartbeat\n\n")
	if err != nil {
		return false
	}
	return w.Flush() == nil
}

// sseError writes the standard {"error":{code,message}} envelope. sdui
// can't import internal/api (api imports sdui), so it is inlined here.
func sseError(c *fiber.Ctx, status int, code, message string) error {
	return c.Status(status).JSON(fiber.Map{"error": fiber.Map{"code": code, "message": message}})
}
