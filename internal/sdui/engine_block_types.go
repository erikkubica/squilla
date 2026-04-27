package sdui

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"vibecms/internal/models"
)

// blockTypesLayout renders /admin/block-types.
func (e *Engine) blockTypesLayout(params map[string]string) *LayoutNode {
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

	baseQuery := e.db.Model(&models.BlockType{})
	if search != "" {
		baseQuery = baseQuery.Where("label ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	var allBlockTypes []models.BlockType
	baseQuery.Order(sortBy + " " + sortOrder).Find(&allBlockTypes)

	customCount := 0
	themeTabMap := map[string]*themeTabInfo{}
	extTabMap := map[string]*themeTabInfo{}
	for _, bt := range allBlockTypes {
		switch bt.Source {
		case "custom":
			customCount++
		case "extension":
			slug := ""
			if bt.ThemeName != nil {
				slug = *bt.ThemeName
			}
			if _, ok := extTabMap[slug]; !ok {
				extTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("extension", bt.ThemeName, themeNames, extNames)}
			}
			extTabMap[slug].count++
		case "theme":
			slug := ""
			if bt.ThemeName != nil {
				slug = *bt.ThemeName
			}
			if _, ok := themeTabMap[slug]; !ok {
				themeTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("theme", bt.ThemeName, themeNames, extNames)}
			}
			themeTabMap[slug].count++
		}
	}

	filtered := allBlockTypes
	if sourceFilter != "" && sourceFilter != "all" {
		filtered = filtered[:0]
		for _, bt := range allBlockTypes {
			if isExtSlugFilter(sourceFilter) {
				extSlug := strings.TrimPrefix(sourceFilter, "ext:")
				if bt.Source == "extension" && bt.ThemeName != nil && *bt.ThemeName == extSlug {
					filtered = append(filtered, bt)
				}
			} else if isThemeSlugFilter(sourceFilter) {
				if bt.Source == "theme" && bt.ThemeName != nil && *bt.ThemeName == sourceFilter {
					filtered = append(filtered, bt)
				}
			} else if bt.Source == sourceFilter {
				filtered = append(filtered, bt)
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
		pageData = []models.BlockType{}
	}

	rows := make([]map[string]interface{}, 0, len(pageData))
	for _, bt := range pageData {
		var fields []interface{}
		if err := json.Unmarshal(bt.FieldSchema, &fields); err != nil {
			fields = []interface{}{}
		}
		description := bt.Description
		if description == "" {
			description = "—"
		}
		rows = append(rows, map[string]interface{}{
			"id":          bt.ID,
			"label":       bt.Label,
			"slug":        bt.Slug,
			"icon":        bt.Icon,
			"description": description,
			"fieldCount":  len(fields),
			"source":      bt.Source,
			"sourceLabel": sourceDisplayLabel(bt.Source, bt.ThemeName, themeNames, extNames),
			"isCustom":    bt.Source == "custom",
			"updated_at":  bt.UpdatedAt.Format("2006-01-02"),
			"editPath":    fmt.Sprintf("/admin/block-types/%d/edit", bt.ID),
		})
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	tabs := buildSourceTabs(len(allBlockTypes), customCount, themeTabMap, extTabMap)

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
				"newLabel":  "New Block Type",
				"newPath":   "/admin/block-types/new",
				"tabs":      tabs,
				"activeTab": activeTab,
				"tabParam":  "source",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search block types…",
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "label", "label": "Label", "sortable": true},
					{"key": "slug", "label": "Slug", "width": 150},
					{"key": "fieldCount", "label": "Fields", "width": 80, "align": "center"},
					{"key": "sourceLabel", "label": "Source", "width": 130},
					{"key": "description", "label": "Description"},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 120, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "Blocks",
				"emptyTitle": "No block types found",
				"emptyDesc":  "Create your first block type to get started",
				"newPath":    "/admin/block-types/new",
				"newLabel":   "New Block Type",
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": total, "totalPages": totalPages,
				},
				"label":      "block-types",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this block type? This cannot be undone."},
						{Type: "CORE_API", Method: "block-types:delete", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Block type deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
				"onRowDetach": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CORE_API", Method: "block-types:detach", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Detached from source", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
			}},
		},
	}
}

// layoutBlocksLayout renders /admin/layout-blocks. Companion to
// blockTypesLayout — block types are reusable definitions, layout
// blocks are concrete instances tied to layouts and (optionally) a
// language.
func (e *Engine) layoutBlocksLayout(params map[string]string) *LayoutNode {
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

	baseQuery := e.db.Model(&models.LayoutBlock{})
	if lang := params["language"]; lang != "" && lang != "all" {
		if langID, err := strconv.Atoi(lang); err == nil {
			baseQuery = baseQuery.Where("language_id = ?", langID)
		}
	}
	if search != "" {
		baseQuery = baseQuery.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var allLayoutBlocks []models.LayoutBlock
	baseQuery.Order(sortBy + " " + sortOrder).Find(&allLayoutBlocks)

	customCount := 0
	themeTabMap := map[string]*themeTabInfo{}
	extTabMap := map[string]*themeTabInfo{}
	for _, lb := range allLayoutBlocks {
		switch lb.Source {
		case "custom":
			customCount++
		case "extension":
			slug := ""
			if lb.ThemeName != nil {
				slug = *lb.ThemeName
			}
			if _, ok := extTabMap[slug]; !ok {
				extTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("extension", lb.ThemeName, themeNames, extNames)}
			}
			extTabMap[slug].count++
		case "theme":
			slug := ""
			if lb.ThemeName != nil {
				slug = *lb.ThemeName
			}
			if _, ok := themeTabMap[slug]; !ok {
				themeTabMap[slug] = &themeTabInfo{name: sourceDisplayLabel("theme", lb.ThemeName, themeNames, extNames)}
			}
			themeTabMap[slug].count++
		}
	}

	filtered := allLayoutBlocks
	if sourceFilter != "" && sourceFilter != "all" {
		filtered = filtered[:0]
		for _, lb := range allLayoutBlocks {
			if isExtSlugFilter(sourceFilter) {
				extSlug := strings.TrimPrefix(sourceFilter, "ext:")
				if lb.Source == "extension" && lb.ThemeName != nil && *lb.ThemeName == extSlug {
					filtered = append(filtered, lb)
				}
			} else if isThemeSlugFilter(sourceFilter) {
				if lb.Source == "theme" && lb.ThemeName != nil && *lb.ThemeName == sourceFilter {
					filtered = append(filtered, lb)
				}
			} else if lb.Source == sourceFilter {
				filtered = append(filtered, lb)
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
		pageData = []models.LayoutBlock{}
	}

	rows := make([]map[string]interface{}, 0, len(pageData))
	for _, lb := range pageData {
		langDisplay := "All"
		var langFlag, langCode string
		if lb.LanguageID != nil {
			if lang, ok := langMap[*lb.LanguageID]; ok {
				langDisplay = lang.Name
				langFlag = lang.Flag
				langCode = lang.Code
			} else {
				langDisplay = fmt.Sprintf("ID %d", *lb.LanguageID)
			}
		}
		description := lb.Description
		if description == "" {
			description = "—"
		}
		rows = append(rows, map[string]interface{}{
			"id":          lb.ID,
			"name":        lb.Name,
			"slug":        lb.Slug,
			"description": description,
			"source":      lb.Source,
			"sourceLabel": sourceDisplayLabel(lb.Source, lb.ThemeName, themeNames, extNames),
			"isCustom":    lb.Source == "custom",
			"languageID":  lb.LanguageID,
			"langDisplay": langDisplay,
			"langFlag":    langFlag,
			"langCode":    langCode,
			"updated_at":  lb.UpdatedAt.Format("2006-01-02"),
			"editPath":    fmt.Sprintf("/admin/layout-blocks/%d/edit", lb.ID),
		})
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	tabs := buildSourceTabs(len(allLayoutBlocks), customCount, themeTabMap, extTabMap)

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
				"newLabel":  "New Layout Block",
				"newPath":   "/admin/layout-blocks/new",
				"tabs":      tabs,
				"activeTab": activeTab,
				"tabParam":  "source",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search layout blocks…",
				"languages":         langList,
				"activeLanguage":    params["language"],
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "name", "label": "Name", "sortable": true},
					{"key": "slug", "label": "Slug", "width": 180},
					{"key": "langDisplay", "label": "Language", "width": 130},
					{"key": "sourceLabel", "label": "Source", "width": 130},
					{"key": "description", "label": "Description"},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 120, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "Component",
				"emptyTitle": "No layout blocks found",
				"emptyDesc":  "Create your first layout block to get started",
				"newPath":    "/admin/layout-blocks/new",
				"newLabel":   "New Layout Block",
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": total, "totalPages": totalPages,
				},
				"label":      "layout-blocks",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this layout block? This cannot be undone."},
						{Type: "CORE_API", Method: "layout-blocks:delete", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Layout block deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
				"onRowDetach": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CORE_API", Method: "layout-blocks:detach", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Detached from source", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
			}},
		},
	}
}
