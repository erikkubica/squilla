package sdui

import (
	"encoding/json"
	"fmt"
	"strconv"

	"vibecms/internal/models"
)

// contentTypesLayout renders /admin/content-types — extracted from
// engine.go because the page builder logic (filter/tab/sort/paginate)
// follows the same shape as the other listing layouts and is easier
// to read alongside its peers (taxonomies, templates, etc.) than
// buried in the dispatch switch.
func (e *Engine) contentTypesLayout(params map[string]string) *LayoutNode {
	page, _ := strconv.Atoi(params["page"])
	if page < 1 {
		page = 1
	}
	perPage := getPerPage(params)
	tab := params["tab"]
	search := params["search"]

	sortBy := params["sort"]
	sortOrder := params["order"]
	switch sortBy {
	case "label", "slug", "updated_at":
	default:
		sortBy = "label"
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	q := e.db.Model(&models.NodeType{})
	if search != "" {
		q = q.Where("label ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	var allTypes []models.NodeType
	q.Order(sortBy + " " + sortOrder).Find(&allTypes)

	builtinCount := 0
	customCount := 0
	for _, nt := range allTypes {
		if isBuiltinNodeType(nt.Slug) {
			builtinCount++
		} else {
			customCount++
		}
	}

	filtered := allTypes
	switch tab {
	case "builtin":
		filtered = filtered[:0]
		for _, nt := range allTypes {
			if isBuiltinNodeType(nt.Slug) {
				filtered = append(filtered, nt)
			}
		}
	case "custom":
		filtered = filtered[:0]
		for _, nt := range allTypes {
			if !isBuiltinNodeType(nt.Slug) {
				filtered = append(filtered, nt)
			}
		}
	}

	total := len(filtered)
	offset := (page - 1) * perPage
	end := offset + perPage
	if end > total {
		end = total
	}
	pageData := []models.NodeType{}
	if offset < total {
		pageData = filtered[offset:end]
	}

	rows := make([]map[string]interface{}, 0, len(pageData))
	for _, nt := range pageData {
		var taxSlugs []string
		if err := json.Unmarshal(nt.Taxonomies, &taxSlugs); err != nil {
			taxSlugs = []string{}
		}
		builtin := isBuiltinNodeType(nt.Slug)
		rows = append(rows, map[string]interface{}{
			"id":             nt.ID,
			"slug":           nt.Slug,
			"label":          nt.Label,
			"labelPlural":    nt.LabelPlural,
			"taxonomyCount":  len(taxSlugs),
			"supportsBlocks": nt.SupportsBlocks,
			"sourceLabel":    ternary(builtin, "Built-in", "Custom"),
			"isCustom":       !builtin,
			"updated_at":     nt.UpdatedAt.Format("2006-01-02"),
			"editPath":       fmt.Sprintf("/admin/content-types/%d/edit", nt.ID),
		})
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	tabs := []map[string]interface{}{
		{"value": "all", "label": "All", "count": len(allTypes)},
	}
	if builtinCount > 0 {
		tabs = append(tabs, map[string]interface{}{"value": "builtin", "label": "Built-in", "count": builtinCount})
	}
	if customCount > 0 {
		tabs = append(tabs, map[string]interface{}{"value": "custom", "label": "Custom", "count": customCount})
	}

	activeTab := tab
	if activeTab == "" {
		activeTab = "all"
	}
	hasFilters := search != "" || (tab != "" && tab != "all")

	return &LayoutNode{
		Type:  "VerticalStack",
		Props: map[string]interface{}{"gap": 0},
		Children: []LayoutNode{
			{Type: "PageHeader", Props: map[string]interface{}{
				"newLabel":  "New Content Type",
				"newPath":   "/admin/content-types/new",
				"tabs":      tabs,
				"activeTab": activeTab,
				"tabParam":  "tab",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search content types…",
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "label", "label": "Label", "sortable": true},
					{"key": "slug", "label": "Slug", "width": 160, "sortable": true},
					{"key": "taxonomyCount", "label": "Taxonomies", "width": 110, "align": "center"},
					{"key": "supportsBlocks", "label": "Blocks", "width": 80, "align": "center"},
					{"key": "sourceLabel", "label": "Source", "width": 110},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 120, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "Shapes",
				"emptyTitle": "No content types found",
				"emptyDesc":  "Create your first content type to model custom data",
				"newPath":    "/admin/content-types/new",
				"newLabel":   "New Content Type",
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": total, "totalPages": totalPages,
				},
				"label":      "content types",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this content type? This cannot be undone."},
						{Type: "CORE_API", Method: "node-types:delete", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Content type deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout", "boot"}},
					},
				},
			}},
		},
	}
}
