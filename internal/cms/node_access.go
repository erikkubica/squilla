package cms

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/auth"
	"squilla/internal/models"
)

// nodeAccessError carries the HTTP status + message for a failed
// requireNodeAccess check so each caller can render it in its own
// envelope (JSON for the API, an HTML page for previews).
type nodeAccessError struct {
	Status  int
	Code    string
	Message string
}

func (e *nodeAccessError) Error() string { return e.Message }

// requireNodeAccess loads the node's type and author and applies the same
// per-type access level and "own" scope rules as NodeHandler.Get/Update:
// read (write=false) needs access read|write, write needs access write,
// and scope "own" restricts both to nodes the caller authored. Call it
// first in every handler that exposes or mutates a node by id outside
// the main CRUD handlers (translations, revisions, previews), so those
// side doors can't bypass role scoping.
func requireNodeAccess(c *fiber.Ctx, db *gorm.DB, nodeID int, write bool) (*models.ContentNode, *nodeAccessError) {
	var node models.ContentNode
	if err := db.Select("id", "node_type", "author_id").Where("id = ?", nodeID).First(&node).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &nodeAccessError{fiber.StatusNotFound, "NOT_FOUND", "Content node not found"}
		}
		return nil, &nodeAccessError{fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch content node"}
	}
	user := auth.GetCurrentUser(c)
	if user == nil {
		return nil, &nodeAccessError{fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required"}
	}
	access := auth.GetNodeAccess(user, node.NodeType)
	if write && !access.CanWrite() {
		return nil, &nodeAccessError{fiber.StatusForbidden, "FORBIDDEN", "You do not have write access to this content type"}
	}
	if !write && !access.CanRead() {
		return nil, &nodeAccessError{fiber.StatusForbidden, "FORBIDDEN", "You do not have access to this content type"}
	}
	if !access.CanAccessNode(user.ID, node.AuthorID) {
		return nil, &nodeAccessError{fiber.StatusForbidden, "FORBIDDEN", "You can only access your own content"}
	}
	return &node, nil
}

// canSeeNode reports whether user may read a node of nodeType authored by
// authorID. Used to filter lists.
func canSeeNode(user *models.User, nodeType string, authorID *int) bool {
	if user == nil {
		return false
	}
	access := auth.GetNodeAccess(user, nodeType)
	return access.CanRead() && access.CanAccessNode(user.ID, authorID)
}
