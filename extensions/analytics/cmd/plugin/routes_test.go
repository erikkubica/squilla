package main

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func stubRows(rows ...map[string]any) func([]any) ([]map[string]any, error) {
	return func([]any) ([]map[string]any, error) { return rows, nil }
}

func keys(m map[string]any) string {
	out := []string{}
	for k := range m {
		out = append(out, k)
	}
	return strings.Join(sortedStrings(out), ",")
}

func TestSummaryShape(t *testing.T) {
	p, h := newTestPlugin(t)
	h.CallStub["analytics_summary"] = stubRows(map[string]any{
		"visitors": 10.0, "pageviews": 30.0, "visits": 12.0, "conversions": 3.0, "converting_visits": 2.0,
		"single_page_visits": 4.0, "multi_page_visits": 4.0, "median_visit_seconds": 95.4,
	})
	h.CallStub["analytics_timeseries"] = stubRows(map[string]any{"t": "2026-10-22", "visitors": 1.0, "pageviews": 2.0, "visits": 1.0, "conversions": 0.0})
	resp, body := doRequest(p, "GET", "/summary", map[string]string{"from": "2026-10-01", "to": "2026-10-07", "compare": "previous", "f.country": "VN"}, "")
	if resp.StatusCode != 200 {
		t.Fatalf("status %d %s", resp.StatusCode, resp.Body)
	}
	if keys(body) != "current,previous,range,sparklines" {
		t.Errorf("keys %s", keys(body))
	}
	cur := body["current"].(map[string]any)
	if keys(cur) != "conversion_rate,conversions,median_visit_seconds,pages_per_visit,pageviews,single_page_rate,visitors,visits" {
		t.Errorf("metric keys %s", keys(cur))
	}
	if cur["pages_per_visit"] != 2.5 || cur["single_page_rate"] != 0.5 || cur["median_visit_seconds"] != 95.0 || cur["conversion_rate"] != 0.1667 {
		t.Errorf("metrics %v", cur)
	}
	rng := body["range"].(map[string]any)
	if rng["from"] != "2026-10-01" || rng["to"] != "2026-10-07" || rng["tz"] != "UTC" {
		t.Errorf("range %v", rng)
	}
	calls := h.callsTo("analytics_summary")
	if len(calls) != 2 || calls[1].Args[0] != "2026-09-24" || calls[1].Args[1] != "2026-09-30" {
		t.Errorf("previous range call %v", calls)
	}
	if f, _ := calls[0].Args[3].(map[string]any); f["country"] != "VN" {
		t.Errorf("filters arg %v", calls[0].Args[3])
	}
	if sp := body["sparklines"].(map[string]any); len(sp["visitors"].([]any)) != 1 {
		t.Errorf("sparklines %v", sp)
	}
}

func TestQueryValidation(t *testing.T) {
	p, _ := newTestPlugin(t)
	for _, q := range []map[string]string{
		{"from": "2026-13-01"}, {"from": "2026-10-10", "to": "2026-10-01"}, {"compare": "lastweek"}, {"f.ip": "1.2.3.4"},
	} {
		if resp, body := doRequest(p, "GET", "/summary", q, ""); resp.StatusCode != 400 || body["error"] == nil || body["message"] == nil {
			t.Errorf("%v → %d %v", q, resp.StatusCode, body)
		}
	}
	if resp, _ := doRequest(p, "GET", "/breakdown/ip", nil, ""); resp.StatusCode != 400 {
		t.Error("unknown dimension must be 400")
	}
	if resp, _ := doRequest(p, "GET", "/timeseries", map[string]string{"interval": "hour", "from": "2026-01-01", "to": "2026-10-01"}, ""); resp.StatusCode != 400 {
		t.Error("hourly over > 31 days must be 400")
	}
	q, err := parseStatsQuery(map[string]string{}, &Config{Timezone: "UTC"}, testNow)
	if err != nil || q.from() != "2026-09-24" || q.to() != "2026-10-23" {
		t.Errorf("default range %v %v", q, err)
	}
}

func TestTimeseriesAlignment(t *testing.T) {
	p, h := newTestPlugin(t)
	n := 0
	h.CallStub["analytics_timeseries"] = func([]any) ([]map[string]any, error) {
		n++
		rows := []map[string]any{{"t": "2026-10-05", "visitors": 1.0}, {"t": "2026-10-12", "visitors": 2.0}}
		if n == 2 {
			rows = append(rows, map[string]any{"t": "2026-10-19", "visitors": 3.0})
		}
		return rows, nil
	}
	_, body := doRequest(p, "GET", "/timeseries", map[string]string{"interval": "week", "compare": "year"}, "")
	if body["interval"] != "week" || len(body["points"].([]any)) != 2 || len(body["previous_points"].([]any)) != 2 {
		t.Errorf("alignment %v", body)
	}
	_, body = doRequest(p, "GET", "/timeseries", nil, "")
	if body["previous_points"] != nil || body["interval"] != "day" {
		t.Errorf("no compare → null previous_points: %v", body)
	}
}

func TestBreakdownShapeAndLabels(t *testing.T) {
	p, h := newTestPlugin(t)
	p.goals.Store(&[]Goal{{ID: 7, Name: "Booking"}})
	h.CallStub["analytics_breakdown"] = stubRows(
		map[string]any{"value": "7", "visitors": 3.0, "pageviews": 4.0, "visits": 3.0, "conversions": 4.0, "share": 0.75, "total_rows": 2.0},
		map[string]any{"value": "9", "visitors": 1.0, "pageviews": 1.0, "visits": 1.0, "conversions": 1.0, "share": 0.25, "total_rows": 2.0},
	)
	resp, body := doRequest(p, "GET", "/breakdown/goal", map[string]string{"limit": "5", "sort": "conversions"}, "")
	if resp.StatusCode != 200 || body["dimension"] != "goal" || body["total_rows"] != 2.0 {
		t.Fatalf("%d %v", resp.StatusCode, body)
	}
	rows := body["rows"].([]any)
	r0 := rows[0].(map[string]any)
	if keys(r0) != "conversions,label,pageviews,share,value,visitors,visits" || r0["label"] != "Booking" {
		t.Errorf("row %v", r0)
	}
	if rows[1].(map[string]any)["label"] != "Deleted goal #9" {
		t.Error("missing goal label")
	}
	args := h.callsTo("analytics_breakdown")[0].Args
	if args[3] != "goal" || args[5] != "conversions" || args[6] != 5.0 || args[7] != 0.0 {
		t.Errorf("args %v", args)
	}
	if resp, _ := doRequest(p, "GET", "/breakdown/page", map[string]string{"sort": "random"}, ""); resp.StatusCode != 400 {
		t.Error("invalid sort must be 400")
	}
}

func TestRealtimeHeatmapBotsGoalStatsStatus(t *testing.T) {
	p, h := newTestPlugin(t)
	h.CallStub["analytics_realtime"] = stubRows(map[string]any{"data": map[string]any{
		"visitors_5m": 1.0, "visitors_30m": 2.0, "pageviews_30m": 3.0,
		"per_minute": []any{map[string]any{"t": "2026-10-23T09:59:00+00:00", "pageviews": 1.0}},
		"recent":     []any{}, "top_pages": []any{},
	}})
	_, body := doRequest(p, "GET", "/realtime", nil, "")
	if pm := body["per_minute"].([]any)[0].(map[string]any); pm["t"] != "2026-10-23T09:59:00Z" {
		t.Errorf("per_minute %v", pm)
	}
	h.CallStub["analytics_heatmap"] = stubRows(map[string]any{"dow": 0.0, "hour": 8.0, "pageviews": 5.0, "visitors": 2.0})
	if _, body = doRequest(p, "GET", "/heatmap", nil, ""); keys(body["cells"].([]any)[0].(map[string]any)) != "dow,hour,pageviews,visitors" {
		t.Errorf("heatmap %v", body)
	}
	if _, body = doRequest(p, "GET", "/bots", map[string]string{"from": "2026-10-01"}, ""); keys(body) != "timeseries,top,totals" {
		t.Errorf("bots %v", body)
	}
	h.CallStub["analytics_goal_stats"] = stubRows(map[string]any{"id": 1.0, "name": "G", "conversions": 2.0, "visitors": 2.0, "conversion_rate": 0.123456})
	if _, body = doRequest(p, "GET", "/goals/stats", nil, ""); body["rows"].([]any)[0].(map[string]any)["conversion_rate"] != 0.1235 {
		t.Errorf("goal stats %v", body)
	}
	p.noteRecordTime(testNow.Add(-time.Minute))
	p.droppedTotal.Add(4)
	_, body = doRequest(p, "GET", "/status", nil, "")
	want := "bots_today,dropped_total,enhanced_mode,geoip,last_record_at,pageviews_today,receiving,records_today,salt_rotates_at"
	if keys(body) != want || body["receiving"] != true || body["dropped_total"] != 4.0 || body["salt_rotates_at"] != "2026-10-24T00:00:00Z" {
		t.Errorf("status %v", body)
	}
}

func TestSettingsValidationAndSave(t *testing.T) {
	p, h := newTestPlugin(t)
	_, body := doRequest(p, "GET", "/settings", nil, "")
	if body["timezone"] != "UTC" || body["raw_retention_days"] != 90.0 || body["beacon_prefix"] != "/_s" {
		t.Errorf("defaults %v", body)
	}
	bad := []string{
		`{"timezone":"Mars/Olympus"}`, `{"raw_retention_days":0}`, `{"session_timeout_minutes":1}`,
		`{"beacon_prefix":"/admin"}`, `{"exclude_paths":["nope"]}`, `{"own_hosts":["bad host"]}`, `{"unknown":1}`, `not json`,
	}
	for _, b := range bad {
		if resp, body := doRequest(p, "PUT", "/settings", nil, b); resp.StatusCode != 400 || body["error"] == nil {
			t.Errorf("%s → %d %v", b, resp.StatusCode, body)
		}
	}
	resp, body := doRequest(p, "PUT", "/settings", nil, `{"timezone":"Asia/Ho_Chi_Minh","enhanced_mode":true,"download_extensions":[".PDF","gpx"],"own_hosts":["WWW.Example.org"]}`)
	if resp.StatusCode != 200 || body["timezone"] != "Asia/Ho_Chi_Minh" || body["enhanced_mode"] != true || body["exclude_logged_in"] != true {
		t.Fatalf("save %d %v", resp.StatusCode, body)
	}
	if de := body["download_extensions"].([]any); de[0] != "pdf" || body["own_hosts"].([]any)[0] != "example.org" {
		t.Errorf("normalised lists %v", body)
	}
	if p.config().location().String() != "Asia/Ho_Chi_Minh" {
		t.Error("config not applied")
	}
	stored := h.Tables[configTable][1]["value"].(string)
	var cfg Config
	if json.Unmarshal([]byte(stored), &cfg) != nil || cfg.Timezone != "Asia/Ho_Chi_Minh" {
		t.Errorf("stored %s", stored)
	}
	p2 := newAnalyticsPlugin(h)
	p2.loadConfig(ctx())
	if !p2.config().EnhancedMode || p2.config().location().String() != "Asia/Ho_Chi_Minh" {
		t.Error("reload from store failed")
	}
}

func TestGoalsAndLinksCRUD(t *testing.T) {
	p, _ := newTestPlugin(t)
	resp, g := doRequest(p, "POST", "/goals", nil, `{"name":"Contact","kind":"request","path_pattern":"/Forms/Submit/*"}`)
	if resp.StatusCode != 200 || g["id"] != 1.0 || g["method"] != "POST" || g["path_pattern"] != "/forms/submit/*" || g["created_at"] == "" {
		t.Fatalf("create goal %d %v", resp.StatusCode, g)
	}
	if resp, _ := doRequest(p, "POST", "/goals", nil, `{"name":"","kind":"x"}`); resp.StatusCode != 400 {
		t.Error("invalid goal accepted")
	}
	if _, g = doRequest(p, "PUT", "/goals/1", nil, `{"name":"Thanks","kind":"pageview","path_pattern":"/thank-you/"}`); g["kind"] != "pageview" || g["path_pattern"] != "/thank-you" {
		t.Errorf("update goal %v", g)
	}
	if _, list := doRequest(p, "GET", "/goals", nil, ""); len(list["rows"].([]any)) != 1 || len(*p.goals.Load()) != 1 {
		t.Errorf("list goals %v", list)
	}
	if resp, _ := doRequest(p, "DELETE", "/goals/1", nil, ""); resp.StatusCode != 200 || len(*p.goals.Load()) != 0 {
		t.Error("delete goal")
	}
	if resp, _ := doRequest(p, "DELETE", "/goals/99", nil, ""); resp.StatusCode != 404 {
		t.Error("delete missing goal")
	}

	resp, l := doRequest(p, "POST", "/links", nil, `{"slug":"WA","label":"WhatsApp","destination":"https://wa.me/84123"}`)
	if resp.StatusCode != 200 || l["slug"] != "wa" || l["clicks_30d"] != 0.0 {
		t.Fatalf("create link %d %v", resp.StatusCode, l)
	}
	for _, b := range []string{
		`{"slug":"wa","destination":"https://x.com"}`, `{"slug":"x","destination":"javascript:alert(1)"}`,
		`{"slug":"x","destination":"//evil.com"}`, `{"slug":"x","destination":"/local"}`, `{"slug":"../x","destination":"https://a.b"}`,
	} {
		if resp, _ := doRequest(p, "POST", "/links", nil, b); resp.StatusCode != 400 {
			t.Errorf("%s accepted", b)
		}
	}
	h := p.host.(*FakeHost)
	h.CallStub["analytics_link_clicks"] = stubRows(map[string]any{"slug": "wa", "clicks": 12.0})
	if _, list := doRequest(p, "GET", "/links", nil, ""); list["rows"].([]any)[0].(map[string]any)["clicks_30d"] != 12.0 {
		t.Errorf("links %v", list)
	}
}

func TestGoRedirectSafety(t *testing.T) {
	p, h := newTestPlugin(t)
	h.DataCreate(ctx(), linksTable, map[string]any{"slug": "wa", "label": "WhatsApp", "destination": "https://wa.me/84123"})
	h.DataCreate(ctx(), linksTable, map[string]any{"slug": "evil", "destination": "javascript:alert(1)"})
	p.reloadLinks(ctx())
	p.goals.Store(&[]Goal{{ID: 3, Name: "WA click", Kind: "link", LinkSlug: "wa"}})
	headers := map[string]string{
		"Host": "example.com", "X-Forwarded-For": "203.0.113.7", "Referer": "https://example.com/tours",
		"User-Agent": chromeUA, "Accept-Language": "en", "Sec-Fetch-Site": "same-origin", "Sec-Ch-Ua": `"Chromium";v="130"`,
	}
	resp := p.routeRequest(ctx(), pbReq("GET", "/go/wa", headers, map[string]string{"to": "https://evil.com"}))
	if resp.StatusCode != 302 || resp.Headers["Location"] != "https://wa.me/84123" {
		t.Fatalf("redirect %+v", resp)
	}
	ev := bufferedEvents(p)
	if len(ev) != 2 || ev[0].Kind != kindOutbound || ev[0].Target != "wa" || ev[0].Path != "/tours" || ev[1].GoalID != 3 {
		t.Errorf("outbound events %+v", ev)
	}
	for _, path := range []string{"/go/evil", "/go/unknown", "/go/https:%2F%2Fevil.com", "/go/..%2Fadmin"} {
		if r := p.routeRequest(ctx(), pbReq("GET", path, headers, nil)); r.StatusCode != 404 || r.Headers["Location"] != "" {
			t.Errorf("%s → %d %v", path, r.StatusCode, r.Headers)
		}
	}
	bot := map[string]string{"User-Agent": "WhatsApp/2.23.20.0 A", "Host": "example.com"}
	p.buf.take()
	if r := p.routeRequest(ctx(), pbReq("GET", "/go/wa", bot, nil)); r.StatusCode != 302 || len(bufferedEvents(p)) != 0 || len(bufferedBots(p)) != 1 {
		t.Error("preview bots must redirect but count as bots")
	}
}

func TestExportAndRouting(t *testing.T) {
	p, h := newTestPlugin(t)
	h.CallStub["analytics_breakdown"] = stubRows(map[string]any{"value": "=cmd", "visitors": 1.0, "pageviews": 1.0, "share": 1.0, "total_rows": 1.0})
	resp, _ := doRequest(p, "GET", "/export", map[string]string{"dataset": "breakdown", "dim": "page", "format": "csv"}, "")
	if resp.StatusCode != 200 || !strings.HasPrefix(resp.Headers["Content-Disposition"], "attachment;") || !strings.Contains(string(resp.Body), "'=cmd") {
		t.Errorf("csv export %d %v %s", resp.StatusCode, resp.Headers, resp.Body)
	}
	h.CallStub["analytics_export_events"] = stubRows(map[string]any{"ts": "2026-10-23T10:00:00Z", "kind": "pageview", "path": "/"})
	resp, _ = doRequest(p, "GET", "/export", map[string]string{"dataset": "events", "format": "json"}, "")
	if resp.StatusCode != 200 || resp.Headers["Content-Type"] != "application/json" || strings.Contains(string(resp.Body), "visitor") {
		t.Errorf("json export %s", resp.Body)
	}
	if resp, _ := doRequest(p, "GET", "/export", map[string]string{"dataset": "nope"}, ""); resp.StatusCode != 400 {
		t.Error("bad dataset")
	}
	if resp, body := doRequest(p, "GET", "/nope", nil, ""); resp.StatusCode != 404 || body["error"] != "NOT_FOUND" {
		t.Error("unknown route")
	}
	if resp, _ := doRequest(p, "DELETE", "/summary", nil, ""); resp.StatusCode != 404 {
		t.Error("wrong method")
	}
}
