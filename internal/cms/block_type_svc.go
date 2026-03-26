package cms

import (
	"encoding/json"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"vibecms/internal/models"
)

// BlockTypeService provides business logic for managing block types.
type BlockTypeService struct {
	db *gorm.DB
}

// NewBlockTypeService creates a new BlockTypeService with the given database connection.
func NewBlockTypeService(db *gorm.DB) *BlockTypeService {
	return &BlockTypeService{db: db}
}

// List retrieves all block types ordered by label.
func (s *BlockTypeService) List() ([]models.BlockType, error) {
	var blockTypes []models.BlockType
	if err := s.db.Order("label ASC").Find(&blockTypes).Error; err != nil {
		return nil, fmt.Errorf("listing block types: %w", err)
	}
	return blockTypes, nil
}

// GetByID retrieves a single block type by its ID.
func (s *BlockTypeService) GetByID(id int) (*models.BlockType, error) {
	var bt models.BlockType
	if err := s.db.First(&bt, id).Error; err != nil {
		return nil, err
	}
	return &bt, nil
}

// GetBySlug retrieves a single block type by its slug.
func (s *BlockTypeService) GetBySlug(slug string) (*models.BlockType, error) {
	var bt models.BlockType
	if err := s.db.Where("slug = ?", slug).First(&bt).Error; err != nil {
		return nil, err
	}
	return &bt, nil
}

// Create inserts a new block type after validating slug uniqueness.
func (s *BlockTypeService) Create(bt *models.BlockType) error {
	if bt.Slug == "" {
		return fmt.Errorf("validation error: slug is required")
	}
	if bt.Label == "" {
		return fmt.Errorf("validation error: label is required")
	}

	// Check slug uniqueness
	var count int64
	s.db.Model(&models.BlockType{}).Where("slug = ?", bt.Slug).Count(&count)
	if count > 0 {
		return fmt.Errorf("slug conflict: block type with slug %q already exists", bt.Slug)
	}

	if err := s.db.Create(bt).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("slug conflict: block type with slug %q already exists", bt.Slug)
		}
		return fmt.Errorf("creating block type: %w", err)
	}

	return nil
}

// Update performs a partial update on a block type by ID.
func (s *BlockTypeService) Update(id int, updates map[string]interface{}) (*models.BlockType, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Validate slug uniqueness if slug is being changed
	if newSlug, ok := updates["slug"].(string); ok && newSlug != "" && newSlug != existing.Slug {
		var count int64
		s.db.Model(&models.BlockType{}).Where("slug = ? AND id != ?", newSlug, id).Count(&count)
		if count > 0 {
			return nil, fmt.Errorf("slug conflict: block type with slug %q already exists", newSlug)
		}
	}

	// Convert JSONB fields from parsed JSON (map/slice) to models.JSONB
	for _, key := range []string{"field_schema", "test_data"} {
		if val, ok := updates[key]; ok && val != nil {
			b, err := json.Marshal(val)
			if err == nil {
				updates[key] = models.JSONB(b)
			}
		}
	}

	if err := s.db.Model(existing).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			slug := updates["slug"]
			return nil, fmt.Errorf("slug conflict: block type with slug %q already exists", slug)
		}
		return nil, fmt.Errorf("updating block type: %w", err)
	}

	// Re-fetch updated block type
	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// Delete removes a block type by ID.
func (s *BlockTypeService) Delete(id int) error {
	_, err := s.GetByID(id)
	if err != nil {
		return err
	}

	result := s.db.Delete(&models.BlockType{}, id)
	if result.Error != nil {
		return fmt.Errorf("deleting block type: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
