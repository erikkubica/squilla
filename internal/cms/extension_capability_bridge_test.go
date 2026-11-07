package cms

import (
	"reflect"
	"testing"
)

func TestParseManifestCapabilities(t *testing.T) {
	data := []byte(`{
		"admin_ui": {
			"capabilities": [
				{"key": "view_x", "label": "View X", "default_roles": [" editor ", "editor", "", "author"]},
				{"key": "manage_x", "label": "Manage X"},
				{"key": "", "label": "No key"},
				{"key": "*", "label": "Wildcard is kernel-owned"}
			]
		}
	}`)
	caps, err := parseManifestCapabilities(data)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(caps) != 2 {
		t.Fatalf("want 2 capabilities, got %d: %+v", len(caps), caps)
	}
	if caps[0].Key != "view_x" || !reflect.DeepEqual(caps[0].DefaultRoles, []string{"editor", "author"}) {
		t.Errorf("view_x default roles not normalised: %+v", caps[0])
	}
	if caps[1].Key != "manage_x" || len(caps[1].DefaultRoles) != 0 {
		t.Errorf("manage_x should have no default roles: %+v", caps[1])
	}
}

func TestParseManifestCapabilitiesNoAdminUI(t *testing.T) {
	caps, err := parseManifestCapabilities([]byte(`{"slug":"x"}`))
	if err != nil || caps != nil {
		t.Fatalf("want nil, nil; got %+v, %v", caps, err)
	}
}

func TestGrantDefaultRolesWithoutDBIsNoop(t *testing.T) {
	b := &ExtensionCapabilityBridge{}
	n, err := b.grantDefaultRoles("view_x", []string{"editor"})
	if n != 0 || err != nil {
		t.Fatalf("want 0, nil; got %d, %v", n, err)
	}
}
