package main

import (
	"net/url"
	"strings"
	"time"
)

// activationWindow bounds how long after a speculative load a later
// request may still prove it was shown.
const activationWindow = 30 * time.Minute

// ingestBatch processes one http.requests batch. It only touches memory;
// the flush worker persists the results.
func (p *AnalyticsPlugin) ingestBatch(b batchPayload) {
	if b.Dropped > 0 {
		p.droppedTotal.Add(b.Dropped)
	}
	cfg := p.config()
	for i := range b.Records {
		r := &b.Records[i]
		p.noteRecordTime(r.TS)
		p.processRecord(r, cfg)
	}
	if p.buf.eventCount() >= flushBatchSize {
		p.buf.signal()
	}
}

func (p *AnalyticsPlugin) noteRecordTime(ts time.Time) {
	n := ts.UnixNano()
	for {
		cur := p.lastRecordAt.Load()
		if n <= cur || p.lastRecordAt.CompareAndSwap(cur, n) {
			return
		}
	}
}

func dayKey(ts time.Time, cfg *Config) string {
	return ts.In(cfg.location()).Format("2006-01-02")
}

// processRecord runs the pipeline: scope → bot classification → visitor →
// kind → session → enrichment → buffered event(s).
func (p *AnalyticsPlugin) processRecord(r *Record, cfg *Config) {
	if r.header("sec-fetch-site") != "" {
		p.sawSecFetch.Store(true)
	}
	if r.header("cf-ipcountry") != "" {
		p.cfTrusted.Store(true)
	}
	if r.UserID > 0 && cfg.ExcludeLoggedIn {
		return
	}
	if r.Cookies[optOutCookie] != "" {
		return // the visitor opted out of measurement
	}
	if isHardExcluded(r.Path, cfg) {
		return
	}
	norm := normalizePath(r.Path)
	ext := pathExt(norm)
	download := ext != "" && cfg.isDownloadExt(ext)
	if assetExtensions[ext] && !download {
		return
	}
	if isUserExcluded(norm, cfg) {
		return
	}
	ts := r.TS
	if ts.IsZero() {
		ts = p.now()
	}
	kind := detectKind(r, ext, cfg)
	spec := isPrefetch(r)
	verdict := classifyBot(botContext{
		Method: r.Method, Path: norm, UA: r.UserAgent, Headers: r.header,
		HTMLResult:  kind == kindPageview || kind == kindNotFound,
		SawSecFetch: p.sawSecFetch.Load(), Speculative: spec,
	})
	if verdict.isBot() {
		p.buf.addBot(dayKey(ts, cfg), verdict)
		return
	}
	if botOnlyExtensions[ext] && !download {
		return
	}
	if spec && kind != kindPageview {
		// Speculation never downloads files, records 404s or fires goals.
		return
	}
	reqGoals := p.matchRequestGoals(r, norm)
	if kind == "" && len(reqGoals) == 0 {
		return
	}

	c := p.newClient(r.Host, r.IP, r.UserAgent, r.header("accept-language"), r.header("sec-gpc"),
		r.header("cf-ipcountry"), r.header("sec-ch-ua-mobile"), r.header("sec-ch-ua-platform"))
	vid := p.visitorID(c, ts, cfg)
	if vid != "" {
		p.adoptSession(c, vid, ts, cfg)
	}
	prefetch := kind == kindPageview && spec
	if vid != "" {
		flagged := p.rate.isFlagged(vid)
		if !flagged && kind == kindPageview {
			// Speculative loads get their own budget so they cannot hide a
			// crawl, nor use up the visitor's real one.
			key := vid
			if prefetch {
				key += "~s"
			}
			flagged = p.rate.hit(key, ts)
		}
		if flagged {
			p.buf.addBot(dayKey(ts, cfg), botVerdict{botOther, "High request rate"})
			return
		}
	}

	base := Event{
		PrevPath: p.refererPath(r, cfg), ServerMS: int(r.DurationMS), Spec: specKind(r),
		TS: ts, Host: c.Host, Path: norm, PageType: r.NodeType, NodeID: r.NodeID, VisitorID: vid,
		Country: c.Country, Language: c.Language, Device: c.Device, Browser: c.Browser, OS: c.OS,
	}
	req := acquisitionInput{referer: r.Referer, host: r.Host, query: r.Query, ua: r.UserAgent, secFetchSite: r.header("sec-fetch-site")}

	switch kind {
	case kindPageview:
		ev := base
		ev.Kind, ev.EID, ev.IsPrefetch = kindPageview, randomHex(8), prefetch
		p.attachSession(&ev, req, cfg, !prefetch)
		p.buf.addEvent(ev)
		if vid != "" {
			p.beacons.rememberPageview(vid, norm, ev.EID, ev.SessionID, ts, prefetch)
			if !prefetch {
				p.activateReferrer(vid, r, ts)
			}
			p.drainPending(vid, norm, recentPV{eid: ev.EID, ts: ts, sess: ev.SessionID, spec: prefetch}, ts)
		}
		if !prefetch {
			for _, g := range p.matchPageviewGoals(norm) {
				p.buf.addEvent(goalEvent(ev, g.ID))
			}
		}
	case kindDownload, kindNotFound, kindFormError:
		if kind == kindDownload && vid != "" && p.beacons.seenDownload(vid, norm, ts) {
			break
		}
		ev := base
		ev.Kind, ev.EID = kind, randomHex(8)
		p.attachSession(&ev, req, cfg, false)
		p.buf.addEvent(ev)
	}
	if len(reqGoals) > 0 {
		ev := base
		p.attachSession(&ev, req, cfg, false)
		for _, g := range reqGoals {
			p.buf.addEvent(goalEvent(ev, g.ID))
		}
	}
}

// acquisitionInput carries the request fields needed for attribution.
type acquisitionInput struct {
	referer, host, query, ua, secFetchSite string
}

// attachSession sets session id, entry flag and attribution on ev. With
// create=true (a counted pageview) a new session may start; otherwise the
// visitor's live session is used when present. GPC visitors (no visitor
// id) get per-request attribution and an entry heuristic instead.
func (p *AnalyticsPlugin) attachSession(ev *Event, in acquisitionInput, cfg *Config, create bool) {
	refHost := referrerHost(in.referer, in.host, cfg.OwnHosts)
	own := func() attribution { return classifyAcquisition(refHost, in.ua, parseCampaign(in.query)) }
	if ev.VisitorID == "" {
		own().apply(ev)
		if create {
			ev.Entry = isExternalNavigation(in, refHost)
		}
		return
	}
	timeout := cfg.sessionTimeout()
	if create {
		sess, entry := p.sessions.pageview(ev.VisitorID, ev.TS, timeout, own(), ev.Country)
		ev.SessionID, ev.Entry = sess.ID, entry
		sess.Attr.apply(ev)
		return
	}
	if sess, ok := p.sessions.lookup(ev.VisitorID, ev.TS, timeout); ok {
		ev.SessionID = sess.ID
		sess.Attr.apply(ev)
		return
	}
	own().apply(ev)
}

// isExternalNavigation guesses whether an id-less (GPC) pageview starts a
// visit: cross-site or typed navigation, or no same-site referrer.
func isExternalNavigation(in acquisitionInput, refHost string) bool {
	switch strings.ToLower(in.secFetchSite) {
	case "same-origin", "same-site":
		return false
	case "cross-site", "none":
		return true
	}
	return refHost != "" || strings.TrimSpace(in.referer) == ""
}

// goalEvent derives a conversion row from the triggering event.
func goalEvent(src Event, goalID int64) Event {
	ev := src
	ev.Kind, ev.GoalID, ev.EID = kindGoal, goalID, randomHex(8)
	ev.Entry, ev.IsPrefetch, ev.Confirmed, ev.Printed = false, false, false, false
	ev.Viewport, ev.ColorScheme = "", ""
	return ev
}

// specKind names the speculation type of a request ("" for a real load).
func specKind(r *Record) string {
	if !isPrefetch(r) {
		return ""
	}
	if strings.Contains(strings.ToLower(r.header("sec-purpose")), "prerender") {
		return "prerender"
	}
	return "prefetch"
}

// refererPath returns the same-site referrer's path ("" for external or
// missing referrers), i.e. the page the visitor came from.
func (p *AnalyticsPlugin) refererPath(r *Record, cfg *Config) string {
	ref := strings.TrimSpace(r.Referer)
	if ref == "" {
		return ""
	}
	u, err := url.Parse(ref)
	if err != nil || u.Host == "" || !isOwnHost(u.Hostname(), r.Host, cfg) {
		return ""
	}
	return normalizePath(u.Path)
}

// activateReferrer implements server-only activation: a real (non-
// speculative) request whose same-site Referer is a page the visitor
// earlier loaded speculatively proves that page was actually shown, so
// its stored prefetch row is confirmed and starts counting.
func (p *AnalyticsPlugin) activateReferrer(vid string, r *Record, ts time.Time) {
	ref := strings.TrimSpace(r.Referer)
	if ref == "" {
		return
	}
	u, err := url.Parse(ref)
	if err != nil || u.Host == "" || !isOwnHost(u.Hostname(), r.Host, p.config()) {
		return
	}
	if pv, ok := p.beacons.activate(vid, normalizePath(u.Path), ts, activationWindow); ok {
		p.buf.addConfirm(confirmation{EID: pv.eid, Since: pv.ts.Add(-time.Minute)})
	}
}

// adoptSession carries a visit across the daily salt rotation: the same
// browser computed with yesterday's salt (still in memory for the grace
// period) finds its live session and re-keys it to today's visitor id.
func (p *AnalyticsPlugin) adoptSession(c *client, vid string, ts time.Time, cfg *Config) {
	p.salt.setGrace(cfg.sessionTimeout())
	prev := p.salt.previous(ts)
	if prev == nil {
		return
	}
	p.sessions.rekey(visitorHash(prev, c.Host, c.IP, c.UA, c.Language), vid, ts, cfg.sessionTimeout())
}
