package sdui

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"squilla/internal/models"
)

// templatesLayout renders /admin/templates. Theme- and extension-scoped
// templates are bucketed into per-source tabs (value = slug for themes,
// "ext:<slug>" for extensions) so users can filter by individual provider.
func (e *Engine) templatesLayout(params map[string]string) *LayoutNode {
	page, _ := strconv.Atoi(params["page"])
	if page < 1 {
		page = 1
	}
	perPage := getPerPage(params)
	sourceFilter := params["source"]
	search := params["search"]

	sortBy := params["sort"]
	sortOrder := params["order"]
	switch sortBy {
	case "label", "slug", "updated_at":
	default:
		sortBy = "updated_at"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	themeNames := e.themeNameMap()
	extNames := e.extensionNameMap()

	// Load all (with search filter) for tab counts
	baseQuery := e.db.Model(&models.Template{})
	if search != "" {
		baseQuery = baseQuery.Where("label ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	var allTemplates []models.Template
	baseQuery.Order(sortBy + " " + sortOrder).Find(&allTemplates)

	// Build per-source counts (theme/extension items grouped by their slug)
	customCount := 0
	themeTabMap := map[string]*themeTabInfo{}
	extTabMap := map[string]*themeTabInfo{}
	for _, t := range allTemplates {
		switch t.Source {
		case "custom":
			customCount++
		case "extension":
			slug := ""
			if t.ThemeName != nil {
				slug = *t.ThemeName
			}
			if _, ok := extTabMap[slug]; !ok {
				extTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("extension", t.ThemeName, themeNames, extNames)}
			}
			extTabMap[slug].count++
		case "theme":
			slug := ""
			if t.ThemeName != nil {
				slug = *t.ThemeName
			}
			if _, ok := themeTabMap[slug]; !ok {
				themeTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("theme", t.ThemeName, themeNames, extNames)}
			}
			themeTabMap[slug].count++
		}
	}

	// Filter in-memory: theme slug filters by source=theme + theme_name=slug,
	// ext:<slug> filters by source=extension + theme_name=slug.
	filtered := allTemplates
	if sourceFilter != "" && sourceFilter != "all" {
		filtered = filtered[:0]
		for _, t := range allTemplates {
			if isExtSlugFilter(sourceFilter) {
				extSlug := strings.TrimPrefix(sourceFilter, "ext:")
				if t.Source == "extension" && t.ThemeName != nil && *t.ThemeName == extSlug {
					filtered = append(filtered, t)
				}
			} else if isThemeSlugFilter(sourceFilter) {
				if t.Source == "theme" && t.ThemeName != nil && *t.ThemeName == sourceFilter {
					filtered = append(filtered, t)
				}
			} else if t.Source == sourceFilter {
				filtered = append(filtered, t)
			}
		}
	}

	total := len(filtered)
	offset := (page - 1) * perPage
	end := offset + perPage
	if end > total {
		end = total
	}
	pageData := filtered
	if offset < total {
		pageData = filtered[offset:end]
	} else {
		pageData = []models.Template{}
	}

	rows := make([]map[string]interface{}, 0, len(pageData))
	for _, t := range pageData {
		var blockConfigs []interface{}
		if err := json.Unmarshal(t.BlockConfig, &blockConfigs); err != nil {
			blockConfigs = []interface{}{}
		}
		description := t.Description
		if description == "" {
			description = "—"
		}
		rows = append(rows, map[string]interface{}{
			"id":          t.ID,
			"label":       t.Label,
			"slug":        t.Slug,
			"description": description,
			"blockCount":  len(blockConfigs),
			"source":      t.Source,
			"sourceLabel": sourceDisplayLabel(t.Source, t.ThemeName, themeNames, extNames),
			"isCustom":    t.Source == "custom",
			"updated_at":  t.UpdatedAt.Format("2006-01-02"),
			"editPath":    fmt.Sprintf("/admin/templates/%d/edit", t.ID),
		})
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	tabs := buildSourceTabs(len(allTemplates), customCount, themeTabMap, extTabMap)

	activeTab := sourceFilter
	if activeTab == "" {
		activeTab = "all"
	}

	hasFilters := search != "" || (sourceFilter != "" && sourceFilter != "all")

	return &LayoutNode{
		Type:  "VerticalStack",
		Props: map[string]interface{}{"gap": 0},
		Children: []LayoutNode{
			{Type: "PageHeader", Props: map[string]interface{}{
				"newLabel":  "New Template",
				"newPath":   "/admin/templates/new",
				"tabs":      tabs,
				"activeTab": activeTab,
				"tabParam":  "source",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search templates…",
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "label", "label": "Label", "sortable": true},
					{"key": "blockCount", "label": "Blocks", "width": 80, "align": "center"},
					{"key": "sourceLabel", "label": "Source", "width": 130},
					{"key": "description", "label": "Description"},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 120, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "LayoutTemplate",
				"emptyTitle": "No templates found",
				"emptyDesc":  "Create your first template to get started",
				"newPath":    "/admin/templates/new",
				"newLabel":   "New Template",
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": total, "totalPages": totalPages,
				},
				"label":      "templates",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this template? This cannot be undone."},
						{Type: "CORE_API", Method: "templates:delete", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Template deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
				"onRowDetach": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CORE_API", Method: "templates:detach", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Detached from source", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
			}},
		},
	}
}
