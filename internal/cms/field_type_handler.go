package cms

import (
	"github.com/gofiber/fiber/v2"

	"squilla/internal/api"
	"squilla/internal/cms/field_types"
)

// FieldTypeHandler exposes the built-in core field type registry.
// Extension-contributed field types are loaded client-side from each
// extension's manifest (see admin-ui/src/hooks/use-extensions.tsx).
type FieldTypeHandler struct{}

func NewFieldTypeHandler() *FieldTypeHandler { return &FieldTypeHandler{} }

func (h *FieldTypeHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/field-types", h.List)
}

// List handles GET /field-types and returns all built-in field types.
func (h *FieldTypeHandler) List(c *fiber.Ctx) error {
	return api.Success(c, fiber.Map{
		"builtin": field_types.Builtin(),
	})
}
