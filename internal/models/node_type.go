package models

import "time"

// NodeType represents a custom content type definition in the CMS.
type NodeType struct {
	ID          int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Slug        string    `gorm:"column:slug;type:varchar(50);uniqueIndex;not null" json:"slug"`
	Label       string    `gorm:"column:label;type:varchar(100);not null" json:"label"`
	Icon        string    `gorm:"column:icon;type:varchar(50);not null;default:'file-text'" json:"icon"`
	Description string    `gorm:"column:description;type:text;not null;default:''" json:"description"`
	FieldSchema JSONB     `gorm:"column:field_schema;type:jsonb;not null;default:'[]'" json:"field_schema"`
	URLPrefixes JSONB     `gorm:"column:url_prefixes;type:jsonb;not null;default:'{}'" json:"url_prefixes"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

// TableName overrides the default GORM table name.
func (NodeType) TableName() string {
	return "node_types"
}
