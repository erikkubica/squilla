package cms

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/models"
	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"
)

// PublicExtensionProxy registers public (no auth) routes declared by extensions
// and proxies them to the corresponding gRPC plugin's HandleHTTPRequest.
type PublicExtensionProxy struct {
	pluginMgr *PluginManager
	source    func() ([]models.Extension, error)
	routes    atomic.Pointer[[]publicRoute]

	// Test seams; nil uses the plugin manager.
	running    func(slug string) bool
	newHandler func(slug, path string) fiber.Handler
}

func (pp *PublicExtensionProxy) isRunning(slug string) bool {
	if pp.running != nil {
		return pp.running(slug)
	}
	return pp.pluginMgr != nil && pp.pluginMgr.GetClient(slug) != nil
}

// NewPublicExtensionProxy creates a new PublicExtensionProxy.
func NewPublicExtensionProxy(pm *PluginManager) *PublicExtensionProxy {
	return &PublicExtensionProxy{pluginMgr: pm}
}

// reservedPublicPathPrefixes are kernel-owned URL spaces that
// extensions MUST NOT register through their public_routes manifest.
// An extension that lists path: "/login" would otherwise mount a
// no-auth handler that shadows the kernel login form — perfect for
// credential phishing once installed. Defense in depth: the kernel
// installer doesn't audit manifests today, so we filter at boot.
//
// Stored without trailing slashes; isReservedPublicPath matches both
// the exact prefix and prefix-followed-by-/ : * (Fiber path
// separators). That keeps "/auth/" reserved while leaving
// "/auth-callback" free for an extension to claim.
var reservedPublicPathPrefixes = []string{
	"/admin",           // entire admin SPA + API
	"/auth",            // login/register/forgot/reset POST handlers
	"/api/v1",          // versioned public API (theme webhook, etc.)
	"/me",              // /me identity endpoint
	"/login",           // login page
	"/logout",          // logout endpoint
	"/register",        // registration page
	"/forgot-password", // password reset request page
	"/reset-password",  // password reset completion page
}

// isReservedPublicPath reports whether path belongs to a kernel-owned
// namespace and so cannot be claimed by an extension public_route.
// The match is exact-or-followed-by-Fiber-separator so /auth-callback
// stays free while /auth/login stays reserved.
func isReservedPublicPath(path string) bool {
	if path == "" || path == "/" {
		// Root catch-alls would shadow every other route Fiber resolves.
		return true
	}
	for _, p := range reservedPublicPathPrefixes {
		if path == p {
			return true
		}
		if len(path) > len(p) && strings.HasPrefix(path, p) {
			next := path[len(p)]
			if next == '/' || next == '*' || next == ':' {
				return true
			}
		}
	}
	return false
}

// publicRoute is one compiled public_routes entry.
type publicRoute struct {
	slug    string
	method  string // upper-case; "" means any method
	pattern string
	// passthrough routes are dispatched late (MountPassthrough) and the
	// plugin may decline a request, see PublicRouteEntry.Passthrough.
	passthrough bool
	match       func(path string) (wildcard string, ok bool)
	handler     fiber.Handler
}

// RegisterPublicRoutes mounts the public-route dispatcher on app and loads
// the route table from exts. Kept for callers that only need a one-shot
// mount (tests, tools); the server uses Mount + Refresh so routes from an
// extension activated at runtime are served without a restart.
func (pp *PublicExtensionProxy) RegisterPublicRoutes(app *fiber.App, exts []models.Extension) {
	pp.Mount(app)
	pp.SetExtensions(exts)
}

// Mount installs a single dispatcher middleware at the current position in
// app's stack. Fiber can't add routes once it is serving, so instead of one
// Fiber route per manifest entry the dispatcher matches the request against
// a route table it looks up at request time. SetExtensions/Refresh swap that
// table atomically, which is what makes hot activation mount new routes.
func (pp *PublicExtensionProxy) Mount(app *fiber.App) {
	app.Use(func(c *fiber.Ctx) error { return pp.dispatch(c, false) })
}

// MountPassthrough installs the dispatcher for `"passthrough": true` routes.
// Mount it after every kernel, static and extension route and right before
// the public page router: those routes only see requests nothing else
// claimed, and the plugin may hand a request on to the page router.
func (pp *PublicExtensionProxy) MountPassthrough(app *fiber.App) {
	app.Use(func(c *fiber.Ctx) error { return pp.dispatch(c, true) })
}

// PassthroughHeader is the response header a plugin sets (to any non-empty
// value) on a passthrough route to decline the request. The plugin's
// response is discarded and the request continues to the page router.
const PassthroughHeader = "X-Squilla-Passthrough"

// passthroughTimeout bounds the plugin call on a passthrough route. Those
// routes sit in front of every public page, so a hung plugin must cost a
// visitor at most this long before the page renders anyway.
const passthroughTimeout = 2 * time.Second

// SetSource sets the function Refresh uses to list the extensions whose
// routes should be live (normally ExtensionLoader.GetActive).
func (pp *PublicExtensionProxy) SetSource(fn func() ([]models.Extension, error)) {
	pp.source = fn
}

// Refresh reloads the route table from the source set with SetSource.
// Called on extension.activated / extension.deactivated so a manifest that
// gained or lost public routes takes effect immediately.
func (pp *PublicExtensionProxy) Refresh() {
	if pp.source == nil {
		return
	}
	exts, err := pp.source()
	if err != nil {
		log.Printf("[public-proxy] refresh failed: %v", err)
		return
	}
	pp.SetExtensions(exts)
}

// SetExtensions compiles the public_routes of exts (in order — callers pass
// them sorted by priority) and swaps them in as the live route table.
// Reserved kernel paths are refused with a warning so a hostile or careless
// manifest can't shadow auth-critical routes.
func (pp *PublicExtensionProxy) SetExtensions(exts []models.Extension) {
	routes := make([]publicRoute, 0)
	for _, ext := range exts {
		var manifest ExtensionManifest
		if err := json.Unmarshal([]byte(ext.Manifest), &manifest); err != nil {
			continue
		}
		slug := ext.Slug
		for _, route := range manifest.PublicRoutes {
			method := strings.ToUpper(strings.TrimSpace(route.Method))
			switch method {
			case "GET", "POST", "PUT", "DELETE", "PATCH":
			default:
				method = ""
			}
			path := route.Path
			if isReservedPublicPath(path) {
				log.Printf("[public-proxy] REFUSING %s %s for extension %s — path is kernel-reserved", route.Method, path, slug)
				continue
			}
			routes = append(routes, publicRoute{
				slug:        slug,
				method:      method,
				pattern:     path,
				passthrough: route.Passthrough,
				match:       compilePublicRoutePattern(path),
				handler:     pp.handlerFor(slug, path, route.Passthrough),
			})
		}
	}
	pp.routes.Store(&routes)
	log.Printf("[public-proxy] %d public routes live", len(routes))
}

// dispatch finds the first route of the given stage matching the request and
// runs its handler. When nothing matches — or the matched extension's plugin
// isn't running and the handler steps aside — the request continues down the
// Fiber stack. On the passthrough stage a route whose plugin declined the
// request is skipped and the next matching route gets its turn.
func (pp *PublicExtensionProxy) dispatch(c *fiber.Ctx, passthrough bool) error {
	table := pp.routes.Load()
	if table == nil || len(*table) == 0 {
		return c.Next()
	}
	method := c.Method()
	path := c.Path()
	for i := range *table {
		r := &(*table)[i]
		if r.passthrough != passthrough {
			continue
		}
		if r.method != "" && r.method != method && !(r.method == "GET" && method == "HEAD") {
			continue
		}
		wildcard, ok := r.match(path)
		if !ok {
			continue
		}
		if !pp.isRunning(r.slug) {
			continue
		}
		c.Locals(publicRouteWildcardKey, wildcard)
		if !passthrough {
			return r.handler(c)
		}
		c.Locals(publicRouteDeclinedKey, false)
		if err := r.handler(c); err != nil {
			return err
		}
		if declined, _ := c.Locals(publicRouteDeclinedKey).(bool); !declined {
			return nil
		}
	}
	return c.Next()
}

func (pp *PublicExtensionProxy) handlerFor(slug, path string, passthrough bool) fiber.Handler {
	if pp.newHandler != nil {
		return pp.newHandler(slug, path)
	}
	return pp.makeHandler(slug, path, passthrough)
}

// publicRouteDeclinedKey is set to true by a passthrough handler that did
// not answer the request (plugin declined, stopped, or failed).
const publicRouteDeclinedKey = "squilla.public_route.declined"

const publicRouteWildcardKey = "squilla.public_route.wildcard"

// compilePublicRoutePattern turns a Fiber-style route path into a matcher
// with Fiber's default semantics (case-insensitive, trailing slash optional):
//
//	/robots.txt       literal
//	/forms/:id        one segment; ":id?" makes it optional
//	/media/*          greedy rest, may be empty ("/media" matches too)
//	/media/+          greedy rest, must be non-empty
//
// The wildcard value ("*" or "+") is returned so the plugin receives it as
// path_params.path, as it did when each entry was a Fiber route.
func compilePublicRoutePattern(pattern string) func(string) (string, bool) {
	pat := strings.Trim(strings.ToLower(pattern), "/")
	var segs []string
	if pat != "" {
		segs = strings.Split(pat, "/")
	}
	return func(path string) (string, bool) {
		p := strings.Trim(path, "/")
		var parts []string
		if p != "" {
			parts = strings.Split(p, "/")
		}
		for i, seg := range segs {
			if seg == "*" || seg == "+" {
				if i != len(segs)-1 {
					return "", false // mid-pattern wildcards aren't used by any manifest
				}
				rest := strings.Join(parts[min(i, len(parts)):], "/")
				if seg == "+" && rest == "" {
					return "", false
				}
				return rest, true
			}
			if i >= len(parts) {
				// Only a trailing optional param may be absent.
				if strings.HasPrefix(seg, ":") && strings.HasSuffix(seg, "?") && i == len(segs)-1 {
					return "", true
				}
				return "", false
			}
			if strings.HasPrefix(seg, ":") {
				continue
			}
			if seg != strings.ToLower(parts[i]) {
				return "", false
			}
		}
		return "", len(parts) == len(segs)
	}
}

// makeHandler returns a Fiber handler that proxies a public request to the
// given extension slug's gRPC plugin.
//
// With passthrough set the handler never calls c.Next() itself: when the
// plugin declines (PassthroughHeader), is gone, or errors, it flags the
// request as declined and returns so dispatch can try the next route. A
// failing plugin therefore never turns a public page into a 502.
func (pp *PublicExtensionProxy) makeHandler(slug, routePath string, passthrough bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		decline := func() error {
			if passthrough {
				c.Locals(publicRouteDeclinedKey, true)
				return nil
			}
			return c.Next()
		}
		if pp.pluginMgr == nil {
			return decline()
		}
		client := pp.pluginMgr.GetClient(slug)
		if client == nil {
			// Plugin stopped between dispatch and here: let the next
			// route — a fallback or the page router — answer.
			return decline()
		}

		// Build headers map. Same stripping as the admin proxy (credentials, spoofable IP
		// headers, client-supplied X-User-*); see pluginRequestHeaders.
		headers := pluginRequestHeaders(c)
		// Cookies are stripped, except the ones this extension declared in
		// public_route_cookies (guarded: own prefix, never the session).
		if names := pp.pluginMgr.PublicRouteCookies(slug); len(names) > 0 {
			var parts []string
			for _, n := range names {
				if v := c.Cookies(n); v != "" {
					parts = append(parts, n+"="+v)
				}
			}
			if len(parts) > 0 {
				headers["Cookie"] = strings.Join(parts, "; ")
			}
		}

		// Build query params.
		queryParams := make(map[string]string)
		c.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
			queryParams[string(key)] = string(value)
		})

		// Path params.
		pathParams := make(map[string]string)
		wildcard, _ := c.Locals(publicRouteWildcardKey).(string)
		if wildcard != "" {
			pathParams["path"] = wildcard
		}

		// Use the full request path as-is for the plugin.
		req := &pb.PluginHTTPRequest{
			Method:      c.Method(),
			Path:        c.Path(),
			Headers:     headers,
			Body:        c.Body(),
			QueryParams: queryParams,
			PathParams:  pathParams,
			UserId:      0, // no auth on public routes
		}

		timeout := vibeplugin.HTTPCallTimeout
		if passthrough {
			timeout = passthroughTimeout
		}
		ctx, cancel := context.WithTimeout(c.UserContext(), timeout)
		defer cancel()
		resp, err := client.HandleHTTPRequestCtx(ctx, req)
		if err != nil {
			log.Printf("[public-proxy] gRPC error from %s: %v", slug, err)
			if passthrough {
				return decline()
			}
			return c.SendStatus(fiber.StatusBadGateway)
		}
		if passthrough && pluginDeclined(resp.Headers) {
			return decline()
		}

		setPluginResponseHeaders(c, slug, resp.Headers)

		return c.Status(int(resp.StatusCode)).Send(resp.Body)
	}
}

// pluginDeclined reports whether a passthrough response carries a non-empty
// PassthroughHeader (header names are matched case-insensitively).
func pluginDeclined(headers map[string]string) bool {
	for k, v := range headers {
		if strings.EqualFold(strings.TrimSpace(k), PassthroughHeader) && strings.TrimSpace(v) != "" {
			return true
		}
	}
	return false
}
