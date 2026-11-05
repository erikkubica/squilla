package cms

import (
	"encoding/json"
	"fmt"
	"html/template"
	"strconv"
	"strings"

	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

// Instant-navigation support for public pages. Two levers, both driven
// by global site settings (Site Settings → Advanced → Performance):
//
//  1. Speculative loading. Anonymous page views get a
//     <script type="speculationrules"> block (Chromium) plus a tiny
//     hover/touch prefetch fallback for browsers without speculation
//     rules (Safari, Firefox). A hovered link is fetched — or fully
//     prerendered — before the click, so the navigation itself costs no
//     network round trip.
//  2. Short private HTML caching. Anonymous HTML is sent with
//     `private, max-age=N` so a page the fallback prefetched is reused
//     from the HTTP cache instead of being fetched again on click.
//
// Logged-in visitors are excluded from both: their pages carry editor
// markers and the visual-editor overlay, change on every save, and must
// never be served from (or prerendered into) a cache.

// Setting keys. All are global (language_code=”), see settings.siteAdvanced.
const (
	SettingNavSpeculation          = "nav_speculation"
	SettingNavSpeculationEagerness = "nav_speculation_eagerness"
	SettingNavSpeculationExclude   = "nav_speculation_exclude"
	SettingHTMLCacheSeconds        = "html_cache_seconds"
)

// Defaults used when a setting has never been saved.
const (
	defaultNavSpeculation     = "prerender"
	defaultNavEagerness       = "moderate"
	defaultHTMLCacheSeconds   = 60
	maxHTMLCacheSeconds       = 86400
	htmlStaleWhileRevalidateX = 5 // stale-while-revalidate = max-age × this
)

// navExcludedPaths are href patterns (URLPattern pathname syntax) that
// are never speculated: admin, APIs, auth flows (GET /logout would log
// the visitor out), feeds/machine files, and raw file/media routes.
var navExcludedPaths = []string{
	"/admin", "/admin/*",
	"/api/*", "/mcp", "/mcp/*",
	"/auth/*", "/login", "/login/*", "/logout", "/logout/*",
	"/register", "/register/*", "/forgot-password", "/reset-password", "/reset-password/*",
	"/me", "/forms/*", "/go/*", "/.well-known/*",
	"/media/*", "/theme/*", "/extensions/*",
	"/*.xml", "/*.txt", "/*.json", "/*.pdf", "/*.zip",
}

// navExcludedSelector covers link-level opt-outs: new-window links,
// downloads, nofollow, explicit data-no-prefetch (on the link or any
// ancestor), and links carrying a query string — those can change state
// (?add-to-cart=…, ?logout=…) and are rarely worth speculating.
const navExcludedSelector = `[target]:not([target="_self"]), [download], [rel~="nofollow"], [data-no-prefetch], [data-no-prefetch] a, a[href*="?"]`

// navSpeculationMode returns "prerender", "prefetch" or "off".
func navSpeculationMode(settings map[string]string) string {
	switch strings.TrimSpace(settings[SettingNavSpeculation]) {
	case "off", "prefetch", "prerender":
		return strings.TrimSpace(settings[SettingNavSpeculation])
	default:
		return defaultNavSpeculation
	}
}

func navSpeculationEagerness(settings map[string]string) string {
	switch v := strings.TrimSpace(settings[SettingNavSpeculationEagerness]); v {
	case "conservative", "moderate", "eager":
		return v
	default:
		return defaultNavEagerness
	}
}

// navExtraExcludes parses the operator's extra exclusions: one path
// pattern per line, e.g. "/checkout/*". Lines not starting with "/" are
// ignored so a stray comment can't widen the rules.
func navExtraExcludes(settings map[string]string) []string {
	var out []string
	for _, line := range strings.Split(settings[SettingNavSpeculationExclude], "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "/") {
			out = append(out, line)
		}
	}
	return out
}

// htmlCacheSeconds returns the browser max-age for anonymous HTML.
// 0 disables caching (`no-cache`).
func htmlCacheSeconds(settings map[string]string) int {
	raw := strings.TrimSpace(settings[SettingHTMLCacheSeconds])
	if raw == "" {
		return defaultHTMLCacheSeconds
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 0 {
		return defaultHTMLCacheSeconds
	}
	if n > maxHTMLCacheSeconds {
		return maxHTMLCacheSeconds
	}
	return n
}

// buildSpeculationRules returns the JSON document for
// <script type="speculationrules">. Prefetch is always the base rule;
// prerender is added on top in "prerender" mode (Chromium upgrades a
// matching prefetch, so nothing is fetched twice).
func buildSpeculationRules(mode, eagerness string, extraExcludes []string) ([]byte, error) {
	excl := make([]any, 0, len(navExcludedPaths)+len(extraExcludes)+1)
	for _, p := range append(append([]string{}, navExcludedPaths...), extraExcludes...) {
		excl = append(excl, map[string]any{"not": map[string]any{"href_matches": p}})
	}
	excl = append(excl, map[string]any{"not": map[string]any{"selector_matches": navExcludedSelector}})
	where := map[string]any{"and": append([]any{map[string]any{"href_matches": "/*"}}, excl...)}
	rule := func() []any {
		return []any{map[string]any{"source": "document", "where": where, "eagerness": eagerness}}
	}
	doc := map[string]any{"prefetch": rule()}
	if mode == "prerender" {
		doc["prerender"] = rule()
	}
	return json.Marshal(doc)
}

// navFallbackScript is the hover/touch prefetch for browsers without
// speculation rules. It bails when speculation rules are supported, on
// Save-Data or 2G, and dedupes URLs. Where <link rel=prefetch> is
// supported (Firefox) it is used; otherwise (Safari) a low-priority
// same-origin fetch warms the HTTP cache, which the navigation then
// reuses thanks to the anonymous `private, max-age` HTML header.
// %s is replaced by a JSON array of excluded path regexes.
const navFallbackScript = `(function(){var d=document,S=HTMLScriptElement;if(S.supports&&S.supports("speculationrules"))return;var c=navigator.connection;if(c&&(c.saveData||/2g/.test(c.effectiveType||"")))return;var X=%s.map(function(s){return new RegExp(s)}),seen={},t,L=d.createElement("link"),P=L.relList&&L.relList.supports&&L.relList.supports("prefetch");function ok(a){if(!a||!a.href||a.origin!==location.origin||a.search||(a.target&&a.target!=="_self")||a.hasAttribute("download")||/(^|\s)nofollow(\s|$)/.test(a.rel)||a.closest("[data-no-prefetch]"))return false;if(a.pathname===location.pathname)return false;for(var i=0;i<X.length;i++)if(X[i].test(a.pathname))return false;return true}function go(u){if(seen[u])return;seen[u]=1;if(P){var l=d.createElement("link");l.rel="prefetch";l.href=u;d.head.appendChild(l)}else if(window.fetch){fetch(u,{credentials:"same-origin",priority:"low",headers:{"Purpose":"prefetch","Accept":"text/html"}}).catch(function(){})}}function link(e){return e.target&&e.target.closest?e.target.closest("a[href]"):null}d.addEventListener("mouseover",function(e){var a=link(e);if(!ok(a))return;var u=a.href.split("#")[0];clearTimeout(t);t=setTimeout(function(){go(u)},65);a.addEventListener("mouseout",function(){clearTimeout(t)},{once:true})},{capture:true,passive:true});d.addEventListener("touchstart",function(e){var a=link(e);if(ok(a))go(a.href.split("#")[0])},{capture:true,passive:true})})();`

// pathPatternToRegex converts a URLPattern-style path ("/admin/*",
// "/*.xml") into an anchored JS regex source for the fallback script.
func pathPatternToRegex(p string) string {
	var b strings.Builder
	b.WriteString("^")
	for _, r := range p {
		switch r {
		case '*':
			b.WriteString(".*")
		case '.', '+', '?', '(', ')', '[', ']', '{', '}', '^', '$', '|', '\\':
			b.WriteByte('\\')
			b.WriteRune(r)
		default:
			b.WriteRune(r)
		}
	}
	b.WriteString("$")
	return b.String()
}

// navigationSpeculationHTML returns the tags appended to .app.body_end.
// Empty for logged-in users and when the operator turned speculation off.
func navigationSpeculationHTML(settings map[string]string, user *models.User) template.HTML {
	if user != nil {
		return ""
	}
	mode := navSpeculationMode(settings)
	if mode == "off" {
		return ""
	}
	extra := navExtraExcludes(settings)
	rules, err := buildSpeculationRules(mode, navSpeculationEagerness(settings), extra)
	if err != nil {
		return ""
	}
	patterns := append(append([]string{}, navExcludedPaths...), extra...)
	regexes := make([]string, 0, len(patterns))
	for _, p := range patterns {
		regexes = append(regexes, pathPatternToRegex(p))
	}
	rx, err := json.Marshal(regexes)
	if err != nil {
		return ""
	}
	// json.Marshal escapes <, > and & as < etc., so neither payload
	// can terminate the surrounding <script> element.
	return template.HTML(`<script type="speculationrules">` + string(rules) + `</script>` +
		`<script>` + fmt.Sprintf(navFallbackScript, rx) + `</script>`)
}

// setPublicHTMLCacheHeaders sets Cache-Control/Vary on a rendered public
// page. Anonymous 200s get a short private max-age (reused by the
// prefetch fallback and back/forward navigations); everything else —
// logged-in views, errors, 404s — must revalidate. `no-store` is never
// used, so pages stay eligible for the back/forward cache.
func setPublicHTMLCacheHeaders(c *fiber.Ctx, settings map[string]string, user *models.User) {
	c.Vary(fiber.HeaderCookie)
	if user != nil || c.Response().StatusCode() != fiber.StatusOK {
		c.Set(fiber.HeaderCacheControl, "private, no-cache")
		return
	}
	n := htmlCacheSeconds(settings)
	if n == 0 {
		c.Set(fiber.HeaderCacheControl, "private, no-cache")
		return
	}
	c.Set(fiber.HeaderCacheControl, fmt.Sprintf("private, max-age=%d, stale-while-revalidate=%d", n, n*htmlStaleWhileRevalidateX))
}
