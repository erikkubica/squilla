package cms

import (
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/models"
)

// BrandingHandler exposes a tiny PUBLIC endpoint that surfaces only the
// information the admin shell needs to "soft-brand" itself before the user
// is signed in: the site title and the active theme's favicon URL.
//
// SECURITY MODEL — what this leaks, and why it's safe:
//   - site_title: rendered into <title> on every public page, so it is
//     already visible to anonymous visitors. Echoing it on /admin/branding
//     reveals nothing new.
//   - favicon_url: points at /theme/assets/favicon.svg, which the public
//     site already links from every layout. Same fact, different surface.
//
// The handler intentionally returns NOTHING ELSE — no user counts, no
// extension list, no version, no language data — so it cannot be used as
// an enumeration oracle. Fields like SMTP credentials, OAuth secrets, or
// any settings ending in the secret-suffix list MUST NOT be added here.
type BrandingHandler struct {
	db *gorm.DB
}

func NewBrandingHandler(db *gorm.DB) *BrandingHandler {
	return &BrandingHandler{db: db}
}

// RegisterRoutes mounts GET /admin/branding on the given (UN-authenticated)
// router. Caller must NOT wrap this router in AuthRequired — the login
// page reads it before any session exists.
func (h *BrandingHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/branding", h.Get)
}

type brandingResponse struct {
	SiteTitle  string `json:"site_title"`
	FaviconURL string `json:"favicon_url,omitempty"`
}

// Get returns the soft-branding payload. Both fields are optional — the
// frontend falls back to "Squilla" + the built-in "S" tile when empty.
func (h *BrandingHandler) Get(c *fiber.Ctx) error {
	resp := brandingResponse{}

	// site_title: prefer the language-agnostic ('') row, then the first
	// non-empty value across any locale. We don't need locale negotiation
	// here — the login page has no language context yet, and the sidebar
	// will refresh from /admin/api/settings once the user is in.
	var rows []models.SiteSetting
	h.db.Where("key = ?", "site_title").Find(&rows)
	for _, r := range rows {
		if r.LanguageCode == "" && r.Value != nil && *r.Value != "" {
			resp.SiteTitle = *r.Value
			break
		}
	}
	if resp.SiteTitle == "" {
		for _, r := range rows {
			if r.Value != nil && *r.Value != "" {
				resp.SiteTitle = *r.Value
				break
			}
		}
	}

	// favicon: only surface the URL when the active theme actually ships
	// one on disk. /theme/assets/favicon.svg is a 200 only if the file
	// exists; advertising it unconditionally would force the browser to
	// log a 404 on every login screen load.
	var theme models.Theme
	if err := h.db.Where("is_active = ?", true).First(&theme).Error; err == nil && theme.Path != "" {
		fav := filepath.Join(theme.Path, "assets", "favicon.svg")
		if info, statErr := os.Stat(fav); statErr == nil && !info.IsDir() {
			resp.FaviconURL = "/theme/assets/favicon.svg"
		}
	}

	// Short cache — branding rarely changes, but a stale title is benign
	// and saves a DB roundtrip on every login form render.
	c.Set("Cache-Control", "public, max-age=60")
	return c.JSON(resp)
}
