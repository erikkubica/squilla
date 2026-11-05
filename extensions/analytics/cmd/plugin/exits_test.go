package main

import (
	"strings"
	"testing"
	"time"
)

func TestClassifyExit(t *testing.T) {
	base := sessionFacts{Pages: 1, S1: true}
	cases := []struct {
		name   string
		mutate func(f *sessionFacts)
		want   string
		flags  string
	}{
		{"converted wins", func(f *sessionFacts) { f.Converted, f.OutAfterLast, f.OutDest = true, true, "wa.me/1" }, exitConverted, ""},
		{"whatsapp via /go", func(f *sessionFacts) { f.OutAfterLast, f.OutDest = true, "wa.me/84123" }, exitToContact, ""},
		{"contact click class", func(f *sessionFacts) { f.ClickClass, f.ClickDest = "c", "mailto:hi@x" }, exitToContact, ""},
		{"partner", func(f *sessionFacts) { f.ClickClass, f.ClickDest = "x", "getyourguide.com/x" }, exitToPartner, ""},
		{"error last", func(f *sessionFacts) { f.ErrorAfterLast = true }, exitHitError, ""},
		{"browsed", func(f *sessionFacts) { f.Pages = 3 }, exitBrowsed, ""},
		{"single page without signals", func(f *sessionFacts) { f.S1 = false }, exitSinglePage, ""},
		{"quick", func(f *sessionFacts) { f.DwellS = 0 }, exitQuick, ""},
		{"skimmed", func(f *sessionFacts) { f.DwellS = 30 }, exitSkimmed, ""},
		{"read by dwell", func(f *sessionFacts) { f.DwellS = 90 }, exitReadAndLeft, ""},
		{"read by end", func(f *sessionFacts) { f.EndReached = true }, exitReadAndLeft, ""},
		{"ambiguous exit", func(f *sessionFacts) { f.S1, f.SpecAfterLast = false, true }, exitSinglePage, flagExitAmbiguous},
	}
	for _, c := range cases {
		f := base
		c.mutate(&f)
		got, flags := classifyExit(f)
		if got != c.want || strings.Join(flags, ",") != c.flags {
			t.Errorf("%s: got %s %v, want %s %q", c.name, got, flags, c.want, c.flags)
		}
	}
}

func TestSaltCarryOverKeepsSessionAcrossMidnight(t *testing.T) {
	p, _ := newTestPlugin(t)
	cfg := p.config()
	loc := cfg.location()
	night := time.Date(2026, 10, 23, 23, 50, 0, 0, loc)
	p.now = func() time.Time { return night }
	r := browserRecord("/tours")
	r.TS = night
	p.ingestBatch(batchPayload{Records: []Record{r}})
	first := bufferedEvents(p)[0]
	r2 := browserRecord("/about")
	r2.TS = night.Add(20 * time.Minute)
	p.now = func() time.Time { return r2.TS }
	p.ingestBatch(batchPayload{Records: []Record{r2}})
	ev := bufferedEvents(p)
	if len(ev) != 2 || ev[1].SessionID != first.SessionID || ev[1].Entry {
		t.Fatalf("session cut at midnight: %+v", ev)
	}
	if ev[1].VisitorID == first.VisitorID {
		t.Error("visitor id must still rotate")
	}
}

func TestOptOutCookieStopsMeasurementAndPageSetsIt(t *testing.T) {
	p, _ := newTestPlugin(t)
	r := browserRecord("/tours")
	r.Cookies = map[string]string{optOutCookie: "1"}
	p.ingestBatch(batchPayload{Records: []Record{r}})
	if len(bufferedEvents(p)) != 0 || len(bufferedBots(p)) != 0 {
		t.Fatal("opted-out visitor was measured")
	}
	resp := p.routeRequest(ctx(), pbReq("POST", "/_s/optout", map[string]string{"Sec-Fetch-Site": "same-origin"}, nil))
	if resp.StatusCode != 303 || !strings.Contains(resp.Headers["Set-Cookie"], optOutCookie+"=1") {
		t.Fatalf("opt-out response %+v", resp)
	}
	cross := p.routeRequest(ctx(), pbReq("POST", "/_s/optout", map[string]string{"Sec-Fetch-Site": "cross-site"}, nil))
	if cross.StatusCode != 403 {
		t.Errorf("cross-site POST = %d", cross.StatusCode)
	}
	page := p.routeRequest(ctx(), pbReq("GET", "/_s/optout", map[string]string{"Cookie": "a=b; " + optOutCookie + "=1"}, nil))
	if !strings.Contains(string(page.Body), "opted out") || page.Headers["Cache-Control"] != "no-store" {
		t.Errorf("page %s", page.Body)
	}
}
