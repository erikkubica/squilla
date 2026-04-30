package cms

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// RobotsHandler serves /robots.txt — dynamically generated from
// site_settings so operators control crawler policy without redeploying.
//
// Behaviour summary:
//   - When seo_robots_index is "false" on the default language → a
//     blanket Disallow: / is emitted regardless of every other toggle.
//     The SEO settings page already warns this is a kill switch.
//   - Otherwise we emit a User-agent: * Allow rule, plus targeted
//     blocks for two distinct AI cohorts:
//       1. Training crawlers (GPTBot, ClaudeBot, Google-Extended,
//          Applebot-Extended, CCBot, Meta-ExternalAgent, Bytespider,
//          Amazonbot, Diffbot, ImagesiftBot, Omgilibot,
//          PetalBot/Huawei, AI2Bot, FacebookBot) — opt-out via
//          robots_allow_ai_training=false.
//       2. Live-fetch / answer-engine crawlers (ChatGPT-User,
//          OAI-SearchBot, PerplexityBot, Perplexity-User,
//          Cohere-AI, YouBot, Bytespider-Search, AndiBot,
//          phindbot) — opt-out via robots_allow_ai_search=false.
//   - robots_disallow_paths is a newline-separated list of path
//     prefixes appended to User-agent: *.
//   - robots_custom is appended verbatim at the end (operator escape
//     hatch for vendor-specific directives, comments, etc.).
//   - Sitemap: prefers robots_sitemap_url (full URL) when set;
//     otherwise composes site_url + /sitemap.xml; falls back to a
//     relative /sitemap.xml so dev environments without site_url
//     still produce a useful file.
type RobotsHandler struct {
	db *gorm.DB
}

// NewRobotsHandler constructs the handler.
func NewRobotsHandler(db *gorm.DB) *RobotsHandler {
	return &RobotsHandler{db: db}
}

// RegisterRoutes mounts /robots.txt on the public app. Plain Get —
// crawlers don't authenticate and the response is identical for every
// caller, so caching upstream is safe.
func (h *RobotsHandler) RegisterRoutes(app *fiber.App) {
	app.Get("/robots.txt", h.Serve)
}

// aiTrainingBots are crawlers that scrape primarily to feed model
// training corpora. Blocking these keeps your content out of the next
// foundation model. Names match each vendor's published User-Agent
// token (case-insensitive matching is on the crawler side).
var aiTrainingBots = []string{
	"GPTBot",                // OpenAI training
	"ClaudeBot",             // Anthropic training
	"anthropic-ai",          // Anthropic legacy
	"Google-Extended",       // Google Gemini training opt-out token
	"Applebot-Extended",     // Apple Intelligence training
	"CCBot",                 // Common Crawl (feeds many models)
	"Meta-ExternalAgent",    // Meta AI training
	"FacebookBot",           // Meta legacy crawl
	"Bytespider",            // ByteDance / Doubao training
	"Amazonbot",             // Amazon AI / Alexa
	"Diffbot",               // Diffbot KG
	"ImagesiftBot",          // Hive image scraping
	"Omgilibot",             // Webz.io / Omgili
	"PetalBot",              // Huawei Petal
	"AI2Bot",                // Allen Institute
	"DataForSeoBot",         // DataForSEO training datasets
	"Timpibot",              // Timpi training
	"cohere-ai",              // Cohere
	"cohere-training-data-crawler",
	"Kangaroo Bot",          // SambaNova
	"Scrapy",                // Generic scraping framework — ambiguous, but commonly used for training scrapes
	"Velen Crawler",         // Velen.io
	"VelenPublicWebCrawler",
	"Webzio-Extended",
	"YouBot",                // You.com training (also live; included here for safety)
}

// aiSearchBots are crawlers that fetch live for an answer-engine /
// chat product when a user asks a question. Blocking these means the
// AI assistant can't cite or summarise your pages on demand. Some
// operators want training blocked but search allowed (better
// citations) — hence the split toggle.
var aiSearchBots = []string{
	"ChatGPT-User",          // OpenAI live-fetch when user asks
	"OAI-SearchBot",         // OpenAI search index
	"PerplexityBot",         // Perplexity index
	"Perplexity-User",       // Perplexity live-fetch
	"AndiBot",               // Andi search
	"phindbot",              // Phind
	"DuckAssistBot",         // DuckDuckGo Assist
	"MistralAI-User",        // Mistral live-fetch
	"Bingbot",               // Microsoft (also classic search; included so blocks really mean blocks)
	"GoogleOther",           // Google internal R&D fetcher
}

// Serve handles GET /robots.txt.
func (h *RobotsHandler) Serve(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/plain; charset=utf-8")
	// Crawlers re-fetch robots.txt frequently. Allow short caching but
	// not long enough to delay an operator's "block them now" change.
	c.Set("Cache-Control", "public, max-age=300")

	settings := h.loadSettings()

	// Master kill-switch: seo_robots_index=false means "stage / private —
	// keep everyone out". Don't second-guess by emitting partial rules.
	if !truthy(settings["seo_robots_index"], true) {
		var b strings.Builder
		b.WriteString("# Indexing disabled in Squilla → Site Settings → SEO.\n")
		b.WriteString("User-agent: *\n")
		b.WriteString("Disallow: /\n")
		return c.SendString(b.String())
	}

	var b strings.Builder
	b.WriteString("# Generated by Squilla. Edit at /admin/settings/site/seo and the Robots schema.\n\n")

	// Default policy block — every UA, plus operator-supplied
	// disallow paths.
	b.WriteString("User-agent: *\n")
	b.WriteString("Allow: /\n")
	// Sensible defaults so operators don't have to think about admin
	// surface area. /admin and /auth are core paths.
	b.WriteString("Disallow: /admin\n")
	b.WriteString("Disallow: /admin/\n")
	b.WriteString("Disallow: /auth/\n")
	b.WriteString("Disallow: /api/\n")
	for _, p := range splitLines(settings["robots_disallow_paths"]) {
		fmt.Fprintf(&b, "Disallow: %s\n", p)
	}
	b.WriteString("\n")

	// AI training opt-out. Default: allowed (keeps backwards-compat
	// behaviour). Operators flipping this off get the full modern
	// blocklist with one toggle.
	if !truthy(settings["robots_allow_ai_training"], true) {
		b.WriteString("# AI training crawlers — blocked via Squilla setting robots_allow_ai_training=false.\n")
		for _, ua := range aiTrainingBots {
			fmt.Fprintf(&b, "User-agent: %s\n", ua)
		}
		b.WriteString("Disallow: /\n\n")
	}

	// AI search / answer-engine opt-out. Independent of training so
	// operators can keep citations while refusing training scrapes.
	if !truthy(settings["robots_allow_ai_search"], true) {
		b.WriteString("# AI search / answer-engine crawlers — blocked via Squilla setting robots_allow_ai_search=false.\n")
		for _, ua := range aiSearchBots {
			fmt.Fprintf(&b, "User-agent: %s\n", ua)
		}
		b.WriteString("Disallow: /\n\n")
	}

	// Custom rules — appended verbatim, no parsing. This is the
	// operator's escape hatch for vendor-specific directives,
	// per-bot Crawl-delay, comments, etc.
	if custom := strings.TrimSpace(settings["robots_custom"]); custom != "" {
		b.WriteString("# Custom rules (robots_custom):\n")
		b.WriteString(custom)
		if !strings.HasSuffix(custom, "\n") {
			b.WriteString("\n")
		}
		b.WriteString("\n")
	}

	// Sitemap line(s). Prefer a fully-qualified URL so crawlers don't
	// have to resolve against the request host (some treat relative
	// sitemaps as invalid).
	for _, sm := range h.sitemapURLs(settings, c) {
		fmt.Fprintf(&b, "Sitemap: %s\n", sm)
	}

	return c.SendString(b.String())
}

// sitemapURLs returns one or more absolute sitemap URLs to advertise.
// Order: explicit override > derived from site_url > request-host
// fallback. The fallback uses the actual request to keep dev
// environments useful before site_url is configured.
func (h *RobotsHandler) sitemapURLs(s map[string]string, c *fiber.Ctx) []string {
	if override := strings.TrimSpace(s["robots_sitemap_url"]); override != "" {
		return []string{override}
	}
	if base := strings.TrimSpace(s["site_url"]); base != "" {
		return []string{strings.TrimRight(base, "/") + "/sitemap.xml"}
	}
	scheme := "http"
	if c.Secure() || strings.EqualFold(c.Get("X-Forwarded-Proto"), "https") {
		scheme = "https"
	}
	host := c.Hostname()
	if host == "" {
		return nil
	}
	return []string{fmt.Sprintf("%s://%s/sitemap.xml", scheme, host)}
}

// loadSettings pulls every key the handler cares about in one round-trip.
// Translatable keys (site_url, seo_robots_index) prefer the default
// language; non-translatable keys (robots_*) live at language_code=''.
// We don't use the schema-driven Store here because robots.txt has no
// admin context — it's a public, locale-agnostic file.
func (h *RobotsHandler) loadSettings() map[string]string {
	out := map[string]string{}
	keys := []string{
		"seo_robots_index",
		"site_url",
		"robots_allow_ai_training",
		"robots_allow_ai_search",
		"robots_disallow_paths",
		"robots_custom",
		"robots_sitemap_url",
	}
	type row struct {
		Key          string
		LanguageCode string
		Value        *string
	}
	var rows []row
	if err := h.db.Table("site_settings").
		Select("key, language_code, value").
		Where("key IN ?", keys).
		Find(&rows).Error; err != nil {
		return out
	}
	// Resolve preference: prefer language_code='' (global), then default
	// language, then any other locale (last-write-wins is fine — this is
	// a best-effort fallback).
	var defLang string
	_ = h.db.Table("languages").Select("code").Where("is_default = ?", true).Limit(1).Scan(&defLang).Error

	rank := func(lc string) int {
		switch {
		case lc == "":
			return 0
		case defLang != "" && lc == defLang:
			return 1
		default:
			return 2
		}
	}
	bestRank := map[string]int{}
	for _, r := range rows {
		v := ""
		if r.Value != nil {
			v = *r.Value
		}
		this := rank(r.LanguageCode)
		if existing, ok := bestRank[r.Key]; !ok || this < existing {
			out[r.Key] = v
			bestRank[r.Key] = this
		}
	}
	return out
}

// truthy interprets a setting value as boolean, falling back to dflt
// when unset. Accepts "true"/"1"/"on"/"yes" in any case.
func truthy(v string, dflt bool) bool {
	v = strings.TrimSpace(strings.ToLower(v))
	if v == "" {
		return dflt
	}
	switch v {
	case "true", "1", "on", "yes":
		return true
	default:
		return false
	}
}

// splitLines splits operator-supplied multiline text into trimmed,
// non-empty entries. Comment lines (#) survive — operators may want
// to leave themselves notes inside the disallow list.
func splitLines(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, "\n")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		out = append(out, p)
	}
	return out
}
