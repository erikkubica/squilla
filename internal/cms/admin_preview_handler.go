package cms

import (
	"fmt"
	"html"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// RegisterAdminPreviewRoutes mounts the admin-side preview endpoint that the
// node editor's Preview button hits. Returns the rendered HTML for any node
// (drafts included) by reusing the same renderer the public path uses, so
// editors see exactly what visitors will see once published.
//
// GET /admin/api/nodes/:id/preview — text/html, 200 on success.
func (h *PublicHandler) RegisterAdminPreviewRoutes(router fiber.Router) {
	router.Get("/nodes/:id/preview", h.AdminNodePreview)
}

// AdminNodePreview renders one node by ID as full HTML. Auth is enforced by
// the parent /admin/api group's session middleware — there's no extra
// capability check because anyone with admin access can see any node anyway
// (drafts are only visible inside admin). Side effects are explicitly
// avoided: no view counts, no node.viewed events.
//
// Errors render as inline HTML rather than the standard JSON envelope so a
// new browser tab shows a readable diagnostic instead of raw `{"error":...}`
// text. The caller is always a top-level navigation; structured errors here
// would just show as broken text.
func (h *PublicHandler) AdminNodePreview(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || id == 0 {
		return previewHTMLError(c, fiber.StatusBadRequest, "Node id must be a positive integer")
	}
	rendered, err := h.RenderNodePreview(uint(id))
	if err != nil {
		return previewHTMLError(c, fiber.StatusNotFound, err.Error())
	}
	if rendered == "" {
		return previewHTMLError(c, fiber.StatusInternalServerError,
			"Renderer returned an empty document. Verify the node has a layout assigned and that the active theme provides templates for it.")
	}
	c.Set("Content-Type", "text/html; charset=utf-8")
	// Prevent caching — preview output reflects unsaved drafts and changes
	// frequently while editing.
	c.Set("Cache-Control", "no-store, max-age=0")
	return c.Status(fiber.StatusOK).SendString(rendered)
}

// previewHTMLError renders a minimal-but-readable error page. Used in
// AdminNodePreview where the response always lands in a fresh browser tab.
func previewHTMLError(c *fiber.Ctx, status int, message string) error {
	c.Set("Content-Type", "text/html; charset=utf-8")
	c.Set("Cache-Control", "no-store, max-age=0")
	body := fmt.Sprintf(`<!doctype html>
<html><head><meta charset="utf-8"><title>Preview unavailable</title>
<style>body{font:14px/1.5 system-ui, sans-serif; color:#0f172a; max-width:560px; margin:48px auto; padding:0 24px}
h1{font-size:18px; margin:0 0 12px} .code{font-family:ui-monospace, monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px}
.box{padding:16px 20px; border:1px solid #e2e8f0; border-radius:8px; background:#fafafa}</style>
</head><body>
<h1>Preview unavailable</h1>
<div class="box">
  <p><strong>%d</strong> — could not render this node.</p>
  <p class="code">%s</p>
  <p style="color:#64748b">If the node loads on the public site, this is most likely a missing layout assignment or a draft node referencing a layout that no longer exists.</p>
</div>
</body></html>`, status, html.EscapeString(message))
	return c.Status(status).SendString(body)
}
