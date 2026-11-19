package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

const recUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

func recReq(body string, hdr map[string]string) *pb.PluginHTTPRequest {
	h := map[string]string{"host": "example.com", "user-agent": recUA, "x-forwarded-for": "203.0.113.9",
		"accept-language": "en", "origin": "https://example.com", "sec-fetch-site": "same-origin"}
	for k, v := range hdr {
		h[k] = v
	}
	return &pb.PluginHTTPRequest{Method: "POST", Path: "/_s/r", Headers: h, Body: []byte(body)}
}

func withRecordings(p *AnalyticsPlugin) {
	cfg := *p.config()
	cfg.Recordings = true
	cfg.normalize()
	p.cfg.Store(&cfg)
}

func TestCleanRecEvents(t *testing.T) {
	raw := []json.RawMessage{
		json.RawMessage(`[10,"s",0,120]`),
		json.RawMessage(`[20,"c",5,6,"body>a:nth-of-type(1)","https://example.com/x",99,98]`), // extra args cut
		json.RawMessage(`[30,"zz",1]`),        // unknown type
		json.RawMessage(`[-1,"m",1,2]`),       // negative time
		json.RawMessage(`[40,"m",{"a":1},2]`), // object arg
		json.RawMessage(`[1.5,"m",1,2]`),      // fractional time
		json.RawMessage(`[50,"m",3.6,1e9]`),   // absurd coordinate
		json.RawMessage(`[60,"h","` + strings.Repeat("x", 900) + `","/a"]`),
		json.RawMessage(`[70,"w","lcp",2500]`),
		json.RawMessage(`[80,"e","boom","a.js",3,"stack"]`), // extra arg cut
	}
	got, maxT := cleanRecEvents(raw)
	b, _ := json.Marshal(got)
	if maxT != 80 || len(got) != 5 || !strings.HasPrefix(string(b), `[[10,"s",0,120],[20,"c",5,6,"body\u003ea:nth-of-type(1)","https://example.com/x"]`) {
		t.Fatalf("got %s (max %d)", b, maxT)
	}
	if h := got[2].([]any); len(h[2].(string)) != recMaxStringArg {
		t.Errorf("long selector not cut: %d", len(h[2].(string)))
	}
}

func TestRecordCollectorGates(t *testing.T) {
	p, _ := newTestPlugin(t)
	first := `{"p":"abc123def456","s":0,"e":[[0,"s",0,0]],"m":{"u":"https://example.com/tours?x=1","r":"","w":390,"h":800,"dh":3000,"sw":390,"sh":844}}`
	// Off by default.
	if resp := p.routeRequest(ctx(), recReq(first, nil)); resp.StatusCode != 204 || len(p.rec.take()) != 0 {
		t.Fatal("recordings must be off by default")
	}
	withRecordings(p)
	for name, hdr := range map[string]map[string]string{
		"cross-site": {"sec-fetch-site": "cross-site"},
		"bot":        {"user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"},
		"gpc":        {"sec-gpc": "1"},
		"dnt":        {"dnt": "1"},
		"origin":     {"origin": "https://evil.example.net"},
		"opted out":  {"cookie": optOutCookie + "=1"},
	} {
		p.routeRequest(ctx(), recReq(first, hdr))
		if q := p.rec.take(); len(q) != 0 {
			t.Errorf("%s: recorded %v", name, q)
		}
	}
	for name, body := range map[string]string{
		"bad pid":    strings.Replace(first, "abc123def456", "ABC", 1),
		"other host": strings.Replace(first, "https://example.com/tours", "https://evil.example.net/tours", 1),
		"js url":     strings.Replace(first, "https://example.com/tours?x=1", "javascript:alert(1)", 1),
		"no seq":     strings.Replace(first, `"s":0,`, "", 1),
		"no meta":    `{"p":"zzz123def456","s":1,"e":[[0,"s",0,0]]}`,
	} {
		p.routeRequest(ctx(), recReq(body, nil))
		if q := p.rec.take(); len(q) != 0 {
			t.Errorf("%s: recorded %v", name, q)
		}
	}

	p.routeRequest(ctx(), recReq(first, nil))
	p.routeRequest(ctx(), recReq(`{"p":"abc123def456","s":1,"e":[[900,"c",10,20,"body>a:nth-of-type(1)",0]]}`, nil))
	// Same id from another visitor: ignored.
	p.routeRequest(ctx(), recReq(`{"p":"abc123def456","s":2,"e":[[950,"m",1,1]]}`, map[string]string{"x-forwarded-for": "198.51.100.1"}))
	q := p.rec.take()
	if len(q) != 2 {
		t.Fatalf("queue = %v", q)
	}
	meta, _ := q[0]["meta"].(map[string]any)
	if meta["path"] != "/tours" || meta["url"] != "https://example.com/tours" || meta["device"] != "mobile" || meta["visitor_id"] == "" {
		t.Errorf("meta = %v", meta)
	}
	if q[1]["t"] != 900 || q[1]["meta"] != nil {
		t.Errorf("second chunk = %v", q[1])
	}
}

func TestRecordScriptInjectedOnlyWhenOn(t *testing.T) {
	p, _ := newTestPlugin(t)
	payload := func() []byte {
		b, _ := json.Marshal(map[string]any{"html": "<html><body><p>x</p></body></html>", "path": "/", "host": "example.com",
			"node": map[string]any{"id": 3}})
		return b
	}
	if r := p.handleTransform(payload()); r.Handled {
		t.Fatal("idle without signals or recordings")
	}
	withRecordings(p)
	r := p.handleTransform(payload())
	if !strings.Contains(string(r.Result), `src="/_s/r.js?v=`+recScriptVersion+`" data-api="/_s/r" data-rate="100"`) {
		t.Fatalf("script tag missing: %s", r.Result)
	}
	if strings.Contains(string(r.Result), "data-sq-b") || strings.Contains(string(r.Result), "<style") {
		t.Error("in-page signals must stay off when only recordings are on")
	}
	if strings.Contains(string(r.Result), "data-consent") {
		t.Error("consent attribute without consent mode")
	}
	cfg := *p.config()
	cfg.RecordingConsent = true
	if tag := recScriptTag(&cfg); !strings.Contains(tag, `data-consent="1"`) {
		t.Errorf("consent mode tag = %s", tag)
	}
	js := p.routeRequest(ctx(), pbReq("GET", "/_s/r.js", nil, nil))
	if js.StatusCode != 200 || !strings.Contains(js.Headers["Content-Type"], "javascript") || len(js.Body) < 1000 {
		t.Errorf("script response %d %v", js.StatusCode, js.Headers)
	}
}

func TestResetNeedsConfirmation(t *testing.T) {
	p, h := newTestPlugin(t)
	for _, body := range []string{`{"scope":"all"}`, `{"scope":"all","confirm":"recordings"}`, `{"scope":"everything","confirm":"everything"}`} {
		if resp, _ := doRequest(p, "POST", "/reset", nil, body); resp.StatusCode != 400 {
			t.Errorf("%s: %d", body, resp.StatusCode)
		}
	}
	if resp, _ := doRequest(p, "POST", "/reset", nil, `{"scope":"recordings","confirm":"recordings"}`); resp.StatusCode != 200 {
		t.Fatalf("reset: %d %s", resp.StatusCode, resp.Body)
	}
	last := h.Calls[len(h.Calls)-1]
	if last.Fn != "analytics_reset" || last.Args[0] != "recordings" {
		t.Errorf("call = %+v", last)
	}
}

// TestPostgresRecordings drives collect → store → list → replay → hotspots
// → delete → reset against a real database.
func TestPostgresRecordings(t *testing.T) {
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
	for _, f := range files {
		sql, _ := os.ReadFile(f)
		if err := db.Exec(string(sql)).Error; err != nil {
			t.Fatalf("%s: %v", f, err)
		}
	}
	db.Exec("TRUNCATE analytics_rec_views, analytics_rec_chunks, analytics_events, analytics_interactions, analytics_visits")
	p := newAnalyticsPlugin(ctxHost{coreapi.NewCoreImpl(db, nil, nil, nil, nil, nil, nil, nil)})
	now := time.Now().UTC()
	p.now = func() time.Time { return now }
	withRecordings(p)
	c := context.Background()

	send := func(ip, body string) {
		p.routeRequest(c, recReq(body, map[string]string{"x-forwarded-for": ip}))
	}
	// Two desktop views of /, one mobile.
	send("203.0.113.1", `{"p":"aaaa1111bbbb","s":0,"e":[[0,"s",0,0]],"m":{"u":"https://example.com/","w":1280,"h":800,"dh":2000}}`)
	send("203.0.113.1", `{"p":"aaaa1111bbbb","s":1,"e":[[500,"m",640,400],[1000,"s",0,600],[1500,"c",650,100,"#cta",  "https://example.com/contact"],[1600,"d",2400]]}`)
	send("203.0.113.2", `{"p":"cccc2222dddd","s":0,"e":[[0,"s",0,0]],"m":{"u":"https://example.com/","w":1440,"h":900,"dh":2000}}`)
	send("203.0.113.2", `{"p":"cccc2222dddd","s":1,"e":[[3000,"c",720,50,"#cta","https://example.com/contact"],[4000,"x"]]}`)
	send("203.0.113.3", `{"p":"eeee3333ffff","s":0,"e":[[0,"s",0,0],[200,"m",10,10]],"m":{"u":"https://example.com/","w":390,"h":844,"dh":5000}}`)
	// A chunk replayed by the browser: stored once.
	send("203.0.113.2", `{"p":"cccc2222dddd","s":1,"e":[[3000,"c",720,50,"#cta","https://example.com/contact"],[4000,"x"]]}`)
	p.flushRecordings(c)

	var v struct {
		Clicks, DurationMs, MaxScroll, Dh, Events int
	}
	db.Raw("SELECT clicks, duration_ms, max_scroll, dh, events FROM analytics_rec_views WHERE pid = 'aaaa1111bbbb'").Scan(&v)
	if v.Clicks != 1 || v.DurationMs != 1600 || v.MaxScroll != 1400 || v.Dh != 2400 || v.Events != 5 {
		t.Errorf("view facts = %+v", v)
	}
	var chunks int64
	db.Raw("SELECT count(*) FROM analytics_rec_chunks WHERE pid = 'cccc2222dddd'").Scan(&chunks)
	if chunks != 2 {
		t.Errorf("chunks = %d, want 2 (replayed chunk stored once)", chunks)
	}

	_, list := doRequest(p, "GET", "/recordings", map[string]string{"device": "desktop"}, "")
	if list["total"] != 2.0 {
		t.Fatalf("list = %v", list)
	}
	_, clicked := doRequest(p, "GET", "/recordings", map[string]string{"clicked": "1", "min_s": "2"}, "")
	if clicked["total"] != 1.0 {
		t.Errorf("clicked+min_s list = %v", clicked)
	}
	_, one := doRequest(p, "GET", "/recordings/aaaa1111bbbb", nil, "")
	evs, _ := one["events"].([]any)
	meta, _ := one["meta"].(map[string]any)
	if len(evs) != 5 || meta["path"] != "/" || meta["visitor_id"] != nil {
		t.Errorf("replay = %v", one)
	}
	if resp, _ := doRequest(p, "GET", "/recordings/nope", nil, ""); resp.StatusCode != 404 {
		t.Errorf("unknown recording = %d", resp.StatusCode)
	}

	_, hs := doRequest(p, "GET", "/hotspots", map[string]string{"path": "/"}, "")
	if hs["device"] != "desktop" || hs["views"] != 2.0 {
		t.Fatalf("hotspots = %v", hs)
	}
	sels, _ := hs["selectors"].([]any)
	if len(sels) != 1 || sels[0].(map[string]any)["clicks"] != 2.0 || sels[0].(map[string]any)["selector"] != "#cta" {
		t.Errorf("selectors = %v", sels)
	}
	cl, _ := hs["clicks"].([]any)
	// x is relative to the viewport centre: 650-640 and 720-720.
	pts := map[[2]float64]bool{}
	for _, x := range cl {
		pt := x.([]any)
		pts[[2]float64{pt[0].(float64), pt[1].(float64)}] = true
	}
	if len(cl) != 2 || !pts[[2]float64{10, 700}] || !pts[[2]float64{0, 50}] {
		t.Errorf("clicks = %v", cl)
	}
	reach, _ := hs["reach"].([]any)
	if len(reach) == 0 || reach[0] != 2.0 || reach[len(reach)-1] != 1.0 {
		t.Errorf("reach = %v", reach)
	}

	// Frustration signals and Web Vitals (a tablet, so desktop heatmaps above are unchanged).
	send("203.0.113.4", `{"p":"gggg4444hhhh","s":0,"e":[[0,"s",0,0],[10,"w","ttfb",120]],"m":{"u":"https://example.com/pricing","w":900,"h":1000,"dh":3000}}`)
	send("203.0.113.4", `{"p":"gggg4444hhhh","s":1,"e":[[100,"w","lcp",5200],[300,"c",5,5,"#price",0],[400,"c",5,5,"#price",0],[500,"c",5,5,"#price",0],[500,"g",5,5,"#price"],[1500,"k",5,5,"#price"],[1600,"e","x is not defined","app.js",12],[1700,"w","cls",300],[1800,"w","lcp",5600]]}`)
	p.flushRecordings(c)
	var sg struct{ Rage, Dead, Errors, Lcp, Cls, Ttfb int }
	db.Raw("SELECT rage, dead, errors, lcp, cls, ttfb FROM analytics_rec_views WHERE pid = 'gggg4444hhhh'").Scan(&sg)
	if sg.Rage != 1 || sg.Dead != 1 || sg.Errors != 1 || sg.Lcp != 5600 || sg.Cls != 300 || sg.Ttfb != 120 {
		t.Errorf("signals = %+v", sg)
	}
	for sig, want := range map[string]float64{"rage": 1, "dead": 1, "error": 1, "slow": 1} {
		if _, r := doRequest(p, "GET", "/recordings", map[string]string{"signal": sig}, ""); r["total"] != want {
			t.Errorf("signal %s list = %v", sig, r["total"])
		}
	}
	if resp, _ := doRequest(p, "GET", "/recordings", map[string]string{"signal": "x"}, ""); resp.StatusCode != 400 {
		t.Errorf("bad signal = %d", resp.StatusCode)
	}
	_, ins := doRequest(p, "GET", "/recordings/insights", nil, "")
	tot, _ := ins["totals"].(map[string]any)
	if tot["recordings"] != 4.0 || tot["rage"] != 1.0 || tot["errors"] != 1.0 || tot["slow"] != 1.0 {
		t.Errorf("insights totals = %v", ins["totals"])
	}
	els, _ := ins["elements"].([]any)
	errs, _ := ins["errors"].([]any)
	if len(els) != 2 || els[0].(map[string]any)["selector"] != "#price" || len(errs) != 1 || errs[0].(map[string]any)["message"] != "x is not defined" {
		t.Errorf("insights where = %v / %v", els, errs)
	}
	if sv, _ := ins["site_vitals"].(map[string]any); sv["lcp"] == nil {
		t.Errorf("site vitals = %v", ins["site_vitals"])
	}

	if resp, _ := doRequest(p, "DELETE", "/recordings/eeee3333ffff", nil, ""); resp.StatusCode != 200 {
		t.Errorf("delete = %d", resp.StatusCode)
	}
	db.Raw("SELECT count(*) FROM analytics_rec_chunks WHERE pid = 'eeee3333ffff'").Scan(&chunks)
	if chunks != 0 {
		t.Error("chunks must go with their view")
	}
	if resp, _ := doRequest(p, "POST", "/reset", nil, `{"scope":"recordings","confirm":"recordings"}`); resp.StatusCode != 200 {
		t.Fatalf("reset = %d %s", resp.StatusCode, resp.Body)
	}
	var left int64
	db.Raw("SELECT count(*) FROM analytics_rec_views").Scan(&left)
	if left != 0 {
		t.Errorf("views after reset = %d", left)
	}
	if resp, _ := doRequest(p, "POST", "/reset", nil, `{"scope":"all","confirm":"all"}`); resp.StatusCode != 200 {
		t.Fatalf("reset all = %d %s", resp.StatusCode, resp.Body)
	}
}

func TestReplayFramesAreNeverMeasured(t *testing.T) {
	for _, c := range []struct {
		q, ref, dest string
		want         bool
	}{
		{"sq_replay=1", "", "document", true},
		{"", "https://example.com/about?sq_replay=1", "", true},
		{"", "https://example.com/admin/ext/analytics/recordings", "iframe", true},
		{"", "https://example.com/admin/ext/analytics/recordings", "document", false},
		{"", "https://example.com/blog", "iframe", false},
		{"utm_source=x", "https://google.com/", "document", false},
	} {
		if got := isReplayFrame(c.q, c.ref, c.dest); got != c.want {
			t.Errorf("isReplayFrame(%q, %q, %q) = %v", c.q, c.ref, c.dest, got)
		}
	}
	p, _ := newTestPlugin(t)
	withRecordings(p)
	b, _ := json.Marshal(map[string]any{"html": "<html><body>x</body></html>", "path": "/", "host": "example.com",
		"node": map[string]any{"id": 3}, "user": map[string]any{"id": 1}})
	cfg := *p.config()
	cfg.ExcludeLoggedIn = false
	p.cfg.Store(&cfg)
	if r := p.handleTransform(b); strings.Contains(string(r.Result), "r.js") {
		t.Error("signed-in users must never get the recorder")
	}
	r := browserRecord("/")
	r.Query = "sq_replay=1"
	p.ingestBatch(batchPayload{Records: []Record{r}})
	if n := len(bufferedEvents(p)); n != 0 {
		t.Errorf("replay frame load counted: %d events", n)
	}
}
