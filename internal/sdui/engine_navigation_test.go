package sdui

import (
	"testing"

	"squilla/internal/models"
)

// userWithCaps builds a minimal user whose role carries the given capabilities
// JSON. Tests use it to exercise capability-driven sidebar filtering without
// touching a database.
func userWithCaps(caps string) *models.User {
	return &models.User{
		ID: 1,
		Role: models.Role{
			Slug:         "tester",
			Capabilities: models.JSONB(caps),
		},
	}
}

func TestCanReadNodeType(t *testing.T) {
	tests := []struct {
		name string
		caps string
		slug string
		want bool
	}{
		{
			name: "default write all → can read everything",
			caps: `{"default_node_access":{"access":"write","scope":"all"}}`,
			slug: "post",
			want: true,
		},
		{
			name: "default read all → can read",
			caps: `{"default_node_access":{"access":"read","scope":"all"}}`,
			slug: "post",
			want: true,
		},
		{
			name: "default none → cannot read",
			caps: `{"default_node_access":{"access":"none","scope":"all"}}`,
			slug: "post",
			want: false,
		},
		{
			name: "per-type override none beats default write",
			caps: `{"default_node_access":{"access":"write","scope":"all"},"nodes":{"testimonial":{"access":"none","scope":"all"}}}`,
			slug: "testimonial",
			want: false,
		},
		{
			name: "per-type override write beats default none",
			caps: `{"default_node_access":{"access":"none","scope":"all"},"nodes":{"page":{"access":"write","scope":"all"}}}`,
			slug: "page",
			want: true,
		},
		{
			name: "per-type override only applies to that type",
			caps: `{"default_node_access":{"access":"write","scope":"all"},"nodes":{"testimonial":{"access":"none","scope":"all"}}}`,
			slug: "post",
			want: true,
		},
		{
			name: "missing capabilities → cannot read",
			caps: `{}`,
			slug: "post",
			want: false,
		},
		{
			name: "malformed capabilities JSON → cannot read",
			caps: `not json`,
			slug: "post",
			want: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := canReadNodeType(userWithCaps(tc.caps), tc.slug)
			if got != tc.want {
				t.Fatalf("canReadNodeType(%q) = %v, want %v", tc.slug, got, tc.want)
			}
		})
	}
}

func TestCanReadNodeType_NilUser(t *testing.T) {
	if canReadNodeType(nil, "post") {
		t.Fatal("nil user should not be able to read any node type")
	}
}

// hasNavItemForSlug walks the flat nav list looking for the leaf entry that
// the navigation builder produces for a node type (id "nav-content-<slug>").
func hasNavItemForSlug(nav []NavItem, slug string) bool {
	target := "nav-content-" + slug
	for _, item := range nav {
		if item.ID == target {
			return true
		}
		for _, child := range item.Children {
			if child.ID == target {
				return true
			}
		}
	}
	return false
}

func TestBuildNavigation_FiltersNodeTypesByCapability(t *testing.T) {
	e := &Engine{}
	nodeTypes := []models.NodeType{
		{Slug: "page", Label: "Page", LabelPlural: "Pages"},
		{Slug: "post", Label: "Post", LabelPlural: "Posts"},
		{Slug: "testimonial", Label: "Testimonial", LabelPlural: "Testimonials"},
	}

	t.Run("admin with write/all sees every type", func(t *testing.T) {
		user := userWithCaps(`{"default_node_access":{"access":"write","scope":"all"}}`)
		nav := e.buildNavigation(user, nodeTypes, nil, nil)
		for _, slug := range []string{"page", "post", "testimonial"} {
			if !hasNavItemForSlug(nav, slug) {
				t.Errorf("admin nav missing %q", slug)
			}
		}
	})

	t.Run("user with testimonial=none does not see testimonial", func(t *testing.T) {
		user := userWithCaps(`{
			"default_node_access":{"access":"write","scope":"all"},
			"nodes":{"testimonial":{"access":"none","scope":"all"}}
		}`)
		nav := e.buildNavigation(user, nodeTypes, nil, nil)
		if hasNavItemForSlug(nav, "testimonial") {
			t.Error("nav still contains testimonial entry after access set to none")
		}
		// And other types still appear.
		for _, slug := range []string{"page", "post"} {
			if !hasNavItemForSlug(nav, slug) {
				t.Errorf("nav missing %q after testimonial denial", slug)
			}
		}
	})

	t.Run("user with default none sees nothing", func(t *testing.T) {
		user := userWithCaps(`{"default_node_access":{"access":"none","scope":"all"}}`)
		nav := e.buildNavigation(user, nodeTypes, nil, nil)
		for _, slug := range []string{"page", "post", "testimonial"} {
			if hasNavItemForSlug(nav, slug) {
				t.Errorf("nav unexpectedly contains %q for default-none user", slug)
			}
		}
	})
}

// hasItem walks a flat nav slice (and one level of children) looking for an
// item by ID. Used by capability-section tests below.
func hasItem(nav []NavItem, id string) bool {
	for _, item := range nav {
		if item.ID == id {
			return true
		}
		for _, child := range item.Children {
			if child.ID == id {
				return true
			}
		}
	}
	return false
}

// hasSection returns true if a section header with the given ID is present.
// Sections are emitted only when at least one item under them survived
// capability filtering, so this doubles as an "is the section visible" check.
func hasSection(nav []NavItem, id string) bool {
	for _, item := range nav {
		if item.ID == id && item.IsSection {
			return true
		}
	}
	return false
}

// memberCaps mirrors the seeded "member" role: no admin_access and read-only
// node access. This is the default registration role and the lowest-trust
// authenticated principal in the system.
const memberCaps = `{
  "admin_access":false,
  "manage_users":false,
  "manage_roles":false,
  "manage_settings":false,
  "manage_menus":false,
  "manage_layouts":false,
  "default_node_access":{"access":"read","scope":"all"}
}`

// adminCaps mirrors the seeded "admin" role.
const adminCaps = `{
  "admin_access":true,
  "manage_users":true,
  "manage_roles":true,
  "manage_settings":true,
  "manage_menus":true,
  "manage_layouts":true,
  "default_node_access":{"access":"write","scope":"all"}
}`

// editorCaps mirrors the seeded "editor" role: admin_access but no
// manage_users/manage_roles/manage_settings — exactly the partial-privilege
// case the user reported ("see entire security menu I shouldn't have").
const editorCaps = `{
  "admin_access":true,
  "manage_users":false,
  "manage_roles":false,
  "manage_settings":false,
  "manage_menus":true,
  "manage_layouts":false,
  "default_node_access":{"access":"write","scope":"all"}
}`

func TestBuildNavigation_AdminSeesEverySection(t *testing.T) {
	e := &Engine{}
	user := userWithCaps(adminCaps)
	nav := e.buildNavigation(user, nil, nil, nil)

	for _, id := range []string{"section-design", "section-dev", "section-settings"} {
		if !hasSection(nav, id) {
			t.Errorf("admin missing section %q", id)
		}
	}
	for _, id := range []string{
		"nav-templates", "nav-layouts", "nav-block-types", "nav-layout-blocks", "nav-menus",
		"nav-content-types", "nav-taxonomies", "nav-themes", "nav-extensions",
		"nav-site-settings", "nav-security",
		"nav-security-users", "nav-security-roles", "nav-security-mcp-tokens", "nav-security-settings",
	} {
		if !hasItem(nav, id) {
			t.Errorf("admin missing nav item %q", id)
		}
	}
}

func TestBuildNavigation_EditorHidesAdminOnlyItems(t *testing.T) {
	e := &Engine{}
	user := userWithCaps(editorCaps)
	nav := e.buildNavigation(user, nil, nil, nil)

	// Editor has manage_menus but not manage_layouts → only Menus visible
	// in Design.
	if !hasItem(nav, "nav-menus") {
		t.Error("editor with manage_menus should see Menus")
	}
	for _, id := range []string{"nav-templates", "nav-layouts", "nav-block-types", "nav-layout-blocks"} {
		if hasItem(nav, id) {
			t.Errorf("editor without manage_layouts should NOT see %q", id)
		}
	}

	// No manage_settings → Development section disappears entirely.
	if hasSection(nav, "section-dev") {
		t.Error("editor without manage_settings should not see Development section")
	}
	for _, id := range []string{"nav-content-types", "nav-taxonomies", "nav-themes", "nav-extensions"} {
		if hasItem(nav, id) {
			t.Errorf("editor should NOT see %q", id)
		}
	}

	// Settings section: no Site Settings (manage_settings), no Security
	// children (manage_users / manage_roles / manage_settings all false).
	for _, id := range []string{"nav-site-settings", "nav-security"} {
		if hasItem(nav, id) {
			t.Errorf("editor should NOT see %q", id)
		}
	}
	if hasSection(nav, "section-settings") {
		t.Error("editor with no settings caps should not see Settings section")
	}
}

func TestBuildNavigation_ManageUsersOnlySeesUsersOnly(t *testing.T) {
	e := &Engine{}
	user := userWithCaps(`{
		"admin_access":true,
		"manage_users":true,
		"manage_roles":false,
		"manage_settings":false
	}`)
	nav := e.buildNavigation(user, nil, nil, nil)

	if !hasItem(nav, "nav-security-users") {
		t.Error("manage_users role should see Users")
	}
	for _, id := range []string{"nav-security-roles", "nav-security-mcp-tokens", "nav-security-settings"} {
		if hasItem(nav, id) {
			t.Errorf("manage_users-only role should NOT see %q", id)
		}
	}
	if !hasItem(nav, "nav-security") {
		t.Error("Security parent should still appear when at least one child is visible")
	}
}

func TestBuildNavigation_MemberSeesNoAdminItems(t *testing.T) {
	// A logged-in member should never reach this builder in practice
	// (the API gate rejects them at /admin/api/sdui/boot before we get
	// here) — but if anyone routes around the gate, the nav must not
	// gleefully serve up the entire admin map. This is the inner ring of
	// defense in depth.
	e := &Engine{}
	user := userWithCaps(memberCaps)
	nav := e.buildNavigation(user, nil, nil, nil)

	for _, id := range []string{
		"section-design", "section-dev", "section-settings",
		"nav-templates", "nav-layouts", "nav-menus",
		"nav-content-types", "nav-themes", "nav-extensions",
		"nav-site-settings", "nav-security",
	} {
		if hasItem(nav, id) || hasSection(nav, id) {
			t.Errorf("member should not see %q in nav", id)
		}
	}
}

// Mirrors the actual seeded extensions the user can install today. The
// member-with-admin_access scenario the bug report exposed (forms / media
// / email / SEO all visible despite read-only content access) is exactly
// what these defaults are meant to stop.
func TestBuildNavigation_ExtensionDefaultsBySection(t *testing.T) {
	e := &Engine{}
	exts := []models.Extension{
		// Forms lives in the Content section. With our defaults it
		// should require write node access — read-only members lose it.
		{
			Slug: "forms",
			Manifest: models.JSONB(`{"admin_ui":{"menu":{
				"label":"Forms","icon":"FormInput","section":"content"
			}}}`),
		},
		// Media lives in the Content section too — same default rule.
		{
			Slug: "media-manager",
			Manifest: models.JSONB(`{"admin_ui":{"menu":{
				"label":"Media","icon":"Image","section":"content"
			}}}`),
		},
		// Email lives in Settings — gated by manage_settings.
		{
			Slug: "email-manager",
			Manifest: models.JSONB(`{"admin_ui":{"menu":{
				"label":"Email","icon":"Mail","section":"settings"
			}}}`),
		},
		// SEO ships pages via site_settings_menu — gated by manage_settings.
		{
			Slug: "seo-extension",
			Manifest: models.JSONB(`{"admin_ui":{"site_settings_menu":[
				{"label":"SEO","route":"/admin/settings/site/seo","icon":"Globe"}
			]}}`),
		},
	}

	t.Run("read-only member does not see forms / media / email / seo", func(t *testing.T) {
		user := userWithCaps(`{
			"admin_access":true,
			"manage_users":false,
			"manage_roles":false,
			"manage_settings":false,
			"manage_menus":false,
			"manage_layouts":false,
			"default_node_access":{"access":"read","scope":"all"}
		}`)
		nav := e.buildNavigation(user, nil, nil, exts)

		for _, id := range []string{
			"nav-ext-forms",
			"nav-ext-media-manager",
			"nav-ext-email-manager",
		} {
			if hasItem(nav, id) {
				t.Errorf("read-only member should NOT see %q", id)
			}
		}
		// SEO contributes to Site Settings only — without manage_settings
		// the entire Site Settings group should disappear.
		if hasItem(nav, "nav-site-settings") {
			t.Error("Site Settings group should be hidden when no child is visible")
		}
		if hasSection(nav, "section-settings") {
			t.Error("Settings section header should be suppressed when empty")
		}
	})

	t.Run("editor sees media but not forms/email/seo", func(t *testing.T) {
		// Editor: write/all node access → media (content section) shows;
		// no manage_settings → forms, email, seo hidden. Forms is content-
		// section but the kernel default for content is "any write access",
		// which an editor satisfies. Verifies the workflow regression
		// concern: editors keep media; admin-tooling stays admin-only.
		user := userWithCaps(editorCaps)
		nav := e.buildNavigation(user, nil, nil, exts)

		if !hasItem(nav, "nav-ext-media-manager") {
			t.Error("editor with write/all node access should see Media")
		}
		if !hasItem(nav, "nav-ext-forms") {
			// Forms is content-section; default = any write access.
			t.Error("editor should see Forms (content-section default)")
		}
		if hasItem(nav, "nav-ext-email-manager") {
			t.Error("editor without manage_settings should NOT see Email")
		}
	})

	t.Run("admin sees all", func(t *testing.T) {
		user := userWithCaps(adminCaps)
		nav := e.buildNavigation(user, nil, nil, exts)
		for _, id := range []string{
			"nav-ext-forms", "nav-ext-media-manager", "nav-ext-email-manager",
		} {
			if !hasItem(nav, id) {
				t.Errorf("admin should see %q", id)
			}
		}
		if !hasItem(nav, "nav-site-settings") {
			t.Error("admin should see Site Settings group")
		}
	})

	t.Run("explicit empty required_capability opts out of default gate", func(t *testing.T) {
		// Escape hatch — extensions like an "About" or "Help" menu may
		// genuinely want to be visible to every admin_access user. They
		// must declare required_capability:"" explicitly to override the
		// section default. We pass empty section + empty cap → open.
		extsOpen := []models.Extension{{
			Slug: "about",
			Manifest: models.JSONB(`{"admin_ui":{"menu":{
				"label":"About","icon":"Info","required_capability":""
			}}}`),
		}}
		user := userWithCaps(`{"admin_access":true,"default_node_access":{"access":"read","scope":"all"}}`)
		nav := e.buildNavigation(user, nil, nil, extsOpen)
		if !hasItem(nav, "nav-ext-about") {
			t.Error("extension with no section and empty required_capability should be visible to all admin_access users")
		}
	})
}

func TestBuildNavigation_ExtensionItemHonorsRequiredCapability(t *testing.T) {
	e := &Engine{}
	// Extension declaring required_capability explicitly — overrides any
	// section default. Pairs with TestBuildNavigation_ExtensionDefaultsBySection
	// which exercises the implicit per-section default path.
	exts := []models.Extension{
		{
			Slug: "secret-tool",
			Manifest: models.JSONB(`{
				"admin_ui":{"menu":{
					"label":"Secret Tool",
					"icon":"Lock",
					"section":"settings",
					"required_capability":"manage_settings"
				}}
			}`),
		},
	}

	t.Run("user without manage_settings does not see required_capability=manage_settings", func(t *testing.T) {
		user := userWithCaps(`{"admin_access":true,"manage_settings":false}`)
		nav := e.buildNavigation(user, nil, nil, exts)
		if hasItem(nav, "nav-ext-secret-tool") {
			t.Error("extension nav item with required_capability=manage_settings should be hidden")
		}
	})

	t.Run("user with manage_settings sees the required_capability=manage_settings entry", func(t *testing.T) {
		user := userWithCaps(`{"admin_access":true,"manage_settings":true}`)
		nav := e.buildNavigation(user, nil, nil, exts)
		if !hasItem(nav, "nav-ext-secret-tool") {
			t.Error("manage_settings user should see Secret Tool")
		}
	})
}
