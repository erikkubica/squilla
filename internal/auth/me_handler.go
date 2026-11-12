package auth

import (
	"log"
	"net/mail"
	"strconv"
	"strings"
	"unicode/utf8"

	"squilla/internal/api"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

const (
	// minPasswordLength is the floor for self-service password changes.
	minPasswordLength = 8
	// maxPasswordBytes is bcrypt's input limit; longer input is silently
	// truncated by bcrypt, so reject it instead.
	maxPasswordBytes = 72
	// maxFullNameLength mirrors users.full_name varchar(100).
	maxFullNameLength = 100
)

type updateMeRequest struct {
	FullName *string `json:"full_name"`
	Email    *string `json:"email"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
	PasswordConfirm string `json:"password_confirm"`
}

// validateProfileEmail trims the input and checks it is a single bare
// address ("a@b.c", not "Name <a@b.c>"). Returns the trimmed address
// and an error message ("" when valid).
func validateProfileEmail(raw string) (string, string) {
	email := strings.TrimSpace(raw)
	if email == "" {
		return "", "Email is required"
	}
	if len(email) > 255 {
		return "", "Email is too long"
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email || !strings.Contains(email[strings.LastIndex(email, "@")+1:], ".") {
		return "", "Enter a valid email address"
	}
	return email, ""
}

// validateNewPassword enforces the self-service password policy and
// returns an error message ("" when valid).
func validateNewPassword(pw string) string {
	if utf8.RuneCountInString(pw) < minPasswordLength {
		return "Password must be at least " + strconv.Itoa(minPasswordLength) + " characters"
	}
	if len(pw) > maxPasswordBytes {
		return "Password must be at most " + strconv.Itoa(maxPasswordBytes) + " bytes"
	}
	return ""
}

// UpdateMe updates the current user's full name and/or email.
func (h *AuthHandler) UpdateMe(c *fiber.Ctx) error {
	user := GetCurrentUser(c)
	if user == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	}

	var req updateMeRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	updates := make(map[string]interface{})
	fields := make(map[string]string)

	if req.FullName != nil {
		name := strings.TrimSpace(*req.FullName)
		if utf8.RuneCountInString(name) > maxFullNameLength {
			fields["full_name"] = "Name must be at most " + strconv.Itoa(maxFullNameLength) + " characters"
		} else {
			updates["full_name"] = name
		}
	}
	if req.Email != nil {
		email, msg := validateProfileEmail(*req.Email)
		email = canonicalEmail(email)
		if msg != "" {
			fields["email"] = msg
		} else if email != user.Email {
			var count int64
			if err := h.db.Model(&models.User{}).
				Where("LOWER(email) = LOWER(?) AND id <> ?", email, user.ID).
				Count(&count).Error; err != nil {
				return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update profile")
			}
			if count > 0 {
				return api.Error(c, fiber.StatusConflict, "EMAIL_TAKEN", "An account with this email already exists")
			}
			updates["email"] = email
		}
	}
	if len(fields) > 0 {
		return api.ValidationError(c, fields)
	}

	if len(updates) > 0 {
		if err := h.db.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
			// Unique index race: another account claimed the address
			// between the check and the write.
			if strings.Contains(strings.ToLower(err.Error()), "unique") || strings.Contains(strings.ToLower(err.Error()), "duplicate") {
				return api.Error(c, fiber.StatusConflict, "EMAIL_TAKEN", "An account with this email already exists")
			}
			return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update profile")
		}
	}

	var fresh models.User
	if err := h.db.Preload("Role").First(&fresh, user.ID).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to load profile")
	}
	c.Locals(localsUserKey, &fresh)
	return h.Me(c)
}

// ChangeMyPassword changes the current user's password after verifying
// the current one, then signs out every other session of the user.
func (h *AuthHandler) ChangeMyPassword(c *fiber.Ctx) error {
	user := GetCurrentUser(c)
	if user == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	}

	var req changePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	fields := make(map[string]string)
	if req.CurrentPassword == "" {
		fields["current_password"] = "Current password is required"
	}
	if msg := validateNewPassword(req.NewPassword); msg != "" {
		fields["new_password"] = msg
	} else if req.NewPassword != req.PasswordConfirm {
		fields["password_confirm"] = "Passwords do not match"
	}
	if len(fields) > 0 {
		return api.ValidationError(c, fields)
	}

	lockKey := "me-password:" + strconv.Itoa(user.ID)
	if h.passwordLockout.IsLocked(lockKey) {
		return api.Error(c, fiber.StatusTooManyRequests, "RATE_LIMITED", "Too many attempts. Try again later.")
	}

	// Re-read the hash: the session-cached user may be stale.
	var current models.User
	if err := h.db.Select("id", "password_hash").First(&current, user.ID).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to change password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(current.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		h.passwordLockout.RecordFailure(lockKey)
		return api.ValidationError(c, map[string]string{"current_password": "Current password is incorrect"})
	}
	h.passwordLockout.RecordSuccess(lockKey)

	hash, err := HashPassword(req.NewPassword)
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to change password")
	}
	if err := h.db.Model(&models.User{}).Where("id = ?", user.ID).Update("password_hash", string(hash)).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to change password")
	}

	if err := h.sessionSvc.DeleteOtherSessions(user.ID, c.Cookies(CookieName)); err != nil {
		log.Printf("revoke other sessions after password change user=%d: %v", user.ID, err)
	}
	if err := NewPasswordResetService(h.db).InvalidateAllForUser(user.ID); err != nil {
		log.Printf("invalidate reset tokens after password change user=%d: %v", user.ID, err)
	}

	return api.Success(c, fiber.Map{"message": "Password changed"})
}
