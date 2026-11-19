package main

import (
	"context"
	"encoding/json"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// eventBrokenLinks is a request/response event (CoreAPI.EmitCollect) other
// extensions send to read the addresses visitors hit that showed "page not
// found". The redirects extension uses it to offer a redirect for each one.
// No answer means analytics is not active.
//
// Payload: {days?: 1-365 (30), limit?: 1-500 (100), offset?: 0-10000,
// verified?: bool}
// Answer:  {"source":"analytics","from":"YYYY-MM-DD","to":"YYYY-MM-DD",
//
//	"rows":[{"path":"/old","hits":12,"visitors":9}],  (most hits first)
//	"total":N, "confirm_available":bool}
//
// On failure the answer is {"source":"analytics","error":"..."} so callers
// can tell "analytics failed" from "analytics is not active" (no answer).
//
// Reachable by any extension with events:emit and by theme templates
// ({{event}}): it returns only what the Broken links card of the analytics
// dashboard shows. Callers that expose it to users gate it themselves (the
// redirects extension requires view_analytics).
const eventBrokenLinks = "analytics:broken_links"

type brokenLinksRequest struct {
	Days     int  `json:"days"`
	Limit    int  `json:"limit"`
	Offset   int  `json:"offset"`
	Verified bool `json:"verified"`
}

type brokenLink struct {
	Path     string `json:"path"`
	Hits     int64  `json:"hits"`
	Visitors int64  `json:"visitors"`
}

func (p *AnalyticsPlugin) handleBrokenLinksEvent(payload []byte) *pb.EventResponse {
	fail := func(msg string) *pb.EventResponse {
		body, _ := json.Marshal(map[string]string{"source": "analytics", "error": msg})
		return &pb.EventResponse{Handled: true, Result: body}
	}
	var in brokenLinksRequest
	if len(payload) > 0 && json.Unmarshal(payload, &in) != nil {
		return fail("invalid request")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	out, err := p.brokenLinks(ctx, in)
	if err != nil {
		p.logf(ctx, "warn", "broken links request failed: %v", err)
		return fail("analytics could not read broken links")
	}
	body, _ := json.Marshal(out)
	return &pb.EventResponse{Handled: true, Result: body}
}

func (p *AnalyticsPlugin) brokenLinks(ctx context.Context, in brokenLinksRequest) (map[string]any, error) {
	days := clampInt(in.Days, 30, 1, 365)
	limit := clampInt(in.Limit, 100, 1, 500)
	offset := min(max(in.Offset, 0), 10000)
	params := map[string]string{}
	if days != 30 {
		cfg := p.config()
		today := p.now().In(cfg.location())
		params["to"] = today.Format(dateLayout)
		params["from"] = today.AddDate(0, 0, -(days - 1)).Format(dateLayout)
	}
	if in.Verified {
		params["f."+filterVerified] = "1"
	}
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return nil, err
	}
	data, err := p.breakdownData(ctx, q, kindNotFound, "pageviews", limit, offset)
	if err != nil {
		return nil, err
	}
	rows := []brokenLink{}
	if list, ok := data["rows"].([]BreakdownRow); ok {
		for _, r := range list {
			// Paths are stored cut at maxPathLen: a redirect for the cut
			// form would never match the real request.
			if r.Value == "" || len(r.Value) >= maxPathLen {
				continue
			}
			// For event dimensions the hit count rides in Pageviews.
			rows = append(rows, brokenLink{Path: r.Value, Hits: r.Pageviews, Visitors: r.Visitors})
		}
	}
	total, _ := data["total_rows"].(int64)
	return map[string]any{
		"source": "analytics", "from": q.from(), "to": q.to(), "rows": rows,
		"total": total, "confirm_available": p.config().EnhancedMode,
	}, nil
}

func clampInt(v, def, lo, hi int) int {
	switch {
	case v == 0:
		return def
	case v < lo:
		return lo
	case v > hi:
		return hi
	}
	return v
}
