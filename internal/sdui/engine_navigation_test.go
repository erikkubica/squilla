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

func TestBuildNavigation_ExtensionItemHonorsRequiredCapability(t *testing.T) {
	e := &Engine{}
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
		{
			Slug: "open-tool",
			Manifest: models.JSONB(`{
				"admin_ui":{"menu":{
					"label":"Open Tool",
					"icon":"Globe",
					"section":"settings"
				}}
			}`),
		},
	}

	t.Run("user without manage_settings sees only the open extension", func(t *testing.T) {
		user := userWithCaps(`{"admin_access":true,"manage_settings":false}`)
		nav := e.buildNavigation(user, nil, nil, exts)
		if hasItem(nav, "nav-ext-secret-tool") {
			t.Error("extension nav item with required_capability=manage_settings should be hidden")
		}
		if !hasItem(nav, "nav-ext-open-tool") {
			t.Error("extension nav item without required_capability should still be shown")
		}
	})

	t.Run("user with manage_settings sees both", func(t *testing.T) {
		user := userWithCaps(`{"admin_access":true,"manage_settings":true}`)
		nav := e.buildNavigation(user, nil, nil, exts)
		for _, id := range []string{"nav-ext-secret-tool", "nav-ext-open-tool"} {
			if !hasItem(nav, id) {
				t.Errorf("manage_settings user should see %q", id)
			}
		}
	})
}
