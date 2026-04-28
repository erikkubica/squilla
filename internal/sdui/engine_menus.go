package sdui

import (
	"fmt"
	"strconv"

	"squilla/internal/models"
)

// menusLayout renders /admin/menus. Item counts come from a separate
// GROUP BY menu_id query so the listing query stays a simple count;
// otherwise we'd be doing a join that returns one row per item.
func (e *Engine) menusLayout(params map[string]string) *LayoutNode {
	page, _ := strconv.Atoi(params["page"])
	if page < 1 {
		page = 1
	}
	perPage := getPerPage(params)
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

	query := e.db.Model(&models.Menu{})
	if lang := params["language"]; lang != "" && lang != "all" {
		if langID, err := strconv.Atoi(lang); err == nil {
			query = query.Where("language_id = ?", langID)
		}
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR slug ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * perPage
	var menus []models.Menu
	query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(perPage).Find(&menus)

	// Count menu items per menu via separate query
	menuIDs := make([]int, 0, len(menus))
	for _, m := range menus {
		menuIDs = append(menuIDs, m.ID)
	}

	itemCountMap := make(map[int]int)
	if len(menuIDs) > 0 {
		type itemCount struct {
			MenuID int
			Count  int
		}
		var counts []itemCount
		e.db.Raw("SELECT menu_id, COUNT(*) as count FROM menu_items WHERE menu_id IN (?) GROUP BY menu_id", menuIDs).Scan(&counts)
		for _, c := range counts {
			itemCountMap[c.MenuID] = c.Count
		}
	}

	rows := make([]map[string]interface{}, 0, len(menus))
	for _, m := range menus {
		langDisplay := "All"
		var langFlag, langCode string
		if m.LanguageID != nil {
			if lang, ok := langMap[*m.LanguageID]; ok {
				langDisplay = lang.Name
				langFlag = lang.Flag
				langCode = lang.Code
			} else {
				langDisplay = fmt.Sprintf("ID %d", *m.LanguageID)
			}
		}

		rows = append(rows, map[string]interface{}{
			"id":          m.ID,
			"name":        m.Name,
			"slug":        m.Slug,
			"version":     m.Version,
			"itemCount":   itemCountMap[m.ID],
			"languageID":  m.LanguageID,
			"langDisplay": langDisplay,
			"langFlag":    langFlag,
			"langCode":    langCode,
			"updated_at":  m.UpdatedAt.Format("2006-01-02"),
			"editPath":    fmt.Sprintf("/admin/menus/%d/edit", m.ID),
		})
	}

	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}

	hasFilters := search != "" || (params["language"] != "" && params["language"] != "all")

	return &LayoutNode{
		Type:  "VerticalStack",
		Props: map[string]interface{}{"gap": 0},
		Children: []LayoutNode{
			{Type: "PageHeader", Props: map[string]interface{}{
				"newLabel":  "New Menu",
				"newPath":   "/admin/menus/new",
				"tabs":      []map[string]interface{}{{"value": "all", "label": "All", "count": int(total)}},
				"activeTab": "all",
			}},
			{Type: "SearchToolbar", Props: map[string]interface{}{
				"searchPlaceholder": "Search menus…",
				"languages":         langList,
				"activeLanguage":    params["language"],
			}},
			{Type: "GenericListTable", Props: map[string]interface{}{
				"columns": []map[string]interface{}{
					{"key": "name", "label": "Name", "sortable": true},
					{"key": "slug", "label": "Slug", "width": 180},
					{"key": "langDisplay", "label": "Language", "width": 130},
					{"key": "version", "label": "Version", "width": 90, "align": "center"},
					{"key": "itemCount", "label": "Items", "width": 80, "align": "center"},
					{"key": "updated_at", "label": "Updated", "width": 110, "sortable": true},
					{"key": "actions", "label": "Actions", "width": 140, "align": "right"},
				},
				"rows":       rows,
				"emptyIcon":  "ListTree",
				"emptyTitle": "No menus found",
				"emptyDesc":  "Create your first menu to get started",
				"newPath":    "/admin/menus/new",
				"newLabel":   "New Menu",
				"label":      "menus",
				"hasFilters": hasFilters,
				"sortBy":     sortBy,
				"sortOrder":  sortOrder,
				"pagination": map[string]interface{}{
					"page": page, "perPage": perPage,
					"total": int(total), "totalPages": totalPages,
				},
			}, Actions: map[string]ActionDef{
				"onRowDelete": {
					Type: "SEQUENCE",
					Steps: []ActionDef{
						{Type: "CONFIRM", Message: "Delete this menu? This cannot be undone."},
						{Type: "CORE_API", Method: "menus:delete", Params: map[string]interface{}{"id": "$event.id"}},
						{Type: "TOAST", Message: "Menu deleted", Variant: "success"},
						{Type: "INVALIDATE", Keys: []string{"layout"}},
					},
				},
			}},
		},
	}
}
