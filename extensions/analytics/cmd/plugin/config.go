package main

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"squilla/internal/coreapi"
)

const (
	configTable = "analytics_config"
	configKey   = "settings"
)

// Config is the extension's settings document (GET/PUT settings).
type Config struct {
	Timezone              string   `json:"timezone"`
	ExcludePaths          []string `json:"exclude_paths"`
	ExcludeLoggedIn       bool     `json:"exclude_logged_in"`
	RespectGPC            bool     `json:"respect_gpc"`
	RawRetentionDays      int      `json:"raw_retention_days"`
	SessionTimeoutMinutes int      `json:"session_timeout_minutes"`
	EnhancedMode          bool     `json:"enhanced_mode"`
	BeaconPrefix          string   `json:"beacon_prefix"`
	DownloadExtensions    []string `json:"download_extensions"`
	OwnHosts              []string `json:"own_hosts"`
	GeoIPDBPath           string   `json:"geoip_db_path"`

	loc *time.Location
}

var defaultDownloadExtensions = []string{"pdf", "zip", "docx", "xlsx", "pptx", "gpx", "kml", "epub", "mp3", "mp4"}

func defaultConfig() Config {
	return Config{
		Timezone:              "UTC",
		ExcludePaths:          []string{},
		ExcludeLoggedIn:       true,
		RespectGPC:            true,
		RawRetentionDays:      90,
		SessionTimeoutMinutes: 30,
		BeaconPrefix:          "/_s",
		DownloadExtensions:    append([]string(nil), defaultDownloadExtensions...),
		OwnHosts:              []string{},
		loc:                   time.UTC,
	}
}

// location returns the site time zone (UTC when unset).
func (c *Config) location() *time.Location {
	if c.loc == nil {
		return time.UTC
	}
	return c.loc
}

func (c *Config) sessionTimeout() time.Duration {
	return time.Duration(c.SessionTimeoutMinutes) * time.Minute
}

func (c *Config) isDownloadExt(ext string) bool {
	for _, d := range c.DownloadExtensions {
		if d == ext {
			return true
		}
	}
	return false
}

var (
	reBeaconPrefix = regexp.MustCompile(`^/[A-Za-z0-9_-]{1,32}$`)
	reExtension    = regexp.MustCompile(`^[a-z0-9]{1,10}$`)
	reHostname     = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$`)
)

// reservedBeaconPrefixes cannot host the beacon (kernel or extension routes).
var reservedBeaconPrefixes = map[string]bool{
	"/admin": true, "/api": true, "/auth": true, "/mcp": true, "/go": true, "/themes": true,
	"/extensions": true, "/media": true, "/login": true, "/logout": true, "/register": true, "/me": true,
}

// normalize trims/lower-cases list values and validates every field.
// Returns field → message for each problem.
func (c *Config) normalize() map[string]string {
	errs := map[string]string{}
	c.Timezone = strings.TrimSpace(c.Timezone)
	if c.Timezone == "" {
		c.Timezone = "UTC"
	}
	if loc, err := time.LoadLocation(c.Timezone); err != nil {
		errs["timezone"] = "unknown IANA time zone"
	} else {
		c.loc = loc
	}
	c.ExcludePaths = cleanList(c.ExcludePaths, false)
	if len(c.ExcludePaths) > 100 {
		errs["exclude_paths"] = "at most 100 patterns"
	}
	for _, p := range c.ExcludePaths {
		if !strings.HasPrefix(p, "/") || len(p) > 512 {
			errs["exclude_paths"] = "patterns must start with / (max 512 characters)"
			break
		}
	}
	if c.RawRetentionDays < 1 || c.RawRetentionDays > 3650 {
		errs["raw_retention_days"] = "must be between 1 and 3650"
	}
	if c.SessionTimeoutMinutes < 5 || c.SessionTimeoutMinutes > 240 {
		errs["session_timeout_minutes"] = "must be between 5 and 240"
	}
	c.BeaconPrefix = strings.TrimSuffix(strings.TrimSpace(c.BeaconPrefix), "/")
	if c.BeaconPrefix == "" {
		c.BeaconPrefix = "/_s"
	}
	if !reBeaconPrefix.MatchString(c.BeaconPrefix) || reservedBeaconPrefixes[strings.ToLower(c.BeaconPrefix)] {
		errs["beacon_prefix"] = "must look like /_s (letters, digits, _ or -) and not be a reserved path"
	}
	c.DownloadExtensions = cleanList(c.DownloadExtensions, true)
	for i, e := range c.DownloadExtensions {
		e = strings.TrimPrefix(e, ".")
		c.DownloadExtensions[i] = e
		if !reExtension.MatchString(e) {
			errs["download_extensions"] = "extensions must be 1-10 letters or digits"
			break
		}
	}
	c.OwnHosts = cleanList(c.OwnHosts, true)
	for i, h := range c.OwnHosts {
		h = normalizeHost(h)
		c.OwnHosts[i] = h
		if !reHostname.MatchString(h) {
			errs["own_hosts"] = "invalid host name " + fmt.Sprintf("%q", h)
			break
		}
	}
	c.GeoIPDBPath = strings.TrimSpace(c.GeoIPDBPath)
	if len(c.GeoIPDBPath) > 1024 {
		errs["geoip_db_path"] = "path too long"
	}
	return errs
}

// cleanList trims, optionally lower-cases, drops empties and duplicates.
func cleanList(in []string, lower bool) []string {
	out := make([]string, 0, len(in))
	seen := map[string]bool{}
	for _, v := range in {
		v = strings.TrimSpace(v)
		if lower {
			v = strings.ToLower(v)
		}
		if v == "" || seen[v] {
			continue
		}
		seen[v] = true
		out = append(out, v)
	}
	return out
}

// loadConfig reads the stored settings; invalid or missing values fall
// back to defaults so a bad row never stops ingestion.
func (p *AnalyticsPlugin) loadConfig(ctx context.Context) {
	cfg := defaultConfig()
	res, err := p.host.DataQuery(ctx, configTable, coreapi.DataStoreQuery{Where: map[string]any{"key": configKey}, Limit: 1})
	if err == nil && res != nil && len(res.Rows) > 0 {
		if raw := jsonBytes(res.Rows[0]["value"]); raw != nil {
			stored := defaultConfig()
			if json.Unmarshal(raw, &stored) == nil {
				if errs := stored.normalize(); len(errs) == 0 {
					cfg = stored
				} else {
					p.logf(ctx, "warn", "analytics: stored settings invalid, using defaults: %v", errs)
				}
			}
		}
	}
	if cfg.loc == nil {
		cfg.normalize()
	}
	p.cfg.Store(&cfg)
}

// saveConfig upserts the settings row.
func (p *AnalyticsPlugin) saveConfig(ctx context.Context, cfg Config) error {
	raw, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	row := map[string]any{"key": configKey, "value": string(raw), "updated_at": p.now().UTC().Format(time.RFC3339Nano)}
	res, err := p.host.DataQuery(ctx, configTable, coreapi.DataStoreQuery{Where: map[string]any{"key": configKey}, Limit: 1})
	if err != nil {
		return err
	}
	if res != nil && len(res.Rows) > 0 {
		id, _ := toInt64(res.Rows[0]["id"])
		return p.host.DataUpdate(ctx, configTable, uint(id), row)
	}
	_, err = p.host.DataCreate(ctx, configTable, row)
	return err
}

// jsonBytes returns a JSON document stored either as a string or as an
// already-decoded value.
func jsonBytes(v any) []byte {
	switch t := v.(type) {
	case nil:
		return nil
	case string:
		return []byte(t)
	case []byte:
		return t
	default:
		b, err := json.Marshal(t)
		if err != nil {
			return nil
		}
		return b
	}
}
