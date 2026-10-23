// Package httpobs observes completed HTTP requests and publishes them
// in batches on the event bus as the explicit-only "http.requests"
// event. It is generic plumbing: any extension declaring the
// http:observe capability can consume the stream (access logs,
// analytics, anomaly detection). Nothing is recorded while no explicit
// subscriber exists.
package httpobs

import (
	"sync"
	"sync/atomic"
	"time"

	"squilla/internal/events"

	"github.com/gofiber/fiber/v2"
)

// Event is the explicit-only event carrying observed request batches.
// Payload: {"records": []Record, "dropped": uint64}.
const Event = "http.requests"

// Defaults for Options.
const (
	DefaultBufferSize    = 8192
	DefaultBatchSize     = 500
	DefaultFlushInterval = 2 * time.Second
)

// Options tunes the observer. Zero values fall back to the defaults.
type Options struct {
	BufferSize    int
	BatchSize     int
	FlushInterval time.Duration
	// SessionCookie is the cookie whose presence sets Record.HasSession.
	SessionCookie string
}

// Observer is the request-observing middleware plus its flusher.
type Observer struct {
	bus           *events.EventBus
	ch            chan Record
	batchSize     int
	interval      time.Duration
	sessionCookie string

	dropped   atomic.Uint64 // drops since the last published batch
	closed    atomic.Bool
	stop      chan struct{}
	finished  chan struct{}
	closeOnce sync.Once
}

// New creates an Observer and starts its flusher goroutine. Call Close
// on shutdown to flush what is queued.
func New(bus *events.EventBus, opts Options) *Observer {
	if opts.BufferSize <= 0 {
		opts.BufferSize = DefaultBufferSize
	}
	if opts.BatchSize <= 0 {
		opts.BatchSize = DefaultBatchSize
	}
	if opts.FlushInterval <= 0 {
		opts.FlushInterval = DefaultFlushInterval
	}
	o := &Observer{
		bus:           bus,
		ch:            make(chan Record, opts.BufferSize),
		batchSize:     opts.BatchSize,
		interval:      opts.FlushInterval,
		sessionCookie: opts.SessionCookie,
		stop:          make(chan struct{}),
		finished:      make(chan struct{}),
	}
	go o.run()
	return o
}

// Middleware returns the Fiber handler. Mount it right after
// logging.RequestID() so it wraps every other middleware and sees the
// final status. The cost when nobody subscribes is one RLock'd map read.
func (o *Observer) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if o.closed.Load() || !o.bus.HasExplicitHandlers(Event) {
			return c.Next()
		}
		start := time.Now()
		err := c.Next()
		if rec, ok := o.buildRecord(c, start, err); ok {
			select {
			case o.ch <- rec:
			default:
				o.dropped.Add(1)
			}
		}
		return err
	}
}

// Dropped reports records dropped since the last published batch.
func (o *Observer) Dropped() uint64 { return o.dropped.Load() }

// Close stops observing, drains the queue and publishes the final
// batch(es). Safe to call more than once; blocks until the flush ends.
func (o *Observer) Close() {
	o.closeOnce.Do(func() {
		o.closed.Store(true)
		close(o.stop)
	})
	<-o.finished
}

// run is the single flusher goroutine. Publishing is synchronous, so at
// most one batch is ever in flight; records arriving meanwhile queue in
// the channel (or are dropped and counted once it is full).
func (o *Observer) run() {
	defer close(o.finished)
	ticker := time.NewTicker(o.interval)
	defer ticker.Stop()

	batch := make([]Record, 0, o.batchSize)
	for {
		select {
		case rec := <-o.ch:
			batch = append(batch, rec)
			if len(batch) >= o.batchSize {
				batch = o.publish(batch)
			}
		case <-ticker.C:
			batch = o.publish(batch)
		case <-o.stop:
			for {
				select {
				case rec := <-o.ch:
					batch = append(batch, rec)
					if len(batch) >= o.batchSize {
						batch = o.publish(batch)
					}
				default:
					o.publish(batch)
					return
				}
			}
		}
	}
}

// publish sends the batch (plus the drop counter) and returns a fresh
// empty batch. Consumers own the published slice.
func (o *Observer) publish(batch []Record) []Record {
	dropped := o.dropped.Swap(0)
	if len(batch) == 0 && dropped == 0 {
		return batch
	}
	o.bus.PublishExplicitSync(Event, events.Payload{
		"records": batch,
		"dropped": dropped,
	})
	return make([]Record, 0, o.batchSize)
}
