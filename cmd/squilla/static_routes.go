package main

import (
	"path/filepath"
	"strings"

	"squilla/internal/auth"

	"github.com/gofiber/fiber/v2"
)

// This file owns the static-file route handlers that bloated main.go:
// the per-extension block-asset handler (with extension allowlist and
// path-traversal guard), the dynamic theme-assets handler, and the
// admin-SPA static mounts. Pulled out so main.go reads as a startup
// sequence and not a tangle of inline closures.

// allowedBlockAssetExts is the set of file extensions we allow under
// /extensions/:slug/blocks/:dir/* — anything else (sources, configs,
// hidden dotfiles) gets a 403 to avoid information disclosure.
var allowedBlockAssetExts = map[string]bool{
	".css": true, ".js": true, ".map": true, ".woff": true, ".woff2": true,
	".ttf": true, ".otf": true, ".svg": true, ".png": true, ".jpg": true,
	".jpeg": true, ".webp": true, ".gif": true, ".ico": true,
}

// registerBlockAssets serves /extensions/<slug>/blocks/<dir>/<file>
// from the extensions tree. Validates that the resolved path stays
// inside the block directory (path traversal rejected) and only
// serves files with safe extensions.
func registerBlockAssets(app *fiber.App) {
	app.Get("/extensions/:slug/blocks/:dir/*", func(c *fiber.Ctx) error {
		slug := c.Params("slug")
		dir := c.Params("dir")
		rel := c.Params("*")
		if slug == "" || dir == "" || rel == "" {
			return c.SendStatus(fiber.StatusNotFound)
		}
		if !allowedBlockAssetExts[strings.ToLower(filepath.Ext(rel))] {
			return c.SendStatus(fiber.StatusForbidden)
		}
		base := filepath.Clean(filepath.Join("extensions", slug, "blocks", dir))
		full := filepath.Clean(filepath.Join(base, rel))
		if !strings.HasPrefix(full, base+string(filepath.Separator)) && full != base {
			return c.SendStatus(fiber.StatusBadRequest)
		}
		return c.SendFile(full, true)
	})
}

// registerThemeAssets serves /theme/assets/* from the active theme's
// directory. Resolved per request via the themeAssetsResolver so a
// runtime theme switch flips asset URLs immediately.
func registerThemeAssets(app *fiber.App, resolver *themeAssetsResolver) {
	app.Get("/theme/assets/*", func(c *fiber.Ctx) error {
		rel := c.Params("*")
		clean := filepath.Clean("/" + rel)
		if clean == "/" || clean == "." {
			return c.SendStatus(fiber.StatusNotFound)
		}
		full := filepath.Join(resolver.Get(), clean)
		return c.SendFile(full, true)
	})
}

// registerAdminSPA mounts the admin SPA static files. Hashed bundles
// get a 1-year cache; shims/previews stay no-cache because their
// filenames are stable and we re-deploy them in place.
//
// The catch-all /admin/* handler enforces a session-aware gate: if a user
// is logged in but lacks the admin_access capability, they're redirected
// to the public homepage instead of being handed a shell they can't use.
// Anonymous visitors still get index.html so the SPA's own login flow can
// render — the admin API gate (CapabilityRequired in main.go) is what
// hard-fails any subsequent data calls.
func registerAdminSPA(app *fiber.App, sessionSvc *auth.SessionService) {
	app.Static("/admin/assets", "./admin-ui/dist/assets", fiber.Static{
		MaxAge: 31536000, // 1 year — filenames are hashed by Vite
	})
	noCache := func(c *fiber.Ctx) error {
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.Next()
	}
	app.Use("/admin/shims", noCache)
	app.Static("/admin/shims", "./admin-ui/dist/shims")
	app.Use("/admin/previews", noCache)
	app.Static("/admin/previews", "./admin-ui/dist/previews")
	app.Get("/admin/*", func(c *fiber.Ctx) error {
		// Best-effort capability check — do NOT 401 on missing/expired
		// sessions, the SPA itself handles that flow. Only redirect when
		// we positively identified a logged-in user without admin_access:
		// that's the case where the SPA would otherwise load and render
		// a sidebar full of links that all 403 on first click.
		if token := c.Cookies(auth.CookieName); token != "" {
			if user, err := sessionSvc.ValidateSession(token); err == nil && user != nil {
				if !auth.HasCapability(user, "admin_access") {
					return c.Redirect("/", fiber.StatusFound)
				}
			}
		}
		c.Set("Cache-Control", "no-cache")
		return c.SendFile("./admin-ui/dist/index.html")
	})
}
