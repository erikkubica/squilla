package main

import (
	"context"
	"encoding/json"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// transformPayload mirrors the kernel's render.transform request.
type transformPayload struct {
	HTML string `json:"html"`
	Path string `json:"path"`
	Host string `json:"host"`
	Node struct {
		ID    int64 `json:"id"`
		Is404 bool  `json:"is_404"`
	} `json:"node"`
	User struct {
		ID int64 `json:"id"`
	} `json:"user"`
	GPC     bool              `json:"gpc"`
	Cookies map[string]string `json:"cookies"`
}

var passThrough = &pb.EventResponse{Handled: true}

// handleTransform adds the in-page signals to a finished page. Handled=false
// tells the kernel this plugin is idle (in-page signals off), which stops
// it calling us for a while. Handled=true with no Result leaves the page as
// it is: logged-in users, GPC and opted-out visitors, 404s and excluded
// paths never get any measurement markup.
func (p *AnalyticsPlugin) handleTransform(payload []byte) *pb.EventResponse {
	cfg := p.config()
	if !cfg.EnhancedMode {
		return &pb.EventResponse{Handled: false}
	}
	var in transformPayload
	if json.Unmarshal(payload, &in) != nil || in.Node.ID == 0 || in.Node.Is404 || in.HTML == "" {
		return passThrough
	}
	norm := normalizePath(in.Path)
	switch {
	case in.User.ID > 0 && cfg.ExcludeLoggedIn,
		in.GPC && cfg.RespectGPC,
		in.Cookies[optOutCookie] != "",
		isHardExcluded(norm, cfg), isUserExcluded(norm, cfg):
		return passThrough
	}
	host := in.Host
	res := instrument(in.HTML, instrumentOpts{
		Prefix: cfg.BeaconPrefix, NodeID: in.Node.ID, Host: host, Clicks: cfg.SignalClicks,
		Own: func(h string) bool { return isOwnHost(h, host, cfg) },
	})
	doc := in.HTML
	var secs []section
	if res != nil {
		doc, secs = res.HTML, res.Sections
		p.noteOutline(norm, res)
	}
	style, container := signalsMarkup(cfg, in.Node.ID, secs)
	doc = injectBefore(doc, "</head>", style, true)
	doc = injectBefore(doc, "</body>", container, false)
	p.nodes.set(in.Node.ID, norm)
	return &pb.EventResponse{Handled: true, Result: []byte(doc)}
}

// noteOutline stores the page outline (blocks and links) when it changed,
// so the dashboard can label sections and list links nobody clicks.
func (p *AnalyticsPlugin) noteOutline(path string, res *instrumented) {
	if !p.outlines.changed(path, res.Hash) {
		return
	}
	rows := make([]map[string]any, 0, len(res.Sections)+len(res.Links))
	seen := map[string]bool{}
	for _, s := range res.Sections {
		if !seen[s.Key] {
			seen[s.Key] = true
			rows = append(rows, map[string]any{"kind": "block", "block_key": s.Key, "label": ""})
		}
	}
	for _, l := range res.Links {
		rows = append(rows, map[string]any{"kind": "link", "block_key": l.Block, "label": l.Label, "href": l.Dest})
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if _, err := p.host.DataCall(ctx, "analytics_upsert_outline", path, res.Hash, rows); err != nil {
			p.outlines.forget(path)
			p.logf(ctx, "warn", "analytics: outline upsert failed: %v", err)
		}
	}()
}
