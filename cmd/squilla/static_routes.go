package main

import (
	"path/filepath"
	"strings"

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
func registerAdminSPA(app *fiber.App) {
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
		c.Set("Cache-Control", "no-cache")
		return c.SendFile("./admin-ui/dist/index.html")
	})
}
