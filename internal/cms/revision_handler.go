package cms

import (
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/api"
	"squilla/internal/auth"
	"squilla/internal/models"
)

// RevisionHandler exposes browse + restore endpoints for content node
// revisions. Snapshots are written by ContentService.Update; this handler
// is the read/restore side. List/get are open to any authenticated admin
// (anyone editing nodes already has access to this data); restore is
// gated on the same capability as a regular node update.
type RevisionHandler struct {
	db          *gorm.DB
	contentSvc  *ContentService
}

// NewRevisionHandler creates a RevisionHandler.
func NewRevisionHandler(db *gorm.DB, contentSvc *ContentService) *RevisionHandler {
	return &RevisionHandler{db: db, contentSvc: contentSvc}
}

// RegisterRoutes mounts the revision routes on the admin API group.
func (h *RevisionHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/nodes/:id/revisions", h.List)
	router.Get("/nodes/:id/revisions/:revisionID", h.Get)
	// Restore reuses the same capability as a node update — restoring is
	// equivalent to a write that just happens to come from the past.
	router.Post(
		"/nodes/:id/revisions/:revisionID/restore",
		auth.CapabilityRequired("manage_content"),
		h.Restore,
	)
}

// revisionListItem is a slim shape returned by the list endpoint — full
// snapshots are heavy and only the editor's "browse" panel needs them on
// click.
type revisionListItem struct {
	ID            int64  `json:"id"`
	NodeID        int    `json:"node_id"`
	Title         string `json:"title"`
	Status        string `json:"status"`
	VersionNumber int    `json:"version_number"`
	CreatedBy     *int   `json:"created_by,omitempty"`
	CreatorName   string `json:"creator_name,omitempty"`
	CreatorEmail  string `json:"creator_email,omitempty"`
	CreatedAt     string `json:"created_at"`
}

// List returns the revision history of a node, newest first. Limited to
// 100 rows — the retention sweep already caps growth, and an editor
// browsing back further than that should reach for diff tooling.
func (h *RevisionHandler) List(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid node id")
	}

	// Pull just the columns we surface to the editor and resolve the
	// creator separately so the query stays robust if migration 0041
	// hasn't widened content_node_revisions yet on a partially-upgraded
	// instance — every selected column has existed since 0001.
	var revs []models.ContentNodeRevision
	if err := h.db.
		Where("node_id = ?", id).
		Order("created_at DESC").
		Limit(100).
		Find(&revs).Error; err != nil {
		log.Printf("ERROR list revisions for node %d: %v", id, err)
		return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "Failed to list revisions")
	}

	creatorIDs := make([]int, 0, len(revs))
	for _, r := range revs {
		if r.CreatedBy != nil {
			creatorIDs = append(creatorIDs, *r.CreatedBy)
		}
	}
	type creator struct {
		ID    int
		Name  string
		Email string
	}
	creators := map[int]creator{}
	if len(creatorIDs) > 0 {
		var rows []creator
		_ = h.db.Table("users").Select("id, name, email").Where("id IN ?", creatorIDs).Find(&rows).Error
		for _, r := range rows {
			creators[r.ID] = r
		}
	}

	out := make([]revisionListItem, len(revs))
	for i, r := range revs {
		item := revisionListItem{
			ID:            r.ID,
			NodeID:        r.NodeID,
			Title:         r.Title,
			Status:        r.Status,
			VersionNumber: r.VersionNumber,
			CreatedBy:     r.CreatedBy,
			CreatedAt:     r.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		}
		if r.CreatedBy != nil {
			if c, ok := creators[*r.CreatedBy]; ok {
				item.CreatorName = c.Name
				item.CreatorEmail = c.Email
			}
		}
		out[i] = item
	}
	return api.Success(c, out)
}

// Get returns the full snapshot for a single revision, including
// blocks_snapshot / fields_snapshot etc. so the admin UI can render a
// detail / diff view.
func (h *RevisionHandler) Get(c *fiber.Ctx) error {
	nodeID, err := strconv.Atoi(c.Params("id"))
	if err != nil || nodeID <= 0 {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid node id")
	}
	revID, err := strconv.ParseInt(c.Params("revisionID"), 10, 64)
	if err != nil || revID <= 0 {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_REVISION_ID", "Invalid revision id")
	}

	var rev models.ContentNodeRevision
	if err := h.db.
		Where("id = ? AND node_id = ?", revID, nodeID).
		First(&rev).Error; err != nil {
		return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Revision not found")
	}
	return api.Success(c, rev)
}

// Restore writes a revision back onto the live node. The restore is
// itself a normal Update — meaning it lands as a NEW revision in the
// history (the prior live state becomes a recovery point of its own),
// never as a destructive overwrite.
func (h *RevisionHandler) Restore(c *fiber.Ctx) error {
	nodeID, err := strconv.Atoi(c.Params("id"))
	if err != nil || nodeID <= 0 {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid node id")
	}
	revID, err := strconv.ParseInt(c.Params("revisionID"), 10, 64)
	if err != nil || revID <= 0 {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_REVISION_ID", "Invalid revision id")
	}

	var rev models.ContentNodeRevision
	if err := h.db.
		Where("id = ? AND node_id = ?", revID, nodeID).
		First(&rev).Error; err != nil {
		return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Revision not found")
	}

	updates := map[string]any{
		"title":          rev.Title,
		"status":         rev.Status,
		"language_code":  rev.LanguageCode,
		"excerpt":        rev.Excerpt,
		"featured_image": rev.FeaturedImage,
		"blocks_data":    rev.BlocksSnapshot,
		"fields_data":    rev.FieldsSnapshot,
		"seo_settings":   rev.SeoSnapshot,
		"taxonomies":     rev.TaxonomiesSnapshot,
	}
	if rev.LayoutSlug != nil {
		updates["layout_slug"] = *rev.LayoutSlug
	}
	if rev.Slug != "" {
		updates["slug"] = rev.Slug
	}

	userID := 0
	if u, ok := c.Locals("user_id").(int); ok {
		userID = u
	}
	node, err := h.contentSvc.Update(nodeID, updates, userID)
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "RESTORE_FAILED", err.Error())
	}
	return api.Success(c, fiber.Map{
		"node":          node,
		"restored_from": rev.ID,
	})
}
