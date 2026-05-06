package sdui

import (
	"encoding/json"
	"strings"

	"squilla/internal/models"
)

// canReadNodeType mirrors auth.GetNodeAccess(...).CanRead() but is duplicated
// here to avoid an import cycle (sdui ← api ← auth → api). Resolution order:
// per-type override in `nodes.<slug>` → `default_node_access` → "none".
//
// Keep in sync with auth/rbac_middleware.go's GetNodeAccess.
func canReadNodeType(user *models.User, slug string) bool {
	if user == nil {
		return false
	}
	var caps map[string]interface{}
	if err := json.Unmarshal(user.Role.Capabilities, &caps); err != nil {
		return false
	}
	access := "none"
	if nodes, ok := caps["nodes"].(map[string]interface{}); ok {
		if override, ok := nodes[slug].(map[string]interface{}); ok {
			if a, ok := override["access"].(string); ok {
				access = a
			}
			return access == "read" || access == "write"
		}
	}
	if def, ok := caps["default_node_access"].(map[string]interface{}); ok {
		if a, ok := def["access"].(string); ok {
			access = a
		}
	}
	return access == "read" || access == "write"
}

// hasNavCap checks a single boolean capability on the user's role. Empty
// capability string = no gate (item always shows). Mirrors
// auth.HasCapability without the import (see canReadNodeType for why).
func hasNavCap(user *models.User, capability string) bool {
	if capability == "" {
		return true
	}
	if user == nil {
		return false
	}
	var caps map[string]interface{}
	if err := json.Unmarshal(user.Role.Capabilities, &caps); err != nil {
		return false
	}
	v, ok := caps[capability].(bool)
	return ok && v
}

// anyNavCap returns true if the user has at least one of the listed
// capabilities. Used for parent-group visibility (e.g. Security group is
// visible if the user has any of manage_users / manage_roles / manage_settings).
func anyNavCap(user *models.User, capabilities ...string) bool {
	for _, cap := range capabilities {
		if hasNavCap(user, cap) {
			return true
		}
	}
	return false
}

// hasAnyWriteNodeAccess reports whether the user has write access to at
// least one node type — either via default_node_access or any per-type
// override. It's the natural gate for content-creator tooling
// (media library, content extensions): readers shouldn't see the
// "manage X" entry, but anyone who can author any kind of content
// should. Same JSON path as canReadNodeType — duplicated to avoid the
// import cycle (sdui ← api ← auth).
func hasAnyWriteNodeAccess(user *models.User) bool {
	if user == nil {
		return false
	}
	var caps map[string]interface{}
	if err := json.Unmarshal(user.Role.Capabilities, &caps); err != nil {
		return false
	}
	if def, ok := caps["default_node_access"].(map[string]interface{}); ok {
		if a, ok := def["access"].(string); ok && a == "write" {
			return true
		}
	}
	if nodes, ok := caps["nodes"].(map[string]interface{}); ok {
		for _, override := range nodes {
			if om, ok := override.(map[string]interface{}); ok {
				if a, ok := om["access"].(string); ok && a == "write" {
					return true
				}
			}
		}
	}
	return false
}

// extNavPasses decides whether an extension-supplied nav entry survives
// capability filtering. Resolution order:
//  1. If the extension declared `required_capability`, use that — explicit
//     wins over heuristics.
//  2. Otherwise apply the kernel's per-section default. This is what
//     stops a member-with-admin_access from seeing every extension menu
//     just because the extension authors didn't bother to declare a gate.
//
// Section defaults:
//   - settings, development, dev → manage_settings (admin work)
//   - design                    → manage_layouts  (designer work)
//   - content                   → any write node access (authors+ only)
//   - "" (top-level)            → open (the /admin/api gate already
//     requires admin_access; top-level items are intentionally global)
//   - "settings_menu"           → manage_settings (sentinel for the
//     settings_menu / site_settings_menu lists, which always live under
//     site/extension settings groups)
//
// Extensions that legitimately need wider visibility (e.g. an "About"
// menu) MUST declare `required_capability:""` explicitly to opt out.
func extNavPasses(user *models.User, section, declaredCap string) bool {
	if declaredCap != "" {
		return hasNavCap(user, declaredCap)
	}
	switch strings.ToLower(section) {
	case "settings", "development", "dev":
		return hasNavCap(user, "manage_settings")
	case "design":
		return hasNavCap(user, "manage_layouts")
	case "content":
		return hasAnyWriteNodeAccess(user)
	case "settings_menu":
		return hasNavCap(user, "manage_settings")
	default:
		return true
	}
}

// buildNavigation assembles the admin sidebar tree returned by
// GenerateBootManifest. Lives in its own file because it's the
// largest non-page-layout method on Engine and conceptually
// independent from the per-page layout dispatch in engine.go.
//
// Sidebar shape: top-level dashboard + extension-supplied top-level
// items, then four kernel-fixed sections (Content / Design /
// Development / Settings) each with kernel items followed by any
// extension items routed to that section via
// admin_ui.menu.section in the extension manifest.
//
// Per-user filtering: node-type entries are dropped when the user's
// effective access for that type resolves to "none". Defense in depth —
// API capability guards still reject direct calls — but hiding the link
// is what the user sees, so this is where capability edits visibly land.
func (e *Engine) buildNavigation(user *models.User, nodeTypes []models.NodeType, taxonomies []models.Taxonomy, exts []models.Extension) []NavItem {
	var nav []NavItem

	// Helper: resolve display label with fallback.
	labelFor := func(nt models.NodeType) string {
		if nt.LabelPlural != "" {
			return nt.LabelPlural
		}
		return nt.Label
	}

	// Build a lookup: node_type_slug → []Taxonomy
	taxesByNodeType := make(map[string][]models.Taxonomy)
	for _, tax := range taxonomies {
		for _, ntSlug := range tax.NodeTypes {
			taxesByNodeType[ntSlug] = append(taxesByNodeType[ntSlug], tax)
		}
	}

	// Helper: resolve path for a node type slug.
	pathForType := func(slug string) string {
		switch slug {
		case "page":
			return "/admin/pages"
		case "post":
			return "/admin/posts"
		default:
			return "/admin/content/" + slug
		}
	}

	// Helper: resolve icon for a node type slug.
	iconForType := func(slug, fallback string) string {
		if fallback != "" {
			return fallback
		}
		switch slug {
		case "page":
			return "FileText"
		case "post":
			return "Newspaper"
		default:
			return "Boxes"
		}
	}

	// ── Parse extension manifests once and bucket items by section ──
	// Extensions declare placement via:
	//   admin_ui.menu.section      → "content" | "design" | "development" | "settings"
	//   admin_ui.settings_menu[]   → shortcut; always lands in the Settings section
	// Anything without a section (or an unknown value) is treated as top-level.
	extContent := []NavItem{}
	extDesign := []NavItem{}
	extDev := []NavItem{}
	extSettings := []NavItem{}
	extTopLevel := []NavItem{}
	// extSiteSettings folds into the kernel's "Site Settings" group as
	// children. Extensions like seo-extension contribute SEO and Robots
	// pages here without the kernel having to hardcode their slugs.
	extSiteSettings := []NavItem{}

	for _, ext := range exts {
		// Extensions opt into per-item capability gating with
		// `required_capability`. Empty / missing = always shown to any
		// admin_access user (the broad gate is enforced on the parent
		// /admin/api group, so extensions don't need to repeat it). When
		// set, the entry is hidden unless the user's role carries that
		// capability — e.g. `manage_settings` for an extension that
		// administers site-wide configuration. This is the extension
		// equivalent of the kernel's per-section gating below.
		var manifest struct {
			AdminUI *struct {
				Menu *struct {
					Label              string `json:"label"`
					Icon               string `json:"icon"`
					Section            string `json:"section"`
					RequiredCapability string `json:"required_capability"`
					Children           []struct {
						Label              string `json:"label"`
						Route              string `json:"route"`
						Icon               string `json:"icon"`
						RequiredCapability string `json:"required_capability"`
					} `json:"children"`
				} `json:"menu"`
				SettingsMenu []struct {
					Label              string `json:"label"`
					Route              string `json:"route"`
					Icon               string `json:"icon"`
					RequiredCapability string `json:"required_capability"`
				} `json:"settings_menu"`
				SiteSettingsMenu []struct {
					Label              string `json:"label"`
					Route              string `json:"route"`
					Icon               string `json:"icon"`
					RequiredCapability string `json:"required_capability"`
				} `json:"site_settings_menu"`
			} `json:"admin_ui"`
		}
		_ = json.Unmarshal(ext.Manifest, &manifest)
		if manifest.AdminUI == nil {
			continue
		}

		if m := manifest.AdminUI.Menu; m != nil && extNavPasses(user, m.Section, m.RequiredCapability) {
			var navItem NavItem
			emit := true
			if len(m.Children) > 0 {
				children := make([]NavItem, 0, len(m.Children))
				for _, c := range m.Children {
					// Children inherit the parent's section for default
					// capability resolution — a child of a settings menu
					// is still admin-only unless it declares otherwise.
					if !extNavPasses(user, m.Section, c.RequiredCapability) {
						continue
					}
					children = append(children, NavItem{
						ID:    "nav-ext-" + ext.Slug + "-" + c.Route,
						Label: c.Label,
						Icon:  c.Icon,
						Path:  c.Route,
					})
				}
				if len(children) == 0 {
					// Parent passed its own gate but every child filtered
					// out — drop the whole group rather than render an
					// empty expander.
					emit = false
				} else {
					navItem = NavItem{
						ID:       "nav-ext-" + ext.Slug,
						Label:    m.Label,
						Icon:     m.Icon,
						Children: children,
					}
				}
			} else {
				navItem = NavItem{
					ID:    "nav-ext-" + ext.Slug,
					Label: m.Label,
					Icon:  m.Icon,
					Path:  "/admin/ext/" + ext.Slug + "/",
				}
			}
			if emit {
				switch strings.ToLower(m.Section) {
				case "content":
					extContent = append(extContent, navItem)
				case "design":
					extDesign = append(extDesign, navItem)
				case "development", "dev":
					extDev = append(extDev, navItem)
				case "settings":
					extSettings = append(extSettings, navItem)
				default:
					extTopLevel = append(extTopLevel, navItem)
				}
			}
		}

		// settings_menu and site_settings_menu items always live under the
		// settings groups in the sidebar, so default to manage_settings
		// regardless of the manifest's top-level section. Extensions can
		// still override per-item via `required_capability`.
		for _, item := range manifest.AdminUI.SettingsMenu {
			if !extNavPasses(user, "settings_menu", item.RequiredCapability) {
				continue
			}
			extSettings = append(extSettings, NavItem{
				ID:    "nav-ext-" + ext.Slug + "-settings-" + item.Route,
				Label: item.Label,
				Icon:  item.Icon,
				Path:  item.Route,
			})
		}

		for _, item := range manifest.AdminUI.SiteSettingsMenu {
			if !extNavPasses(user, "settings_menu", item.RequiredCapability) {
				continue
			}
			extSiteSettings = append(extSiteSettings, NavItem{
				ID:    "nav-ext-" + ext.Slug + "-site-settings-" + item.Route,
				Label: item.Label,
				Icon:  item.Icon,
				Path:  item.Route,
			})
		}
	}

	// Helper: emit a section header + items only when at least one item
	// survived capability filtering. Without this, an editor with only
	// content access would still see "Design", "Development", "Settings"
	// headers stacked under each other with nothing under them.
	appendSection := func(headerID, headerLabel string, items []NavItem) {
		if len(items) == 0 {
			return
		}
		nav = append(nav, NavItem{ID: headerID, Label: headerLabel, IsSection: true})
		nav = append(nav, items...)
	}

	// ── Top level ──
	// Dashboard is always visible to admin_access users — the API gate is
	// what gets us here. Extension top-level items are pre-filtered above.
	nav = append(nav, NavItem{
		ID: "nav-dashboard", Label: "Dashboard", Icon: "LayoutDashboard",
		Path: "/admin/dashboard",
	})
	nav = append(nav, extTopLevel...)

	// ── Content section ──
	contentItems := []NavItem{}
	for _, nt := range nodeTypes {
		// Capability gate: skip types the current user has no read access to.
		// Resolves per-type override first then default_node_access — same
		// rules as the API guards, so the sidebar is exactly the set of types
		// the user could actually open.
		if !canReadNodeType(user, nt.Slug) {
			continue
		}

		// Build sub-items for this node type: main listing + any taxonomies.
		basePath := pathForType(nt.Slug)
		displayLabel := labelFor(nt)

		taxChildren := []NavItem{}
		taxChildren = append(taxChildren, NavItem{
			ID:    "nav-content-" + nt.Slug + "-all",
			Label: displayLabel,
			Icon:  iconForType(nt.Slug, nt.Icon),
			Path:  basePath,
		})
		for _, tax := range taxesByNodeType[nt.Slug] {
			taxLabel := tax.LabelPlural
			if taxLabel == "" {
				taxLabel = tax.Label
			}
			taxChildren = append(taxChildren, NavItem{
				ID:    "nav-content-" + nt.Slug + "-tax-" + tax.Slug,
				Label: taxLabel,
				Icon:  "Tags",
				Path:  "/admin/content/" + nt.Slug + "/taxonomies/" + tax.Slug,
			})
		}

		item := NavItem{
			ID:    "nav-content-" + nt.Slug,
			Label: displayLabel,
			Icon:  iconForType(nt.Slug, nt.Icon),
			Path:  basePath,
		}
		if len(taxChildren) > 1 {
			item.Children = taxChildren
		}
		contentItems = append(contentItems, item)
	}
	contentItems = append(contentItems, extContent...)
	appendSection("section-content", "Content", contentItems)

	// ── Design section ──
	// Per-item capability mapping mirrors the per-route guards in
	// internal/cms/{template,layout,block_type,layout_block,menu}_handler.go.
	// Templates/Layouts/Block Types/Layout Blocks all share manage_layouts
	// because they're variants of the same "design tokens" capability;
	// menus have their own manage_menus so editors with menu authority but
	// no template authority still get the relevant entry.
	designItems := []NavItem{}
	if hasNavCap(user, "manage_layouts") {
		designItems = append(designItems,
			NavItem{ID: "nav-templates", Label: "Templates", Icon: "FileCode", Path: "/admin/templates"},
			NavItem{ID: "nav-layouts", Label: "Layouts", Icon: "LayoutPanelTop", Path: "/admin/layouts"},
			NavItem{ID: "nav-block-types", Label: "Block Types", Icon: "Blocks", Path: "/admin/block-types"},
			NavItem{ID: "nav-layout-blocks", Label: "Layout Blocks", Icon: "Component", Path: "/admin/layout-blocks"},
		)
	}
	if hasNavCap(user, "manage_menus") {
		designItems = append(designItems,
			NavItem{ID: "nav-menus", Label: "Menus", Icon: "ListTree", Path: "/admin/menus"},
		)
	}
	designItems = append(designItems, extDesign...)
	appendSection("section-design", "Design", designItems)

	// ── Development section ──
	// All four entries mutate site-wide schema (content types, taxonomies,
	// themes, extensions) — manage_settings is the right gate. Editors and
	// authors should not see this section at all.
	devItems := []NavItem{}
	if hasNavCap(user, "manage_settings") {
		devItems = append(devItems,
			NavItem{ID: "nav-content-types", Label: "Content Types", Icon: "Shapes", Path: "/admin/content-types"},
			NavItem{ID: "nav-taxonomies", Label: "Taxonomies", Icon: "Tags", Path: "/admin/taxonomies"},
			NavItem{ID: "nav-themes", Label: "Themes", Icon: "Brush", Path: "/admin/themes"},
			NavItem{ID: "nav-extensions", Label: "Extensions", Icon: "Puzzle", Path: "/admin/extensions"},
		)
	}
	devItems = append(devItems, extDev...)
	appendSection("section-dev", "Development", devItems)

	// ── Settings section ──
	// Two top-level groups (Site Settings, Security) plus extension
	// contributions. Each group has its own visibility rules so the
	// section disappears entirely for users with no settings authority.
	settingsItems := []NavItem{}

	// Site Settings: kernel pages (General/Advanced/Languages) require
	// manage_settings. Extension-contributed children may set their own
	// required_capability; if any child is visible the group is shown.
	siteChildren := []NavItem{}
	if hasNavCap(user, "manage_settings") {
		siteChildren = append(siteChildren,
			NavItem{ID: "nav-site-settings-general", Label: "General", Icon: "Globe", Path: "/admin/settings/site/general"},
		)
	}
	siteChildren = append(siteChildren, extSiteSettings...)
	if hasNavCap(user, "manage_settings") {
		siteChildren = append(siteChildren,
			NavItem{ID: "nav-site-settings-advanced", Label: "Advanced", Icon: "FileCode", Path: "/admin/settings/site/advanced"},
			NavItem{ID: "nav-site-settings-languages", Label: "Languages", Icon: "Languages", Path: "/admin/settings/site/languages"},
		)
	}
	if len(siteChildren) > 0 {
		// First visible child becomes the group's default landing path.
		settingsItems = append(settingsItems, NavItem{
			ID:       "nav-site-settings",
			Label:    "Site Settings",
			Icon:     "Globe",
			Path:     siteChildren[0].Path,
			Children: siteChildren,
		})
	}

	// Security group — each child gated by its own capability so a
	// manage_users-only role sees Users but not Roles, MCP Tokens, or
	// security Settings. MCP tokens and security settings require
	// manage_settings because tokens grant CMS-wide control and security
	// settings tune login lockout / session policy.
	securityChildren := []NavItem{}
	if hasNavCap(user, "manage_users") {
		securityChildren = append(securityChildren,
			NavItem{ID: "nav-security-users", Label: "Users", Icon: "Users", Path: "/admin/security/users"})
	}
	if hasNavCap(user, "manage_roles") {
		securityChildren = append(securityChildren,
			NavItem{ID: "nav-security-roles", Label: "Roles", Icon: "Shield", Path: "/admin/security/roles"})
	}
	if hasNavCap(user, "manage_settings") {
		securityChildren = append(securityChildren,
			NavItem{ID: "nav-security-mcp-tokens", Label: "MCP Tokens", Icon: "Key", Path: "/admin/security/mcp-tokens"},
			NavItem{ID: "nav-security-settings", Label: "Settings", Icon: "Settings", Path: "/admin/security/settings"},
		)
	}
	if len(securityChildren) > 0 {
		settingsItems = append(settingsItems, NavItem{
			ID:       "nav-security",
			Label:    "Security",
			Icon:     "Shield",
			Path:     securityChildren[0].Path,
			Children: securityChildren,
		})
	}

	settingsItems = append(settingsItems, extSettings...)
	appendSection("section-settings", "Settings", settingsItems)

	return nav
}
