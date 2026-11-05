package main

import (
	"context"
	"fmt"
	"html"
	"log"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// llms.txt / llms-full.txt (llmstxt.org format). Phase 1b: entries link to
// the HTML pages; no markdown twins and no facts templates yet.
//
// The builder (llmsBuild) is pure over settings + prepared sections so it
// can be unit-tested. The host-fetching code (llmsCollect) only assembles
// the sections.

const (
	llmsFileIndex      = "llms.txt"
	llmsFileFull       = "llms-full.txt"
	llmsCacheTTL       = 10 * time.Minute
	llmsMaxBytes       = 1 << 20
	llmsDescMaxRunes   = 200
	llmsDefaultLimit   = 50
	llmsMaxLimit       = 500
	llmsTruncationNote = "> Truncated: this file reached the 1 MB limit. Use the links in llms.txt for the rest."
)

// llmsTextFieldTypes are the node-type field kinds whose values make it
// into llms-full.txt.
var llmsTextFieldTypes = map[string]bool{
	"string":   true,
	"text":     true,
	"textarea": true,
	"richtext": true,
}

// llmsItem is one node prepared for the builder. SEO is the node's raw
// seo_settings map; the builder reads summary, meta_description and
// llms_exclude from it.
type llmsItem struct {
	Title   string
	URL     string
	Excerpt string
	SEO     map[string]string
	Fields  []llmsField
}

// llmsField is one top-level text field of a node (llms-full only).
type llmsField struct {
	Name  string
	Value string // raw, may contain HTML
}

// llmsSection is one "## Heading" block of llms.txt.
type llmsSection struct {
	Heading string
	Items   []llmsItem
}

// llmsCache holds the two generated bodies for llmsCacheTTL.
type llmsCache struct {
	mu      sync.Mutex
	entries map[string]llmsCacheEntry
}

type llmsCacheEntry struct {
	body string
	at   time.Time
}

func (c *llmsCache) get(key string, now time.Time) (string, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.entries[key]
	if !ok || now.Sub(e.at) >= llmsCacheTTL {
		return "", false
	}
	return e.body, true
}

func (c *llmsCache) put(key, body string, now time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.entries == nil {
		c.entries = map[string]llmsCacheEntry{}
	}
	c.entries[key] = llmsCacheEntry{body: body, at: now}
}

// serveLLMs answers GET /llms.txt and GET /llms-full.txt.
func (p *SEOPlugin) serveLLMs(ctx context.Context, req *pb.PluginHTTPRequest, full bool) (*pb.PluginHTTPResponse, error) {
	headers := map[string]string{
		"Content-Type":  "text/plain; charset=utf-8",
		"Cache-Control": "public, max-age=3600",
	}
	notFound := &pb.PluginHTTPResponse{
		StatusCode: 404,
		Headers:    map[string]string{"Content-Type": "text/plain; charset=utf-8"},
		Body:       []byte("not found"),
	}

	settings, err := p.host.GetSettings(ctx, "")
	if err != nil {
		// Fail closed: if we cannot read the kill-switches we must not
		// advertise the site to LLM crawlers.
		log.Printf("[seo-extension] llms: load settings: %v", err)
		return &pb.PluginHTTPResponse{
			StatusCode: 503,
			Headers:    map[string]string{"Content-Type": "text/plain; charset=utf-8"},
			Body:       []byte("temporarily unavailable"),
		}, nil
	}
	if !truthy(settings["seo_robots_index"], true) || !truthy(settings["llms_enabled"], true) {
		return notFound, nil
	}

	file := llmsFileIndex
	if full {
		file = llmsFileFull
	}
	body, ok := p.llms.get(file, time.Now())
	if !ok {
		// Absolute links need a base; fall back to the request host the
		// same way robots.txt does for its Sitemap line.
		if strings.TrimSpace(settings["site_url"]) == "" {
			settings["site_url"] = llmsSiteBase(settings, req)
		}
		sections, err := p.llmsCollect(ctx, settings, full)
		if err != nil {
			log.Printf("[seo-extension] llms: collect: %v", err)
			return &pb.PluginHTTPResponse{
				StatusCode: 503,
				Headers:    map[string]string{"Content-Type": "text/plain; charset=utf-8"},
				Body:       []byte("temporarily unavailable"),
			}, nil
		}
		body = llmsBuild(settings, sections, full)
		p.llms.put(file, body, time.Now())
	}

	return &pb.PluginHTTPResponse{StatusCode: 200, Headers: headers, Body: []byte(body)}, nil
}

// llmsCollect reads node types and published nodes from the host and
// turns them into sections. Only the full variant loads field values.
func (p *SEOPlugin) llmsCollect(ctx context.Context, settings map[string]string, full bool) ([]llmsSection, error) {
	types, err := p.host.ListNodeTypes(ctx)
	if err != nil {
		return nil, fmt.Errorf("list node types: %w", err)
	}
	selected := llmsSelectTypes(types, settings["llms_node_types"])
	limit := llmsLimit(settings)
	lang := p.llmsDefaultLanguage(ctx, settings)
	homeID64, _ := strconv.ParseUint(strings.TrimSpace(settings["homepage_node_id"]), 10, 64)
	homeID := uint(homeID64)

	var sections []llmsSection
	for _, nt := range selected {
		// Over-fetch so excluded nodes do not shrink the section below limit.
		list, err := p.host.QueryNodes(ctx, coreapi.NodeQuery{
			NodeType:     nt.Slug,
			Status:       "published",
			LanguageCode: lang,
			Limit:        limit * 2,
			OrderBy:      llmsOrderBy(nt.Slug),
		})
		if err != nil {
			log.Printf("[seo-extension] llms: query %s: %v", nt.Slug, err)
			continue
		}
		var items []llmsItem
		for _, n := range list.Nodes {
			if len(items) >= limit {
				break
			}
			if n == nil || n.FullURL == "" || llmsKernelPaths[n.FullURL] || llmsIsExcluded(n.SeoSettings) {
				continue
			}
			item := llmsNodeItem(n, nt, full)
			if homeID != 0 && n.ID == homeID {
				// The homepage is served at the site root, not /<slug>.
				item.URL = "/"
			}
			items = append(items, item)
		}
		if len(items) == 0 {
			continue
		}
		sections = append(sections, llmsSection{Heading: llmsHeading(nt), Items: items})
	}
	return sections, nil
}

// llmsSelectTypes picks the node types to list. Only public types are
// ever advertised. An empty setting means every public type in host
// order; a comma-separated slug list means exactly those, in that order.
func llmsSelectTypes(types []*coreapi.NodeType, setting string) []*coreapi.NodeType {
	bySlug := map[string]*coreapi.NodeType{}
	var public []*coreapi.NodeType
	for _, nt := range types {
		if nt == nil || !nt.Public {
			continue
		}
		bySlug[nt.Slug] = nt
		public = append(public, nt)
	}

	var wanted []string
	for _, s := range strings.Split(setting, ",") {
		if s = strings.TrimSpace(s); s != "" {
			wanted = append(wanted, s)
		}
	}
	if len(wanted) == 0 {
		return public
	}

	var out []*coreapi.NodeType
	seen := map[string]bool{}
	for _, slug := range wanted {
		nt, ok := bySlug[slug]
		if !ok || seen[slug] {
			continue
		}
		seen[slug] = true
		out = append(out, nt)
	}
	return out
}

// llmsDefaultLanguage returns the code of the site's default language.
// The kernel keeps that in languages.is_default, but no host API exposes
// it, so the homepage node's language stands in for it. Empty means no
// language filter (all languages mixed).
func (p *SEOPlugin) llmsDefaultLanguage(ctx context.Context, settings map[string]string) string {
	id, err := strconv.ParseUint(strings.TrimSpace(settings["homepage_node_id"]), 10, 64)
	if err != nil || id == 0 {
		return ""
	}
	n, err := p.host.GetNode(ctx, uint(id))
	if err != nil || n == nil {
		return ""
	}
	return n.LanguageCode
}

// llmsOrderBy is passed straight into the host's ORDER BY, so only fixed
// strings belong here. Pages sort by title (there is no menu order column
// on content nodes); everything else is newest first.
func llmsOrderBy(nodeType string) string {
	if nodeType == "page" {
		return "title ASC"
	}
	return "COALESCE(published_at, created_at) DESC"
}

func llmsHeading(nt *coreapi.NodeType) string {
	if h := llmsOneLine(nt.LabelPlural); h != "" {
		return h
	}
	if h := llmsOneLine(nt.Label); h != "" {
		// No plural label registered (the kernel's "page" type): a plain
		// English plural reads better than "## Page".
		if !strings.HasSuffix(h, "s") {
			h += "s"
		}
		return h
	}
	return nt.Slug
}

func llmsNodeItem(n *coreapi.Node, nt *coreapi.NodeType, full bool) llmsItem {
	it := llmsItem{
		Title:   n.Title,
		URL:     n.FullURL,
		Excerpt: n.Excerpt,
		SEO:     n.SeoSettings,
	}
	if full {
		for _, f := range nt.Fields {
			if !llmsTextFieldTypes[f.Type] || f.Name == "" {
				continue
			}
			v, ok := n.FieldsData[f.Name].(string)
			if !ok || strings.TrimSpace(v) == "" {
				continue
			}
			it.Fields = append(it.Fields, llmsField{Name: f.Name, Value: v})
		}
	}
	return it
}

// llmsSiteBase is the origin used for absolute links when site_url is unset.
func llmsSiteBase(s map[string]string, req *pb.PluginHTTPRequest) string {
	if base := strings.TrimRight(strings.TrimSpace(s["site_url"]), "/"); base != "" {
		return base
	}
	host := req.GetHeaders()["Host"]
	if host == "" {
		host = req.GetHeaders()["X-Forwarded-Host"]
	}
	if host == "" {
		return ""
	}
	scheme := "http"
	if strings.EqualFold(req.GetHeaders()["X-Forwarded-Proto"], "https") {
		scheme = "https"
	}
	return scheme + "://" + host
}

func llmsLimit(s map[string]string) int {
	n, err := strconv.Atoi(strings.TrimSpace(s["llms_limit_per_type"]))
	if err != nil || n <= 0 {
		return llmsDefaultLimit
	}
	if n > llmsMaxLimit {
		return llmsMaxLimit
	}
	return n
}

// llmsBody accumulates blocks under the 1 MB cap. Once a block would not
// fit (with room reserved for the truncation note) it stops accepting.
type llmsBody struct {
	b       strings.Builder
	stopped bool
}

func (w *llmsBody) add(block string) bool {
	if w.stopped {
		return false
	}
	if w.b.Len()+len(block)+2+len(llmsTruncationNote)+2 > llmsMaxBytes {
		w.stopped = true
		return false
	}
	w.b.WriteString(block)
	w.b.WriteString("\n\n")
	return true
}

func (w *llmsBody) finish() string {
	body := strings.TrimRight(w.b.String(), "\n")
	if w.stopped {
		body += "\n\n" + llmsTruncationNote
	}
	return body + "\n"
}

// llmsBuild renders llms.txt (full=false) or llms-full.txt (full=true).
func llmsBuild(settings map[string]string, sections []llmsSection, full bool) string {
	if settings == nil {
		settings = map[string]string{}
	}
	siteURL := strings.TrimRight(strings.TrimSpace(settings["site_url"]), "/")

	w := &llmsBody{}
	w.add("# " + llmsSiteName(settings, siteURL))
	if summary := llmsOneLine(llmsSummary(settings)); summary != "" {
		w.add("> " + summary)
	}
	if about := strings.TrimSpace(settings["llms_about"]); about != "" {
		w.add(about)
	}

	if full {
		llmsWriteFull(w, sections, siteURL)
	} else {
		llmsWriteIndex(w, sections, settings, siteURL)
	}
	return w.finish()
}

func llmsWriteIndex(w *llmsBody, sections []llmsSection, settings map[string]string, siteURL string) {
	for _, sec := range sections {
		var lines []string
		for _, it := range sec.Items {
			if llmsIsExcluded(it.SEO) || strings.TrimSpace(it.URL) == "" {
				continue
			}
			lines = append(lines, llmsItemLine(it, siteURL))
		}
		if len(lines) == 0 {
			continue
		}
		w.add("## " + llmsOneLine(sec.Heading) + "\n" + strings.Join(lines, "\n"))
	}

	var optional []string
	if siteURL != "" {
		optional = append(optional, fmt.Sprintf("- [Sitemap](%s/sitemap.xml)", siteURL))
	}
	for _, line := range splitLines(settings["llms_optional_urls"]) {
		if l := llmsOptionalLine(line, siteURL); l != "" {
			optional = append(optional, l)
		}
	}
	if len(optional) > 0 {
		w.add("## Optional\n" + strings.Join(optional, "\n"))
	}
}

func llmsWriteFull(w *llmsBody, sections []llmsSection, siteURL string) {
	first := true
	for _, sec := range sections {
		for _, it := range sec.Items {
			if llmsIsExcluded(it.SEO) || strings.TrimSpace(it.URL) == "" {
				continue
			}
			block := llmsFullItem(it, siteURL)
			if !first {
				block = "---\n\n" + block
			}
			first = false
			w.add(block)
		}
	}
}

func llmsItemLine(it llmsItem, siteURL string) string {
	line := "- [" + llmsLinkText(it.Title, it.URL) + "](" + llmsLinkURL(absoluteURL(siteURL, strings.TrimSpace(it.URL))) + ")"
	if d := llmsDescription(it); d != "" {
		line += ": " + d
	}
	return line
}

// llmsFullItem renders one entry of llms-full.txt. The description is not
// truncated here, so the full body can carry the complete summary.
func llmsFullItem(it llmsItem, siteURL string) string {
	parts := []string{
		"## " + llmsOneLine(it.Title),
		"URL: " + llmsLinkURL(absoluteURL(siteURL, strings.TrimSpace(it.URL))),
	}
	if d := llmsDescription(it); d != "" {
		parts = append(parts, d)
	}
	for _, f := range it.Fields {
		val := llmsPlainText(f.Value)
		if val == "" {
			continue
		}
		if strings.Contains(val, "\n") {
			parts = append(parts, f.Name+":\n\n"+val)
		} else {
			parts = append(parts, f.Name+": "+val)
		}
	}
	return strings.Join(parts, "\n\n")
}

// llmsOptionalLine parses one llms_optional_urls line: "URL" or "Title | URL".
func llmsOptionalLine(line, siteURL string) string {
	title, url := "", strings.TrimSpace(line)
	if i := strings.Index(line, "|"); i >= 0 {
		title = strings.TrimSpace(line[:i])
		url = strings.TrimSpace(line[i+1:])
	}
	// Only absolute http(s) URLs and site-relative paths ("/faq") are kept.
	// Checked before absoluteURL, which would prefix anything else.
	if !(strings.HasPrefix(url, "https://") || strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "/")) {
		return ""
	}
	url = absoluteURL(siteURL, url)
	if title == "" {
		title = url
	}
	return "- [" + llmsLinkText(title, url) + "](" + llmsLinkURL(url) + ")"
}

// llmsSiteName is the H1: seo_og_site_name, then site_name, then the site URL.
func llmsSiteName(s map[string]string, siteURL string) string {
	name := strings.TrimSpace(stringOr(s["seo_og_site_name"], s["site_name"]))
	if name == "" {
		name = siteURL
	}
	if name == "" {
		name = "Site"
	}
	return llmsOneLine(name)
}

// llmsSummary is the blockquote: llms_summary, then the default meta
// description, then the site description.
func llmsSummary(s map[string]string) string {
	return stringOr(stringOr(s["llms_summary"], s["seo_default_meta_description"]), s["site_description"])
}

// llmsDescription picks summary, then meta description, then excerpt,
// and returns the first non-empty one as a single line of at most
// llmsDescMaxRunes runes.
func llmsDescription(it llmsItem) string {
	for _, raw := range []string{it.SEO["summary"], it.SEO["meta_description"], it.Excerpt} {
		if d := llmsTruncate(llmsOneLine(llmsPlainText(raw)), llmsDescMaxRunes); d != "" {
			return d
		}
	}
	return ""
}

func llmsIsExcluded(seo map[string]string) bool {
	return truthy(seo["llms_exclude"], false) || truthy(seo["noindex"], false)
}

// llmsKernelPaths are the kernel's account pages (seeded as ordinary
// published pages). They carry no content worth indexing.
var llmsKernelPaths = map[string]bool{
	"/login":           true,
	"/register":        true,
	"/forgot-password": true,
	"/reset-password":  true,
}

// llmsTruncate cuts s to at most max runes, preferring a word boundary in
// the second half of the window, and appends an ellipsis when it cuts.
func llmsTruncate(s string, max int) string {
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	cut := string([]rune(s)[:max])
	if i := strings.LastIndex(cut, " "); i >= 0 && utf8.RuneCountInString(cut[:i]) > max/2 {
		cut = cut[:i]
	}
	return strings.TrimRight(cut, " ,.;:-") + "…"
}

var (
	llmsScriptStyle = regexp.MustCompile(`(?is)<script[^>]*>.*?</script\s*>|<style[^>]*>.*?</style\s*>`)
	llmsBreakTag    = regexp.MustCompile(`(?i)<br\s*/?>`)
	llmsBlockEnd    = regexp.MustCompile(`(?i)</(p|div|h[1-6]|li|blockquote|tr)\s*>`)
	llmsAnyTag      = regexp.MustCompile(`<[^>]*>`)
	llmsBlankRuns   = regexp.MustCompile(`\n{3,}`)
)

// llmsPlainText turns HTML (or plain text) into readable text. Block
// boundaries become blank lines, so paragraphs survive.
func llmsPlainText(s string) string {
	s = llmsScriptStyle.ReplaceAllString(s, "")
	s = llmsBreakTag.ReplaceAllString(s, "\n")
	s = llmsBlockEnd.ReplaceAllString(s, "\n\n")
	s = llmsAnyTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	s = strings.ReplaceAll(s, "\r\n", "\n")
	lines := strings.Split(s, "\n")
	for i, l := range lines {
		lines[i] = strings.Join(strings.Fields(l), " ")
	}
	s = llmsBlankRuns.ReplaceAllString(strings.Join(lines, "\n"), "\n\n")
	return strings.TrimSpace(s)
}

// llmsOneLine collapses all whitespace runs into single spaces.
func llmsOneLine(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

// llmsLinkText makes a title safe inside [...] (falls back to the URL).
func llmsLinkText(title, url string) string {
	t := llmsOneLine(llmsPlainText(title))
	if t == "" {
		t = strings.TrimSpace(url)
	}
	return strings.NewReplacer("[", "(", "]", ")").Replace(t)
}

// llmsLinkURL percent-encodes characters that would end a markdown link.
func llmsLinkURL(u string) string {
	return strings.NewReplacer(" ", "%20", "(", "%28", ")", "%29").Replace(u)
}
