package main

import (
	"context"
	"math"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// Metrics is the KPI block of the summary endpoint.
type Metrics struct {
	Visitors           int64   `json:"visitors"`
	Pageviews          int64   `json:"pageviews"`
	Visits             int64   `json:"visits"`
	PagesPerVisit      float64 `json:"pages_per_visit"`
	SinglePageRate     float64 `json:"single_page_rate"`
	MedianVisitSeconds *int64  `json:"median_visit_seconds"`
	Conversions        int64   `json:"conversions"`
	ConversionRate     float64 `json:"conversion_rate"`
}

// TimePoint is one timeseries bucket.
type TimePoint struct {
	T           string `json:"t"`
	Visitors    int64  `json:"visitors"`
	Pageviews   int64  `json:"pageviews"`
	Visits      int64  `json:"visits"`
	Conversions int64  `json:"conversions"`
}

func ratio(a, b int64) float64 {
	if b <= 0 {
		return 0
	}
	return math.Round(float64(a)/float64(b)*10000) / 10000
}

func (p *AnalyticsPlugin) metrics(ctx context.Context, q *statsQuery) (Metrics, error) {
	rows, err := p.host.DataCall(ctx, "analytics_summary", q.from(), q.to(), q.TZ, q.filterArg())
	if err != nil {
		return Metrics{}, err
	}
	var r map[string]any
	if len(rows) > 0 {
		r = rows[0]
	}
	m := Metrics{
		Visitors: num(r, "visitors"), Pageviews: num(r, "pageviews"), Visits: num(r, "visits"),
		Conversions: num(r, "conversions"),
	}
	m.PagesPerVisit = math.Round(ratio(m.Pageviews, m.Visits)*100) / 100
	single, multi := num(r, "single_page_visits"), num(r, "multi_page_visits")
	m.SinglePageRate = ratio(single, single+multi)
	m.ConversionRate = ratio(num(r, "converting_visits"), m.Visits)
	if f, ok := toFloat(r["median_visit_seconds"]); ok && r["median_visit_seconds"] != nil {
		s := int64(math.Round(f))
		m.MedianVisitSeconds = &s
	}
	return m, nil
}

func (p *AnalyticsPlugin) series(ctx context.Context, q *statsQuery, interval string) ([]TimePoint, error) {
	rows, err := p.host.DataCall(ctx, "analytics_timeseries", q.from(), q.to(), q.TZ, interval, q.filterArg())
	if err != nil {
		return nil, err
	}
	out := make([]TimePoint, 0, len(rows))
	for _, r := range rows {
		out = append(out, TimePoint{T: str(r, "t"), Visitors: num(r, "visitors"), Pageviews: num(r, "pageviews"),
			Visits: num(r, "visits"), Conversions: num(r, "conversions")})
	}
	return out, nil
}

// sparkInterval keeps sparklines at a readable number of points.
func sparkInterval(days int) string {
	switch {
	case days > 1000:
		return "month"
	case days > 120:
		return "week"
	}
	return "day"
}

func (p *AnalyticsPlugin) summaryData(ctx context.Context, q *statsQuery) (map[string]any, error) {
	cur, err := p.metrics(ctx, q)
	if err != nil {
		return nil, err
	}
	var prev *Metrics
	if q.hasPrev() {
		pm, err := p.metrics(ctx, q.prev())
		if err != nil {
			return nil, err
		}
		prev = &pm
	}
	pts, err := p.series(ctx, q, sparkInterval(q.days()))
	if err != nil {
		return nil, err
	}
	spark := map[string][]int64{"visitors": {}, "pageviews": {}, "visits": {}, "conversions": {}}
	for _, pt := range pts {
		spark["visitors"] = append(spark["visitors"], pt.Visitors)
		spark["pageviews"] = append(spark["pageviews"], pt.Pageviews)
		spark["visits"] = append(spark["visits"], pt.Visits)
		spark["conversions"] = append(spark["conversions"], pt.Conversions)
	}
	return map[string]any{
		"range":      map[string]string{"from": q.from(), "to": q.to(), "tz": q.TZ},
		"current":    cur,
		"previous":   prev,
		"sparklines": spark,
	}, nil
}

func (p *AnalyticsPlugin) timeseriesData(ctx context.Context, q *statsQuery, interval string) (map[string]any, error) {
	switch interval {
	case "":
		interval = "day"
	case "hour":
		if q.days() > 31 {
			return nil, &queryError{"INVALID_INTERVAL", "hourly data is limited to 31 days"}
		}
	case "day", "week", "month":
	default:
		return nil, &queryError{"INVALID_INTERVAL", "interval must be hour, day, week or month"}
	}
	pts, err := p.series(ctx, q, interval)
	if err != nil {
		return nil, err
	}
	var prev []TimePoint
	if q.hasPrev() {
		if prev, err = p.series(ctx, q.prev(), interval); err != nil {
			return nil, err
		}
		prev = alignPoints(prev, len(pts))
	}
	return map[string]any{"interval": interval, "points": pts, "previous_points": prev}, nil
}

// alignPoints pads (zero buckets) or truncates previous_points so they line
// up with points by index (week/month bucketing can differ by one).
func alignPoints(prev []TimePoint, n int) []TimePoint {
	if len(prev) > n {
		return prev[:n]
	}
	for len(prev) < n {
		prev = append(prev, TimePoint{})
	}
	return prev
}

// BreakdownRow is one row of a breakdown table.
type BreakdownRow struct {
	Value       string  `json:"value"`
	Label       string  `json:"label"`
	Visitors    int64   `json:"visitors"`
	Pageviews   int64   `json:"pageviews"`
	Visits      int64   `json:"visits"`
	Conversions int64   `json:"conversions"`
	Share       float64 `json:"share"`
}

func (p *AnalyticsPlugin) breakdownData(ctx context.Context, q *statsQuery, dim, sort string, limit, offset int) (map[string]any, error) {
	if !isBreakdownDim(dim) {
		return nil, &queryError{"INVALID_DIMENSION", "unknown breakdown dimension"}
	}
	switch sort {
	case "":
		sort = "visitors"
	case "visitors", "pageviews", "visits", "conversions":
	default:
		return nil, &queryError{"INVALID_SORT", "sort must be visitors, pageviews, visits or conversions"}
	}
	rows, err := p.host.DataCall(ctx, "analytics_breakdown", q.from(), q.to(), q.TZ, dim, q.filterArg(), sort, int64(limit), int64(offset))
	if err != nil {
		return nil, err
	}
	out := make([]BreakdownRow, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = num(r, "total_rows")
		share, _ := toFloat(r["share"])
		v := str(r, "value")
		out = append(out, BreakdownRow{
			Value: v, Label: p.label(dim, v), Visitors: num(r, "visitors"), Pageviews: num(r, "pageviews"),
			Visits: num(r, "visits"), Conversions: num(r, "conversions"), Share: math.Round(share*10000) / 10000,
		})
	}
	if len(rows) == 0 && offset > 0 {
		// total_rows rides on every row; an empty page past the end needs a count.
		if all, err := p.host.DataCall(ctx, "analytics_breakdown", q.from(), q.to(), q.TZ, dim, q.filterArg(), sort, int64(1), int64(0)); err == nil && len(all) > 0 {
			total = num(all[0], "total_rows")
		}
	}
	return map[string]any{"dimension": dim, "rows": out, "total_rows": total}, nil
}

func (p *AnalyticsPlugin) handleRealtime(ctx context.Context) *pb.PluginHTTPResponse {
	cfg := p.config()
	rows, err := p.host.DataCall(ctx, "analytics_realtime", cfg.Timezone)
	if err != nil {
		return jsonError(500, "QUERY_FAILED", err.Error())
	}
	data := map[string]any{}
	if len(rows) > 0 {
		if m, ok := rows[0]["data"].(map[string]any); ok {
			data = m
		}
	}
	// Minute buckets: ISO timestamps with the site-timezone offset.
	if mins, ok := data["per_minute"].([]any); ok {
		for _, it := range mins {
			if m, ok := it.(map[string]any); ok {
				if t, err := time.Parse(time.RFC3339Nano, str(m, "t")); err == nil {
					m["t"] = t.In(cfg.location()).Format(time.RFC3339)
				}
			}
		}
	}
	for _, k := range []string{"per_minute", "recent", "top_pages"} {
		if data[k] == nil {
			data[k] = []any{}
		}
	}
	return jsonResponse(200, data)
}

func (p *AnalyticsPlugin) heatmapData(ctx context.Context, q *statsQuery) (map[string]any, error) {
	rows, err := p.host.DataCall(ctx, "analytics_heatmap", q.from(), q.to(), q.TZ, q.filterArg())
	if err != nil {
		return nil, err
	}
	cells := make([]map[string]int64, 0, len(rows))
	for _, r := range rows {
		cells = append(cells, map[string]int64{"dow": num(r, "dow"), "hour": num(r, "hour"),
			"pageviews": num(r, "pageviews"), "visitors": num(r, "visitors")})
	}
	return map[string]any{"cells": cells}, nil
}

func (p *AnalyticsPlugin) botsData(ctx context.Context, q *statsQuery) (map[string]any, error) {
	rows, err := p.host.DataCall(ctx, "analytics_bots", q.from(), q.to())
	if err != nil {
		return nil, err
	}
	data := map[string]any{}
	if len(rows) > 0 {
		if m, ok := rows[0]["data"].(map[string]any); ok {
			data = m
		}
	}
	for _, k := range []string{"totals", "timeseries", "top"} {
		if data[k] == nil {
			data[k] = []any{}
		}
	}
	return data, nil
}

func (p *AnalyticsPlugin) goalStatsData(ctx context.Context, q *statsQuery) (map[string]any, error) {
	rows, err := p.host.DataCall(ctx, "analytics_goal_stats", q.from(), q.to(), q.TZ, q.filterArg())
	if err != nil {
		return nil, err
	}
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		rate, _ := toFloat(r["conversion_rate"])
		out = append(out, map[string]any{"id": num(r, "id"), "name": str(r, "name"), "conversions": num(r, "conversions"),
			"visitors": num(r, "visitors"), "conversion_rate": math.Round(rate*10000) / 10000})
	}
	return map[string]any{"rows": out}, nil
}
