package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

// ThemeSettingsPage is a parsed settings page resolved from disk. It mirrors
// the field-schema shape used by node types and content blocks.
type ThemeSettingsPage struct {
	Slug        string               `json:"slug"`
	Name        string               `json:"name"`
	Icon        string               `json:"icon,omitempty"`
	Description string               `json:"description,omitempty"`
	Fields      []ThemeSettingsField `json:"fields"`
}

// ThemeSettingsField describes one field on a settings page.
//
// Default uses json.RawMessage so any default value (string, number, bool,
// object) round-trips without coercion.
//
// The struct fields use the legacy names (Key, Label, Default, Help) and
// the wire format keeps `"key"`, `"label"`, `"default"`, `"help"` so the
// admin UI continues to read the same shape. UnmarshalJSON accepts the
// canonical aliases (`name`, `title`, `initialValue`, `description`) plus
// legacy type aliases so disk JSON files written with the modern
// vocabulary load correctly.
//
// Config and Raw are populated post-unmarshal so renderer-specific extras
// (options, min/max, help, placeholder, etc.) survive without core having
// to enumerate them. They're skipped on encode so wire format matches input.
type ThemeSettingsField struct {
	Key     string          `json:"key"`
	Label   string          `json:"label"`
	Type    string          `json:"type"`
	Default json.RawMessage `json:"default,omitempty"`
	Help    string          `json:"help,omitempty"`
	// Translatable controls per-language storage routing. When unset
	// (nil) the legacy default of true applies — every theme setting
	// has been per-language since v0.1, and changing the default
	// silently would re-route every operator's existing values.
	// Themes opt non-translatable fields out by setting this false.
	Translatable *bool `json:"translatable,omitempty"`

	Config map[string]any  `json:"-"`
	Raw    json.RawMessage `json:"-"`
}

// UnmarshalJSON accepts both the legacy vocabulary (key/label/help/default)
// and the canonical Sanity-style vocabulary (name/title/description/
// initialValue), so disk JSON files in either shape load correctly.
// Legacy type aliases (text, repeater, group, node) are normalized to
// the canonical type names.
func (f *ThemeSettingsField) UnmarshalJSON(data []byte) error {
	type alias ThemeSettingsField
	raw := struct {
		*alias
		// Canonical aliases (newer vocabulary).
		AliasName         string          `json:"name,omitempty"`
		AliasTitle        string          `json:"title,omitempty"`
		AliasDescription  string          `json:"description,omitempty"`
		AliasInitialValue json.RawMessage `json:"initialValue,omitempty"`
	}{alias: (*alias)(f)}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if f.Key == "" && raw.AliasName != "" {
		f.Key = raw.AliasName
	}
	if f.Label == "" && raw.AliasTitle != "" {
		f.Label = raw.AliasTitle
	}
	if f.Help == "" && raw.AliasDescription != "" {
		f.Help = raw.AliasDescription
	}
	if len(f.Default) == 0 && len(raw.AliasInitialValue) > 0 {
		f.Default = raw.AliasInitialValue
	}
	// Normalize legacy type aliases.
	switch f.Type {
	case "text":
		f.Type = "string"
	case "repeater":
		f.Type = "array"
	case "group":
		f.Type = "object"
	case "node":
		f.Type = "reference"
	}
	return nil
}

// IsTranslatable returns the effective translatability with the legacy
// default (true) applied when the manifest left it unset.
func (f ThemeSettingsField) IsTranslatable() bool {
	if f.Translatable == nil {
		return true
	}
	return *f.Translatable
}

type themeSettingsPageFile struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Fields      []json.RawMessage `json:"fields"`
}

// LoadSettingsPages reads each settings_pages entry from the manifest, parses
// the referenced file, and returns the resolved pages. Soft-fail: invalid
// pages or fields are logged and skipped, never fatal.
func LoadSettingsPages(themeDir string, manifest ThemeManifest) []ThemeSettingsPage {
	if len(manifest.SettingsPages) == 0 {
		return nil
	}

	out := make([]ThemeSettingsPage, 0, len(manifest.SettingsPages))
	for _, def := range manifest.SettingsPages {
		page, err := loadSettingsPage(themeDir, def)
		if err != nil {
			log.Printf("[theme] settings page %q skipped: %v", def.Slug, err)
			continue
		}
		out = append(out, page)
	}
	return out
}

func loadSettingsPage(themeDir string, def ThemeSettingsPageDef) (ThemeSettingsPage, error) {
	if def.File == "" {
		return ThemeSettingsPage{}, fmt.Errorf("missing file")
	}
	path := filepath.Join(themeDir, def.File)
	data, err := os.ReadFile(path)
	if err != nil {
		return ThemeSettingsPage{}, fmt.Errorf("read %s: %w", def.File, err)
	}

	var file themeSettingsPageFile
	if err := json.Unmarshal(data, &file); err != nil {
		return ThemeSettingsPage{}, fmt.Errorf("parse %s: %w", def.File, err)
	}

	name := file.Name
	if name == "" {
		name = def.Name
	}

	page := ThemeSettingsPage{
		Slug:        def.Slug,
		Name:        name,
		Icon:        def.Icon,
		Description: file.Description,
		Fields:      parseSettingsFields(def.Slug, file.Fields),
	}
	return page, nil
}

// reservedFieldKeys are the field-schema keys core knows about; everything
// else in the raw object is funneled into Config for renderer use. Both
// legacy (key/label/default/help) and canonical (name/title/initialValue/
// description) names are reserved so neither leaks into Config when the
// disk JSON uses the new vocabulary.
var reservedFieldKeys = map[string]struct{}{
	// Legacy names (still on the wire).
	"key":          {},
	"label":        {},
	"default":      {},
	"help":         {},
	// Canonical aliases (accepted at load time).
	"name":         {},
	"title":        {},
	"initialValue": {},
	"description":  {},
	// Type and translatable use the same name across both vocabularies.
	"type":         {},
	"translatable": {},
}

func parseSettingsFields(pageSlug string, raw []json.RawMessage) []ThemeSettingsField {
	out := make([]ThemeSettingsField, 0, len(raw))
	for i, item := range raw {
		var f ThemeSettingsField
		if err := json.Unmarshal(item, &f); err != nil {
			log.Printf("[theme] settings page %q field #%d skipped: %v", pageSlug, i, err)
			continue
		}
		if f.Key == "" || f.Type == "" {
			log.Printf("[theme] settings page %q field #%d skipped: missing key or type", pageSlug, i)
			continue
		}

		var bag map[string]any
		if err := json.Unmarshal(item, &bag); err == nil {
			cfg := make(map[string]any, len(bag))
			for k, v := range bag {
				if _, reserved := reservedFieldKeys[k]; reserved {
					continue
				}
				cfg[k] = v
			}
			if len(cfg) > 0 {
				f.Config = cfg
			}
		}
		f.Raw = append(json.RawMessage(nil), item...)

		out = append(out, f)
	}
	return out
}
