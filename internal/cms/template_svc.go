package cms

import (
	"encoding/json"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"vibecms/internal/models"
)

// TemplateService provides business logic for managing templates.
type TemplateService struct {
	db *gorm.DB
}

// NewTemplateService creates a new TemplateService with the given database connection.
func NewTemplateService(db *gorm.DB) *TemplateService {
	return &TemplateService{db: db}
}

// List retrieves all templates ordered by label.
func (s *TemplateService) List() ([]models.Template, error) {
	var templates []models.Template
	if err := s.db.Order("label ASC").Find(&templates).Error; err != nil {
		return nil, fmt.Errorf("listing templates: %w", err)
	}
	return templates, nil
}

// GetByID retrieves a single template by its ID.
func (s *TemplateService) GetByID(id int) (*models.Template, error) {
	var t models.Template
	if err := s.db.First(&t, id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

// GetBySlug retrieves a single template by its slug.
func (s *TemplateService) GetBySlug(slug string) (*models.Template, error) {
	var t models.Template
	if err := s.db.Where("slug = ?", slug).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

// Create inserts a new template after validating slug uniqueness.
func (s *TemplateService) Create(t *models.Template) error {
	if t.Slug == "" {
		return fmt.Errorf("validation error: slug is required")
	}
	if t.Label == "" {
		return fmt.Errorf("validation error: label is required")
	}

	// Check slug uniqueness
	var count int64
	s.db.Model(&models.Template{}).Where("slug = ?", t.Slug).Count(&count)
	if count > 0 {
		return fmt.Errorf("slug conflict: template with slug %q already exists", t.Slug)
	}

	if err := s.db.Create(t).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("slug conflict: template with slug %q already exists", t.Slug)
		}
		return fmt.Errorf("creating template: %w", err)
	}

	return nil
}

// Update performs a partial update on a template by ID.
func (s *TemplateService) Update(id int, updates map[string]interface{}) (*models.Template, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Validate slug uniqueness if slug is being changed
	if newSlug, ok := updates["slug"].(string); ok && newSlug != "" && newSlug != existing.Slug {
		var count int64
		s.db.Model(&models.Template{}).Where("slug = ? AND id != ?", newSlug, id).Count(&count)
		if count > 0 {
			return nil, fmt.Errorf("slug conflict: template with slug %q already exists", newSlug)
		}
	}

	// Convert JSONB fields from parsed JSON (map/slice) to models.JSONB
	for _, key := range []string{"block_config"} {
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
			return nil, fmt.Errorf("slug conflict: template with slug %q already exists", slug)
		}
		return nil, fmt.Errorf("updating template: %w", err)
	}

	// Re-fetch updated template
	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// Delete removes a template by ID.
func (s *TemplateService) Delete(id int) error {
	_, err := s.GetByID(id)
	if err != nil {
		return err
	}

	result := s.db.Delete(&models.Template{}, id)
	if result.Error != nil {
		return fmt.Errorf("deleting template: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
