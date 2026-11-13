package main

import (
	"net/url"
	"regexp"
	"strings"
)

const (
	matchExact  = "exact"
	matchPrefix = "prefix"
	matchRegex  = "regex"

	originManual = "manual"
	originAuto   = "auto"
)

// Rule is one redirect as stored and as sent to the admin UI.
type Rule struct {
	ID         int64  `json:"id"`
	Source     string `json:"source"`
	MatchType  string `json:"match_type"`
	Target     string `json:"target"`
	StatusCode int    `json:"status_code"`
	Enabled    bool   `json:"enabled"`
	KeepQuery  bool   `json:"keep_query"`
	Note       string `json:"note"`
	Origin     string `json:"origin"`
	NodeID     int64  `json:"node_id"`
	Hits       int64  `json:"hits"`
	LastHitAt  string `json:"last_hit_at"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

func ruleFromRow(r map[string]any) Rule {
	return Rule{
		ID: num(r, "id"), Source: str(r, "source"), MatchType: str(r, "match_type"), Target: str(r, "target"),
		StatusCode: int(num(r, "status_code")), Enabled: boolean(r, "enabled"), KeepQuery: boolean(r, "keep_query"),
		Note: str(r, "note"), Origin: str(r, "origin"), NodeID: num(r, "node_id"), Hits: num(r, "hits"),
		LastHitAt: str(r, "last_hit_at"), CreatedAt: str(r, "created_at"), UpdatedAt: str(r, "updated_at"),
	}
}

// row is the editable column set (hits and timestamps are managed apart).
func (r *Rule) row() map[string]any {
	return map[string]any{
		"source": r.Source, "match_type": r.MatchType, "target": r.Target, "status_code": r.StatusCode,
		"enabled": r.Enabled, "keep_query": r.KeepQuery, "note": r.Note, "origin": r.Origin, "node_id": r.NodeID,
	}
}

var validStatus = map[int]bool{301: true, 302: true, 307: true, 308: true, 410: true}

const maxLen = 2048

// normalizePath canonicalises a request or source path for comparison:
// percent-decoded, one leading slash, no trailing slash (except "/").
// Matching is case-insensitive, so callers lower-case the result for keys.
func normalizePath(p string) string {
	if dec, err := url.PathUnescape(p); err == nil {
		p = dec
	}
	p = "/" + strings.Trim(p, "/")
	return p
}

// splitSource separates "path?query" and reduces a pasted absolute URL to
// its path and query.
func splitSource(src string) (path, query string) {
	src = strings.TrimSpace(src)
	if l := strings.ToLower(src); strings.HasPrefix(l, "http://") || strings.HasPrefix(l, "https://") {
		if u, err := url.Parse(src); err == nil {
			src = u.EscapedPath()
			if u.RawQuery != "" {
				src += "?" + u.RawQuery
			}
		}
	}
	if i := strings.IndexByte(src, '#'); i >= 0 {
		src = src[:i]
	}
	path, query, _ = strings.Cut(src, "?")
	return path, query
}

func hasControl(s string) bool {
	return strings.ContainsAny(s, "\r\n\t\x00")
}

// isAbsoluteURL reports whether target is an http(s) URL (vs. a site path).
func isAbsoluteURL(target string) bool {
	l := strings.ToLower(target)
	return strings.HasPrefix(l, "http://") || strings.HasPrefix(l, "https://")
}

// normalize cleans the rule in place and returns per-field errors.
func (r *Rule) normalize() map[string]string {
	errs := map[string]string{}
	r.Source = strings.TrimSpace(r.Source)
	r.Target = strings.TrimSpace(r.Target)
	r.Note = strings.TrimSpace(r.Note)
	if r.MatchType == "" {
		r.MatchType = matchExact
	}
	if r.StatusCode == 0 {
		r.StatusCode = 301
	}
	if r.Origin != originAuto {
		r.Origin = originManual
	}
	if !validStatus[r.StatusCode] {
		errs["status_code"] = "must be 301, 302, 307, 308 or 410"
	}
	if len(r.Note) > 500 {
		errs["note"] = "max 500 characters"
	}

	switch {
	case r.Source == "":
		errs["source"] = "required"
	case len(r.Source) > maxLen || hasControl(r.Source):
		errs["source"] = "too long or contains control characters"
	default:
		switch r.MatchType {
		case matchExact:
			path, query := splitSource(r.Source)
			if !strings.HasPrefix(path, "/") {
				errs["source"] = "must be a path starting with /"
				break
			}
			r.Source = normalizePath(path)
			if query != "" {
				if _, err := url.ParseQuery(query); err != nil {
					errs["source"] = "query string is not valid"
					break
				}
				r.Source += "?" + query
			}
		case matchPrefix:
			path, _ := splitSource(r.Source)
			path = strings.TrimSuffix(strings.TrimSuffix(path, "*"), "/")
			if !strings.HasPrefix(path, "/") || strings.Contains(path, "*") {
				errs["source"] = "must be a path prefix such as /blog (a trailing /* is optional)"
				break
			}
			r.Source = normalizePath(path)
			if r.Source == "/" {
				errs["source"] = "a prefix of / would redirect the whole site"
			}
		case matchRegex:
			if len(r.Source) > 500 {
				errs["source"] = "max 500 characters"
			} else if _, err := compileSourceRegex(r.Source); err != nil {
				errs["source"] = "not a valid regular expression: " + err.Error()
			}
		default:
			errs["match_type"] = "must be exact, prefix or regex"
		}
	}

	if r.StatusCode == 410 {
		r.Target = ""
	} else if msg := validateTarget(r.Target); msg != "" {
		errs["target"] = msg
	} else if r.MatchType == matchExact && errs["source"] == "" && !strings.Contains(r.Source, "?") &&
		!isAbsoluteURL(r.Target) && strings.EqualFold(normalizePath(targetPath(r.Target)), r.Source) {
		errs["target"] = "redirects to itself"
	}
	return errs
}

// targetPath returns the path part of a site-relative target.
func targetPath(target string) string {
	if i := strings.IndexAny(target, "?#"); i >= 0 {
		return target[:i]
	}
	return target
}

func validateTarget(t string) string {
	switch {
	case t == "":
		return "required"
	case len(t) > maxLen || hasControl(t) || strings.Contains(t, `\`):
		return "too long or contains invalid characters"
	case isAbsoluteURL(t):
		u, err := url.Parse(t)
		if err != nil || u.Host == "" || u.User != nil || strings.ContainsAny(u.Host, "$*") {
			return "must be a valid http(s) URL with a fixed host"
		}
		return ""
	case strings.HasPrefix(t, "//") || !strings.HasPrefix(t, "/"):
		return "must be a path starting with / or an absolute http(s) URL"
	}
	return ""
}

// compileSourceRegex anchors the expression so it must match the whole path.
// Go's RE2 engine runs in linear time, so admin-supplied patterns can't be
// used to stall request handling.
func compileSourceRegex(src string) (*regexp.Regexp, error) {
	return regexp.Compile(`^(?:` + src + `)$`)
}
