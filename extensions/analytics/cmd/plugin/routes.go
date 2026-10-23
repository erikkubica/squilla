package main

import (
	"context"
	"errors"
	"strconv"
	"strings"

	pb "squilla/pkg/plugin/proto"
)

// routeRequest dispatches admin (/admin/api/ext/analytics/…, relative
// paths) and public (/go/<slug>, <beacon prefix>/b) requests.
func (p *AnalyticsPlugin) routeRequest(ctx context.Context, req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	method := strings.ToUpper(req.GetMethod())
	raw := req.GetPath()
	raw = strings.TrimPrefix(raw, "/admin/api/ext/analytics")

	// Public routes arrive with their full path.
	if strings.HasPrefix(raw, "/go/") {
		if method != "GET" && method != "HEAD" {
			return jsonError(405, "METHOD_NOT_ALLOWED", "method not allowed")
		}
		return p.handleGo(ctx, strings.TrimPrefix(raw, "/go/"), req)
	}
	if raw == "/_s/b" || raw == p.config().BeaconPrefix+"/b" {
		return p.handleBeacon(ctx, req)
	}

	path := strings.Trim(raw, "/")
	params := req.GetQueryParams()
	if params == nil {
		params = map[string]string{}
	}

	switch {
	case path == "settings" && method == "GET":
		return jsonResponse(200, p.config())
	case path == "settings" && method == "PUT":
		return p.handleSaveSettings(ctx, req.GetBody())
	case path == "status" && method == "GET":
		return p.handleStatus(ctx)
	case path == "realtime" && method == "GET":
		return p.handleRealtime(ctx)
	case path == "goals" && method == "GET":
		return p.handleListGoals(ctx)
	case path == "goals" && method == "POST":
		return p.handleSaveGoal(ctx, 0, req.GetBody())
	case path == "links" && method == "GET":
		return p.handleListLinks(ctx)
	case path == "links" && method == "POST":
		return p.handleSaveLink(ctx, 0, req.GetBody())
	case path == "export" && method == "GET":
		return p.handleExport(ctx, params)
	}

	if method == "GET" {
		if resp, ok := p.routeStats(ctx, path, params); ok {
			return resp
		}
	}

	for _, coll := range []string{"goals", "links"} {
		rest, ok := strings.CutPrefix(path, coll+"/")
		if !ok {
			continue
		}
		id, err := strconv.ParseInt(rest, 10, 64)
		if err != nil || id <= 0 {
			break
		}
		switch {
		case coll == "goals" && method == "PUT":
			return p.handleSaveGoal(ctx, id, req.GetBody())
		case coll == "goals" && method == "DELETE":
			return p.handleDeleteGoal(ctx, id)
		case coll == "links" && method == "PUT":
			return p.handleSaveLink(ctx, id, req.GetBody())
		case coll == "links" && method == "DELETE":
			return p.handleDeleteLink(ctx, id)
		}
	}
	return jsonError(404, "NOT_FOUND", "route not found")
}

// routeStats serves the read-only statistics endpoints that share the
// common from/to/compare/f.* parameters.
func (p *AnalyticsPlugin) routeStats(ctx context.Context, path string, params map[string]string) (*pb.PluginHTTPResponse, bool) {
	var dim string
	switch {
	case path == "summary", path == "timeseries", path == "heatmap", path == "bots", path == "goals/stats":
	case strings.HasPrefix(path, "breakdown/"):
		dim = strings.TrimPrefix(path, "breakdown/")
	default:
		return nil, false
	}
	q, err := parseStatsQuery(params, p.config(), p.now())
	if err != nil {
		return errorResponse(err), true
	}
	var data map[string]any
	switch {
	case path == "summary":
		data, err = p.summaryData(ctx, q)
	case path == "timeseries":
		data, err = p.timeseriesData(ctx, q, params["interval"])
	case path == "heatmap":
		data, err = p.heatmapData(ctx, q)
	case path == "bots":
		data, err = p.botsData(ctx, q)
	case path == "goals/stats":
		data, err = p.goalStatsData(ctx, q)
	default:
		data, err = p.breakdownData(ctx, q, dim, params["sort"],
			intParam(params, "limit", 10, 1, 1000), intParam(params, "offset", 0, 0, 1_000_000))
	}
	if err != nil {
		return errorResponse(err), true
	}
	return jsonResponse(200, data), true
}

// errorResponse maps parameter errors to 400 and everything else to 500.
func errorResponse(err error) *pb.PluginHTTPResponse {
	var qe *queryError
	if errors.As(err, &qe) {
		return jsonError(400, qe.code, qe.msg)
	}
	return jsonError(500, "QUERY_FAILED", err.Error())
}
