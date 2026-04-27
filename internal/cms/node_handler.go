package cms

import (
	"encoding/json"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"vibecms/internal/api"
	"vibecms/internal/auth"
	"vibecms/internal/events"
	"vibecms/internal/models"
)

// NodeHandler provides HTTP handlers for content node CRUD operations.
type NodeHandler struct {
	svc      *ContentService
	db       *gorm.DB
	eventBus *events.EventBus
}

// NewNodeHandler creates a new NodeHandler with the given ContentService.
func NewNodeHandler(svc *ContentService, db *gorm.DB, eventBus *events.EventBus) *NodeHandler {
	return &NodeHandler{svc: svc, db: db, eventBus: eventBus}
}

// RegisterRoutes registers all content node routes on the provided router group.
func (h *NodeHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/nodes", h.List)
	router.Get("/nodes/search", h.Search)
	router.Get("/nodes/:id", h.Get)
	router.Post("/nodes", h.Create)
	router.Patch("/nodes/:id", h.Update)
	router.Delete("/nodes/:id", h.Delete)
	router.Get("/nodes/:id/translations", h.GetTranslations)
	router.Post("/nodes/:id/translations", h.CreateTranslation)
}

// RegisterPublicRoutes registers read-only public API routes (no auth required).
func (h *NodeHandler) RegisterPublicRoutes(router fiber.Router) {
	router.Get("/nodes", h.PublicList)
}

// GetTranslations handles GET /nodes/:id/translations.
func (h *NodeHandler) GetTranslations(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Node ID must be a valid integer")
	}

	translations, err := h.svc.GetTranslations(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch translations")
	}

	return api.Success(c, translations)
}

// createTranslationRequest represents the JSON body for creating a translation.
type createTranslationRequest struct {
	LanguageCode string `json:"language_code"`
}

// CreateTranslation handles POST /nodes/:id/translations.
func (h *NodeHandler) CreateTranslation(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Node ID must be a valid integer")
	}

	var req createTranslationRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	if req.LanguageCode == "" {
		return api.ValidationError(c, map[string]string{
			"language_code": "Language code is required",
		})
	}

	node, err := h.svc.CreateTranslation(id, req.LanguageCode)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "CREATE_FAILED", "Failed to create translation")
	}

	return api.Created(c, node)
}

// Search handles GET /nodes/search for lightweight node lookup.
// Query params: q (search term), node_type (filter by type), limit (max results, default 20)
func (h *NodeHandler) Search(c *fiber.Ctx) error {
	q := c.Query("q", "")
	nodeType := c.Query("node_type", "")
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	user := auth.GetCurrentUser(c)
	userID := 0
	if user != nil {
		userID = user.ID
	}

	// Reject the lookup early when the user filtered by a node_type they
	// can't read — symmetric with List's behaviour.
	if nodeType != "" {
		access := auth.GetNodeAccess(user, nodeType)
		if !access.CanRead() {
			return api.Success(c, []struct{}{})
		}
	}

	query := h.db.Model(&models.ContentNode{}).
		Select("id, title, slug, node_type, status, language_code, author_id").
		Where("deleted_at IS NULL").
		Where("node_type IN (?)", h.db.Model(&models.NodeType{}).Select("slug"))

	if q != "" {
		searchTerm := "%" + q + "%"
		query = query.Where("title ILIKE ? OR slug ILIKE ?", searchTerm, searchTerm)
	}
	if nodeType != "" {
		query = query.Where("node_type = ?", nodeType)
	}

	var nodes []models.ContentNode
	if err := query.Order("title ASC").Limit(limit).Find(&nodes).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "SEARCH_FAILED", "Failed to search nodes")
	}

	// Return lightweight results
	type searchResult struct {
		ID           int    `json:"id"`
		Title        string `json:"title"`
		Slug         string `json:"slug"`
		NodeType     string `json:"node_type"`
		Status       string `json:"status"`
		LanguageCode string `json:"language_code"`
	}

	// Apply per-node-type read access (and scope='own' if applicable). This
	// matches the filter that List applies — without it, a user who cannot
	// see `post` in List could still discover post titles via Search.
	results := make([]searchResult, 0, len(nodes))
	for _, n := range nodes {
		access := auth.GetNodeAccess(user, n.NodeType)
		if !access.CanRead() {
			continue
		}
		if !access.CanAccessNode(userID, n.AuthorID) {
			continue
		}
		results = append(results, searchResult{
			ID:           n.ID,
			Title:        n.Title,
			Slug:         n.Slug,
			NodeType:     n.NodeType,
			Status:       n.Status,
			LanguageCode: n.LanguageCode,
		})
	}

	return api.Success(c, results)
}

// List handles GET /nodes with pagination and filtering.
func (h *NodeHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}

	status := c.Query("status")
	nodeType := c.Query("node_type")
	langCode := c.Query("language_code")
	search := c.Query("search")
	taxQueryJSON := c.Query("tax_query")

	var taxQuery map[string][]string
	if taxQueryJSON != "" {
		json.Unmarshal([]byte(taxQueryJSON), &taxQuery)
	}

	user := auth.GetCurrentUser(c)

	// If filtering by specific node type, check access upfront.
	if nodeType != "" {
		access := auth.GetNodeAccess(user, nodeType)
		if !access.CanRead() {
			return api.Paginated(c, []models.ContentNode{}, 0, page, perPage)
		}
	}

	nodes, total, err := h.svc.List(page, perPage, status, nodeType, langCode, search, taxQuery)
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "Failed to list content nodes")
	}

	// Filter results by access when listing mixed node types.
	userID := 0
	if user != nil {
		userID = user.ID
	}
	filtered := make([]models.ContentNode, 0, len(nodes))
	for _, n := range nodes {
		access := auth.GetNodeAccess(user, n.NodeType)
		if !access.CanRead() {
			continue
		}
		if !access.CanAccessNode(userID, n.AuthorID) {
			continue
		}
		filtered = append(filtered, n)
	}

	return api.Paginated(c, filtered, total, page, perPage)
}

// Get handles GET /nodes/:id to retrieve a single content node.
func (h *NodeHandler) Get(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Node ID must be a valid integer")
	}

	node, err := h.svc.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch content node")
	}

	// Check read access.
	user := auth.GetCurrentUser(c)
	access := auth.GetNodeAccess(user, node.NodeType)
	if !access.CanRead() {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You do not have access to this content type")
	}
	userID := 0
	if user != nil {
		userID = user.ID
	}
	if !access.CanAccessNode(userID, node.AuthorID) {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You can only view your own content")
	}

	// Resolve theme-asset:<key> refs in JSONB fields so the admin edit form
	// renders actual thumbnails instead of raw refs. Save path tolerates both
	// resolved objects and raw refs — either round-trips cleanly.
	if lookup := loadActiveAssetLookup(h.db); lookup.hasAny() {
		if len(node.FieldsData) > 0 {
			node.FieldsData = models.JSONB(ResolveThemeAssetRefsInJSON([]byte(node.FieldsData), lookup))
		}
		if len(node.BlocksData) > 0 {
			node.BlocksData = models.JSONB(ResolveThemeAssetRefsInJSON([]byte(node.BlocksData), lookup))
		}
		if len(node.LayoutData) > 0 {
			node.LayoutData = models.JSONB(ResolveThemeAssetRefsInJSON([]byte(node.LayoutData), lookup))
		}
		if len(node.FeaturedImage) > 0 {
			node.FeaturedImage = models.JSONB(ResolveThemeAssetRefsInJSON([]byte(node.FeaturedImage), lookup))
		}
	}

	return api.Success(c, node)
}

// createNodeRequest represents the JSON body for creating a content node.
type createNodeRequest struct {
	Title         string          `json:"title"`
	NodeType      string          `json:"node_type"`
	LanguageCode  string          `json:"language_code"`
	Status        string          `json:"status"`
	ParentID      *int            `json:"parent_id"`
	LayoutID      *int            `json:"layout_id"`
	Slug          string          `json:"slug"`
	BlocksData    json.RawMessage `json:"blocks_data"`
	FieldsData    json.RawMessage `json:"fields_data"`
	SeoSettings   json.RawMessage `json:"seo_settings"`
	FeaturedImage json.RawMessage `json:"featured_image"`
	Excerpt       string          `json:"excerpt"`
	Taxonomies    json.RawMessage `json:"taxonomies"`
	LayoutData    json.RawMessage `json:"layout_data"`
}

// Create handles POST /nodes to create a new content node.
func (h *NodeHandler) Create(c *fiber.Ctx) error {
	var req createNodeRequest
	if err := c.BodyParser(&req); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	if req.Title == "" {
		return api.ValidationError(c, map[string]string{
			"title": "Title is required",
		})
	}

	node := models.ContentNode{
		Title:         req.Title,
		NodeType:      req.NodeType,
		LanguageCode:  req.LanguageCode,
		Status:        req.Status,
		ParentID:      req.ParentID,
		LayoutID:      req.LayoutID,
		Slug:          req.Slug,
		BlocksData:    models.JSONB(req.BlocksData),
		FieldsData:    models.JSONB(req.FieldsData),
		SeoSettings:   models.JSONB(req.SeoSettings),
		FeaturedImage:  models.JSONB(req.FeaturedImage),
		Excerpt:       req.Excerpt,
		Taxonomies:    models.JSONB(req.Taxonomies),
		LayoutData:    models.JSONB(req.LayoutData),
	}

	if node.NodeType == "" {
		node.NodeType = "page"
	}
	if node.LanguageCode == "" {
		node.LanguageCode = "en"
	}
	if node.Status == "" {
		node.Status = "draft"
	}

	user := auth.GetCurrentUser(c)
	userID := 0
	if user != nil {
		userID = user.ID
	}

	// Check node type access.
	access := auth.GetNodeAccess(user, node.NodeType)
	if !access.CanWrite() {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You do not have write access to this content type")
	}

	if err := h.svc.Create(&node, userID); err != nil {
		if isSlugConflict(err) {
			return api.Error(c, fiber.StatusConflict, "SLUG_CONFLICT", err.Error())
		}
		if isValidationError(err) {
			return api.ValidationError(c, map[string]string{
				"slug": err.Error(),
			})
		}
		return api.Error(c, fiber.StatusInternalServerError, "CREATE_FAILED", "Failed to create content node")
	}

	return api.Created(c, node)
}

// Update handles PATCH /nodes/:id to partially update a content node.
func (h *NodeHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Node ID must be a valid integer")
	}

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	// Remove fields that should not be directly updated
	delete(body, "id")
	delete(body, "uuid")
	delete(body, "version")
	delete(body, "created_at")
	delete(body, "updated_at")
	delete(body, "deleted_at")
	delete(body, "author_id")  // protected: scope='own' RBAC depends on it.
	delete(body, "node_type")  // node type is set on Create only — switching it would bypass per-type ACL.
	delete(body, "full_url")   // computed by buildFullURL on every Create/Update.

	// Validate status against the canonical set. The DB column is a plain
	// text column without a CHECK constraint (per migrations review), so a
	// rogue client could otherwise persist arbitrary status strings.
	if rawStatus, ok := body["status"]; ok {
		s, _ := rawStatus.(string)
		if s != "draft" && s != "published" && s != "archived" {
			return api.ValidationError(c, map[string]string{
				"status": "Status must be one of: draft, published, archived",
			})
		}
	}

	if len(body) == 0 {
		return api.Error(c, fiber.StatusBadRequest, "NO_UPDATES", "No valid fields to update")
	}

	user := auth.GetCurrentUser(c)
	userID := 0
	if user != nil {
		userID = user.ID
	}

	// Fetch node to check access.
	existing, err := h.svc.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch content node")
	}

	access := auth.GetNodeAccess(user, existing.NodeType)
	if !access.CanWrite() {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You do not have write access to this content type")
	}
	if !access.CanAccessNode(userID, existing.AuthorID) {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You can only edit your own content")
	}

	updated, err := h.svc.Update(id, body, userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		if isSlugConflict(err) {
			return api.Error(c, fiber.StatusConflict, "SLUG_CONFLICT", err.Error())
		}
		if isValidationError(err) {
			return api.ValidationError(c, map[string]string{
				"slug": err.Error(),
			})
		}
		return api.Error(c, fiber.StatusInternalServerError, "UPDATE_FAILED", "Failed to update content node")
	}

	return api.Success(c, updated)
}

// Delete handles DELETE /nodes/:id to soft-delete a content node.
func (h *NodeHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Node ID must be a valid integer")
	}

	// Fetch node to check access.
	user := auth.GetCurrentUser(c)
	userID := 0
	if user != nil {
		userID = user.ID
	}
	existing, err := h.svc.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch content node")
	}
	access := auth.GetNodeAccess(user, existing.NodeType)
	if !access.CanWrite() {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You do not have write access to this content type")
	}
	if !access.CanAccessNode(userID, existing.AuthorID) {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You can only delete your own content")
	}

	if err := h.svc.Delete(id); err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Content node not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "DELETE_FAILED", "Failed to delete content node")
	}

	return c.SendStatus(fiber.StatusNoContent)
}

