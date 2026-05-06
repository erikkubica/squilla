package sdui

import (
	"encoding/json"

	"squilla/internal/models"
)

// IsExtensionVisible returns true when the user can see at least one
// admin_ui contribution from the extension — used by both the boot
// manifest builder and the /admin/api/extensions/manifests handler so
// the SPA's micro-frontend loader and the kernel's boot manifest filter
// agree on which extensions a given user is entitled to load.
//
// An extension is visible when:
//
//  1. It declares any field_types — those are inert UI helpers needed
//     by the page editor, regardless of admin nav access.
//  2. It declares any admin_ui.slots — slot contributions are
//     cross-extension UI composition (e.g. SMTP/Resend providers
//     filling email-manager's "email-settings" slot). The consuming
//     extension loads these components from this extension's bundle;
//     hiding them breaks the consumer.
//  3. It declares a top-level `provides` array — providers
//     (email.provider, media-provider, …) are discovered at runtime
//     by other extensions iterating /extensions/manifests, so they
//     must always be discoverable to admin_access users.
//  4. Its top-level menu would render for this user (leaf: own
//     required_capability passes; group: at least one child passes,
//     where children inherit the parent's required_capability when
//     they don't declare their own).
//  5. Any of its settings_menu / site_settings_menu items would render.
//
// Backend-only extensions (no admin_ui AND no `provides`) are never
// visible — they have nothing for the SPA to load and nothing to
// discover. Caller must handle that case themselves if it matters;
// this function only inspects the manifest.
//
// Callers pass the raw manifest JSON. Parsing happens here so each
// caller doesn't repeat the inline-anonymous-struct decoding.
func IsExtensionVisible(user *models.User, manifestJSON []byte) bool {
	var manifest struct {
		Provides []string `json:"provides"`
		AdminUI  *struct {
			FieldTypes []struct {
				Type string `json:"type"`
			} `json:"field_types"`
			Slots map[string]json.RawMessage `json:"slots"`
			Menu  *struct {
				Section            string `json:"section"`
				RequiredCapability string `json:"required_capability"`
				Children           []struct {
					RequiredCapability string `json:"required_capability"`
				} `json:"children"`
			} `json:"menu"`
			SettingsMenu []struct {
				RequiredCapability string `json:"required_capability"`
			} `json:"settings_menu"`
			SiteSettingsMenu []struct {
				RequiredCapability string `json:"required_capability"`
			} `json:"site_settings_menu"`
		} `json:"admin_ui"`
	}
	if err := json.Unmarshal(manifestJSON, &manifest); err != nil {
		return false
	}

	// Rule 3 — `provides` is a top-level field, not under admin_ui.
	// Provider extensions might have empty admin_ui, so check first.
	if len(manifest.Provides) > 0 {
		return true
	}

	if manifest.AdminUI == nil {
		return false
	}

	// Rule 1 — field types.
	if len(manifest.AdminUI.FieldTypes) > 0 {
		return true
	}

	// Rule 2 — slots.
	if len(manifest.AdminUI.Slots) > 0 {
		return true
	}

	// Rule 4 — top-level menu.
	if m := manifest.AdminUI.Menu; m != nil {
		if len(m.Children) == 0 {
			if extNavPasses(user, m.Section, m.RequiredCapability) {
				return true
			}
		} else {
			for _, c := range m.Children {
				childCap := c.RequiredCapability
				if childCap == "" {
					childCap = m.RequiredCapability
				}
				if extNavPasses(user, m.Section, childCap) {
					return true
				}
			}
		}
	}

	// Rule 5a — settings_menu items.
	for _, item := range manifest.AdminUI.SettingsMenu {
		if extNavPasses(user, "settings_menu", item.RequiredCapability) {
			return true
		}
	}

	// Rule 5b — site_settings_menu items.
	for _, item := range manifest.AdminUI.SiteSettingsMenu {
		if extNavPasses(user, "settings_menu", item.RequiredCapability) {
			return true
		}
	}

	return false
}
