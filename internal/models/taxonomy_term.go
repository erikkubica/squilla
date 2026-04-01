package models

import "time"

// TaxonomyTerm represents a single term (category, tag, etc.) in a taxonomy.
type TaxonomyTerm struct {
	ID          int           `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	NodeType    string        `gorm:"column:node_type;type:varchar(50);not null" json:"node_type"`
	Taxonomy    string        `gorm:"column:taxonomy;type:varchar(50);not null" json:"taxonomy"`
	Slug        string        `gorm:"column:slug;type:varchar(255);not null" json:"slug"`
	Name        string        `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description string        `gorm:"column:description;type:text;not null;default:''" json:"description"`
	ParentID    *int          `gorm:"column:parent_id" json:"parent_id,omitempty"`
	Count       int           `gorm:"column:count;not null;default:0" json:"count"`
	FieldsData  JSONB         `gorm:"column:fields_data;type:jsonb;not null;default:'{}'" json:"fields_data"`
	CreatedAt   time.Time     `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time     `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	
	// Optional relations
	Parent      *TaxonomyTerm `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
}

// TableName overrides the default GORM table name.
func (TaxonomyTerm) TableName() string {
	return "taxonomy_terms"
}
