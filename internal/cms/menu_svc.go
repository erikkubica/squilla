package cms

import (
	"fmt"
	"strings"
	"sync"

	"gorm.io/gorm"

	"vibecms/internal/models"
)

// MenuService provides business logic for managing menus and menu items.
type MenuService struct {
	db    *gorm.DB
	cache sync.Map
}

// NewMenuService creates a new MenuService with the given database connection.
func NewMenuService(db *gorm.DB) *MenuService {
	return &MenuService{db: db}
}

// List retrieves menus with an optional language_code filter.
func (s *MenuService) List(languageCode string) ([]models.Menu, error) {
	var menus []models.Menu
	q := s.db.Order("name ASC")
	if languageCode != "" {
		q = q.Where("language_code = ?", languageCode)
	}
	if err := q.Find(&menus).Error; err != nil {
		return nil, fmt.Errorf("failed to list menus: %w", err)
	}
	return menus, nil
}

// GetByID retrieves a single menu by its ID, including nested items tree.
func (s *MenuService) GetByID(id int) (*models.Menu, error) {
	var menu models.Menu
	if err := s.db.First(&menu, id).Error; err != nil {
		return nil, err
	}

	var items []models.MenuItem
	if err := s.db.Where("menu_id = ?", id).Order("sort_order ASC").Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to load menu items: %w", err)
	}
	menu.Items = buildTree(items)

	return &menu, nil
}

// Create inserts a new menu after validating slug+language uniqueness.
func (s *MenuService) Create(menu *models.Menu) error {
	var count int64
	s.db.Model(&models.Menu{}).Where("slug = ? AND language_code = ?", menu.Slug, menu.LanguageCode).Count(&count)
	if count > 0 {
		return fmt.Errorf("SLUG_CONFLICT")
	}

	if err := s.db.Create(menu).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("SLUG_CONFLICT")
		}
		return fmt.Errorf("failed to create menu: %w", err)
	}

	s.InvalidateCache()
	return nil
}

// Update performs a partial update on menu metadata by ID.
func (s *MenuService) Update(id int, updates map[string]interface{}) (*models.Menu, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Validate slug+language uniqueness if slug is being changed.
	if newSlug, ok := updates["slug"].(string); ok && newSlug != "" && newSlug != existing.Slug {
		langCode := existing.LanguageCode
		if lc, ok := updates["language_code"].(string); ok && lc != "" {
			langCode = lc
		}
		var count int64
		s.db.Model(&models.Menu{}).Where("slug = ? AND language_code = ? AND id != ?", newSlug, langCode, id).Count(&count)
		if count > 0 {
			return nil, fmt.Errorf("SLUG_CONFLICT")
		}
	}

	if err := s.db.Model(&models.Menu{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return nil, fmt.Errorf("SLUG_CONFLICT")
		}
		return nil, fmt.Errorf("failed to update menu: %w", err)
	}

	s.InvalidateCache()

	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// Delete removes a menu and all its items by ID.
func (s *MenuService) Delete(id int) error {
	_, err := s.GetByID(id)
	if err != nil {
		return err
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("menu_id = ?", id).Delete(&models.MenuItem{}).Error; err != nil {
			return fmt.Errorf("failed to delete menu items: %w", err)
		}
		result := tx.Delete(&models.Menu{}, id)
		if result.Error != nil {
			return fmt.Errorf("failed to delete menu: %w", result.Error)
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		s.InvalidateCache()
		return nil
	})
}

// ReplaceItems atomically replaces all items in a menu with a new tree,
// using optimistic locking via the version field.
func (s *MenuService) ReplaceItems(menuID, clientVersion int, tree []models.MenuItemTree) error {
	// Fetch menu and check version.
	var menu models.Menu
	if err := s.db.First(&menu, menuID).Error; err != nil {
		return err
	}
	if menu.Version != clientVersion {
		return fmt.Errorf("VERSION_CONFLICT")
	}

	// Validate tree depth (max 3 levels: 0, 1, 2).
	if err := validateTreeDepth(tree, 0); err != nil {
		return err
	}

	// Transaction: delete old items, insert new tree, bump version.
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("menu_id = ?", menuID).Delete(&models.MenuItem{}).Error; err != nil {
			return fmt.Errorf("failed to delete existing items: %w", err)
		}

		if err := insertItems(tx, menuID, nil, tree, 0); err != nil {
			return fmt.Errorf("failed to insert items: %w", err)
		}

		if err := tx.Model(&models.Menu{}).Where("id = ?", menuID).Updates(map[string]interface{}{
			"version": menu.Version + 1,
		}).Error; err != nil {
			return fmt.Errorf("failed to bump version: %w", err)
		}

		return nil
	})
}

// Resolve finds a menu by slug, trying the requested language first then the default language.
// Results are cached.
func (s *MenuService) Resolve(slug, lang, defaultLang string) (*models.Menu, error) {
	langs := []string{lang}
	if defaultLang != lang {
		langs = append(langs, defaultLang)
	}
	langs = append(langs, "*")

	for _, l := range langs {
		cacheKey := fmt.Sprintf("resolve:%s:%s", slug, l)
		if cached, ok := s.cache.Load(cacheKey); ok {
			if cached == nil {
				continue
			}
			return cached.(*models.Menu), nil
		}

		var menu models.Menu
		err := s.db.Where("slug = ? AND language_code = ?", slug, l).First(&menu).Error
		if err != nil {
			s.cache.Store(cacheKey, nil)
			continue
		}

		// Load items and build tree.
		var items []models.MenuItem
		if err := s.db.Where("menu_id = ?", menu.ID).Order("sort_order ASC").Find(&items).Error; err != nil {
			return nil, fmt.Errorf("failed to load menu items: %w", err)
		}
		menu.Items = buildTree(items)

		s.cache.Store(cacheKey, &menu)
		return &menu, nil
	}

	return nil, fmt.Errorf("menu not found for slug=%s", slug)
}

// InvalidateCache resets the entire menu cache.
func (s *MenuService) InvalidateCache() {
	s.cache.Range(func(key, value interface{}) bool {
		s.cache.Delete(key)
		return true
	})
}

// buildTree converts a flat list of MenuItem records into a nested tree structure.
// Root items have nil ParentID.
func buildTree(flat []models.MenuItem) []models.MenuItem {
	byID := make(map[int]*models.MenuItem, len(flat))
	var roots []models.MenuItem

	// Index all items by ID.
	for i := range flat {
		flat[i].Children = nil
		byID[flat[i].ID] = &flat[i]
	}

	// Assign children to their parents.
	for i := range flat {
		if flat[i].ParentID == nil {
			roots = append(roots, flat[i])
		} else {
			if parent, ok := byID[*flat[i].ParentID]; ok {
				parent.Children = append(parent.Children, flat[i])
			}
		}
	}

	// Update roots with populated children from the map.
	for i := range roots {
		if mapped, ok := byID[roots[i].ID]; ok {
			roots[i].Children = mapped.Children
		}
	}

	return roots
}

// validateTreeDepth ensures no branch exceeds maxDepth (3 levels: 0, 1, 2).
func validateTreeDepth(items []models.MenuItemTree, depth int) error {
	if depth > 2 {
		return fmt.Errorf("DEPTH_EXCEEDED: max 3 levels (0-2)")
	}
	for _, item := range items {
		if len(item.Children) > 0 {
			if err := validateTreeDepth(item.Children, depth+1); err != nil {
				return err
			}
		}
	}
	return nil
}

// insertItems recursively inserts MenuItemTree nodes into the database.
func insertItems(tx *gorm.DB, menuID int, parentID *int, items []models.MenuItemTree, sortStart int) error {
	for i, item := range items {
		target := item.Target
		if target == "" {
			target = "_self"
		}
		itemType := item.ItemType
		if itemType == "" {
			itemType = "url"
		}

		mi := models.MenuItem{
			MenuID:    menuID,
			ParentID:  parentID,
			Title:     item.Title,
			ItemType:  itemType,
			NodeID:    item.NodeID,
			URL:       item.URL,
			Target:    target,
			CSSClass:  item.CSSClass,
			SortOrder: sortStart + i,
		}

		if err := tx.Create(&mi).Error; err != nil {
			return err
		}

		if len(item.Children) > 0 {
			if err := insertItems(tx, menuID, &mi.ID, item.Children, 0); err != nil {
				return err
			}
		}
	}
	return nil
}
