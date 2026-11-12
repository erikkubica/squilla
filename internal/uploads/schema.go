// Package uploads implements the presigned-URL three-step flow used by
// large-binary MCP tools (core.<kind>.upload_init / PUT /api/uploads/<token> /
// core.<kind>.upload_finalize). Binaries leave the JSON envelope and travel
// over a normal HTTP PUT, with the MCP envelope carrying only metadata.
package uploads

import "time"

// Kind identifies what the eventual finalize step will do with the upload.
// The PUT route validates the kind on the row matches the kind the finalize
// tool expects, so a media token cannot be redeemed as a theme.
type Kind string

const (
	KindMedia     Kind = "media"
	KindTheme     Kind = "theme"
	KindExtension Kind = "extension"
)

// Valid reports whether k is a known kind. Unknown kinds are rejected at
// init time so we never write a row that finalize cannot route.
func (k Kind) Valid() bool {
	switch k {
	case KindMedia, KindTheme, KindExtension:
		return true
	}
	return false
}

// State is the row state machine: pending → uploaded → finalizing →
// finalized. "finalizing" is claimed with a conditional UPDATE so only one
// finalize call installs a given upload. Cleanup deletes pending/uploaded
// rows past expires_at and finalized rows after a short audit window.
type State string

const (
	StatePending    State = "pending"
	StateUploaded   State = "uploaded"
	StateFinalizing State = "finalizing"
	StateFinalized  State = "finalized"
)

// PendingUpload is the GORM row for a single in-flight upload. The primary
// key is the SHA-256 hex of the upload token (single-use, opaque, 256 bits
// of entropy); the raw token is never stored. Store.Issue returns the row
// with Token set to the raw value; rows read back from the DB carry the
// hash. TempPath is informational only — readers derive the staging path
// from the token.
type PendingUpload struct {
	Token       string     `gorm:"column:token;primaryKey;type:varchar(64)" json:"token"`
	Kind        string     `gorm:"column:kind;type:varchar(16);not null" json:"kind"`
	UserID      int64      `gorm:"column:user_id;not null" json:"user_id"`
	Filename    string     `gorm:"column:filename;not null;default:''" json:"filename"`
	MimeType    string     `gorm:"column:mime_type;not null;default:''" json:"mime_type"`
	MaxBytes    int64      `gorm:"column:max_bytes;not null" json:"max_bytes"`
	State       string     `gorm:"column:state;type:varchar(16);not null;default:pending" json:"state"`
	SizeBytes   *int64     `gorm:"column:size_bytes" json:"size_bytes,omitempty"`
	SHA256      *string    `gorm:"column:sha256;type:char(64)" json:"sha256,omitempty"`
	TempPath    *string    `gorm:"column:temp_path" json:"temp_path,omitempty"`
	CreatedAt   time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	ExpiresAt   time.Time  `gorm:"column:expires_at;not null" json:"expires_at"`
	FinalizedAt *time.Time `gorm:"column:finalized_at" json:"finalized_at,omitempty"`
}

// TableName forces the GORM table name regardless of pluralisation rules.
func (PendingUpload) TableName() string { return "pending_uploads" }
