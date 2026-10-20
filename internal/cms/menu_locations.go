package cms

import (
	"gorm.io/gorm"

	"squilla/internal/menuloc"
)

// Theme menu locations: see package menuloc. This file wires them into
// rendering (.app.menu_locations) and the admin API views.

// ThemeMenuLocationDef is one entry of theme.json menu_locations[].
type ThemeMenuLocationDef = menuloc.Def

// ResolveMenuLocations maps each declared location to its assigned menu from
// an already-loaded menus map (slug → menu). Unassigned or missing menus
// resolve to nil so templates can gate with {{ with }}.
func (rc *RenderContext) ResolveMenuLocations(menus map[string]interface{}) map[string]interface{} {
	assigned := menuloc.LoadAssignments(rc.db)
	out := make(map[string]interface{})
	for _, def := range menuloc.List() {
		out[def.Slug] = nil
		if slug, ok := assigned[def.Slug]; ok {
			if m, ok := menus[slug]; ok {
				out[def.Slug] = m
			}
		}
	}
	return out
}

// menuLocationView is the admin API shape for one location.
type menuLocationView struct {
	Slug        string `json:"slug"`
	Label       string `json:"label"`
	Description string `json:"description,omitempty"`
	MenuSlug    string `json:"menu_slug"`
}

func menuLocationViews(db *gorm.DB) []menuLocationView {
	assigned := menuloc.LoadAssignments(db)
	defs := menuloc.List()
	out := make([]menuLocationView, 0, len(defs))
	for _, d := range defs {
		out = append(out, menuLocationView{Slug: d.Slug, Label: d.Label, Description: d.Description, MenuSlug: assigned[d.Slug]})
	}
	return out
}
