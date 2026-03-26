package cms

import (
	"fmt"
	"strings"
	"sync"

	"gorm.io/gorm"

	"vibecms/internal/models"
)

// LayoutBlockService provides business logic for managing layout blocks (partials).
type LayoutBlockService struct {
	db    *gorm.DB
	cache sync.Map
}

// NewLayoutBlockService creates a new LayoutBlockService with the given database connection.
func NewLayoutBlockService(db *gorm.DB) *LayoutBlockService {
	return &LayoutBlockService{db: db}
}

// List retrieves layout blocks with optional filters for language_id and source.
func (s *LayoutBlockService) List(languageID *int, source string) ([]models.LayoutBlock, error) {
	var blocks []models.LayoutBlock
	q := s.db.Order("name ASC")
	if languageID != nil {
		q = q.Where("language_id = ?", *languageID)
	}
	if source != "" {
		q = q.Where("source = ?", source)
	}
	if err := q.Find(&blocks).Error; err != nil {
		return nil, fmt.Errorf("failed to list layout blocks: %w", err)
	}
	return blocks, nil
}

// GetByID retrieves a single layout block by its ID.
func (s *LayoutBlockService) GetByID(id int) (*models.LayoutBlock, error) {
	var block models.LayoutBlock
	if err := s.db.First(&block, id).Error; err != nil {
		return nil, err
	}
	return &block, nil
}

// Resolve finds a layout block by slug, trying the specific language_id first then falling back to NULL (all languages).
// Results are cached for performance.
func (s *LayoutBlockService) Resolve(slug string, languageID *int) (*models.LayoutBlock, error) {
	type langQuery struct {
		id       *int
		cacheKey string
	}

	queries := []langQuery{}
	if languageID != nil {
		queries = append(queries, langQuery{id: languageID, cacheKey: fmt.Sprintf("slug:%s:lang:%d", slug, *languageID)})
	}
	queries = append(queries, langQuery{id: nil, cacheKey: fmt.Sprintf("slug:%s:lang:null", slug)})

	for _, q := range queries {
		if cached, ok := s.cache.Load(q.cacheKey); ok {
			if cached == nil {
				continue
			}
			return cached.(*models.LayoutBlock), nil
		}

		var block models.LayoutBlock
		var err error
		if q.id != nil {
			err = s.db.Where("slug = ? AND language_id = ?", slug, *q.id).First(&block).Error
		} else {
			err = s.db.Where("slug = ? AND language_id IS NULL", slug).First(&block).Error
		}
		if err != nil {
			s.cache.Store(q.cacheKey, nil)
			continue
		}
		s.cache.Store(q.cacheKey, &block)
		return &block, nil
	}

	return nil, fmt.Errorf("no layout block found for slug %q", slug)
}

// Create inserts a new layout block after validating slug+language uniqueness.
func (s *LayoutBlockService) Create(block *models.LayoutBlock) error {
	// Check slug+language_id uniqueness
	var count int64
	if block.LanguageID != nil {
		s.db.Model(&models.LayoutBlock{}).Where("slug = ? AND language_id = ?", block.Slug, *block.LanguageID).Count(&count)
	} else {
		s.db.Model(&models.LayoutBlock{}).Where("slug = ? AND language_id IS NULL", block.Slug).Count(&count)
	}
	if count > 0 {
		return fmt.Errorf("SLUG_CONFLICT")
	}

	if err := s.db.Create(block).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("SLUG_CONFLICT")
		}
		return fmt.Errorf("failed to create layout block: %w", err)
	}

	s.InvalidateCache()
	return nil
}

// Update performs a partial update on a layout block by ID.
func (s *LayoutBlockService) Update(id int, updates map[string]interface{}) (*models.LayoutBlock, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Block edits to theme-sourced layout blocks
	if existing.Source == "theme" {
		return nil, fmt.Errorf("THEME_READONLY")
	}

	// Validate slug+language uniqueness if slug is being changed
	if newSlug, ok := updates["slug"].(string); ok && newSlug != "" && newSlug != existing.Slug {
		langID := existing.LanguageID
		if lid, ok := updates["language_id"]; ok {
			if lid == nil {
				langID = nil
			} else if lidFloat, ok := lid.(float64); ok {
				lidInt := int(lidFloat)
				langID = &lidInt
			}
		}
		var count int64
		if langID != nil {
			s.db.Model(&models.LayoutBlock{}).Where("slug = ? AND language_id = ? AND id != ?", newSlug, *langID, id).Count(&count)
		} else {
			s.db.Model(&models.LayoutBlock{}).Where("slug = ? AND language_id IS NULL AND id != ?", newSlug, id).Count(&count)
		}
		if count > 0 {
			return nil, fmt.Errorf("SLUG_CONFLICT")
		}
	}

	if err := s.db.Model(existing).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return nil, fmt.Errorf("SLUG_CONFLICT")
		}
		return nil, fmt.Errorf("failed to update layout block: %w", err)
	}

	s.InvalidateCache()

	// Re-fetch updated layout block
	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// Delete removes a layout block by ID. Theme-sourced layout blocks cannot be deleted.
func (s *LayoutBlockService) Delete(id int) error {
	existing, err := s.GetByID(id)
	if err != nil {
		return err
	}

	if existing.Source == "theme" {
		return fmt.Errorf("THEME_READONLY")
	}

	result := s.db.Delete(&models.LayoutBlock{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete layout block: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	s.InvalidateCache()
	return nil
}

// Detach converts a theme-sourced layout block to a custom layout block.
func (s *LayoutBlockService) Detach(id int) (*models.LayoutBlock, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if err := s.db.Model(existing).Updates(map[string]interface{}{
		"source":     "custom",
		"theme_name": nil,
	}).Error; err != nil {
		return nil, fmt.Errorf("failed to detach layout block: %w", err)
	}

	s.InvalidateCache()

	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// InvalidateCache resets the entire layout block cache.
func (s *LayoutBlockService) InvalidateCache() {
	s.cache.Range(func(key, value interface{}) bool {
		s.cache.Delete(key)
		return true
	})
}
