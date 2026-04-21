package models

import "time"

type McpAuditLog struct {
	ID         int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	TokenID    *int      `gorm:"column:token_id" json:"token_id,omitempty"`
	Tool       string    `gorm:"column:tool;type:varchar(100);not null" json:"tool"`
	ArgsHash   string    `gorm:"column:args_hash;type:varchar(64)" json:"args_hash"`
	Status     string    `gorm:"column:status;type:varchar(16);not null" json:"status"`
	ErrorCode  string    `gorm:"column:error_code;type:varchar(64)" json:"error_code,omitempty"`
	DurationMs int       `gorm:"column:duration_ms;not null;default:0" json:"duration_ms"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (McpAuditLog) TableName() string { return "mcp_audit_log" }
