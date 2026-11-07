package models

import (
	"encoding/json"
	"time"
)

// NodeType represents a custom content type definition in the CMS.
type NodeType struct {
	ID             int    `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Slug           string `gorm:"column:slug;type:varchar(50);uniqueIndex;not null" json:"slug"`
	Label          string `gorm:"column:label;type:varchar(100);not null" json:"label"`
	LabelPlural    string `gorm:"column:label_plural;type:varchar(100);not null;default:''" json:"label_plural"`
	Icon           string `gorm:"column:icon;type:varchar(50);not null;default:'file-text'" json:"icon"`
	Description    string `gorm:"column:description;type:text;not null;default:''" json:"description"`
	Taxonomies     JSONB  `gorm:"column:taxonomies;type:jsonb;not null;default:'[]'" json:"taxonomies"`
	Fields         JSONB  `gorm:"column:field_schema;type:jsonb;not null;default:'[]'" json:"fields"`
	URLPrefixes    JSONB  `gorm:"column:url_prefixes;type:jsonb;not null;default:'{}'" json:"url_prefixes"`
	ArchiveNodeIDs JSONB  `gorm:"column:archive_node_ids;type:jsonb;not null;default:'{}'" json:"archive_node_ids"`
	SupportsBlocks bool   `gorm:"column:supports_blocks;type:boolean;not null;default:true" json:"supports_blocks"`
	// Public is false for types whose nodes have no page of their own
	// (reviews, FAQs, team members): the router 404s them and the sitemap
	// skips them. They remain queryable from templates and filters.
	Public    bool      `gorm:"column:public;type:boolean;not null;default:true" json:"public"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

// TableName overrides the default GORM table name.
func (NodeType) TableName() string {
	return "node_types"
}

// ArchiveNodeIDMap decodes ArchiveNodeIDs, dropping unset (≤0) entries.
// ArchiveNodeIDs maps language_code → id of the content node that lists
// this type's items (its archive page): {"en": 12}. Term archives live under
// that node's URL; unset languages fall back to the node at the URL prefix.
// Malformed JSON yields an empty map.
func (nt NodeType) ArchiveNodeIDMap() map[string]int {
	out := map[string]int{}
	if len(nt.ArchiveNodeIDs) == 0 {
		return out
	}
	var raw map[string]int
	if json.Unmarshal(nt.ArchiveNodeIDs, &raw) != nil {
		return out
	}
	for lang, id := range raw {
		if lang != "" && id > 0 {
			out[lang] = id
		}
	}
	return out
}
