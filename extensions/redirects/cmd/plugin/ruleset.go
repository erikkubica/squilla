package main

import (
	"net/url"
	"regexp"
	"sort"
	"strings"
)

// compiled is a rule prepared for matching.
type compiled struct {
	Rule
	path  string     // exact: lower-cased path; prefix: lower-cased prefix
	query url.Values // exact: query constraints (nil = any query)
	re    *regexp.Regexp
}

// ruleSet is the immutable matching index; swapped atomically on change.
type ruleSet struct {
	all     []Rule
	exact   map[string][]*compiled // by lower-cased path, query-constrained first
	prefix  []*compiled            // longest prefix first
	regexes []*compiled            // by id
}

func buildRuleSet(rules []Rule) *ruleSet {
	rs := &ruleSet{all: rules, exact: map[string][]*compiled{}}
	for i := range rules {
		r := rules[i]
		if !r.Enabled {
			continue
		}
		c := &compiled{Rule: r}
		switch r.MatchType {
		case matchExact:
			path, query := splitSource(r.Source)
			c.path = strings.ToLower(normalizePath(path))
			if query != "" {
				q, err := url.ParseQuery(query)
				if err != nil {
					continue
				}
				c.query = q
			}
			rs.exact[c.path] = append(rs.exact[c.path], c)
		case matchPrefix:
			c.path = strings.ToLower(normalizePath(r.Source))
			rs.prefix = append(rs.prefix, c)
		case matchRegex:
			re, err := compileSourceRegex(r.Source)
			if err != nil {
				continue
			}
			c.re = re
			rs.regexes = append(rs.regexes, c)
		}
	}
	for _, list := range rs.exact {
		sort.SliceStable(list, func(i, j int) bool { return len(list[i].query) > len(list[j].query) })
	}
	sort.SliceStable(rs.prefix, func(i, j int) bool { return len(rs.prefix[i].path) > len(rs.prefix[j].path) })
	sort.SliceStable(rs.regexes, func(i, j int) bool { return rs.regexes[i].ID < rs.regexes[j].ID })
	return rs
}

// match is the outcome of resolving a request against the rule set.
type match struct {
	Rule     Rule
	Location string // empty for 410
}

// resolve finds the first rule for path (+query) and builds its Location.
// Order: exact (most query constraints first), longest prefix, regex by id.
// A rule whose result is unusable (unsafe, or pointing back at the request)
// is skipped rather than served.
func (rs *ruleSet) resolve(rawPath string, query url.Values) (match, bool) {
	path := normalizePath(rawPath)
	key := strings.ToLower(path)

	for _, c := range rs.exact[key] {
		if !queryMatches(c.query, query) {
			continue
		}
		rest := url.Values{}
		for k, v := range query {
			if _, used := c.query[k]; !used {
				rest[k] = v
			}
		}
		if m, ok := finish(c, c.Target, path, rest, len(c.query) > 0); ok {
			return m, true
		}
	}
	for _, c := range rs.prefix {
		if key != c.path && !strings.HasPrefix(key, c.path+"/") {
			continue
		}
		tail := strings.TrimPrefix(path[len(c.path):], "/")
		if m, ok := finish(c, strings.ReplaceAll(c.Target, "*", tail), path, query, false); ok {
			return m, true
		}
	}
	for _, c := range rs.regexes {
		idx := c.re.FindStringSubmatchIndex(path)
		if idx == nil {
			continue
		}
		target := string(c.re.ExpandString(nil, c.Target, path, idx))
		if m, ok := finish(c, target, path, query, false); ok {
			return m, true
		}
	}
	return match{}, false
}

func queryMatches(want, got url.Values) bool {
	for k, vals := range want {
		if len(vals) > 0 && got.Get(k) != vals[0] {
			return false
		}
		if _, ok := got[k]; !ok {
			return false
		}
	}
	return true
}

// finish validates the expanded target and appends the forwarded query.
func finish(c *compiled, target, reqPath string, query url.Values, queryRule bool) (match, bool) {
	if c.StatusCode == 410 {
		return match{Rule: c.Rule}, true
	}
	target, ok := safeLocation(c.Target, target)
	if !ok {
		return match{}, false
	}
	// A rule that lands on the URL it matched would loop forever.
	if !isAbsoluteURL(target) && !queryRule && strings.EqualFold(normalizePath(targetPath(target)), reqPath) {
		return match{}, false
	}
	if c.KeepQuery && len(query) > 0 {
		frag := ""
		if i := strings.IndexByte(target, '#'); i >= 0 {
			target, frag = target[:i], target[i:]
		}
		sep := "?"
		if strings.Contains(target, "?") {
			sep = "&"
		}
		target += sep + query.Encode() + frag
	}
	return match{Rule: c.Rule, Location: target}, true
}

// safeLocation guards the expanded target. Wildcard and regex captures come
// from the visitor's URL, so they must never be able to change where a rule
// points: a path template stays a same-site path, and an absolute template
// keeps the host the admin typed.
func safeLocation(template, expanded string) (string, bool) {
	if expanded == "" || len(expanded) > maxLen || hasControl(expanded) {
		return "", false
	}
	if isAbsoluteURL(template) {
		tu, err1 := url.Parse(template)
		eu, err2 := url.Parse(expanded)
		if err1 != nil || err2 != nil || eu.User != nil || !strings.EqualFold(tu.Host, eu.Host) ||
			(eu.Scheme != "http" && eu.Scheme != "https") {
			return "", false
		}
		return expanded, true
	}
	expanded = strings.ReplaceAll(expanded, `\`, "/")
	// "//host" and "/\host" are protocol-relative URLs to browsers.
	expanded = "/" + strings.TrimLeft(expanded, "/")
	return expanded, true
}
