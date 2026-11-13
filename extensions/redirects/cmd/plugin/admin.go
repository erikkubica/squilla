package main

import (
	"context"
	"encoding/json"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// routeAdmin dispatches /admin/api/ext/redirects/* (authenticated, gated
// by manage_redirects in the manifest's admin_routes).
func (p *Plugin) routeAdmin(ctx context.Context, req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	method := strings.ToUpper(req.GetMethod())
	path := strings.Trim(strings.TrimPrefix(req.GetPath(), "/admin/api/ext/redirects"), "/")
	params := req.GetQueryParams()
	body := req.GetBody()

	switch {
	case path == "rules" && method == "GET":
		return p.handleList(params)
	case path == "rules" && method == "POST":
		return p.handleSave(ctx, 0, body)
	case path == "rules/bulk" && method == "POST":
		return p.handleBulk(ctx, body)
	case path == "import" && method == "POST":
		return p.handleImport(ctx, body)
	case path == "export" && method == "GET":
		return p.handleExport()
	case path == "test" && method == "POST":
		return p.handleTest(body)
	case path == "settings" && method == "GET":
		return jsonResponse(200, map[string]any{"auto_create": p.autoCreate.Load()})
	case path == "settings" && method == "PUT":
		return p.handleSaveSettings(ctx, body)
	}
	if rest, ok := strings.CutPrefix(path, "rules/"); ok {
		id, err := strconv.ParseInt(rest, 10, 64)
		if err != nil || id <= 0 {
			return jsonError(404, "NOT_FOUND", "redirect not found")
		}
		switch method {
		case "PUT":
			return p.handleSave(ctx, id, body)
		case "DELETE":
			return p.handleDelete(ctx, id)
		}
	}
	return jsonError(404, "NOT_FOUND", "not found")
}

// withLiveHits adds counts the flusher hasn't written yet.
func (p *Plugin) withLiveHits(r Rule) Rule {
	if n, last := p.hits.peek(r.ID); n > 0 {
		r.Hits += n
		r.LastHitAt = last.UTC().Format(time.RFC3339)
	}
	return r
}

func (p *Plugin) handleList(params map[string]string) *pb.PluginHTTPResponse {
	all := p.rules.Load().all
	counts := map[string]int{"all": len(all)}
	search := strings.ToLower(strings.TrimSpace(params["search"]))
	tab := params["tab"]

	rows := make([]Rule, 0, len(all))
	for _, r := range all {
		if r.Origin == originAuto {
			counts["auto"]++
		} else {
			counts["manual"]++
		}
		if !r.Enabled {
			counts["disabled"]++
		}
		switch tab {
		case "manual":
			if r.Origin == originAuto {
				continue
			}
		case "auto":
			if r.Origin != originAuto {
				continue
			}
		case "disabled":
			if r.Enabled {
				continue
			}
		}
		if search != "" && !strings.Contains(strings.ToLower(r.Source+"\n"+r.Target+"\n"+r.Note), search) {
			continue
		}
		rows = append(rows, p.withLiveHits(r))
	}
	if params["sort"] == "hits" {
		sort.SliceStable(rows, func(i, j int) bool { return rows[i].Hits > rows[j].Hits })
	}

	perPage, _ := strconv.Atoi(params["per_page"])
	if perPage <= 0 || perPage > 200 {
		perPage = 25
	}
	page, _ := strconv.Atoi(params["page"])
	if page < 1 {
		page = 1
	}
	total := len(rows)
	start := min((page-1)*perPage, total)
	end := min(start+perPage, total)
	return jsonResponse(200, map[string]any{
		"rows": rows[start:end], "total": total, "page": page, "per_page": perPage, "counts": counts,
	})
}

// sourceKey identifies a rule's source for duplicate detection.
func sourceKey(r Rule) string {
	if r.MatchType == matchRegex {
		return r.MatchType + "|" + r.Source
	}
	return r.MatchType + "|" + strings.ToLower(r.Source)
}

func (p *Plugin) handleSave(ctx context.Context, id int64, body []byte) *pb.PluginHTTPResponse {
	in := Rule{Enabled: true, KeepQuery: true}
	if err := json.Unmarshal(body, &in); err != nil {
		return jsonError(400, "INVALID_JSON", "request body must be a JSON redirect")
	}
	p.writeMu.Lock()
	defer p.writeMu.Unlock()

	in.Origin, in.NodeID = originManual, 0
	if id != 0 {
		existing, ok := p.findRule(id)
		if !ok {
			return jsonError(404, "NOT_FOUND", "redirect not found")
		}
		in.Origin, in.NodeID = existing.Origin, existing.NodeID
	}
	if errs := in.normalize(); len(errs) > 0 {
		return validationError(errs)
	}
	for _, r := range p.rules.Load().all {
		if r.ID != id && sourceKey(r) == sourceKey(in) {
			return validationError(map[string]string{"source": "another redirect already uses this URL"})
		}
	}
	var err error
	if id == 0 {
		err = p.createRule(ctx, &in)
	} else {
		err = p.updateRule(ctx, id, in.row())
	}
	if err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	if err := p.reloadRules(ctx); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	return jsonResponse(200, map[string]any{"ok": true})
}

func (p *Plugin) handleDelete(ctx context.Context, id int64) *pb.PluginHTTPResponse {
	p.writeMu.Lock()
	defer p.writeMu.Unlock()
	if _, ok := p.findRule(id); !ok {
		return jsonError(404, "NOT_FOUND", "redirect not found")
	}
	if err := p.host.DataDelete(ctx, rulesTable, uint(id)); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	_ = p.reloadRules(ctx)
	return jsonResponse(200, map[string]any{"ok": true})
}

func (p *Plugin) handleBulk(ctx context.Context, body []byte) *pb.PluginHTTPResponse {
	var in struct {
		IDs    []int64 `json:"ids"`
		Action string  `json:"action"`
	}
	if err := json.Unmarshal(body, &in); err != nil || len(in.IDs) == 0 {
		return jsonError(400, "INVALID_JSON", "expected {ids: [...], action}")
	}
	if in.Action != "enable" && in.Action != "disable" && in.Action != "delete" {
		return validationError(map[string]string{"action": "must be enable, disable or delete"})
	}
	p.writeMu.Lock()
	defer p.writeMu.Unlock()
	done := 0
	for _, id := range in.IDs {
		if _, ok := p.findRule(id); !ok {
			continue
		}
		var err error
		if in.Action == "delete" {
			err = p.host.DataDelete(ctx, rulesTable, uint(id))
		} else {
			err = p.updateRule(ctx, id, map[string]any{"enabled": in.Action == "enable"})
		}
		if err != nil {
			_ = p.reloadRules(ctx)
			return jsonError(500, "INTERNAL", err.Error())
		}
		done++
	}
	_ = p.reloadRules(ctx)
	return jsonResponse(200, map[string]any{"ok": true, "affected": done})
}

func (p *Plugin) handleSaveSettings(ctx context.Context, body []byte) *pb.PluginHTTPResponse {
	var in struct {
		AutoCreate *bool `json:"auto_create"`
	}
	if err := json.Unmarshal(body, &in); err != nil || in.AutoCreate == nil {
		return jsonError(400, "INVALID_JSON", "expected {auto_create: bool}")
	}
	if err := p.saveAutoCreate(ctx, *in.AutoCreate); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	return jsonResponse(200, map[string]any{"auto_create": *in.AutoCreate})
}

// testHop is one step of a simulated request.
type testHop struct {
	RuleID     int64  `json:"rule_id"`
	Source     string `json:"source"`
	MatchType  string `json:"match_type"`
	StatusCode int    `json:"status_code"`
	Location   string `json:"location"`
}

// handleTest simulates a visit to a URL and follows same-site redirects, so
// an editor can see where a URL ends up and whether rules chain or loop.
func (p *Plugin) handleTest(body []byte) *pb.PluginHTTPResponse {
	var in struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(body, &in); err != nil || strings.TrimSpace(in.URL) == "" {
		return validationError(map[string]string{"url": "required"})
	}
	path, rawQuery := splitSource(in.URL)
	if !strings.HasPrefix(path, "/") {
		return validationError(map[string]string{"url": "enter a path such as /old-page or a full URL of this site"})
	}
	rs := p.rules.Load()
	hops := []testHop{}
	seen := map[string]bool{}
	loop := false
	for len(hops) < 10 {
		key := strings.ToLower(normalizePath(path)) + "?" + rawQuery
		if seen[key] {
			loop = true
			break
		}
		seen[key] = true
		query, _ := url.ParseQuery(rawQuery)
		m, ok := rs.resolve(path, query)
		if !ok {
			break
		}
		hops = append(hops, testHop{m.Rule.ID, m.Rule.Source, m.Rule.MatchType, m.Rule.StatusCode, m.Location})
		if m.Location == "" || isAbsoluteURL(m.Location) {
			break
		}
		next, _, _ := strings.Cut(m.Location, "#")
		path, rawQuery, _ = strings.Cut(next, "?")
	}
	return jsonResponse(200, map[string]any{"matched": len(hops) > 0, "hops": hops, "loop": loop})
}
