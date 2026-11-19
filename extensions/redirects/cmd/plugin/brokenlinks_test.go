package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"squilla/internal/coreapi"
)

type fakeRow = map[string]any

// analyticsAnswer answers brokenLinksEvent like the analytics extension,
// paging rows by the request's limit/offset.
func analyticsAnswer(rows ...fakeRow) func(string, map[string]any) []string {
	return func(action string, payload map[string]any) []string {
		if action != brokenLinksEvent {
			return nil
		}
		limit, _ := payload["limit"].(float64)
		offset, _ := payload["offset"].(float64)
		lo := min(int(offset), len(rows))
		hi := min(lo+int(limit), len(rows))
		b, _ := json.Marshal(map[string]any{
			"source": "analytics", "from": "2026-10-21", "to": "2026-11-19",
			"rows": rows[lo:hi], "total": len(rows), "confirm_available": true,
		})
		return []string{string(b)}
	}
}

func brokenRows(t *testing.T, body map[string]any) map[string]string {
	t.Helper()
	out := map[string]string{}
	for _, r := range body["rows"].([]any) {
		m := r.(map[string]any)
		s := ""
		if sg, ok := m["suggestion"].(map[string]any); ok {
			s = sg["url"].(string)
		}
		out[m["path"].(string)] = s
	}
	return out
}

func TestBrokenLinksUnavailableWithoutAnalytics(t *testing.T) {
	p, h := newTestPlugin(t)
	code, body := admin(t, p, "GET", "/broken-links", nil)
	if code != 200 || body["available"] != false {
		t.Fatalf("got %d %v", code, body)
	}
	// An answer that does not identify itself as analytics is ignored.
	h.Collect = func(string, map[string]any) []string {
		return []string{`{"source":"evil","rows":[{"path":"/x","hits":1}]}`, `not json`}
	}
	if _, body := admin(t, p, "GET", "/broken-links", nil); body["available"] != false {
		t.Fatalf("spoofed answer accepted: %v", body)
	}
}

func TestBrokenLinksAnalyticsError(t *testing.T) {
	p, h := newTestPlugin(t)
	h.Collect = func(string, map[string]any) []string {
		return []string{`{"source":"analytics","error":"analytics could not read broken links"}`}
	}
	code, body := admin(t, p, "GET", "/broken-links", nil)
	if code != 200 || body["available"] != true || body["error"] == "" || body["error"] == nil {
		t.Fatalf("got %d %v", code, body)
	}
}

func TestBrokenLinksFiltersAndSuggests(t *testing.T) {
	p, h := newTestPlugin(t)
	h.Nodes[1] = &coreapi.Node{ID: 1, Status: "published", Slug: "summer-tours", Title: "Summer tours", FullURL: "/tours/summer-tours"}
	h.Nodes[2] = &coreapi.Node{ID: 2, Status: "published", Slug: "contact", Title: "Contact", FullURL: "/contact"}
	h.Nodes[3] = &coreapi.Node{ID: 3, Status: "published", Slug: "hanoi-food-walk", Title: "Food walk", FullURL: "/hanoi-food-walk"}
	h.Nodes[4] = &coreapi.Node{ID: 4, Status: "draft", Slug: "draft-page", FullURL: "/draft-page"}
	h.Nodes[5] = &coreapi.Node{ID: 5, Status: "published", Slug: "about", Title: "About", FullURL: "/about"}
	h.Nodes[6] = &coreapi.Node{ID: 6, Status: "published", Slug: "about", Title: "Über", FullURL: "/de/about"}
	h.Nodes[7] = &coreapi.Node{ID: 7, Status: "published", Slug: "moved", Title: "Moved", FullURL: "/moved"}
	mustAdd(t, p, Rule{Source: "/old-blog", MatchType: "prefix", Target: "/blog", Enabled: true})
	mustAdd(t, p, Rule{Source: "/disabled-one", Target: "/x", Enabled: false})
	mustAdd(t, p, Rule{Source: "/moved", Target: "/contact", Enabled: true})
	h.Collect = analyticsAnswer(
		fakeRow{"path": "/old-blog/post", "hits": 50, "visitors": 40},    // covered by prefix
		fakeRow{"path": "/disabled-one", "hits": 45, "visitors": 1},      // has a disabled rule
		fakeRow{"path": "/contact/", "hits": 30, "visitors": 20},         // page exists now
		fakeRow{"path": "/summer-tours.html", "hits": 12, "visitors": 9}, // exact slug
		fakeRow{"path": "/food-walk-hanoi", "hits": 8, "visitors": 7},    // word overlap
		fakeRow{"path": "/draft-page", "hits": 6, "visitors": 6},         // drafts are not live
		fakeRow{"path": "/de/about-us", "hits": 5, "visitors": 5},        // same language wins
		fakeRow{"path": "/moved-page", "hits": 4, "visitors": 4},         // never suggest a redirecting page
		fakeRow{"path": "/caf%C3%A9", "hits": 2, "visitors": 2},          // merged with the next row
		fakeRow{"path": "/café", "hits": 1, "visitors": 1},
		fakeRow{"path": "/wp-admin", "hits": 3, "visitors": 3}, // no idea
	)
	code, body := admin(t, p, "GET", "/broken-links?days=30", nil)
	if code != 200 || body["available"] != true || body["confirm_available"] != true {
		t.Fatalf("got %d %v", code, body)
	}
	if body["covered"] != 1.0 || body["disabled"] != 1.0 || body["live"] != 1.0 || body["partial"] != false || body["truncated"] != false {
		t.Fatalf("counts: %v", body)
	}
	got := brokenRows(t, body)
	want := map[string]string{
		"/summer-tours.html": "/tours/summer-tours", "/food-walk-hanoi": "/hanoi-food-walk",
		"/draft-page": "", "/de/about-us": "/de/about", "/moved-page": "", "/café": "", "/wp-admin": "",
	}
	if len(got) != len(want) {
		t.Fatalf("rows %v", got)
	}
	for k, v := range want {
		if s, ok := got[k]; !ok || s != v {
			t.Errorf("%s: suggestion %q (listed %v), want %q", k, s, ok, v)
		}
	}
	for _, r := range body["rows"].([]any) {
		if m := r.(map[string]any); m["path"] == "/café" && m["hits"] != 3.0 {
			t.Errorf("duplicate spellings not merged: %v", m)
		}
	}

	// count_only skips suggestions; the page index is cached between calls.
	queries := h.NodeQueries
	_, body = admin(t, p, "GET", "/broken-links?count_only=1", nil)
	for _, s := range brokenRows(t, body) {
		if s != "" {
			t.Fatal("count_only returned suggestions")
		}
	}
	if h.NodeQueries != queries {
		t.Errorf("page index rebuilt: %d node queries", h.NodeQueries-queries)
	}
	// A node event drops the cache.
	_, _ = p.HandleEvent("node.updated", []byte(`{"node_id":2,"full_url":"/contact"}`))
	admin(t, p, "GET", "/broken-links?count_only=1", nil)
	if h.NodeQueries == queries {
		t.Error("node event did not invalidate the page index")
	}
}

// Addresses already fixed stay in analytics for the whole period; the list
// pages past them instead of stopping at the first answer.
func TestBrokenLinksPagesPastFixedAddresses(t *testing.T) {
	p, h := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/fixed", MatchType: "prefix", Target: "/", Enabled: true})
	rows := []fakeRow{}
	for i := 0; i < 700; i++ {
		rows = append(rows, fakeRow{"path": fmt.Sprintf("/fixed/%d", i), "hits": 1000 - i, "visitors": 1})
	}
	rows = append(rows, fakeRow{"path": "/still-broken", "hits": 1, "visitors": 1})
	h.Collect = analyticsAnswer(rows...)
	_, body := admin(t, p, "GET", "/broken-links", nil)
	if got := brokenRows(t, body); len(got) != 1 || body["covered"] != 700.0 {
		t.Fatalf("rows %v covered %v", got, body["covered"])
	}
}

// An incomplete page list must not offer redirects for pages that may be
// live: suggestions are withheld and the answer says so.
func TestBrokenLinksPartialPageIndex(t *testing.T) {
	p, h := newTestPlugin(t)
	h.Nodes[1] = &coreapi.Node{ID: 1, Status: "published", Slug: "contact", FullURL: "/contact"}
	h.QueryNodesErr = errors.New("db down")
	h.Collect = analyticsAnswer(fakeRow{"path": "/contact-us", "hits": 2, "visitors": 1})
	_, body := admin(t, p, "GET", "/broken-links", nil)
	if body["partial"] != true {
		t.Fatalf("partial not reported: %v", body)
	}
	if got := brokenRows(t, body); got["/contact-us"] != "" {
		t.Errorf("suggested from a partial index: %v", got)
	}
}

func TestBatchCreate(t *testing.T) {
	p, _ := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/taken", Target: "/x", Enabled: true})
	code, body := admin(t, p, "POST", "/rules/batch", map[string]any{"rules": []map[string]any{
		{"source": "/a", "target": "/b", "note": "From analytics"},
		{"source": "/taken", "target": "/y"},
		{"source": "/c", "target": "/c"},
		{"source": "/gone", "status_code": 410},
		{"source": "/chain", "target": "/taken"},
		{"source": "/b", "target": "/final"},
	}})
	if code != 200 || body["created"] != 4.0 {
		t.Fatalf("got %d %v", code, body)
	}
	if errs := body["errors"].([]any); len(errs) != 2 {
		t.Fatalf("errors: %v", errs)
	}
	if w := body["warnings"].([]any); len(w) != 2 {
		t.Fatalf("warnings (want /chain and /a): %v", w)
	}
	if st, loc := visit(t, p, "/a"); st != 301 || loc != "/b" {
		t.Fatalf("/a → %d %s", st, loc)
	}
	if st, _ := visit(t, p, "/gone"); st != 410 {
		t.Fatalf("/gone → %d", st)
	}
	if code, _ := admin(t, p, "POST", "/rules/batch", map[string]any{"rules": []any{}}); code != 400 {
		t.Errorf("empty batch: %d", code)
	}
	many := make([]map[string]any, 501)
	for i := range many {
		many[i] = map[string]any{"source": fmt.Sprintf("/m%d", i), "target": "/"}
	}
	if code, _ := admin(t, p, "POST", "/rules/batch", map[string]any{"rules": many}); code != 422 && code != 400 {
		t.Errorf("oversized batch: %d", code)
	}
}
