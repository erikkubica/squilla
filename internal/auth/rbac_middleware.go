package auth

import (
	"encoding/json"
	"strings"

	"vibecms/internal/api"
	"vibecms/internal/models"

	"github.com/gofiber/fiber/v2"
)

const (
	// CookieName is the name of the session cookie.
	CookieName = "vibecms_session"

	// localsUserKey is the key used to store the authenticated user in Fiber locals.
	localsUserKey = "user"
)

// AuthRequired returns a Fiber middleware that validates the session token from
// the "vibecms_session" cookie and stores the authenticated user in c.Locals("user").
func AuthRequired(sessionSvc *SessionService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Cookies(CookieName)
		if token == "" {
			return authFail(c, "Authentication required")
		}

		user, err := sessionSvc.ValidateSession(token)
		if err != nil {
			return authFail(c, "Invalid or expired session")
		}

		c.Locals(localsUserKey, user)
		return c.Next()
	}
}

// authFail redirects browsers to /login for admin HTML pages, returns JSON 401 for API requests.
func authFail(c *fiber.Ctx, msg string) error {
	path := c.Path()
	isAdminPage := strings.HasPrefix(path, "/admin") && !strings.HasPrefix(path, "/admin/api")
	if isAdminPage {
		return c.Redirect("/login", fiber.StatusFound)
	}
	return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", msg)
}

// RoleRequired returns a Fiber middleware that checks whether the authenticated
// user has one of the specified roles. Returns 403 if the user's role is not allowed.
// This middleware must be used after AuthRequired.
func RoleRequired(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := GetCurrentUser(c)
		if user == nil {
			return api.Error(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		}

		for _, role := range roles {
			if user.Role.Slug == role {
				return c.Next()
			}
		}

		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
	}
}

// GetCurrentUser extracts the authenticated user from Fiber locals.
// Returns nil if no user is stored (i.e., the request is unauthenticated).
func GetCurrentUser(c *fiber.Ctx) *models.User {
	user, ok := c.Locals(localsUserKey).(*models.User)
	if !ok {
		return nil
	}
	return user
}

// HasCapability checks if the user's role has a specific boolean capability.
func HasCapability(user *models.User, capability string) bool {
	if user == nil {
		return false
	}
	caps := ParseCapabilities(user.Role.Capabilities)
	val, ok := caps[capability]
	if !ok {
		return false
	}
	b, ok := val.(bool)
	return ok && b
}

// ParseCapabilities unmarshals a JSONB capabilities field into a map.
func ParseCapabilities(data models.JSONB) map[string]interface{} {
	var caps map[string]interface{}
	if err := json.Unmarshal(data, &caps); err != nil {
		return make(map[string]interface{})
	}
	return caps
}

// CapabilityRequired returns middleware that checks a boolean capability.
func CapabilityRequired(capability string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := GetCurrentUser(c)
		if !HasCapability(user, capability) {
			return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
		}
		return c.Next()
	}
}

// IsAdmin checks if the user has the admin role slug.
func IsAdmin(user *models.User) bool {
	return user != nil && user.Role.Slug == "admin"
}

// NodeAccess represents the access level and scope for a node type.
type NodeAccess struct {
	Access string // "none", "read", "write"
	Scope  string // "all", "own"
}

// GetNodeAccess returns the effective access for a given node type.
// It checks per-type overrides first, then falls back to default_node_access.
func GetNodeAccess(user *models.User, nodeType string) NodeAccess {
	if user == nil {
		return NodeAccess{Access: "none", Scope: "all"}
	}

	caps := ParseCapabilities(user.Role.Capabilities)

	// Check per-type override in "nodes" map.
	if nodes, ok := caps["nodes"].(map[string]interface{}); ok {
		if override, ok := nodes[nodeType].(map[string]interface{}); ok {
			return nodeAccessFromMap(override)
		}
	}

	// Fall back to default_node_access.
	if def, ok := caps["default_node_access"].(map[string]interface{}); ok {
		return nodeAccessFromMap(def)
	}

	return NodeAccess{Access: "none", Scope: "all"}
}

func nodeAccessFromMap(m map[string]interface{}) NodeAccess {
	na := NodeAccess{Access: "none", Scope: "all"}
	if a, ok := m["access"].(string); ok {
		na.Access = a
	}
	if s, ok := m["scope"].(string); ok {
		na.Scope = s
	}
	return na
}

// CanRead returns true if the access level allows reading.
func (na NodeAccess) CanRead() bool {
	return na.Access == "read" || na.Access == "write"
}

// CanWrite returns true if the access level allows writing.
func (na NodeAccess) CanWrite() bool {
	return na.Access == "write"
}

// CanAccessNode checks if the user can access a specific node given the scope.
// authorID is the node's AuthorID (may be nil for unowned nodes).
func (na NodeAccess) CanAccessNode(userID int, authorID *int) bool {
	if na.Scope == "all" {
		return true
	}
	// scope == "own": user must be the author.
	if authorID != nil && *authorID == userID {
		return true
	}
	return false
}
