package main

import (
	"encoding/json"
	"fmt"
	"html"
	"strings"

	pb "squilla/pkg/plugin/proto"
)

// buildHeadMeta composes the <meta> tag block emitted in the layout's
// <head> for SEO and social previews. This logic used to live in
// internal/cms/head_meta.go; it moved to this extension so the kernel
// has no SEO-specific code at all — kernel calls
// eventBus.PublishCollect("render.head_meta", payload) and joins
// results without knowing what comes back.
//
// Per-node SEO (`seo` payload key) wins over site-wide defaults from
// site_settings. The output covers canonical URL, robots meta, OG, and
// Twitter card scaffolding plus hreflang alternates when translations
// are supplied.

// handleRenderHead is invoked by the plugin manager on every
// "render.head" event. The kernel ships the full template-facing
// payload (node + settings + translations) without curating what an
// extension might need; we extract our concerns (SEO from the node's
// `seo` JSONB and from site settings) and return the rendered tag
// block as resp.Result, which lands in the kernel's PublishCollect
// results slice.
func (p *SEOPlugin) handleRenderHead(payload []byte) (*pb.EventResponse, error) {
	if len(payload) == 0 {
		return &pb.EventResponse{Handled: false}, nil
	}
	var ctx struct {
		Node         map[string]any    `json:"node"`
		Settings     map[string]string `json:"settings"`
		Translations []map[string]any  `json:"translations"`
	}
	if err := json.Unmarshal(payload, &ctx); err != nil {
		return &pb.EventResponse{Handled: false, Error: "parse payload: " + err.Error()}, nil
	}
	// Per-node SEO overrides come from the node's `seo` JSONB blob,
	// exposed by the kernel's render context as the `seo` key on the
	// node payload (mirrors what themes see at .node.seo).
	var seo map[string]any
	if v, ok := ctx.Node["seo"].(map[string]any); ok {
		seo = v
	}
	html := buildHeadMeta(ctx.Node, seo, ctx.Settings, ctx.Translations)
	return &pb.EventResponse{Handled: true, Result: []byte(html)}, nil
}

// buildHeadMeta is the rendering core. Pure function over the parsed
// payload, so it stays trivial to unit-test if/when we add coverage.
func buildHeadMeta(
	node map[string]any,
	seo map[string]any,
	settings map[string]string,
	translations []map[string]any,
) string {
	if settings == nil {
		settings = map[string]string{}
	}

	siteURL := strings.TrimRight(settings["site_url"], "/")
	siteName := stringOr(settings["seo_og_site_name"], settings["site_name"])

	nodeTitle := stringFromMap(node, "title")
	nodeExcerpt := stringFromMap(node, "excerpt")
	nodeFullURL := stringFromMap(node, "full_url")
	nodeLang := stringFromMap(node, "language_code")
	featuredURL := stringFromMap(node, "featured_image_url")

	title := pickString(seo, "meta_title")
	if title == "" {
		title = stringOr(nodeTitle, settings["seo_default_meta_title"])
	}
	if title == "" {
		title = settings["site_name"]
	}

	desc := pickString(seo, "meta_description")
	if desc == "" {
		desc = stringOr(nodeExcerpt, settings["seo_default_meta_description"])
	}
	if desc == "" {
		desc = settings["site_description"]
	}

	ogImage := pickString(seo, "og_image")
	if ogImage == "" {
		ogImage = featuredURL
	}
	if ogImage == "" {
		ogImage = settings["seo_default_og_image"]
	}
	ogImage = absoluteURL(siteURL, ogImage)

	canonical := absoluteURL(siteURL, nodeFullURL)

	twitterHandle := strings.TrimSpace(settings["seo_twitter_handle"])
	if twitterHandle != "" && !strings.HasPrefix(twitterHandle, "@") {
		twitterHandle = "@" + twitterHandle
	}

	var b strings.Builder
	tag := func(format string, args ...any) {
		b.WriteString(fmt.Sprintf(format, args...))
		b.WriteByte('\n')
	}

	if canonical != "" {
		tag(`<link rel="canonical" href="%s">`, escape(canonical))
	}

	tag(`<meta name="robots" content="%s">`, escape(robotsDirective(settings)))

	if title != "" {
		tag(`<meta property="og:title" content="%s">`, escape(title))
	}
	if desc != "" {
		tag(`<meta property="og:description" content="%s">`, escape(desc))
	}
	if canonical != "" {
		tag(`<meta property="og:url" content="%s">`, escape(canonical))
	}
	tag(`<meta property="og:type" content="article">`)
	if siteName != "" {
		tag(`<meta property="og:site_name" content="%s">`, escape(siteName))
	}
	if ogImage != "" {
		tag(`<meta property="og:image" content="%s">`, escape(ogImage))
	}
	if nodeLang != "" {
		tag(`<meta property="og:locale" content="%s">`, escape(nodeLang))
	}

	cardType := "summary"
	if ogImage != "" {
		cardType = "summary_large_image"
	}
	tag(`<meta name="twitter:card" content="%s">`, cardType)
	if twitterHandle != "" {
		tag(`<meta name="twitter:site" content="%s">`, escape(twitterHandle))
	}
	if title != "" {
		tag(`<meta name="twitter:title" content="%s">`, escape(title))
	}
	if desc != "" {
		tag(`<meta name="twitter:description" content="%s">`, escape(desc))
	}
	if ogImage != "" {
		tag(`<meta name="twitter:image" content="%s">`, escape(ogImage))
	}

	if len(translations) > 0 && siteURL != "" {
		if nodeLang != "" && nodeFullURL != "" {
			tag(`<link rel="alternate" hreflang="%s" href="%s">`,
				escape(nodeLang), escape(canonical))
		}
		for _, tr := range translations {
			lc := stringFromMap(tr, "language_code")
			full := stringFromMap(tr, "full_url")
			if lc == "" || full == "" || lc == nodeLang {
				continue
			}
			tag(`<link rel="alternate" hreflang="%s" href="%s">`,
				escape(lc), escape(absoluteURL(siteURL, full)))
		}
	}

	return b.String()
}

func robotsDirective(settings map[string]string) string {
	if settings["seo_robots_index"] == "false" {
		return "noindex, nofollow"
	}
	return "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
}

func stringOr(primary, fallback string) string {
	if strings.TrimSpace(primary) != "" {
		return primary
	}
	return fallback
}

func pickString(m map[string]any, key string) string {
	if m == nil {
		return ""
	}
	v, ok := m[key]
	if !ok {
		return ""
	}
	if s, ok := v.(string); ok {
		return strings.TrimSpace(s)
	}
	return ""
}

func stringFromMap(m map[string]any, key string) string {
	if m == nil {
		return ""
	}
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func absoluteURL(siteURL, path string) string {
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") || strings.HasPrefix(path, "//") {
		return path
	}
	if siteURL == "" {
		return path
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return siteURL + path
}

func escape(s string) string {
	return html.EscapeString(s)
}
