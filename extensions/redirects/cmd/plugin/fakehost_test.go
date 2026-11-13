package main

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"
	"testing"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// FakeHost implements hostAPI in memory.
type FakeHost struct {
	mu     sync.Mutex
	Tables map[string]map[uint]map[string]any
	NextID map[string]uint
	Nodes  map[uint]*coreapi.Node
	Logs   []string
}

func NewFakeHost() *FakeHost {
	return &FakeHost{Tables: map[string]map[uint]map[string]any{}, NextID: map[string]uint{}, Nodes: map[uint]*coreapi.Node{}}
}

// roundTrip mimics the gRPC transport: values arrive JSON-shaped.
func roundTrip(in map[string]any) map[string]any {
	b, _ := json.Marshal(in)
	out := map[string]any{}
	_ = json.Unmarshal(b, &out)
	return out
}

func (h *FakeHost) DataGet(_ context.Context, table string, id uint) (map[string]any, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	row, ok := h.Tables[table][id]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	return roundTrip(row), nil
}

func (h *FakeHost) DataQuery(_ context.Context, table string, q coreapi.DataStoreQuery) (*coreapi.DataStoreResult, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	ids := make([]uint, 0, len(h.Tables[table]))
	for id := range h.Tables[table] {
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool {
		if strings.HasSuffix(q.OrderBy, "DESC") {
			return ids[i] > ids[j]
		}
		return ids[i] < ids[j]
	})
	res := &coreapi.DataStoreResult{}
rows:
	for _, id := range ids {
		row := h.Tables[table][id]
		for k, v := range q.Where {
			if fmt.Sprint(row[k]) != fmt.Sprint(v) {
				continue rows
			}
		}
		res.Rows = append(res.Rows, roundTrip(row))
	}
	res.Total = int64(len(res.Rows))
	return res, nil
}

func (h *FakeHost) DataCreate(_ context.Context, table string, data map[string]any) (map[string]any, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.Tables[table] == nil {
		h.Tables[table] = map[uint]map[string]any{}
	}
	h.NextID[table]++
	id := h.NextID[table]
	row := roundTrip(data)
	row["id"] = id
	if table == rulesTable {
		if _, ok := row["hits"]; !ok {
			row["hits"] = 0
		}
	}
	h.Tables[table][id] = row
	return roundTrip(row), nil
}

func (h *FakeHost) DataUpdate(_ context.Context, table string, id uint, data map[string]any) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	row, ok := h.Tables[table][id]
	if !ok {
		return fmt.Errorf("not found")
	}
	for k, v := range roundTrip(data) {
		row[k] = v
	}
	return nil
}

func (h *FakeHost) DataDelete(_ context.Context, table string, id uint) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.Tables[table], id)
	return nil
}

func (h *FakeHost) GetNode(_ context.Context, id uint) (*coreapi.Node, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	n, ok := h.Nodes[id]
	if !ok {
		return nil, fmt.Errorf("not found")
	}
	cp := *n
	return &cp, nil
}

func (h *FakeHost) QueryNodes(_ context.Context, q coreapi.NodeQuery) (*coreapi.NodeList, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	list := &coreapi.NodeList{}
	for _, n := range h.Nodes {
		cp := *n
		list.Nodes = append(list.Nodes, &cp)
	}
	return list, nil
}

func (h *FakeHost) Log(_ context.Context, level, msg string, _ map[string]any) error {
	h.mu.Lock()
	h.Logs = append(h.Logs, level+": "+msg)
	h.mu.Unlock()
	return nil
}

// --- test helpers ---

func newTestPlugin(t *testing.T) (*Plugin, *FakeHost) {
	t.Helper()
	h := NewFakeHost()
	return newPlugin(h), h
}

// admin sends an authenticated admin request and decodes the JSON body.
func admin(t *testing.T, p *Plugin, method, path string, body any) (int, map[string]any) {
	t.Helper()
	var raw []byte
	if body != nil {
		raw, _ = json.Marshal(body)
	}
	rel, query, _ := strings.Cut(path, "?")
	params := map[string]string{}
	for _, kv := range strings.Split(query, "&") {
		if k, v, ok := strings.Cut(kv, "="); ok {
			params[k] = v
		}
	}
	resp, err := p.HandleHTTPRequest(&pb.PluginHTTPRequest{Method: method, Path: rel, Body: raw, QueryParams: params, UserId: 1})
	if err != nil {
		t.Fatal(err)
	}
	out := map[string]any{}
	_ = json.Unmarshal(resp.Body, &out)
	return int(resp.StatusCode), out
}

func mustAdd(t *testing.T, p *Plugin, r Rule) {
	t.Helper()
	if code, body := admin(t, p, "POST", "/rules", r); code != 200 {
		t.Fatalf("adding %+v: %d %v", r, code, body)
	}
}

// visit sends a public request ("/path?query") and returns status + Location.
func visit(t *testing.T, p *Plugin, target string) (int, string) {
	t.Helper()
	path, query, _ := strings.Cut(target, "?")
	params := map[string]string{}
	for _, kv := range strings.Split(query, "&") {
		if k, v, ok := strings.Cut(kv, "="); ok {
			params[k] = v
		}
	}
	resp, err := p.HandleHTTPRequest(&pb.PluginHTTPRequest{Method: "GET", Path: path, QueryParams: params})
	if err != nil {
		t.Fatal(err)
	}
	if resp.Headers[passthroughHeader] != "" {
		return 0, ""
	}
	return int(resp.StatusCode), resp.Headers["Location"]
}
