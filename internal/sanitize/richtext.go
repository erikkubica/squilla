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
	"sync"

	"github.com/microcosm-cc/bluemonday"
)

var (
	policyOnce sync.Once
	policy     *bluemonday.Policy
)

// richtextPolicy returns the singleton policy used for richtext fields.
// Built on bluemonday.UGCPolicy() with these adjustments:
//   - Allow rel/target on <a> so themes can mark external links.
//   - Allow class attributes (themes hook into them for prose styling).
//   - No <iframe>, <form>, <input>, <style> — those are block-type territory.
func richtextPolicy() *bluemonday.Policy {
	policyOnce.Do(func() {
		p := bluemonday.UGCPolicy()
		p.AllowAttrs("class").Globally()
		p.AllowAttrs("target", "rel").OnElements("a")
		p.AllowAttrs("id").Globally()
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
