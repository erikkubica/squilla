package auth

import (
	"log"
	"net/url"
	"strings"
	"time"

	"squilla/internal/events"
	"squilla/internal/models"

	"gorm.io/gorm"
)

const (
	// maxEmailInputBytes is the RFC 5321 path limit. Anything longer is
	// rejected before it touches the lockout map or the database, so an
	// unauthenticated client can't grow process memory with huge keys.
	maxEmailInputBytes = 254
	// maxPasswordInputBytes bounds the password field on unauthenticated
	// endpoints. The real policy (validateNewPassword) is stricter; this
	// only stops megabyte-sized inputs from reaching bcrypt / the lockout.
	maxPasswordInputBytes = 1024
)

// authInputTooLong reports whether any credential field exceeds the hard
// size caps. Callers answer with their generic failure response.
func authInputTooLong(email string, passwords ...string) bool {
	if len(email) > maxEmailInputBytes {
		return true
	}
	for _, p := range passwords {
		if len(p) > maxPasswordInputBytes {
			return true
		}
	}
	return false
}

// canonicalEmail is the stored / compared form of an account email:
// trimmed and lowercased. Lookups use LOWER(email) = canonicalEmail(x) so
// rows written before normalisation (mixed case) are still found.
func canonicalEmail(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

// findUserByEmail looks an account up case-insensitively.
func findUserByEmail(db *gorm.DB, email string, preloadRole bool) (models.User, error) {
	var user models.User
	q := db
	if preloadRole {
		q = q.Preload("Role")
	}
	err := q.Where("LOWER(email) = ?", canonicalEmail(email)).First(&user).Error
	return user, err
}

// emailTaken reports whether another account (excluding exceptID, 0 for
// none) already uses email, case-insensitively.
func emailTaken(db *gorm.DB, email string, exceptID int) (bool, error) {
	var count int64
	q := db.Model(&models.User{}).Where("LOWER(email) = ?", canonicalEmail(email))
	if exceptID != 0 {
		q = q.Where("id <> ?", exceptID)
	}
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// passwordResetRequest is everything requestPasswordReset needs, captured
// from the fiber.Ctx before the handler returns (the Ctx is recycled
// afterwards and must not be touched from another goroutine).
type passwordResetRequest struct {
	db       *gorm.DB
	resetSvc *PasswordResetService
	bus      *events.EventBus

	email     string
	origin    string // "" when no trustworthy origin is configured (production)
	resetPath string // "/reset-password" or "/admin/reset-password"
	ip        string
	userAgent string
}

// resetDispatchHook lets tests observe completion of the background work.
var resetDispatchHook func()

// startPasswordReset runs the account lookup, token issue and event
// publish off the request goroutine. The HTTP response is therefore the
// same — content and timing — whether or not the account exists: the old
// code returned immediately for unknown emails but waited on a DB insert
// plus synchronous email dispatch for known ones (an enumeration oracle).
func startPasswordReset(r passwordResetRequest) {
	go func() {
		defer func() {
			if resetDispatchHook != nil {
				resetDispatchHook()
			}
		}()
		r.run()
	}()
}

func (r passwordResetRequest) run() {
	user, err := findUserByEmail(r.db, r.email, false)
	if err != nil {
		return
	}
	if r.origin == "" {
		log.Printf("[auth] password reset for user %d NOT sent: no public site origin configured — set the site_url setting or SQUILLA_PUBLIC_URL (the request Host header is not trusted in production)", user.ID)
		return
	}
	rawToken, expires, err := r.resetSvc.IssueToken(user.ID, r.ip, r.userAgent)
	if err != nil {
		log.Printf("[auth] issue reset token user=%d: %v", user.ID, err)
		return
	}
	resetURL := r.origin + r.resetPath + "?token=" + url.QueryEscape(rawToken)
	// Delivered to explicit subscribers and wildcard listeners (the
	// email-manager plugin subscribes to "*"). The admin SSE broadcaster
	// drops this action, so the token never reaches admin browsers.
	r.bus.PublishSync("user.password_reset_requested", events.Payload{
		"user_id":     user.ID,
		"user_email":  user.Email,
		"actor_email": user.Email,
		"reset_url":   resetURL,
		"reset_token": rawToken, // template variable; persisted in email log if logging is enabled
		"expires_at":  expires.Format(time.RFC3339),
		"ip_address":  r.ip,
	})
}
