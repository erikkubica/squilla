package main

import (
	"context"
	"html"
	"net/url"
	"strings"
	"sync"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// passthroughHeader tells the kernel "not mine": the request continues to
// the page router as if this extension were not installed.
const passthroughHeader = "X-Squilla-Passthrough"

func declined() *pb.PluginHTTPResponse {
	return &pb.PluginHTTPResponse{StatusCode: 204, Headers: map[string]string{passthroughHeader: "1"}}
}

// handlePublic answers a public request a rule matches and declines the
// rest. It runs in front of every public page, so it only reads memory.
func (p *Plugin) handlePublic(req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	if m := strings.ToUpper(req.GetMethod()); m != "GET" && m != "HEAD" {
		return declined()
	}
	query := url.Values{}
	for k, v := range req.GetQueryParams() {
		query.Set(k, v)
	}
	m, ok := p.rules.Load().resolve(req.GetPath(), query)
	if !ok {
		return declined()
	}
	// A speculative prefetch isn't a visit; follow the rule, don't count it.
	h := req.GetHeaders()
	if !strings.Contains(strings.ToLower(header(h, "Sec-Purpose")+header(h, "Purpose")), "prefetch") {
		p.hits.add(m.Rule.ID, p.now())
	}
	return redirectResponse(m)
}

func redirectResponse(m match) *pb.PluginHTTPResponse {
	headers := map[string]string{"Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex"}
	if m.Rule.StatusCode == 410 {
		headers["Cache-Control"] = "no-cache"
		return &pb.PluginHTTPResponse{StatusCode: 410, Headers: headers, Body: []byte("<!doctype html><title>Gone</title><h1>410 Gone</h1><p>This page has been permanently removed.</p>")}
	}
	headers["Location"] = m.Location
	// Browsers cache permanent redirects indefinitely by default, which
	// makes a mistyped rule impossible to take back for past visitors.
	// An hour keeps repeat hits cheap while leaving rules editable;
	// search engines act on the status code, not on this header.
	if m.Rule.StatusCode == 301 || m.Rule.StatusCode == 308 {
		headers["Cache-Control"] = "public, max-age=3600"
	} else {
		headers["Cache-Control"] = "no-store"
	}
	loc := html.EscapeString(m.Location)
	return &pb.PluginHTTPResponse{
		StatusCode: int32(m.Rule.StatusCode),
		Headers:    headers,
		Body:       []byte(`<!doctype html><title>Redirecting</title><a href="` + loc + `">` + loc + `</a>`),
	}
}

// hitCounter buffers hit counts in memory; flushHits writes them out.
type hitCounter struct {
	mu      sync.Mutex
	pending map[int64]*hitEntry
}

type hitEntry struct {
	n    int64
	last time.Time
}

func (h *hitCounter) add(id int64, at time.Time) {
	h.mu.Lock()
	e := h.pending[id]
	if e == nil {
		e = &hitEntry{}
		h.pending[id] = e
	}
	e.n++
	e.last = at
	h.mu.Unlock()
}

// peek returns the not-yet-flushed count for a rule.
func (h *hitCounter) peek(id int64) (int64, time.Time) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if e := h.pending[id]; e != nil {
		return e.n, e.last
	}
	return 0, time.Time{}
}

func (h *hitCounter) take() map[int64]*hitEntry {
	h.mu.Lock()
	defer h.mu.Unlock()
	out := h.pending
	h.pending = map[int64]*hitEntry{}
	return out
}

// flushHits adds the buffered counts to the stored totals.
func (p *Plugin) flushHits(ctx context.Context) {
	batch := p.hits.take()
	if len(batch) == 0 {
		return
	}
	for id, e := range batch {
		row, err := p.host.DataGet(ctx, rulesTable, uint(id))
		if err != nil || row == nil {
			continue // rule deleted since the hit
		}
		_ = p.host.DataUpdate(ctx, rulesTable, uint(id), map[string]any{
			"hits":        num(row, "hits") + e.n,
			"last_hit_at": e.last.UTC().Format(time.RFC3339),
		})
	}
	_ = p.reloadRules(ctx)
}
