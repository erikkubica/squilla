package main

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"squilla/internal/coreapi"
)

// TestPostgresBehaviour drives the finalizer, exit reasons and the
// behaviour queries against a real database (same opt-in as the e2e test).
func TestPostgresBehaviour(t *testing.T) {
	dsn := os.Getenv("ANALYTICS_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("ANALYTICS_TEST_DATABASE_URL not set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	files, _ := filepath.Glob("../../migrations/*.sql")
	sort.Strings(files)
	for pass := 0; pass < 2; pass++ {
		for _, f := range files {
			sql, _ := os.ReadFile(f)
			if err := db.Exec(string(sql)).Error; err != nil {
				t.Fatalf("pass %d %s: %v", pass, f, err)
			}
		}
	}
	db.Exec("TRUNCATE analytics_events, analytics_interactions, analytics_visits, analytics_page_elements, analytics_daily, analytics_bots_daily, analytics_goals, analytics_links, analytics_config RESTART IDENTITY")

	p := newAnalyticsPlugin(ctxHost{coreapi.NewCoreImpl(db, nil, nil, nil, nil, nil, nil, nil)})
	now := time.Now().UTC()
	p.now = func() time.Time { return now }
	ctx := context.Background()
	cfg := *p.config()
	cfg.Timezone = "UTC"
	cfg.normalize()
	p.cfg.Store(&cfg)

	rec := func(ip, path string, at time.Time, ref string) Record {
		r := browserRecord(path)
		r.IP, r.TS, r.Referer = ip, at, ref
		return r
	}
	t0 := now.Add(-3 * time.Hour)
	// A: one page, no signals (single_page). B: two pages (browsed).
	// C: one page with activation + dwell + end (read_and_left). D: leaves via /go/ (contact).
	p.ingestBatch(batchPayload{Records: []Record{
		rec("203.0.113.1", "/", t0, ""),
		rec("203.0.113.2", "/", t0, ""), rec("203.0.113.2", "/tours", t0.Add(time.Minute), "https://example.com/"),
		rec("203.0.113.3", "/tours", t0, ""),
	}})
	evs := bufferedEvents(p)
	var cEvent Event
	for _, e := range evs {
		if e.Path == "/tours" && e.Entry {
			cEvent = e
		}
	}
	p.buf.addConfirm(confirmation{EID: cEvent.EID, Since: cEvent.TS.Add(-time.Minute), Viewport: "m", ColorScheme: "light"})
	p.flush(ctx)
	rows := []map[string]any{
		{"ts": t0.Add(10 * time.Second), "eid": cEvent.EID, "session_id": cEvent.SessionID, "path": "/tours", "kind": "section", "block_key": "bv-hero.0"},
		{"ts": t0.Add(12 * time.Second), "eid": cEvent.EID, "session_id": cEvent.SessionID, "path": "/tours", "kind": "section", "block_key": "bv-faq.0"},
		{"ts": t0.Add(70 * time.Second), "eid": cEvent.EID, "session_id": cEvent.SessionID, "path": "/tours", "kind": "dwell", "value": "60"},
		{"ts": t0.Add(80 * time.Second), "eid": cEvent.EID, "session_id": cEvent.SessionID, "path": "/tours", "kind": "end"},
		{"ts": t0.Add(15 * time.Second), "eid": cEvent.EID, "session_id": cEvent.SessionID, "path": "/tours", "kind": "click", "block_key": "bv-hero.0", "value": "i", "dest": "/contact"},
	}
	if _, err := p.host.DataCall(ctx, "analytics_ingest_interactions", rows); err != nil {
		t.Fatal(err)
	}
	if _, err := p.host.DataCall(ctx, "analytics_upsert_outline", "/tours", "h1", []map[string]any{
		{"kind": "block", "block_key": "bv-hero.0", "label": "Hero"},
		{"kind": "link", "block_key": "bv-hero.0", "label": "Book", "href": "/contact"},
		{"kind": "link", "block_key": "bv-faq.0", "label": "Nobody", "href": "/never"},
		{"kind": "link", "block_key": "bv-faq.0", "label": "Nobody again", "href": "/never"}, // same link twice in a block
	}); err != nil {
		t.Fatal(err)
	}

	p.now = func() time.Time { return now }
	p.finalizeVisits(ctx)
	p.finalizeVisits(ctx) // idempotent
	var n int64
	db.Raw("SELECT count(*) FROM analytics_visits").Scan(&n)
	if n != 3 {
		t.Fatalf("visits = %d, want 3", n)
	}
	reasons := map[string]string{}
	var vr []struct {
		EntryPath  string
		ExitReason string
		Pageviews  int
	}
	db.Raw("SELECT entry_path, exit_reason, pageviews FROM analytics_visits ORDER BY pageviews, exit_reason").Scan(&vr)
	for _, v := range vr {
		reasons[v.EntryPath+"/"+string(rune('0'+v.Pageviews))] = v.ExitReason
	}
	if reasons["//2"] != exitBrowsed || reasons["//1"] != exitSinglePage || reasons["/tours/1"] != exitReadAndLeft {
		t.Errorf("reasons = %v", reasons)
	}

	for _, path := range []string{"/behaviour", "/exits", "/clicks"} {
		resp, body := doRequest(p, "GET", path, nil, "")
		if resp.StatusCode != 200 || len(body) == 0 {
			t.Errorf("%s: %d %s", path, resp.StatusCode, resp.Body)
		}
	}
	_, ex := doRequest(p, "GET", "/exits", nil, "")
	if ex["total"] != 3.0 {
		t.Errorf("exits %v", ex)
	}
	_, pg := doRequest(p, "GET", "/page", map[string]string{"path": "/tours"}, "")
	if pg["views"] != 2.0 || pg["activated_views"] != 1.0 {
		t.Errorf("page insights %v", pg)
	}
	blocks, _ := pg["blocks"].([]any)
	links, _ := pg["links"].([]any)
	if len(blocks) != 2 || len(links) != 2 {
		t.Errorf("blocks/links %v / %v", blocks, links)
	}
	if first, _ := links[0].(map[string]any); first["href"] != "/contact" || first["clicks"] != 1.0 {
		t.Errorf("links %v", links)
	}
	_, ck := doRequest(p, "GET", "/clicks", nil, "")
	if tot, _ := ck["totals"].(map[string]any); tot["sections_seen"] != 2.0 || tot["clicks"] != 1.0 {
		t.Errorf("clicks %v", ck)
	}
	if resp, _ := doRequest(p, "GET", "/page", nil, ""); resp.StatusCode != 400 {
		t.Errorf("page without path = %d", resp.StatusCode)
	}
}
