package main

import (
	"strings"
	"testing"
)

func headMetaTestSettings() map[string]string {
	return map[string]string{
		"site_url":  "https://beyondvietnam.example",
		"site_name": "Beyond Vietnam",
	}
}

func TestHeadMetaOGImageFromFeaturedImageObject(t *testing.T) {
	node := map[string]any{
		"title":    "Egg coffee",
		"full_url": "/blog/egg-coffee",
		"featured_image": map[string]any{
			"url": "/media/egg.webp", "alt": "Egg coffee in a cup",
			"width": float64(1600), "height": float64(900),
		},
	}
	out := buildHeadMeta(node, nil, headMetaTestSettings(), nil)
	for _, want := range []string{
		`<meta property="og:image" content="https://beyondvietnam.example/media/egg.webp">`,
		`<meta property="og:image:width" content="1600">`,
		`<meta property="og:image:height" content="900">`,
		`<meta property="og:image:alt" content="Egg coffee in a cup">`,
		`<meta name="twitter:card" content="summary_large_image">`,
		`<meta name="twitter:image" content="https://beyondvietnam.example/media/egg.webp">`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("missing %s\n---\n%s", want, out)
		}
	}
}

func TestHeadMetaOGImagePriority(t *testing.T) {
	settings := headMetaTestSettings()
	settings["seo_default_og_image"] = "/theme/assets/og-default.jpg"
	node := map[string]any{
		"title":          "Page",
		"full_url":       "/page",
		"featured_image": map[string]any{"url": "/media/featured.webp"},
	}

	// Per-node seo.og_image wins, as a plain path or a media object.
	for _, seoImage := range []any{"/media/seo.jpg", map[string]any{"url": "/media/seo.jpg"}} {
		out := buildHeadMeta(node, map[string]any{"og_image": seoImage}, settings, nil)
		if !strings.Contains(out, `og:image" content="https://beyondvietnam.example/media/seo.jpg"`) {
			t.Errorf("seo.og_image %#v not used:\n%s", seoImage, out)
		}
	}

	// Featured image beats the site default.
	out := buildHeadMeta(node, nil, settings, nil)
	if !strings.Contains(out, `og:image" content="https://beyondvietnam.example/media/featured.webp"`) {
		t.Errorf("featured image not used:\n%s", out)
	}

	// No featured image ({} from the column default) falls back to the default.
	node["featured_image"] = map[string]any{}
	out = buildHeadMeta(node, nil, settings, nil)
	if !strings.Contains(out, `og:image" content="https://beyondvietnam.example/theme/assets/og-default.jpg"`) {
		t.Errorf("default og image not used:\n%s", out)
	}
}

func TestOGLocale(t *testing.T) {
	for in, want := range map[string]string{
		"en": "en_US", "EN": "en_US", "en-GB": "en_GB", "en_au": "en_GB",
		"vi": "vi_VN", "sk": "sk_SK", "pt": "pt_PT", "pt-BR": "pt_BR",
		"es": "es_ES", "es-MX": "es_LA", "zh": "zh_CN", "zh-Hant": "zh_TW",
		"no": "nb_NO", "ar": "ar_AR", "fr-CA": "fr_CA", "de-AT": "de_DE",
		"": "", "xx": "", "tlh": "",
	} {
		if got := ogLocale(in); got != want {
			t.Errorf("ogLocale(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestHeadMetaLocaleAndType(t *testing.T) {
	node := map[string]any{
		"title": "Home", "full_url": "/", "language_code": "en", "node_type": "page",
	}
	translations := []map[string]any{
		{"language_code": "en", "full_url": "/"},
		{"language_code": "vi", "full_url": "/vi/"},
		{"language_code": "xx", "full_url": "/xx/"},
	}
	out := buildHeadMeta(node, nil, headMetaTestSettings(), translations)
	for _, want := range []string{
		`<meta property="og:locale" content="en_US">`,
		`<meta property="og:locale:alternate" content="vi_VN">`,
		`<meta property="og:type" content="website">`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("missing %s\n---\n%s", want, out)
		}
	}
	if strings.Contains(out, `content="en">`) || strings.Contains(out, "article:") {
		t.Errorf("bare locale or article props on a page:\n%s", out)
	}

	post := map[string]any{
		"title": "Pho", "full_url": "/blog/pho", "language_code": "xx", "node_type": "post",
		"published_at": "2026-11-01T08:00:00Z", "updated_at": "2026-11-02T08:00:00Z",
	}
	out = buildHeadMeta(post, nil, headMetaTestSettings(), nil)
	for _, want := range []string{
		`<meta property="og:type" content="article">`,
		`<meta property="article:published_time" content="2026-11-01T08:00:00Z">`,
		`<meta property="article:modified_time" content="2026-11-02T08:00:00Z">`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("missing %s\n---\n%s", want, out)
		}
	}
	if strings.Contains(out, "og:locale") {
		t.Errorf("unmappable language must not emit og:locale:\n%s", out)
	}
}

func TestHeadMetaSkipsUnresolvedAssetRefs(t *testing.T) {
	settings := headMetaTestSettings()
	node := map[string]any{
		"title":          "Guide",
		"full_url":       "/vietnam-guide",
		"featured_image": map[string]any{"url": "theme-asset:guide-hoan-kiem", "alt": "Lake"},
	}
	out := buildHeadMeta(node, nil, settings, nil)
	if strings.Contains(out, "asset:") || strings.Contains(out, "og:image") {
		t.Errorf("unresolved ref leaked into og:image:\n%s", out)
	}

	settings["seo_default_og_image"] = "/media/default.jpg"
	out = buildHeadMeta(node, nil, settings, nil)
	if !strings.Contains(out, `og:image" content="https://beyondvietnam.example/media/default.jpg"`) {
		t.Errorf("expected fallback past the unresolved ref:\n%s", out)
	}
	if got := schemaImageURL(node, "https://beyondvietnam.example"); got != "" {
		t.Errorf("schemaImageURL leaked unresolved ref: %q", got)
	}
}
