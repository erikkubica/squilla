package auth

import (
	"log"
	"strconv"
	"strings"

	"squilla/internal/api"
	"squilla/internal/events"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// createUserRequest represents the expected JSON body for creating a user.
type createUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	RoleID   int    `json:"role_id"`
}

// updateUserRequest represents the expected JSON body for updating a user.
type updateUserRequest struct {
	Email    *string `json:"email,omitempty"`
	Password *string `json:"password,omitempty"`
	FullName *string `json:"full_name,omitempty"`
	RoleID   *int    `json:"role_id,omitempty"`
}

// userResponse represents the sanitized user data returned in API responses.
type userResponse struct {
	ID          int         `json:"id"`
	Email       string      `json:"email"`
	FullName    *string     `json:"full_name"`
	RoleID      int         `json:"role_id"`
	Role        models.Role `json:"role"`
	LastLoginAt interface{} `json:"last_login_at"`
	CreatedAt   interface{} `json:"created_at"`
	UpdatedAt   interface{} `json:"updated_at"`
}

func toUserResponse(u models.User) userResponse {
	return userResponse{
		ID:          u.ID,
		Email:       u.Email,
		FullName:    u.FullName,
		RoleID:      u.RoleID,
		Role:        u.Role,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}

// UserHandler handles user management HTTP endpoints.
type UserHandler struct {
	db       *gorm.DB
	eventBus *events.EventBus
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(db *gorm.DB, eventBus *events.EventBus) *UserHandler {
	return &UserHandler{db: db, eventBus: eventBus}
}

// RegisterRoutes registers user management routes on the given router group.
func (h *UserHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/users", h.ListUsers)
	router.Get("/users/:id", h.GetUser)
	router.Post("/users", h.CreateUser)
	router.Patch("/users/:id", h.UpdateUser)
	router.Delete("/users/:id", h.DeleteUser)
}

// ListUsers returns a paginated list of users. Requires manage_users capability.
//
// Back-compat: when the caller passes no `page` query param the full,
// unpaginated list is returned (preserving the legacy shape — admin language
// pickers and a handful of other selectors still rely on that). Once `page` is
// present, the response switches to {data, meta} with full pagination + the
// extra status counts the admin list page uses for its tabs.
func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	currentUser := GetCurrentUser(c)
	if !HasCapability(currentUser, "manage_users") {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
	}

	pageRaw := c.Query("page")

	// Build the base scope (search + role filter) once so both the legacy
	// "no page param" branch and the paginated branch share filters.
	base := h.db.Model(&models.User{})
	search := strings.TrimSpace(c.Query("search"))
	if search != "" {
		needle := "%" + strings.ToLower(search) + "%"
		base = base.Where("LOWER(email) LIKE ? OR LOWER(COALESCE(full_name, '')) LIKE ?", needle, needle)
	}
	if roleSlug := c.Query("role"); roleSlug != "" && roleSlug != "all" {
		// Match against role slug via a joined subquery — keeps the role
		// filter usable from the URL even when the role IDs are unknown
		// to the operator.
		var role models.Role
		if err := h.db.Where("slug = ?", roleSlug).First(&role).Error; err == nil {
			base = base.Where("role_id = ?", role.ID)
		}
	}

	if pageRaw == "" {
		// Legacy callers expect the full sanitized list as a flat array
		// under "data". Don't touch this shape.
		var users []models.User
		if err := base.Preload("Role").Order("id ASC").Find(&users).Error; err != nil {
			return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch users")
		}
		responses := make([]userResponse, len(users))
		for i, u := range users {
			responses[i] = toUserResponse(u)
		}
		return api.Success(c, responses)
	}

	page, _ := strconv.Atoi(pageRaw)
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}

	// Sort whitelist — keep raw input out of the SQL we feed Order().
	sortBy := c.Query("sort")
	sortOrder := strings.ToLower(c.Query("order"))
	orderClause := "id ASC"
	switch sortBy {
	case "full_name", "email", "last_login_at", "created_at", "id":
		dir := "ASC"
		if sortOrder == "desc" {
			dir = "DESC"
		}
		orderClause = sortBy + " " + dir
	}

	// User has no `is_active` column today — every row is active. The
	// status counts are still surfaced so the admin list page can render
	// uniform tabs alongside Languages without a special-case branch.
	var totalAll int64
	base.Session(&gorm.Session{}).Count(&totalAll)
	activeCount := totalAll
	var inactiveCount int64

	scope := base.Session(&gorm.Session{})
	if s := strings.ToLower(strings.TrimSpace(c.Query("status"))); s == "inactive" {
		// No inactive users today — return an empty page rather than
		// leaking the full list when the operator clicks the tab.
		scope = scope.Where("1 = 0")
	}

	var total int64
	scope.Session(&gorm.Session{}).Count(&total)

	var users []models.User
	offset := (page - 1) * perPage
	if err := scope.Preload("Role").Order(orderClause).Offset(offset).Limit(perPage).Find(&users).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch users")
	}

	responses := make([]userResponse, len(users))
	for i, u := range users {
		responses[i] = toUserResponse(u)
	}

	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": responses,
		"meta": fiber.Map{
			"total":          total,
			"page":           page,
			"per_page":       perPage,
			"total_pages":    totalPages,
			"total_all":      totalAll,
			"active_count":   activeCount,
			"inactive_count": inactiveCount,
		},
	})
}

// GetUser returns a single user by ID. Requires manage_users, except for
// reading one's own record.
func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid user ID")
	}
	currentUser := GetCurrentUser(c)
	if currentUser == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	}
	if currentUser.ID != id && !HasCapability(currentUser, "manage_users") {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
	}

	var user models.User
	if err := h.db.Preload("Role").First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "User not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch user")
	}

	return api.Success(c, toUserResponse(user))
}

// loadRole fetches a role by id; ok=false when it does not exist.
func (h *UserHandler) loadRole(id int) (models.Role, bool) {
	var role models.Role
	if err := h.db.First(&role, id).Error; err != nil {
		return models.Role{}, false
	}
	return role, true
}

// CreateUser creates a new user. Requires manage_users capability, and the
// assigned role may not exceed the caller's own capabilities.
func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	currentUser := GetCurrentUser(c)
	if !HasCapability(currentUser, "manage_users") {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
	}

	var req createUserRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	fields := make(map[string]string)
	email, msg := validateProfileEmail(req.Email)
	if msg != "" {
		fields["email"] = msg
	}
	if req.Password == "" {
		fields["password"] = "Password is required"
	} else if msg := validateNewPassword(req.Password); msg != "" {
		fields["password"] = msg
	}
	if len(fields) > 0 {
		return api.ValidationError(c, fields)
	}
	email = canonicalEmail(email)

	roleID := req.RoleID
	if roleID == 0 {
		var editorRole models.Role
		if err := h.db.Where("slug = ?", "editor").First(&editorRole).Error; err == nil {
			roleID = editorRole.ID
		}
	}
	role, ok := h.loadRole(roleID)
	if !ok {
		return api.ValidationError(c, map[string]string{"role_id": "Unknown role"})
	}
	if !canAssignRole(currentUser, role) {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot assign a role with capabilities you do not have")
	}

	if taken, err := emailTaken(h.db, email, 0); err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create user")
	} else if taken {
		return api.Error(c, fiber.StatusConflict, "CONFLICT", "A user with this email already exists")
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to hash password")
	}

	fullName := strings.TrimSpace(req.FullName)
	user := models.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
		FullName:     &fullName,
		RoleID:       role.ID,
	}

	if err := h.db.Create(&user).Error; err != nil {
		return api.Error(c, fiber.StatusConflict, "CONFLICT", "A user with this email already exists")
	}

	h.db.Preload("Role").First(&user, user.ID)

	if h.eventBus != nil {
		go h.eventBus.Publish("user.registered", events.Payload{
			"user_id":    user.ID,
			"user_email": user.Email,
		})
	}

	return api.Created(c, toUserResponse(user))
}

// UpdateUser updates an existing user.
//
// Self-service changes of email and password are refused here: they
// belong to PATCH /me and POST /me/password, which require the current
// password, apply the policy and revoke other sessions. A manage_users
// caller may only touch accounts whose current role is within their own
// capabilities, and only assign such roles.
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid user ID")
	}

	currentUser := GetCurrentUser(c)
	if currentUser == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	}

	isSelf := currentUser.ID == id
	canManage := HasCapability(currentUser, "manage_users")
	if !canManage && !isSelf {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You can only update your own profile")
	}

	var user models.User
	if err := h.db.Preload("Role").First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "User not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch user")
	}

	var req updateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	if isSelf {
		if req.Password != nil {
			return api.Error(c, fiber.StatusForbidden, "USE_ME_ENDPOINT", "Change your own password via POST /me/password")
		}
		if req.Email != nil && canonicalEmail(*req.Email) != canonicalEmail(user.Email) {
			return api.Error(c, fiber.StatusForbidden, "USE_ME_ENDPOINT", "Change your own email via PATCH /me")
		}
	}

	// Sensitive changes to another account require that account's role to
	// be within the caller's own privileges — otherwise manage_users could
	// reset an administrator's password or email and take the account over.
	sensitive := !isSelf && (req.Password != nil || req.Email != nil || (req.RoleID != nil && *req.RoleID != user.RoleID))
	if sensitive && !canAssignRole(currentUser, user.Role) {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot modify a user whose role has capabilities you do not have")
	}

	updates := make(map[string]interface{})
	fields := make(map[string]string)
	emailChanged := false

	if req.Email != nil {
		email, msg := validateProfileEmail(*req.Email)
		if msg != "" {
			fields["email"] = msg
		} else if email = canonicalEmail(email); email != canonicalEmail(user.Email) {
			if taken, err := emailTaken(h.db, email, user.ID); err != nil {
				return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update user")
			} else if taken {
				return api.Error(c, fiber.StatusConflict, "CONFLICT", "A user with this email already exists")
			}
			updates["email"] = email
			emailChanged = true
		}
	}
	if req.FullName != nil {
		updates["full_name"] = strings.TrimSpace(*req.FullName)
	}
	if req.Password != nil {
		if msg := validateNewPassword(*req.Password); msg != "" {
			fields["password"] = msg
		}
	}
	if len(fields) > 0 {
		return api.ValidationError(c, fields)
	}
	// The admin form always submits the current role; an unchanged role is a
	// no-op, not a role change.
	if req.RoleID != nil && *req.RoleID != user.RoleID {
		if !canManage {
			return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Only admins can change user roles")
		}
		// Self-promotion guard: a user with manage_users could otherwise
		// PATCH /users/<their_id> {"role_id": <admin_id>} to grant
		// themselves admin. Always require an outside actor for role
		// elevation (or demotion — same path).
		if isSelf {
			return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot change your own role")
		}
		role, ok := h.loadRole(*req.RoleID)
		if !ok {
			return api.ValidationError(c, map[string]string{"role_id": "Unknown role"})
		}
		if !canAssignRole(currentUser, role) {
			return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot assign a role with capabilities you do not have")
		}
		updates["role_id"] = role.ID
	}
	if req.Password != nil {
		hashedPassword, err := HashPassword(*req.Password)
		if err != nil {
			return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to hash password")
		}
		updates["password_hash"] = string(hashedPassword)
	}

	if len(updates) == 0 {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "No fields to update")
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update user")
	}

	// A password set by someone else signs the account out everywhere and
	// voids outstanding reset links; an email change voids reset links
	// that were mailed to the old address.
	if req.Password != nil {
		if err := h.db.Where("user_id = ?", user.ID).Delete(&models.Session{}).Error; err != nil {
			log.Printf("revoke sessions after admin password change user=%d: %v", user.ID, err)
		}
	}
	if req.Password != nil || emailChanged {
		if err := NewPasswordResetService(h.db).InvalidateAllForUser(user.ID); err != nil {
			log.Printf("invalidate reset tokens user=%d: %v", user.ID, err)
		}
	}

	h.db.Preload("Role").First(&user, id)

	if h.eventBus != nil {
		go h.eventBus.Publish("user.updated", events.Payload{
			"user_id":    user.ID,
			"user_email": user.Email,
		})
	}

	return api.Success(c, toUserResponse(user))
}

// DeleteUser deletes a user by ID. Requires manage_users capability.
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	currentUser := GetCurrentUser(c)
	if !HasCapability(currentUser, "manage_users") {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
	}

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid user ID")
	}

	// Operators must not delete their own account — that locks them out
	// of the very session this request is running under.
	if currentUser != nil && currentUser.ID == id {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot delete your own account")
	}

	// Same privilege boundary as updates: manage_users can't delete an
	// account more privileged than the caller.
	var target models.User
	if err := h.db.Preload("Role").First(&target, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "User not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete user")
	}
	if !canAssignRole(currentUser, target.Role) {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot delete a user whose role has capabilities you do not have")
	}

	result := h.db.Delete(&models.User{}, id)
	if result.Error != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete user")
	}
	if result.RowsAffected == 0 {
		return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "User not found")
	}

	if h.eventBus != nil {
		go h.eventBus.Publish("user.deleted", events.Payload{
			"user_id": id,
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
