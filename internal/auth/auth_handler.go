package auth

import (
	"time"

	"squilla/internal/api"
	"squilla/internal/httpobs"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// loginRequest represents the expected JSON body for login.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthHandler handles authentication-related HTTP endpoints.
type AuthHandler struct {
	db         *gorm.DB
	sessionSvc *SessionService

	loginLimiter *PerIPLimiter
	lockout      *LockoutTracker
	// passwordLockout throttles wrong current-password attempts on
	// POST /me/password, keyed by user ID, so a stolen session can't
	// brute-force the account password.
	passwordLockout *LockoutTracker
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(db *gorm.DB, sessionSvc *SessionService) *AuthHandler {
	return &AuthHandler{
		db:           db,
		sessionSvc:   sessionSvc,
		loginLimiter: NewPerIPLimiter(10, time.Minute, 10),
		lockout:      NewLoginLockout(),

		passwordLockout: NewLockoutTracker(5, 15*time.Minute, 15*time.Minute),
	}
}

// NewLoginLockout returns the per-account lockout used by the login
// endpoints: 5 failures within 15 minutes lock the account for 15 minutes.
func NewLoginLockout() *LockoutTracker {
	return NewLockoutTracker(5, 15*time.Minute, 15*time.Minute)
}

// LoginLockout exposes the account lockout so the form-based login
// (PageAuthHandler) can share it — two independent trackers would double
// an attacker's guess budget per account.
func (h *AuthHandler) LoginLockout() *LockoutTracker { return h.lockout }

// CleanIdle prunes idle rate-limiter and lockout entries.
func (h *AuthHandler) CleanIdle() {
	h.loginLimiter.CleanRefilled()
	h.lockout.CleanIdle()
	h.passwordLockout.CleanIdle()
}

// RegisterRoutes registers authentication routes under /auth and /me.
func (h *AuthHandler) RegisterRoutes(app *fiber.App) {
	app.Post("/auth/login", h.Login)
	app.Post("/auth/logout", AuthRequired(h.sessionSvc), h.Logout)
	app.Get("/me", AuthRequired(h.sessionSvc), h.Me)
	// Self-service profile endpoints live outside /admin/api (so members
	// without admin_access can use them too), which means the group-level
	// CSRF guard doesn't cover them — mount it per route.
	app.Patch("/me", AuthRequired(h.sessionSvc), JSONOnlyMutations(), h.UpdateMe)
	app.Post("/me/password", AuthRequired(h.sessionSvc), JSONOnlyMutations(), h.ChangeMyPassword)
}

// Login authenticates a user with email and password, creates a session,
// and sets an HTTP-only session cookie.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	if !h.loginLimiter.Allow(httpobs.ClientIP(c)) {
		return api.Error(c, fiber.StatusTooManyRequests, "RATE_LIMITED", "Too many sign-in attempts")
	}

	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	req.Email = canonicalEmail(req.Email)
	if req.Email == "" || req.Password == "" {
		return api.ValidationError(c, map[string]string{
			"email":    "Email is required",
			"password": "Password is required",
		})
	}
	// Size caps before any lockout/DB work: the lockout map is keyed by
	// this attacker-supplied string.
	if authInputTooLong(req.Email, req.Password) {
		return api.Error(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	}

	if h.lockout.IsLocked(req.Email) {
		return api.Error(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	}

	user, err := findUserByEmail(h.db, req.Email, true)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Burn an equivalent bcrypt comparison so the response
			// time matches the user-found path. Without this, an
			// attacker can enumerate registered emails by timing.
			AbsorbBcryptTime()
			h.lockout.RecordFailure(req.Email)
			return api.Error(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
		}
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		h.lockout.RecordFailure(req.Email)
		return api.Error(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password")
	}

	h.lockout.RecordSuccess(req.Email)

	token, sessErr := h.sessionSvc.CreateSession(user.ID, httpobs.ClientIP(c), c.Get("User-Agent"))
	if sessErr != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create session")
	}

	// Update last login timestamp.
	now := time.Now()
	h.db.Model(&user).Update("last_login_at", now)

	c.Cookie(&fiber.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		HTTPOnly: true,
		Secure:   IsSecureRequest(c),
		SameSite: "Strict",
		Expires:  time.Now().Add(h.sessionSvc.sessionExpiry),
	})

	return api.Success(c, fiber.Map{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role.Slug,
	})
}

// Logout invalidates the current session and clears the session cookie.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	token := c.Cookies(CookieName)
	if token != "" {
		_ = h.sessionSvc.DeleteSession(token)
	}

	c.Cookie(&fiber.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   IsSecureRequest(c),
		SameSite: "Strict",
		Expires:  time.Now().Add(-1 * time.Hour),
	})

	return api.Success(c, fiber.Map{
		"message": "Logged out successfully",
	})
}

// Me returns the profile of the currently authenticated user.
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	user := GetCurrentUser(c)
	if user == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	}

	return api.Success(c, fiber.Map{
		"id":            user.ID,
		"email":         user.Email,
		"full_name":     user.FullName,
		"role":          user.Role.Slug,
		"role_name":     user.Role.Name,
		"role_id":       user.RoleID,
		"capabilities":  ParseCapabilities(user.Role.Capabilities),
		"last_login_at": user.LastLoginAt,
	})
}
