package auth

import (
	"fmt"
	"log"
	"strings"
	"time"

	"squilla/internal/api"
	"squilla/internal/events"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdminAuthHandler exposes JSON auth endpoints for the admin SPA. The
// existing PageAuthHandler under /auth/* speaks form POST + redirect with
// flash cookies; that's the right shape for theme-rendered public pages
// but a poor fit for an SPA that wants typed errors and no full-page
// reloads.
//
// Two surfaces, one source of truth: registration / forgot / reset all
// share helpers, services, and security posture (rate limits, account
// lockouts, anti-enumeration timing) with PageAuthHandler. The only
// real differences are JSON I/O and the reset URL pointing at
// /admin/reset-password instead of the public theme page — operators
// who deleted the public auth pages still get a working in-shell flow.
type AdminAuthHandler struct {
	db         *gorm.DB
	sessionSvc *SessionService
	resetSvc   *PasswordResetService
	eventBus   *events.EventBus

	signupLimiter *PerIPLimiter
	forgotLimiter *PerIPLimiter
	resetLimiter  *PerIPLimiter
}

// NewAdminAuthHandler creates a new AdminAuthHandler. Limits mirror the
// public PageAuthHandler so an attacker can't bypass them by switching
// surface.
func NewAdminAuthHandler(db *gorm.DB, sessionSvc *SessionService, eventBus *events.EventBus) *AdminAuthHandler {
	return &AdminAuthHandler{
		db:            db,
		sessionSvc:    sessionSvc,
		resetSvc:      NewPasswordResetService(db),
		eventBus:      eventBus,
		signupLimiter: NewPerIPLimiter(3, time.Hour, 3),
		forgotLimiter: NewPerIPLimiter(3, time.Hour, 3),
		resetLimiter:  NewPerIPLimiter(10, time.Hour, 10),
	}
}

// RegisterRoutes mounts the admin auth JSON endpoints on the public app.
// All four are intentionally UN-authenticated — the user calling them has
// no session yet by definition.
func (h *AdminAuthHandler) RegisterRoutes(app *fiber.App) {
	app.Get("/admin/api/auth/config", h.Config)
	app.Post("/admin/api/auth/register", h.Register)
	app.Post("/admin/api/auth/forgot-password", h.ForgotPassword)
	app.Post("/admin/api/auth/reset-password", h.ResetPassword)
}

// authConfigResponse is the shape consumed by the admin login card to
// decide which sub-flows to expose. Both flags reflect server-side
// security state — flipping them client-side does nothing useful, the
// real check still runs in each endpoint.
type authConfigResponse struct {
	AllowRegistration     bool `json:"allow_registration"`
	PasswordResetEnabled  bool `json:"password_reset_enabled"`
}

// Config returns the gating flags the login UI needs. Public, no auth.
// Both flags are already public information by inference (try registering
// and you'll discover it's disabled), so exposing them up front is safer
// than dead links and confusing error messages.
func (h *AdminAuthHandler) Config(c *fiber.Ctx) error {
	resp := authConfigResponse{
		AllowRegistration:    registrationAllowed(h.db),
		PasswordResetEnabled: h.eventBus != nil && h.eventBus.HasHandlers("email.send"),
	}
	c.Set("Cache-Control", "public, max-age=30")
	return c.JSON(resp)
}

type registerRequest struct {
	FullName        string `json:"full_name"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

// Register handles JSON self-registration. Mirrors PageAuthHandler.ProcessRegister
// — same allow-list gate, same default-role lookup, same auto-login on
// success — just with structured errors instead of flash redirects.
func (h *AdminAuthHandler) Register(c *fiber.Ctx) error {
	if !h.signupLimiter.Allow(c.IP()) {
		return api.Error(c, fiber.StatusTooManyRequests, "RATE_LIMITED", "Too many registration attempts")
	}

	if !registrationAllowed(h.db) {
		return api.Error(c, fiber.StatusForbidden, "REGISTRATION_DISABLED", "Registration is currently disabled")
	}

	var req registerRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	fullName := strings.TrimSpace(req.FullName)
	email := strings.TrimSpace(req.Email)
	password := req.Password
	passwordConfirm := req.PasswordConfirm

	if fullName == "" || email == "" || password == "" || passwordConfirm == "" {
		return api.ValidationError(c, map[string]string{
			"full_name":        "Required",
			"email":            "Required",
			"password":         "Required",
			"password_confirm": "Required",
		})
	}
	if password != passwordConfirm {
		return api.ValidationError(c, map[string]string{
			"password_confirm": "Passwords do not match",
		})
	}

	var existing models.User
	if err := h.db.Where("email = ?", email).First(&existing).Error; err == nil {
		return api.Error(c, fiber.StatusConflict, "EMAIL_TAKEN", "An account with this email already exists")
	}

	hash, err := HashPassword(password)
	if err != nil {
		log.Printf("hash password: %v", err)
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
	}

	roleSlug := defaultRegistrationRoleSlug(h.db)
	var defaultRole models.Role
	if err := h.db.Where("slug = ?", roleSlug).First(&defaultRole).Error; err != nil {
		if roleSlug != "member" {
			log.Printf("default_registration_role=%q not found, falling back to member: %v", roleSlug, err)
			if err := h.db.Where("slug = ?", "member").First(&defaultRole).Error; err != nil {
				log.Printf("find member role: %v", err)
				return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
			}
		} else {
			log.Printf("find member role: %v", err)
			return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
		}
	}

	user := models.User{
		Email:        email,
		PasswordHash: string(hash),
		RoleID:       defaultRole.ID,
		Role:         defaultRole,
		FullName:     &fullName,
	}
	if err := h.db.Create(&user).Error; err != nil {
		log.Printf("create user: %v", err)
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
	}

	token, err := h.sessionSvc.CreateSession(user.ID, c.IP(), c.Get("User-Agent"))
	if err != nil {
		// Account was created but session failed — surface a soft-fail so
		// the SPA can redirect to the login form with a helpful message.
		return c.JSON(fiber.Map{
			"data": fiber.Map{
				"user_id":  user.ID,
				"email":    user.Email,
				"sign_in":  false,
			},
		})
	}

	c.Cookie(&fiber.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		HTTPOnly: true,
		Secure:   IsSecureRequest(c),
		SameSite: "Strict",
		Expires:  time.Now().Add(h.sessionSvc.sessionExpiry),
	})

	if h.eventBus != nil {
		go h.eventBus.Publish("user.registered", events.Payload{
			"user_id":     user.ID,
			"user_email":  user.Email,
			"actor_email": user.Email,
		})
	}

	return api.Success(c, fiber.Map{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role.Slug,
		"sign_in": true,
	})
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

// ForgotPassword issues a reset token and emits user.password_reset_requested
// with a reset URL pointing at /admin/reset-password (NOT the public theme
// path). This way the email link lands the user back in the admin shell,
// even when the operator hasn't shipped public auth pages.
//
// Anti-enumeration: returns the same generic success payload regardless of
// whether the email exists. The "no email provider configured" case is
// global state, not per-account, so surfacing it is not an oracle.
func (h *AdminAuthHandler) ForgotPassword(c *fiber.Ctx) error {
	if h.eventBus == nil || !h.eventBus.HasHandlers("email.send") {
		return api.Error(c, fiber.StatusServiceUnavailable, "EMAIL_DISABLED",
			"Password reset is unavailable — no email provider is configured. Contact your administrator (the CLI 'squilla reset-password' command is available for recovery).")
	}

	if !h.forgotLimiter.Allow(c.IP()) {
		// Same generic message — never tell attackers they're rate-limited.
		return api.Success(c, fiber.Map{"message": forgotPasswordSuccessMsg})
	}

	var req forgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}
	email := strings.TrimSpace(req.Email)
	if email == "" {
		return api.ValidationError(c, map[string]string{"email": "Required"})
	}

	var user models.User
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		return api.Success(c, fiber.Map{"message": forgotPasswordSuccessMsg})
	}

	rawToken, expires, err := h.resetSvc.IssueToken(user.ID, c.IP(), c.Get("User-Agent"))
	if err != nil {
		log.Printf("issue reset token user=%d: %v", user.ID, err)
		return api.Success(c, fiber.Map{"message": forgotPasswordSuccessMsg})
	}

	resetURL := buildAdminResetURL(c, rawToken)
	h.eventBus.PublishSync("user.password_reset_requested", events.Payload{
		"user_id":     user.ID,
		"user_email":  user.Email,
		"actor_email": user.Email,
		"reset_url":   resetURL,
		"reset_token": rawToken,
		"expires_at":  expires.Format(time.RFC3339),
		"ip_address":  c.IP(),
	})

	return api.Success(c, fiber.Map{"message": forgotPasswordSuccessMsg})
}

const forgotPasswordSuccessMsg = "If an account exists with that email, a reset link has been sent."

type resetPasswordRequest struct {
	Token           string `json:"token"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

// ResetPassword consumes a reset token and updates the password. Same
// kill-switch as PageAuthHandler.ProcessResetPassword: invalidates other
// outstanding tokens and wipes every session for the user, so an attacker
// holding a stolen session is forcibly logged out.
func (h *AdminAuthHandler) ResetPassword(c *fiber.Ctx) error {
	if !h.resetLimiter.Allow(c.IP()) {
		return api.Error(c, fiber.StatusTooManyRequests, "RATE_LIMITED", "Too many reset attempts")
	}

	var req resetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}
	token := strings.TrimSpace(req.Token)
	password := req.Password
	passwordConfirm := req.PasswordConfirm

	if token == "" || password == "" || passwordConfirm == "" {
		return api.ValidationError(c, map[string]string{
			"token":            "Required",
			"password":         "Required",
			"password_confirm": "Required",
		})
	}
	if password != passwordConfirm {
		return api.ValidationError(c, map[string]string{
			"password_confirm": "Passwords do not match",
		})
	}

	userID, err := h.resetSvc.VerifyAndConsume(token)
	if err != nil {
		// Generic — don't reveal whether the token was unknown / expired / used.
		return api.Error(c, fiber.StatusBadRequest, "INVALID_TOKEN", "This password reset link is invalid or has expired")
	}

	hash, err := HashPassword(password)
	if err != nil {
		log.Printf("hash new password user=%d: %v", userID, err)
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", string(hash)).Error; err != nil {
		log.Printf("update password user=%d: %v", userID, err)
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
	}

	if err := h.resetSvc.InvalidateAllForUser(userID); err != nil {
		log.Printf("invalidate reset tokens user=%d: %v", userID, err)
	}
	if err := h.db.Where("user_id = ?", userID).Delete(&models.Session{}).Error; err != nil {
		log.Printf("clear sessions after reset user=%d: %v", userID, err)
	}

	// Mirror the bcrypt timing-equivalence the login path uses, so a
	// successful reset doesn't leak via response time vs. the generic
	// "invalid token" case.
	_ = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))

	if h.eventBus != nil {
		go h.eventBus.Publish("user.password_reset_completed", events.Payload{
			"user_id":    userID,
			"ip_address": c.IP(),
		})
	}

	return api.Success(c, fiber.Map{"message": "Password reset successfully. Please sign in with your new password."})
}

// buildAdminResetURL composes an absolute reset URL that lands inside the
// admin shell. Mirrors buildResetURL in page_handler.go but targets the
// SPA route.
func buildAdminResetURL(c *fiber.Ctx, token string) string {
	scheme := "http"
	if IsSecureRequest(c) {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s/admin/reset-password?token=%s", scheme, c.Hostname(), token)
}
