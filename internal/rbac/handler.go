package rbac

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/api"
	"squilla/internal/auth"
	"squilla/internal/events"
	"squilla/internal/models"
)

// RoleHandler provides admin API endpoints for role management.
// All endpoints require "manage_roles" capability.
type RoleHandler struct {
	db       *gorm.DB
	eventBus *events.EventBus
}

// NewRoleHandler creates a new RoleHandler. The eventBus is used to publish
// role.{created,updated,deleted} so the SDUI broadcaster can fan them out
// over SSE — every connected admin client refetches its boot manifest, which
// is how capability changes propagate to the sidebar without a page reload.
func NewRoleHandler(db *gorm.DB, eventBus *events.EventBus) *RoleHandler {
	return &RoleHandler{db: db, eventBus: eventBus}
}

// RegisterRoutes registers all role and system-action routes on the provided router group.
func (h *RoleHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/system-actions", h.ListSystemActions)

	roles := router.Group("/roles", auth.CapabilityRequired("manage_roles"))
	roles.Get("/", h.List)
	roles.Get("/:id", h.Get)
	roles.Post("/", h.Create)
	roles.Patch("/:id", h.Update)
	roles.Delete("/:id", h.Delete)
}

// List handles GET /roles to retrieve roles. When `page` is absent, the full
// flat list is returned (legacy shape — role pickers across the admin still
// rely on that). When `page` is present, the response switches to {data, meta}
// with full pagination, search, sort, and the system/custom counts the admin
// list uses for its tabs.
func (h *RoleHandler) List(c *fiber.Ctx) error {
	pageRaw := c.Query("page")

	base := h.db.Model(&models.Role{})
	search := strings.TrimSpace(c.Query("search"))
	if search != "" {
		needle := "%" + strings.ToLower(search) + "%"
		base = base.Where(
			"LOWER(name) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?",
			needle, needle, needle,
		)
	}

	if pageRaw == "" {
		var roles []models.Role
		if err := base.Order("id ASC").Find(&roles).Error; err != nil {
			return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "Failed to list roles")
		}
		return api.Success(c, roles)
	}

	page, _ := strconv.Atoi(pageRaw)
	perPage, _ := strconv.Atoi(c.Query("per_page", "25"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 200 {
		perPage = 25
	}

	sortBy := c.Query("sort")
	sortOrder := strings.ToLower(c.Query("order"))
	orderClause := "id ASC"
	switch sortBy {
	case "name", "slug", "created_at", "updated_at", "id":
		dir := "ASC"
		if sortOrder == "desc" {
			dir = "DESC"
		}
		orderClause = sortBy + " " + dir
	}

	// Type counts (system vs custom) feed the admin tabs.
	var totalAll, systemCount, customCount int64
	base.Session(&gorm.Session{}).Count(&totalAll)
	base.Session(&gorm.Session{}).Where("is_system = ?", true).Count(&systemCount)
	base.Session(&gorm.Session{}).Where("is_system = ?", false).Count(&customCount)

	scope := base.Session(&gorm.Session{})
	switch strings.ToLower(strings.TrimSpace(c.Query("status"))) {
	case "system":
		scope = scope.Where("is_system = ?", true)
	case "custom":
		scope = scope.Where("is_system = ?", false)
	}

	var total int64
	scope.Session(&gorm.Session{}).Count(&total)

	var roles []models.Role
	offset := (page - 1) * perPage
	if err := scope.Order(orderClause).Offset(offset).Limit(perPage).Find(&roles).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "Failed to list roles")
	}

	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": roles,
		"meta": fiber.Map{
			"total":        total,
			"page":         page,
			"per_page":     perPage,
			"total_pages":  totalPages,
			"total_all":    totalAll,
			"system_count": systemCount,
			"custom_count": customCount,
		},
	})
}

// Get handles GET /roles/:id to retrieve a single role.
func (h *RoleHandler) Get(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Role ID must be a valid integer")
	}

	var role models.Role
	if err := h.db.First(&role, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Role not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch role")
	}

	return api.Success(c, role)
}

// createRoleRequest represents the JSON body for creating a role.
type createRoleRequest struct {
	Slug         string          `json:"slug"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	Capabilities json.RawMessage `json:"capabilities"`
}

// Create handles POST /roles to create a new role.
func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var req createRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	fields := map[string]string{}
	if req.Slug == "" {
		fields["slug"] = "Slug is required"
	}
	if req.Name == "" {
		fields["name"] = "Name is required"
	}
	if len(fields) > 0 {
		return api.ValidationError(c, fields)
	}

	caps := models.JSONB("{}")
	if len(req.Capabilities) > 0 {
		caps = models.JSONB(req.Capabilities)
	}

	role := models.Role{
		Slug:         req.Slug,
		Name:         req.Name,
		Description:  req.Description,
		Capabilities: caps,
	}

	if err := h.db.Create(&role).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "CREATE_FAILED", "Failed to create role")
	}

	h.publish("role.created", role.ID, role.Slug)

	return api.Created(c, role)
}

// Update handles PATCH /roles/:id to partially update a role.
func (h *RoleHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Role ID must be a valid integer")
	}

	var role models.Role
	if err := h.db.First(&role, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Role not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch role")
	}

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	// Prevent changing slug of system roles.
	if role.IsSystem {
		delete(body, "slug")
	}

	// Remove fields that should not be directly updated.
	delete(body, "id")
	delete(body, "is_system")
	delete(body, "created_at")
	delete(body, "updated_at")

	if len(body) == 0 {
		return api.Error(c, fiber.StatusBadRequest, "NO_UPDATES", "No valid fields to update")
	}

	if err := h.db.Model(&role).Updates(body).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "UPDATE_FAILED", "Failed to update role")
	}

	// Reload to return fresh data.
	h.db.First(&role, id)

	h.publish("role.updated", role.ID, role.Slug)

	return api.Success(c, role)
}

// Delete handles DELETE /roles/:id to remove a role.
func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Role ID must be a valid integer")
	}

	var role models.Role
	if err := h.db.First(&role, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Role not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch role")
	}

	if role.IsSystem {
		return api.Error(c, fiber.StatusForbidden, "SYSTEM_ROLE", "System roles cannot be deleted")
	}

	// Check if any users are assigned to this role.
	var count int64
	if err := h.db.Model(&models.User{}).Where("role_id = ?", id).Count(&count).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "DELETE_FAILED", "Failed to check role usage")
	}
	if count > 0 {
		return api.Error(c, fiber.StatusConflict, "ROLE_IN_USE", "Cannot delete role that is assigned to users")
	}

	if err := h.db.Delete(&role).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "DELETE_FAILED", "Failed to delete role")
	}

	h.publish("role.deleted", role.ID, role.Slug)

	return c.SendStatus(fiber.StatusNoContent)
}

// publish emits a role lifecycle event onto the bus. The SDUI broadcaster
// translates "role.*" actions into ENTITY_CHANGED SSE messages with
// entity="role"; the admin shell maps that to a boot-manifest invalidation,
// which is how capability edits flip the sidebar in real time.
//
// Best-effort: if the bus is nil (test wiring) we silently no-op rather than
// failing the HTTP request — the role write already succeeded.
func (h *RoleHandler) publish(action string, id int, slug string) {
	if h.eventBus == nil {
		return
	}
	go h.eventBus.Publish(action, events.Payload{
		"id":      id,
		"role_id": id,
		"slug":    slug,
	})
}

// ListSystemActions handles GET /system-actions to retrieve all system actions.
func (h *RoleHandler) ListSystemActions(c *fiber.Ctx) error {
	var actions []models.SystemAction
	if err := h.db.Order("category ASC, slug ASC").Find(&actions).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "Failed to list system actions")
	}
	return api.Success(c, actions)
}
