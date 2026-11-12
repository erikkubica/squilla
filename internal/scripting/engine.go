package scripting

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"

	"squilla/internal/cms"
	"squilla/internal/coreapi"
	"squilla/internal/events"

	"github.com/d5/tengo/v2"
	"github.com/gofiber/fiber/v2"
)

// ScriptEngine manages the Tengo scripting runtime for themes.
// It loads theme.tengo as the entry script, provides API modules for
// CMS operations, and manages event handler and HTTP route registrations.
type ScriptEngine struct {
	eventBus *events.EventBus
	coreAPI  coreapi.CoreAPI

	// themeSettingsRegistry is the active-theme settings registry shared
	// with the cms package. Passed into BuildTengoModules so the
	// core/theme_settings Tengo module can read declared pages/fields.
	themeSettingsRegistry *cms.ThemeSettingsRegistry

	themeDir   string // path to active theme root
	scriptsDir string // themeDir + "/scripts"

	// loadMu serializes Load*/Unload* so two components never load (or
	// unload) at once. The registration scope itself is a per-load
	// *loadScope captured by the callbacks handed to the entry script,
	// never engine-wide state.
	loadMu sync.Mutex

	// busUnsubs holds the UnsubscribeFunc returned by every event-bus
	// Subscribe call we've made. Call them on Unload so reloads don't
	// multiply handlers — the historical bug was that subscribeEventHandlers
	// re-ran on every load and the bus had no way to drop the old ones.
	busUnsubs []events.UnsubscribeFunc

	// Registered handlers populated during theme.tengo execution
	mu             sync.RWMutex
	eventHandlers  map[string][]scriptHandler // event name -> handlers sorted by priority
	filterHandlers map[string][]scriptHandler // filter name -> handlers sorted by priority
	httpRoutes     []httpRoute
	wellKnown      []wellKnownRoute

	// activeBaseDirs tracks which scripts/ roots are currently "live"
	// (their owning extension or theme is active). Fiber doesn't support
	// runtime route unmounting, so deactivating an extension can't tear
	// down the routes it declared via routes.register — instead the
	// handler closure consults this set on every request and returns
	// 404 when the baseDir is no longer live. Same trick for
	// .well-known handlers.
	activeBaseDirs map[string]bool
}

// WellKnownRegistrar is satisfied by cms.WellKnownRegistry. Declared here
// to avoid a scripting → cms import cycle.
type WellKnownRegistrar interface {
	Register(path string, handler fiber.Handler)
}

// devMode reads SQUILLA_DEV_MODE and returns true when set to a truthy value
// (1, true, yes, on — case-insensitive). Exposed to seed scripts via
// `dev_mode` so themes can branch to overwrite-on-reseed in dev and stay
// idempotent skip-if-exists in production.
func devMode() bool {
	switch v := os.Getenv("SQUILLA_DEV_MODE"); v {
	case "1", "true", "TRUE", "True", "yes", "YES", "Yes", "on", "ON", "On":
		return true
	}
	return false
}

// NewScriptEngine creates a new ScriptEngine.
func NewScriptEngine(
	eventBus *events.EventBus,
	coreAPI coreapi.CoreAPI,
	themeSettingsRegistry *cms.ThemeSettingsRegistry,
) *ScriptEngine {
	return &ScriptEngine{
		eventBus:              eventBus,
		coreAPI:               coreAPI,
		themeSettingsRegistry: themeSettingsRegistry,
		eventHandlers:         make(map[string][]scriptHandler),
		filterHandlers:        make(map[string][]scriptHandler),
		activeBaseDirs:        make(map[string]bool),
	}
}

// isBaseDirActive reports whether scripts loaded from baseDir are still
// considered live. Used by HTTP and .well-known handlers to short-circuit
// requests that target a deactivated extension. Holds the read lock for
// the duration of the lookup; safe to call from any request goroutine.
func (e *ScriptEngine) isBaseDirActive(baseDir string) bool {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.activeBaseDirs[baseDir]
}

// loadScope is the registration scope of one LoadThemeScripts /
// LoadExtensionScripts call: every route, filter and event handler the
// entry script registers is stamped with this slug, scripts dir and
// capability set. It is closed when the entry script returns so a VM that
// outlived its deadline can't register later.
type loadScope struct {
	slug       string
	scriptsDir string
	caps       map[string]bool

	mu     sync.Mutex
	closed bool
}

func (s *loadScope) close() {
	s.mu.Lock()
	s.closed = true
	s.mu.Unlock()
}

func (s *loadScope) isClosed() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.closed
}

// scriptCallbacks returns the registration callbacks for one load scope.
// Handler scripts executed later (runScript) get nil callbacks instead, so
// they can't register anything.
func (e *ScriptEngine) scriptCallbacks(scope *loadScope) *coreapi.ScriptCallbacks {
	return &coreapi.ScriptCallbacks{
		OnEvent: func(name, scriptPath string, priority int) error {
			return e.eventsOn(scope, name, scriptPath, priority)
		},
		OnFilter: func(name, scriptPath string, priority int) error {
			return e.filtersAdd(scope, name, scriptPath, priority)
		},
		OnRoute: func(method, path, scriptPath string) error {
			return e.httpRegister(scope, method, path, scriptPath)
		},
		OnWellKnown: func(path, scriptPath string) error {
			return e.wellKnownRegister(scope, path, scriptPath)
		},
	}
}

// runEntryScript executes an entry script (theme.tengo / extension.tengo)
// under scope, then closes the scope.
func (e *ScriptEngine) runEntryScript(scope *loadScope, src []byte) error {
	defer scope.close()

	ctx, cancel := context.WithTimeout(context.Background(), scriptTimeout)
	defer cancel()

	script := tengo.NewScript(src)
	caller := coreapi.CallerInfo{Slug: scope.slug, Type: "tengo", Capabilities: scope.caps}
	script.SetImports(coreapi.BuildTengoModulesContext(ctx, e.coreAPI, caller, nil, scope.scriptsDir, e.scriptCallbacks(scope), e.themeSettingsRegistry))
	// Expose the dev-mode flag so seeds can branch to overwrite-on-reseed
	// instead of skip-if-exists. Production stays safe (false); operators
	// opt in via SQUILLA_DEV_MODE=true for autonomous AI dev/test loops.
	if err := script.Add("dev_mode", devMode()); err != nil {
		return fmt.Errorf("seeding dev_mode: %w", err)
	}
	script.SetMaxAllocs(scriptMaxAllocs)

	_, err := runWithDeadline(ctx, script)
	return err
}

// LoadThemeScripts loads and executes the theme's entry script (scripts/theme.tengo).
// This populates event handler and HTTP route registrations.
// Returns nil if no scripts directory or entry script exists (scripts are optional).
func (e *ScriptEngine) LoadThemeScripts(themeDir string) error {
	e.loadMu.Lock()
	defer e.loadMu.Unlock()

	scriptsDir := filepath.Join(themeDir, "scripts")
	e.mu.Lock()
	e.themeDir = themeDir
	e.scriptsDir = scriptsDir
	e.mu.Unlock()

	entryScript := filepath.Join(scriptsDir, "theme.tengo")

	// Check if scripts directory and entry script exist
	if _, err := os.Stat(entryScript); os.IsNotExist(err) {
		log.Printf("[script] no theme.tengo found at %s, scripting disabled", entryScript)
		return nil
	}

	src, err := readScriptSource(scriptsDir, "theme.tengo")
	if err != nil {
		return fmt.Errorf("reading theme.tengo: %w", err)
	}

	log.Printf("[script] loading theme scripts from %s", scriptsDir)

	// Themes are first-party, operator-installed code, but we still apply
	// defense-in-depth: themes get the standard "trusted theme" capability
	// set — read access to content/structure, write access for setup/seeding,
	// no raw data store access. The capability guard wired in main.go
	// enforces this against the CoreAPI.
	scope := &loadScope{slug: "theme", scriptsDir: scriptsDir, caps: defaultThemeCapabilities()}
	if err := e.runEntryScript(scope, src); err != nil {
		e.deactivateBaseDir(scriptsDir)
		return fmt.Errorf("executing theme.tengo: %w", err)
	}

	// Mark live, then wire event handlers to the EventBus.
	e.mu.Lock()
	e.activeBaseDirs[scriptsDir] = true
	e.mu.Unlock()
	e.subscribeEventHandlers()

	e.mu.RLock()
	numEvents := 0
	for _, handlers := range e.eventHandlers {
		numEvents += len(handlers)
	}
	numFilters := 0
	for _, handlers := range e.filterHandlers {
		numFilters += len(handlers)
	}
	numRoutes := len(e.httpRoutes)
	e.mu.RUnlock()

	log.Printf("[script] theme scripts loaded: %d event handlers, %d filters, %d HTTP routes", numEvents, numFilters, numRoutes)

	return nil
}

// MountHTTPRoutes registers all script-defined HTTP endpoints on the Fiber app.
// Must be called after LoadThemeScripts.
func (e *ScriptEngine) MountHTTPRoutes(app *fiber.App) {
	e.MountRoutes(app)
}

// runScript compiles and executes a Tengo script file with the given context variables.
// Script path is relative to the scripts/ directory (without .tengo extension).
// slug + capabilities define the caller that the CoreAPI capability guard
// will see — must be the slug/caps captured when the handler was registered.
// Handler scripts get no registration callbacks: routes.register,
// filters.add, events.on etc. return an error at runtime.
// renderCtx is the optional template render context (for cms/routing module); pass nil if not in a render.
// baseDir is the script directory for module resolution.
// Returns the value of the "response" variable after execution.
func (e *ScriptEngine) runScript(scriptPath, slug string, capabilities map[string]bool, baseDir string, vars map[string]interface{}, renderCtx interface{}) (interface{}, error) {
	scriptsDir := baseDir
	if scriptsDir == "" {
		e.mu.RLock()
		scriptsDir = e.scriptsDir
		e.mu.RUnlock()
	}

	rel, err := normalizeScriptPath(scriptPath)
	if err != nil {
		return nil, err
	}
	src, err := readScriptSource(scriptsDir, rel+".tengo")
	if err != nil {
		return nil, fmt.Errorf("script not found: %s: %w", scriptPath, err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), scriptTimeout)
	defer cancel()

	script := tengo.NewScript(src)
	caller := coreapi.CallerInfo{Slug: slug, Type: "tengo", Capabilities: capabilities}
	script.SetImports(coreapi.BuildTengoModulesContext(ctx, e.coreAPI, caller, renderCtx, scriptsDir, nil, e.themeSettingsRegistry))
	script.SetMaxAllocs(scriptMaxAllocs)

	// Inject context variables — convert to Tengo objects first to handle
	// types that Tengo's FromInterface can't auto-convert (e.g. map[string]string).
	for k, v := range vars {
		obj := goToTengo(normalizeForTengo(v))
		if err := script.Add(k, obj); err != nil {
			log.Printf("[script] warning: failed to inject variable %q: %v", k, err)
		}
	}

	// Add response placeholder
	_ = script.Add("response", nil)

	compiled, err := runWithDeadline(ctx, script)
	if err != nil {
		return nil, fmt.Errorf("script execution error (%s): %w", scriptPath, err)
	}

	// Read back the response variable
	respVar := compiled.Get("response")
	if respVar == nil {
		return nil, nil
	}

	obj := respVar.Object()
	if obj == nil || obj == tengo.UndefinedValue {
		return nil, nil
	}

	return tengoToGo(obj), nil
}

// LoadExtensionScripts loads and executes an extension's entry script (scripts/extension.tengo).
// This works like LoadThemeScripts but uses the extension's scripts/ directory for module resolution.
// capabilities is the set of permissions declared in the extension manifest.
// Returns nil if no scripts directory or entry script exists.
func (e *ScriptEngine) LoadExtensionScripts(extDir string, slug string, capabilities ...map[string]bool) error {
	e.loadMu.Lock()
	defer e.loadMu.Unlock()

	extScriptsDir := filepath.Join(extDir, "scripts")
	entryScript := filepath.Join(extScriptsDir, "extension.tengo")

	if _, err := os.Stat(entryScript); os.IsNotExist(err) {
		log.Printf("[script] no extension.tengo found for %s at %s", slug, entryScript)
		return nil
	}

	src, err := readScriptSource(extScriptsDir, "extension.tengo")
	if err != nil {
		return fmt.Errorf("reading extension.tengo for %s: %w", slug, err)
	}

	log.Printf("[script] loading extension scripts for %s from %s", slug, extScriptsDir)

	var caps map[string]bool
	if len(capabilities) > 0 {
		caps = capabilities[0]
	}

	scope := &loadScope{slug: slug, scriptsDir: extScriptsDir, caps: caps}
	if err := e.runEntryScript(scope, src); err != nil {
		e.deactivateBaseDir(extScriptsDir)
		return fmt.Errorf("executing extension.tengo for %s: %w", slug, err)
	}

	// Mark this baseDir live so the route-gating closure lets requests
	// through. Without this, routes registered via routes.register would
	// 404 immediately because the closure can't tell they're active.
	e.mu.Lock()
	e.activeBaseDirs[extScriptsDir] = true
	e.mu.Unlock()

	// Wire any new event handlers to the EventBus
	e.subscribeEventHandlers()

	log.Printf("[script] extension %s scripts loaded", slug)
	return nil
}

// deactivateBaseDir drops every event, filter, HTTP route and .well-known
// registration contributed from baseDir, marks it inactive, and rebuilds
// the event-bus subscriptions so unloaded handlers stop receiving events.
// Fiber doesn't support runtime route unmounting: mounted routes stay, but
// the makeHTTPHandler closure 404s once baseDir is inactive.
func (e *ScriptEngine) deactivateBaseDir(baseDir string) {
	e.mu.Lock()
	for name, handlers := range e.eventHandlers {
		filtered := make([]scriptHandler, 0, len(handlers))
		for _, h := range handlers {
			if h.baseDir != baseDir {
				filtered = append(filtered, h)
			}
		}
		e.eventHandlers[name] = filtered
	}
	for name, handlers := range e.filterHandlers {
		filtered := make([]scriptHandler, 0, len(handlers))
		for _, h := range handlers {
			if h.baseDir != baseDir {
				filtered = append(filtered, h)
			}
		}
		e.filterHandlers[name] = filtered
	}
	filteredRoutes := make([]httpRoute, 0, len(e.httpRoutes))
	for _, r := range e.httpRoutes {
		if r.baseDir != baseDir {
			filteredRoutes = append(filteredRoutes, r)
		}
	}
	e.httpRoutes = filteredRoutes
	filteredWellKnown := make([]wellKnownRoute, 0, len(e.wellKnown))
	for _, r := range e.wellKnown {
		if r.baseDir != baseDir {
			filteredWellKnown = append(filteredWellKnown, r)
		}
	}
	e.wellKnown = filteredWellKnown
	delete(e.activeBaseDirs, baseDir)
	e.mu.Unlock()

	e.subscribeEventHandlers()
}

// UnloadExtensionScripts removes all event, filter, HTTP route, and
// .well-known registrations contributed by an extension, drops its
// event-bus subscriptions, and marks its baseDir inactive (which is what
// disables already-mounted Fiber routes).
func (e *ScriptEngine) UnloadExtensionScripts(extDir string, slug string) {
	e.loadMu.Lock()
	defer e.loadMu.Unlock()

	e.deactivateBaseDir(filepath.Join(extDir, "scripts"))
	log.Printf("[script] extension %s scripts unloaded", slug)
}

// UnloadThemeScripts removes all event handlers, filter handlers, and HTTP
// routes that were registered by the currently loaded theme's theme.tengo.
// Call this before loading a new theme so stale handlers don't leak.
func (e *ScriptEngine) UnloadThemeScripts() {
	e.loadMu.Lock()
	defer e.loadMu.Unlock()

	e.mu.Lock()
	scriptsDir := e.scriptsDir
	e.themeDir = ""
	e.scriptsDir = ""
	e.mu.Unlock()
	if scriptsDir == "" {
		return
	}

	e.deactivateBaseDir(scriptsDir)
	log.Printf("[script] theme scripts unloaded")
}
