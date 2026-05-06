package cms

import (
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/auth"
	pb "squilla/pkg/plugin/proto"
)

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
	// Unmatched requests fall through to admin_access (already checked
	// by the group guard), so extensions that haven't declared
	// admin_routes keep working on a deny-low-priv-explicitly basis.
	relativePath := "/" + c.Params("*")
	if rule := ep.routes.FirstMatch(slug, c.Method(), relativePath); rule != nil {
		user := auth.GetCurrentUser(c)
		if rule.RequiredCapability != "" && !auth.HasCapability(user, rule.RequiredCapability) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "Insufficient permissions",
				},
			})
		}
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
	// below with c.IP() (Fiber's authoritative remote address).
	headers := make(map[string]string)
	c.Request().Header.VisitAll(func(key, value []byte) {
		k := string(key)
		kLower := strings.ToLower(k)
		switch kLower {
		case "cookie", "authorization", "x-forwarded-for", "x-real-ip":
			return
		}
		headers[k] = string(value)
	})
	// Insert the trusted remote IP. Plugins read X-Forwarded-For for
	// historical reasons; this overwrite means downstream code keeps
	// working without each plugin having to learn a new header name.
	headers["X-Forwarded-For"] = c.IP()

	// Build query params map.
	queryParams := make(map[string]string)
	c.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
		queryParams[string(key)] = string(value)
	})

	// Path params (the wildcard part after /ext/:slug/).
	pathParams := make(map[string]string)
	pathParams["slug"] = slug
	// The "*" param contains the rest of the path.
	wildcard := c.Params("*")
	if wildcard != "" {
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

	resp, err := client.HandleHTTPRequest(req)
	if err != nil {
		log.Printf("[extension-proxy] gRPC error from %s: %v", slug, err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "plugin request failed"})
	}

	// Debug: log first 500 chars of response body
	bodyPreview := string(resp.Body)
	if len(bodyPreview) > 500 {
		bodyPreview = bodyPreview[:500]
	}
	log.Printf("[extension-proxy] %s %s -> %d (%d bytes): %s", c.Method(), relativePath, resp.StatusCode, len(resp.Body), bodyPreview)

	// Write response headers.
	for k, v := range resp.Headers {
		c.Set(k, v)
	}

	return c.Status(int(resp.StatusCode)).Send(resp.Body)
}
