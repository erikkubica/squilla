package main

import (
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
	pending   map[string][]pendingSig
	downloads map[string]time.Time
}

type recentPV struct {
	eid  string
	ts   time.Time
	sess string
	spec bool     // stored as a speculative (prefetch/prerender) load
	done bool     // already confirmed by a beacon or an activation
	seen []string // signal dedupe keys already recorded for this view
	// activatedAt is when this view's own activation beacon arrived. A page
	// sends one per document, a second after it loads, so a later one means
	// the visitor opened the page again and that view's record is still on
	// its way (or never comes: the page was served from a cache).
	activatedAt time.Time
	// awaitUntil holds signals back for that newer view until its record
	// arrives (or this time passes).
	awaitUntil time.Time
}

// pendingSig is a signal that reached us before the kernel delivered its
// pageview record (records are batched for up to 2 s).
type pendingSig struct {
	kind, key, value, dest string
	viewport, scheme       string
	ts                     time.Time
	// An activation keeps its sender and page so that a document which never
	// produces a record (served from the browser's cache) can still become a
	// view (takeOrphans).
	client *client
	nodeID int64
}

func newBeaconTracker() *beaconTracker {
	t := &beaconTracker{}
	t.reset()
	return t
}

func beaconKey(visitor, path string) string { return visitor + "|" + path }

func (t *beaconTracker) reset() {
	t.mu.Lock()
	t.recent, t.pending, t.downloads = map[string]recentPV{}, map[string][]pendingSig{}, map[string]time.Time{}
	t.mu.Unlock()
}

const maxRecentViews = 20000

func (t *beaconTracker) rememberPageview(visitor, path, eid, sess string, ts time.Time, spec bool) {
	t.mu.Lock()
	if len(t.recent) >= maxRecentViews {
		// LRU-ish cap: drop the oldest quarter instead of growing without bound.
		cut := ts.Add(-5 * time.Minute)
		for k, v := range t.recent {
			if v.ts.Before(cut) {
				delete(t.recent, k)
			}
		}
		for k := range t.recent {
			if len(t.recent) < maxRecentViews*3/4 {
				break
			}
			delete(t.recent, k)
		}
	}
	t.recent[beaconKey(visitor, path)] = recentPV{eid: eid, ts: ts, sess: sess, spec: spec}
	t.mu.Unlock()
}

// markSeen records a dedupe key for the view; it reports false when the
// key was already recorded (or the view is unknown / over its cap).
func (t *beaconTracker) markSeen(visitor, path, key string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	k := beaconKey(visitor, path)
	pv, ok := t.recent[k]
	if !ok || len(pv.seen) >= 80 {
		return false
	}
	for _, s := range pv.seen {
		if s == key {
			return false
		}
	}
	pv.seen = append(pv.seen, key)
	t.recent[k] = pv
	return true
}

// activate consumes a speculative, still-unconfirmed pageview of path: the
// visitor demonstrably had that page open (a later same-site request named
// it as Referer, or its own beacon arrived), so the load counts as a view.
func (t *beaconTracker) activate(visitor, path string, now time.Time, window time.Duration) (recentPV, bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	k := beaconKey(visitor, path)
	pv, ok := t.recent[k]
	if !ok || !pv.spec || pv.done || now.Sub(pv.ts) > window || pv.ts.Sub(now) > window {
		return recentPV{}, false
	}
	pv.done = true
	t.recent[k] = pv
	return pv, true
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

func (t *beaconTracker) markDone(visitor, path string) {
	t.mu.Lock()
	if pv, ok := t.recent[beaconKey(visitor, path)]; ok {
		pv.done = true
		t.recent[beaconKey(visitor, path)] = pv
	}
	t.mu.Unlock()
}

// markActivated records when the view's activation beacon arrived.
func (t *beaconTracker) markActivated(visitor, path string, at time.Time) {
	t.mu.Lock()
	if pv, ok := t.recent[beaconKey(visitor, path)]; ok && pv.activatedAt.IsZero() {
		pv.activatedAt = at
		t.recent[beaconKey(visitor, path)] = pv
	}
	t.mu.Unlock()
}

// awaitNewView holds the visitor's signals for path back until a newer
// pageview record replaces the current one, or until `until`.
func (t *beaconTracker) awaitNewView(visitor, path string, until time.Time) {
	t.mu.Lock()
	if pv, ok := t.recent[beaconKey(visitor, path)]; ok {
		pv.awaitUntil = until
		t.recent[beaconKey(visitor, path)] = pv
	}
	t.mu.Unlock()
}

const (
	maxPendingKeys   = 5000
	maxPendingPerKey = 24
	pendingWindow    = 10 * time.Second
	// repeatActivation: activation fires a second after a document loads, so
	// two within a second are one document's request, repeated.
	repeatActivation = time.Second
)

func (t *beaconTracker) addPending(visitor, path string, sg pendingSig) {
	t.mu.Lock()
	defer t.mu.Unlock()
	k := beaconKey(visitor, path)
	cur := t.pending[k]
	if len(cur) == 0 && len(t.pending) >= maxPendingKeys {
		return
	}
	if sg.kind == "activate" {
		for _, o := range cur {
			if d := sg.ts.Sub(o.ts); o.kind == "activate" && d < repeatActivation && d > -repeatActivation {
				return
			}
		}
	}
	if len(cur) < maxPendingPerKey {
		t.pending[k] = append(cur, sg)
	}
}

// takePending consumes the signals of the document whose request started at
// ts. A page signals only after its response arrived, so earlier signals came
// from another document (one served from the browser's cache) and stay
// parked for takeOrphans.
func (t *beaconTracker) takePending(visitor, path string, ts time.Time) []pendingSig {
	t.mu.Lock()
	defer t.mu.Unlock()
	k := beaconKey(visitor, path)
	all, ok := t.pending[k]
	if !ok {
		return nil
	}
	var out, keep []pendingSig
	for _, sg := range all {
		if d := sg.ts.Sub(ts); d >= -time.Second && d <= pendingWindow {
			out = append(out, sg)
		} else {
			keep = append(keep, sg)
		}
	}
	if len(keep) > 0 {
		t.pending[k] = keep
	} else {
		delete(t.pending, k)
	}
	return out
}

// orphan is a parked activation whose document never produced a record,
// with that document's other parked signals.
type orphan struct {
	visitor, path string
	act           pendingSig
	rest          []pendingSig
}

// takeOrphans removes and returns the activations parked for at least wait:
// their record would have arrived by now, so the page came from a cache.
// A document's signals are the ones parked from just before its activation
// (its viewport facts) up to the next document's.
func (t *beaconTracker) takeOrphans(now time.Time, wait time.Duration) []orphan {
	t.mu.Lock()
	defer t.mu.Unlock()
	var out []orphan
	for k, sigs := range t.pending {
		visitor, path, _ := strings.Cut(k, "|")
		for {
			ai := -1
			for i, sg := range sigs {
				if sg.kind == "activate" && sg.client != nil && now.Sub(sg.ts) >= wait {
					ai = i
					break
				}
			}
			if ai < 0 {
				break
			}
			o := orphan{visitor: visitor, path: path, act: sigs[ai]}
			from, until := o.act.ts.Add(-2*time.Second), time.Time{}
			for _, sg := range sigs[ai+1:] {
				if sg.kind == "activate" {
					until = sg.ts.Add(-2 * time.Second)
					break
				}
			}
			var keep []pendingSig
			for i, sg := range sigs {
				switch {
				case i == ai:
				case !sg.ts.Before(from) && (until.IsZero() || sg.ts.Before(until)):
					o.rest = append(o.rest, sg)
				default:
					keep = append(keep, sg)
				}
			}
			out = append(out, o)
			sigs = keep
		}
		if len(sigs) > 0 {
			t.pending[k] = sigs
		} else {
			delete(t.pending, k)
		}
	}
	return out
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
		if len(v) == 0 || now.Sub(v[len(v)-1].ts) > 2*pendingWindow {
			delete(t.pending, k)
		}
	}
	for k, v := range t.downloads {
		if now.Sub(v) > downloadDedupe {
			delete(t.downloads, k)
		}
	}
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
