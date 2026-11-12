package auth

import (
	"net"
	"net/url"
	"os"
	"strings"
	"sync/atomic"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// strictSiteOrigin is set in production (see SetStrictSiteOrigin). When
// true, outbound links that carry secrets (password-reset URLs) are never
// built from the request Host / X-Forwarded-Host header.
var strictSiteOrigin atomic.Bool

// SetStrictSiteOrigin toggles production behaviour for siteOriginFor:
// when on, an unresolvable configured origin is an error instead of a
// fallback to the request's Host header, and loopback origins (the
// seeded "http://localhost:8099" placeholder) are ignored.
func SetStrictSiteOrigin(strict bool) { strictSiteOrigin.Store(strict) }

// siteOriginFor returns the canonical scheme + host (no trailing slash,
// no path) the kernel should use when minting absolute URLs in
// outbound communications such as password-reset emails. ok=false means
// no trustworthy origin is available and the caller must not send the
// link (only possible in strict/production mode).
//
// Resolution order:
//  1. site_settings.site_url — the language-agnostic row, then the
//     default language's row (where the seed and the per-locale settings
//     UI write it, since site_url is Translatable), then any row.
//  2. SQUILLA_PUBLIC_URL, then SITE_URL environment variables.
//  3. Development only: request scheme + Host header. In production this
//     fallback is refused — Host / X-Forwarded-Host are attacker-supplied
//     unless the edge pins them, and a poisoned origin hands the reset
//     token to the attacker.
func siteOriginFor(db *gorm.DB, c *fiber.Ctx) (string, bool) {
	strict := strictSiteOrigin.Load()
	usable := func(raw string) string {
		origin := canonicalOrigin(raw)
		if origin != "" && strict && isLoopbackOrigin(origin) {
			return ""
		}
		return origin
	}
	if db != nil {
		queries := []string{
			"SELECT value FROM site_settings WHERE key = 'site_url' AND language_code = ''",
			"SELECT s.value FROM site_settings s JOIN languages l ON l.code = s.language_code WHERE s.key = 'site_url' AND l.is_default = true",
			"SELECT value FROM site_settings WHERE key = 'site_url' AND value IS NOT NULL AND value <> '' ORDER BY language_code",
		}
		for _, q := range queries {
			var values []*string
			if err := db.Raw(q).Scan(&values).Error; err != nil {
				continue
			}
			for _, v := range values {
				if v == nil {
					continue
				}
				if origin := usable(*v); origin != "" {
					return origin, true
				}
			}
		}
	}
	for _, env := range []string{"SQUILLA_PUBLIC_URL", "SITE_URL"} {
		if origin := usable(os.Getenv(env)); origin != "" {
			return origin, true
		}
	}
	if strict {
		return "", false
	}
	scheme := "http"
	if IsSecureRequest(c) {
		scheme = "https"
	}
	return scheme + "://" + c.Hostname(), true
}

// isLoopbackOrigin reports whether origin points at localhost / a
// loopback IP — never a valid public origin in production.
func isLoopbackOrigin(origin string) bool {
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	host := strings.ToLower(u.Hostname())
	if host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// canonicalOrigin parses raw and returns "scheme://host" (with port if
// present), discarding any path/query/fragment. Returns "" when the
// input doesn't yield a usable absolute URL — caller falls back to the
// next source in that case.
func canonicalOrigin(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return ""
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return ""
	}
	return u.Scheme + "://" + u.Host
}
