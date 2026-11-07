package field_types

import (
	"encoding/json"
	"fmt"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/rivo/uniseg"

	"squilla/internal/icons"
)

// Value validation for field types whose stored value has a strict shape.
// Only emoji and icon are checked today; every other type passes through
// untouched (their editors already constrain the input, and existing
// content must keep saving).

const (
	// MaxEmojiGraphemes is the most user-perceived characters an emoji
	// field accepts — enough for a flag plus a dish ("🇻🇳🍜"), not a
	// sentence.
	MaxEmojiGraphemes = 4
	maxEmojiBytes     = 64
)

// ValidateEmoji accepts an empty string or a short run of emoji. Each
// grapheme cluster must contain a non-ASCII rune (so "1️⃣" passes but "1"
// does not), HTML metacharacters, whitespace and control characters are
// rejected outright.
func ValidateEmoji(s string) error {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	if !utf8.ValidString(s) {
		return fmt.Errorf("emoji must be valid UTF-8")
	}
	if len(s) > maxEmojiBytes {
		return fmt.Errorf("emoji value is too long")
	}
	for _, r := range s {
		switch {
		case strings.ContainsRune("<>&\"'`", r):
			return fmt.Errorf("emoji must not contain HTML")
		case unicode.IsSpace(r) || unicode.IsControl(r):
			return fmt.Errorf("emoji must not contain spaces or control characters")
		case unicode.Is(unicode.Cf, r) && !allowedEmojiFormatRune(r):
			return fmt.Errorf("emoji contains an invalid formatting character")
		}
	}
	g := uniseg.NewGraphemes(s)
	n := 0
	for g.Next() {
		n++
		if n > MaxEmojiGraphemes {
			return fmt.Errorf("emoji field accepts at most %d emoji", MaxEmojiGraphemes)
		}
		ascii := true
		for _, r := range g.Runes() {
			if r >= utf8.RuneSelf {
				ascii = false
				break
			}
		}
		if ascii {
			return fmt.Errorf("emoji field accepts emoji only, not text (%q)", g.Str())
		}
	}
	return nil
}

// allowedEmojiFormatRune lists the Cf characters that appear inside valid
// emoji sequences: zero-width joiner and the tag characters used by
// subdivision flags (🏴󠁧󠁢󠁳󠁣󠁴󠁿).
func allowedEmojiFormatRune(r rune) bool {
	return r == 0x200D || (r >= 0xE0020 && r <= 0xE007F)
}

// ValidateIcon checks an icon field value ("provider:name", or a bare
// legacy Material Symbols name). providers restricts the allowed sets;
// empty means every bundled provider.
func ValidateIcon(s string, providers []string) error {
	return icons.Validate(s, providers)
}

// ValidateValue validates a single field value against its type. config
// is the field definition (used for the icon field's `providers`). nil
// and empty values are always accepted.
func ValidateValue(fieldType string, value any, config map[string]any) error {
	switch fieldType {
	case "emoji", "icon":
	default:
		return nil
	}
	if value == nil {
		return nil
	}
	s, ok := value.(string)
	if !ok {
		return fmt.Errorf("%s field value must be a string", fieldType)
	}
	if fieldType == "emoji" {
		return ValidateEmoji(s)
	}
	return ValidateIcon(s, ProvidersOf(config))
}

// ProvidersOf reads the icon field's `providers` option (array of strings,
// or a single comma-separated string). nil = all providers.
func ProvidersOf(config map[string]any) []string {
	if config == nil {
		return nil
	}
	var out []string
	switch v := config["providers"].(type) {
	case []any:
		for _, p := range v {
			if s, ok := p.(string); ok && strings.TrimSpace(s) != "" {
				out = append(out, strings.TrimSpace(s))
			}
		}
	case []string:
		for _, s := range v {
			if strings.TrimSpace(s) != "" {
				out = append(out, strings.TrimSpace(s))
			}
		}
	case string:
		for _, s := range strings.Split(v, ",") {
			if strings.TrimSpace(s) != "" {
				out = append(out, strings.TrimSpace(s))
			}
		}
	}
	return out
}

// FieldValueError names the offending field path.
type FieldValueError struct {
	Path string
	Err  error
}

func (e *FieldValueError) Error() string { return e.Path + ": " + e.Err.Error() }
func (e *FieldValueError) Unwrap() error { return e.Err }

// ValidateFieldValues walks values against a field schema (the JSON array
// stored on node types, block types and layout blocks) and validates every
// emoji/icon value, recursing into object/group and array/repeater fields.
// Returns the first error as a *FieldValueError. A schema that doesn't
// parse is ignored — schema validity is enforced elsewhere.
func ValidateFieldValues(schema json.RawMessage, values map[string]any) error {
	if len(schema) == 0 || len(values) == 0 {
		return nil
	}
	var defs []map[string]any
	if err := json.Unmarshal(schema, &defs); err != nil {
		return nil
	}
	return validateFieldDefs("", defs, values)
}

// SchemaHasStrictFields reports whether a field schema declares any emoji
// or icon field (at any depth). Callers use it to skip the walk entirely
// for the common case.
func SchemaHasStrictFields(schema json.RawMessage) bool {
	return len(schema) > 0 && (strings.Contains(string(schema), `"emoji"`) || strings.Contains(string(schema), `"icon"`))
}

func validateFieldDefs(prefix string, defs []map[string]any, values map[string]any) error {
	for _, def := range defs {
		name, _ := def["name"].(string)
		if name == "" {
			name, _ = def["key"].(string)
		}
		if name == "" {
			continue
		}
		val, ok := values[name]
		if !ok || val == nil {
			continue
		}
		path := name
		if prefix != "" {
			path = prefix + "." + name
		}
		typ, _ := def["type"].(string)
		switch typ {
		case "emoji", "icon":
			if err := ValidateValue(typ, val, def); err != nil {
				return &FieldValueError{Path: path, Err: err}
			}
		case "object", "group":
			if m, ok := val.(map[string]any); ok {
				if err := validateFieldDefs(path, subDefs(def), m); err != nil {
					return err
				}
			}
		case "array", "repeater":
			if arr, ok := val.([]any); ok {
				sub := subDefs(def)
				for i, item := range arr {
					if m, ok := item.(map[string]any); ok {
						if err := validateFieldDefs(fmt.Sprintf("%s[%d]", path, i), sub, m); err != nil {
							return err
						}
					}
				}
			}
		}
	}
	return nil
}

func subDefs(def map[string]any) []map[string]any {
	raw, _ := def["fields"].([]any)
	if raw == nil {
		raw, _ = def["sub_fields"].([]any)
	}
	out := make([]map[string]any, 0, len(raw))
	for _, r := range raw {
		if m, ok := r.(map[string]any); ok {
			out = append(out, m)
		}
	}
	return out
}
