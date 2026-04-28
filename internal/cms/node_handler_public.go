package cms

import (
	"encoding/json"
	"regexp"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/api"
	"squilla/internal/models"
)

// This file owns the public read-only listing endpoint for nodes
// (`/api/v1/nodes`) and the small slug/error helpers shared with
// the admin handlers in node_handler.go.

// isSlugConflict checks if an error is a slug/full_url conflict.
func isSlugConflict(err error) bool {
	return err != nil && contains(err.Error(), "slug conflict")
}

// isValidationError checks if an error is a validation error.
func isValidationError(err error) bool {
	return err != nil && contains(err.Error(), "invalid slug")
}

// contains checks if s contains substr (case-insensitive not needed here,
// since our error messages are controlled).
func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func slugify(s string) string {
	var re = regexp.MustCompile("[^a-z0-9]+")
	return strings.Trim(re.ReplaceAllString(strings.ToLower(s), "-"), "-")
}

// PublicList handles GET /api/v1/nodes — public read-only endpoint for published nodes.
func (h *NodeHandler) PublicList(c *fiber.Ctx) error {
	nodeType := c.Query("node_type")
	if nodeType == "" {
		return api.Error(c, fiber.StatusBadRequest, "MISSING_PARAM", "node_type is required")
	}

	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	sort := c.Query("sort", "-published_at")
	orderClause := "published_at DESC"
	if sort == "published_at" {
		orderClause = "published_at ASC"
	} else if sort == "title" {
		orderClause = "title ASC"
	} else if sort == "-title" {
		orderClause = "title DESC"
	}

	type publicNode struct {
		ID          int              `json:"id"`
		Title       string           `json:"title"`
		Slug        string           `json:"slug"`
		FullURL     string           `json:"full_url"`
		NodeType    string           `json:"node_type"`
		Excerpt     string           `json:"excerpt"`
		PublishedAt *string          `json:"published_at"`
		FieldsData  json.RawMessage  `json:"fields_data"`
	}

	search := c.Query("search")

	var nodes []models.ContentNode
	query := h.db.
		Where("node_type = ? AND status = 'published' AND deleted_at IS NULL", nodeType)

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title ILIKE ? OR slug ILIKE ?", searchTerm, searchTerm)
	}

	query = query.Order(orderClause).Limit(limit)

	if err := query.Find(&nodes).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "QUERY_FAILED", "Failed to query nodes")
	}

	results := make([]publicNode, len(nodes))
	for i, n := range nodes {
		var pubAt *string
		if n.PublishedAt != nil {
			s := n.PublishedAt.Format("2006-01-02T15:04:05Z")
			pubAt = &s
		}
		// Extract excerpt from fields_data if available
		excerpt := ""
		if len(n.FieldsData) > 0 {
			var fd map[string]any
			if json.Unmarshal(n.FieldsData, &fd) == nil {
				if ex, ok := fd["excerpt"].(string); ok {
					excerpt = ex
				}
			}
		}
		results[i] = publicNode{
			ID:          n.ID,
			Title:       n.Title,
			Slug:        n.Slug,
			FullURL:     n.FullURL,
			NodeType:    n.NodeType,
			Excerpt:     excerpt,
			PublishedAt: pubAt,
			FieldsData:  json.RawMessage(n.FieldsData),
		}
	}

	return api.Success(c, results)
}
