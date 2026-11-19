package main

import (
	"context"
	"encoding/json"
	"fmt"
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

// TestPostgresEndToEnd runs the migrations (twice, like re-activation) and
// drives the real pipeline + every admin endpoint through the kernel's
// DataCall against a disposable database. Opt-in:
//
//	ANALYTICS_TEST_DATABASE_URL=postgres://… go test ./extensions/analytics/...
func TestPostgresEndToEnd(t *testing.T) {
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
	db.Exec("TRUNCATE analytics_events, analytics_interactions, analytics_visits, analytics_page_elements, analytics_daily, analytics_bots_daily, analytics_goals, analytics_links, analytics_config, analytics_funnels RESTART IDENTITY")

	api := coreapi.NewCoreImpl(db, nil, nil, nil, nil, nil, nil, nil)
	host := ctxHost{api}
	p := newAnalyticsPlugin(host)
	now := time.Now()
	p.now = func() time.Time { return now }
	ctx := context.Background()

	if resp, _ := doRequest(p, "PUT", "/settings", nil, `{"timezone":"Asia/Ho_Chi_Minh"}`); resp.StatusCode != 200 {
		t.Fatalf("settings: %s", resp.Body)
	}
	doRequest(p, "POST", "/goals", nil, `{"name":"Contact","kind":"request","path_pattern":"/forms/submit/*"}`)
	doRequest(p, "POST", "/links", nil, `{"slug":"wa","label":"WhatsApp","destination":"https://wa.me/1"}`)

	var recs []Record
	for i, path := range []string{"/", "/tours", "/tours/old-quarter"} {
		r := browserRecord(path)
		r.TS = now.Add(time.Duration(i-5) * time.Minute)
		r.Referer = map[int]string{0: "https://www.google.com/"}[i]
		r.Query = map[int]string{1: "q=Old+Quarter"}[i]
		recs = append(recs, r)
	}
	submit := browserRecord("/forms/submit/contact")
	submit.TS, submit.Method, submit.Status, submit.ContentType = now.Add(-time.Minute), "POST", 200, "application/json"
	bot := browserRecord("/")
	bot.TS, bot.UserAgent = now, "GPTBot/1.2"
	other := browserRecord("/")
	other.TS, other.IP, other.Headers["sec-gpc"] = now, "198.51.100.1", "1"
	recs = append(recs, submit, bot, other)
	p.ingestBatch(batchPayload{Records: recs, Dropped: 1})
	p.flush(ctx)
	if _, err := api.DataCall(ctx, "analytics_rollup", now.In(p.config().location()).Format("2006-01-02"), "Asia/Ho_Chi_Minh"); err != nil {
		t.Fatal(err)
	}

	_, sum := doRequest(p, "GET", "/summary", map[string]string{"compare": "previous"}, "")
	cur := sum["current"].(map[string]any)
	if cur["visitors"] != 2.0 || cur["pageviews"] != 4.0 || cur["visits"] != 2.0 || cur["conversions"] != 1.0 {
		t.Errorf("summary %v", sum)
	}
	_, filtered := doRequest(p, "GET", "/summary", map[string]string{"f.source": "Google"}, "")
	if fc := filtered["current"].(map[string]any); fc["pageviews"] != 3.0 || fc["conversion_rate"] != 1.0 {
		t.Errorf("filtered %v", filtered)
	}
	for _, dim := range breakdownDims {
		if resp, _ := doRequest(p, "GET", "/breakdown/"+dim, nil, ""); resp.StatusCode != 200 {
			t.Errorf("breakdown %s: %s", dim, resp.Body)
		}
	}
	_, bd := doRequest(p, "GET", "/breakdown/source", map[string]string{"f.goal": "1"}, "")
	if rows := bd["rows"].([]any); len(rows) != 1 || rows[0].(map[string]any)["value"] != "Google" {
		t.Errorf("goal-filtered sources %v", bd)
	}
	for _, iv := range []string{"hour", "day", "week", "month"} {
		resp, ts := doRequest(p, "GET", "/timeseries", map[string]string{"interval": iv, "compare": "year"}, "")
		if resp.StatusCode != 200 || len(ts["points"].([]any)) != len(ts["previous_points"].([]any)) {
			t.Errorf("timeseries %s: %s", iv, resp.Body)
		}
	}
	for _, path := range []string{"/realtime", "/heatmap", "/bots", "/goals/stats", "/links", "/status", "/goals"} {
		if resp, _ := doRequest(p, "GET", path, nil, ""); resp.StatusCode != 200 {
			t.Errorf("%s: %s", path, resp.Body)
		}
	}
	_, ss := doRequest(p, "GET", "/search", nil, "")
	terms, _ := ss["terms"].([]any)
	if st, _ := ss["totals"].(map[string]any); st["searches"] != 1.0 || len(terms) != 1 ||
		terms[0].(map[string]any)["term"] != "old quarter" || terms[0].(map[string]any)["top_next"] != "/tours/old-quarter" {
		t.Errorf("search stats %v", ss)
	}
	_, sb := doRequest(p, "GET", "/breakdown/search", nil, "")
	if rows := sb["rows"].([]any); len(rows) != 1 || rows[0].(map[string]any)["value"] != "old quarter" {
		t.Errorf("search breakdown %v", sb)
	}
	if resp, _ := doRequest(p, "POST", "/funnels", nil, `{"name":"x","steps":[{"kind":"page","value":"/"}]}`); resp.StatusCode != 422 && resp.StatusCode != 400 {
		t.Errorf("one-step funnel = %d", resp.StatusCode)
	}
	if resp, _ := doRequest(p, "POST", "/funnels", nil, `{"name":"x","steps":[{"kind":"page","value":"/"},{"kind":"goal","value":"999"}]}`); resp.StatusCode == 200 {
		t.Error("funnel with an unknown goal accepted")
	}
	_, fn := doRequest(p, "POST", "/funnels", nil, `{"name":"Book","steps":[{"kind":"page","value":"/"},{"kind":"page","value":"/Tours/*","label":"A tour"},{"kind":"goal","value":"1"}]}`)
	_, fs := doRequest(p, "GET", fmt.Sprintf("/funnels/%v/stats", fn["id"]), nil, "")
	stats, _ := fs["stats"].(map[string]any)
	fsteps, _ := stats["steps"].([]any)
	reached := []any{}
	for _, x := range fsteps {
		reached = append(reached, x.(map[string]any)["reached"])
	}
	if fmt.Sprint(reached) != "[1 1 1]" {
		t.Errorf("funnel reached = %v (%v)", reached, fs)
	}
	_, fn2 := doRequest(p, "POST", "/funnels", nil, `{"name":"Pricing","steps":[{"kind":"page","value":"/"},{"kind":"page","value":"/pricing"}]}`)
	_, fs2 := doRequest(p, "GET", fmt.Sprintf("/funnels/%v/stats", fn2["id"]), nil, "")
	st2 := fs2["stats"].(map[string]any)["steps"].([]any)
	next, _ := st2[0].(map[string]any)["next"].([]any)
	if st2[1].(map[string]any)["reached"] != 0.0 || len(next) != 1 || next[0].(map[string]any)["path"] != "/tours" {
		t.Errorf("funnel drop-off = %v", st2)
	}
	_, fl := doRequest(p, "GET", "/funnels", nil, "")
	if rows, _ := fl["rows"].([]any); len(rows) != 2 || rows[0].(map[string]any)["steps"].([]any)[1].(map[string]any)["value"] != "/tours/*" {
		t.Errorf("funnels = %v", fl)
	}
	if resp, _ := doRequest(p, "DELETE", fmt.Sprintf("/funnels/%v", fn2["id"]), nil, ""); resp.StatusCode != 200 {
		t.Errorf("delete funnel = %d", resp.StatusCode)
	}
	_, rt := doRequest(p, "GET", "/realtime", nil, "")
	if len(rt["per_minute"].([]any)) != 30 || rt["pageviews_30m"] != 4.0 {
		t.Errorf("realtime %v", rt)
	}
	_, st := doRequest(p, "GET", "/status", nil, "")
	if st["bots_today"] != 1.0 || st["records_today"] != 5.0 || st["dropped_total"] != 1.0 {
		t.Errorf("status %v", st)
	}
	for _, ds := range []string{"summary", "timeseries", "events"} {
		if resp, _ := doRequest(p, "GET", "/export", map[string]string{"dataset": ds, "format": "csv"}, ""); resp.StatusCode != 200 {
			t.Errorf("export %s: %s", ds, resp.Body)
		}
	}
	// Confirmed visits: only the first visitor's session got a signal.
	if err := db.Exec("UPDATE analytics_events SET confirmed = true WHERE kind = 'pageview' AND path = '/tours'").Error; err != nil {
		t.Fatal(err)
	}
	_, ver := doRequest(p, "GET", "/summary", map[string]string{"f.verified": "1"}, "")
	if vc := ver["current"].(map[string]any); vc["visits"] != 1.0 || vc["pageviews"] != 3.0 || vc["visitors"] != 1.0 || vc["conversions"] != 1.0 {
		t.Errorf("verified summary %v", ver)
	}
	if _, has := sum["confirmed"]; has {
		t.Errorf("confirmed totals reported with in-page signals off: %v", sum)
	}
	if resp, _ := doRequest(p, "PUT", "/settings", nil, `{"timezone":"Asia/Ho_Chi_Minh","enhanced_mode":true}`); resp.StatusCode != 200 {
		t.Fatalf("settings: %s", resp.Body)
	}
	_, sum = doRequest(p, "GET", "/summary", nil, "")
	if cc, _ := sum["confirmed"].(map[string]any); cc == nil || cc["visits"] != 1.0 || cc["pageviews"] != 3.0 {
		t.Errorf("confirmed totals %v", sum)
	}
	for _, path := range []string{"/timeseries", "/heatmap", "/breakdown/page", "/goals/stats", "/exits"} {
		if resp, _ := doRequest(p, "GET", path, map[string]string{"f.verified": "1"}, ""); resp.StatusCode != 200 {
			t.Errorf("%s verified: %s", path, resp.Body)
		}
	}
	b, _ := json.Marshal(st)
	t.Logf("status: %s", b)
}

// ctxHost runs every call as an internal caller (no capability guard).
type ctxHost struct{ api coreapi.CoreAPI }

func (h ctxHost) c(ctx context.Context) context.Context {
	return coreapi.WithCaller(ctx, coreapi.InternalCaller())
}
func (h ctxHost) DataCall(ctx context.Context, fn string, args ...any) ([]map[string]any, error) {
	return h.api.DataCall(h.c(ctx), fn, args...)
}
func (h ctxHost) DataQuery(ctx context.Context, t string, q coreapi.DataStoreQuery) (*coreapi.DataStoreResult, error) {
	return h.api.DataQuery(h.c(ctx), t, q)
}
func (h ctxHost) DataCreate(ctx context.Context, t string, d map[string]any) (map[string]any, error) {
	return h.api.DataCreate(h.c(ctx), t, d)
}
func (h ctxHost) DataUpdate(ctx context.Context, t string, id uint, d map[string]any) error {
	return h.api.DataUpdate(h.c(ctx), t, id, d)
}
func (h ctxHost) DataDelete(ctx context.Context, t string, id uint) error {
	return h.api.DataDelete(h.c(ctx), t, id)
}
func (h ctxHost) Log(_ context.Context, _, _ string, _ map[string]any) error { return nil }
