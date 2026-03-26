package cms

import (
	"fmt"
	"strings"
	"sync"

	"gorm.io/gorm"

	"vibecms/internal/models"
)

// LayoutService provides business logic for managing layouts.
type LayoutService struct {
	db    *gorm.DB
	cache sync.Map
}

// NewLayoutService creates a new LayoutService with the given database connection.
func NewLayoutService(db *gorm.DB) *LayoutService {
	return &LayoutService{db: db}
}

// List retrieves layouts with optional filters for language_code and source.
func (s *LayoutService) List(languageCode, source string) ([]models.Layout, error) {
	var layouts []models.Layout
	q := s.db.Order("name ASC")
	if languageCode != "" {
		q = q.Where("language_code = ?", languageCode)
	}
	if source != "" {
		q = q.Where("source = ?", source)
	}
	if err := q.Find(&layouts).Error; err != nil {
		return nil, fmt.Errorf("failed to list layouts: %w", err)
	}
	return layouts, nil
}

// GetByID retrieves a single layout by its ID.
func (s *LayoutService) GetByID(id int) (*models.Layout, error) {
	var layout models.Layout
	if err := s.db.First(&layout, id).Error; err != nil {
		return nil, err
	}
	return &layout, nil
}

// Create inserts a new layout after validating slug+language uniqueness.
func (s *LayoutService) Create(layout *models.Layout) error {
	// Check slug+language_code uniqueness
	var count int64
	s.db.Model(&models.Layout{}).Where("slug = ? AND language_code = ?", layout.Slug, layout.LanguageCode).Count(&count)
	if count > 0 {
		return fmt.Errorf("SLUG_CONFLICT")
	}

	if err := s.db.Create(layout).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("SLUG_CONFLICT")
		}
		return fmt.Errorf("failed to create layout: %w", err)
	}

	s.InvalidateCache()
	return nil
}

// Update performs a partial update on a layout by ID.
func (s *LayoutService) Update(id int, updates map[string]interface{}) (*models.Layout, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Block edits to theme-sourced layouts
	if existing.Source == "theme" {
		return nil, fmt.Errorf("THEME_READONLY")
	}

	// Validate slug+language uniqueness if slug is being changed
	if newSlug, ok := updates["slug"].(string); ok && newSlug != "" && newSlug != existing.Slug {
		langCode := existing.LanguageCode
		if lc, ok := updates["language_code"].(string); ok && lc != "" {
			langCode = lc
		}
		var count int64
		s.db.Model(&models.Layout{}).Where("slug = ? AND language_code = ? AND id != ?", newSlug, langCode, id).Count(&count)
		if count > 0 {
			return nil, fmt.Errorf("SLUG_CONFLICT")
		}
	}

	if err := s.db.Model(existing).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return nil, fmt.Errorf("SLUG_CONFLICT")
		}
		return nil, fmt.Errorf("failed to update layout: %w", err)
	}

	s.InvalidateCache()

	// Re-fetch updated layout
	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// Delete removes a layout by ID. Theme-sourced layouts cannot be deleted.
func (s *LayoutService) Delete(id int) error {
	existing, err := s.GetByID(id)
	if err != nil {
		return err
	}

	if existing.Source == "theme" {
		return fmt.Errorf("THEME_READONLY")
	}

	result := s.db.Delete(&models.Layout{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete layout: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	s.InvalidateCache()
	return nil
}

// Detach converts a theme-sourced layout to a custom layout.
func (s *LayoutService) Detach(id int) (*models.Layout, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if err := s.db.Model(existing).Updates(map[string]interface{}{
		"source":     "custom",
		"theme_name": nil,
	}).Error; err != nil {
		return nil, fmt.Errorf("failed to detach layout: %w", err)
	}

	s.InvalidateCache()

	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// ResolveForNode resolves the best layout for a content node using cascade resolution.
// Priority: 1) explicit LayoutID, 2) layout-{type}-{slug} by lang, 3) layout-{type} by lang,
// 4) is_default=true by lang, 5) error.
func (s *LayoutService) ResolveForNode(node *models.ContentNode, defaultLang string) (*models.Layout, error) {
	// 1. Explicit LayoutID on the node
	if node.LayoutID != nil {
		cacheKey := fmt.Sprintf("id:%d", *node.LayoutID)
		if cached, ok := s.cache.Load(cacheKey); ok {
			if cached == nil {
				return nil, fmt.Errorf("no layout found")
			}
			return cached.(*models.Layout), nil
		}
		layout, err := s.GetByID(*node.LayoutID)
		if err != nil {
			s.cache.Store(cacheKey, nil)
			return nil, fmt.Errorf("no layout found")
		}
		s.cache.Store(cacheKey, layout)
		return layout, nil
	}

	requestedLang := node.LanguageCode

	// 2. layout-{nodeType}-{slug}
	specificSlug := fmt.Sprintf("layout-%s-%s", node.NodeType, node.Slug)
	if layout := s.findBySlugAndLang(specificSlug, requestedLang, defaultLang); layout != nil {
		return layout, nil
	}

	// 3. layout-{nodeType}
	typeSlug := fmt.Sprintf("layout-%s", node.NodeType)
	if layout := s.findBySlugAndLang(typeSlug, requestedLang, defaultLang); layout != nil {
		return layout, nil
	}

	// 4. is_default=true
	if layout := s.findDefault(requestedLang, defaultLang); layout != nil {
		return layout, nil
	}

	return nil, fmt.Errorf("no layout found")
}

// findBySlugAndLang looks up a layout by slug, trying requestedLang first then defaultLang.
func (s *LayoutService) findBySlugAndLang(slug, requestedLang, defaultLang string) *models.Layout {
	langs := []string{requestedLang}
	if defaultLang != requestedLang {
		langs = append(langs, defaultLang)
	}

	for _, lang := range langs {
		cacheKey := fmt.Sprintf("slug:%s:lang:%s", slug, lang)
		if cached, ok := s.cache.Load(cacheKey); ok {
			if cached == nil {
				continue
			}
			return cached.(*models.Layout)
		}

		var layout models.Layout
		err := s.db.Where("slug = ? AND language_code = ?", slug, lang).First(&layout).Error
		if err != nil {
			s.cache.Store(cacheKey, nil)
			continue
		}
		s.cache.Store(cacheKey, &layout)
		return &layout
	}
	return nil
}

// findDefault looks up the default layout, trying requestedLang first then defaultLang.
func (s *LayoutService) findDefault(requestedLang, defaultLang string) *models.Layout {
	langs := []string{requestedLang}
	if defaultLang != requestedLang {
		langs = append(langs, defaultLang)
	}

	for _, lang := range langs {
		cacheKey := fmt.Sprintf("default:lang:%s", lang)
		if cached, ok := s.cache.Load(cacheKey); ok {
			if cached == nil {
				continue
			}
			return cached.(*models.Layout)
		}

		var layout models.Layout
		err := s.db.Where("is_default = ? AND language_code = ?", true, lang).First(&layout).Error
		if err != nil {
			s.cache.Store(cacheKey, nil)
			continue
		}
		s.cache.Store(cacheKey, &layout)
		return &layout
	}
	return nil
}

// InvalidateCache resets the entire layout cache.
func (s *LayoutService) InvalidateCache() {
	s.cache.Range(func(key, value interface{}) bool {
		s.cache.Delete(key)
		return true
	})
}
