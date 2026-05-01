package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"squilla/internal/events"
	"squilla/internal/settings"
)

// ExtensionSettingsBridge wires extension lifecycle events to the
// in-process settings registry. Extensions declare settings schemas in
// their extension.json `settings` array (each entry is a complete
// settings.Schema). On activation the bridge reads the manifest and
// registers each schema; on deactivation it unregisters whatever it
// previously registered for that slug. Boot replay registers schemas
// for already-active extensions so the registry survives process
// restarts without requiring a deactivate/activate cycle.
//
// Schema ID namespacing: by default the bridge prefixes simple IDs
// (like "settings" or "config") with `ext.<slug>.` so two extensions
// can declare schemas with the same local ID without colliding. An
// extension that wants to claim a kernel-known ID — e.g. seo-extension
// owning `site.seo` after the SEO/robots schemas were extracted from
// core — declares the schema with a dotted ID and the bridge uses it
// verbatim. Last-write-wins resolves any cross-extension collisions on
// claimed IDs; tracking what each slug registered lets us unregister
// the right rows on deactivation regardless of how they were named.
type ExtensionSettingsBridge struct {
	loader     *ExtensionLoader
	registry   *settings.Registry
	eventBus   *events.EventBus
	mu         sync.Mutex
	registered map[string][]string // slug → schema IDs we registered, used by UnregisterAll
}

// NewExtensionSettingsBridge constructs the bridge. Subscribe still has
// to be called explicitly so wiring order in main.go stays controllable.
func NewExtensionSettingsBridge(loader *ExtensionLoader, registry *settings.Registry, eventBus *events.EventBus) *ExtensionSettingsBridge {
	return &ExtensionSettingsBridge{
		loader:     loader,
		registry:   registry,
		eventBus:   eventBus,
		registered: make(map[string][]string),
	}
}

// Subscribe attaches handlers to extension.activated / extension.deactivated.
func (b *ExtensionSettingsBridge) Subscribe() {
	b.eventBus.Subscribe("extension.activated", func(_ string, p events.Payload) {
		slug, _ := p["slug"].(string)
		if slug == "" {
			return
		}
		if err := b.RegisterFromDisk(slug); err != nil {
			log.Printf("[settings-bridge] register %q: %v", slug, err)
		}
	})
	b.eventBus.Subscribe("extension.deactivated", func(_ string, p events.Payload) {
		slug, _ := p["slug"].(string)
		if slug == "" {
			return
		}
		b.UnregisterAll(slug)
	})
}

// ReplayActive scans every currently-active extension and registers its
// schemas. Call once at boot after the loader has finished its initial
// scan — without this, schemas only land in the registry when the
// admin toggles an extension off and on again.
func (b *ExtensionSettingsBridge) ReplayActive() {
	exts, err := b.loader.GetActive()
	if err != nil {
		log.Printf("[settings-bridge] list active: %v", err)
		return
	}
	for _, ext := range exts {
		if err := b.RegisterFromDisk(ext.Slug); err != nil {
			log.Printf("[settings-bridge] replay %q: %v", ext.Slug, err)
		}
	}
}

// RegisterFromDisk reads the extension's manifest from disk and registers
// every declared schema. We re-read rather than relying on cached state
// because the loader doesn't keep the raw `settings` array around after
// the initial scan.
func (b *ExtensionSettingsBridge) RegisterFromDisk(slug string) error {
	manifestPath, err := b.findManifest(slug)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("read manifest: %w", err)
	}
	var m ExtensionManifest
	if err := json.Unmarshal(data, &m); err != nil {
		return fmt.Errorf("parse manifest: %w", err)
	}

	// Drop any prior registrations from a previous activation cycle so
	// re-activating an extension doesn't double-register or leak old IDs.
	b.UnregisterAll(slug)

	var registered []string
	for i, raw := range m.Settings {
		var schema settings.Schema
		if err := json.Unmarshal(raw, &schema); err != nil {
			log.Printf("[settings-bridge] %s settings[%d]: %v", slug, i, err)
			continue
		}
		if schema.ID == "" {
			log.Printf("[settings-bridge] %s settings[%d]: missing id", slug, i)
			continue
		}
		// Dotted IDs are absolute — the extension is intentionally
		// claiming a kernel-known namespace (e.g. seo-extension owning
		// "site.seo" after SEO settings moved out of core). Simple IDs
		// get the "ext.<slug>." prefix so two extensions with a
		// "settings" schema don't collide.
		if !strings.Contains(schema.ID, ".") {
			schema.ID = fmt.Sprintf("ext.%s.%s", slug, schema.ID)
		}
		if err := b.registry.Register(schema); err != nil {
			log.Printf("[settings-bridge] %s register %q: %v", slug, schema.ID, err)
			continue
		}
		registered = append(registered, schema.ID)
	}

	b.mu.Lock()
	b.registered[slug] = registered
	b.mu.Unlock()
	return nil
}

// UnregisterAll removes every schema this slug registered. Tracking the
// IDs explicitly (rather than reverse-engineering them from a prefix)
// is what lets extensions claim absolute IDs like "site.seo" — we still
// know which IDs to drop on deactivation.
func (b *ExtensionSettingsBridge) UnregisterAll(slug string) {
	b.mu.Lock()
	ids := b.registered[slug]
	delete(b.registered, slug)
	b.mu.Unlock()
	for _, id := range ids {
		b.registry.Unregister(id)
	}
}

// findManifest resolves slug → extension.json path. Mirrors the loader's
// dataDir-wins-over-bundledDir rule so admin-installed extensions
// shadow image-bundled ones.
func (b *ExtensionSettingsBridge) findManifest(slug string) (string, error) {
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
