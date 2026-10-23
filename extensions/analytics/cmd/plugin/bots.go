package main

import (
	"strings"
)

// botVerdict is the classifier result; Category == "" means human.
type botVerdict struct{ Category, Name string }

func (v botVerdict) isBot() bool { return v.Category != "" }

// botContext carries the request facts the classifier needs. It is built
// from an http.requests record or from a public-route request.
type botContext struct {
	Method      string
	Path        string // normalised
	UA          string
	Headers     func(string) string // lower-case header lookup
	HTMLResult  bool                // response was (or would be) an HTML document
	SawSecFetch bool                // real browsers reach this site with Sec-Fetch-* headers
}

// classifyBot applies, in order: probe paths, UA signatures, generic bot
// tokens and request-shape / header-consistency heuristics.
func classifyBot(c botContext) botVerdict {
	if name := probeName(c.Path); name != "" {
		return botVerdict{botProbe, name}
	}
	ua := strings.ToLower(strings.TrimSpace(c.UA))
	if ua == "" {
		return botVerdict{botHTTPClient, "Empty user agent"}
	}
	if v := matchSignature(ua); v.isBot() {
		return v
	}
	if strings.EqualFold(c.Method, "HEAD") {
		return botVerdict{botMonitor, "HEAD request"}
	}
	return headerHeuristics(c, ua)
}

// matchSignature checks the embedded UA lists and generic crawler tokens.
func matchSignature(ua string) botVerdict {
	// iMessage previews announce themselves as Facebook + Twitter at once.
	if strings.Contains(ua, "facebookexternalhit") && strings.Contains(ua, "twitterbot") {
		return botVerdict{botLinkPreview, "iMessage"}
	}
	browserEngine := strings.Contains(ua, "applewebkit") || strings.Contains(ua, "gecko/")
	for _, s := range botSignatures {
		if s.noBrowser && browserEngine {
			continue
		}
		if strings.Contains(ua, s.token) {
			return botVerdict{s.category, s.name}
		}
	}
	cleaned := ua
	for _, fp := range genericBotFalsePositives {
		cleaned = strings.ReplaceAll(cleaned, fp, "")
	}
	for _, t := range genericBotTokens {
		if strings.Contains(cleaned, t) {
			return botVerdict{botOther, genericBotName(ua)}
		}
	}
	if !strings.HasPrefix(ua, "mozilla/") && !strings.HasPrefix(ua, "opera") {
		return botVerdict{botHTTPClient, genericBotName(ua)}
	}
	return botVerdict{}
}

// genericBotName returns the first product token of the UA, which is
// what unknown crawlers usually put there ("FooBot/1.2 (+http…)" → "FooBot").
func genericBotName(ua string) string {
	if i := strings.Index(ua, "compatible;"); i >= 0 {
		ua = strings.TrimSpace(ua[i+len("compatible;"):])
	}
	end := strings.IndexAny(ua, " /;()")
	if end <= 0 {
		end = len(ua)
	}
	name := ua[:end]
	if len(name) > 40 {
		name = name[:40]
	}
	if name == "" {
		return "Unknown"
	}
	return name
}

// headerHeuristics flags browser-looking requests whose headers no real
// browser would send.
func headerHeuristics(c botContext, ua string) botVerdict {
	h := c.Headers
	if h == nil {
		h = func(string) string { return "" }
	}
	if strings.TrimSpace(h("accept-language")) == "" {
		return botVerdict{botOther, "No Accept-Language"}
	}
	if c.HTMLResult {
		accept := strings.TrimSpace(h("accept"))
		if accept == "" || accept == "*/*" {
			return botVerdict{botHTTPClient, "Generic client (Accept */*)"}
		}
	}
	hasSecFetch := h("sec-fetch-site") != "" || h("sec-fetch-mode") != "" || h("sec-fetch-dest") != ""
	if !hasSecFetch && c.SawSecFetch && modernBrowser(ua) {
		return botVerdict{botHeadless, "Browser UA without Sec-Fetch"}
	}
	// A missing Sec-CH-UA is deliberately not a bot signal: Electron apps,
	// Android WebViews, privacy browsers and plain-HTTP origins all omit it
	// for real people.
	return botVerdict{}
}

// modernBrowser reports UAs that claim a browser version known to send
// Sec-Fetch-* on HTTPS (Chrome 76+, Firefox 90+, Safari 16.4+).
func modernBrowser(ua string) bool {
	switch {
	case strings.Contains(ua, "firefox/"):
		return majorVersion(ua, "firefox/") >= 90
	case strings.Contains(ua, "crios/"), strings.Contains(ua, "fxios/"):
		return false
	case strings.Contains(ua, "chrome/"):
		return majorVersion(ua, "chrome/") >= 76
	case strings.Contains(ua, "safari/") && strings.Contains(ua, "version/"):
		return majorVersion(ua, "version/") >= 17
	}
	return false
}

// probeName returns a probe label when the path is a known scanner target.
func probeName(p string) string {
	for _, prefix := range probePrefixes {
		if strings.HasPrefix(p, prefix) {
			if strings.HasPrefix(prefix, "/wp-") || prefix == "/xmlrpc.php" || prefix == "/wordpress" {
				return "WordPress probe"
			}
			if strings.HasPrefix(prefix, "/.") {
				return "Secrets probe"
			}
			return "Admin/tool probe"
		}
	}
	for _, s := range probeSuffixes {
		if strings.HasSuffix(p, s) {
			return "Script/backup probe"
		}
	}
	return ""
}
