package rendering

import (
	"fmt"
	"html/template"
	"strings"

	"squilla/internal/sanitize"
)

// This file owns the template helpers that block views get in place of
// the renderer's raw ones. Block field values are written by any role
// that can edit content, so in a block view `safeHTML` / `raw` must not
// turn an arbitrary string into markup: plain strings go through the
// rich-text sanitizer, while template.HTML values — which only trusted
// kernel code produces (sanitised richtext fields, event output) — pass
// through untouched.
//
// Layouts and partials keep the renderer's base helpers, where
// `safeHTML` stays raw: that is how themes emit admin-only settings
// such as custom_head_code / analytics_code.

// SanitizedHTML is the block-view `safeHTML` / `raw` helper.
func SanitizedHTML(s interface{}) template.HTML {
	switch v := s.(type) {
	case nil:
		return ""
	case template.HTML:
		return v
	case string:
		return template.HTML(sanitize.RichText(v))
	default:
		return template.HTML(sanitize.RichText(fmt.Sprintf("%v", v)))
	}
}

// SafeURLValue is the block-view `safeURL` helper. It marks a URL as
// trusted (so html/template doesn't rewrite e.g. theme-asset or relative
// URLs) but refuses schemes that execute script: javascript:, vbscript:,
// and data: other than raster images. Refused values become "#".
func SafeURLValue(s interface{}) template.URL {
	var raw string
	switch v := s.(type) {
	case nil:
		return ""
	case template.URL:
		return v
	case string:
		raw = v
	default:
		raw = fmt.Sprintf("%v", v)
	}
	if !urlSchemeSafe(raw) {
		return "#"
	}
	return template.URL(raw)
}

func urlSchemeSafe(u string) bool {
	// Browsers ignore leading whitespace/control chars and tabs/newlines
	// inside the scheme, so normalise before looking at it.
	var b strings.Builder
	for _, r := range u {
		if r <= ' ' {
			continue
		}
		b.WriteRune(r)
		if b.Len() > 32 {
			break
		}
	}
	s := strings.ToLower(b.String())
	switch {
	case strings.HasPrefix(s, "javascript:"), strings.HasPrefix(s, "vbscript:"):
		return false
	case strings.HasPrefix(s, "data:"):
		for _, ok := range []string{"data:image/png", "data:image/jpeg", "data:image/gif", "data:image/webp", "data:image/avif"} {
			if strings.HasPrefix(s, ok) {
				return true
			}
		}
		return false
	}
	return true
}

// BlockFuncOverrides returns the helpers every block-view render must
// layer over the renderer's FuncMap.
func BlockFuncOverrides() template.FuncMap {
	return template.FuncMap{
		"safeHTML": SanitizedHTML,
		"raw":      SanitizedHTML,
		"safeURL":  SafeURLValue,
	}
}

// MaxSeq caps the length of the slice `seq` returns. Field values feed
// seq (star ratings, repeat counts), so an uncapped value like 1e9 would
// allocate gigabytes on every public render.
const MaxSeq = 10_000

// Seq is the `seq` template helper: [0, 1, …, n-1] for n clamped to
// [0, MaxSeq]. It accepts any number kind, since JSON values arrive as
// float64.
func Seq(v interface{}) []int {
	n := toInt(v)
	if n <= 0 {
		return nil
	}
	if n > MaxSeq {
		n = MaxSeq
	}
	out := make([]int, n)
	for i := range out {
		out[i] = i
	}
	return out
}
