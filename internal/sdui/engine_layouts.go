package sdui

import (
	"fmt"
	"strconv"
	"strings"

	"vibecms/internal/models"
)

// layoutsLayout renders /admin/layouts. Like templatesLayout, it
// buckets per-source tabs by slug — the structural difference is the
// language filter (layouts can be language-scoped, templates cannot).
func (e *Engine) layoutsLayout(params map[string]string) *LayoutNode {
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
	case "name", "slug", "updated_at":
	default:
		sortBy = "updated_at"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	// Fetch languages for display and filter
	var languages []models.Language
	e.db.Where("is_active = ?", true).Order("sort_order ASC, name ASC").Find(&languages)
	langMap := make(map[int]models.Language)
	langList := make([]map[string]interface{}, 0, len(languages))
	for _, l := range languages {
		langMap[l.ID] = l
		langList = append(langList, map[string]interface{}{
			"id":   l.ID,
			"code": l.Code,
			"name": l.Name,
			"flag": l.Flag,
		})
	}

	themeNames := e.themeNameMap()
	extNames := e.extensionNameMap()

	// Base query with language + search filters
	baseQuery := e.db.Model(&models.Layout{})
	if lang := params["language"]; lang != "" && lang != "all" {
		if langID, err := strconv.Atoi(lang); err == nil {
			baseQuery = baseQuery.Where("language_id = ?", langID)
		}
	}
	if search != "" {
		baseQuery = baseQuery.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Load all (for source counts, preserving sort order)
	var allLayouts []models.Layout
	baseQuery.Order(sortBy + " " + sortOrder).Find(&allLayouts)

	customCount := 0
	themeTabMap := map[string]*themeTabInfo{}
	extTabMap := map[string]*themeTabInfo{}
	for _, l := range allLayouts {
		switch l.Source {
		case "custom":
			customCount++
		case "extension":
			slug := ""
			if l.ThemeName != nil {
				slug = *l.ThemeName
			}
			if _, ok := extTabMap[slug]; !ok {
				extTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("extension", l.ThemeName, themeNames, extNames)}
			}
			extTabMap[slug].count++
		case "theme":
			slug := ""
			if l.ThemeName != nil {
				slug = *l.ThemeName
			}
			if _, ok := themeTabMap[slug]; !ok {
				themeTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("theme", l.ThemeName, themeNames, extNames)}
			}
			themeTabMap[slug].count++
		}
	}

	filtered := allLayouts
	if sourceFilter != "" && sourceFilter != "all" {
		filtered = filtered[:0]
		for _, l := range allLayouts {
			if isExtSlugFilter(sourceFilter) {
				extSlug := strings.TrimPrefix(sourceFilter, "ext:")
				if l.Source == "extension" && l.ThemeName != nil && *l.ThemeName == extSlug {
					filtered = append(filtered, l)
				}
			} else if isThemeSlugFilter(sourceFilter) {
				if l.Source == "theme" && l.ThemeName != nil && *l.ThemeName == sourceFilter {
					filtered = append(filtered, l)
				}
			} else if l.Source == sourceFilter {
				filtered = append(filtered, l)
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
		pageData = []models.Layout{}
	}

	rows := make([]map[string]interface{}, 0, len(pageData))
	for _, l := range pageData {
		langDisplay := "All"
		var langFlag, langCode string
		if l.LanguageID != nil {
			if lang, ok := langMap[*l.LanguageID]; ok {
				langDisplay = lang.Name
				langFlag = lang.Flag
				langCode = lang.Code
			} else {
				langDisplay = fmt.Sprintf("ID %d", *l.LanguageID)
			}
		}
		rows = append(rows, map[string]interface{}{
			"id":          l.ID,
			"name":        l.Name,
			"slug":        l.Slug,
			"source":      l.Source,
			"sourceLabel": sourceDisplayLabel(l.Source, l.ThemeName, themeNames, extNames),
			"isCustom":    l.Source == "custom",
			"isDefault":   l.IsDefault,
			"languageID":  l.LanguageID,
			"langDisplay": langDisplay,
			"langFlag":    langFlag,
			"langCode":    langCode,
			"updated_at":  l.UpdatedAt.Format("2006-01-02"),
			"editPath":    fmt.Sprintf("/admin/layouts/%d", l.ID),
		})
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	tabs := buildSourceTabs(len(allLayouts), customCount, themeTabMap, extTabMap)

	activeTab := sourceFilter
	if activeTab == "" {
		activeTab = "all"
	}

	hasFilters := search != "" || (params["language"] != "" && params["language"] != "all") || (sourceFilter != "" && sourceFilter != "all")

	return &LayoutNode{
		Type:  "VerticalStack",
		Props: map[string]interface{}{"gap": 0},
		Children: []LayoutNode{
			{Type: "PageHeader", Props: map[string]interface{}{
				"newLabel":  "New Layout",
				"newPath":   "/admin/layouts/new",
				"tabs":      tabs,
				"activeTab": activeTab,
				"tabParam":  "source",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search layouts…",
				"languages":         langList,
				"activeLanguage":    params["language"],
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "name", "label": "Name", "sortable": true},
					{"key": "slug", "label": "Slug", "width": 180},
					{"key": "langDisplay", "label": "Language", "width": 130},
					{"key": "sourceLabel", "label": "Source", "width": 130},
					{"key": "isDefault", "label": "Default", "width": 90},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 140, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "LayoutTemplate",
				"emptyTitle": "No layouts found",
				"emptyDesc":  "Create your first layout to get started",
				"newPath":    "/admin/layouts/new",
				"newLabel":   "New Layout",
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": total, "totalPages": totalPages,
				},
				"label":      "layouts",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this layout? This cannot be undone."},
						{Type: "CORE_API", Method: "layouts:delete", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Layout deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
				"onRowDetach": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CORE_API", Method: "layouts:detach", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Detached from source", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
			}},
		},
	}
}
