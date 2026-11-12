package mcp

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"squilla/internal/auth"
	"squilla/internal/models"
)

var (
	ErrTokenNotFound = errors.New("mcp token not found")
	ErrTokenExpired  = errors.New("mcp token has expired")
	ErrInvalidToken  = errors.New("invalid mcp token")
	// ErrOwnerNotPermitted is returned by Validate when the token's owner
	// no longer holds the role capabilities the token's scope requires
	// (demoted, role edited, user deleted). The token stays in the DB so
	// a re-promotion restores it, but it cannot be used meanwhile.
	ErrOwnerNotPermitted = errors.New("mcp token owner no longer permitted")
	// ErrScopeRequired is returned by CreateToken when no scope is given.
	// The handler resolves the default from the caller's capabilities.
	ErrScopeRequired = errors.New("scope is required")
)

// Capabilities the token owner's role must hold. admin_access gates every
// scope; manage_settings additionally gates scope=full because a full token
// can rewrite settings, deploy+activate extensions (code execution), send
// email and make outbound HTTP calls — far beyond what an author/editor can
// do through the admin UI.
const (
	capMintAny  = "admin_access"
	capMintFull = "manage_settings"
)

// ownerMayHoldScope reports whether user's role may hold a token of scope.
func ownerMayHoldScope(user *models.User, scope string) bool {
	if !auth.HasCapability(user, capMintAny) {
		return false
	}
	if scope == ScopeFull && !auth.HasCapability(user, capMintFull) {
		return false
	}
	return true
}

// Scope values. Kept deliberately small for v1; per-capability ACLs land in v2
// via the capabilities JSONB column already reserved on mcp_tokens.
const (
	ScopeFull    = "full"
	ScopeContent = "content"
	ScopeRead    = "read"
)

// Raw token prefix — doubles as an identifier in logs ("vcms_<prefix>...").
const rawTokenPrefix = "vcms_"

// TokenService manages MCP bearer tokens. Raw tokens are returned once at
// creation; only SHA-256 hashes persist.
type TokenService struct {
	db *gorm.DB
}

func NewTokenService(db *gorm.DB) *TokenService {
	return &TokenService{db: db}
}

// CreateToken issues a new token for userID. The returned rawToken is visible
// only once; callers must surface it to the user before discarding.
func (s *TokenService) CreateToken(userID int, name, scope string, expiresAt *time.Time) (rawToken string, tok *models.McpToken, err error) {
	if scope == "" {
		return "", nil, ErrScopeRequired
	}
	if !isValidScope(scope) {
		return "", nil, fmt.Errorf("invalid scope %q", scope)
	}

	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", nil, fmt.Errorf("generate token: %w", err)
	}
	hexPart := hex.EncodeToString(bytes)
	rawToken = rawTokenPrefix + hexPart
	hash := hashToken(rawToken)
	// Display prefix: "vcms_" + first 8 chars of the hex payload.
	prefix := rawTokenPrefix + hexPart[:8]

	row := &models.McpToken{
		UserID:      userID,
		Name:        name,
		TokenHash:   hash,
		TokenPrefix: prefix,
		Scope:       scope,
		ExpiresAt:   expiresAt,
	}
	if err := s.db.Create(row).Error; err != nil {
		return "", nil, fmt.Errorf("save token: %w", err)
	}
	return rawToken, row, nil
}

// Validate looks up a raw token, checks expiry, and re-checks that the
// owner's role still permits the token's scope. It does not write — the
// HTTP auth middleware calls Touch once per request to bump last_used_at.
func (s *TokenService) Validate(raw string) (*models.McpToken, error) {
	if raw == "" {
		return nil, ErrInvalidToken
	}
	hash := hashToken(raw)

	var tok models.McpToken
	if err := s.db.Where("token_hash = ?", hash).First(&tok).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTokenNotFound
		}
		return nil, fmt.Errorf("query token: %w", err)
	}
	if tok.ExpiresAt != nil && time.Now().After(*tok.ExpiresAt) {
		return nil, ErrTokenExpired
	}

	var owner models.User
	if err := s.db.Preload("Role").First(&owner, tok.UserID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOwnerNotPermitted
		}
		return nil, fmt.Errorf("query token owner: %w", err)
	}
	if !ownerMayHoldScope(&owner, tok.Scope) {
		return nil, ErrOwnerNotPermitted
	}
	return &tok, nil
}

// Touch records that tok was just used. Best-effort: a failed write must
// not fail the request.
func (s *TokenService) Touch(tok *models.McpToken) {
	if tok == nil {
		return
	}
	now := time.Now()
	s.db.Model(&models.McpToken{}).Where("id = ?", tok.ID).Update("last_used_at", now)
	tok.LastUsedAt = &now
}

// List returns all tokens owned by a user, ordered newest first.
func (s *TokenService) List(userID int) ([]models.McpToken, error) {
	var rows []models.McpToken
	if err := s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// ListAll returns every token (admin view).
func (s *TokenService) ListAll() ([]models.McpToken, error) {
	var rows []models.McpToken
	if err := s.db.Order("created_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// Revoke deletes a token by ID if it belongs to userID.
func (s *TokenService) Revoke(id int, userID int) error {
	res := s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.McpToken{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrTokenNotFound
	}
	return nil
}

func isValidScope(s string) bool {
	switch s {
	case ScopeFull, ScopeContent, ScopeRead:
		return true
	}
	return false
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
