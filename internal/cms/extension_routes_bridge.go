package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"squilla/internal/events"
)

// ExtensionRoutesBridge keeps the AdminRouteRegistry in sync with
// active extensions. On extension.activated it reads the manifest's
// admin_routes block, compiles the patterns, and stores them under the
// extension's slug. On extension.deactivated it drops the entry so
// future requests through the proxy fall back to plain admin_access.
//
// The bridge is mandatory: without it the proxy would have an empty
// rule table and the per-cap gating would silently degrade to
// admin-access-only — exactly the bug we just fixed.
type ExtensionRoutesBridge struct {
	loader   *ExtensionLoader
	registry *AdminRouteRegistry
	eventBus *events.EventBus
}

// NewExtensionRoutesBridge constructs a bridge. Subscribe still has to
// be called explicitly so wiring order in main.go stays controllable.
func NewExtensionRoutesBridge(loader *ExtensionLoader, registry *AdminRouteRegistry, eventBus *events.EventBus) *ExtensionRoutesBridge {
	return &ExtensionRoutesBridge{loader: loader, registry: registry, eventBus: eventBus}
}

// Subscribe attaches handlers to extension.activated / extension.deactivated.
func (b *ExtensionRoutesBridge) Subscribe() {
	b.eventBus.Subscribe("extension.activated", func(_ string, p events.Payload) {
		slug, _ := p["slug"].(string)
		if slug == "" {
			return
		}
		if err := b.RegisterFromDisk(slug); err != nil {
			log.Printf("[routes-bridge] register %q: %v", slug, err)
		}
	})
	b.eventBus.Subscribe("extension.deactivated", func(_ string, p events.Payload) {
		slug, _ := p["slug"].(string)
		if slug == "" {
			return
		}
		b.registry.Drop(slug)
	})
}

// ReplayActive scans every currently-active extension and registers its
// admin_routes. Call once at boot after the loader has finished its
// initial scan — without this, only deactivate-then-reactivate would
// populate the registry.
func (b *ExtensionRoutesBridge) ReplayActive() {
	exts, err := b.loader.GetActive()
	if err != nil {
		log.Printf("[routes-bridge] list active: %v", err)
		return
	}
	for _, ext := range exts {
		if err := b.RegisterFromDisk(ext.Slug); err != nil {
			log.Printf("[routes-bridge] replay %q: %v", ext.Slug, err)
		}
	}
}

// RegisterFromDisk reads the extension's manifest from disk, compiles
// admin_routes, and replaces whatever was registered for this slug.
func (b *ExtensionRoutesBridge) RegisterFromDisk(slug string) error {
	manifestPath, err := b.findManifest(slug)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("read manifest: %w", err)
	}
	var m struct {
		AdminRoutes []AdminRouteEntry `json:"admin_routes"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return fmt.Errorf("parse manifest: %w", err)
	}
	rules := CompileAdminRoutes(m.AdminRoutes)
	b.registry.Set(slug, rules)
	return nil
}

func (b *ExtensionRoutesBridge) findManifest(slug string) (string, error) {
	candidates := []string{
		filepath.Join(b.loader.dataDir, slug, "extension.json"),
		filepath.Join(b.loader.extensionsDir, slug, "extension.json"),
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}
	return "", fmt.Errorf("manifest not found for %q", slug)
}
