package main

import (
	"context"
	"encoding/json"
	"net/url"
	"strings"
	"sync"
	"time"

	pb "squilla/pkg/plugin/proto"
)

const (
	beaconWindow   = 60 * time.Second
	downloadDedupe = 30 * time.Second
)

// beaconTracker correlates CSS beacons with pageviews. Beacons usually
// arrive before the kernel delivers the pageview record (records are
// batched), so unmatched beacons wait in pending until the pageview shows
// up; late beacons are matched against recently stored pageviews.
type beaconTracker struct {
	mu        sync.Mutex
	recent    map[string]recentPV
	pending   map[string]pendingBeacon
	downloads map[string]time.Time
}

type recentPV struct {
	eid string
	ts  time.Time
}

type pendingBeacon struct {
	viewport, scheme string
	ts               time.Time
}

func newBeaconTracker() *beaconTracker {
	t := &beaconTracker{}
	t.reset()
	return t
}

func beaconKey(visitor, path string) string { return visitor + "|" + path }

func (t *beaconTracker) reset() {
	t.mu.Lock()
	t.recent, t.pending, t.downloads = map[string]recentPV{}, map[string]pendingBeacon{}, map[string]time.Time{}
	t.mu.Unlock()
}

func (t *beaconTracker) rememberPageview(visitor, path, eid string, ts time.Time) {
	t.mu.Lock()
	t.recent[beaconKey(visitor, path)] = recentPV{eid, ts}
	t.mu.Unlock()
}

func (t *beaconTracker) lookupRecent(visitor, path string, now time.Time, window time.Duration) (recentPV, bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	pv, ok := t.recent[beaconKey(visitor, path)]
	if !ok || now.Sub(pv.ts) > window || pv.ts.Sub(now) > window {
		return recentPV{}, false
	}
	return pv, true
}

func (t *beaconTracker) addPending(visitor, path string, b pendingBeacon) {
	t.mu.Lock()
	t.pending[beaconKey(visitor, path)] = b
	t.mu.Unlock()
}

// takePending consumes a beacon that arrived within beaconWindow of ts.
func (t *beaconTracker) takePending(visitor, path string, ts time.Time) (pendingBeacon, bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	k := beaconKey(visitor, path)
	b, ok := t.pending[k]
	if !ok {
		return pendingBeacon{}, false
	}
	d := b.ts.Sub(ts)
	if d < -5*time.Second || d > beaconWindow {
		return pendingBeacon{}, false
	}
	delete(t.pending, k)
	return b, true
}

// seenDownload reports a repeat download (range requests, double clicks)
// of the same file by the same visitor within downloadDedupe.
func (t *beaconTracker) seenDownload(visitor, path string, ts time.Time) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	k := beaconKey(visitor, path)
	last, ok := t.downloads[k]
	t.downloads[k] = ts
	return ok && ts.Sub(last) < downloadDedupe && ts.Sub(last) > -downloadDedupe
}

func (t *beaconTracker) sweep(now time.Time, keepRecent time.Duration) {
	t.mu.Lock()
	defer t.mu.Unlock()
	for k, v := range t.recent {
		if now.Sub(v.ts) > keepRecent {
			delete(t.recent, k)
		}
	}
	for k, v := range t.pending {
		if now.Sub(v.ts) > 2*beaconWindow {
			delete(t.pending, k)
		}
	}
	for k, v := range t.downloads {
		if now.Sub(v) > downloadDedupe {
			delete(t.downloads, k)
		}
	}
}

// renderHook returns the enhanced-mode markup for render.head (a <style>
// with media-query beacons) and render.body_end (the 1px target element).
func (p *AnalyticsPlugin) renderHook(action string, payload []byte) string {
	cfg := p.config()
	if !cfg.EnhancedMode {
		return ""
	}
	var data struct {
		User map[string]any `json:"user"`
	}
	_ = json.Unmarshal(payload, &data)
	if cfg.ExcludeLoggedIn && len(data.User) > 0 {
		return ""
	}
	if action == "render.body_end" {
		return `<i class="sq-s" aria-hidden="true"></i>`
	}
	return beaconStyle(cfg.BeaconPrefix)
}

// beaconStyle builds the 3 widths × 2 colour schemes + print rules. Only
// the matching rule's background image is fetched by the browser.
func beaconStyle(prefix string) string {
	var b strings.Builder
	b.WriteString(`<style>.sq-s{position:absolute;width:1px;height:1px;overflow:hidden;pointer-events:none;opacity:0}`)
	widths := []struct{ code, query string }{
		{"s", "(max-width:767px)"}, {"m", "(min-width:768px) and (max-width:1199px)"}, {"l", "(min-width:1200px)"},
	}
	for _, w := range widths {
		for _, c := range []struct{ code, scheme string }{{"l", "light"}, {"d", "dark"}} {
			b.WriteString(`@media screen and ` + w.query + ` and (prefers-color-scheme:` + c.scheme + `){.sq-s{background-image:url(`)
			b.WriteString(prefix + "/b?w=" + w.code + "&c=" + c.code + `)}}`)
		}
	}
	b.WriteString(`@media print{.sq-s{background-image:url(` + prefix + `/b?print=1)}}</style>`)
	return b.String()
}

// transparentGIF is a 1×1 transparent GIF.
var transparentGIF = []byte{
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
	0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
	0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
}

func gifResponse() *pb.PluginHTTPResponse {
	return &pb.PluginHTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex",
		},
		Body: transparentGIF,
	}
}

// handleBeacon serves GET <prefix>/b and records the confirmation. It
// always answers with the GIF so the page never sees an error.
func (p *AnalyticsPlugin) handleBeacon(_ context.Context, req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	cfg := p.config()
	if !cfg.EnhancedMode {
		return gifResponse()
	}
	h := headerGetter(req.GetHeaders())
	q := req.GetQueryParams()
	ref, err := url.Parse(h("referer"))
	host := h("host")
	if err != nil || ref.Host == "" || !isOwnHost(ref.Hostname(), host, cfg) {
		return gifResponse()
	}
	if v := matchSignature(strings.ToLower(h("user-agent"))); v.isBot() {
		return gifResponse()
	}
	c := p.newClient(host, h("x-forwarded-for"), h("user-agent"), h("accept-language"), h("sec-gpc"), "", "", "")
	now := p.now()
	vid := p.visitorID(c, now, cfg)
	if vid == "" {
		return gifResponse()
	}
	path := normalizePath(ref.Path)
	if q["print"] == "1" {
		if pv, ok := p.beacons.lookupRecent(vid, path, now, cfg.sessionTimeout()); ok {
			p.buf.addConfirm(confirmation{EID: pv.eid, Since: pv.ts.Add(-time.Minute), Printed: true})
		}
		return gifResponse()
	}
	viewport := map[string]string{"s": "s", "m": "m", "l": "l"}[q["w"]]
	scheme := map[string]string{"l": "light", "d": "dark"}[q["c"]]
	if viewport == "" {
		return gifResponse()
	}
	if pv, ok := p.beacons.lookupRecent(vid, path, now, beaconWindow); ok {
		p.buf.addConfirm(confirmation{EID: pv.eid, Since: pv.ts.Add(-time.Minute), Viewport: viewport, ColorScheme: scheme})
		return gifResponse()
	}
	p.beacons.addPending(vid, path, pendingBeacon{viewport: viewport, scheme: scheme, ts: now})
	return gifResponse()
}

// isOwnHost reports whether host is the request host or a configured own host.
func isOwnHost(host, requestHost string, cfg *Config) bool {
	host = normalizeHost(host)
	if host != "" && host == normalizeHost(requestHost) {
		return true
	}
	for _, own := range cfg.OwnHosts {
		if host == own {
			return true
		}
	}
	return false
}

// headerGetter returns a case-insensitive lookup over proxy headers.
func headerGetter(headers map[string]string) func(string) string {
	lower := make(map[string]string, len(headers))
	for k, v := range headers {
		lower[strings.ToLower(k)] = v
	}
	return func(name string) string { return lower[strings.ToLower(name)] }
}
