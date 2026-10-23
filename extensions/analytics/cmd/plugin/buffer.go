package main

import (
	"context"
	"sync"
	"time"
)

const (
	flushInterval  = 2 * time.Second
	flushBatchSize = 500
	// maxBuffered bounds memory when the database is unavailable; older
	// events are dropped first.
	maxBuffered = 50000
)

type botKey struct{ day, category, name string }

// confirmation is a beacon result for an event that is already stored.
type confirmation struct {
	EID         string
	Since       time.Time
	Viewport    string
	ColorScheme string
	Printed     bool
}

// pipelineBuffer collects events, bot counters and beacon confirmations
// between flushes.
type pipelineBuffer struct {
	mu       sync.Mutex
	events   []Event
	bots     map[botKey]int64
	confirms []confirmation
	wake     chan struct{}
	lost     int64 // events dropped because the buffer was full
}

func newPipelineBuffer() *pipelineBuffer {
	return &pipelineBuffer{bots: map[botKey]int64{}, wake: make(chan struct{}, 1)}
}

func (b *pipelineBuffer) addEvent(e Event) {
	b.mu.Lock()
	if len(b.events) >= maxBuffered {
		b.events = b.events[1:]
		b.lost++
	}
	b.events = append(b.events, e)
	b.mu.Unlock()
}

func (b *pipelineBuffer) addBot(day string, v botVerdict) {
	b.mu.Lock()
	b.bots[botKey{day, v.Category, v.Name}]++
	b.mu.Unlock()
}

func (b *pipelineBuffer) addConfirm(c confirmation) {
	b.mu.Lock()
	if len(b.confirms) < maxBuffered {
		b.confirms = append(b.confirms, c)
	}
	b.mu.Unlock()
}

func (b *pipelineBuffer) eventCount() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return len(b.events)
}

// signal wakes the flush worker early (non-blocking).
func (b *pipelineBuffer) signal() {
	select {
	case b.wake <- struct{}{}:
	default:
	}
}

// take swaps out everything buffered so far.
func (b *pipelineBuffer) take() ([]Event, map[botKey]int64, []confirmation) {
	b.mu.Lock()
	defer b.mu.Unlock()
	ev, bots, conf := b.events, b.bots, b.confirms
	b.events, b.bots, b.confirms = nil, map[botKey]int64{}, nil
	return ev, bots, conf
}

// requeue puts back events whose insert failed (bounded by maxBuffered).
func (b *pipelineBuffer) requeue(ev []Event, bots map[botKey]int64) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if room := maxBuffered - len(b.events); room > 0 {
		if len(ev) > room {
			b.lost += int64(len(ev) - room)
			ev = ev[len(ev)-room:]
		}
		b.events = append(ev, b.events...)
	} else {
		b.lost += int64(len(ev))
	}
	for k, n := range bots {
		b.bots[k] += n
	}
}

// flush persists the buffer: events first (in chunks), then bot counters,
// then beacon confirmations — so a confirmation never precedes its event.
func (p *AnalyticsPlugin) flush(ctx context.Context) {
	events, bots, confirms := p.buf.take()
	for start := 0; start < len(events); start += flushBatchSize {
		end := start + flushBatchSize
		if end > len(events) {
			end = len(events)
		}
		if _, err := p.host.DataCall(ctx, "analytics_ingest", events[start:end]); err != nil {
			p.logf(ctx, "error", "analytics: ingest failed (%d events requeued): %v", len(events)-start, err)
			p.buf.requeue(events[start:], bots)
			return
		}
	}
	if len(bots) > 0 {
		rows := make([]map[string]any, 0, len(bots))
		for k, n := range bots {
			rows = append(rows, map[string]any{"day": k.day, "category": k.category, "name": k.name, "hits": n})
		}
		if _, err := p.host.DataCall(ctx, "analytics_ingest_bots", rows); err != nil {
			p.logf(ctx, "error", "analytics: bot ingest failed: %v", err)
			p.buf.requeue(nil, bots)
		}
	}
	for _, c := range confirms {
		if _, err := p.host.DataCall(ctx, "analytics_confirm", c.EID, c.Since.UTC().Format(time.RFC3339Nano),
			c.Viewport, c.ColorScheme, c.Printed); err != nil {
			p.logf(ctx, "warn", "analytics: beacon confirm failed: %v", err)
		}
	}
}
