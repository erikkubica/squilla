package sdui

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"vibecms/internal/models"
)

// taxonomiesLayout renders /admin/taxonomies. Tabs are populated per
// node-type so taxonomies attached to multiple types appear in each
// tab — that means tab counts add up to total usage rather than the
// distinct taxonomy count, which is the behavior the UI expects.
func (e *Engine) taxonomiesLayout(params map[string]string) *LayoutNode {
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

	// Resolve node-type display labels so pills and tabs read nicely.
	var nodeTypes []models.NodeType
	e.db.Select("slug, label, label_plural").Find(&nodeTypes)
	nodeTypeLabels := make(map[string]string, len(nodeTypes))
	for _, nt := range nodeTypes {
		label := nt.LabelPlural
		if label == "" {
			label = nt.Label
		}
		if label == "" {
			label = nt.Slug
		}
		nodeTypeLabels[nt.Slug] = label
	}

	q := e.db.Model(&models.Taxonomy{})
	if search != "" {
		q = q.Where("label ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	var allTaxonomies []models.Taxonomy
	q.Order(sortBy + " " + sortOrder).Find(&allTaxonomies)

	// Tab counts per node-type slug. A taxonomy attached to multiple node
	// types shows up in each tab so the counts add up to the usage count,
	// not the distinct taxonomy count.
	nodeTypeTabCounts := make(map[string]int)
	for _, t := range allTaxonomies {
		for _, nts := range t.NodeTypes {
			nodeTypeTabCounts[nts]++
		}
	}

	filtered := allTaxonomies
	if tab != "" && tab != "all" {
		filtered = filtered[:0]
		for _, t := range allTaxonomies {
			for _, nts := range t.NodeTypes {
				if nts == tab {
					filtered = append(filtered, t)
					break
				}
			}
		}
	}

	total := len(filtered)
	offset := (page - 1) * perPage
	end := offset + perPage
	if end > total {
		end = total
	}
	pageData := []models.Taxonomy{}
	if offset < total {
		pageData = filtered[offset:end]
	}

	rows := make([]map[string]interface{}, 0, len(pageData))
	for _, t := range pageData {
		nodeTypesArr := make([]string, len(t.NodeTypes))
		labels := make([]string, 0, len(t.NodeTypes))
		for i, s := range t.NodeTypes {
			nodeTypesArr[i] = s
			if l, ok := nodeTypeLabels[s]; ok {
				labels = append(labels, l)
			} else {
				labels = append(labels, s)
			}
		}
		nodeTypesDisplay := "—"
		if len(labels) > 0 {
			nodeTypesDisplay = strings.Join(labels, ", ")
		}

		rows = append(rows, map[string]interface{}{
			"id":               t.ID,
			"slug":             t.Slug,
			"label":            t.Label,
			"labelPlural":      t.LabelPlural,
			"description":      t.Description,
			"hierarchical":     t.Hierarchical,
			"nodeTypes":        nodeTypesArr,
			"nodeTypesDisplay": nodeTypesDisplay,
			"updated_at":       t.UpdatedAt.Format("2006-01-02"),
			"editPath":         fmt.Sprintf("/admin/taxonomies/%s/edit", t.Slug),
		})
	}

	totalPages := total / perPage
	if total%perPage > 0 {
		totalPages++
	}

	// Build tabs: All + one per node-type slug with at least one attached taxonomy.
	tabs := []map[string]interface{}{
		{"value": "all", "label": "All", "count": len(allTaxonomies)},
	}
	slugs := make([]string, 0, len(nodeTypeTabCounts))
	for s := range nodeTypeTabCounts {
		slugs = append(slugs, s)
	}
	sort.Strings(slugs)
	for _, s := range slugs {
		label := s
		if l, ok := nodeTypeLabels[s]; ok {
			label = l
		}
		tabs = append(tabs, map[string]interface{}{
			"value": s,
			"label": label,
			"count": nodeTypeTabCounts[s],
		})
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
				"newLabel":  "New Taxonomy",
				"newPath":   "/admin/taxonomies/new",
				"tabs":      tabs,
				"activeTab": activeTab,
				"tabParam":  "tab",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search taxonomies…",
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "label", "label": "Label", "sortable": true},
					{"key": "slug", "label": "Slug", "width": 160, "sortable": true},
					{"key": "nodeTypesDisplay", "label": "Content Types"},
					{"key": "hierarchical", "label": "Hierarchical", "width": 110, "align": "center"},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 120, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "Tags",
				"emptyTitle": "No taxonomies found",
				"emptyDesc":  "Create your first taxonomy to group content with terms",
				"newPath":    "/admin/taxonomies/new",
				"newLabel":   "New Taxonomy",
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": total, "totalPages": totalPages,
				},
				"label":      "taxonomies",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this taxonomy? This cannot be undone."},
						{Type: "CORE_API", Method: "taxonomies:delete", Params: map[string]interface{}{"slug": "$event.slug"}},
						{Type: "TOAST", Message: "Taxonomy deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout", "boot"}},
					},
				},
			}},
		},
	}
}
