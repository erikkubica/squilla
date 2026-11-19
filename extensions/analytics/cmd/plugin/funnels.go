package main

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

const funnelsTable = "analytics_funnels"

// FunnelStep is one stage of a funnel: a page (glob, * as wildcard) or a goal.
type FunnelStep struct {
	Kind  string `json:"kind"`
	Value string `json:"value"`
	Label string `json:"label"`
}

// Funnel is an ordered path through the site a visit should follow.
type Funnel struct {
	ID        int64        `json:"id"`
	Name      string       `json:"name"`
	Steps     []FunnelStep `json:"steps"`
	CreatedAt string       `json:"created_at"`
}

func funnelFromRow(r map[string]any) Funnel {
	f := Funnel{ID: num(r, "id"), Name: str(r, "name"), CreatedAt: str(r, "created_at"), Steps: []FunnelStep{}}
	_ = json.Unmarshal([]byte(str(r, "steps")), &f.Steps)
	return f
}

func (f *Funnel) validate(goals []Goal) map[string]string {
	errs := map[string]string{}
	f.Name = strings.TrimSpace(f.Name)
	if f.Name == "" || len(f.Name) > 100 {
		errs["name"] = "required (max 100 characters)"
	}
	if len(f.Steps) < 2 || len(f.Steps) > 10 {
		errs["steps"] = "a funnel has 2 to 10 steps"
		return errs
	}
	for i := range f.Steps {
		s := &f.Steps[i]
		s.Kind = strings.ToLower(strings.TrimSpace(s.Kind))
		s.Value = strings.TrimSpace(s.Value)
		s.Label = strings.TrimSpace(s.Label)
		if len(s.Label) > 80 {
			s.Label = s.Label[:80]
		}
		key := "steps." + strconv.Itoa(i)
		switch s.Kind {
		case "page":
			s.Value = strings.ToLower(s.Value)
			if !strings.HasPrefix(s.Value, "/") || len(s.Value) > 512 {
				errs[key] = "page must start with / (use * as wildcard)"
			} else if len(s.Value) > 1 && !strings.HasSuffix(s.Value, "*") {
				s.Value = strings.TrimRight(s.Value, "/")
			}
		case "goal":
			id, err := strconv.ParseInt(s.Value, 10, 64)
			found := false
			for _, g := range goals {
				if g.ID == id {
					found = true
				}
			}
			if err != nil || !found {
				errs[key] = "must be an existing goal"
			}
		default:
			errs[key] = "kind must be page or goal"
		}
	}
	return errs
}

// globLike turns a * glob into a LIKE pattern (other LIKE characters literal).
func globLike(glob string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`, `*`, `%`)
	return r.Replace(strings.ToLower(glob))
}

func (p *AnalyticsPlugin) handleListFunnels(ctx context.Context) *pb.PluginHTTPResponse {
	res, err := p.host.DataQuery(ctx, funnelsTable, coreapi.DataStoreQuery{OrderBy: "id ASC", Limit: 200})
	if err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	rows := make([]Funnel, 0, len(res.Rows))
	for _, r := range res.Rows {
		rows = append(rows, funnelFromRow(r))
	}
	return jsonResponse(200, map[string]any{"rows": rows})
}

func (p *AnalyticsPlugin) handleSaveFunnel(ctx context.Context, id int64, body []byte) *pb.PluginHTTPResponse {
	var f Funnel
	if err := json.Unmarshal(body, &f); err != nil {
		return jsonError(400, "INVALID_JSON", "request body must be a JSON funnel")
	}
	if errs := f.validate(*p.goals.Load()); len(errs) > 0 {
		return validationError(errs)
	}
	steps, _ := json.Marshal(f.Steps)
	row := map[string]any{"name": f.Name, "steps": string(steps)}
	if id == 0 {
		created, err := p.host.DataCreate(ctx, funnelsTable, row)
		if err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		return jsonResponse(200, funnelFromRow(created))
	}
	existing, err := p.getRow(ctx, funnelsTable, id)
	if err != nil || existing == nil {
		return jsonError(404, "NOT_FOUND", "funnel not found")
	}
	if err := p.host.DataUpdate(ctx, funnelsTable, uint(id), row); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	for k, v := range row {
		existing[k] = v
	}
	return jsonResponse(200, funnelFromRow(existing))
}

func (p *AnalyticsPlugin) handleDeleteFunnel(ctx context.Context, id int64) *pb.PluginHTTPResponse {
	if row, err := p.getRow(ctx, funnelsTable, id); err != nil || row == nil {
		return jsonError(404, "NOT_FOUND", "funnel not found")
	}
	if err := p.host.DataDelete(ctx, funnelsTable, uint(id)); err != nil {
		return jsonError(500, "INTERNAL", err.Error())
	}
	return jsonResponse(200, map[string]any{"ok": true})
}

// handleFunnelStats walks every visit in the period through the funnel.
func (p *AnalyticsPlugin) handleFunnelStats(ctx context.Context, id int64, params map[string]string) *pb.PluginHTTPResponse {
	row, err := p.getRow(ctx, funnelsTable, id)
	if err != nil || row == nil {
		return jsonError(404, "NOT_FOUND", "funnel not found")
	}
	f := funnelFromRow(row)
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err)
	}
	steps := make([]map[string]string, 0, len(f.Steps))
	for _, s := range f.Steps {
		m := map[string]string{"kind": s.Kind, "value": s.Value}
		if s.Kind == "page" {
			m["like"] = globLike(s.Value)
		}
		steps = append(steps, m)
	}
	data, err := p.behaviourData(ctx, "analytics_funnel_stats", q.from(), q.to(), q.TZ, steps)
	if err != nil {
		return errorResponse(err)
	}
	return jsonResponse(200, map[string]any{"funnel": f, "from": q.from(), "to": q.to(), "stats": data})
}
