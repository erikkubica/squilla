package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sync"

	vibeplugin "squilla/pkg/plugin"

	goplugin "github.com/hashicorp/go-plugin"

	"squilla/internal/events"

	"google.golang.org/grpc"
	"gorm.io/gorm"
)

// HostServerRegistrar is a function that registers the SquillaHost
// gRPC service on a grpc.Server for a given extension slug with its
// capabilities and owned-tables list. owned-tables is consumed by the
// coreapi capability guard's data:* gate; capabilities feeds the
// generic checkCapability path. This signature is the trust boundary
// — anything passed here ends up in CallerInfo for every CoreAPI
// call from the plugin.
//
// The struct-shaped factory avoids the import cycle between cms and
// coreapi while keeping the wiring readable.
type HostServerRegistrar func(slug string, capabilities map[string]bool, ownedTables map[string]bool) func(s *grpc.Server)

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
}

// NewPluginManager creates a new PluginManager.
// hostRegistrar may be nil if no CoreAPI is available (plugins won't get host callbacks).
// db may be nil when running without persistence (tests); when set, the
// manager refuses to spawn binaries whose SHA-256 doesn't match the
// site_settings-pinned value.
func NewPluginManager(eventBus *events.EventBus, hostRegistrar HostServerRegistrar, db *gorm.DB) *PluginManager {
	return &PluginManager{
		plugins:       make(map[string][]*runningPlugin),
		eventBus:      eventBus,
		hostRegistrar: hostRegistrar,
		db:            db,
	}
}

// StartPlugins starts all plugin binaries declared in an extension's manifest.
// capabilities is the set of permissions declared in the extension
// manifest; ownedTables is the set of database tables this extension
// is allowed to touch through the Data* CoreAPI methods (default
// deny). Both flow into the per-extension CallerInfo when the host
// gRPC service is registered.
func (pm *PluginManager) StartPlugins(extPath string, slug string, manifest json.RawMessage, capabilities map[string]bool, ownedTables map[string]bool) error {
	// Parse plugins from manifest. `provides` and `priority` feed the
	// provider-lookup helpers (GetProvider) so coreapi callers can ask
	// "who handles 'media-provider'?" without knowing slug names.
	var m struct {
		Plugins  []PluginManifestEntry `json:"plugins"`
		Provides []string              `json:"provides"`
		Priority int                   `json:"priority"`
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

	pm.mu.Lock()
	defer pm.mu.Unlock()

	// Stop any existing plugins for this extension first
	pm.stopPluginsLocked(slug)

	var started []*runningPlugin

	for _, pe := range m.Plugins {
		binaryPath := filepath.Join(extPath, pe.Binary)

		// Verify binary exists
		if _, err := os.Stat(binaryPath); os.IsNotExist(err) {
			log.Printf("[plugins] binary not found for %s: %s", slug, binaryPath)
			continue
		}

		// Verify SHA-256 against operator-pinned digest in
		// site_settings. Refusing to spawn on mismatch is the line
		// of defense against an attacker who replaced bin/<plugin>
		// — the binary executes arbitrary code with kernel-grade
		// trust (gRPC into CoreAPI), so a swapped binary is full
		// host compromise. When no pin is configured we log the
		// actual digest and continue (preserves first-boot UX).
		if err := verifyPluginBinary(pm.db, slug, pe.Binary, binaryPath); err != nil {
			log.Printf("[plugins] REFUSING to start %s/%s: %v", slug, pe.Binary, err)
			continue
		}

		// Start the plugin process. GRPCDialOptions raises the default
		// 4 MB call message-size limit so HandleHTTPRequest can carry
		// multi-megabyte uploads (mp4, large images, zipped extension
		// payloads). Mirrors the limits the plugin side sets on its
		// gRPC server in pkg/plugin (maxGRPCMessageSize).
		const maxGRPCMessageSize = 256 * 1024 * 1024
		client := goplugin.NewClient(&goplugin.ClientConfig{
			HandshakeConfig: vibeplugin.Handshake,
			VersionedPlugins: map[int]goplugin.PluginSet{
				2: vibeplugin.PluginMap,
			},
			Cmd:              exec.Command(binaryPath),
			AllowedProtocols: []goplugin.Protocol{goplugin.ProtocolGRPC},
			GRPCDialOptions: []grpc.DialOption{
				grpc.WithDefaultCallOptions(
					grpc.MaxCallRecvMsgSize(maxGRPCMessageSize),
					grpc.MaxCallSendMsgSize(maxGRPCMessageSize),
				),
			},
		})

		rpcClient, err := client.Client()
		if err != nil {
			log.Printf("[plugins] failed to start plugin %s/%s: %v", slug, pe.Binary, err)
			client.Kill()
			continue
		}

		raw, err := rpcClient.Dispense("extension")
		if err != nil {
			log.Printf("[plugins] failed to dispense plugin %s/%s: %v", slug, pe.Binary, err)
			client.Kill()
			continue
		}

		impl, ok := raw.(vibeplugin.ExtensionPlugin)
		if !ok {
			log.Printf("[plugins] plugin %s/%s does not implement ExtensionPlugin", slug, pe.Binary)
			client.Kill()
			continue
		}

		// Initialize: start gRPC host service so plugin can call back into Squilla.
		if pm.hostRegistrar != nil {
			if grpcClient, ok := impl.(*vibeplugin.GRPCClient); ok {
				registerFn := pm.hostRegistrar(slug, capabilities, ownedTables)
				if initErr := grpcClient.InitializeHost(registerFn); initErr != nil {
					log.Printf("[plugins] failed to initialize host service for %s/%s: %v", slug, pe.Binary, initErr)
					client.Kill()
					continue
				}
			}
		}

		// Get subscriptions from the plugin
		subs, err := impl.GetSubscriptions()
		if err != nil {
			log.Printf("[plugins] failed to get subscriptions from %s/%s: %v", slug, pe.Binary, err)
			client.Kill()
			continue
		}

		rp := &runningPlugin{
			slug:     slug,
			binary:   pe.Binary,
			client:   client,
			impl:     impl,
			provides: append([]string(nil), m.Provides...),
			priority: m.Priority,
			stopped:  make(chan struct{}),
		}

		// Register event subscriptions. The plugin manager wires three
		// dispatch flavours per declared event so the kernel side can
		// pick whichever Publish* method makes sense at the call site
		// without each plugin needing to declare separate subscriptions:
		//   • Subscribe        — fire-and-forget, errors logged only
		//   • SubscribeResult  — sync request/reply for {{event}} templates
		//   • SubscribeErr     — sync request with error propagation back
		//                        to the kernel caller (CoreAPI.SendEmail)
		//
		// The wildcard subscription ("*") routes via SubscribeAll so an
		// extension that owns a cross-cutting concern (e.g. email-manager
		// matching arbitrary admin-defined rules to any system event) can
		// receive every event without enumerating them in the manifest.
		for _, sub := range subs {
			eventName := sub.EventName
			rp.eventNames = append(rp.eventNames, eventName)

			pluginImpl := impl // capture for closure

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

			if eventName == "*" {
				// Wildcard fan-out via SubscribeAll. Result/Err variants
				// are skipped because PublishCollect / PublishRequest
				// dispatch on action-specific maps; subscribing the
				// wildcard there would require a separate "all" surface
				// the kernel doesn't currently need.
				pm.eventBus.SubscribeAll(func(action string, payload events.Payload) {
					_, _, errStr, callErr := dispatchEvent(action, payload)
					if callErr != nil {
						log.Printf("[plugins] error from %s/%s handling %s: %v", slug, pe.Binary, action, callErr)
						return
					}
					if errStr != "" {
						log.Printf("[plugins] %s/%s reported error for %s: %s", slug, pe.Binary, action, errStr)
					}
				})
				continue
			}

			pm.eventBus.Subscribe(eventName, func(action string, payload events.Payload) {
				_, _, errStr, callErr := dispatchEvent(action, payload)
				if callErr != nil {
					log.Printf("[plugins] error from %s/%s handling %s: %v", slug, pe.Binary, action, callErr)
					return
				}
				if errStr != "" {
					log.Printf("[plugins] %s/%s reported error for %s: %s", slug, pe.Binary, action, errStr)
				}
			})

			pm.eventBus.SubscribeResult(eventName, func(action string, payload events.Payload) string {
				handled, result, errStr, callErr := dispatchEvent(action, payload)
				if callErr != nil {
					log.Printf("[plugins] error from %s/%s handling %s: %v", slug, pe.Binary, action, callErr)
					return ""
				}
				if errStr != "" {
					log.Printf("[plugins] %s/%s reported error for %s: %s", slug, pe.Binary, action, errStr)
					return ""
				}
				if !handled {
					return ""
				}
				return string(result)
			})

			// SubscribeErr lets the kernel surface a plugin-reported
			// error (resp.Error) back through PublishRequest. Used by
			// CoreAPI.SendEmail so an SMTP refusal propagates to the
			// HTTP caller instead of being swallowed in a log line.
			pm.eventBus.SubscribeErr(eventName, func(action string, payload events.Payload) error {
				_, _, errStr, callErr := dispatchEvent(action, payload)
				if callErr != nil {
					return callErr
				}
				if errStr != "" {
					return fmt.Errorf("%s: %s", slug, errStr)
				}
				return nil
			})
		}

		started = append(started, rp)
		log.Printf("[plugins] started %s/%s with %d subscriptions", slug, pe.Binary, len(subs))
	}

	if len(started) > 0 {
		pm.plugins[slug] = started
	}

	return nil
}

// StopPlugins stops all plugin processes for an extension.
func (pm *PluginManager) StopPlugins(slug string) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.stopPluginsLocked(slug)
}

// stopPluginsLocked stops plugins while holding the lock.
func (pm *PluginManager) stopPluginsLocked(slug string) {
	plugins, exists := pm.plugins[slug]
	if !exists {
		return
	}

	for _, rp := range plugins {
		log.Printf("[plugins] stopping %s/%s", slug, rp.binary)
		close(rp.stopped) // signal event handlers to stop calling this plugin
		_ = rp.impl.Shutdown()
		rp.client.Kill()
	}

	delete(pm.plugins, slug)
}

// StopAll stops all running plugins (for graceful shutdown).
func (pm *PluginManager) StopAll() {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	for slug := range pm.plugins {
		pm.stopPluginsLocked(slug)
	}
}

// GetClient returns the first active GRPCClient for the given extension slug,
// or nil if no plugin is running for that slug.
func (pm *PluginManager) GetClient(slug string) *vibeplugin.GRPCClient {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	plugins, exists := pm.plugins[slug]
	if !exists || len(plugins) == 0 {
		return nil
	}

	// Return the first plugin's impl cast to GRPCClient.
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
