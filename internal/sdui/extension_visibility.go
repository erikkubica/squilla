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
//  2. Its top-level menu would render for this user (leaf: own
//     required_capability passes; group: at least one child passes,
//     where children inherit the parent's required_capability when
//     they don't declare their own).
//  3. Any of its settings_menu / site_settings_menu items would render.
//
// Backend-only extensions (no admin_ui block) are never visible — they
// have nothing for the SPA to load. Caller must handle that case
// themselves; this function only inspects admin_ui.
//
// Callers pass the raw manifest JSON. Parsing happens here so each
// caller doesn't repeat the inline-anonymous-struct decoding.
func IsExtensionVisible(user *models.User, manifestJSON []byte) bool {
	var manifest struct {
		AdminUI *struct {
			FieldTypes []struct {
				Type string `json:"type"`
			} `json:"field_types"`
			Menu *struct {
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
	if manifest.AdminUI == nil {
		return false
	}

	// Rule 1 — field types.
	if len(manifest.AdminUI.FieldTypes) > 0 {
		return true
	}

	// Rule 2 — top-level menu.
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

	// Rule 3a — settings_menu items.
	for _, item := range manifest.AdminUI.SettingsMenu {
		if extNavPasses(user, "settings_menu", item.RequiredCapability) {
			return true
		}
	}

	// Rule 3b — site_settings_menu items.
	for _, item := range manifest.AdminUI.SiteSettingsMenu {
		if extNavPasses(user, "settings_menu", item.RequiredCapability) {
			return true
		}
	}

	return false
}
