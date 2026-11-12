package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"

	goplugin "github.com/hashicorp/go-plugin"

	"squilla/internal/events"

	"google.golang.org/grpc"
	"gorm.io/gorm"
)

// HostServerRegistrar is a function that registers the SquillaHost
// gRPC service on a grpc.Server for a given extension slug with its
// capabilities, owned-tables and owned-functions lists. owned-tables
// is consumed by the coreapi capability guard's data:* gate,
// owned-functions by the DataCall gate; capabilities feeds the generic
// checkCapability path. This signature is the trust boundary
// — anything passed here ends up in CallerInfo for every CoreAPI
// call from the plugin.
//
// The struct-shaped factory avoids the import cycle between cms and
// coreapi while keeping the wiring readable.
type HostServerRegistrar func(slug string, capabilities map[string]bool, ownedTables map[string]bool, ownedFunctions map[string]bool) func(s *grpc.Server)

// observeCapability gates subscriptions to observeEvent. The event
// carries raw client IPs, user agents and request headers for every
// HTTP request, so only extensions that explicitly declare the
// capability may receive it.
const (
	observeEvent      = "http.requests"
	observeCapability = "http:observe"
)

// PluginManifestEntry represents a single plugin binary in an extension manifest.
type PluginManifestEntry struct {
	Binary string   `json:"binary"`
	Events []string `json:"events"`
}

// runningPlugin tracks a running plugin process and its client.
type runningPlugin struct {
	slug       string
	binary     string
	client     *goplugin.Client
	impl       vibeplugin.ExtensionPlugin
	eventNames []string
	provides   []string      // manifest's `provides` array — used by GetProvider lookups
	priority   int           // manifest's `priority` (default 50, higher wins)
	stopped    chan struct{} // closed when plugin is stopped; handlers check this before RPC
	stopOnce   sync.Once
	// transformer marks a render.transform subscriber; skipUntil (unix
	// nanos) pauses it after it answered "inactive".
	transformer bool
	skipUntil   atomic.Int64
	// unsubs removes every event-bus subscription registered for this
	// plugin. Called on stop so a restarted/deactivated extension
	// doesn't leave stale handlers multiplying on the bus.
	unsubs []events.UnsubscribeFunc
}

// PluginManager manages the lifecycle of gRPC plugin processes.
type PluginManager struct {
	mu            sync.RWMutex
	plugins       map[string][]*runningPlugin // extension slug -> running plugins
	eventBus      *events.EventBus
	hostRegistrar HostServerRegistrar
	// db is used by verifyPluginBinary to check operator-pinned
	// SHA-256 digests. May be nil — pin checks are then skipped, which
	// preserves test/bootstrap behaviour without changing semantics.
	db *gorm.DB
	// Cookies an extension declared in its manifest (guarded by
	// ownedCookieSet): observeCookies reach http.requests records,
	// routeCookies are forwarded to that extension's public routes.
	observeCookies map[string][]string
	routeCookies   map[string][]string
	onCookies      func([]string)
	// spawn starts a plugin process; nil means spawnPluginProcess.
	// Overridden in tests.
	spawn func(binaryPath string) (*goplugin.Client, vibeplugin.ExtensionPlugin, error)
}

// NewPluginManager creates a new PluginManager.
// hostRegistrar may be nil if no CoreAPI is available (plugins won't get host callbacks).
// db may be nil when running without persistence (tests); when set, the
// manager refuses to spawn binaries whose SHA-256 doesn't match the
// site_settings-pinned value.
func NewPluginManager(eventBus *events.EventBus, hostRegistrar HostServerRegistrar, db *gorm.DB) *PluginManager {
	return &PluginManager{
		observeCookies: map[string][]string{},
		routeCookies:   map[string][]string{},
		plugins:        make(map[string][]*runningPlugin),
		eventBus:       eventBus,
		hostRegistrar:  hostRegistrar,
		db:             db,
	}
}

// StartPlugins starts all plugin binaries declared in an extension's manifest.
// capabilities is the set of permissions declared in the extension
// manifest; ownedTables is the set of database tables this extension
// is allowed to touch through the Data* CoreAPI methods (default
// deny). Both flow into the per-extension CallerInfo when the host
// gRPC service is registered.
//
// Process spawn, Initialize and GetSubscriptions run WITHOUT pm.mu held:
// they can take seconds (or hang until their deadline), and holding the
// lock would block every GetClient / proxy request / render.transform
// lookup for every extension meanwhile. The lock is taken only to swap
// the slug's map entry.
func (pm *PluginManager) StartPlugins(extPath string, slug string, manifest json.RawMessage, capabilities map[string]bool, ownedTables map[string]bool) error {
	// Parse plugins from manifest. `provides` and `priority` feed the
	// provider-lookup helpers (GetProvider) so coreapi callers can ask
	// "who handles 'media-provider'?" without knowing slug names.
	var m struct {
		Plugins            []PluginManifestEntry `json:"plugins"`
		Provides           []string              `json:"provides"`
		Priority           int                   `json:"priority"`
		DataOwnedFunctions []string              `json:"data_owned_functions"`
		ObserveCookies     []string              `json:"observe_cookies"`
		PublicRouteCookies []string              `json:"public_route_cookies"`
	}
	if err := json.Unmarshal(manifest, &m); err != nil {
		return fmt.Errorf("parsing manifest plugins: %w", err)
	}
	if m.Priority == 0 {
		m.Priority = 50 // matches the default convention used in extension manifests
	}

	if len(m.Plugins) == 0 {
		return nil // No plugins to start
	}

	// Stop any existing plugins for this extension first.
	pm.StopPlugins(slug)

	ownedFns := ownedFunctionSet(slug, m.DataOwnedFunctions)
	var started []*runningPlugin
	for _, pe := range m.Plugins {
		if rp := pm.startPlugin(extPath, slug, pe, m.Provides, m.Priority, capabilities, ownedTables, ownedFns); rp != nil {
			started = append(started, rp)
		}
	}

	pm.mu.Lock()
	// A concurrent StartPlugins for the same slug may have swapped in its
	// own set while we were spawning; replace it and stop it below.
	previous := pm.plugins[slug]
	if len(started) > 0 {
		pm.plugins[slug] = started
	} else {
		delete(pm.plugins, slug)
	}
	pm.observeCookies[slug] = ownedCookieSet(slug, "observe_cookies", m.ObserveCookies)
	pm.routeCookies[slug] = ownedCookieSet(slug, "public_route_cookies", m.PublicRouteCookies)
	pm.notifyCookiesLocked()
	pm.mu.Unlock()

	shutdownPlugins(previous)
	return nil
}

// startPlugin spawns, initializes and subscribes one plugin binary.
// Returns nil (after logging) when the plugin can't be started.
func (pm *PluginManager) startPlugin(extPath, slug string, pe PluginManifestEntry, provides []string, priority int, capabilities, ownedTables, ownedFns map[string]bool) *runningPlugin {
	// The binary must be a regular file inside the extension directory —
	// a manifest naming "../../usr/bin/x", or a symlink to one, would
	// otherwise exec an arbitrary host binary with CoreAPI access.
	binaryPath, err := confinedFile(extPath, pe.Binary)
	if err != nil {
		if os.IsNotExist(err) {
			log.Printf("[plugins] binary not found for %s: %s", slug, filepath.Join(extPath, pe.Binary))
		} else {
			log.Printf("[plugins] REFUSING to start %s/%s: %v", slug, pe.Binary, err)
		}
		return nil
	}

	// Verify SHA-256 against operator-pinned digest in site_settings.
	// Refusing to spawn on mismatch is the line of defense against an
	// attacker who replaced bin/<plugin> — the binary is native code
	// running as the app user, so a swapped binary is host compromise.
	// Unpinned binaries load unless SQUILLA_REQUIRE_PLUGIN_PINS=true.
	if err := verifyPluginBinary(pm.db, slug, pe.Binary, binaryPath); err != nil {
		log.Printf("[plugins] REFUSING to start %s/%s: %v", slug, pe.Binary, err)
		return nil
	}

	spawn := pm.spawn
	if spawn == nil {
		spawn = spawnPluginProcess
	}
	client, impl, err := spawn(binaryPath)
	if err != nil {
		log.Printf("[plugins] failed to start plugin %s/%s: %v", slug, pe.Binary, err)
		return nil
	}

	// Initialize: start gRPC host service so plugin can call back into Squilla.
	if pm.hostRegistrar != nil {
		if grpcClient, ok := impl.(*vibeplugin.GRPCClient); ok {
			registerFn := pm.hostRegistrar(slug, capabilities, ownedTables, ownedFns)
			if initErr := grpcClient.InitializeHost(registerFn); initErr != nil {
				log.Printf("[plugins] failed to initialize host service for %s/%s: %v", slug, pe.Binary, initErr)
				client.Kill()
				return nil
			}
		}
	}

	// Get subscriptions from the plugin
	subs, err := impl.GetSubscriptions()
	if err != nil {
		log.Printf("[plugins] failed to get subscriptions from %s/%s: %v", slug, pe.Binary, err)
		client.Kill()
		return nil
	}

	rp := &runningPlugin{
		slug:     slug,
		binary:   pe.Binary,
		client:   client,
		impl:     impl,
		provides: append([]string(nil), provides...),
		priority: priority,
		stopped:  make(chan struct{}),
	}
	pm.subscribePlugin(rp, subs, capabilities)
	log.Printf("[plugins] started %s/%s with %d subscriptions", slug, pe.Binary, len(rp.eventNames))
	return rp
}

// subscribePlugin wires a plugin's declared subscriptions onto the bus,
// applying the capability gates (subscriptionAllowed).
//
// The plugin manager wires three dispatch flavours per declared event so
// the kernel side can pick whichever Publish* method makes sense at the
// call site without each plugin needing to declare separate subscriptions:
//   - Subscribe        — fire-and-forget, errors logged only
//   - SubscribeResult  — sync request/reply for {{event}} templates
//   - SubscribeErr     — sync request with error propagation back
//     to the kernel caller (CoreAPI.SendEmail)
//
// The wildcard subscription ("*") routes via SubscribeAll so an extension
// that owns a cross-cutting concern (e.g. email-manager matching arbitrary
// admin-defined rules to any system event) can receive every event without
// enumerating them in the manifest. It requires events:subscribe_all, and
// sensitive events are filtered per delivery (eventDeliverable).
func (pm *PluginManager) subscribePlugin(rp *runningPlugin, subs []*pb.Subscription, capabilities map[string]bool) {
	slug, binary, pluginImpl := rp.slug, rp.binary, rp.impl

	// dispatchEvent invokes the plugin's HandleEvent over gRPC.
	// Returns ("", nil) when the plugin was already stopped —
	// callers treat that as no-op rather than an error so a
	// shutting-down extension doesn't taint kernel publish paths.
	dispatchEvent := func(action string, payload events.Payload) (handled bool, result []byte, errStr string, callErr error) {
		select {
		case <-rp.stopped:
			return false, nil, "", nil
		default:
		}
		payloadBytes, err := json.Marshal(payload)
		if err != nil {
			return false, nil, "", fmt.Errorf("marshal payload: %w", err)
		}
		resp, err := pluginImpl.HandleEvent(action, payloadBytes)
		if err != nil {
			return false, nil, "", err
		}
		return resp.Handled, resp.Result, resp.Error, nil
	}
	logResult := func(action, errStr string, callErr error) {
		if callErr != nil {
			log.Printf("[plugins] error from %s/%s handling %s: %v", slug, binary, action, callErr)
			return
		}
		if errStr != "" {
			log.Printf("[plugins] %s/%s reported error for %s: %s", slug, binary, action, errStr)
		}
	}

	for _, sub := range subs {
		eventName := sub.EventName
		if ok, missing := subscriptionAllowed(eventName, capabilities); !ok {
			log.Printf("[plugins] WARNING: %s/%s subscribes to %q without declaring capability %q — subscription skipped", slug, binary, eventName, missing)
			continue
		}
		rp.eventNames = append(rp.eventNames, eventName)
		if eventName == transformEvent {
			// Served only by TransformHTML (an ordered chain with its own
			// deadline), never by the event bus.
			rp.transformer = true
			continue
		}

		if eventName == "*" {
			// Wildcard fan-out via SubscribeAll. Result/Err variants
			// are skipped because PublishCollect / PublishRequest
			// dispatch on action-specific maps; subscribing the
			// wildcard there would require a separate "all" surface
			// the kernel doesn't currently need.
			rp.unsubs = append(rp.unsubs, pm.eventBus.SubscribeAll(func(action string, payload events.Payload) {
				// Filter at delivery: a wildcard subscriber must not see
				// password-reset tokens or outgoing mail unless it holds
				// the event's dedicated capability.
				if !eventDeliverable(action, capabilities) {
					return
				}
				_, _, errStr, callErr := dispatchEvent(action, payload)
				logResult(action, errStr, callErr)
			}))
			continue
		}

		rp.unsubs = append(rp.unsubs, pm.eventBus.Subscribe(eventName, func(action string, payload events.Payload) {
			_, _, errStr, callErr := dispatchEvent(action, payload)
			logResult(action, errStr, callErr)
		}))

		// Explicit-only events are delivered solely through
		// PublishExplicitSync → Subscribe handlers. Registering the
		// Result/Err variants would let anyone who can reach
		// PublishCollect/PublishRequest (a theme template's
		// {{event "http.requests"}}, a Tengo events.run) feed forged
		// payloads to the observer plugin.
		if explicitOnlyEvent(eventName) {
			continue
		}

		rp.unsubs = append(rp.unsubs, pm.eventBus.SubscribeResult(eventName, func(action string, payload events.Payload) string {
			handled, result, errStr, callErr := dispatchEvent(action, payload)
			if callErr != nil || errStr != "" {
				logResult(action, errStr, callErr)
				return ""
			}
			if !handled {
				return ""
			}
			return string(result)
		}))

		// SubscribeErr lets the kernel surface a plugin-reported
		// error (resp.Error) back through PublishRequest. Used by
		// CoreAPI.SendEmail so an SMTP refusal propagates to the
		// HTTP caller instead of being swallowed in a log line.
		rp.unsubs = append(rp.unsubs, pm.eventBus.SubscribeErr(eventName, func(action string, payload events.Payload) error {
			handled, _, errStr, callErr := dispatchEvent(action, payload)
			if callErr != nil {
				return callErr
			}
			if errStr != "" {
				return fmt.Errorf("%s: %s", slug, errStr)
			}
			if !handled {
				return events.ErrNotHandled
			}
			return nil
		}))
	}
}

// pluginShutdownTimeout bounds the graceful Shutdown RPC before the
// process is killed regardless.
var pluginShutdownTimeout = 10 * time.Second

// StopPlugins stops all plugin processes for an extension. The map entry
// (and its cookie declarations) is removed under the lock; the Shutdown
// RPC and process kill happen after unlocking so a hung plugin can't
// block every other extension.
func (pm *PluginManager) StopPlugins(slug string) {
	pm.mu.Lock()
	plugins := pm.detachLocked(slug)
	pm.mu.Unlock()
	shutdownPlugins(plugins)
}

// detachLocked removes slug's plugins and cookie declarations from the
// manager and returns the plugins for shutdownPlugins. Caller holds pm.mu.
func (pm *PluginManager) detachLocked(slug string) []*runningPlugin {
	plugins := pm.plugins[slug]
	delete(pm.plugins, slug)
	_, hadObserve := pm.observeCookies[slug]
	delete(pm.observeCookies, slug)
	delete(pm.routeCookies, slug)
	if hadObserve {
		pm.notifyCookiesLocked()
	}
	return plugins
}

// shutdownPlugins unsubscribes, asks each plugin to shut down (bounded by
// pluginShutdownTimeout) and kills its process. Must be called without
// pm.mu held.
func shutdownPlugins(plugins []*runningPlugin) {
	for _, rp := range plugins {
		log.Printf("[plugins] stopping %s/%s", rp.slug, rp.binary)
		rp.stopOnce.Do(func() { close(rp.stopped) }) // signal event handlers to stop calling this plugin
		for _, unsub := range rp.unsubs {
			unsub()
		}
		rp.unsubs = nil
		done := make(chan struct{})
		impl := rp.impl
		go func() {
			defer close(done)
			_ = impl.Shutdown()
		}()
		select {
		case <-done:
		case <-time.After(pluginShutdownTimeout):
			log.Printf("[plugins] %s/%s did not shut down within %s — killing", rp.slug, rp.binary, pluginShutdownTimeout)
		}
		if rp.client != nil {
			rp.client.Kill()
		}
	}
}

// StopAll stops all running plugins (for graceful shutdown).
func (pm *PluginManager) StopAll() {
	pm.mu.Lock()
	var all []*runningPlugin
	for slug := range pm.plugins {
		all = append(all, pm.detachLocked(slug)...)
	}
	pm.mu.Unlock()
	shutdownPlugins(all)
}

// GetClient returns the first active GRPCClient for the given extension slug,
// or nil if no plugin is running for that slug. A plugin whose process has
// exited counts as not running.
func (pm *PluginManager) GetClient(slug string) *vibeplugin.GRPCClient {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	plugins, exists := pm.plugins[slug]
	if !exists || len(plugins) == 0 {
		return nil
	}

	// Return the first plugin's impl cast to GRPCClient.
	if plugins[0].client != nil && plugins[0].client.Exited() {
		return nil
	}
	if client, ok := plugins[0].impl.(*vibeplugin.GRPCClient); ok {
		return client
	}
	return nil
}

// GetProvider returns the highest-priority running plugin whose manifest
// declares the given tag in its `provides` array, or nil when no
// extension is providing it. Used by CoreAPI to resolve which extension
// owns a feature class (e.g. "media-provider", "search-provider") so
// operators can swap in a custom implementation by activating their own
// extension with a higher priority.
//
// The result intentionally exposes the GRPCClient so callers can speak
// HTTP to the plugin via HandleHTTPRequest — the same path the admin UI
// uses, which keeps the request shape consistent (validation,
// optimisation, etc. all run identically regardless of caller).
func (pm *PluginManager) GetProvider(tag string) *vibeplugin.GRPCClient {
	if tag == "" {
		return nil
	}
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	var best *runningPlugin
	for _, plugins := range pm.plugins {
		for _, rp := range plugins {
			if !pluginProvides(rp.provides, tag) {
				continue
			}
			if best == nil || rp.priority > best.priority {
				best = rp
			}
		}
	}
	if best == nil {
		return nil
	}
	if client, ok := best.impl.(*vibeplugin.GRPCClient); ok {
		return client
	}
	return nil
}

// HasProvider returns true if any active extension declares the given tag.
// Cheap probe used by callers that want to short-circuit with a clear
// "no provider configured" message (CoreAPI media methods do this).
func (pm *PluginManager) HasProvider(tag string) bool {
	return pm.GetProvider(tag) != nil
}

// Event-subscription capabilities. Every plugin subscription needs
// events:subscribe; the wildcard additionally needs events:subscribe_all;
// events that carry secrets need their own capability — even through the
// wildcard (see eventDeliverable). Tengo scripts use the same names.
const (
	subscribeCapability    = "events:subscribe"
	subscribeAllCapability = "events:subscribe_all"
)

// sensitiveEventCapabilities maps events whose payload carries secrets to
// the dedicated capability required to receive them:
//   - email.send carries the full outgoing message (and is what provider
//     plugins answer) → email:provide
//   - user.password_reset_requested carries reset_token / reset_url →
//     auth:observe
var sensitiveEventCapabilities = map[string]string{
	"email.send":                    "email:provide",
	"user.password_reset_requested": "auth:observe",
}

// subscriptionAllowed applies capability gates to event subscriptions.
// It returns false plus the missing capability when the subscription
// must be skipped.
func subscriptionAllowed(eventName string, capabilities map[string]bool) (bool, string) {
	if !capabilities[subscribeCapability] {
		return false, subscribeCapability
	}
	switch eventName {
	case "*":
		if !capabilities[subscribeAllCapability] {
			return false, subscribeAllCapability
		}
	case observeEvent:
		if !capabilities[observeCapability] {
			return false, observeCapability
		}
	case transformEvent:
		if !capabilities[transformCapability] {
			return false, transformCapability
		}
	}
	if c, ok := sensitiveEventCapabilities[eventName]; ok && !capabilities[c] {
		return false, c
	}
	return true, ""
}

// eventDeliverable reports whether a wildcard subscriber holding
// capabilities may receive action.
func eventDeliverable(action string, capabilities map[string]bool) bool {
	c, ok := sensitiveEventCapabilities[action]
	return !ok || capabilities[c]
}

// explicitOnlyEvent reports events that must only ever be delivered via
// EventBus.PublishExplicitSync (no Result/Err dispatch flavours).
func explicitOnlyEvent(eventName string) bool {
	return eventName == observeEvent || eventName == transformEvent
}

// stringSet converts a manifest string list into a lookup map. Always
// returns a non-nil map so "declared nothing" means "allowed nothing".
func stringSet(list []string) map[string]bool {
	set := make(map[string]bool, len(list))
	for _, v := range list {
		set[v] = true
	}
	return set
}

// ownedFunctionSet returns the manifest's data_owned_functions that carry
// the extension's own prefix (slug with '-' → '_', plus '_'). Declaring a
// function is otherwise unverifiable, so the prefix is what stops one
// extension from claiming another extension's (or a built-in) function.
func ownedFunctionSet(slug string, fns []string) map[string]bool {
	prefix := strings.ReplaceAll(slug, "-", "_") + "_"
	set := make(map[string]bool, len(fns))
	for _, fn := range fns {
		if !strings.HasPrefix(fn, prefix) {
			log.Printf("[plugins] %s: ignoring data_owned_functions entry %q (must start with %q)", slug, fn, prefix)
			continue
		}
		set[fn] = true
	}
	return set
}

func pluginProvides(provides []string, tag string) bool {
	for _, p := range provides {
		if p == tag {
			return true
		}
	}
	return false
}

// RunningCount returns the number of running plugin processes.
func (pm *PluginManager) RunningCount() int {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	count := 0
	for _, plugins := range pm.plugins {
		count += len(plugins)
	}
	return count
}

// SetCookieObserver registers the callback that receives the union of
// every extension's observe_cookies whenever it changes.
func (pm *PluginManager) SetCookieObserver(fn func([]string)) {
	pm.mu.Lock()
	pm.onCookies = fn
	pm.notifyCookiesLocked()
	pm.mu.Unlock()
}

func (pm *PluginManager) notifyCookiesLocked() {
	if pm.onCookies == nil {
		return
	}
	seen := map[string]bool{}
	var all []string
	for _, names := range pm.observeCookies {
		for _, n := range names {
			if !seen[n] {
				seen[n] = true
				all = append(all, n)
			}
		}
	}
	pm.onCookies(all)
}

// PublicRouteCookies returns the cookie names forwarded to slug's public routes.
func (pm *PluginManager) PublicRouteCookies(slug string) []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return pm.routeCookies[slug]
}
