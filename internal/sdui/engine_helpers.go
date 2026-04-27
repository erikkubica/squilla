package sdui

import (
	"sort"
	"strconv"
	"strings"

	"vibecms/internal/models"
)

// This file collects the small, stateless helpers used across the
// per-page layout builders in engine.go and engine_*.go. Splitting
// them out keeps engine.go focused on the Engine struct + dispatch
// table; tests for these helpers can be added without dragging in DB
// dependencies the layout methods need.

// ternary is the conditional-expression sugar Go lacks. Used in row
// mappers (`status: ternary(node.Published, "live", "draft")`) where
// an inline ternary would be considerably more readable than a
// multi-line if/else.
func ternary[T any](cond bool, a, b T) T {
	if cond {
		return a
	}
	return b
}

// sourceTabs builds the simple all/custom/theme/extension tab list
// for list pages that don't break theme/extension entries down by
// individual slug. buildSourceTabs is the per-slug variant.
func sourceTabs(counts map[string]int, total int) []map[string]interface{} {
	tabs := []map[string]interface{}{
		{"value": "all", "label": "All", "count": total},
	}
	for _, s := range []string{"custom", "theme", "extension"} {
		if n := counts[s]; n > 0 {
			label := s
			label = string([]rune(label)[:1]) + label[1:]
			tabs = append(tabs, map[string]interface{}{"value": s, "label": label[:1] + label[1:], "count": n})
		}
	}
	return tabs
}

// capitalize uppercases the first byte of s. Safe for ASCII slugs;
// for general unicode use a strings.ToUpper-on-first-rune helper —
// but the slugs we feed are kebab-case lowercase ASCII so this works.
func capitalize(s string) string {
	if s == "" {
		return s
	}
	return string([]rune(s[:1])) + s[1:]
}

// prettySlug converts a kebab-case slug to Title Case ("my-theme" → "My Theme").
func prettySlug(s string) string {
	words := strings.Split(s, "-")
	for i, w := range words {
		words[i] = capitalize(w)
	}
	return strings.Join(words, " ")
}

// themeTabInfo holds per-theme tab display data.
type themeTabInfo struct {
	name  string
	count int
}

// sourceDisplayLabel returns a human-readable label for a record's source field.
// themeNames maps theme/extension slug → display name.
func sourceDisplayLabel(source string, themeName *string, themeNames map[string]string, extNames map[string]string) string {
	switch source {
	case "custom":
		return "Custom"
	case "extension":
		if themeName != nil {
			if name, ok := extNames[*themeName]; ok && name != "" {
				return name
			}
			return prettySlug(*themeName)
		}
		return "Extension"
	case "theme":
		if themeName != nil {
			if name, ok := themeNames[*themeName]; ok && name != "" {
				return name
			}
			return prettySlug(*themeName)
		}
		return "Theme"
	}
	return capitalize(source)
}

// buildSourceTabs creates tab entries where theme/extension items are each broken out by
// their individual display name. Tab value = slug, so ?source=<slug> filters precisely.
func buildSourceTabs(total, customCount int, themeTabMap, extTabMap map[string]*themeTabInfo) []map[string]interface{} {
	tabs := []map[string]interface{}{{"value": "all", "label": "All", "count": total}}
	if customCount > 0 {
		tabs = append(tabs, map[string]interface{}{"value": "custom", "label": "Custom", "count": customCount})
	}
	// Theme tabs sorted alphabetically by slug
	themeSlugs := make([]string, 0, len(themeTabMap))
	for slug := range themeTabMap {
		themeSlugs = append(themeSlugs, slug)
	}
	sort.Strings(themeSlugs)
	for _, slug := range themeSlugs {
		info := themeTabMap[slug]
		tabs = append(tabs, map[string]interface{}{"value": slug, "label": info.name, "count": info.count})
	}
	// Extension tabs sorted alphabetically by slug
	extSlugs := make([]string, 0, len(extTabMap))
	for slug := range extTabMap {
		extSlugs = append(extSlugs, slug)
	}
	sort.Strings(extSlugs)
	for _, slug := range extSlugs {
		info := extTabMap[slug]
		tabs = append(tabs, map[string]interface{}{"value": "ext:" + slug, "label": info.name, "count": info.count})
	}
	return tabs
}

// isThemeSlugFilter returns true when sourceFilter holds a theme slug.
func isThemeSlugFilter(s string) bool {
	switch s {
	case "", "all", "custom":
		return false
	}
	return !strings.HasPrefix(s, "ext:")
}

// isExtSlugFilter returns true when sourceFilter holds an extension slug (prefixed with "ext:").
func isExtSlugFilter(s string) bool {
	return strings.HasPrefix(s, "ext:")
}

// getPerPage returns the per-page size from params, clamped to [5, 100], defaulting to 10.
func getPerPage(params map[string]string) int {
	if v, err := strconv.Atoi(params["per_page"]); err == nil && v >= 5 && v <= 100 {
		return v
	}
	return 10
}

// themeNameMap fetches a lookup table for resolving a stored ThemeName value
// to its proper display name. Indexed by both slug and display name so that
// it works regardless of which value the model field stores.
func (e *Engine) themeNameMap() map[string]string {
	var themes []models.Theme
	e.db.Select("slug, name").Find(&themes)
	m := make(map[string]string, len(themes)*2)
	for _, t := range themes {
		if t.Slug != "" {
			m[t.Slug] = t.Name
		}
		if t.Name != "" {
			m[t.Name] = t.Name
		}
	}
	return m
}

// extensionNameMap fetches a slug → display name map for active extensions.
func (e *Engine) extensionNameMap() map[string]string {
	var exts []models.Extension
	e.db.Select("slug, name").Find(&exts)
	m := make(map[string]string, len(exts))
	for _, ex := range exts {
		if ex.Slug != "" {
			m[ex.Slug] = ex.Name
		}
	}
	return m
}

// basePathForNodeType returns the admin base path for a given node type slug.
func basePathForNodeType(slug string) string {
	switch slug {
	case "page":
		return "/admin/pages"
	case "post":
		return "/admin/posts"
	default:
		return "/admin/content/" + slug
	}
}

// derefString dereferences a string pointer, returning "" for nil. Used
// throughout the engine to safely read optional model fields.
func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
