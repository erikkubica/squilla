package cms

import (
	"context"
	"encoding/json"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/api"
	"squilla/internal/auth"
)

// settingsAPI is the narrow slice of coreapi.CoreAPI consumed by this
// handler. Defined locally to avoid the import cycle internal/cms ↔
// internal/coreapi (coreapi/impl.go imports cms). The full CoreAPI
// satisfies this interface implicitly.
type settingsAPI interface {
	GetSetting(ctx context.Context, key string) (string, error)
	SetSetting(ctx context.Context, key, value string) error
}

// ThemeSettingsHandler exposes admin HTTP endpoints for the active theme's
// declared settings pages. It reads the schema from an in-memory registry
// (populated on theme activation) and persists values via the unguarded
// CoreAPI — which transparently encrypts secret-shaped keys and emits
// setting.updated events.
type ThemeSettingsHandler struct {
	registry *ThemeSettingsRegistry
	coreAPI  settingsAPI
}

// NewThemeSettingsHandler constructs a handler bound to the given registry
// and CoreAPI. Pass the unguarded core implementation — capability checks
// belong at the route layer, not at the data layer. The parameter accepts
// any type satisfying the local settingsAPI interface, which the full
// coreapi.CoreAPI implements implicitly.
func NewThemeSettingsHandler(registry *ThemeSettingsRegistry, coreAPI settingsAPI) *ThemeSettingsHandler {
	return &ThemeSettingsHandler{registry: registry, coreAPI: coreAPI}
}

// RegisterRoutes mounts the theme-settings endpoints on the supplied admin
// API router group. All routes require manage_settings — the same capability
// gating /themes and /settings writes.
func (h *ThemeSettingsHandler) RegisterRoutes(router fiber.Router) {
	g := router.Group("/theme-settings", auth.CapabilityRequired("manage_settings"))
	g.Get("/", h.List)
	g.Get("/:page", h.Get)
	g.Put("/:page", h.Save)
}

// pageSummary is the per-page DTO returned by List — slug + display name +
// optional icon. Field schemas are not included here; clients fetch them
// via Get when navigating into a specific page.
type pageSummary struct {
	Slug string `json:"slug"`
	Name string `json:"name"`
	Icon string `json:"icon,omitempty"`
}

// listResponse is the wire shape of GET /theme-settings.
type listResponse struct {
	ActiveThemeSlug string        `json:"active_theme_slug"`
	Pages           []pageSummary `json:"pages"`
}

// fieldDTO is the wire shape of a settings field. We don't encode the
// loader's Raw blob or expose Config as raw map keys mixed with reserved
// keys — clients see a clean { key, label, type, default, config } object.
type fieldDTO struct {
	Key     string          `json:"key"`
	Label   string          `json:"label"`
	Type    string          `json:"type"`
	Default json.RawMessage `json:"default,omitempty"`
	Config  map[string]any  `json:"config,omitempty"`
}

// pageDTO is the full page schema returned by Get.
type pageDTO struct {
	Slug        string     `json:"slug"`
	Name        string     `json:"name"`
	Description string     `json:"description,omitempty"`
	Icon        string     `json:"icon,omitempty"`
	Fields      []fieldDTO `json:"fields"`
}

// valueDTO is the per-field value entry returned by Get. Compatible=false
// means the stored raw didn't fit the field's current type and Value is the
// declared default; Raw always carries the original stored string so the UI
// can warn the operator.
type valueDTO struct {
	Value      any    `json:"value"`
	Compatible bool   `json:"compatible"`
	Raw        string `json:"raw"`
}

// getResponse is the wire shape of GET /theme-settings/:page.
type getResponse struct {
	Page   pageDTO             `json:"page"`
	Values map[string]valueDTO `json:"values"`
}

// saveRequest is the wire shape of PUT /theme-settings/:page.
type saveRequest struct {
	Values map[string]json.RawMessage `json:"values"`
}

// List handles GET /theme-settings — returns the active theme slug and the
// summary of its declared settings pages. Empty array (never nil) when no
// theme is active or the active theme declares no pages.
func (h *ThemeSettingsHandler) List(c *fiber.Ctx) error {
	slug := h.registry.ActiveSlug()
	pages := h.registry.ActivePages()

	out := listResponse{
		ActiveThemeSlug: slug,
		Pages:           make([]pageSummary, 0, len(pages)),
	}
	for _, p := range pages {
		out.Pages = append(out.Pages, pageSummary{Slug: p.Slug, Name: p.Name, Icon: p.Icon})
	}
	return api.Success(c, out)
}

// Get handles GET /theme-settings/:page — returns the schema and current
// values for one page. Every declared field gets exactly one entry in the
// values map, falling back to default when no row exists or the stored raw
// is incompatible with the current field type.
func (h *ThemeSettingsHandler) Get(c *fiber.Ctx) error {
	themeSlug := h.registry.ActiveSlug()
	if themeSlug == "" {
		return api.Error(c, fiber.StatusNotFound, "NO_ACTIVE_THEME", "No theme is currently active")
	}

	pageSlug := c.Params("page")
	page, ok := h.registry.ActivePage(pageSlug)
	if !ok {
		return api.Error(c, fiber.StatusNotFound, "PAGE_NOT_FOUND", "Settings page not declared by active theme")
	}

	values := make(map[string]valueDTO, len(page.Fields))
	for _, field := range page.Fields {
		key := SettingKey(themeSlug, page.Slug, field.Key)
		raw, err := h.coreAPI.GetSetting(c.Context(), key)
		if err != nil {
			return api.Error(c, fiber.StatusInternalServerError, "READ_FAILED", "Failed to read theme settings")
		}
		res := CoerceWithDefault(field, raw)
		values[field.Key] = valueDTO{Value: res.Value, Compatible: res.Compatible, Raw: res.Raw}
	}

	return api.Success(c, getResponse{
		Page:   toPageDTO(page),
		Values: values,
	})
}

// Save handles PUT /theme-settings/:page — persists provided field values.
// Fields not present in the request body are NOT touched, so partial saves
// (e.g. a single tab in a multi-tab UI) work as expected.
func (h *ThemeSettingsHandler) Save(c *fiber.Ctx) error {
	themeSlug := h.registry.ActiveSlug()
	if themeSlug == "" {
		return api.Error(c, fiber.StatusNotFound, "NO_ACTIVE_THEME", "No theme is currently active")
	}

	pageSlug := c.Params("page")
	page, ok := h.registry.ActivePage(pageSlug)
	if !ok {
		return api.Error(c, fiber.StatusNotFound, "PAGE_NOT_FOUND", "Settings page not declared by active theme")
	}

	var body saveRequest
	if err := c.BodyParser(&body); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	for _, field := range page.Fields {
		raw, present := body.Values[field.Key]
		if !present {
			continue
		}
		stored, err := encodeForStorage(field.Type, raw)
		if err != nil {
			return api.Error(c, fiber.StatusBadRequest, "ENCODE_FAILED", "Failed to encode field value")
		}
		key := SettingKey(themeSlug, page.Slug, field.Key)
		if err := h.coreAPI.SetSetting(c.Context(), key, stored); err != nil {
			return api.Error(c, fiber.StatusInternalServerError, "WRITE_FAILED", "Failed to persist theme setting")
		}
	}

	return api.Success(c, fiber.Map{"saved": true})
}

// toPageDTO maps a loader-shaped page to the wire format. Keeps Raw and
// the synthesized Config bag inside core; clients only see the documented
// JSON shape.
func toPageDTO(p ThemeSettingsPage) pageDTO {
	fields := make([]fieldDTO, 0, len(p.Fields))
	for _, f := range p.Fields {
		fields = append(fields, fieldDTO{
			Key:     f.Key,
			Label:   f.Label,
			Type:    f.Type,
			Default: f.Default,
			Config:  f.Config,
		})
	}
	return pageDTO{
		Slug:        p.Slug,
		Name:        p.Name,
		Description: p.Description,
		Icon:        p.Icon,
		Fields:      fields,
	}
}

// textFamilyTypes are field types whose stored representation is the raw
// string itself (no JSON quoting). Anything outside this set is JSON-encoded
// so numbers, booleans, and structured values round-trip cleanly through
// CoerceValue on the read path.
var textFamilyTypes = map[string]struct{}{
	"text":     {},
	"textarea": {},
	"richtext": {},
	"email":    {},
	"url":      {},
	"color":    {},
	"date":     {},
	"select":   {},
	"radio":    {},
}

// encodeForStorage turns an incoming JSON value into the string that goes
// into site_settings.value. Text-family types unwrap a JSON string into its
// raw form so reads see "Hello" rather than "\"Hello\"". Everything else is
// preserved as JSON.
//
// nil input writes an empty string — which CoerceValue treats as "no value"
// (compatible with default), giving operators a clean way to clear a field.
func encodeForStorage(fieldType string, raw json.RawMessage) (string, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return "", nil
	}
	if _, isText := textFamilyTypes[fieldType]; isText {
		var s string
		if err := json.Unmarshal(raw, &s); err == nil {
			return s, nil
		}
		// Non-string value sent for a text field — fall through to JSON
		// preservation so we don't silently drop the data.
	}
	return string(raw), nil
}
