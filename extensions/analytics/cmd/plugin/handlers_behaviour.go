package main

import (
	"context"
	"encoding/json"
	"strings"
)

// behaviourData runs one of the behaviour query functions and returns its
// single jsonb document.
func (p *AnalyticsPlugin) behaviourData(ctx context.Context, fn string, args ...any) (map[string]any, error) {
	rows, err := p.host.DataCall(ctx, fn, args...)
	if err != nil {
		return nil, err
	}
	out := map[string]any{}
	if len(rows) == 0 {
		return out, nil
	}
	switch d := rows[0]["data"].(type) {
	case map[string]any:
		return d, nil
	case string:
		_ = json.Unmarshal([]byte(d), &out)
	case []byte:
		_ = json.Unmarshal(d, &out)
	}
	return out, nil
}

// behaviourRoute serves the behaviour endpoints: behaviour (overview
// tiles), exits, clicks and page?path=.
func (p *AnalyticsPlugin) behaviourRoute(ctx context.Context, path string, params map[string]string, q *statsQuery) (map[string]any, bool, error) {
	var (
		data map[string]any
		err  error
	)
	switch path {
	case "behaviour":
		data, err = p.behaviourData(ctx, "analytics_behaviour_summary", q.from(), q.to(), q.TZ)
	case "exits":
		data, err = p.behaviourData(ctx, "analytics_exit_stats", q.from(), q.to(), q.TZ, q.filterArg())
	case "clicks":
		data, err = p.behaviourData(ctx, "analytics_clicks_stats", q.from(), q.to(), q.TZ)
	case "page":
		pg := normalizePath(strings.TrimSpace(params["path"]))
		if strings.TrimSpace(params["path"]) == "" {
			return nil, true, &queryError{"INVALID_PATH", "path is required"}
		}
		data, err = p.behaviourData(ctx, "analytics_page_insights", pg, q.from(), q.to(), q.TZ)
	default:
		return nil, false, nil
	}
	return data, true, err
}
