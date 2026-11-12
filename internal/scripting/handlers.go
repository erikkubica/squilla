package scripting

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"sort"
	"strings"

	"squilla/internal/events"
	"squilla/internal/httpobs"

	"github.com/gofiber/fiber/v2"
)

// scriptHandler is a registered event/filter handler with priority.
type scriptHandler struct {
	scriptPath   string
	priority     int
	baseDir      string // scripts directory for this handler (extension or theme)
	slug         string // owning extension/theme slug — passed to CoreAPI as caller
	capabilities map[string]bool
}

// httpRoute represents a registered script HTTP endpoint.
type httpRoute struct {
	method       string
	path         string
	scriptPath   string
	baseDir      string // scripts directory for this route (extension or theme)
	slug         string
	capabilities map[string]bool
}

// wellKnownRoute represents a script-backed /.well-known/* endpoint.
type wellKnownRoute struct {
	path         string // suffix after "/.well-known/", may end with "*"
	scriptPath   string
	baseDir      string
	slug         string
	capabilities map[string]bool
}

// ---------------------------------------------------------------------------
// Event handler registration (used during theme/extension script loading)
// ---------------------------------------------------------------------------

// Capability gate for the kernel's explicit-only request stream
// (internal/httpobs.Event).
const (
	httpObserveEvent      = "http.requests"
	httpObserveCapability = "http:observe"
)

// Registration capabilities (same names the CoreAPI capability guard uses).
const (
	capEventsSubscribe = "events:subscribe"
	capFiltersRegister = "filters:register"
	capRoutesRegister  = "routes:register"
)

// sensitiveEventCaps lists events whose payloads carry secrets (outgoing
// mail incl. reset links, raw reset tokens, client IPs/headers). On top of
// events:subscribe, subscribing needs the dedicated capability — the same
// names the gRPC plugin subscription gate uses.
var sensitiveEventCaps = map[string]string{
	httpObserveEvent:                httpObserveCapability,
	"email.send":                    "email:provide",
	"user.password_reset_requested": "auth:observe",
}

// checkRegistration validates a registration against its load scope:
// registration must happen during the load phase, the scope must hold
// capability cap, and scriptPath must stay inside the scripts dir.
// Returns the normalized script path. Denials are logged (the module also
// hands the error back to the script as an error value).
func (e *ScriptEngine) checkRegistration(scope *loadScope, what, cap, scriptPath string) (string, error) {
	if scope == nil || scope.isClosed() {
		return "", fmt.Errorf("%s: registration is only allowed while theme.tengo / extension.tengo loads", what)
	}
	if cap != "" && !scope.caps[cap] {
		log.Printf("[script] WARNING: %s: %s without capability %q — registration skipped", scope.slug, what, cap)
		return "", fmt.Errorf("%s: capability %q required (declare it in extension.json capabilities)", what, cap)
	}
	sp, err := normalizeScriptPath(scriptPath)
	if err != nil {
		log.Printf("[script] WARNING: %s: %s: %v — registration skipped", scope.slug, what, err)
		return "", fmt.Errorf("%s: %w", what, err)
	}
	return sp, nil
}

// eventsOn handles events.on / events.subscribe(name, script_path[, priority])
// from an entry script. Requires events:subscribe, plus the dedicated
// capability for sensitive events.
func (e *ScriptEngine) eventsOn(scope *loadScope, name, scriptPath string, priority int) error {
	if name == "" || scriptPath == "" {
		return fmt.Errorf("events.on: name and script_path required")
	}
	what := fmt.Sprintf("events.on(%q)", name)
	scriptPath, err := e.checkRegistration(scope, what, capEventsSubscribe, scriptPath)
	if err != nil {
		return err
	}
	if need, ok := sensitiveEventCaps[name]; ok && !scope.caps[need] {
		log.Printf("[script] WARNING: %s subscribes to %q without capability %q — handler skipped", scope.slug, name, need)
		return fmt.Errorf("%s: capability %q required (declare it in extension.json capabilities)", what, need)
	}

	handler := scriptHandler{
		scriptPath:   scriptPath,
		priority:     priority,
		baseDir:      scope.scriptsDir,
		slug:         scope.slug,
		capabilities: scope.caps,
	}

	e.mu.Lock()
	e.eventHandlers[name] = append(e.eventHandlers[name], handler)
	sort.SliceStable(e.eventHandlers[name], func(i, j int) bool {
		return e.eventHandlers[name][i].priority < e.eventHandlers[name][j].priority
	})
	e.mu.Unlock()

	log.Printf("[script] registered event: %s -> %s (priority %d)", name, scriptPath, priority)
	return nil
}

// ---------------------------------------------------------------------------
// Filter handler registration
// ---------------------------------------------------------------------------

// filtersAdd registers a filter handler script. Requires filters:register.
func (e *ScriptEngine) filtersAdd(scope *loadScope, name, scriptPath string, priority int) error {
	if name == "" || scriptPath == "" {
		return fmt.Errorf("filters.add: name and script_path required")
	}
	what := fmt.Sprintf("filters.add(%q)", name)
	scriptPath, err := e.checkRegistration(scope, what, capFiltersRegister, scriptPath)
	if err != nil {
		return err
	}

	// http.requests carries raw client IPs and headers; like gRPC plugins
	// (plugin_manager.subscriptionAllowed), scripts need http:observe.
	if name == httpObserveEvent && !scope.caps[httpObserveCapability] {
		log.Printf("[script] WARNING: %s subscribes to %q without capability %q — handler skipped", scope.slug, name, httpObserveCapability)
		return fmt.Errorf("%s: capability %q required", what, httpObserveCapability)
	}

	handler := scriptHandler{
		scriptPath:   scriptPath,
		priority:     priority,
		baseDir:      scope.scriptsDir,
		slug:         scope.slug,
		capabilities: scope.caps,
	}

	e.mu.Lock()
	e.filterHandlers[name] = append(e.filterHandlers[name], handler)
	sort.SliceStable(e.filterHandlers[name], func(i, j int) bool {
		return e.filterHandlers[name][i].priority < e.filterHandlers[name][j].priority
	})
	e.mu.Unlock()

	log.Printf("[script] registered filter: %s -> %s (priority %d)", name, scriptPath, priority)
	return nil
}

// ApplyFilter runs the filter chain for the named filter, passing the value
// through each registered filter script in priority order.
func (e *ScriptEngine) ApplyFilter(name string, value interface{}, renderCtx interface{}) interface{} {
	e.mu.RLock()
	handlers, ok := e.filterHandlers[name]
	if !ok || len(handlers) == 0 {
		e.mu.RUnlock()
		return value
	}
	sorted := make([]scriptHandler, len(handlers))
	copy(sorted, handlers)
	e.mu.RUnlock()

	currentValue := value
	for _, h := range sorted {
		vars := map[string]interface{}{
			"value": currentValue,
		}
		result, err := e.runScript(h.scriptPath, h.slug, h.capabilities, h.baseDir, vars, renderCtx)
		if err != nil {
			log.Printf("[script] filter error: %s (%s): %v", name, h.scriptPath, err)
			continue
		}
		if result != nil {
			currentValue = result
		}
	}
	return currentValue
}

// ---------------------------------------------------------------------------
// Event bus wiring
// ---------------------------------------------------------------------------

// subscribeEventHandlers wires registered event handlers to the Go EventBus.
// Drops any previous bus subscriptions first — without this, calling
// LoadThemeScripts twice in a row would double every handler invocation.
func (e *ScriptEngine) subscribeEventHandlers() {
	if e.eventBus == nil {
		return
	}

	e.dropBusSubs()

	e.mu.Lock()
	defer e.mu.Unlock()

	for name, handlers := range e.eventHandlers {
		for _, h := range handlers {
			n := name
			sp := h.scriptPath
			bd := h.baseDir
			slug := h.slug
			caps := h.capabilities
			unsub := e.eventBus.Subscribe(n, func(act string, payload events.Payload) {
				// A handler snapshot may outlive its component's unload.
				if !e.isBaseDirActive(bd) {
					return
				}
				payloadMap := make(map[string]interface{}, len(payload))
				for k, v := range payload {
					payloadMap[k] = v
				}
				vars := map[string]interface{}{
					"event": map[string]interface{}{
						"action":  act,
						"payload": payloadMap,
					},
				}
				if _, err := e.runScript(sp, slug, caps, bd, vars, nil); err != nil {
					log.Printf("[script] event handler error: %s (%s): %v", n, sp, err)
				}
			})
			e.busUnsubs = append(e.busUnsubs, unsub)

			// Request/reply side, so PublishRequest (CoreAPI.SendEmail's
			// "email.send") reaches Tengo handlers too — not only gRPC
			// plugins. The script answers through `response`:
			//   nil / unset          → not handled (events.ErrNotHandled)
			//   "error: <message>"   → request failed with <message>
			//   anything else        → handled successfully
			errUnsub := e.eventBus.SubscribeErr(n, func(act string, payload events.Payload) error {
				if !e.isBaseDirActive(bd) {
					return events.ErrNotHandled
				}
				payloadMap := make(map[string]interface{}, len(payload))
				for k, v := range payload {
					payloadMap[k] = v
				}
				vars := map[string]interface{}{
					"event": map[string]interface{}{
						"action":  act,
						"payload": payloadMap,
					},
				}
				result, err := e.runScript(sp, slug, caps, bd, vars, nil)
				if err != nil {
					return fmt.Errorf("%s: %w", slug, err)
				}
				return scriptRequestResult(slug, result)
			})
			e.busUnsubs = append(e.busUnsubs, errUnsub)
		}
	}
}

// scriptRequestResult maps a Tengo handler's `response` value onto the
// PublishRequest contract (see subscribeEventHandlers).
func scriptRequestResult(slug string, result interface{}) error {
	if result == nil {
		return events.ErrNotHandled
	}
	if s, ok := result.(string); ok && strings.HasPrefix(s, "error:") {
		return fmt.Errorf("%s: %s", slug, strings.TrimSpace(strings.TrimPrefix(s, "error:")))
	}
	return nil
}

// dropBusSubs releases every event-bus subscription previously installed
// by subscribeEventHandlers. Called automatically on each re-subscribe;
// public so theme/extension unload paths can call it explicitly too.
func (e *ScriptEngine) dropBusSubs() {
	e.mu.Lock()
	subs := e.busUnsubs
	e.busUnsubs = nil
	e.mu.Unlock()
	for _, u := range subs {
		if u != nil {
			u()
		}
	}
}

// RunEvent executes all script handlers registered for the named event
// (sorted by priority) plus any extension/plugin result handlers registered
// on the event bus, and returns concatenated HTML output.
//
// Tengo handlers run first, followed by plugin handlers via
// EventBus.PublishCollect. Plugins receive the ctx as their event payload
// when ctx is a map (e.g. dict from a template call); otherwise plugins
// receive an empty payload.
func (e *ScriptEngine) RunEvent(name string, ctx interface{}, args []interface{}) template.HTML {
	e.mu.RLock()
	handlers := e.eventHandlers[name]
	sorted := make([]scriptHandler, len(handlers))
	copy(sorted, handlers)
	e.mu.RUnlock()

	var sb strings.Builder

	// 1) Tengo script handlers (existing behavior).
	if len(sorted) > 0 {
		renderCtx := normalizeForTengo(ctx)
		var vars map[string]interface{}
		if len(args) > 0 {
			vars = map[string]interface{}{"args": args}
		}
		for _, h := range sorted {
			result, err := e.runScript(h.scriptPath, h.slug, h.capabilities, h.baseDir, vars, renderCtx)
			if err != nil {
				log.Printf("[script] event error: %s (%s): %v", name, h.scriptPath, err)
				continue
			}
			if result == nil {
				continue
			}
			if resp, ok := result.(map[string]interface{}); ok {
				if html, ok := resp["html"].(string); ok {
					sb.WriteString(html)
				}
			} else if s, ok := result.(string); ok {
				sb.WriteString(s)
			}
		}
	}

	// 2) Plugin result handlers via the event bus. Lets extensions return
	// rendered HTML to {{event "..."}} callers without per-block plumbing.
	if e.eventBus != nil {
		payload := eventPayloadFromCtx(ctx)
		for _, r := range e.eventBus.PublishCollect(name, payload) {
			sb.WriteString(r)
		}
	}

	return template.HTML(sb.String())
}

// eventPayloadFromCtx coerces a template event ctx into an events.Payload.
// Returns the underlying map when ctx is a map[string]interface{} (e.g. from
// {{dict "key" "value"}}); otherwise returns an empty payload.
func eventPayloadFromCtx(ctx interface{}) events.Payload {
	if ctx == nil {
		return events.Payload{}
	}
	if m, ok := ctx.(map[string]interface{}); ok {
		return events.Payload(m)
	}
	if m, ok := ctx.(events.Payload); ok {
		return m
	}
	return events.Payload{}
}

// ---------------------------------------------------------------------------
// HTTP route registration & mounting
// ---------------------------------------------------------------------------

// httpRegister registers an HTTP route from a script. Requires routes:register.
func (e *ScriptEngine) httpRegister(scope *loadScope, method, path, scriptPath string) error {
	if path == "" || scriptPath == "" {
		return fmt.Errorf("routes.register: path and script_path required")
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	scriptPath, err := e.checkRegistration(scope, fmt.Sprintf("routes.register(%s %s)", method, path), capRoutesRegister, scriptPath)
	if err != nil {
		return err
	}

	e.mu.Lock()
	e.httpRoutes = append(e.httpRoutes, httpRoute{
		method:       method,
		path:         path,
		scriptPath:   scriptPath,
		baseDir:      scope.scriptsDir,
		slug:         scope.slug,
		capabilities: scope.caps,
	})
	e.mu.Unlock()

	log.Printf("[script] registered HTTP route: %s /api/theme%s -> %s", method, path, scriptPath)
	return nil
}

// MountRoutes registers all script HTTP handlers on the Fiber app.
// Routes with paths starting with "/" are mounted at the top level (e.g., /sitemap.xml).
// Other routes are mounted under /api/theme (e.g., /api/theme/search).
func (e *ScriptEngine) MountRoutes(app *fiber.App) {
	e.mu.RLock()
	routes := make([]httpRoute, len(e.httpRoutes))
	copy(routes, e.httpRoutes)
	e.mu.RUnlock()

	if len(routes) == 0 {
		return
	}

	themeAPI := app.Group("/api/theme")
	var topLevel, apiLevel int

	for _, route := range routes {
		handler := e.makeHTTPHandler(route.scriptPath, route.slug, route.capabilities, route.baseDir)

		// Routes with paths like /sitemap.xml mount at the app root.
		// Routes with paths like /search mount under /api/theme.
		isTopLevel := strings.Contains(route.path, ".")
		var target fiber.Router
		if isTopLevel {
			target = app
			topLevel++
		} else {
			target = themeAPI
			apiLevel++
		}

		switch route.method {
		case "GET":
			target.Get(route.path, handler)
		case "POST":
			target.Post(route.path, handler)
		case "PUT":
			target.Put(route.path, handler)
		case "PATCH":
			target.Patch(route.path, handler)
		case "DELETE":
			target.Delete(route.path, handler)
		}
	}

	if topLevel > 0 {
		log.Printf("[script] mounted %d top-level HTTP routes", topLevel)
	}
	if apiLevel > 0 {
		log.Printf("[script] mounted %d HTTP routes under /api/theme", apiLevel)
	}
}

// wellKnownRegister records a .well-known handler from a Tengo script.
// .well-known handlers are routes, so this requires routes:register.
func (e *ScriptEngine) wellKnownRegister(scope *loadScope, path, scriptPath string) error {
	if path == "" || scriptPath == "" {
		return fmt.Errorf("wellknown.register: path and script_path required")
	}
	scriptPath, err := e.checkRegistration(scope, fmt.Sprintf("wellknown.register(%q)", path), capRoutesRegister, scriptPath)
	if err != nil {
		return err
	}
	e.mu.Lock()
	e.wellKnown = append(e.wellKnown, wellKnownRoute{
		path:         path,
		scriptPath:   scriptPath,
		baseDir:      scope.scriptsDir,
		slug:         scope.slug,
		capabilities: scope.caps,
	})
	e.mu.Unlock()
	log.Printf("[script] registered well-known: /.well-known/%s -> %s", path, scriptPath)
	return nil
}

// MountWellKnown registers all script-defined .well-known handlers on the
// provided registry. Call after script loading and before the server starts.
func (e *ScriptEngine) MountWellKnown(reg WellKnownRegistrar) {
	if reg == nil {
		return
	}
	e.mu.RLock()
	routes := make([]wellKnownRoute, len(e.wellKnown))
	copy(routes, e.wellKnown)
	e.mu.RUnlock()

	for _, r := range routes {
		reg.Register(r.path, e.makeHTTPHandler(r.scriptPath, r.slug, r.capabilities, r.baseDir))
	}
	if len(routes) > 0 {
		log.Printf("[script] mounted %d .well-known handlers", len(routes))
	}
}

// makeHTTPHandler creates a Fiber handler that runs a Tengo script.
// slug + capabilities are the caller info recorded when the route was
// registered — they tell the CoreAPI capability guard who is making
// requests during this script's execution.
//
// The closure consults the engine's active-baseDir set on every request
// so deactivating an extension actually disables its routes. Fiber
// doesn't support runtime route unmounting, so this gate is the
// mechanism that makes hot-deactivate stop responses cold instead of
// silently leaking the handler.
func (e *ScriptEngine) makeHTTPHandler(scriptPath, slug string, capabilities map[string]bool, baseDir string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !e.isBaseDirActive(baseDir) {
			return c.Status(fiber.StatusNotFound).SendString("not found")
		}
		query := make(map[string]interface{})
		c.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
			query[string(key)] = string(value)
		})

		params := make(map[string]interface{})
		for _, param := range c.Route().Params {
			params[param] = c.Params(param)
		}

		// Script routes are same-origin with /admin: never hand them the
		// caller's session cookie, credentials or CSRF token.
		headers := make(map[string]interface{})
		c.Request().Header.VisitAll(func(key, value []byte) {
			k := string(key)
			if isCredentialHeader(k) {
				return
			}
			headers[k] = string(value)
		})

		if len(c.Body()) > maxRouteBodyLen {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "request body too large"})
		}

		var body interface{}
		if c.Method() != "GET" && c.Method() != "DELETE" {
			contentType := string(c.Request().Header.ContentType())
			if strings.Contains(contentType, "application/json") {
				var jsonBody interface{}
				if err := json.Unmarshal(c.Body(), &jsonBody); err == nil {
					body = jsonBody
				}
			} else {
				body = string(c.Body())
			}
		}

		reqMap := map[string]interface{}{
			"method":  c.Method(),
			"path":    c.Path(),
			"query":   query,
			"params":  params,
			"headers": headers,
			"body":    body,
			"ip":      httpobs.ClientIP(c),
		}

		vars := map[string]interface{}{
			"request": reqMap,
		}

		result, err := e.runScript(scriptPath, slug, capabilities, baseDir, vars, nil)
		if err != nil {
			log.Printf("[script] HTTP handler error: %s: %v", scriptPath, err)
			return c.Status(500).JSON(fiber.Map{"error": "script execution error"})
		}

		if resp, ok := result.(map[string]interface{}); ok {
			status := 200
			if s, ok := resp["status"]; ok {
				switch v := s.(type) {
				case int64:
					status = int(v)
				case int:
					status = v
				}
			}
			if status < 100 || status > 599 {
				log.Printf("[script] HTTP handler %s returned invalid status %d — sending 500", scriptPath, status)
				status = fiber.StatusInternalServerError
			}

			if h, ok := resp["headers"].(map[string]interface{}); ok {
				for k, v := range h {
					val := fmt.Sprintf("%v", v)
					if !scriptResponseHeaderAllowed(k, val) {
						log.Printf("[script] HTTP handler %s: response header %q refused", scriptPath, k)
						continue
					}
					c.Set(k, val)
				}
			}

			if ct, ok := resp["content_type"].(string); ok && ct != "" && !strings.ContainsAny(ct, "\r\n") {
				c.Set("Content-Type", ct)
			}

			if body, ok := resp["body"]; ok {
				if bodyStr, ok := body.(string); ok {
					return c.Status(status).SendString(bodyStr)
				}
				return c.Status(status).JSON(body)
			}
			if html, ok := resp["html"].(string); ok {
				c.Set("Content-Type", "text/html")
				return c.Status(status).SendString(html)
			}
			if text, ok := resp["text"].(string); ok {
				c.Set("Content-Type", "text/plain")
				return c.Status(status).SendString(text)
			}

			return c.Status(status).JSON(resp)
		}

		if result != nil {
			return c.JSON(result)
		}

		return c.Status(204).SendString("")
	}
}

// isCredentialHeader reports request headers stripped before a script
// route sees the request: session cookies, credentials and CSRF tokens.
func isCredentialHeader(name string) bool {
	n := strings.ToLower(name)
	switch n {
	case "cookie", "authorization", "proxy-authorization", "x-xsrf-token":
		return true
	}
	return strings.HasPrefix(n, "x-csrf-")
}

// refusedResponseHeaders may not be set by script routes: Set-Cookie
// (scripts are same-origin with /admin and could plant/overwrite session
// cookies), hop-by-hop headers and framing headers the server owns.
var refusedResponseHeaders = map[string]bool{
	"set-cookie":          true,
	"connection":          true,
	"keep-alive":          true,
	"proxy-authenticate":  true,
	"proxy-authorization": true,
	"proxy-connection":    true,
	"te":                  true,
	"trailer":             true,
	"transfer-encoding":   true,
	"upgrade":             true,
	"content-length":      true,
}

// scriptResponseHeaderAllowed reports whether a script route may set the
// response header name: value.
func scriptResponseHeaderAllowed(name, value string) bool {
	if name == "" || strings.ContainsAny(name, "\r\n: ") || strings.ContainsAny(value, "\r\n") {
		return false
	}
	return !refusedResponseHeaders[strings.ToLower(name)]
}
