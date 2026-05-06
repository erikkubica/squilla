package auth

import (
	"sort"
	"sync"
)

// Capability describes one boolean capability that the role editor surfaces.
// Capabilities are NOT permissions in their own right — a role's
// JSONB capabilities map carries the actual grants. The registry just
// answers "what capabilities exist in this build, and where did they
// come from?" so the admin UI can render a complete editor.
//
// Source values:
//   - "kernel"            — built-in, always present
//   - "extension:<slug>"  — registered when the extension activates,
//                           dropped on deactivation
//   - "theme:<slug>"      — registered when the theme activates
type Capability struct {
	Key         string `json:"key"`
	Label       string `json:"label"`
	Description string `json:"description,omitempty"`
	Source      string `json:"source"`
}

// CapabilityRegistry is the single in-process index of every known
// capability. Concurrent reads happen on every boot manifest fetch and
// every role-editor open, so the registry uses a sync.RWMutex and
// returns sorted snapshots that callers can safely iterate without
// holding a lock.
type CapabilityRegistry struct {
	mu      sync.RWMutex
	entries map[string]Capability
}

// NewCapabilityRegistry constructs a fresh registry seeded with the
// kernel-owned capabilities. Extensions and themes layer their own on
// top via Register / UnregisterBySource.
func NewCapabilityRegistry() *CapabilityRegistry {
	r := &CapabilityRegistry{entries: make(map[string]Capability)}
	for _, c := range kernelCapabilities() {
		r.entries[c.Key] = c
	}
	return r
}

// Register adds or updates a capability. The Source field is required —
// without it we can't unregister cleanly when an extension deactivates.
// Last write wins on key collision (the role-editor surfaces only the
// latest definition), which matches the settings-bridge pattern of
// allowing extensions to redefine a capability if they truly need to.
func (r *CapabilityRegistry) Register(cap Capability) {
	if cap.Key == "" {
		return
	}
	if cap.Source == "" {
		cap.Source = "unknown"
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.entries[cap.Key] = cap
}

// UnregisterBySource removes every capability whose Source matches —
// the natural inverse of an extension/theme deactivation. Built-in
// (Source="kernel") capabilities are never removed even if a buggy
// caller passes "kernel".
func (r *CapabilityRegistry) UnregisterBySource(source string) {
	if source == "" || source == "kernel" {
		return
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	for key, c := range r.entries {
		if c.Source == source {
			delete(r.entries, key)
		}
	}
}

// List returns every registered capability sorted by source group
// (kernel first, then extension/theme alphabetically) and then by key.
// Callers receive a copy so they can mutate the slice freely.
func (r *CapabilityRegistry) List() []Capability {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]Capability, 0, len(r.entries))
	for _, c := range r.entries {
		out = append(out, c)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Source != out[j].Source {
			// kernel always first
			if out[i].Source == "kernel" {
				return true
			}
			if out[j].Source == "kernel" {
				return false
			}
			return out[i].Source < out[j].Source
		}
		return out[i].Key < out[j].Key
	})
	return out
}

// Has reports whether a capability with the given key exists in the
// registry. Used by validation paths that want to reject role saves
// referencing unknown capabilities.
func (r *CapabilityRegistry) Has(key string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.entries[key]
	return ok
}

// kernelCapabilities lists every built-in capability the kernel ships.
// Keep in sync with the JSONB seed in internal/db/seed.go and with the
// per-handler CapabilityRequired calls — adding one here without the
// corresponding handler check produces a no-op toggle in the role
// editor; the reverse hides a real grant from the admin.
func kernelCapabilities() []Capability {
	return []Capability{
		{Key: "admin_access", Source: "kernel", Label: "Admin Access",
			Description: "Allow this role into the admin shell. Without this, login redirects to the public homepage."},
		{Key: "manage_users", Source: "kernel", Label: "Manage Users",
			Description: "Create, edit, and delete user accounts."},
		{Key: "manage_roles", Source: "kernel", Label: "Manage Roles",
			Description: "Create and edit roles and their capability sets."},
		{Key: "manage_settings", Source: "kernel", Label: "Manage Settings",
			Description: "Edit site settings, content types, taxonomies, themes, and extensions."},
		{Key: "manage_menus", Source: "kernel", Label: "Manage Menus",
			Description: "Create and edit navigation menus."},
		{Key: "manage_layouts", Source: "kernel", Label: "Manage Layouts",
			Description: "Edit templates, layouts, block types, and layout blocks."},
	}
}
