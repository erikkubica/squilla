package cms

import (
	"regexp"
	"strings"
	"sync"
)

// AdminRouteRule is a compiled AdminRouteEntry — the manifest's glob
// becomes a regex so the proxy can match in O(rules-per-extension) per
// request without re-parsing.
type AdminRouteRule struct {
	Method             string // upper-cased; "" or "*" matches any
	pattern            *regexp.Regexp
	RequiredCapability string
}

// Matches reports whether the rule covers (method, path).
func (r *AdminRouteRule) Matches(method, path string) bool {
	if r.Method != "" && r.Method != "*" && !strings.EqualFold(r.Method, method) {
		return false
	}
	return r.pattern.MatchString(path)
}

// CompileAdminRoutes converts a manifest's AdminRoutes slice into the
// runtime rule list. Invalid entries (missing path, malformed glob)
// are silently dropped — manifest authors who hit this should already
// see the broken behaviour during testing, and we'd rather a single
// bad rule not take the whole extension's auth offline.
func CompileAdminRoutes(entries []AdminRouteEntry) []AdminRouteRule {
	if len(entries) == 0 {
		return nil
	}
	out := make([]AdminRouteRule, 0, len(entries))
	for _, e := range entries {
		if e.Path == "" {
			continue
		}
		re, err := compileGlob(e.Path)
		if err != nil {
			continue
		}
		out = append(out, AdminRouteRule{
			Method:             strings.ToUpper(strings.TrimSpace(e.Method)),
			pattern:            re,
			RequiredCapability: e.RequiredCapability,
		})
	}
	return out
}

// compileGlob converts a path glob into a regex anchored at both ends.
// Two tokens:
//
//	*   one path segment (no slashes)
//	**  any number of segments (including zero)
//
// All other regex metacharacters in the pattern are escaped so a
// manifest can't accidentally inject regex features.
func compileGlob(glob string) (*regexp.Regexp, error) {
	var b strings.Builder
	b.WriteByte('^')
	i := 0
	for i < len(glob) {
		c := glob[i]
		switch {
		case c == '*' && i+1 < len(glob) && glob[i+1] == '*':
			// `**` — match any chars including slashes. We make it
			// non-greedy so it doesn't eat through later literal
			// segments in patterns like /forms/**/edit.
			b.WriteString(".*")
			i += 2
		case c == '*':
			// `*` — single segment.
			b.WriteString("[^/]+")
			i++
		default:
			b.WriteString(regexp.QuoteMeta(string(c)))
			i++
		}
	}
	b.WriteByte('$')
	return regexp.Compile(b.String())
}

// AdminRouteRegistry caches compiled rules per extension slug so the
// proxy doesn't have to re-parse manifests on every request. Extension
// activation/deactivation invalidates the relevant slug.
type AdminRouteRegistry struct {
	mu    sync.RWMutex
	rules map[string][]AdminRouteRule
}

// NewAdminRouteRegistry constructs an empty registry.
func NewAdminRouteRegistry() *AdminRouteRegistry {
	return &AdminRouteRegistry{rules: make(map[string][]AdminRouteRule)}
}

// Set replaces the rule list for a slug. Safe to call concurrently
// with Get.
func (r *AdminRouteRegistry) Set(slug string, rules []AdminRouteRule) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(rules) == 0 {
		delete(r.rules, slug)
		return
	}
	r.rules[slug] = rules
}

// Get returns the rules for slug, or nil if none registered.
func (r *AdminRouteRegistry) Get(slug string) []AdminRouteRule {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.rules[slug]
}

// Drop removes the rules for slug — called on extension deactivation.
func (r *AdminRouteRegistry) Drop(slug string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.rules, slug)
}

// FirstMatch returns the first rule whose Matches reports true, or nil
// if none does. First-rule-wins matches the manifest contract.
func (r *AdminRouteRegistry) FirstMatch(slug, method, path string) *AdminRouteRule {
	rules := r.Get(slug)
	for i := range rules {
		if rules[i].Matches(method, path) {
			return &rules[i]
		}
	}
	return nil
}
