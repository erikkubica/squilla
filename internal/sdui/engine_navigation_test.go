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
