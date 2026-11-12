package auth

import (
	"net/url"
	"strings"
	"sync/atomic"

	"squilla/internal/api"

	"github.com/gofiber/fiber/v2"
)

// JSONOnlyMutations is CSRF defense for the admin API: any state-changing
// request (POST/PUT/PATCH/DELETE) must carry Content-Type: application/json.
// Combined with SameSite=Strict on the session cookie this stops the
// classic form-submit-from-attacker-site CSRF: a hostile page can submit
// a form with multipart/form-data or application/x-www-form-urlencoded
// without preflight, but the browser blocks application/json POST until
// it has done a CORS preflight that the server can reject.
//
// Mounted on the /admin/api group only; public form-based auth endpoints
// (/auth/login-page, /auth/register, etc.) are handled separately and
// must keep accepting form encoding.
func JSONOnlyMutations() fiber.Handler {
	return func(c *fiber.Ctx) error {
		switch c.Method() {
		case fiber.MethodGet, fiber.MethodHead, fiber.MethodOptions:
			return c.Next()
		}
		if !sameOriginRequest(c) {
			return api.Error(c, fiber.StatusForbidden, "CSRF_ORIGIN", "Cross-site request refused")
		}
		ct := strings.ToLower(strings.TrimSpace(c.Get(fiber.HeaderContentType)))
		// Strip any charset param: "application/json; charset=utf-8" → "application/json".
		if i := strings.Index(ct, ";"); i >= 0 {
			ct = strings.TrimSpace(ct[:i])
		}
		if ct == "application/json" || ct == "" && c.Method() == fiber.MethodDelete {
			// DELETE often has no body and no Content-Type — accept that.
			return c.Next()
		}
		// Allow multipart/form-data only for the file upload endpoints
		// that genuinely need it. Anything else gets rejected.
		if strings.HasPrefix(ct, "multipart/form-data") && allowsMultipart(c.Path()) {
			return c.Next()
		}
		return api.Error(c, fiber.StatusUnsupportedMediaType, "INVALID_CONTENT_TYPE", "Mutations require Content-Type: application/json")
	}
}

// allowsMultipart returns true for admin API paths that legitimately
// accept file uploads via multipart/form-data. Keep this list explicit
// so adding a new upload endpoint is a deliberate change.
func allowsMultipart(path string) bool {
	multipartPaths := []string{
		"/admin/api/themes/upload",
		"/admin/api/extensions/upload",
		"/admin/api/media/upload",
	}
	for _, p := range multipartPaths {
		if strings.HasPrefix(path, p) {
			return true
		}
	}
	// Extension-mounted multipart endpoints under /admin/api/ext/<slug>/...
	// are extension-controlled — bypass and let the extension's handler
	// validate. (Capability gates already constrain who can reach this.)
	if strings.HasPrefix(path, "/admin/api/ext/") {
		return true
	}
	return false
}

// allowedOrigins holds the configured CORS allowlist (scheme://host),
// installed at boot via SetAllowedOrigins.
var allowedOrigins atomic.Pointer[map[string]bool]

// SetAllowedOrigins installs the CORS allowlist that the mutation guard
// accepts as cross-origin request sources (comma-separated origins, as in
// CORS_ORIGINS). "*" and "null" are ignored.
func SetAllowedOrigins(csv string) {
	m := map[string]bool{}
	for _, o := range strings.Split(csv, ",") {
		o = strings.TrimRight(strings.TrimSpace(o), "/")
		if o == "" || o == "*" || o == "null" {
			continue
		}
		m[strings.ToLower(o)] = true
	}
	allowedOrigins.Store(&m)
}

// sameOriginRequest is the fetch-metadata / Origin half of the CSRF guard
// for cookie-authenticated mutations. SameSite=Strict alone doesn't stop a
// same-SITE sibling origin (another subdomain, a user-content host) from
// forging requests — notably multipart uploads, which skip the CORS
// preflight. Browsers always send Sec-Fetch-Site and/or Origin on
// mutations; requests carrying neither (curl, server-side clients) keep
// working, as do requests without a session cookie (nothing to forge).
func sameOriginRequest(c *fiber.Ctx) bool {
	if c.Cookies(CookieName) == "" {
		return true
	}
	if sfs := strings.ToLower(strings.TrimSpace(c.Get("Sec-Fetch-Site"))); sfs != "" {
		if sfs == "same-origin" || sfs == "none" {
			return true
		}
		// same-site / cross-site: only a configured CORS origin may pass.
		return originAllowed(c.Get(fiber.HeaderOrigin))
	}
	origin := strings.TrimSpace(c.Get(fiber.HeaderOrigin))
	if origin == "" {
		return true
	}
	if originAllowed(origin) {
		return true
	}
	u, err := url.Parse(origin)
	if err != nil || u.Host == "" {
		return false
	}
	return strings.EqualFold(u.Host, c.Hostname())
}

func originAllowed(origin string) bool {
	origin = strings.ToLower(strings.TrimRight(strings.TrimSpace(origin), "/"))
	if origin == "" || origin == "null" {
		return false
	}
	m := allowedOrigins.Load()
	return m != nil && (*m)[origin]
}
