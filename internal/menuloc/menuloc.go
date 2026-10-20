// Package menuloc holds theme menu locations: the named menu slots a theme
// declares and the menu assigned to each.
package menuloc

import (
	"strings"
	"sync"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// Menu locations are named slots a theme renders menus into ("primary",
// "footer-1"). The active theme declares them in theme.json:
//
//	"menu_locations": [{ "slug": "primary", "label": "Primary", "description": "Header navigation" }]
//
// Editors assign any menu to a location in the admin; templates read the
// assigned menu at {{ .app.menu_locations.<slug> }} (nil when unassigned).
// Assignments are stored as site settings `menu_location:<slug>` → menu slug,
// so they survive theme reloads and apply to every language (menus are
// matched by slug, which translations share).

// Def is one entry of theme.json menu_locations[].
type Def struct {
	Slug        string `json:"slug"`
	Label       string `json:"label"`
	Description string `json:"description,omitempty"`
}

const settingPrefix = "menu_location:"

// menuLocationRegistry holds the active theme's declared locations.
type menuLocationRegistry struct {
	mu   sync.RWMutex
	defs []Def
}

var activeMenuLocations = &menuLocationRegistry{}

func (r *menuLocationRegistry) set(defs []Def) {
	clean := make([]Def, 0, len(defs))
	for _, d := range defs {
		d.Slug = strings.TrimSpace(d.Slug)
		if d.Slug == "" {
			continue
		}
		if d.Label == "" {
			d.Label = d.Slug
		}
		clean = append(clean, d)
	}
	r.mu.Lock()
	r.defs = clean
	r.mu.Unlock()
}

func (r *menuLocationRegistry) list() []Def {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]Def, len(r.defs))
	copy(out, r.defs)
	return out
}

func (r *menuLocationRegistry) has(slug string) bool {
	for _, d := range r.list() {
		if d.Slug == slug {
			return true
		}
	}
	return false
}

// SetActive replaces the declared locations (called on theme load).
func SetActive(defs []Def) { activeMenuLocations.set(defs) }

// List returns the active theme's declared locations.
func List() []Def { return activeMenuLocations.list() }

// Declared reports whether the active theme declares the location.
func Declared(slug string) bool { return activeMenuLocations.has(slug) }

// LoadAssignments returns location slug → assigned menu slug.
// The language-neutral row wins; a default-language row (what Tengo's
// settings.set writes when a theme seeds an assignment) is the fallback.
func LoadAssignments(db *gorm.DB) map[string]string {
	var rows []models.SiteSetting
	db.Where("key LIKE ?", settingPrefix+"%").Order("language_code ASC").Find(&rows)
	out := make(map[string]string, len(rows))
	for _, row := range rows {
		loc := strings.TrimPrefix(row.Key, settingPrefix)
		if _, seen := out[loc]; seen || row.Value == nil {
			continue
		}
		out[loc] = *row.Value
	}
	for loc, slug := range out {
		if slug == "" {
			delete(out, loc)
		}
	}
	return out
}

// Assign stores (or clears, with an empty menuSlug) an
// assignment. Any per-language rows for the key are replaced so the admin's
// choice is the only one left.
func Assign(db *gorm.DB, location, menuSlug string) error {
	key := settingPrefix + location
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("key = ?", key).Delete(&models.SiteSetting{}).Error; err != nil {
			return err
		}
		v := menuSlug
		// An explicit empty value records "cleared" so a seeded default
		// does not come back.
		return tx.Create(&models.SiteSetting{Key: key, LanguageCode: "", Value: &v}).Error
	})
}
