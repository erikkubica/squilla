package models

import "time"

// McpToken is a bearer token granting an MCP client access to VibeCMS.
// Raw tokens are shown once at creation; only the SHA-256 hex hash is stored.
type McpToken struct {
	ID           int        `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID       int        `gorm:"column:user_id;not null" json:"user_id"`
	Name         string     `gorm:"column:name;type:varchar(100);not null" json:"name"`
	TokenHash    string     `gorm:"column:token_hash;type:varchar(64);uniqueIndex;not null" json:"-"`
	TokenPrefix  string     `gorm:"column:token_prefix;type:varchar(16);not null" json:"token_prefix"`
	Scope        string     `gorm:"column:scope;type:varchar(16);not null;default:full" json:"scope"`
	Capabilities JSONB      `gorm:"column:capabilities;type:jsonb;not null;default:'{}'" json:"capabilities"`
	LastUsedAt   *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`
	ExpiresAt    *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`
	CreatedAt    time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (McpToken) TableName() string { return "mcp_tokens" }
