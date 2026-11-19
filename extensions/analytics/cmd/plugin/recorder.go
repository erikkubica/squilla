package main

import (
	"context"
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"math"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// Session recordings: an opt-in script (rec.js) samples cursor, scroll,
// clicks and form use of a page view and posts them once a second to
// <prefix>/r. No page text, no input values, no query strings. The admin
// replays them over the live page and builds heatmaps from them.

//go:embed rec.js
var recScript []byte

var recScriptVersion = func() string {
	h := sha256.Sum256(recScript)
	return hex.EncodeToString(h[:])[:10]
}()

const (
	recMaxBody       = 64 << 10
	recMaxEvents     = 500
	recMaxSeq        = 4000
	recMaxBytes      = 4 << 20 // per page view
	recMaxPerMinute  = 150     // chunks per visitor per minute
	recStateTTL      = 2 * time.Hour
	recMaxStates     = 50000
	recMaxQueue      = 5000
	recMaxEventTime  = 2 * 60 * 60 * 1000 // ms
	recMaxStringArg  = 500
	recHeatMaxViews  = 400
	recHeatMaxMoves  = 30000
	recHeatBin       = 50 // px rows for scroll reach and attention
	recHeatMaxBins   = 2000
	recDeviceMobile  = 768
	recDeviceDesktop = 1100
)

var (
	rePID      = regexp.MustCompile(`^[a-z0-9]{8,32}$`)
	recEvTypes = map[string]int{ // type → max scalar args after [t, type]
		"s": 2, "m": 2, "c": 4, "h": 2, "f": 1, "u": 1, "r": 2, "d": 1, "v": 1, "l": 0, "p": 0, "x": 0,
		"g": 3, // rage click: x, y, selector
		"k": 3, // dead click: x, y, selector
		"e": 3, // JavaScript error: message, file, line
		"w": 2, // web vital: lcp | cls (×1000) | inp | ttfb | fcp, value
	}
)

// recView is what the collector remembers about a page view being recorded.
type recView struct {
	vid, path, eid, sess string
	chunks, bytes        int
	seen                 time.Time
}

type recRate struct {
	start time.Time
	n     int
}

// recorder holds the collector's in-memory state and the write queue.
type recorder struct {
	mu    sync.Mutex
	views map[string]*recView
	rates map[string]*recRate
	queue []map[string]any
	lost  int64
}

func newRecorder() *recorder {
	return &recorder{views: map[string]*recView{}, rates: map[string]*recRate{}}
}

func (r *recorder) allow(vid string, now time.Time) bool {
	rt := r.rates[vid]
	if rt == nil || now.Sub(rt.start) >= time.Minute {
		if len(r.rates) > recMaxStates {
			r.rates = map[string]*recRate{}
		}
		rt = &recRate{start: now}
		r.rates[vid] = rt
	}
	rt.n++
	return rt.n <= recMaxPerMinute
}

func (r *recorder) sweep(now time.Time) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for k, v := range r.views {
		if now.Sub(v.seen) > recStateTTL {
			delete(r.views, k)
		}
	}
	for k, v := range r.rates {
		if now.Sub(v.start) > time.Minute {
			delete(r.rates, k)
		}
	}
}

func (r *recorder) take() []map[string]any {
	r.mu.Lock()
	defer r.mu.Unlock()
	q := r.queue
	r.queue = nil
	return q
}

// recDevice classifies a page view by its viewport width.
func recDevice(w int) string {
	switch {
	case w <= 0:
		return ""
	case w < recDeviceMobile:
		return "mobile"
	case w < recDeviceDesktop:
		return "tablet"
	}
	return "desktop"
}

type recPayload struct {
	P string            `json:"p"`
	S *int              `json:"s"`
	E []json.RawMessage `json:"e"`
	M *struct {
		U  string  `json:"u"`
		R  string  `json:"r"`
		W  float64 `json:"w"`
		H  float64 `json:"h"`
		DH float64 `json:"dh"`
		SW float64 `json:"sw"`
		SH float64 `json:"sh"`
	} `json:"m"`
}

// cleanRecEvents keeps well-formed events: [t ms, known type, scalar args].
// Returns the events and the newest t.
func cleanRecEvents(in []json.RawMessage) ([]any, int) {
	out := make([]any, 0, len(in))
	maxT := 0
	for _, raw := range in {
		var e []any
		if json.Unmarshal(raw, &e) != nil || len(e) < 2 {
			continue
		}
		tf, ok := e[0].(float64)
		typ, ok2 := e[1].(string)
		limit, known := recEvTypes[typ]
		if !ok || !ok2 || !known || tf < 0 || tf > recMaxEventTime || tf != math.Trunc(tf) {
			continue
		}
		args := e[2:]
		if len(args) > limit {
			args = args[:limit]
		}
		ev := []any{int(tf), typ}
		valid := true
		for _, a := range args {
			switch v := a.(type) {
			case float64:
				if math.IsNaN(v) || math.IsInf(v, 0) || math.Abs(v) > 1e6 {
					valid = false
				}
				ev = append(ev, int(math.Round(v)))
			case string:
				if len(v) > recMaxStringArg {
					v = v[:recMaxStringArg]
				}
				ev = append(ev, v)
			default:
				valid = false
			}
		}
		if !valid {
			continue
		}
		out = append(out, ev)
		if int(tf) > maxT {
			maxT = int(tf)
		}
	}
	return out, maxT
}

func clampDim(v float64, lo, hi int) int {
	if math.IsNaN(v) {
		return lo
	}
	return int(math.Max(float64(lo), math.Min(float64(hi), v)))
}

// handleRecord is POST <prefix>/r. It always answers 204 and never tells a
// client why a batch was dropped.
func (p *AnalyticsPlugin) handleRecord(req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	reply := &pb.PluginHTTPResponse{StatusCode: 204, Headers: map[string]string{"Cache-Control": "no-store"}}
	cfg := p.config()
	if !cfg.Recordings || !strings.EqualFold(req.GetMethod(), "POST") {
		return reply
	}
	body := req.GetBody()
	if len(body) == 0 || len(body) > recMaxBody {
		return reply
	}
	h := headerGetter(req.GetHeaders())
	host := h("host")
	if strings.EqualFold(h("sec-fetch-site"), "cross-site") || isSpeculativeHeaders(h) ||
		cookieValue(h("cookie"), optOutCookie) != "" || matchSignature(strings.ToLower(h("user-agent"))).isBot() {
		return reply
	}
	if o := h("origin"); o != "" {
		u, err := url.Parse(o)
		if err != nil || !isOwnHost(u.Hostname(), host, cfg) {
			return reply
		}
	}
	if (h("sec-gpc") == "1" && cfg.RespectGPC) || h("dnt") == "1" || isReplayFrame("", h("referer"), "") {
		return reply
	}
	var in recPayload
	if json.Unmarshal(body, &in) != nil || !rePID.MatchString(in.P) || in.S == nil || *in.S < 0 || *in.S > recMaxSeq ||
		len(in.E) == 0 || len(in.E) > recMaxEvents {
		return reply
	}
	events, maxT := cleanRecEvents(in.E)
	if len(events) == 0 {
		return reply
	}
	data, _ := json.Marshal(events)

	now := p.now()
	c := p.newClient(host, h("x-forwarded-for"), h("user-agent"), h("accept-language"), h("sec-gpc"), h("cf-ipcountry"),
		h("sec-ch-ua-mobile"), h("sec-ch-ua-platform"))
	vid := p.visitorID(c, now, cfg)
	if vid == "" {
		return reply
	}

	r := p.rec
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.allow(vid, now) {
		return reply
	}
	st := r.views[in.P]
	row := map[string]any{"pid": in.P, "seq": *in.S, "ts": now.UTC().Format(time.RFC3339Nano), "t": maxT, "data": json.RawMessage(data)}
	if *in.S == 0 && in.M != nil {
		u, err := url.Parse(in.M.U)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || !isOwnHost(u.Hostname(), host, cfg) {
			return reply
		}
		path := normalizePath(u.Path)
		if isHardExcluded(path, cfg) || isUserExcluded(path, cfg) {
			return reply
		}
		if st != nil && st.vid != vid {
			return reply // someone else's page view id
		}
		if st == nil {
			if len(r.views) >= recMaxStates {
				return reply
			}
			st = &recView{vid: vid, path: path}
			r.views[in.P] = st
		}
		vw := clampDim(in.M.W, 0, 20000)
		ref := in.M.R
		if len(ref) > 500 {
			ref = ref[:500]
		}
		row["meta"] = map[string]any{
			"visitor_id": vid, "path": path, "url": u.Scheme + "://" + u.Host + u.Path, "referrer": ref,
			"vw": vw, "vh": clampDim(in.M.H, 0, 20000), "dh": clampDim(in.M.DH, 0, 500000),
			"sw": clampDim(in.M.SW, 0, 20000), "sh": clampDim(in.M.SH, 0, 20000),
			"device": recDevice(vw), "browser": c.Browser, "os": c.OS, "country": c.Country, "language": c.Language,
		}
	}
	if st == nil || st.vid != vid {
		return reply // a view this collector did not start (or another visitor's id)
	}
	st.seen = now
	st.chunks++
	st.bytes += len(data)
	if st.chunks > recMaxSeq || st.bytes > recMaxBytes {
		return reply
	}
	if st.eid == "" {
		if pv, ok := p.beacons.lookupRecent(vid, st.path, now, 30*time.Minute); ok {
			st.eid, st.sess = pv.eid, pv.sess
		}
	}
	if st.eid != "" {
		row["eid"], row["session_id"] = st.eid, st.sess
		if m, ok := row["meta"].(map[string]any); ok {
			m["eid"], m["session_id"] = st.eid, st.sess
		}
	}
	if len(r.queue) >= recMaxQueue {
		r.lost++
		return reply
	}
	r.queue = append(r.queue, row)
	return reply
}

// flushRecordings writes queued chunks in one call per batch.
func (p *AnalyticsPlugin) flushRecordings(ctx context.Context) {
	rows := p.rec.take()
	for len(rows) > 0 {
		n := min(len(rows), 500)
		if _, err := p.host.DataCall(ctx, "analytics_rec_ingest", rows[:n]); err != nil {
			p.logf(ctx, "warn", "analytics: recording write failed: %v", err)
		}
		rows = rows[n:]
	}
}

// recScriptResponse serves rec.js. The URL carries the script's hash, so
// it can be cached for long.
func recScriptResponse() *pb.PluginHTTPResponse {
	return &pb.PluginHTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":           "application/javascript; charset=utf-8",
			"Cache-Control":          "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
		},
		Body: recScript,
	}
}

// recScriptTag is the tag added to recorded pages.
func recScriptTag(cfg *Config) string {
	return `<script async src="` + cfg.BeaconPrefix + `/r.js?v=` + recScriptVersion + `" data-api="` + cfg.BeaconPrefix +
		`/r" data-rate="` + itoa(cfg.RecordingSample) + `"` + map[bool]string{true: ` data-consent="1"`}[cfg.RecordingConsent] + `></script>`
}

// replayMarker is added to the page URL the admin shows in replay and
// heatmap frames, so those loads are never measured.
const replayMarker = "sq_replay=1"

// isReplayFrame reports a request made by (or from inside) the admin's
// replay/heatmap frame: the marker in the query or in the referring page's
// URL, or an iframe embedded by an /admin page.
func isReplayFrame(query, referer, fetchDest string) bool {
	if strings.Contains(query, replayMarker) || strings.Contains(referer, replayMarker) {
		return true
	}
	if strings.EqualFold(fetchDest, "iframe") {
		if u, err := url.Parse(referer); err == nil && (u.Path == "/admin" || strings.HasPrefix(u.Path, "/admin/")) {
			return true
		}
	}
	return false
}

/* ───────────────────────────── admin ───────────────────────────── */

func (p *AnalyticsPlugin) handleRecordingList(ctx context.Context, params map[string]string) *pb.PluginHTTPResponse {
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err)
	}
	device := params["device"]
	if device != "" && device != "desktop" && device != "tablet" && device != "mobile" {
		return jsonError(400, "INVALID_DEVICE", "device must be desktop, tablet or mobile")
	}
	path := ""
	if v := strings.TrimSpace(params["path"]); v != "" {
		path = normalizePath(v)
	}
	signal := params["signal"]
	if signal != "" && signal != "rage" && signal != "dead" && signal != "error" && signal != "slow" {
		return jsonError(400, "INVALID_SIGNAL", "signal must be rage, dead, error or slow")
	}
	filters := map[string]any{
		"path": path, "device": device, "min_ms": intParam(params, "min_s", 0, 0, 3600) * 1000,
		"clicked": params["clicked"] == "1", "signal": signal,
		"channel": clip(strings.TrimSpace(params["channel"]), 40), "country": clip(strings.ToUpper(strings.TrimSpace(params["country"])), 2),
		"entry": params["entry"] == "1", "converted": params["converted"] == "1",
	}
	data, err := p.behaviourData(ctx, "analytics_rec_list", q.from(), q.to(), q.TZ, filters,
		intParam(params, "limit", 50, 1, 200), intParam(params, "offset", 0, 0, 1_000_000))
	if err != nil {
		return errorResponse(err)
	}
	return jsonResponse(200, data)
}

// handleSearchStats: on-site search terms (GA's "site search").
func (p *AnalyticsPlugin) handleSearchStats(ctx context.Context, params map[string]string) *pb.PluginHTTPResponse {
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err)
	}
	data, err := p.behaviourData(ctx, "analytics_search_stats", q.from(), q.to(), q.TZ)
	if err != nil {
		return errorResponse(err)
	}
	return jsonResponse(200, data)
}

// handleRecordingInsights: frustration signals (rage and dead clicks, JS
// errors, quick backs) and Core Web Vitals measured in visitors' browsers.
func (p *AnalyticsPlugin) handleRecordingInsights(ctx context.Context, params map[string]string) *pb.PluginHTTPResponse {
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err)
	}
	data, err := p.behaviourData(ctx, "analytics_rec_insights", q.from(), q.to(), q.TZ)
	if err != nil {
		return errorResponse(err)
	}
	return jsonResponse(200, data)
}

func (p *AnalyticsPlugin) handleRecordingGet(ctx context.Context, pid string) *pb.PluginHTTPResponse {
	if !rePID.MatchString(pid) {
		return jsonError(404, "NOT_FOUND", "recording not found")
	}
	data, err := p.behaviourData(ctx, "analytics_rec_get", pid)
	if err != nil {
		return errorResponse(err)
	}
	if len(data) == 0 {
		return jsonError(404, "NOT_FOUND", "recording not found")
	}
	return jsonResponse(200, data)
}

func (p *AnalyticsPlugin) handleRecordingDelete(ctx context.Context, pids []string) *pb.PluginHTTPResponse {
	clean := make([]string, 0, len(pids))
	for _, id := range pids {
		if rePID.MatchString(id) {
			clean = append(clean, id)
		}
	}
	if len(clean) == 0 || len(clean) > 1000 {
		return jsonError(400, "INVALID_IDS", "send 1-1000 recording ids")
	}
	rows, err := p.host.DataCall(ctx, "analytics_rec_delete", clean)
	if err != nil {
		return errorResponse(err)
	}
	var n int64
	if len(rows) > 0 {
		n = num(rows[0], "deleted")
	}
	return jsonResponse(200, map[string]any{"deleted": n})
}

// handleReset wipes collected data. The body must repeat the scope as
// confirmation: {"scope": "all", "confirm": "all"}.
func (p *AnalyticsPlugin) handleReset(ctx context.Context, body []byte) *pb.PluginHTTPResponse {
	var in struct {
		Scope   string `json:"scope"`
		Confirm string `json:"confirm"`
	}
	if json.Unmarshal(body, &in) != nil {
		return jsonError(400, "INVALID_JSON", "invalid body")
	}
	switch in.Scope {
	case "all", "recordings", "behaviour":
	default:
		return jsonError(400, "INVALID_SCOPE", "scope must be all, recordings or behaviour")
	}
	if in.Confirm != in.Scope {
		return jsonError(400, "CONFIRM_REQUIRED", `repeat the scope in "confirm" to reset`)
	}
	// Buffered rows would land after the wipe: drop them first.
	if in.Scope != "behaviour" {
		p.rec.take()
	}
	if in.Scope != "recordings" {
		p.buf.takeInteractions()
	}
	if in.Scope == "all" {
		p.buf.take()
		p.beacons.reset()
		p.sessions.reset()
	}
	if _, err := p.host.DataCall(ctx, "analytics_reset", in.Scope); err != nil {
		return errorResponse(err)
	}
	p.outlines.reset()
	p.logf(ctx, "info", "analytics: data reset (%s)", in.Scope)
	return jsonResponse(200, map[string]any{"reset": in.Scope})
}

/* ───────────────────────────── hotspots ───────────────────────────── */

type heatState struct {
	w, h, sy, bottom, dh, lt int
	vis                      bool
}

func evInt(e []any, i int) int {
	if i < len(e) {
		if f, ok := e[i].(float64); ok {
			return int(f)
		}
	}
	return 0
}

func evStr(e []any, i int) string {
	if i < len(e) {
		if s, ok := e[i].(string); ok {
			return s
		}
	}
	return ""
}

func median(v []int, def int) int {
	if len(v) == 0 {
		return def
	}
	c := append([]int(nil), v...)
	for i := 1; i < len(c); i++ { // small n: insertion sort
		for j := i; j > 0 && c[j] < c[j-1]; j-- {
			c[j], c[j-1] = c[j-1], c[j]
		}
	}
	return c[len(c)/2]
}

// handleHotspots aggregates a page's recordings into click points, cursor
// density, scroll reach and attention (time on screen) per 50 px row.
// x coordinates are relative to the viewport centre, so layouts centred
// at different widths line up.
func (p *AnalyticsPlugin) handleHotspots(ctx context.Context, params map[string]string) *pb.PluginHTTPResponse {
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err)
	}
	path := normalizePath(strings.TrimSpace(params["path"]))
	if strings.TrimSpace(params["path"]) == "" {
		return jsonError(400, "MISSING_PATH", "path is required")
	}
	devRows, err := p.host.DataCall(ctx, "analytics_rec_devices", path, q.from(), q.to(), q.TZ)
	if err != nil {
		return errorResponse(err)
	}
	devices := make([]map[string]any, 0, len(devRows))
	for _, r := range devRows {
		devices = append(devices, map[string]any{"device": str(r, "device"), "n": num(r, "n")})
	}
	device := params["device"]
	if device == "" && len(devices) > 0 {
		device, _ = devices[0]["device"].(string)
	}
	rows, err := p.host.DataCall(ctx, "analytics_rec_heat", path, device, q.from(), q.to(), q.TZ, recHeatMaxViews)
	if err != nil {
		return errorResponse(err)
	}
	type selAgg struct {
		idx     int
		href    string
		n, ySum int
	}
	sels := map[string]*selAgg{}
	var selOrder []string
	clicks := [][3]int{}
	moves := [][2]int{}
	dwell := map[int]int{}
	reachAt := map[int]int{}
	var ws, hs, dhs []int
	for _, r := range rows {
		s := &heatState{w: int(num(r, "vw")), h: int(num(r, "vh")), dh: int(num(r, "dh")), vis: true}
		s.bottom = s.h
		ws, hs = append(ws, s.w), append(hs, s.h)
		var evs [][]any
		switch d := r["data"].(type) {
		case []any:
			for _, x := range d {
				if e, ok := x.([]any); ok {
					evs = append(evs, e)
				}
			}
		case string:
			_ = json.Unmarshal([]byte(d), &evs)
		case []byte:
			_ = json.Unmarshal(d, &evs)
		}
		for _, e := range evs {
			if len(e) < 2 {
				continue
			}
			t := evInt(e, 0)
			if dt := min(t-s.lt, 20000); dt > 0 && s.vis && s.h > 0 {
				to := min(recHeatMaxBins, (s.sy+s.h-1)/recHeatBin)
				for b := s.sy / recHeatBin; b <= to; b++ {
					dwell[b] += dt
				}
			}
			s.lt = max(s.lt, t)
			switch evStr(e, 1) {
			case "s":
				s.sy = max(0, evInt(e, 3))
				s.bottom = max(s.bottom, s.sy+s.h)
			case "r":
				if w, hh := evInt(e, 2), evInt(e, 3); w > 0 && hh > 0 {
					s.w, s.h = w, hh
					s.bottom = max(s.bottom, s.sy+s.h)
				}
			case "d":
				s.dh = max(s.dh, evInt(e, 2))
			case "v":
				s.vis = evInt(e, 2) != 0
			case "m":
				moves = append(moves, [2]int{evInt(e, 2) - s.w/2, evInt(e, 3) + s.sy})
			case "c":
				sel := evStr(e, 4)
				y := evInt(e, 3) + s.sy
				a := sels[sel]
				if a == nil {
					a = &selAgg{idx: len(selOrder), href: evStr(e, 5)}
					sels[sel] = a
					selOrder = append(selOrder, sel)
				}
				a.n++
				a.ySum += y
				clicks = append(clicks, [3]int{evInt(e, 2) - s.w/2, y, a.idx})
			}
		}
		reachAt[min(recHeatMaxBins, max(0, s.bottom-1)/recHeatBin)]++
		dhs = append(dhs, max(s.dh, s.bottom))
	}
	top := 0
	for b := range reachAt {
		top = max(top, b)
	}
	for b := range dwell {
		top = max(top, b)
	}
	reach := make([]int, top+1)
	dw := make([]int, top+1)
	acc := 0
	for b := top; b >= 0; b-- {
		acc += reachAt[b]
		reach[b] = acc
		dw[b] = dwell[b]
	}
	if len(moves) > recHeatMaxMoves { // an even sample is enough for a density map
		step := float64(len(moves)) / recHeatMaxMoves
		m2 := make([][2]int, 0, recHeatMaxMoves)
		for i := 0; i < recHeatMaxMoves; i++ {
			m2 = append(m2, moves[int(float64(i)*step)])
		}
		moves = m2
	}
	selOut := make([]map[string]any, len(selOrder))
	for i, sel := range selOrder {
		a := sels[sel]
		selOut[i] = map[string]any{"selector": sel, "href": a.href, "clicks": a.n, "y": a.ySum / max(1, a.n)}
	}
	if len(rows) == 0 {
		reach, dw = []int{}, []int{}
	}
	return jsonResponse(200, map[string]any{
		"path": path, "device": device, "devices": devices, "views": len(rows),
		"w": median(ws, 1280), "h": median(hs, 800), "dh": median(dhs, 0), "bin": recHeatBin,
		"clicks": clicks, "selectors": selOut, "moves": moves, "reach": reach, "dwell": dw,
	})
}

// clip cuts s to at most n bytes (filter values are short ASCII).
func clip(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}
