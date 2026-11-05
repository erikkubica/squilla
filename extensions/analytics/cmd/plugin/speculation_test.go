package main

import (
	"errors"
	"testing"
)

// Safari's fallback prefetch is a plain fetch(): Accept */*, no Sec-Fetch-*.
// Once it announces itself with Purpose it must be stored as a speculative
// pageview, not counted as a "Generic client" bot.
func TestSpeculativeFallbackPrefetchIsNotABot(t *testing.T) {
	p, _ := newTestPlugin(t)
	safari := browserRecord("/tours")
	safari.UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15"
	safari.Headers = map[string]string{"accept": "*/*", "accept-language": "en-GB", "purpose": "prefetch"}
	firefox := browserRecord("/about")
	firefox.UserAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0"
	firefox.Headers = map[string]string{"accept": "*/*", "accept-language": "en-GB", "x-moz": "prefetch"}
	p.ingestBatch(batchPayload{Records: []Record{safari, firefox}})
	if bots := bufferedBots(p); len(bots) != 0 {
		t.Fatalf("speculative fetch classified as bot: %v", bots)
	}
	ev := bufferedEvents(p)
	if len(ev) != 2 || !ev[0].IsPrefetch || !ev[1].IsPrefetch {
		t.Fatalf("events = %+v", ev)
	}
}

// A scraper sending Purpose: prefetch still hits the UA and probe checks.
func TestSpoofedPurposeStaysABot(t *testing.T) {
	p, _ := newTestPlugin(t)
	r := browserRecord("/tours")
	r.UserAgent = "python-requests/2.31"
	r.Headers = map[string]string{"accept-language": "en", "purpose": "prefetch"}
	probe := browserRecord("/wp-login.php")
	probe.Headers["sec-purpose"] = "prefetch"
	p.ingestBatch(batchPayload{Records: []Record{r, probe}})
	if len(bufferedEvents(p)) != 0 || len(bufferedBots(p)) != 2 {
		t.Fatalf("events=%v bots=%v", bufferedEvents(p), bufferedBots(p))
	}
}

// A request carrying a same-site Referer proves the speculatively loaded
// page was shown: its stored row is confirmed exactly once.
func TestRefererActivatesSpeculativeRow(t *testing.T) {
	p, _ := newTestPlugin(t)
	pre := browserRecord("/tours")
	pre.Headers["sec-purpose"] = "prefetch;prerender"
	next := browserRecord("/contact")
	next.Referer = "https://example.com/tours/"
	again := browserRecord("/faq")
	again.Referer = "https://example.com/tours"
	p.ingestBatch(batchPayload{Records: []Record{pre, next, again}})
	ev := bufferedEvents(p)
	_, _, confirms := p.buf.take()
	if len(confirms) != 1 || confirms[0].EID != ev[0].EID {
		t.Fatalf("confirms = %+v (prefetch eid %s)", confirms, ev[0].EID)
	}
	// A foreign referer must not activate anything.
	p2, _ := newTestPlugin(t)
	foreign := browserRecord("/contact")
	foreign.Referer = "https://evil.example/tours"
	p2.ingestBatch(batchPayload{Records: []Record{pre, foreign}})
	if _, _, c := p2.buf.take(); len(c) != 0 {
		t.Errorf("foreign referer activated: %+v", c)
	}
}

func TestSpeculationNeverRecordsDownloadsNotFoundOrGoals(t *testing.T) {
	p, _ := newTestPlugin(t)
	pdf := browserRecord("/media/uploads/a.pdf")
	pdf.ContentType = "application/pdf"
	pdf.Headers["sec-purpose"] = "prefetch"
	nf := browserRecord("/nope")
	nf.Status = 404
	nf.Headers["sec-purpose"] = "prefetch"
	p.ingestBatch(batchPayload{Records: []Record{pdf, nf}})
	if n := len(bufferedEvents(p)); n != 0 {
		t.Fatalf("events = %+v", bufferedEvents(p))
	}
}

func TestBeaconFromPrerenderIsIgnored(t *testing.T) {
	p, _ := newTestPlugin(t)
	cfg := *p.config()
	cfg.EnhancedMode = true
	p.cfg.Store(&cfg)
	h := map[string]string{
		"Host": "example.com", "X-Forwarded-For": "203.0.113.7", "Referer": "https://example.com/tours/",
		"User-Agent": browserRecord("/").UserAgent, "Accept-Language": "en-GB,en;q=0.9", "Sec-Purpose": "prefetch;prerender",
	}
	p.routeRequest(ctx(), pbReq("GET", "/_s/b", h, map[string]string{"w": "m", "c": "l"}))
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	ev := bufferedEvents(p)
	_, _, confirms := p.buf.take()
	if len(ev) != 1 || ev[0].Confirmed || len(confirms) != 0 {
		t.Fatalf("prerender beacon confirmed a view: %+v %+v", ev, confirms)
	}
}

func TestGoLinkSpeculativeRequestIsRefused(t *testing.T) {
	p, _ := newTestPlugin(t)
	m := map[string]Link{"wa": {Slug: "wa", Destination: "https://wa.me/1"}}
	p.links.Store(&m)
	resp := p.routeRequest(ctx(), pbReq("GET", "/go/wa", map[string]string{"Sec-Purpose": "prefetch", "User-Agent": browserRecord("/").UserAgent}, nil))
	if resp.StatusCode != 503 || resp.Headers["Location"] != "" {
		t.Fatalf("resp = %+v", resp)
	}
	if len(bufferedEvents(p)) != 0 {
		t.Error("speculative /go/ recorded a click")
	}
}

// A failed confirmation flush must keep the confirmations for the next try.
func TestConfirmationsRequeuedOnFailure(t *testing.T) {
	p, h := newTestPlugin(t)
	h.CallStub["analytics_confirm_batch"] = func([]any) ([]map[string]any, error) { return nil, errors.New("db down") }
	p.buf.addConfirm(confirmation{EID: "a", Since: testNow})
	p.buf.addConfirm(confirmation{EID: "b", Since: testNow})
	p.flush(ctx())
	if _, _, c := p.buf.take(); len(c) != 2 || c[0].EID != "a" {
		t.Fatalf("confirmations lost: %+v", c)
	}
	// An ingest failure requeues them too (they must not precede their event).
	delete(h.CallStub, "analytics_confirm_batch")
	h.CallStub["analytics_ingest"] = func([]any) ([]map[string]any, error) { return nil, errors.New("db down") }
	p.buf.addEvent(Event{EID: "e1", TS: testNow, Kind: kindPageview})
	p.buf.addConfirm(confirmation{EID: "e1", Since: testNow})
	p.flush(ctx())
	if _, _, c := p.buf.take(); len(c) != 1 {
		t.Fatalf("confirmation dropped after ingest failure: %+v", c)
	}
}
