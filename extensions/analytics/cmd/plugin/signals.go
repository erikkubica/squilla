package main

import (
	"context"
	"encoding/json"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// Interaction is one analytics_interactions row.
type Interaction struct {
	TS        time.Time `json:"ts"`
	EID       string    `json:"eid"`
	SessionID string    `json:"session_id"`
	Path      string    `json:"path"`
	Kind      string    `json:"kind"`
	BlockKey  string    `json:"block_key"`
	Value     string    `json:"value"`
	Dest      string    `json:"dest"`
}

const (
	maxInteractions = 20000
	signalsPerMin   = 120
	// quietAfterReset: no views are synthesised for this long after a
	// plugin start or a salt rotation, because every page already open
	// would otherwise look like a new visit.
	quietAfterReset = 10 * time.Minute
	orphanWindow    = 10 * time.Minute
)

// nodePaths maps node ids to their last rendered path so a signal whose
// Referer was stripped can still be attributed to a page.
type nodePaths struct {
	mu sync.Mutex
	m  map[int64]string
}

func (n *nodePaths) set(id int64, path string) {
	n.mu.Lock()
	defer n.mu.Unlock()
	if n.m == nil || len(n.m) > 5000 {
		n.m = map[int64]string{}
	}
	n.m[id] = path
}

func (n *nodePaths) get(id int64) string {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.m[id]
}

func (b *pipelineBuffer) addInteraction(i Interaction) {
	b.mu.Lock()
	if len(b.inter) >= maxInteractions {
		b.interLost++
	} else {
		b.inter = append(b.inter, i)
	}
	b.mu.Unlock()
}

func (b *pipelineBuffer) signalsLost() int64 {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.interLost
}

func (t *beaconTracker) size() int {
	t.mu.Lock()
	defer t.mu.Unlock()
	return len(t.recent)
}

func (b *pipelineBuffer) takeInteractions() []Interaction {
	b.mu.Lock()
	defer b.mu.Unlock()
	out := b.inter
	b.inter = nil
	return out
}

func (b *pipelineBuffer) requeueInteractions(in []Interaction) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if room := maxInteractions - len(b.inter); room > 0 {
		if len(in) > room {
			b.interLost += int64(len(in) - room)
			in = in[:room]
		}
		b.inter = append(in, b.inter...)
	} else {
		b.interLost += int64(len(in))
	}
}

// signalRate caps signals per visitor per minute (public endpoints).
type signalRate struct {
	mu sync.Mutex
	m  map[string][2]int64 // visitor → {minute, count}
}

func (s *signalRate) allow(vid string, now time.Time) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.m == nil || len(s.m) > 50000 {
		s.m = map[string][2]int64{}
	}
	min := now.Unix() / 60
	e := s.m[vid]
	if e[0] != min {
		e = [2]int64{min, 0}
	}
	e[1]++
	s.m[vid] = e
	return e[1] <= signalsPerMin
}

// signalRequest is a validated signal from a browser.
type signalRequest struct {
	kind, key, value, dest string
	viewport, scheme       string
	print                  bool
	nodeID                 int64
}

// handleSignal serves the in-page signal endpoints. It always answers with
// the transparent GIF (or 204 for pings) so the page never sees an error.
func (p *AnalyticsPlugin) handleSignal(_ context.Context, rest string, req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	reply := gifResponse()
	if rest == "c" {
		reply = &pb.PluginHTTPResponse{StatusCode: 204, Headers: map[string]string{"Cache-Control": "no-store"}}
	}
	cfg := p.config()
	if !cfg.EnhancedMode {
		return reply
	}
	h := headerGetter(req.GetHeaders())
	q := req.GetQueryParams()
	if isSpeculativeHeaders(h) || cookieValue(h("cookie"), optOutCookie) != "" {
		return reply
	}
	if strings.EqualFold(h("sec-fetch-site"), "cross-site") || (rest == "c" && !strings.EqualFold(req.GetMethod(), "POST")) {
		return reply
	}
	if matchSignature(strings.ToLower(h("user-agent"))).isBot() {
		return reply
	}
	sr := signalRequest{key: cleanKey(q["k"])}
	sr.nodeID, _ = strconv.ParseInt(q["p"], 10, 64)
	switch rest {
	case "b":
		sr.kind = "activate"
	case "m":
		sr.kind = "viewport"
		sr.viewport = map[string]string{"s": "s", "m": "m", "l": "l"}[q["w"]]
		sr.scheme = map[string]string{"l": "light", "d": "dark"}[q["c"]]
		sr.print = q["print"] == "1"
		if sr.viewport == "" && !sr.print {
			return reply
		}
	case "t":
		sec := intParam(q, "s", 0, 0, 3600)
		if !validDwell(sec) {
			return reply
		}
		sr.kind, sr.value = "dwell", itoa(sec)
	case "v":
		if !cfg.SignalSections || sr.key == "" {
			return reply
		}
		sr.kind = "section"
	case "e":
		sr.kind = "end"
	case "i":
		if !cfg.SignalForms || sr.key == "" {
			return reply
		}
		switch q["t"] {
		case "f":
			sr.kind, sr.value = "form", "focus"
		case "d":
			sr.kind, sr.value = "toggle", "details"
		default:
			return reply
		}
	case "c":
		if !cfg.SignalClicks {
			return reply
		}
		host := h("host")
		dest, class, ok := linkDest(h("ping-to"), host, func(x string) bool { return isOwnHost(x, host, cfg) })
		if !ok {
			dest, class = "", "i"
		}
		sr.kind, sr.value, sr.dest = "click", class, dest
		if sr.key == "" {
			sr.key = "x"
		}
	default:
		return reply
	}

	// Which page? Ping-From / Referer first (own host only), else the
	// page id the markup carried.
	now := p.now()
	host := h("host")
	path := ""
	for _, name := range []string{"ping-from", "referer"} {
		if u, err := url.Parse(h(name)); err == nil && u.Host != "" && isOwnHost(u.Hostname(), host, cfg) {
			path = normalizePath(u.Path)
			break
		}
	}
	if path == "" {
		path = p.nodes.get(sr.nodeID)
	}
	if path == "" {
		return reply
	}
	if h("sec-gpc") == "1" && cfg.RespectGPC {
		return reply
	}
	c := p.newClient(host, h("x-forwarded-for"), h("user-agent"), h("accept-language"), h("sec-gpc"), "", "", "")
	vid := p.visitorID(c, now, cfg)
	if vid == "" {
		return reply
	}
	p.adoptSession(c, vid, now, cfg)
	if !p.sigRate.allow(vid, now) {
		return reply
	}
	p.applySignal(c, cfg, vid, path, sr, now)
	return reply
}

func validDwell(s int) bool {
	for _, m := range dwellMarks {
		if m == s {
			return true
		}
	}
	return false
}

func itoa(n int) string { b, _ := json.Marshal(n); return string(b) }

// applySignal attaches sr to the visitor's pageview of path, or parks it
// until the kernel's record for that pageview arrives.
func (p *AnalyticsPlugin) applySignal(c *client, cfg *Config, vid, path string, sr signalRequest, now time.Time) {
	pv, ok := p.beacons.lookupRecent(vid, path, now, 30*time.Minute)
	if !ok {
		if sr.kind == "activate" && p.mayCreateView(now) {
			// A shown page with no request on record: served from a cache
			// (or prerendered) — a real view, counted once.
			p.createCachedView(c, cfg, vid, path, sr, now)
			return
		}
		p.beacons.addPending(vid, path, pendingSig{
			kind: sr.kind, key: sr.key, value: sr.value, dest: sr.dest, viewport: sr.viewport, scheme: sr.scheme, ts: now,
		})
		return
	}
	p.recordSignal(vid, path, pv, sr, now)
}

// recordSignal stores one signal for a known pageview.
func (p *AnalyticsPlugin) recordSignal(vid, path string, pv recentPV, sr signalRequest, now time.Time) {
	dedupe := sr.kind + "|" + sr.key + "|" + sr.value + "|" + sr.viewport + sr.scheme
	if sr.kind != "click" && !p.beacons.markSeen(vid, path, dedupe) {
		return
	}
	switch sr.kind {
	case "viewport":
		// Device facts only: never confirms (counts) a view by itself.
		p.buf.addConfirm(confirmation{EID: pv.eid, Since: pv.ts.Add(-time.Minute), Viewport: sr.viewport, ColorScheme: sr.scheme, Printed: sr.print, Meta: true})
		return
	case "activate":
		if pv.done {
			return
		}
		p.beacons.markDone(vid, path)
		p.buf.addConfirm(confirmation{EID: pv.eid, Since: pv.ts.Add(-time.Minute)})
		return
	case "dwell", "section", "end", "form", "toggle":
		// Any in-page signal proves the page was shown.
		if pv.spec && !pv.done {
			p.beacons.markDone(vid, path)
			p.buf.addConfirm(confirmation{EID: pv.eid, Since: pv.ts.Add(-time.Minute)})
		}
	}
	p.buf.addInteraction(Interaction{
		TS: now, EID: pv.eid, SessionID: pv.sess, Path: path, Kind: sr.kind,
		BlockKey: sr.key, Value: sr.value, Dest: sr.dest,
	})
}

// mayCreateView says whether an activation without a document hit may
// become a view: not right after a restart or a salt rotation.
func (p *AnalyticsPlugin) mayCreateView(now time.Time) bool {
	if now.Sub(p.startedAt) < quietAfterReset {
		return false
	}
	return now.Sub(p.salt.rotatedAtTime()) >= quietAfterReset
}

// createCachedView synthesises the pageview of a page served from a cache.
func (p *AnalyticsPlugin) createCachedView(c *client, cfg *Config, vid, path string, sr signalRequest, now time.Time) {
	ev := Event{
		TS: now, Host: c.Host, Path: path, NodeID: sr.nodeID, VisitorID: vid, Kind: kindPageview, EID: randomHex(8),
		Country: c.Country, Language: c.Language, Device: c.Device, Browser: c.Browser, OS: c.OS,
		Cached: true, Confirmed: true, Viewport: sr.viewport, ColorScheme: sr.scheme,
	}
	p.attachSession(&ev, acquisitionInput{host: c.Host}, cfg, true)
	p.buf.addEvent(ev)
	p.beacons.rememberPageview(vid, path, ev.EID, ev.SessionID, now, false)
	p.beacons.markDone(vid, path)
	for _, g := range p.matchPageviewGoals(path) {
		p.buf.addEvent(goalEvent(ev, g.ID))
	}
}

// drainPending applies signals that arrived before the pageview record.
func (p *AnalyticsPlugin) drainPending(vid, path string, pv recentPV, ts time.Time) {
	for _, sg := range p.beacons.takePending(vid, path, ts) {
		sr := signalRequest{kind: sg.kind, key: sg.key, value: sg.value, dest: sg.dest, viewport: sg.viewport, scheme: sg.scheme}
		cur, _ := p.beacons.lookupRecent(vid, path, sg.ts, 30*time.Minute)
		if cur.eid == "" {
			cur = pv
		}
		p.recordSignal(vid, path, cur, sr, sg.ts)
	}
}

// outlineCache remembers the last stored outline hash per page so the
// database is written only when a page's blocks or links change.
type outlineCache struct {
	mu sync.Mutex
	m  map[string]string
}

func (o *outlineCache) changed(path, hash string) bool {
	o.mu.Lock()
	defer o.mu.Unlock()
	if o.m == nil || len(o.m) > 5000 {
		o.m = map[string]string{}
	}
	if o.m[path] == hash {
		return false
	}
	o.m[path] = hash
	return true
}

func (o *outlineCache) forget(path string) {
	o.mu.Lock()
	delete(o.m, path)
	o.mu.Unlock()
}
