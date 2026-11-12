package cms

import (
	"context"
	"log"
	"path"
	"strings"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/auth"
	"squilla/internal/httpobs"
	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"
)

// pluginRequestHeaders copies the inbound request headers for a plugin,
// stripping credentials (Cookie, Authorization), spoofable client-IP
// headers (replaced by the trusted httpobs.ClientIP value in
// X-Forwarded-For — plugins rate-limit on it) and every client-supplied
// X-User-* header: those are kernel-asserted identity, set by the admin
// proxy only after this, so a client copy must never sit next to them.
func pluginRequestHeaders(c *fiber.Ctx) map[string]string {
	headers := make(map[string]string)
	c.Request().Header.VisitAll(func(key, value []byte) {
		k := string(key)
		kLower := strings.ToLower(k)
		switch kLower {
		case "cookie", "authorization", "x-forwarded-for", "x-real-ip":
			return
		}
		if strings.HasPrefix(kLower, "x-user-") {
			return
		}
		headers[k] = string(value)
	})
	headers["X-Forwarded-For"] = httpobs.ClientIP(c)
	return headers
}

// proxyRequiredCapability returns the role capability a proxied admin
// request needs beyond admin_access: the first matching admin_routes
// rule's capability, else manage_settings for non-GET/HEAD methods.
func proxyRequiredCapability(routes *AdminRouteRegistry, slug, method, relPath string) string {
	if rule := routes.FirstMatch(slug, method, relPath); rule != nil {
		return rule.RequiredCapability
	}
	if method != fiber.MethodGet && method != fiber.MethodHead {
		return defaultMutationCapability
	}
	return ""
}

// defaultMutationCapability gates non-GET/HEAD proxy requests that match
// no admin_routes rule.
const defaultMutationCapability = "manage_settings"

// normalizeProxyPath turns the proxy wildcard into a clean, rooted path:
// "settings/" → "/settings", "//a//b" → "/a/b", "a/../b" → "/b".
func normalizeProxyPath(wildcard string) string {
	return path.Clean("/" + wildcard)
}

// blockedPluginResponseHeaders are response headers a plugin may not set:
// origin-wide security policy the kernel owns (HSTS; CORS is handled by
// prefix below) and hop-by-hop headers that would corrupt the proxied
// response. Content-Security-Policy is not blocked but only ever ADDED
// (see setPluginResponseHeaders), so it can tighten, never loosen.
var blockedPluginResponseHeaders = map[string]bool{
	"strict-transport-security": true,
	"connection":                true,
	"keep-alive":                true,
	"proxy-authenticate":        true,
	"proxy-authorization":       true,
	"proxy-connection":          true,
	"te":                        true,
	"trailer":                   true,
	"transfer-encoding":         true,
	"upgrade":                   true,
	"content-length":            true,
}

// setPluginResponseHeaders copies a plugin's response headers onto c,
// dropping blocked headers, any Access-Control-* header, and any
// Set-Cookie whose cookie isn't the extension's own (slug-prefixed, not
// reserved — the same rule as observe_cookies). Without this a plugin
// could overwrite the admin session cookie, turn off HSTS or open CORS.
//
// A plugin Content-Security-Policy is appended as an extra header rather
// than replacing one the kernel set: browsers enforce every CSP header,
// so a plugin can add restrictions (media-manager's sandbox CSP for SVG /
// download responses) but can't relax the kernel's policy.
func setPluginResponseHeaders(c *fiber.Ctx, slug string, headers map[string]string) {
	for k, v := range headers {
		lk := strings.ToLower(strings.TrimSpace(k))
		switch {
		case blockedPluginResponseHeaders[lk], strings.HasPrefix(lk, "access-control-"):
			log.Printf("[extension-proxy] %s: dropped response header %q", slug, k)
			continue
		case lk == "set-cookie":
			if !pluginMaySetCookie(slug, v) {
				log.Printf("[extension-proxy] %s: dropped Set-Cookie for a cookie it doesn't own", slug)
				continue
			}
		case lk == "content-security-policy" || lk == "content-security-policy-report-only":
			c.Response().Header.Add(k, v)
			continue
		}
		c.Set(k, v)
	}
}

// pluginMaySetCookie reports whether a Set-Cookie value names a cookie
// in slug's own namespace.
func pluginMaySetCookie(slug, setCookie string) bool {
	name := setCookie
	if i := strings.IndexByte(name, ';'); i >= 0 {
		name = name[:i]
	}
	i := strings.IndexByte(name, '=')
	if i <= 0 {
		return false
	}
	name = strings.TrimSpace(name[:i])
	return len(ownedCookieSet(slug, "Set-Cookie", []string{name})) == 1
}

// ExtensionProxy proxies admin API requests to extension gRPC plugins.
// Route: /admin/api/ext/:slug/*
//
// Two layers of authorization sit in front of every proxied call:
//
//  1. admin_access — enforced on every request via the route guard.
//     Plugins assume the kernel has done this; a freshly-registered
//     member must NEVER reach the gRPC plugin even with a valid
//     session.
//
//  2. Per-route capability — the extension's manifest declares
//     `admin_routes` entries (method + path glob + required_capability)
//     and the proxy enforces them BEFORE forwarding to the plugin.
//     This is the gate that stops a user with admin_access but not
//     manage_forms from POSTing to /admin/api/ext/forms/forms/1 to
//     edit a form they have no business editing. Without this layer,
//     UI guards are the only thing standing between the user and
//     the data — and UI guards are not security.
type ExtensionProxy struct {
	pluginMgr *PluginManager
	routes    *AdminRouteRegistry
}

// NewExtensionProxy creates a new ExtensionProxy backed by the given
// route registry. Pass the same registry the activation bridge writes
// to so changes propagate without a restart.
func NewExtensionProxy(pm *PluginManager, routes *AdminRouteRegistry) *ExtensionProxy {
	return &ExtensionProxy{pluginMgr: pm, routes: routes}
}

// RegisterRoutes registers the catch-all proxy route on the given
// router. The admin_access guard runs first; per-route capability
// checks happen inside handleRequest after the plugin slug is known.
func (ep *ExtensionProxy) RegisterRoutes(router fiber.Router) {
	log.Println("[extension-proxy] registering routes on /ext/:slug/* (gated: admin_access + per-route caps)")
	guard := auth.CapabilityRequired("admin_access")
	router.All("/ext/:slug/*", guard, ep.handleRequest)
	router.All("/ext/:slug", guard, ep.handleRequest)
}

func (ep *ExtensionProxy) handleRequest(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing extension slug"})
	}

	// Per-route capability enforcement. The path passed to the matcher
	// is the wildcard portion that the plugin sees, with a leading
	// slash — same shape we forward downstream as PluginHTTPRequest.Path.
	// It is normalised first (trailing slash, "//", "." / "..") so
	// "/settings/" or "//settings" can't slip past a "/settings" rule
	// while the plugin's own router still treats them as the same path.
	//
	// Unmatched requests: GET/HEAD need only admin_access (already
	// checked by the group guard); any other method needs
	// manage_settings, so an extension that declares no admin_routes
	// isn't writable by every Author/Editor.
	relativePath := normalizeProxyPath(c.Params("*"))
	required := proxyRequiredCapability(ep.routes, slug, c.Method(), relativePath)
	if required != "" && !auth.HasCapability(auth.GetCurrentUser(c), required) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "Insufficient permissions",
			},
		})
	}

	// Get plugin client for this extension.
	client := ep.pluginMgr.GetClient(slug)
	if client == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "extension not found or not running"})
	}

	// Build headers map, stripping sensitive headers to prevent token
	// leakage to plugins. Also drop any client-supplied
	// X-Forwarded-For / X-Real-IP — those are spoofable, and plugins
	// rely on them for per-IP rate limiting; the kernel rewrites them
	// below with httpobs.ClientIP(c) (the trusted-proxy-aware client address).
	headers := pluginRequestHeaders(c)

	// Build query params map.
	queryParams := make(map[string]string)
	c.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
		queryParams[string(key)] = string(value)
	})

	// Path params (the wildcard part after /ext/:slug/).
	pathParams := make(map[string]string)
	pathParams["slug"] = slug
	// The rest of the (normalised) path, without the leading slash.
	if wildcard := strings.TrimPrefix(relativePath, "/"); wildcard != "" {
		pathParams["path"] = wildcard
	}

	// Get authenticated user info.
	var userID uint64
	if user := auth.GetCurrentUser(c); user != nil {
		userID = uint64(user.ID)
		headers["X-User-Email"] = user.Email
		if user.FullName != nil {
			headers["X-User-Name"] = *user.FullName
		}
	}

	req := &pb.PluginHTTPRequest{
		Method:      c.Method(),
		Path:        relativePath,
		Headers:     headers,
		Body:        c.Body(),
		QueryParams: queryParams,
		PathParams:  pathParams,
		UserId:      userID,
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), vibeplugin.HTTPCallTimeout)
	defer cancel()
	resp, err := client.HandleHTTPRequestCtx(ctx, req)
	if err != nil {
		log.Printf("[extension-proxy] gRPC error from %s: %v", slug, err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "plugin request failed"})
	}

	// Response bodies are never logged: they carry settings, PII and
	// secrets (e.g. provider config) in production.
	log.Printf("[extension-proxy] %s %s %s -> %d (%d bytes)", slug, c.Method(), relativePath, resp.StatusCode, len(resp.Body))

	// Write response headers, minus those a plugin must not control.
	setPluginResponseHeaders(c, slug, resp.Headers)

	return c.Status(int(resp.StatusCode)).Send(resp.Body)
}
