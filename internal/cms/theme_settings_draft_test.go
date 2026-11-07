package cms

import (
	"encoding/json"
	"testing"
)

// The admin preview lays unsaved theme settings over the stored ones for one
// render. It must show the draft values, leave other fields alone, ignore
// anything the theme doesn't declare, and never touch the map it was given
// (that map comes from the settings store).
func TestApplyThemeSettingsDraft(t *testing.T) {
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{
		{Slug: "header", Fields: []ThemeSettingsField{
			{Name: "brand_name", Type: "string"},
			{Name: "show_pill", Type: "toggle"},
		}},
		{Slug: "footer", Fields: []ThemeSettingsField{{Name: "copy", Type: "string"}}},
	})
	h := &PublicHandler{themeSettingsRegistry: reg}

	stored := map[string]map[string]any{
		"header": {"brand_name": "Old", "show_pill": true},
		"footer": {"copy": "© old"},
	}
	draft := map[string]map[string]json.RawMessage{
		"header": {
			"brand_name": json.RawMessage(`"New"`),
			"nope":       json.RawMessage(`"ignored"`),
		},
		"missing": {"x": json.RawMessage(`"ignored"`)},
	}

	got := h.applyThemeSettingsDraft(stored, draft)

	if got["header"]["brand_name"] != "New" {
		t.Errorf("brand_name = %v, want New", got["header"]["brand_name"])
	}
	if got["header"]["show_pill"] != true {
		t.Errorf("untouched field changed: %v", got["header"]["show_pill"])
	}
	if got["footer"]["copy"] != "© old" {
		t.Errorf("untouched page changed: %v", got["footer"]["copy"])
	}
	if _, ok := got["header"]["nope"]; ok {
		t.Error("undeclared field leaked into the render context")
	}
	if _, ok := got["missing"]; ok {
		t.Error("undeclared page leaked into the render context")
	}
	if stored["header"]["brand_name"] != "Old" {
		t.Errorf("stored map was mutated: %v", stored["header"]["brand_name"])
	}
}
