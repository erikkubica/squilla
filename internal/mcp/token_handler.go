package mcp

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/api"
	"squilla/internal/auth"
	"squilla/internal/models"
)

// TokenHandler exposes MCP token CRUD at /admin/api/mcp-tokens. Session auth
// protects the group, so the current user owns every token they create.
type TokenHandler struct {
	svc *TokenService
}

func NewTokenHandler(svc *TokenService) *TokenHandler {
	return &TokenHandler{svc: svc}
}

func (h *TokenHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/mcp-tokens", h.List)
	router.Post("/mcp-tokens", h.Create)
	router.Delete("/mcp-tokens/:id", h.Revoke)
}

type createTokenRequest struct {
	Name      string  `json:"name"`
	Scope     string  `json:"scope"`
	ExpiresAt *string `json:"expires_at,omitempty"` // RFC3339
}

type createTokenResponse struct {
	Token    string         `json:"token"` // raw, shown once
	TokenRow tokenListEntry `json:"record"`
}

type tokenListEntry struct {
	ID          int        `json:"id"`
	Name        string     `json:"name"`
	TokenPrefix string     `json:"token_prefix"`
	Scope       string     `json:"scope"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (h *TokenHandler) List(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	if user == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "login required")
	}
	rows, err := h.svc.List(user.ID)
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "failed to list tokens")
	}
	out := make([]tokenListEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, tokenListEntry{
			ID: r.ID, Name: r.Name, TokenPrefix: r.TokenPrefix, Scope: r.Scope,
			LastUsedAt: r.LastUsedAt, ExpiresAt: r.ExpiresAt, CreatedAt: r.CreatedAt,
		})
	}
	return api.Success(c, out)
}

func (h *TokenHandler) Create(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	if user == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "login required")
	}
	// Only admin-capability users may mint MCP tokens — they grant CMS-wide control.
	if !auth.HasCapability(user, "admin_access") {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "admin access required to mint MCP tokens")
	}

	var req createTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "invalid JSON body")
	}
	if req.Name == "" {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_NAME", "name is required")
	}

	var exp *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			return api.Error(c, fiber.StatusBadRequest, "INVALID_EXPIRY", "expires_at must be RFC3339")
		}
		exp = &t
	}

	scope, status, code, msg := resolveMintScope(user, req.Scope)
	if status != 0 {
		return api.Error(c, status, code, msg)
	}

	raw, row, err := h.svc.CreateToken(user.ID, req.Name, scope, exp)
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "CREATE_FAILED", err.Error())
	}
	return api.Success(c, createTokenResponse{
		Token: raw,
		TokenRow: tokenListEntry{
			ID: row.ID, Name: row.Name, TokenPrefix: row.TokenPrefix, Scope: row.Scope,
			LastUsedAt: row.LastUsedAt, ExpiresAt: row.ExpiresAt, CreatedAt: row.CreatedAt,
		},
	})
}

// resolveMintScope applies the minting policy: scope=full requires
// manage_settings on top of admin_access (seeded Author/Editor roles have
// admin_access but must not be able to mint an admin-equivalent token).
// An omitted scope defaults to full only for callers allowed to hold it;
// everyone else must pick read or content explicitly. Returns a non-zero
// HTTP status with an error code/message when the request is refused.
func resolveMintScope(user *models.User, requested string) (scope string, status int, code, msg string) {
	scope = requested
	canFull := ownerMayHoldScope(user, ScopeFull)
	if scope == "" {
		if !canFull {
			return "", fiber.StatusBadRequest, "SCOPE_REQUIRED",
				"scope is required: choose \"read\" or \"content\" (\"full\" requires the manage_settings capability)"
		}
		scope = ScopeFull
	}
	if !isValidScope(scope) {
		return "", fiber.StatusBadRequest, "INVALID_SCOPE", "scope must be one of read, content, full"
	}
	if scope == ScopeFull && !canFull {
		return "", fiber.StatusForbidden, "FORBIDDEN", "full-scope MCP tokens require the manage_settings capability"
	}
	return scope, 0, "", ""
}

func (h *TokenHandler) Revoke(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	if user == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "login required")
	}
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "id must be integer")
	}
	if err := h.svc.Revoke(id, user.ID); err != nil {
		if err == ErrTokenNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "token not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "REVOKE_FAILED", "failed to revoke token")
	}
	return api.Success(c, fiber.Map{"ok": true})
}
