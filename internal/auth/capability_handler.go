package auth

import (
	"squilla/internal/api"

	"github.com/gofiber/fiber/v2"
)

// CapabilityHandler serves the registered capability list to the admin
// UI's role editor so the available toggles stay in sync with kernel +
// extension contributions, instead of a hardcoded array on the client.
type CapabilityHandler struct {
	registry *CapabilityRegistry
}

// NewCapabilityHandler constructs a handler that reads from the given
// registry. The registry is shared with the extension and theme bridges
// — every activation/deactivation reflects in the next admin fetch.
func NewCapabilityHandler(registry *CapabilityRegistry) *CapabilityHandler {
	return &CapabilityHandler{registry: registry}
}

// RegisterRoutes mounts /capabilities under the admin API group. The
// endpoint requires admin_access (already enforced by the parent group)
// because it lists every capability in the system, including
// extension-contributed ones — useful only for users who can edit roles.
func (h *CapabilityHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/capabilities", h.List)
}

// List returns the full registered capability set. Sorted by source
// (kernel first) then key for stable rendering.
func (h *CapabilityHandler) List(c *fiber.Ctx) error {
	return api.Success(c, h.registry.List())
}
