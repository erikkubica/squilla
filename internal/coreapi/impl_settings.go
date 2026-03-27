package coreapi

import (
	"context"
	"fmt"
	"strings"

	"vibecms/internal/models"

	"gorm.io/gorm"
)

// GetSetting returns the value for a site setting key.
// Returns an empty string (not an error) if the key is missing.
func (c *coreImpl) GetSetting(_ context.Context, key string) (string, error) {
	var s models.SiteSetting
	if err := c.db.Where("\"key\" = ?", key).First(&s).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", nil
		}
		return "", fmt.Errorf("coreapi GetSetting: %w", err)
	}
	if s.Value == nil {
		return "", nil
	}
	return *s.Value, nil
}

// SetSetting upserts a site setting (insert or update).
func (c *coreImpl) SetSetting(_ context.Context, key, value string) error {
	var s models.SiteSetting
	result := c.db.Where("\"key\" = ?", key).First(&s)

	if result.Error == gorm.ErrRecordNotFound {
		s = models.SiteSetting{Key: key, Value: &value}
		if err := c.db.Create(&s).Error; err != nil {
			return fmt.Errorf("coreapi SetSetting create: %w", err)
		}
		return nil
	}
	if result.Error != nil {
		return fmt.Errorf("coreapi SetSetting lookup: %w", result.Error)
	}

	s.Value = &value
	if err := c.db.Save(&s).Error; err != nil {
		return fmt.Errorf("coreapi SetSetting update: %w", err)
	}
	return nil
}

// GetSettings returns settings matching an optional prefix.
// If prefix is non-empty, only keys starting with that prefix are returned,
// and the prefix is trimmed from the keys in the result map.
func (c *coreImpl) GetSettings(_ context.Context, prefix string) (map[string]string, error) {
	var settings []models.SiteSetting

	query := c.db.Model(&models.SiteSetting{})
	if prefix != "" {
		query = query.Where("\"key\" LIKE ?", prefix+"%")
	}

	if err := query.Find(&settings).Error; err != nil {
		return nil, fmt.Errorf("coreapi GetSettings: %w", err)
	}

	result := make(map[string]string, len(settings))
	for _, s := range settings {
		k := s.Key
		if prefix != "" {
			k = strings.TrimPrefix(k, prefix)
		}
		v := ""
		if s.Value != nil {
			v = *s.Value
		}
		result[k] = v
	}
	return result, nil
}
