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

	send(p, "GET", "/_s/m", h, map[string]string{"w": "s", "c": "l", "p": "12"})
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
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
	if len(confirms) != 2 || !confirms[0].Meta || confirms[0].Viewport != "s" || confirms[1].Meta || confirms[1].EID != ev.EID {
		t.Errorf("confirms = %+v (device facts must not confirm; activation must)", confirms)
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

// Opening a page again: the second document activates before its record
// arrives. Its activation and first signals must wait for that record, not
// be dropped as repeats of the previous view.
func TestRepeatViewOfTheSamePageIsMeasured(t *testing.T) {
	p, h := sigPlugin(t)
	p.ingestBatch(batchPayload{Records: []Record{browserRecord("/tours")}})
	first := bufferedEvents(p)[0]
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	p.buf.take()
	p.buf.takeInteractions()

	later := testNow.Add(5 * time.Minute)
	p.now = func() time.Time { return later.Add(1200 * time.Millisecond) }
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	if _, _, confirms := p.buf.take(); len(confirms) != 0 {
		t.Fatalf("activation filed under the previous view: %+v", confirms)
	}
	if got := p.buf.takeInteractions(); len(got) != 0 {
		t.Fatalf("signals filed under the previous view: %+v", got)
	}

	r := browserRecord("/tours")
	r.TS = later
	p.ingestBatch(batchPayload{Records: []Record{r}})
	evs, _, confirms := p.buf.take()
	if len(evs) != 1 || evs[0].EID == first.EID {
		t.Fatalf("second view = %+v", evs)
	}
	if len(confirms) != 1 || confirms[0].EID != evs[0].EID {
		t.Errorf("confirms = %+v, want the second view confirmed", confirms)
	}
	inter := p.buf.takeInteractions()
	if len(inter) != 1 || inter[0].EID != evs[0].EID || inter[0].Kind != "section" {
		t.Errorf("interactions = %+v, want the section tied to the second view", inter)
	}

	// Later signals of the second view go straight to it.
	p.now = func() time.Time { return later.Add(10 * time.Second) }
	send(p, "GET", "/_s/t", h, map[string]string{"s": "10", "p": "12"})
	if inter := p.buf.takeInteractions(); len(inter) != 1 || inter[0].EID != evs[0].EID {
		t.Errorf("dwell mark = %+v", inter)
	}
}

// clock drives p.now in milliseconds after testNow; rec is a /tours record
// whose request started then.
func clock(p *AnalyticsPlugin) (at func(ms int), rec func(ms int) Record) {
	at = func(ms int) { p.now = func() time.Time { return testNow.Add(time.Duration(ms) * time.Millisecond) } }
	rec = func(ms int) Record {
		r := browserRecord("/tours")
		r.TS = testNow.Add(time.Duration(ms) * time.Millisecond)
		return r
	}
	return at, rec
}

func countedConfirms(confirms []confirmation, eid string) (n int) {
	for _, c := range confirms {
		if !c.Meta && c.EID == eid {
			n++
		}
	}
	return n
}

// The usual first view: its viewport facts and activation reach the plugin
// before the kernel delivers its record (batched). One view, confirmed, with
// its viewport — not an extra "cached" view for the early activation.
func TestActivationBeforeItsRecordIsOneView(t *testing.T) {
	p, h := sigPlugin(t)
	at, rec := clock(p)
	at(300)
	send(p, "GET", "/_s/m", h, map[string]string{"w": "s", "c": "d", "p": "12"})
	at(1050)
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
	if len(bufferedEvents(p)) != 0 {
		t.Fatal("a view was created before its record had a chance to arrive")
	}
	at(1900)
	p.ingestBatch(batchPayload{Records: []Record{rec(0)}})
	p.settleOrphans(testNow.Add(time.Minute))
	evs, _, confirms := p.buf.take()
	if len(evs) != 1 || evs[0].Cached {
		t.Fatalf("events = %+v, want the recorded view only", evs)
	}
	if countedConfirms(confirms, evs[0].EID) != 1 {
		t.Errorf("confirms = %+v, want the view confirmed", confirms)
	}
	var vp bool
	for _, c := range confirms {
		vp = vp || (c.Meta && c.EID == evs[0].EID && c.Viewport == "s" && c.ColorScheme == "dark")
	}
	if !vp {
		t.Errorf("confirms = %+v, want the viewport facts", confirms)
	}
}

// The real-browser sequence on a site whose pages may be cached for a
// minute: the first view, a repeat view served from the browser cache (no
// request on record) and then a reload. Records reach the plugin about a
// second after their request. Three views: the cached one synthesised, the
// reload confirmed by its own activation, not the cached view's.
func TestCachedRepeatThenReloadIsMeasured(t *testing.T) {
	p, h := sigPlugin(t)
	at, rec := clock(p)
	meta := map[string]string{"w": "l", "c": "l", "p": "12"}
	act := map[string]string{"p": "12"}

	at(350)
	send(p, "GET", "/_s/m", h, meta)
	at(1000)
	p.ingestBatch(batchPayload{Records: []Record{rec(0)}})
	at(1470)
	send(p, "GET", "/_s/b", h, act)
	first := bufferedEvents(p)[0]
	p.buf.take()

	// Cached repeat view: beacons only.
	at(6600)
	send(p, "GET", "/_s/m", h, meta)
	at(7680)
	send(p, "GET", "/_s/b", h, act)
	at(8000)
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})

	// Reload: request at 10.18 s, its beacons, its record delivered at 11 s.
	at(10250)
	send(p, "GET", "/_s/m", h, meta)
	at(11000)
	p.ingestBatch(batchPayload{Records: []Record{rec(10180)}})
	at(11300)
	send(p, "GET", "/_s/b", h, act)

	evs, _, confirms := p.buf.take()
	if len(evs) != 1 || evs[0].EID == first.EID || evs[0].Cached {
		t.Fatalf("reload view = %+v", evs)
	}
	reload := evs[0]
	if countedConfirms(confirms, reload.EID) != 1 {
		t.Errorf("confirms = %+v, want the reload confirmed once", confirms)
	}

	// No record ever came for the cached view: it becomes one, with its
	// section signal, once the wait is over.
	p.settleOrphans(testNow.Add(7680*time.Millisecond + orphanWait - time.Millisecond))
	if n := len(bufferedEvents(p)); n != 0 {
		t.Fatalf("cached view settled before the wait was over (%d events)", n)
	}
	p.settleOrphans(testNow.Add(7680*time.Millisecond + orphanWait))
	evs, _, _ = p.buf.take()
	if len(evs) != 1 || !evs[0].Cached || !evs[0].Confirmed || !evs[0].TS.Equal(testNow.Add(7680*time.Millisecond)) {
		t.Fatalf("cached view = %+v", evs)
	}
	if inter := p.buf.takeInteractions(); len(inter) != 0 {
		t.Errorf("interactions = %+v; a newer view is on record, so the cached one keeps none", inter)
	}
	// Later signals still belong to the reload.
	at(20180)
	send(p, "GET", "/_s/t", h, map[string]string{"s": "10", "p": "12"})
	if inter := p.buf.takeInteractions(); len(inter) != 1 || inter[0].EID != reload.EID {
		t.Errorf("dwell mark = %+v, want it on the reload", inter)
	}
}

func TestOrphanActivationCreatesOneCachedView(t *testing.T) {
	p, h := sigPlugin(t)
	send(p, "GET", "/_s/m", h, map[string]string{"w": "m", "c": "l", "p": "12"})
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"}) // repeated request: no second view
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	p.settleOrphans(testNow.Add(orphanWait))
	ev := bufferedEvents(p)
	if len(ev) != 1 || !ev[0].Cached || !ev[0].Confirmed || ev[0].Path != "/tours" || ev[0].SessionID == "" || !ev[0].Entry {
		t.Fatalf("events = %+v", ev)
	}
	_, _, confirms := p.buf.take()
	if len(confirms) != 1 || !confirms[0].Meta || confirms[0].EID != ev[0].EID || confirms[0].Viewport != "m" {
		t.Errorf("confirms = %+v, want the cached view's viewport", confirms)
	}
	if inter := p.buf.takeInteractions(); len(inter) != 1 || inter[0].EID != ev[0].EID || inter[0].Kind != "section" {
		t.Errorf("interactions = %+v, want the section on the cached view", inter)
	}
	// Right after a plugin start nothing is synthesised.
	p2, h2 := sigPlugin(t)
	p2.startedAt = testNow.Add(-time.Minute)
	send(p2, "GET", "/_s/b", h2, map[string]string{"p": "12"})
	p2.settleOrphans(testNow.Add(orphanWait))
	if len(bufferedEvents(p2)) != 0 {
		t.Error("view synthesised during the quiet period")
	}
}

// A request repeated by the browser is the same document: it neither waits
// for a new record nor becomes a cached view.
func TestRepeatedActivationRequestIsIgnored(t *testing.T) {
	p, h := sigPlugin(t)
	at, rec := clock(p)
	p.ingestBatch(batchPayload{Records: []Record{rec(0)}})
	at(1000)
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
	at(1400)
	send(p, "GET", "/_s/b", h, map[string]string{"p": "12"})
	at(2000)
	send(p, "GET", "/_s/v", h, map[string]string{"k": "bv-hero.0", "p": "12"})
	p.settleOrphans(testNow.Add(time.Minute))
	evs, _, confirms := p.buf.take()
	if len(evs) != 1 || countedConfirms(confirms, evs[0].EID) != 1 {
		t.Fatalf("events = %+v, confirms = %+v", evs, confirms)
	}
	if inter := p.buf.takeInteractions(); len(inter) != 1 || inter[0].EID != evs[0].EID {
		t.Errorf("section = %+v, want it on the view (not held back)", inter)
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
