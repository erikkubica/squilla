package cms

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/api"
	"squilla/internal/cms/field_types"
	"squilla/internal/icons"
)

// FieldTypeHandler exposes the built-in core field type registry and the
// icon catalogue the `icon` field type picks from.
// Extension-contributed field types are loaded client-side from each
// extension's manifest (see admin-ui/src/hooks/use-extensions.tsx).
type FieldTypeHandler struct{}

func NewFieldTypeHandler() *FieldTypeHandler { return &FieldTypeHandler{} }

func (h *FieldTypeHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/field-types", h.List)
	router.Get("/icons", h.Icons)
}

// List handles GET /field-types and returns all built-in field types.
func (h *FieldTypeHandler) List(c *fiber.Ctx) error {
	return api.Success(c, fiber.Map{
		"builtin": field_types.Builtin(),
	})
}

// iconsCacheControl: icon data is compiled into the binary, so responses
// only change on upgrade. Private because the route sits behind auth.
const iconsCacheControl = "private, max-age=3600"

// Icons handles GET /icons for the icon field picker.
//
//	GET /icons                                  → {providers: [...]}
//	GET /icons?provider=lucide&q=map&page=1     → one page of matching icons
//	    (&per_page=, default 120, max 500)
//	GET /icons?values=lucide:map-pin,restaurant → the named icons (preview of
//	    stored values; bare names resolve to material, unknown are omitted)
func (h *FieldTypeHandler) Icons(c *fiber.Ctx) error {
	c.Set("Cache-Control", iconsCacheControl)

	if raw := strings.TrimSpace(c.Query("values")); raw != "" {
		parts := strings.Split(raw, ",")
		if len(parts) > 50 {
			parts = parts[:50]
		}
		out := make([]icons.Icon, 0, len(parts))
		for _, v := range parts {
			if ic, ok := icons.Lookup(v); ok {
				ic.Tags = nil
				out = append(out, ic)
			}
		}
		return api.Success(c, fiber.Map{"icons": out})
	}

	provider := strings.TrimSpace(c.Query("provider"))
	if provider == "" {
		return api.Success(c, fiber.Map{"providers": icons.Providers()})
	}
	if !icons.HasProvider(provider) {
		return api.Error(c, fiber.StatusBadRequest, "UNKNOWN_PROVIDER", "Unknown icon provider: "+provider)
	}
	res, err := icons.Search(provider, c.Query("q"), c.QueryInt("page", 1), c.QueryInt("per_page", 120))
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "ICONS_FAILED", "Failed to load icons")
	}
	return api.Success(c, res)
}
