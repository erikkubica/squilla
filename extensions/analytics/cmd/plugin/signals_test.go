package main

import (
	"testing"
	"time"
)

func sigPlugin(t *testing.T) (*AnalyticsPlugin, map[string]string) {
	p, _ := newTestPlugin(t)
	cfg := *p.config()
	cfg.EnhancedMode = true
	p.cfg.Store(&cfg)
	p.startedAt = testNow.Add(-time.Hour) // not in the post-start quiet period
	h := map[string]string{
		"Host": "example.com", "X-Forwarded-For": "203.0.113.7", "Referer": "https://example.com/tours/",
		"User-Agent": browserRecord("/").UserAgent, "Accept-Language": "en-GB,en;q=0.9",
	}
	return p, h
}

func send(p *AnalyticsPlugin, method, path string, h map[string]string, q map[string]string) {
	p.routeRequest(ctx(), pbReq(method, path, h, q))
}

func TestSignalsRecordedAgainstThePageview(t *testing.T) {
	p, h := sigPlugin(t)
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	ev := bufferedEvents(p)[0]
	p.buf.take()

	send(p, "GET", "/_s/b", h, map[string]string{"w": "s", "c": "l", "p": "12"})
	send(p, "GET", "/_s/t", h, map[string]string{"s": "10", "p": "12"})
	send(p, "GET", "/_s/t", h, map[string]string{"s": "10", "p": "12"}) // duplicate
	send(p, "GET", "/_s/t", h, map[string]string{"s": "7", "p": "12"})  // not a mark
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	send(p, "GET", "/_s/v", h, map[string]string{"k": "Bad Key!", "p": "12"}) // cleaned, still accepted
	send(p, "GET", "/_s/e", h, map[string]string{"p": "12"})
	send(p, "GET", "/_s/i", h, map[string]string{"k": "bv-faq.0", "t": "d", "p": "12"})
	ph := map[string]string{}
	for k, v := range h {
		ph[k] = v
	}
	ph["Ping-To"] = "https://wa.me/84969655521?text=hi"
	send(p, "POST", "/_s/c", ph, map[string]string{"k": "bv-hero.0", "p": "12"})
	send(p, "GET", "/_s/c", ph, map[string]string{"k": "bv-hero.0", "p": "12"}) // GET is not a ping

	inter := p.buf.takeInteractions()
	count := map[string]int{}
	for _, i := range inter {
		count[i.Kind]++
		if i.EID != ev.EID || i.Path != "/tours" || i.SessionID != ev.SessionID {
			t.Errorf("interaction not tied to the view: %+v", i)
		}
	}
	if count["dwell"] != 1 || count["section"] != 2 || count["end"] != 1 || count["toggle"] != 1 || count["click"] != 1 || len(inter) != 6 {
		t.Errorf("interactions = %+v", inter)
	}
	for _, i := range inter {
		if i.Kind == "click" && (i.Dest != "wa.me/84969655521" || i.Value != "c" || i.BlockKey != "bv-hero.0") {
			t.Errorf("click = %+v", i)
		}
	}
	_, _, confirms := p.buf.take()
	if len(confirms) != 1 || confirms[0].Viewport != "s" {
		t.Errorf("confirms = %+v", confirms)
	}
}

func TestSignalsBeforeTheRecordAreParkedThenApplied(t *testing.T) {
	p, h := sigPlugin(t)
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	send(p, "GET", "/_s/t", h, map[string]string{"s": "10", "p": "12"})
	if len(p.buf.takeInteractions()) != 0 {
		t.Fatal("nothing can be stored before the pageview exists")
	}
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	send(p, "GET", "/_s/t", h, map[string]string{"s": "10", "p": "12"})
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	if got := len(p.buf.takeInteractions()); got != 2 {
		t.Fatalf("parked signals applied = %d, want 2 (deduped)", got)
	}
}

func TestOrphanActivationCreatesOneCachedView(t *testing.T) {
	p, h := sigPlugin(t)
	send(p, "GET", "/_s/b", h, map[string]string{"w": "m", "c": "l", "p": "12"})
	send(p, "GET", "/_s/b", h, map[string]string{"w": "l", "c": "l", "p": "12"}) // rotation: no second view
	ev := bufferedEvents(p)
	if len(ev) != 1 || !ev[0].Cached || !ev[0].Confirmed || ev[0].Path != "/tours" || ev[0].Viewport != "m" || ev[0].SessionID == "" || !ev[0].Entry {
		t.Fatalf("events = %+v", ev)
	}
	// Right after a plugin start nothing is synthesised.
	p2, h2 := sigPlugin(t)
	p2.startedAt = testNow.Add(-time.Minute)
	send(p2, "GET", "/_s/b", h2, map[string]string{"w": "m", "c": "l", "p": "12"})
	if len(bufferedEvents(p2)) != 0 {
		t.Error("view synthesised during the quiet period")
	}
}

func TestSignalsRespectOptOutGPCBotsAndOff(t *testing.T) {
	p, h := sigPlugin(t)
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	p.buf.take()
	with := func(k, v string) map[string]string {
		m := map[string]string{}
		for a, b := range h {
			m[a] = b
		}
		m[k] = v
		return m
	}
	q := map[string]string{"k": "bv-hero.0", "p": "12"}
	send(p, "GET", "/_s/v", with("Cookie", optOutCookie+"=1"), q)
	send(p, "GET", "/_s/v", with("Sec-GPC", "1"), q)
	send(p, "GET", "/_s/v", with("User-Agent", "Googlebot/2.1"), q)
	send(p, "GET", "/_s/v", with("Sec-Purpose", "prefetch;prerender"), q)
	send(p, "GET", "/_s/v", with("Referer", "https://evil.example/tours"), q)
	send(p, "GET", "/_s/v", with("Sec-Fetch-Site", "cross-site"), q)
	if n := len(p.buf.takeInteractions()); n != 0 {
		t.Fatalf("%d signals slipped through", n)
	}
	cfg := *p.config()
	cfg.EnhancedMode = false
	p.cfg.Store(&cfg)
	send(p, "GET", "/_s/v", h, q)
	if len(p.buf.takeInteractions()) != 0 {
		t.Error("signals recorded while disabled")
	}
}

func TestSignalRateCapAndBufferCaps(t *testing.T) {
	p, h := sigPlugin(t)
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	p.buf.take()
	for i := 0; i < 400; i++ {
		send(p, "GET", "/_s/v", h, map[string]string{"k": "k" + itoa(i), "p": "12"})
	}
	if n := len(p.buf.takeInteractions()); n > signalsPerMin {
		t.Errorf("per-visitor cap exceeded: %d", n)
	}
	for i := 0; i < maxInteractions+10; i++ {
		p.buf.addInteraction(Interaction{Kind: "section"})
	}
	if len(p.buf.takeInteractions()) != maxInteractions || p.buf.interLost != 10 {
		t.Error("interaction buffer must be capped and count drops")
	}
}
