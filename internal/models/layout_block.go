package models

import (
	"encoding/json"
	"time"
)

// LayoutBlock represents a reusable layout block (partial) template in the CMS.
type LayoutBlock struct {
	ID           int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Slug         string    `gorm:"column:slug;type:varchar(255);not null" json:"slug"`
	Name         string    `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description  string    `gorm:"column:description;type:text" json:"description"`
	LanguageID   *int      `gorm:"column:language_id" json:"language_id"`
	TemplateCode string    `gorm:"column:template_code;type:text;not null" json:"template_code"`
	Source       string    `gorm:"column:source;type:varchar(20);not null;default:'custom'" json:"source"`
	ThemeName    *string   `gorm:"column:theme_name;type:varchar(100)" json:"theme_name"`
	Fields       JSONB     `gorm:"column:field_schema;type:jsonb;not null;default:'[]'" json:"fields"`
	ContentHash  string    `gorm:"column:content_hash;type:varchar(64);not null;default:''" json:"content_hash"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

// TableName overrides the default GORM table name.
func (LayoutBlock) TableName() string { return "layout_blocks" }

// UnmarshalJSON accepts the legacy `field_schema` key for `Fields`.
func (l *LayoutBlock) UnmarshalJSON(data []byte) error {
	type alias LayoutBlock
	raw := struct {
		*alias
		LegacyFieldSchema JSONB `json:"field_schema,omitempty"`
	}{alias: (*alias)(l)}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if len(l.Fields) == 0 && len(raw.LegacyFieldSchema) > 0 {
		l.Fields = raw.LegacyFieldSchema
	}
	return nil
}
