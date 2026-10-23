package main

import (
	"context"
	"encoding/json"
	"net/url"
	"regexp"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

const linksTable = "analytics_links"

var reSlug = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{0,63}$`)

// Link is a first-party tracked outbound link served at /go/<slug>.
type Link struct {
	ID          int64  `json:"id"`
	Slug        string `json:"slug"`
	Label       string `json:"label"`
	Destination string `json:"destination"`
	CreatedAt   string `json:"created_at"`
	Clicks30d   int64  `json:"clicks_30d"`
}

func linkFromRow(r map[string]any) Link {
	return Link{ID: num(r, "id"), Slug: str(r, "slug"), Label: str(r, "label"), Destination: str(r, "destination"), CreatedAt: str(r, "created_at")}
}

// safeDestination accepts only absolute http(s) URLs with a host. It is
// checked on save and again before every redirect.
func safeDestination(dest string) bool {
	if len(dest) > 2048 || strings.ContainsAny(dest, "\r\n\t\x00\\") {
		return false
	}
	u, err := url.Parse(dest)
	if err != nil || u.Host == "" || u.User != nil {
		return false
	}
	return u.Scheme == "http" || u.Scheme == "https"
}

func (l *Link) validate() map[string]string {
	errs := map[string]string{}
	l.Slug = strings.ToLower(strings.TrimSpace(l.Slug))
	l.Label = strings.TrimSpace(l.Label)
	l.Destination = strings.TrimSpace(l.Destination)
	if !reSlug.MatchString(l.Slug) {
		errs["slug"] = "1-64 characters: lower-case letters, digits, - or _"
	}
	if len(l.Label) > 200 {
		errs["label"] = "max 200 characters"
	}
	if !safeDestination(l.Destination) {
		errs["destination"] = "must be an absolute http(s) URL"
	}
	return errs
}

func (p *AnalyticsPlugin) reloadLinks(ctx context.Context) {
	res, err := p.host.DataQuery(ctx, linksTable, coreapi.DataStoreQuery{Limit: 10000})
	if err != nil || res == nil {
		return
	}
	m := make(map[string]Link, len(res.Rows))
	for _, r := range res.Rows {
		l := linkFromRow(r)
		m[l.Slug] = l
	}
	p.links.Store(&m)
}

func (p *AnalyticsPlugin) findLink(ctx context.Context, slug string) (Link, bool) {
	if l, ok := (*p.links.Load())[slug]; ok {
		return l, true
	}
	res, err := p.host.DataQuery(ctx, linksTable, coreapi.DataStoreQuery{Where: map[string]any{"slug": slug}, Limit: 1})
	if err != nil || res == nil || len(res.Rows) == 0 {
		return Link{}, false
	}
	return linkFromRow(res.Rows[0]), true
}

// handleGo redirects /go/<slug> to its stored destination (302) and
// records an outbound event plus any link goals. Unknown slugs are 404 —
// destinations never come from the request, so there is no open redirect.
func (p *AnalyticsPlugin) handleGo(ctx context.Context, slug string, req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	slug = strings.ToLower(strings.TrimSuffix(slug, "/"))
	notFound := &pb.PluginHTTPResponse{StatusCode: 404, Headers: map[string]string{"Content-Type": "text/plain; charset=utf-8"}, Body: []byte("Not found")}
	if !reSlug.MatchString(slug) {
		return notFound
	}
	link, ok := p.findLink(ctx, slug)
	if !ok || !safeDestination(link.Destination) {
		return notFound
	}
	p.recordOutbound(slug, req)
	return &pb.PluginHTTPResponse{
		StatusCode: 302,
		Headers: map[string]string{
			"Location": link.Destination, "Cache-Control": "no-store", "X-Robots-Tag": "noindex",
			"Content-Type": "text/plain; charset=utf-8",
		},
		Body: []byte("Redirecting"),
	}
}

func (p *AnalyticsPlugin) recordOutbound(slug string, req *pb.PluginHTTPRequest) {
	cfg := p.config()
	h := headerGetter(req.GetHeaders())
	now := p.now()
	verdict := classifyBot(botContext{
		Method: req.GetMethod(), Path: "/go/" + slug, UA: h("user-agent"), Headers: func(n string) string { return h(n) },
		SawSecFetch: p.sawSecFetch.Load(),
	})
	if verdict.isBot() {
		p.buf.addBot(dayKey(now, cfg), verdict)
		return
	}
	country := ""
	if p.cfTrusted.Load() {
		country = h("cf-ipcountry")
	}
	c := p.newClient(h("host"), h("x-forwarded-for"), h("user-agent"), h("accept-language"), h("sec-gpc"),
		country, h("sec-ch-ua-mobile"), h("sec-ch-ua-platform"))
	vid := p.visitorID(c, now, cfg)
	if vid != "" && p.rate.isFlagged(vid) {
		return
	}
	fromPath := ""
	if u, err := url.Parse(h("referer")); err == nil && u.Host != "" && isOwnHost(u.Hostname(), c.Host, cfg) {
		fromPath = normalizePath(u.Path)
	}
	ev := Event{
		TS: now, EID: randomHex(8), Kind: kindOutbound, Host: c.Host, Path: fromPath, Target: slug, VisitorID: vid,
		Country: c.Country, Language: c.Language, Device: c.Device, Browser: c.Browser, OS: c.OS,
	}
	in := acquisitionInput{referer: h("referer"), host: c.Host, ua: c.UA, secFetchSite: h("sec-fetch-site")}
	p.attachSession(&ev, in, cfg, false)
	p.buf.addEvent(ev)
	for _, g := range p.matchLinkGoals(slug) {
		p.buf.addEvent(goalEvent(ev, g.ID))
	}
}

func (p *AnalyticsPlugin) handleListLinks(ctx context.Context) *pb.PluginHTTPResponse {
	res, err := p.host.DataQuery(ctx, linksTable, coreapi.DataStoreQuery{OrderBy: "id ASC", Limit: 10000})
	if err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	cfg := p.config()
	today := p.now().In(cfg.location())
	clicks := map[string]int64{}
	if rows, err := p.host.DataCall(ctx, "analytics_link_clicks", today.AddDate(0, 0, -29).Format("2006-01-02"),
		today.Format("2006-01-02"), cfg.Timezone); err == nil {
		for _, r := range rows {
			clicks[str(r, "slug")] = num(r, "clicks")
		}
	}
	out := make([]Link, 0, len(res.Rows))
	for _, r := range res.Rows {
		l := linkFromRow(r)
		l.Clicks30d = clicks[l.Slug]
		out = append(out, l)
	}
	return jsonResponse(200, map[string]any{"rows": out})
}

func (p *AnalyticsPlugin) handleSaveLink(ctx context.Context, id int64, body []byte) *pb.PluginHTTPResponse {
	var l Link
	if err := json.Unmarshal(body, &l); err != nil {
		return jsonError(400, "INVALID_JSON", "request body must be a JSON link")
	}
	if errs := l.validate(); len(errs) > 0 {
		return validationError(errs)
	}
	if dup, _ := p.host.DataQuery(ctx, linksTable, coreapi.DataStoreQuery{Where: map[string]any{"slug": l.Slug}, Limit: 1}); dup != nil && len(dup.Rows) > 0 && num(dup.Rows[0], "id") != id {
		return validationError(map[string]string{"slug": "already used by another link"})
	}
	row := map[string]any{"slug": l.Slug, "label": l.Label, "destination": l.Destination}
	var saved map[string]any
	if id == 0 {
		created, err := p.host.DataCreate(ctx, linksTable, row)
		if err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		saved = created
	} else {
		existing, err := p.getRow(ctx, linksTable, id)
		if err != nil || existing == nil {
			return jsonError(404, "NOT_FOUND", "link not found")
		}
		if err := p.host.DataUpdate(ctx, linksTable, uint(id), row); err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		for k, v := range row {
			existing[k] = v
		}
		saved = existing
	}
	p.reloadLinks(ctx)
	if saved["created_at"] == nil {
		saved["created_at"] = p.now().UTC().Format(time.RFC3339)
	}
	return jsonResponse(200, linkFromRow(saved))
}

func (p *AnalyticsPlugin) handleDeleteLink(ctx context.Context, id int64) *pb.PluginHTTPResponse {
	if row, err := p.getRow(ctx, linksTable, id); err != nil || row == nil {
		return jsonError(404, "NOT_FOUND", "link not found")
	}
	if err := p.host.DataDelete(ctx, linksTable, uint(id)); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	p.reloadLinks(ctx)
	return jsonResponse(200, map[string]any{"ok": true})
}
