package models

import (
	"time"

	"github.com/lib/pq"
)

// Taxonomy represents a classification definition (e.g. Category, Tag).
type Taxonomy struct {
	ID           int            `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Slug         string         `gorm:"column:slug;type:varchar(50);not null;unique" json:"slug"`
	Label        string         `gorm:"column:label;type:varchar(255);not null" json:"label"`
	LabelPlural  string         `gorm:"column:label_plural;type:varchar(255);not null;default:''" json:"label_plural"`
	Description  string         `gorm:"column:description;type:text;not null;default:''" json:"description"`
	Hierarchical bool           `gorm:"column:hierarchical;not null;default:false" json:"hierarchical"`
	ShowUI       bool           `gorm:"column:show_ui;not null;default:true" json:"show_ui"`
	NodeTypes    pq.StringArray `gorm:"column:node_types;type:text[];not null;default:'{}'" json:"node_types"`
	Fields       JSONB          `gorm:"column:field_schema;type:jsonb;not null;default:'[]'" json:"fields"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

// TableName overrides the default GORM table name.
func (Taxonomy) TableName() string {
	return "taxonomies"
}
