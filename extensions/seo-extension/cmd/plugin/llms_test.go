package main

import (
	"strings"
	"testing"
	"time"

	"squilla/internal/coreapi"
)

func llmsTestSettings() map[string]string {
	return map[string]string{
		"site_url":                     "https://example.com/",
		"site_name":                    "Example",
		"seo_og_site_name":             "Example Walks",
		"site_description":             "Fallback site description.",
		"seo_default_meta_description": "Default meta description.",
	}
}

func TestLLMsHeaderFallbacks(t *testing.T) {
	// seo_og_site_name wins for the H1; llms_summary wins for the blockquote.
	s := llmsTestSettings()
	s["llms_summary"] = "  Walks in   Hanoi\n\nfor small groups.  "
	out := llmsBuild(s, nil, false)
	if !strings.HasPrefix(out, "# Example Walks\n\n> Walks in Hanoi for small groups.\n") {
		t.Fatalf("header wrong:\n%s", out)
	}

	// No seo_og_site_name -> site_name. No llms_summary -> seo default meta description.
	delete(s, "seo_og_site_name")
	delete(s, "llms_summary")
	out = llmsBuild(s, nil, false)
	if !strings.HasPrefix(out, "# Example\n\n> Default meta description.\n") {
		t.Fatalf("site_name / meta description fallback wrong:\n%s", out)
	}

	// No seo default -> site description.
	delete(s, "seo_default_meta_description")
	out = llmsBuild(s, nil, false)
	if !strings.Contains(out, "> Fallback site description.\n") {
		t.Fatalf("site_description fallback wrong:\n%s", out)
	}
}

func TestLLMsAboutVerbatim(t *testing.T) {
	s := llmsTestSettings()
	s["llms_about"] = "Line one.\n  - bullet kept\n\nLine three.\n"
	out := llmsBuild(s, nil, false)
	if !strings.Contains(out, "\n\nLine one.\n  - bullet kept\n\nLine three.\n\n") {
		t.Fatalf("about text not verbatim:\n%q", out)
	}
}

func TestLLMsEmptySite(t *testing.T) {
	out := llmsBuild(map[string]string{}, nil, false)
	if out != "# Site\n" {
		t.Fatalf("empty site output = %q, want %q", out, "# Site\n")
	}
	full := llmsBuild(nil, nil, true)
	if full != "# Site\n" {
		t.Fatalf("empty site full output = %q", full)
	}
}

func TestLLMsSectionsAndExclusion(t *testing.T) {
	s := llmsTestSettings()
	sections := []llmsSection{
		{Heading: "Experiences", Items: []llmsItem{
			{Title: "Taste of Hanoi", URL: "/experiences/taste", SEO: map[string]string{"summary": "3 h street-food walk."}},
			{Title: "Hidden Walk", URL: "/experiences/hidden", SEO: map[string]string{"llms_exclude": "true", "summary": "Secret."}},
		}},
		{Heading: "Journal", Items: []llmsItem{
			{Title: "Only hidden", URL: "/blog/x", SEO: map[string]string{"llms_exclude": "true"}},
		}},
		{Heading: "Empty", Items: nil},
	}
	out := llmsBuild(s, sections, false)

	if !strings.Contains(out, "## Experiences\n- [Taste of Hanoi](https://example.com/experiences/taste): 3 h street-food walk.\n") {
		t.Fatalf("section/item wrong:\n%s", out)
	}
	if strings.Contains(out, "Hidden Walk") || strings.Contains(out, "Secret.") {
		t.Fatalf("excluded node leaked:\n%s", out)
	}
	if strings.Contains(out, "## Journal") || strings.Contains(out, "## Empty") {
		t.Fatalf("sections with no listable items must be omitted:\n%s", out)
	}
}

func TestLLMsDescriptionFallbackChain(t *testing.T) {
	tests := []struct {
		name string
		item llmsItem
		want string
	}{
		{"summary wins", llmsItem{SEO: map[string]string{"summary": "S", "meta_description": "M"}, Excerpt: "E"}, "S"},
		{"meta next", llmsItem{SEO: map[string]string{"summary": "  ", "meta_description": "M"}, Excerpt: "E"}, "M"},
		{"excerpt last", llmsItem{Excerpt: "E"}, "E"},
		{"html stripped", llmsItem{Excerpt: "<p>Hello <b>big</b>\n  world</p><p>again</p>"}, "Hello big world again"},
		{"entities decoded", llmsItem{Excerpt: "Tom &amp; Jerry"}, "Tom & Jerry"},
		{"empty omitted", llmsItem{Excerpt: "<p> </p>"}, ""},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := llmsDescription(tc.item); got != tc.want {
				t.Fatalf("llmsDescription = %q, want %q", got, tc.want)
			}
		})
	}

	// Empty description drops the ": " separator entirely.
	line := llmsItemLine(llmsItem{Title: "Bare", URL: "/bare"}, "https://example.com")
	if line != "- [Bare](https://example.com/bare)" {
		t.Fatalf("line without description = %q", line)
	}
}

func TestLLMsDescriptionTruncation(t *testing.T) {
	words := strings.Repeat("lorem ipsum dolor ", 40) // ~720 chars
	got := llmsDescription(llmsItem{Excerpt: words})
	if n := len([]rune(got)); n > llmsDescMaxRunes+1 {
		t.Fatalf("description has %d runes, want <= %d", n, llmsDescMaxRunes+1)
	}
	if !strings.HasSuffix(got, "…") {
		t.Fatalf("truncated description should end with ellipsis: %q", got)
	}
	body := strings.TrimSuffix(got, "…")
	if !strings.HasSuffix(words, body+" ") && !strings.HasSuffix(words, body) {
		t.Fatalf("truncation not on a word boundary: %q", got)
	}
	// Multi-byte text must not be split mid-rune.
	cjk := strings.Repeat("ẩm thực ", 60)
	if got := llmsDescription(llmsItem{Excerpt: cjk}); !strings.HasSuffix(got, "…") || !isValidUTF8(got) {
		t.Fatalf("multi-byte truncation broken: %q", got)
	}
}

func TestLLMsOptionalSection(t *testing.T) {
	s := llmsTestSettings()
	s["llms_optional_urls"] = "Press kit | https://example.com/press\n/faq\n\n  Contact | /contact  \nhttps://other.test/x\njavascript:alert(1)\n"
	out := llmsBuild(s, nil, false)

	want := []string{
		"## Optional\n",
		"- [Sitemap](https://example.com/sitemap.xml)\n",
		"- [Press kit](https://example.com/press)\n",
		"- [https://example.com/faq](https://example.com/faq)\n",
		"- [Contact](https://example.com/contact)\n",
		"- [https://other.test/x](https://other.test/x)\n",
	}
	for _, w := range want {
		if !strings.Contains(out, w) {
			t.Fatalf("missing %q in:\n%s", w, out)
		}
	}
	if strings.Contains(out, "javascript") {
		t.Fatalf("non-http optional URL must be dropped:\n%s", out)
	}
	if !strings.HasSuffix(out, "- [https://other.test/x](https://other.test/x)\n") {
		t.Fatalf("Optional must be the last section:\n%s", out)
	}
}

func TestLLMsOptionalOmittedWithoutSiteURL(t *testing.T) {
	out := llmsBuild(map[string]string{"site_name": "X"}, nil, false)
	if strings.Contains(out, "## Optional") {
		t.Fatalf("no sitemap and no optional lines should omit the section:\n%s", out)
	}
}

func TestLLMsFullOutput(t *testing.T) {
	s := llmsTestSettings()
	sections := []llmsSection{
		{Heading: "Experiences", Items: []llmsItem{
			{
				Title:   "Taste of Hanoi",
				URL:     "/experiences/taste",
				SEO:     map[string]string{"summary": "Street food walk."},
				Excerpt: "ignored because summary wins",
				Fields: []llmsField{
					{Name: "body", Value: "<p>First paragraph.</p><p>Second &amp; last.</p>"},
					{Name: "price_note", Value: "Pay after the tour."},
				},
			},
			{Title: "Hidden", URL: "/experiences/hidden", SEO: map[string]string{"llms_exclude": "true"},
				Fields: []llmsField{{Name: "body", Value: "secret"}}},
			{Title: "Egg coffee", URL: "/blog/egg", Excerpt: "Origins."},
		}},
	}
	out := llmsBuild(s, sections, true)

	if strings.Contains(out, "## Optional") {
		t.Fatalf("llms-full must not carry the Optional section:\n%s", out)
	}
	if strings.Contains(out, "secret") {
		t.Fatalf("excluded node leaked into full:\n%s", out)
	}
	want := "## Taste of Hanoi\n\nURL: https://example.com/experiences/taste\n\nStreet food walk.\n\n" +
		"body:\n\nFirst paragraph.\n\nSecond & last.\n\nprice_note: Pay after the tour.\n\n" +
		"---\n\n## Egg coffee\n\nURL: https://example.com/blog/egg\n\nOrigins.\n"
	if !strings.Contains(out, want) {
		t.Fatalf("full body mismatch.\nwant:\n%s\n\ngot:\n%s", want, out)
	}
}

func TestLLMsFullSizeCap(t *testing.T) {
	big := strings.Repeat("x", 100*1024)
	var items []llmsItem
	for i := 0; i < 30; i++ {
		items = append(items, llmsItem{
			Title:  "Item",
			URL:    "/item",
			Fields: []llmsField{{Name: "body", Value: big}},
		})
	}
	out := llmsBuild(llmsTestSettings(), []llmsSection{{Heading: "Things", Items: items}}, true)
	if len(out) > llmsMaxBytes {
		t.Fatalf("output %d bytes exceeds cap %d", len(out), llmsMaxBytes)
	}
	if !strings.HasSuffix(out, llmsTruncationNote+"\n") {
		t.Fatalf("missing truncation note at end")
	}
	if strings.Count(out, "## Item") >= 30 {
		t.Fatalf("expected some items to be dropped")
	}
}

func TestLLMsSelectTypes(t *testing.T) {
	types := []*coreapi.NodeType{
		{Slug: "page", LabelPlural: "Pages", Public: true},
		{Slug: "review", LabelPlural: "Reviews", Public: false},
		{Slug: "experience", LabelPlural: "Experiences", Public: true},
		{Slug: "post", LabelPlural: "Posts", Public: true},
	}
	slugs := func(nts []*coreapi.NodeType) string {
		var out []string
		for _, nt := range nts {
			out = append(out, nt.Slug)
		}
		return strings.Join(out, ",")
	}
	if got := slugs(llmsSelectTypes(types, "")); got != "page,experience,post" {
		t.Fatalf("default selection = %s", got)
	}
	if got := slugs(llmsSelectTypes(types, " post , experience,post,missing,review")); got != "post,experience" {
		t.Fatalf("explicit selection = %s (public filter and order expected)", got)
	}
}

func TestLLMsLimit(t *testing.T) {
	cases := map[string]int{"": 50, "abc": 50, "0": 50, "-3": 50, "12": 12, "9999": llmsMaxLimit}
	for in, want := range cases {
		if got := llmsLimit(map[string]string{"llms_limit_per_type": in}); got != want {
			t.Fatalf("llmsLimit(%q) = %d, want %d", in, got, want)
		}
	}
}

func TestLLMsCacheTTL(t *testing.T) {
	var c llmsCache
	now := time.Now()
	c.put(llmsFileIndex, "body", now)
	if got, ok := c.get(llmsFileIndex, now.Add(9*time.Minute)); !ok || got != "body" {
		t.Fatalf("expected cache hit inside TTL")
	}
	if _, ok := c.get(llmsFileIndex, now.Add(llmsCacheTTL)); ok {
		t.Fatalf("expected cache miss at TTL")
	}
	if _, ok := c.get(llmsFileFull, now); ok {
		t.Fatalf("keys must be independent")
	}
}

func TestLLMsSampleOutput(t *testing.T) {
	s := map[string]string{
		"site_url":           "https://beyondvietnam.example",
		"seo_og_site_name":   "Beyond Vietnam",
		"llms_summary":       "Small-group food and culture walks in Hanoi's Old Quarter, led by local hosts.",
		"llms_about":         "Max 6 guests. Pay after the tour. Not a travel agency for flights or hotels.",
		"llms_optional_urls": "FAQ | /faq\nContact | /contact",
	}
	sections := []llmsSection{
		{Heading: "Experiences", Items: []llmsItem{
			{Title: "Taste of Hanoi", URL: "/experiences/taste-of-hanoi", SEO: map[string]string{"summary": "3 h street-food walk, daily 9:00 and 17:00."}},
			{Title: "Egg coffee tour", URL: "/experiences/egg-coffee", Excerpt: "<p>Evening walk to the best egg coffee spots.</p>"},
		}},
		{Heading: "Journal", Items: []llmsItem{
			{Title: "Egg coffee, explained", URL: "/blog/egg-coffee", SEO: map[string]string{"meta_description": "Where it came from and where to drink it."}},
		}},
	}
	out := llmsBuild(s, sections, false)
	t.Logf("sample llms.txt:\n%s", out)
	if !strings.Contains(out, "## Journal\n- [Egg coffee, explained](https://beyondvietnam.example/blog/egg-coffee): Where it came from and where to drink it.") {
		t.Fatalf("sample shape wrong:\n%s", out)
	}
}

func isValidUTF8(s string) bool {
	for _, r := range s {
		if r == '�' {
			return false
		}
	}
	return true
}

func TestLLMsHeadingFallsBackToPluralisedLabel(t *testing.T) {
	cases := map[string]*coreapi.NodeType{
		"Experiences": {Slug: "experience", Label: "Experience", LabelPlural: "Experiences"},
		"Pages":       {Slug: "page", Label: "Page"},
		"News":        {Slug: "news", Label: "News"},
		"faq":         {Slug: "faq"},
	}
	for want, nt := range cases {
		if got := llmsHeading(nt); got != want {
			t.Errorf("llmsHeading(%+v) = %q, want %q", nt, got, want)
		}
	}
}

func TestLLMsExcludesNoindex(t *testing.T) {
	if !llmsIsExcluded(map[string]string{"noindex": "true"}) || llmsIsExcluded(map[string]string{"meta_title": "x"}) {
		t.Fatal("noindex nodes must be excluded, others kept")
	}
}
