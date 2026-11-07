package field_types

import (
	"encoding/json"
	"errors"
	"testing"
)

func TestValidateEmoji(t *testing.T) {
	valid := []string{
		"", "  ", "🍜", "🇻🇳", "🇻🇳🍜", "👩‍👩‍👧‍👦", "1️⃣", "#️⃣", "❤️", "👍🏽",
		"🏴󠁧󠁢󠁳󠁣󠁴󠁿", " 🍜 ", "🍜🍜🍜🍜",
	}
	for _, s := range valid {
		if err := ValidateEmoji(s); err != nil {
			t.Errorf("ValidateEmoji(%q) = %v, want ok", s, err)
		}
	}
	invalid := []string{
		"a", "1", "hello", "🍜a", "<b>🍜</b>", "<script>", "🍜&amp;", "🍜\"",
		"🍜 🍜", "🍜\u0007🍜", "🍜🍜🍜🍜🍜", "\u202e🍜", string([]byte{0xff, 0xfe}),
	}
	for _, s := range invalid {
		if err := ValidateEmoji(s); err == nil {
			t.Errorf("ValidateEmoji(%q) = nil, want error", s)
		}
	}
}

func TestValidateValue(t *testing.T) {
	if err := ValidateValue("emoji", 5, nil); err == nil {
		t.Error("non-string emoji should fail")
	}
	if err := ValidateValue("emoji", nil, nil); err != nil {
		t.Error("nil emoji should pass")
	}
	if err := ValidateValue("string", "<b>anything</b>", nil); err != nil {
		t.Error("other types are not validated")
	}
	cfg := map[string]any{"providers": []any{"lucide"}}
	if err := ValidateValue("icon", "lucide:map-pin", cfg); err != nil {
		t.Errorf("allowed provider: %v", err)
	}
	if err := ValidateValue("icon", "material:restaurant", cfg); err == nil {
		t.Error("disallowed provider should fail")
	}
	if err := ValidateValue("icon", "restaurant", nil); err != nil {
		t.Errorf("bare legacy material name: %v", err)
	}
}

func TestValidateFieldValuesNested(t *testing.T) {
	schema := json.RawMessage(`[
		{"name":"title","type":"string"},
		{"name":"badge","type":"emoji"},
		{"name":"cta","type":"object","fields":[{"name":"icon","type":"icon"}]},
		{"name":"items","type":"array","fields":[{"name":"icon","type":"icon","providers":["lucide"]}]}
	]`)
	ok := map[string]any{
		"title": "<b>free text</b>",
		"badge": "🍜",
		"cta":   map[string]any{"icon": "material:restaurant"},
		"items": []any{map[string]any{"icon": "lucide:map-pin"}, map[string]any{"icon": ""}},
	}
	if err := ValidateFieldValues(schema, ok); err != nil {
		t.Fatalf("valid values rejected: %v", err)
	}
	bad := map[string]any{
		"items": []any{map[string]any{"icon": "lucide:map-pin"}, map[string]any{"icon": "material:restaurant"}},
	}
	err := ValidateFieldValues(schema, bad)
	var fe *FieldValueError
	if !errors.As(err, &fe) || fe.Path != "items[1].icon" {
		t.Fatalf("expected items[1].icon error, got %v", err)
	}
	if err := ValidateFieldValues(schema, map[string]any{"badge": "text"}); err == nil {
		t.Fatal("text in emoji field should fail")
	}
	if !SchemaHasStrictFields(schema) || SchemaHasStrictFields(json.RawMessage(`[{"name":"x","type":"string"}]`)) {
		t.Fatal("SchemaHasStrictFields mismatch")
	}
}
