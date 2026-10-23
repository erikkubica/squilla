package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	pb "squilla/pkg/plugin/proto"
)

const maxExportEvents = 100000

var exportEventColumns = []string{
	"ts", "kind", "path", "page_type", "entry", "referrer", "source", "channel", "utm_source", "utm_medium",
	"utm_campaign", "utm_content", "utm_term", "country", "language", "device", "browser", "os", "target",
	"goal_id", "confirmed", "viewport", "color_scheme",
}

// handleExport serves dataset=summary|timeseries|breakdown|events as a
// CSV or JSON attachment.
func (p *AnalyticsPlugin) handleExport(ctx context.Context, params map[string]string) *pb.PluginHTTPResponse {
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err)
	}
	format := params["format"]
	if format == "" {
		format = "csv"
	}
	if format != "csv" && format != "json" {
		return jsonError(400, "INVALID_FORMAT", "format must be csv or json")
	}
	dataset := params["dataset"]
	var header []string
	var rows [][]any
	var doc any
	switch dataset {
	case "summary":
		data, err := p.summaryData(ctx, q)
		if err != nil {
			return errorResponse(err)
		}
		doc = data
		header = []string{"metric", "current", "previous"}
		cur := data["current"].(Metrics)
		prev, _ := data["previous"].(*Metrics)
		for _, m := range metricCells(cur, prev) {
			rows = append(rows, m)
		}
	case "timeseries":
		data, err := p.timeseriesData(ctx, q, params["interval"])
		if err != nil {
			return errorResponse(err)
		}
		doc = data
		header = []string{"t", "visitors", "pageviews", "visits", "conversions"}
		for _, pt := range data["points"].([]TimePoint) {
			rows = append(rows, []any{pt.T, pt.Visitors, pt.Pageviews, pt.Visits, pt.Conversions})
		}
	case "breakdown":
		data, err := p.breakdownData(ctx, q, params["dim"], params["sort"], 10000, 0)
		if err != nil {
			return errorResponse(err)
		}
		doc = data
		header = []string{"value", "label", "visitors", "pageviews", "visits", "conversions", "share"}
		for _, r := range data["rows"].([]BreakdownRow) {
			rows = append(rows, []any{r.Value, r.Label, r.Visitors, r.Pageviews, r.Visits, r.Conversions, r.Share})
		}
	case "events":
		res, err := p.host.DataCall(ctx, "analytics_export_events", q.from(), q.to(), q.TZ, q.filterArg(), int64(maxExportEvents))
		if err != nil {
			return errorResponse(err)
		}
		doc = res
		header = exportEventColumns
		for _, r := range res {
			row := make([]any, len(header))
			for i, c := range header {
				row[i] = r[c]
			}
			rows = append(rows, row)
		}
	default:
		return jsonError(400, "INVALID_DATASET", "dataset must be summary, timeseries, breakdown or events")
	}

	name := fmt.Sprintf("analytics-%s-%s-%s", dataset, q.from(), q.to())
	if dataset == "breakdown" {
		name += "-" + params["dim"]
	}
	if format == "json" {
		b, err := json.MarshalIndent(doc, "", "  ")
		if err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		return attachment(b, "application/json", name+".json")
	}
	return attachment(encodeCSV(header, rows), "text/csv; charset=utf-8", name+".csv")
}

func metricCells(cur Metrics, prev *Metrics) [][]any {
	val := func(m *Metrics, f func(*Metrics) any) any {
		if m == nil {
			return ""
		}
		return f(m)
	}
	defs := []struct {
		name string
		f    func(*Metrics) any
	}{
		{"visitors", func(m *Metrics) any { return m.Visitors }},
		{"pageviews", func(m *Metrics) any { return m.Pageviews }},
		{"visits", func(m *Metrics) any { return m.Visits }},
		{"pages_per_visit", func(m *Metrics) any { return m.PagesPerVisit }},
		{"single_page_rate", func(m *Metrics) any { return m.SinglePageRate }},
		{"median_visit_seconds", func(m *Metrics) any {
			if m.MedianVisitSeconds == nil {
				return ""
			}
			return *m.MedianVisitSeconds
		}},
		{"conversions", func(m *Metrics) any { return m.Conversions }},
		{"conversion_rate", func(m *Metrics) any { return m.ConversionRate }},
	}
	out := make([][]any, 0, len(defs))
	for _, d := range defs {
		out = append(out, []any{d.name, val(&cur, d.f), val(prev, d.f)})
	}
	return out
}

// encodeCSV writes rows, neutralising spreadsheet formulas (cells starting
// with = + - @ are prefixed with ').
func encodeCSV(header []string, rows [][]any) []byte {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	_ = w.Write(header)
	for _, r := range rows {
		rec := make([]string, len(r))
		for i, v := range r {
			rec[i] = csvCell(v)
		}
		_ = w.Write(rec)
	}
	w.Flush()
	return buf.Bytes()
}

func csvCell(v any) string {
	var s string
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		s = t
	case float64:
		s = strconv.FormatFloat(t, 'f', -1, 64)
	case time.Time:
		s = t.UTC().Format(time.RFC3339)
	default:
		s = fmt.Sprint(t)
	}
	if s != "" && strings.ContainsRune("=+-@\t\r", rune(s[0])) {
		if _, err := strconv.ParseFloat(s, 64); err != nil {
			s = "'" + s
		}
	}
	return s
}

func attachment(body []byte, contentType, filename string) *pb.PluginHTTPResponse {
	return &pb.PluginHTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":        contentType,
			"Content-Disposition": `attachment; filename="` + filename + `"`,
			"Cache-Control":       "no-store",
		},
		Body: body,
	}
}
