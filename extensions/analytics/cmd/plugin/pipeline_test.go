package main

import (
	"strings"
	"testing"
	"time"
)

func TestNormalizePathAndScope(t *testing.T) {
	cases := map[string]string{
		"/":                   "/",
		"/En/Tours/":          "/en/tours",
		"/tours?utm_source=x": "/tours",
		"//double//slash/":    "/double/slash",
		"/page#frag":          "/page",
		"":                    "/",
	}
	for in, want := range cases {
		if got := normalizePath(in); got != want {
			t.Errorf("normalizePath(%q) = %q, want %q", in, got, want)
		}
	}
	cfg := defaultConfig()
	for _, p := range []string{"/admin", "/admin/api/x", "/api/v1/x", "/mcp", "/_s/b", "/go/wa", "/themes/a.css", "/extensions/x/y.js", "/media/cache/a.webp"} {
		if !isHardExcluded(p, &cfg) {
			t.Errorf("%s should be excluded", p)
		}
	}
	for _, p := range []string{"/", "/administration", "/gold", "/media/uploads/x.pdf", "/en/tours"} {
		if isHardExcluded(p, &cfg) {
			t.Errorf("%s should not be excluded", p)
		}
	}
	cfg.ExcludePaths = []string{"/preview/*", "/internal"}
	if !isUserExcluded("/preview/a/b", &cfg) || !isUserExcluded("/internal", &cfg) || isUserExcluded("/internal-tours", &cfg) {
		t.Error("exclude globs mismatch")
	}
	if !globMatch("/forms/submit/*", "/forms/submit/contact") || globMatch("/forms/submit/*", "/forms/other") {
		t.Error("globMatch mismatch")
	}
}

func TestDetectKind(t *testing.T) {
	cfg := defaultConfig()
	html := browserRecord("/")
	cases := []struct {
		name   string
		mutate func(r *Record)
		ext    string
		want   string
	}{
		{"html 200", func(r *Record) {}, "", kindPageview},
		{"304 document", func(r *Record) { r.Status = 304; r.ContentType = "" }, "", kindPageview},
		{"304 asset", func(r *Record) {
			r.Status = 304
			r.ContentType = ""
			r.Headers = map[string]string{"accept": "image/*", "sec-fetch-dest": "image"}
		}, "", ""},
		{"404 html", func(r *Record) { r.Status = 404 }, "", kindNotFound},
		{"json 200", func(r *Record) { r.ContentType = "application/json" }, "", ""},
		{"post", func(r *Record) { r.Method = "POST" }, "", ""},
		{"pdf", func(r *Record) { r.ContentType = "application/pdf" }, "pdf", kindDownload},
		{"pdf 206", func(r *Record) { r.Status = 206; r.ContentType = "application/pdf" }, "pdf", kindDownload},
		{"pdf 404", func(r *Record) { r.Status = 404 }, "pdf", ""},
	}
	for _, c := range cases {
		r := html
		r.Headers = map[string]string{}
		for k, v := range html.Headers {
			r.Headers[k] = v
		}
		c.mutate(&r)
		if got := detectKind(&r, c.ext, &cfg); got != c.want {
			t.Errorf("%s: kind %q, want %q", c.name, got, c.want)
		}
	}
}

func TestVisitorHashRotationAndIPv6(t *testing.T) {
	if got := normalizeIP("2001:db8:abcd:12:1111:2222:3333:4444"); got != "2001:db8:abcd:12::/64" {
		t.Errorf("ipv6 /64 = %q", got)
	}
	if normalizeIP("203.0.113.7") != "203.0.113.7" || normalizeIP("::ffff:203.0.113.7") != "203.0.113.7" {
		t.Error("ipv4 normalisation")
	}
	if primaryLanguage("en-GB,en;q=0.9") != "en" || primaryLanguage("vi") != "vi" || primaryLanguage("*") != "" {
		t.Error("primaryLanguage")
	}
	s := newSaltKeeper()
	rotated := 0
	s.onRotate = []func(){func() { rotated++ }}
	loc, _ := time.LoadLocation("Asia/Ho_Chi_Minh")
	day1 := time.Date(2026, 10, 23, 16, 59, 0, 0, time.UTC) // 23:59 local
	day2 := day1.Add(2 * time.Minute)                       // 00:01 local next day
	a := visitorHash(s.current(day1, loc), "example.com", "2001:db8::1", "UA", "en")
	b := visitorHash(s.current(day1, loc), "example.com", "2001:db8::ffff", "UA", "en")
	if a != b || len(a) != 16 {
		t.Errorf("same /64 should hash equal: %s %s", a, b)
	}
	if c := visitorHash(s.current(day1, loc), "example.com", "2001:db8::1", "UA", "vi"); c == a {
		t.Error("language must change the hash")
	}
	if !s.nextRotation().Equal(time.Date(2026, 10, 24, 0, 0, 0, 0, loc)) {
		t.Errorf("rotation at %v", s.nextRotation())
	}
	if d := visitorHash(s.current(day2, loc), "example.com", "2001:db8::1", "UA", "en"); d == a {
		t.Error("salt must rotate at local midnight")
	}
	if rotated != 1 {
		t.Errorf("rotate hooks ran %d times", rotated)
	}
}

func TestSessionsAndPipeline(t *testing.T) {
	p, _ := newTestPlugin(t)
	r1 := browserRecord("/")
	r1.Referer = "https://www.google.com/"
	r1.Query = "utm_campaign=Autumn&gclid=zzz&secret=1"
	r1.Headers["cf-ipcountry"] = "vn"
	r2 := browserRecord("/Tours/")
	r2.TS = testNow.Add(time.Minute)
	r2.Referer = "https://example.com/"
	r2.Headers["sec-fetch-site"] = "same-origin"
	r3 := browserRecord("/later")
	r3.TS = testNow.Add(2 * time.Hour) // after the 30 min idle timeout
	p.ingestBatch(batchPayload{Records: []Record{r1, r2, r3}, Dropped: 3})

	ev := bufferedEvents(p)
	if len(ev) != 3 {
		t.Fatalf("events = %d", len(ev))
	}
	if !ev[0].Entry || ev[1].Entry || !ev[2].Entry {
		t.Errorf("entry flags %v %v %v", ev[0].Entry, ev[1].Entry, ev[2].Entry)
	}
	if ev[0].SessionID == "" || ev[0].SessionID != ev[1].SessionID || ev[2].SessionID == ev[0].SessionID {
		t.Error("session ids wrong")
	}
	if ev[1].Source != "Google" || ev[1].Channel != chPaidSearch || ev[1].UTMCampaign != "Autumn" || !ev[1].ClickGclid {
		t.Errorf("attribution not carried: %+v", ev[1])
	}
	if ev[1].Path != "/tours" || ev[0].Country != "VN" || ev[0].Device != "desktop" || ev[0].Browser != "Chrome" {
		t.Errorf("enrichment: %+v", ev[0])
	}
	if p.droppedTotal.Load() != 3 || p.lastRecordAt.Load() != r3.TS.UnixNano() {
		t.Error("status counters")
	}
	for _, e := range ev {
		if strings.Contains(e.VisitorID+e.Path+e.Referrer, "203.0.113") || strings.Contains(e.Path, "secret") {
			t.Error("raw IP or query leaked into event")
		}
	}
}

func TestPipelineBotsGPCPrefetchExclusions(t *testing.T) {
	p, _ := newTestPlugin(t)
	bot := browserRecord("/")
	bot.UserAgent = "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)"
	robots := browserRecord("/robots.txt")
	robots.UserAgent = "Googlebot/2.1"
	robots.ContentType = "text/plain"
	css := browserRecord("/assets/site.css")
	css.UserAgent = "curl/8"
	gpc := browserRecord("/gpc")
	gpc.Headers["sec-gpc"] = "1"
	pre := browserRecord("/prefetched")
	pre.Headers["sec-purpose"] = "prefetch"
	admin := browserRecord("/admin/api/ext/analytics/summary")
	logged := browserRecord("/members")
	logged.UserID = 4
	p.ingestBatch(batchPayload{Records: []Record{bot, robots, css, gpc, pre, admin, logged}})

	bots := bufferedBots(p)
	if bots[botKey{"2026-10-23", botAICrawler, "GPTBot"}] != 1 || bots[botKey{"2026-10-23", botSearch, "Googlebot"}] != 1 || len(bots) != 2 {
		t.Errorf("bots = %v", bots)
	}
	ev := bufferedEvents(p)
	if len(ev) != 2 {
		t.Fatalf("events = %+v", ev)
	}
	if ev[0].Path != "/gpc" || ev[0].VisitorID != "" || ev[0].SessionID != "" || !ev[0].Entry {
		t.Errorf("gpc event %+v", ev[0])
	}
	if !ev[1].IsPrefetch || ev[1].Entry || ev[1].SessionID != "" {
		t.Errorf("prefetch must not start a session: %+v", ev[1])
	}
}

func TestPipelineRateLimitGoalsAndDownloads(t *testing.T) {
	p, _ := newTestPlugin(t)
	p.goals.Store(&[]Goal{
		{ID: 1, Name: "Contact", Kind: "request", Method: "POST", PathPattern: "/forms/submit/*"},
		{ID: 2, Name: "Thanks", Kind: "pageview", PathPattern: "/thank-you"},
	})
	var recs []Record
	for i := 0; i < 65; i++ {
		r := browserRecord("/spam")
		r.IP = "198.51.100.9"
		r.TS = testNow.Add(time.Duration(i) * 100 * time.Millisecond)
		recs = append(recs, r)
	}
	p.ingestBatch(batchPayload{Records: recs})
	if n := bufferedBots(p)[botKey{"2026-10-23", botOther, "High request rate"}]; n != 5 {
		t.Errorf("rate-limited hits = %d", n)
	}
	p.buf.take()

	view := browserRecord("/thank-you")
	submit := browserRecord("/forms/submit/contact")
	submit.Method, submit.Status, submit.ContentType = "POST", 303, ""
	failed := submit
	failed.Status = 422
	pdf := browserRecord("/files/brochure.PDF")
	pdf.ContentType = "application/pdf"
	pdf2 := pdf
	pdf2.Status = 206
	p.ingestBatch(batchPayload{Records: []Record{view, submit, failed, pdf, pdf2}})
	ev := bufferedEvents(p)
	kinds := []string{}
	for _, e := range ev {
		kinds = append(kinds, e.Kind)
	}
	if strings.Join(kinds, ",") != "pageview,goal,goal,download" {
		t.Fatalf("kinds = %v", kinds)
	}
	if ev[1].GoalID != 2 || ev[2].GoalID != 1 || ev[2].SessionID != ev[0].SessionID || ev[2].Path != "/forms/submit/contact" {
		t.Errorf("goal events %+v", ev[1:3])
	}
}

func TestBeaconCorrelation(t *testing.T) {
	p, _ := newTestPlugin(t)
	cfg := *p.config()
	cfg.EnhancedMode = true
	p.cfg.Store(&cfg)
	headers := map[string]string{
		"Host": "example.com", "X-Forwarded-For": "203.0.113.7", "Referer": "https://example.com/tours/",
		"User-Agent": browserRecord("/").UserAgent, "Accept-Language": "en-GB,en;q=0.9",
	}
	beacon := func(q map[string]string) {
		resp := p.routeRequest(ctx(), pbReq("GET", "/_s/b", headers, q))
		if resp.StatusCode != 200 || resp.Headers["Content-Type"] != "image/gif" || resp.Headers["Cache-Control"] == "" {
			t.Fatalf("beacon response %+v", resp)
		}
	}
	// Beacon first (kernel batches records), pageview second.
	beacon(map[string]string{"w": "m", "c": "d"})
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	ev := bufferedEvents(p)
	if len(ev) != 1 || !ev[0].Confirmed || ev[0].Viewport != "m" || ev[0].ColorScheme != "dark" {
		t.Fatalf("pending beacon not applied: %+v", ev)
	}
	// A late (print) beacon becomes a stored-event confirmation.
	beacon(map[string]string{"print": "1"})
	_, _, confirms := p.buf.take()
	if len(confirms) != 1 || !confirms[0].Printed || confirms[0].EID != ev[0].EID {
		t.Errorf("confirms = %+v", confirms)
	}
	if html := p.renderHook("render.head", []byte(`{"user":null}`)); !strings.Contains(html, "/_s/b?w=s&c=l") || !strings.Contains(html, "print=1") {
		t.Errorf("style = %s", html)
	}
	if html := p.renderHook("render.body_end", []byte(`{"user":{"id":1}}`)); html != "" {
		t.Error("logged-in users must not get the beacon")
	}
}
