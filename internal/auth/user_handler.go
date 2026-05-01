package auth

import (
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

// GetUser returns a single user by ID.
func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid user ID")
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

// CreateUser creates a new user. Requires manage_users capability.
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
	if req.Email == "" {
		fields["email"] = "Email is required"
	}
	if req.Password == "" {
		fields["password"] = "Password is required"
	}
	if len(fields) > 0 {
		return api.ValidationError(c, fields)
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to hash password")
	}

	roleID := req.RoleID
	if roleID == 0 {
		var editorRole models.Role
		if err := h.db.Where("slug = ?", "editor").First(&editorRole).Error; err == nil {
			roleID = editorRole.ID
		}
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FullName:     &req.FullName,
		RoleID:       roleID,
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
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid user ID")
	}

	currentUser := GetCurrentUser(c)
	if currentUser == nil {
		return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
	}

	if !HasCapability(currentUser, "manage_users") && currentUser.ID != id {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You can only update your own profile")
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "User not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch user")
	}

	var req updateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}

	updates := make(map[string]interface{})

	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.FullName != nil {
		updates["full_name"] = *req.FullName
	}
	if req.RoleID != nil {
		if !HasCapability(currentUser, "manage_users") {
			return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Only admins can change user roles")
		}
		// Self-promotion guard: a user with manage_users could otherwise
		// PATCH /users/<their_id> {"role_id": <admin_id>} to grant
		// themselves admin. Always require an outside actor for role
		// elevation (or demotion — same path).
		if currentUser.ID == id {
			return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot change your own role")
		}
		updates["role_id"] = *req.RoleID
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

	if err := h.db.Model(&user).Updates(updates).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update user")
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
