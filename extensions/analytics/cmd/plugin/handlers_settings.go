package main

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	pb "squilla/pkg/plugin/proto"
)

// handleSaveSettings validates and stores the settings document. Missing
// fields keep their current value. Returns the saved settings.
func (p *AnalyticsPlugin) handleSaveSettings(ctx context.Context, body []byte) *pb.PluginHTTPResponse {
	cur := p.config()
	next := *cur
	next.ExcludePaths = append([]string(nil), cur.ExcludePaths...)
	next.DownloadExtensions = append([]string(nil), cur.DownloadExtensions...)
	next.OwnHosts = append([]string(nil), cur.OwnHosts...)
	dec := json.NewDecoder(strings.NewReader(string(body)))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&next); err != nil {
		return jsonError(400, "INVALID_JSON", "invalid settings document: "+err.Error())
	}
	if errs := next.normalize(); len(errs) > 0 {
		return validationError(errs)
	}
	if err := p.saveConfig(ctx, next); err != nil {
		return jsonError(500, "INTERNAL", "could not save settings: "+err.Error())
	}
	p.cfg.Store(&next)
	if next.Timezone != cur.Timezone {
		// Days (and the salt day) now follow the new zone.
		p.salt.reset()
		p.rebuildRollups(&next)
	}
	return jsonResponse(200, &next)
}

func (p *AnalyticsPlugin) handleStatus(ctx context.Context) *pb.PluginHTTPResponse {
	cfg := p.config()
	now := p.now()
	var lastRecord *string
	receiving := false
	if n := p.lastRecordAt.Load(); n > 0 {
		t := time.Unix(0, n).UTC()
		s := t.Format(time.RFC3339)
		lastRecord = &s
		receiving = now.Sub(t) < 5*time.Minute
	}
	out := map[string]any{
		"receiving":       receiving,
		"last_record_at":  lastRecord,
		"records_today":   int64(0),
		"pageviews_today": int64(0),
		"bots_today":      int64(0),
		"dropped_total":   p.droppedTotal.Load(),
		"enhanced_mode":   cfg.EnhancedMode,
		"geoip":           false, // no GeoIP reader is bundled; country comes from cf-ipcountry
		"salt_rotates_at": nil,
	}
	if rows, err := p.host.DataCall(ctx, "analytics_status", cfg.Timezone); err == nil && len(rows) > 0 {
		out["records_today"] = num(rows[0], "records_today")
		out["pageviews_today"] = num(rows[0], "pageviews_today")
		out["bots_today"] = num(rows[0], "bots_today")
	}
	p.salt.current(now, cfg.location())
	if t := p.salt.nextRotation(); !t.IsZero() {
		out["salt_rotates_at"] = t.Format(time.RFC3339)
	}
	return jsonResponse(200, out)
}
