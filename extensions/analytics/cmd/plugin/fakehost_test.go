package main

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// FakeHost implements hostAPI in memory. DataCall records every call and
// answers from CallStub (per function name).
type FakeHost struct {
	mu       sync.Mutex
	Tables   map[string]map[uint]map[string]any
	NextID   map[string]uint
	Calls    []FakeCall
	CallStub map[string]func(args []any) ([]map[string]any, error)
	Logs     []string
}

type FakeCall struct {
	Fn   string
	Args []any
}

func NewFakeHost() *FakeHost {
	return &FakeHost{
		Tables:   map[string]map[uint]map[string]any{},
		NextID:   map[string]uint{},
		CallStub: map[string]func([]any) ([]map[string]any, error){},
	}
}

func (h *FakeHost) DataCall(_ context.Context, fn string, args ...any) ([]map[string]any, error) {
	h.mu.Lock()
	// Round-trip through JSON like the gRPC transport does.
	b, _ := json.Marshal(args)
	var decoded []any
	_ = json.Unmarshal(b, &decoded)
	h.Calls = append(h.Calls, FakeCall{fn, decoded})
	stub := h.CallStub[fn]
	h.mu.Unlock()
	if stub != nil {
		return stub(decoded)
	}
	return []map[string]any{}, nil
}

func (h *FakeHost) callsTo(fn string) []FakeCall {
	h.mu.Lock()
	defer h.mu.Unlock()
	var out []FakeCall
	for _, c := range h.Calls {
		if c.Fn == fn {
			out = append(out, c)
		}
	}
	return out
}

func (h *FakeHost) DataQuery(_ context.Context, table string, q coreapi.DataStoreQuery) (*coreapi.DataStoreResult, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	out := &coreapi.DataStoreResult{Rows: []map[string]any{}}
	for id := uint(1); id <= h.NextID[table]; id++ {
		r, ok := h.Tables[table][id]
		if !ok {
			continue
		}
		match := true
		for k, v := range q.Where {
			if fmt.Sprint(r[k]) != fmt.Sprint(v) {
				match = false
			}
		}
		if match {
			out.Rows = append(out.Rows, clone(r))
		}
	}
	out.Total = int64(len(out.Rows))
	if q.Limit > 0 && len(out.Rows) > q.Limit {
		out.Rows = out.Rows[:q.Limit]
	}
	return out, nil
}

func (h *FakeHost) DataCreate(_ context.Context, table string, data map[string]any) (map[string]any, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.Tables[table] == nil {
		h.Tables[table] = map[uint]map[string]any{}
	}
	h.NextID[table]++
	row := clone(data)
	row["id"] = float64(h.NextID[table])
	row["created_at"] = "2026-10-23T10:00:00Z"
	h.Tables[table][h.NextID[table]] = row
	return clone(row), nil
}

func (h *FakeHost) DataUpdate(_ context.Context, table string, id uint, data map[string]any) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.Tables[table][id]
	if !ok {
		return fmt.Errorf("not found")
	}
	for k, v := range data {
		r[k] = v
	}
	return nil
}

func (h *FakeHost) DataDelete(_ context.Context, table string, id uint) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.Tables[table], id)
	return nil
}

func (h *FakeHost) Log(_ context.Context, level, message string, _ map[string]any) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.Logs = append(h.Logs, level+": "+message)
	return nil
}

func clone(m map[string]any) map[string]any {
	b, _ := json.Marshal(m)
	var out map[string]any
	_ = json.Unmarshal(b, &out)
	return out
}

// ---- test helpers ----

var testNow = time.Date(2026, 10, 23, 10, 0, 0, 0, time.UTC)

func newTestPlugin(t *testing.T) (*AnalyticsPlugin, *FakeHost) {
	t.Helper()
	h := NewFakeHost()
	p := newAnalyticsPlugin(h)
	p.now = func() time.Time { return testNow }
	return p, h
}

// browserRecord returns a realistic Chrome navigation record.
func browserRecord(path string) Record {
	return Record{
		TS: testNow, Method: "GET", Host: "example.com", Path: path, Status: 200,
		ContentType: "text/html; charset=utf-8", IP: "203.0.113.7",
		UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
		Headers: map[string]string{
			"accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"accept-language": "en-GB,en;q=0.9",
			"sec-fetch-site":  "none", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document",
			"sec-ch-ua":          `"Chromium";v="130", "Google Chrome";v="130"`,
			"sec-ch-ua-mobile":   "?0",
			"sec-ch-ua-platform": `"Windows"`,
		},
	}
}

func bufferedEvents(p *AnalyticsPlugin) []Event {
	p.buf.mu.Lock()
	defer p.buf.mu.Unlock()
	return append([]Event(nil), p.buf.events...)
}

func bufferedBots(p *AnalyticsPlugin) map[botKey]int64 {
	p.buf.mu.Lock()
	defer p.buf.mu.Unlock()
	out := map[botKey]int64{}
	for k, v := range p.buf.bots {
		out[k] = v
	}
	return out
}

func doRequest(p *AnalyticsPlugin, method, path string, query map[string]string, body string) (*pb.PluginHTTPResponse, map[string]any) {
	resp := p.routeRequest(context.Background(), &pb.PluginHTTPRequest{Method: method, Path: path, QueryParams: query, Body: []byte(body)})
	var out map[string]any
	_ = json.Unmarshal(resp.Body, &out)
	return resp, out
}

func ctx() context.Context { return context.Background() }

func pbReq(method, path string, headers, query map[string]string) *pb.PluginHTTPRequest {
	return &pb.PluginHTTPRequest{Method: method, Path: path, Headers: headers, QueryParams: query}
}
