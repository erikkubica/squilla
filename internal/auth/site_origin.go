package auth

import (
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// siteOriginFor returns the canonical scheme + host (no trailing slash,
// no path) the kernel should use when minting absolute URLs in
// outbound communications such as password-reset emails.
//
// Resolution order:
//  1. site_settings.site_url (language-agnostic row) — operator-set,
//     authoritative. Stripped to scheme+host so a stored
//     "https://example.com/foo/" still produces "https://example.com".
//  2. Request scheme + Host header — fallback, only safe when the
//     edge proxy pins/sanitizes Host (Coolify+Traefik per-app routers
//     reject mismatched hosts at the edge so an attacker can't poison
//     this fallback path either).
//
// Belt-and-braces: pinning site_url removes the dependency on edge
// posture, so a future proxy misconfig can't turn forgot-password into
// a token-leak vector.
func siteOriginFor(db *gorm.DB, c *fiber.Ctx) string {
	if db != nil {
		var value string
		// Read the language-agnostic row directly. site_url is marked
		// translatable in the kernel schema, but absolute URLs in
		// system emails should not vary by locale — we want one
		// canonical origin per deployment.
		row := db.Raw("SELECT value FROM site_settings WHERE key = ? AND language_code = ''", "site_url").Row()
		if err := row.Scan(&value); err == nil {
			if origin := canonicalOrigin(value); origin != "" {
				return origin
			}
		}
	}
	scheme := "http"
	if IsSecureRequest(c) {
		scheme = "https"
	}
	return scheme + "://" + c.Hostname()
}

// canonicalOrigin parses raw and returns "scheme://host" (with port if
// present), discarding any path/query/fragment. Returns "" when the
// input doesn't yield a usable absolute URL — caller falls back to the
// request-derived origin in that case.
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
