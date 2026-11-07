package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/gorm"

	"squilla/internal/auth"
	"squilla/internal/events"
)

// ExtensionCapabilityBridge keeps the auth.CapabilityRegistry in sync
// with active extensions. Extensions declare role capabilities under
// `admin_ui.capabilities` in extension.json — each entry is a
// {key,label,description} object. On activation the bridge reads the
// manifest and registers each capability tagged with the extension's
// slug; on deactivation it drops every capability previously tagged for
// that slug.
//
// An entry may also carry `default_roles` (role slugs). When the bridge
// has a database (WithDB), each listed role is granted the capability on
// activation/boot replay — but only if the role's capabilities map has
// no entry for that key yet. An explicit false (an operator switched it
// off in the role editor) is never overridden.
//
// The pattern mirrors ExtensionSettingsBridge — same lifecycle, same
// boot replay so existing-active extensions don't need a deactivate /
// reactivate cycle to surface their capabilities after a process
// restart.
type ExtensionCapabilityBridge struct {
	loader   *ExtensionLoader
	registry *auth.CapabilityRegistry
	eventBus *events.EventBus
	db       *gorm.DB
}

// WithDB enables manifest `default_roles` grants. Without a database the
// bridge only maintains the in-memory registry.
func (b *ExtensionCapabilityBridge) WithDB(db *gorm.DB) *ExtensionCapabilityBridge {
	b.db = db
	return b
}

// manifestCapability is one admin_ui.capabilities entry.
type manifestCapability struct {
	Key          string   `json:"key"`
	Label        string   `json:"label"`
	Description  string   `json:"description"`
	DefaultRoles []string `json:"default_roles"`
}

// parseManifestCapabilities extracts admin_ui.capabilities from raw
// extension.json bytes, dropping entries without a key and normalising
// default_roles (trimmed, deduplicated, empty removed). "*" is never a
// valid declared key — the wildcard is kernel-owned.
func parseManifestCapabilities(data []byte) ([]manifestCapability, error) {
	var m struct {
		AdminUI *struct {
			Capabilities []manifestCapability `json:"capabilities"`
		} `json:"admin_ui"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	if m.AdminUI == nil {
		return nil, nil
	}
	out := make([]manifestCapability, 0, len(m.AdminUI.Capabilities))
	for _, c := range m.AdminUI.Capabilities {
		c.Key = strings.TrimSpace(c.Key)
		if c.Key == "" || c.Key == "*" {
			continue
		}
		seen := make(map[string]bool, len(c.DefaultRoles))
		roles := make([]string, 0, len(c.DefaultRoles))
		for _, r := range c.DefaultRoles {
			r = strings.TrimSpace(r)
			if r == "" || seen[r] {
				continue
			}
			seen[r] = true
			roles = append(roles, r)
		}
		c.DefaultRoles = roles
		out = append(out, c)
	}
	return out, nil
}

// grantDefaultRoles sets capabilities[key]=true on each listed role that
// has no entry for key yet. Done as a single conditional UPDATE so it is
// atomic against concurrent role-editor saves and idempotent across
// restarts. Returns the number of roles changed.
func (b *ExtensionCapabilityBridge) grantDefaultRoles(key string, roles []string) (int64, error) {
	if b.db == nil || len(roles) == 0 {
		return 0, nil
	}
	res := b.db.Exec(
		`UPDATE roles
		    SET capabilities = COALESCE(capabilities, '{}'::jsonb) || jsonb_build_object(?::text, true),
		        updated_at = NOW()
		  WHERE slug IN ?
		    AND NOT jsonb_exists(COALESCE(capabilities, '{}'::jsonb), ?::text)`,
		key, roles, key,
	)
	return res.RowsAffected, res.Error
}

// NewExtensionCapabilityBridge constructs the bridge. Subscribe must be
// called explicitly so wiring order in main.go stays controllable.
func NewExtensionCapabilityBridge(loader *ExtensionLoader, registry *auth.CapabilityRegistry, eventBus *events.EventBus) *ExtensionCapabilityBridge {
	return &ExtensionCapabilityBridge{
		loader:   loader,
		registry: registry,
		eventBus: eventBus,
	}
}

// Subscribe attaches handlers to extension.activated / extension.deactivated.
func (b *ExtensionCapabilityBridge) Subscribe() {
	b.eventBus.Subscribe("extension.activated", func(_ string, p events.Payload) {
		slug, _ := p["slug"].(string)
		if slug == "" {
			return
		}
		if err := b.RegisterFromDisk(slug); err != nil {
			log.Printf("[capability-bridge] register %q: %v", slug, err)
		}
	})
	b.eventBus.Subscribe("extension.deactivated", func(_ string, p events.Payload) {
		slug, _ := p["slug"].(string)
		if slug == "" {
			return
		}
		b.registry.UnregisterBySource(extensionSource(slug))
	})
}

// ReplayActive scans every currently-active extension and registers its
// capabilities. Call once at boot after the loader has finished its
// initial scan.
func (b *ExtensionCapabilityBridge) ReplayActive() {
	exts, err := b.loader.GetActive()
	if err != nil {
		log.Printf("[capability-bridge] list active: %v", err)
		return
	}
	for _, ext := range exts {
		if err := b.RegisterFromDisk(ext.Slug); err != nil {
			log.Printf("[capability-bridge] replay %q: %v", ext.Slug, err)
		}
	}
}

// RegisterFromDisk reads the extension's manifest from disk and
// registers every declared capability. Re-reading rather than relying
// on cached state matches the settings-bridge approach.
func (b *ExtensionCapabilityBridge) RegisterFromDisk(slug string) error {
	manifestPath, err := b.findManifest(slug)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("read manifest: %w", err)
	}
	// Drop prior registrations for this slug so re-activation doesn't
	// leave stale capabilities behind if the manifest's list changed.
	b.registry.UnregisterBySource(extensionSource(slug))

	caps, err := parseManifestCapabilities(data)
	if err != nil {
		return fmt.Errorf("parse manifest: %w", err)
	}
	source := extensionSource(slug)
	for _, c := range caps {
		label := c.Label
		if label == "" {
			label = c.Key
		}
		b.registry.Register(auth.Capability{
			Key:         c.Key,
			Label:       label,
			Description: c.Description,
			Source:      source,
		})
		if n, err := b.grantDefaultRoles(c.Key, c.DefaultRoles); err != nil {
			log.Printf("[capability-bridge] %s: default grant %q: %v", slug, c.Key, err)
		} else if n > 0 {
			log.Printf("[capability-bridge] %s: granted %q to %d default role(s)", slug, c.Key, n)
		}
	}
	return nil
}

// findManifest resolves slug → extension.json path. Mirrors the
// loader's dataDir-wins-over-bundledDir rule so admin-installed
// extensions shadow image-bundled ones.
func (b *ExtensionCapabilityBridge) findManifest(slug string) (string, error) {
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

// extensionSource returns the registry source tag for an extension slug.
// Centralised so register and unregister always agree on the format.
func extensionSource(slug string) string {
	return "extension:" + slug
}
