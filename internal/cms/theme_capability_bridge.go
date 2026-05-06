package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"squilla/internal/auth"
	"squilla/internal/events"
)

// ThemeCapabilityBridge keeps the auth.CapabilityRegistry in sync with
// theme activation. Themes declare role capabilities under
// `admin_ui.capabilities` in theme.json — same shape as the extension
// manifest. On theme.activated the bridge registers them tagged with
// "theme:<slug>"; on theme.deactivated the previously-registered ones
// are dropped.
//
// Themes can declare capabilities for two reasons:
//  1. They surface admin pages (e.g. a homepage carousel editor) that
//     should only appear for users carrying the right role flag.
//  2. They expose feature toggles that other admin UI surfaces gate by.
//
// Only one theme is active at a time, so this bridge doesn't need a
// "registered map" the way the extension bridge does — re-activation
// always replaces the prior set.
type ThemeCapabilityBridge struct {
	registry *auth.CapabilityRegistry
	eventBus *events.EventBus
}

// NewThemeCapabilityBridge constructs a bridge backed by the given
// registry and event bus. Subscribe still has to be called explicitly.
func NewThemeCapabilityBridge(registry *auth.CapabilityRegistry, eventBus *events.EventBus) *ThemeCapabilityBridge {
	return &ThemeCapabilityBridge{registry: registry, eventBus: eventBus}
}

// Subscribe wires theme.activated / theme.deactivated handlers.
func (b *ThemeCapabilityBridge) Subscribe() {
	b.eventBus.Subscribe("theme.activated", func(_ string, p events.Payload) {
		path, _ := p["path"].(string)
		name, _ := p["name"].(string)
		slug := themeSlugFromName(name)
		if slug == "" || path == "" {
			return
		}
		// Activating theme A while theme B is still registered is
		// impossible per the kernel's "one active theme" rule, but the
		// blanket clear-by-source defends against any edge case where
		// theme.deactivated didn't fire first.
		b.registry.UnregisterBySource(themeSource(slug))
		if err := b.registerFromDisk(slug, path); err != nil {
			log.Printf("[theme-capability] register %q: %v", slug, err)
		}
	})
	b.eventBus.Subscribe("theme.deactivated", func(_ string, p events.Payload) {
		name, _ := p["name"].(string)
		slug := themeSlugFromName(name)
		if slug == "" {
			return
		}
		b.registry.UnregisterBySource(themeSource(slug))
	})
}

func (b *ThemeCapabilityBridge) registerFromDisk(slug, path string) error {
	manifestPath := filepath.Join(path, "theme.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("read theme.json: %w", err)
	}
	var m struct {
		AdminUI *struct {
			Capabilities []struct {
				Key         string `json:"key"`
				Label       string `json:"label"`
				Description string `json:"description"`
			} `json:"capabilities"`
		} `json:"admin_ui"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return fmt.Errorf("parse theme.json: %w", err)
	}
	if m.AdminUI == nil {
		return nil
	}
	source := themeSource(slug)
	for _, c := range m.AdminUI.Capabilities {
		if c.Key == "" {
			continue
		}
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
	}
	return nil
}

// themeSlugFromName mirrors the kernel's name → slug rule
// (lower-case + spaces to dashes) so the source tag matches what we
// register on activation and what we'd unregister on deactivation.
func themeSlugFromName(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "-"))
}

func themeSource(slug string) string {
	return "theme:" + slug
}
