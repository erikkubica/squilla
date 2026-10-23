package main

import (
	"context"
	"encoding/json"
	"strings"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

const goalsTable = "analytics_goals"

// Goal is a conversion definition.
type Goal struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Kind        string `json:"kind"`
	PathPattern string `json:"path_pattern"`
	Method      string `json:"method"`
	LinkSlug    string `json:"link_slug"`
	CreatedAt   string `json:"created_at"`
}

func goalFromRow(r map[string]any) Goal {
	return Goal{
		ID: num(r, "id"), Name: str(r, "name"), Kind: str(r, "kind"), PathPattern: str(r, "path_pattern"),
		Method: str(r, "method"), LinkSlug: str(r, "link_slug"), CreatedAt: str(r, "created_at"),
	}
}

// validate normalises the goal and returns field errors.
func (g *Goal) validate() map[string]string {
	errs := map[string]string{}
	g.Name = strings.TrimSpace(g.Name)
	g.Kind = strings.ToLower(strings.TrimSpace(g.Kind))
	g.Method = strings.ToUpper(strings.TrimSpace(g.Method))
	g.PathPattern = strings.ToLower(strings.TrimSpace(g.PathPattern))
	g.LinkSlug = strings.ToLower(strings.TrimSpace(g.LinkSlug))
	if g.Name == "" || len(g.Name) > 100 {
		errs["name"] = "required (max 100 characters)"
	}
	switch g.Kind {
	case "pageview", "request":
		if !strings.HasPrefix(g.PathPattern, "/") || len(g.PathPattern) > 512 {
			errs["path_pattern"] = "must start with / (use * as wildcard)"
		} else if len(g.PathPattern) > 1 && !strings.HasSuffix(g.PathPattern, "*") {
			g.PathPattern = strings.TrimRight(g.PathPattern, "/")
		}
		g.LinkSlug = ""
		if g.Kind == "pageview" {
			g.Method = ""
		} else {
			if g.Method == "" {
				g.Method = "POST"
			}
			switch g.Method {
			case "*", "GET", "POST", "PUT", "PATCH", "DELETE":
			default:
				errs["method"] = "must be GET, POST, PUT, PATCH, DELETE or *"
			}
		}
	case "link":
		if !reSlug.MatchString(g.LinkSlug) {
			errs["link_slug"] = "must be a tracked link slug"
		}
		g.PathPattern, g.Method = "", ""
	default:
		errs["kind"] = "must be pageview, request or link"
	}
	return errs
}

func (p *AnalyticsPlugin) reloadGoals(ctx context.Context) {
	res, err := p.host.DataQuery(ctx, goalsTable, coreapi.DataStoreQuery{OrderBy: "id ASC", Limit: 1000})
	if err != nil || res == nil {
		return
	}
	goals := make([]Goal, 0, len(res.Rows))
	for _, r := range res.Rows {
		goals = append(goals, goalFromRow(r))
	}
	p.goals.Store(&goals)
}

func (p *AnalyticsPlugin) matchPageviewGoals(path string) []Goal {
	var out []Goal
	for _, g := range *p.goals.Load() {
		if g.Kind == "pageview" && globMatch(g.PathPattern, path) {
			out = append(out, g)
		}
	}
	return out
}

func (p *AnalyticsPlugin) matchRequestGoals(r *Record, path string) []Goal {
	if r.Status < 200 || r.Status >= 400 {
		return nil
	}
	var out []Goal
	for _, g := range *p.goals.Load() {
		if g.Kind != "request" || (g.Method != "*" && g.Method != "" && !strings.EqualFold(g.Method, r.Method)) {
			continue
		}
		if globMatch(g.PathPattern, path) {
			out = append(out, g)
		}
	}
	return out
}

func (p *AnalyticsPlugin) matchLinkGoals(slug string) []Goal {
	var out []Goal
	for _, g := range *p.goals.Load() {
		if g.Kind == "link" && g.LinkSlug == slug {
			out = append(out, g)
		}
	}
	return out
}

func (p *AnalyticsPlugin) handleListGoals(ctx context.Context) *pb.PluginHTTPResponse {
	res, err := p.host.DataQuery(ctx, goalsTable, coreapi.DataStoreQuery{OrderBy: "id ASC", Limit: 1000})
	if err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	rows := make([]Goal, 0, len(res.Rows))
	for _, r := range res.Rows {
		rows = append(rows, goalFromRow(r))
	}
	return jsonResponse(200, map[string]any{"rows": rows})
}

func (p *AnalyticsPlugin) handleSaveGoal(ctx context.Context, id int64, body []byte) *pb.PluginHTTPResponse {
	var g Goal
	if err := json.Unmarshal(body, &g); err != nil {
		return jsonError(400, "INVALID_JSON", "request body must be a JSON goal")
	}
	if errs := g.validate(); len(errs) > 0 {
		return validationError(errs)
	}
	row := map[string]any{"name": g.Name, "kind": g.Kind, "path_pattern": g.PathPattern, "method": g.Method, "link_slug": g.LinkSlug}
	var saved map[string]any
	if id == 0 {
		created, err := p.host.DataCreate(ctx, goalsTable, row)
		if err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		saved = created
	} else {
		existing, err := p.getRow(ctx, goalsTable, id)
		if err != nil || existing == nil {
			return jsonError(404, "NOT_FOUND", "goal not found")
		}
		if err := p.host.DataUpdate(ctx, goalsTable, uint(id), row); err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		for k, v := range row {
			existing[k] = v
		}
		saved = existing
	}
	p.reloadGoals(ctx)
	return jsonResponse(200, goalFromRow(saved))
}

func (p *AnalyticsPlugin) handleDeleteGoal(ctx context.Context, id int64) *pb.PluginHTTPResponse {
	if row, err := p.getRow(ctx, goalsTable, id); err != nil || row == nil {
		return jsonError(404, "NOT_FOUND", "goal not found")
	}
	if err := p.host.DataDelete(ctx, goalsTable, uint(id)); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	p.reloadGoals(ctx)
	return jsonResponse(200, map[string]any{"ok": true})
}

// getRow fetches one row by id (nil when absent).
func (p *AnalyticsPlugin) getRow(ctx context.Context, table string, id int64) (map[string]any, error) {
	res, err := p.host.DataQuery(ctx, table, coreapi.DataStoreQuery{Where: map[string]any{"id": id}, Limit: 1})
	if err != nil {
		return nil, err
	}
	if res == nil || len(res.Rows) == 0 {
		return nil, nil
	}
	return res.Rows[0], nil
}
