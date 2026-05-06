package models

import (
	"encoding/json"
	"time"
)

// NodeType represents a custom content type definition in the CMS.
type NodeType struct {
	ID             int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Slug           string    `gorm:"column:slug;type:varchar(50);uniqueIndex;not null" json:"slug"`
	Label          string    `gorm:"column:label;type:varchar(100);not null" json:"label"`
	LabelPlural    string    `gorm:"column:label_plural;type:varchar(100);not null;default:''" json:"label_plural"`
	Icon           string    `gorm:"column:icon;type:varchar(50);not null;default:'file-text'" json:"icon"`
	Description    string    `gorm:"column:description;type:text;not null;default:''" json:"description"`
	Taxonomies     JSONB     `gorm:"column:taxonomies;type:jsonb;not null;default:'[]'" json:"taxonomies"`
	Fields         JSONB     `gorm:"column:field_schema;type:jsonb;not null;default:'[]'" json:"fields"`
	URLPrefixes    JSONB     `gorm:"column:url_prefixes;type:jsonb;not null;default:'{}'" json:"url_prefixes"`
	SupportsBlocks bool      `gorm:"column:supports_blocks;type:boolean;not null;default:true" json:"supports_blocks"`
	CreatedAt      time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

// TableName overrides the default GORM table name.
func (NodeType) TableName() string {
	return "node_types"
}

// UnmarshalJSON accepts the legacy `field_schema` key for `Fields`.
func (n *NodeType) UnmarshalJSON(data []byte) error {
	type alias NodeType
	raw := struct {
		*alias
		LegacyFieldSchema JSONB `json:"field_schema,omitempty"`
	}{alias: (*alias)(n)}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if len(n.Fields) == 0 && len(raw.LegacyFieldSchema) > 0 {
		n.Fields = raw.LegacyFieldSchema
	}
	return nil
}
