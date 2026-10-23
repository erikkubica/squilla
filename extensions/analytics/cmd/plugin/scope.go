package main

import (
	"path"
	"strings"
)

// hardExcludedPrefixes are never analysed — not even for bot counts.
var hardExcludedPrefixes = []string{
	"/admin/", "/api/", "/mcp/", "/_s/", "/go/", "/themes/", "/extensions/", "/media/cache/",
}

// assetExtensions are static files: ignored entirely unless configured as a
// download extension.
var assetExtensions = map[string]bool{
	"css": true, "js": true, "mjs": true, "map": true, "png": true, "jpg": true, "jpeg": true,
	"webp": true, "avif": true, "gif": true, "svg": true, "ico": true, "woff": true, "woff2": true,
	"ttf": true, "otf": true, "eot": true, "webmanifest": true, "json": true,
}

// botOnlyExtensions are counted for bots (robots.txt, sitemaps, feeds) but
// never produce human events.
var botOnlyExtensions = map[string]bool{"txt": true, "xml": true, "rss": true, "atom": true}

// pathExt returns the lower-case extension of a URL path without the dot.
func pathExt(p string) string {
	ext := path.Ext(p)
	if ext == "" || strings.Contains(ext, "/") {
		return ""
	}
	return strings.ToLower(ext[1:])
}

// isHardExcluded reports kernel/admin/asset namespaces and the beacon prefix.
func isHardExcluded(p string, cfg *Config) bool {
	lp := strings.ToLower(p)
	switch lp {
	case "/admin", "/api", "/mcp", "/go":
		return true
	}
	for _, prefix := range hardExcludedPrefixes {
		if strings.HasPrefix(lp, prefix) {
			return true
		}
	}
	if bp := strings.ToLower(cfg.BeaconPrefix); bp != "" && strings.HasPrefix(lp, bp+"/") {
		return true
	}
	return false
}

// isUserExcluded applies the exclude_paths globs to the normalised path.
func isUserExcluded(normPath string, cfg *Config) bool {
	for _, g := range cfg.ExcludePaths {
		if globMatch(g, normPath) {
			return true
		}
	}
	return false
}

// normalizePath strips the query/fragment, collapses duplicate slashes,
// lower-cases and removes a trailing slash (except for "/").
func normalizePath(p string) string {
	if i := strings.IndexAny(p, "?#"); i >= 0 {
		p = p[:i]
	}
	p = strings.ToLower(strings.TrimSpace(p))
	for strings.Contains(p, "//") {
		p = strings.ReplaceAll(p, "//", "/")
	}
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	if len(p) > 1 {
		p = strings.TrimRight(p, "/")
		if p == "" {
			p = "/"
		}
	}
	if len(p) > 512 {
		p = p[:512]
	}
	return p
}

func isHTML(contentType string) bool {
	return strings.Contains(strings.ToLower(contentType), "text/html")
}

func acceptsHTML(r *Record) bool {
	return strings.Contains(strings.ToLower(r.header("accept")), "text/html")
}

// isPrefetch reports speculative loads (Sec-Purpose / Purpose: prefetch).
func isPrefetch(r *Record) bool {
	return strings.Contains(strings.ToLower(r.header("sec-purpose")), "prefetch") ||
		strings.Contains(strings.ToLower(r.header("purpose")), "prefetch")
}

// detectKind classifies a human request into an event kind ("" = none).
func detectKind(r *Record, ext string, cfg *Config) string {
	if !strings.EqualFold(r.Method, "GET") {
		return ""
	}
	if ext != "" && cfg.isDownloadExt(ext) {
		switch r.Status {
		case 200, 206, 304:
			return kindDownload
		}
		return ""
	}
	switch {
	case r.Status >= 200 && r.Status < 300:
		if isHTML(r.ContentType) {
			return kindPageview
		}
	case r.Status == 304:
		if strings.EqualFold(r.header("sec-fetch-dest"), "document") || acceptsHTML(r) {
			return kindPageview
		}
	case r.Status == 404:
		if isHTML(r.ContentType) || acceptsHTML(r) {
			return kindNotFound
		}
	}
	return ""
}
