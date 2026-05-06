package auth

import (
	"testing"

	"squilla/internal/models"
)

// userWithRoleCaps builds a minimal user whose role carries the given
// capabilities JSON. Local helper — auth and sdui packages each have
// their own near-identical version because the test fixtures aren't
// worth a shared internal/testutil helper for.
func userWithRoleCaps(caps string) *models.User {
	return &models.User{
		ID:   1,
		Role: models.Role{Slug: "tester", Capabilities: models.JSONB(caps)},
	}
}

func TestNewCapabilityRegistry_SeedsKernelBuiltins(t *testing.T) {
	r := NewCapabilityRegistry()
	for _, key := range []string{
		"admin_access", "manage_users", "manage_roles",
		"manage_settings", "manage_menus", "manage_layouts",
	} {
		if !r.Has(key) {
			t.Errorf("kernel capability %q missing from fresh registry", key)
		}
	}
}

func TestCapabilityRegistry_RegisterAndUnregisterBySource(t *testing.T) {
	r := NewCapabilityRegistry()

	r.Register(Capability{Key: "manage_email", Label: "Manage Email", Source: "extension:email-manager"})
	r.Register(Capability{Key: "view_email_logs", Label: "View Email Logs", Source: "extension:email-manager"})
	r.Register(Capability{Key: "manage_forms", Label: "Manage Forms", Source: "extension:forms"})

	if !r.Has("manage_email") || !r.Has("manage_forms") {
		t.Fatal("registered capabilities should be present")
	}

	r.UnregisterBySource("extension:email-manager")

	if r.Has("manage_email") || r.Has("view_email_logs") {
		t.Error("UnregisterBySource should remove every cap matching the source")
	}
	if !r.Has("manage_forms") {
		t.Error("UnregisterBySource must not touch other sources")
	}
	if !r.Has("admin_access") {
		t.Error("UnregisterBySource must not touch kernel built-ins")
	}
}

func TestCapabilityRegistry_RefuseToUnregisterKernel(t *testing.T) {
	r := NewCapabilityRegistry()
	// Even if a buggy caller passes "kernel" as a source, built-ins
	// must survive — losing manage_users at runtime would be a serious
	// availability hit.
	r.UnregisterBySource("kernel")
	if !r.Has("manage_users") {
		t.Fatal("UnregisterBySource('kernel') must be a no-op")
	}
}

func TestCapabilityRegistry_ListIsSortedKernelFirst(t *testing.T) {
	r := NewCapabilityRegistry()
	r.Register(Capability{Key: "manage_email", Source: "extension:email-manager"})
	r.Register(Capability{Key: "manage_forms", Source: "extension:forms"})
	r.Register(Capability{Key: "manage_homepage", Source: "theme:hello-vietnam"})

	list := r.List()
	if len(list) == 0 {
		t.Fatal("List should return entries")
	}
	// First N entries should all be kernel.
	seenNonKernel := false
	for _, c := range list {
		if c.Source == "kernel" {
			if seenNonKernel {
				t.Errorf("kernel cap %q appeared after a non-kernel cap — list ordering broken", c.Key)
			}
			continue
		}
		seenNonKernel = true
	}
}

func TestHasCapability_WildcardGrantsExtensionCaps(t *testing.T) {
	user := userWithRoleCaps(`{"*":true,"admin_access":true}`)
	if !HasCapability(user, "manage_email") {
		t.Error("wildcard role should pass HasCapability for unknown extension capability")
	}
	if !HasCapability(user, "view_email_logs") {
		t.Error("wildcard role should pass HasCapability for any other extension capability")
	}
}

func TestHasCapability_WildcardDoesNotBypassAdminAccess(t *testing.T) {
	// "*" must NOT grant admin_access — that flag is what gates
	// access to the admin shell at all. A misconfigured wildcard on a
	// public-facing role mustn't quietly let it in.
	user := userWithRoleCaps(`{"*":true,"admin_access":false}`)
	if HasCapability(user, "admin_access") {
		t.Error("wildcard must not grant admin_access — explicit flag wins")
	}
}
