// Package sanitize wraps bluemonday to provide a single, audited
// HTML sanitization policy for content authored through the admin
// (richtext block fields, page content, etc.).
//
// Why this exists: prior to its introduction, public_handler.go marked
// every "richtext" field as template.HTML and rendered it verbatim.
// That meant any user with content-write capability could store
// <script>fetch('/admin/api/users').then(...)</script> inside a node
// block and have it execute in the browser of every visitor —
// including admins viewing a preview, leading to full session
// takeover. The mitigation is to strip dangerous markup at render
// time before handing the bytes to template.HTML.
//
// Render-time sanitization (vs. write-time) is deliberate:
//   - The policy can be tightened without rewriting stored content.
//   - Imported/migrated content is sanitized too.
//   - Authors keep their original markup if we ever loosen the rules.
//
// The policy is intentionally a touch stricter than bluemonday's UGC
// default: we strip <iframe> entirely (no embeds without an explicit
// block type) and disallow form/input/style elements outright. If a
// theme genuinely needs richer markup it should expose a custom block
// type, not put more weight on richtext.
package sanitize

import (
	"regexp"
	"sync"

	"github.com/microcosm-cc/bluemonday"
)

var (
	policyOnce sync.Once
	policy     *bluemonday.Policy

	headingIDPattern = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_-]{0,63}$`)
)

// richtextPolicy returns the singleton policy used for richtext fields.
// Built on bluemonday.UGCPolicy() with these adjustments:
//   - Allow rel/target on <a> so themes can mark external links.
//   - Allow class attributes (themes hook into them for prose styling).
//   - No <iframe>, <form>, <input>, <style> — those are block-type territory.
func richtextPolicy() *bluemonday.Policy {
	policyOnce.Do(func() {
		p := ugcPolicyWithoutGlobalID()
		p.AllowAttrs("class").Globally()
		p.AllowAttrs("target", "rel").OnElements("a")
		// target=_blank links get rel="noopener noreferrer" so the opened
		// page can't navigate this one via window.opener.
		p.RequireNoReferrerOnLinks(true)
		p.RequireNoReferrerOnFullyQualifiedLinks(false)
		// id only on headings (in-page anchors) and only as a plain slug:
		// a global id lets authored content clobber DOM globals
		// (window.<id>) that theme or extension scripts read.
		p.AllowAttrs("id").Matching(headingIDPattern).OnElements("h1", "h2", "h3", "h4", "h5", "h6")
		// Pictures/figures/videos are common in content; UGCPolicy already
		// allows <img> and <video src> with safe URL schemes.
		p.AllowAttrs("loading", "decoding").OnElements("img")
		policy = p
	})
	return policy
}

// RichText returns html with all dangerous markup removed. Safe to
// pass directly to template.HTML at render time.
//
// Empty input returns empty string. Whitespace-only input returns the
// input unchanged (sanitizer keeps it).
func RichText(html string) string {
	if html == "" {
		return ""
	}
	return richtextPolicy().Sanitize(html)
}

// ugcPolicyWithoutGlobalID is bluemonday.UGCPolicy() (v1.0.x) with one
// change: AllowStandardAttributes is replaced by its parts minus the
// global `id`, which bluemonday's API can't remove once added. Keep in
// step with UGCPolicy when bumping bluemonday.
func ugcPolicyWithoutGlobalID() *bluemonday.Policy {
	p := bluemonday.NewPolicy()

	// AllowStandardAttributes, without "id".
	p.AllowAttrs("dir").Matching(bluemonday.Direction).Globally()
	p.AllowAttrs("lang").Matching(regexp.MustCompile(`[a-zA-Z]{2,20}`)).Globally()
	p.AllowAttrs("title").Matching(bluemonday.Paragraph).Globally()

	p.AllowStandardURLs()

	p.AllowElements("article", "aside")
	p.AllowAttrs("open").Matching(regexp.MustCompile(`(?i)^(|open)$`)).OnElements("details")
	p.AllowElements("figure")
	p.AllowElements("section")
	p.AllowElements("summary")
	p.AllowElements("h1", "h2", "h3", "h4", "h5", "h6")
	p.AllowElements("hgroup")
	p.AllowAttrs("cite").OnElements("blockquote")
	p.AllowElements("br", "div", "hr", "p", "span", "wbr")
	p.AllowAttrs("href").OnElements("a")

	p.AllowAttrs("name").Matching(regexp.MustCompile(`^([\p{L}\p{N}_-]+)$`)).OnElements("map")
	p.AllowAttrs("alt").Matching(bluemonday.Paragraph).OnElements("area")
	p.AllowAttrs("coords").Matching(regexp.MustCompile(`^([0-9]+,)+[0-9]+$`)).OnElements("area")
	p.AllowAttrs("href").OnElements("area")
	p.AllowAttrs("rel").Matching(bluemonday.SpaceSeparatedTokens).OnElements("area")
	p.AllowAttrs("shape").Matching(regexp.MustCompile(`(?i)^(default|circle|rect|poly)$`)).OnElements("area")
	p.AllowAttrs("usemap").Matching(regexp.MustCompile(`(?i)^#[\p{L}\p{N}_-]+$`)).OnElements("img")

	p.AllowElements("abbr", "acronym", "cite", "code", "dfn", "em",
		"figcaption", "mark", "s", "samp", "strong", "sub", "sup", "var")
	p.AllowAttrs("cite").OnElements("q")
	p.AllowAttrs("datetime").Matching(bluemonday.ISO8601).OnElements("time")
	p.AllowElements("b", "i", "pre", "small", "strike", "tt", "u")
	p.AllowAttrs("dir").Matching(bluemonday.Direction).OnElements("bdi", "bdo")
	p.AllowElements("rp", "rt", "ruby")
	p.AllowAttrs("cite").Matching(bluemonday.Paragraph).OnElements("del", "ins")
	p.AllowAttrs("datetime").Matching(bluemonday.ISO8601).OnElements("del", "ins")

	p.AllowLists()
	p.AllowTables()

	p.AllowAttrs("value", "min", "max", "low", "high", "optimum").Matching(bluemonday.Number).OnElements("meter")
	p.AllowAttrs("value", "max").Matching(bluemonday.Number).OnElements("progress")

	p.AllowImages()
	return p
}
