package cms

import (
	"fmt"
	"strings"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// LanguageService provides business logic for managing languages.
type LanguageService struct {
	db *gorm.DB
}

// NewLanguageService creates a new LanguageService with the given database connection.
func NewLanguageService(db *gorm.DB) *LanguageService {
	return &LanguageService{db: db}
}

// List retrieves all languages ordered by sort_order.
func (s *LanguageService) List() ([]models.Language, error) {
	var languages []models.Language
	if err := s.db.Order("sort_order ASC").Find(&languages).Error; err != nil {
		return nil, fmt.Errorf("listing languages: %w", err)
	}
	return languages, nil
}

// ListActive retrieves only active languages ordered by sort_order.
func (s *LanguageService) ListActive() ([]models.Language, error) {
	var languages []models.Language
	if err := s.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&languages).Error; err != nil {
		return nil, fmt.Errorf("listing active languages: %w", err)
	}
	return languages, nil
}

// GetByID retrieves a single language by its ID.
func (s *LanguageService) GetByID(id int) (*models.Language, error) {
	var lang models.Language
	if err := s.db.First(&lang, id).Error; err != nil {
		return nil, err
	}
	return &lang, nil
}

// GetByCode retrieves a single language by its code.
func (s *LanguageService) GetByCode(code string) (*models.Language, error) {
	var lang models.Language
	if err := s.db.Where("code = ?", code).First(&lang).Error; err != nil {
		return nil, err
	}
	return &lang, nil
}

// GetDefault retrieves the default language.
func (s *LanguageService) GetDefault() (*models.Language, error) {
	var lang models.Language
	if err := s.db.Where("is_default = ?", true).First(&lang).Error; err != nil {
		return nil, err
	}
	return &lang, nil
}

// Create inserts a new language after validating code uniqueness.
func (s *LanguageService) Create(lang *models.Language) error {
	if lang.Code == "" {
		return fmt.Errorf("validation error: code is required")
	}
	if lang.Name == "" {
		return fmt.Errorf("validation error: name is required")
	}
	// Default slug to code if not provided
	if lang.Slug == "" {
		lang.Slug = lang.Code
	}

	// Check code uniqueness
	var count int64
	s.db.Model(&models.Language{}).Where("code = ?", lang.Code).Count(&count)
	if count > 0 {
		return fmt.Errorf("code conflict: language with code %q already exists", lang.Code)
	}

	// Check slug uniqueness
	s.db.Model(&models.Language{}).Where("slug = ?", lang.Slug).Count(&count)
	if count > 0 {
		return fmt.Errorf("slug conflict: language with slug %q already exists", lang.Slug)
	}

	if err := s.db.Create(lang).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return fmt.Errorf("code conflict: language with code %q already exists", lang.Code)
		}
		return fmt.Errorf("creating language: %w", err)
	}

	return nil
}

// Update performs a partial update on a language by ID.
// If setting is_default=true, all other languages are unset first.
func (s *LanguageService) Update(id int, updates map[string]interface{}) (*models.Language, error) {
	existing, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Validate code uniqueness if code is being changed
	if newCode, ok := updates["code"].(string); ok && newCode != "" && newCode != existing.Code {
		var count int64
		s.db.Model(&models.Language{}).Where("code = ? AND id != ?", newCode, id).Count(&count)
		if count > 0 {
			return nil, fmt.Errorf("code conflict: language with code %q already exists", newCode)
		}
	}

	// If setting is_default=true, unset all others first
	if isDefault, ok := updates["is_default"]; ok {
		if def, isBool := isDefault.(bool); isBool && def {
			if err := s.db.Model(&models.Language{}).Where("id != ?", id).Update("is_default", false).Error; err != nil {
				return nil, fmt.Errorf("unsetting default languages: %w", err)
			}
		}
	}

	// Check slug uniqueness if slug is being changed
	if newSlug, ok := updates["slug"].(string); ok && newSlug != "" && newSlug != existing.Slug {
		var count int64
		s.db.Model(&models.Language{}).Where("slug = ? AND id != ?", newSlug, id).Count(&count)
		if count > 0 {
			return nil, fmt.Errorf("slug conflict: language with slug %q already exists", newSlug)
		}
	}

	// Snapshot old values before update
	oldSlug := existing.Slug
	oldHidePrefix := existing.HidePrefix

	if err := s.db.Model(existing).Updates(updates).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			code := updates["code"]
			return nil, fmt.Errorf("code conflict: language with code %q already exists", code)
		}
		return nil, fmt.Errorf("updating language: %w", err)
	}

	// Re-fetch updated language
	updated, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Rebuild full_url for all content nodes if slug or hide_prefix changed
	needsRebuild := updated.Slug != oldSlug || updated.HidePrefix != oldHidePrefix
	// Also check if hide_prefix was explicitly in the update payload
	if _, ok := updates["hide_prefix"]; ok {
		needsRebuild = true
	}
	if _, ok := updates["slug"]; ok {
		needsRebuild = true
	}
	if needsRebuild {
		s.rebuildAllURLsForLanguage(updated.Code)
	}

	return updated, nil
}

// GetBySlug retrieves a single language by its URL slug.
func (s *LanguageService) GetBySlug(slug string) (*models.Language, error) {
	var lang models.Language
	if err := s.db.Where("slug = ?", slug).First(&lang).Error; err != nil {
		return nil, err
	}
	return &lang, nil
}

// rebuildAllURLsForLanguage rebuilds full_url for every content node with the
// given language code using the canonical buildFullURL logic.
func (s *LanguageService) rebuildAllURLsForLanguage(langCode string) {
	var nodes []models.ContentNode
	s.db.Where("language_code = ? AND deleted_at IS NULL", langCode).Find(&nodes)
	for _, node := range nodes {
		newURL := buildFullURL(&node, s.db)
		if newURL != node.FullURL {
			s.db.Model(&node).Update("full_url", newURL)
		}
	}
}

// Delete removes a language by ID. The default language cannot be deleted.
func (s *LanguageService) Delete(id int) error {
	existing, err := s.GetByID(id)
	if err != nil {
		return err
	}

	// Prevent deleting the default language
	if existing.IsDefault {
		return fmt.Errorf("cannot delete default language %q", existing.Code)
	}

	result := s.db.Delete(&models.Language{}, id)
	if result.Error != nil {
		return fmt.Errorf("deleting language: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
