package cms

import (
	"context"
	"html/template"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/api"
	"squilla/internal/auth"
	"squilla/internal/models"
)

// maxRenderBlocks caps one live-preview request. Pages hold a few dozen
// blocks at most; the cap only stops an oversized payload from tying up
// the renderer.
const maxRenderBlocks = 200

// adminRenderBlocksBody is the visual editor's live-preview payload: the
// blocks to render (blocks_data shape) and the public path + query of the
// page the editor is open on, so `request` (page number, term archive)
// matches what a visitor of that URL sees.
type adminRenderBlocksBody struct {
	Blocks []map[string]interface{} `json:"blocks"`
	Path   string                   `json:"path"`
	Query  map[string]string        `json:"query"`
}

// AdminRenderBlocks handles POST /admin/api/nodes/:id/render-blocks.
//
// It renders unsaved blocks for a node through the same path the public
// page uses — theme settings (themeSetting), request, node, reference and
// term hydration, rich-text marking, theme-asset refs — and returns one
// HTML string per block, in order. Nothing is written and no events fire.
// The visual editor splices the strings between its block markers.
func (h *PublicHandler) AdminRenderBlocks(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Node id must be a positive integer")
	}
	var body adminRenderBlocksBody
	if err := c.BodyParser(&body); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
	}
	if len(body.Blocks) > maxRenderBlocks {
		return api.Error(c, fiber.StatusBadRequest, "TOO_MANY_BLOCKS", "Too many blocks in one request")
	}

	var node models.ContentNode
	if err := h.db.Where("id = ?", id).First(&node).Error; err != nil {
		return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Node not found")
	}
	if !auth.GetNodeAccess(auth.GetCurrentUser(c), node.NodeType).CanRead() {
		return api.Error(c, fiber.StatusForbidden, "FORBIDDEN", "You cannot view this content")
	}

	blocks := body.Blocks
	if blocks == nil {
		blocks = []map[string]interface{}{}
	}
	h.resolveAssetRefsInBlocks(blocks)
	rendered := h.renderBlocksBatchFor(blocks, node.LanguageCode, h.previewRequestData(body.Path, body.Query), h.pageNodeData(&node))
	if rendered == nil {
		rendered = []string{}
	}
	c.Set(fiber.HeaderCacheControl, "no-store")
	return api.Success(c, fiber.Map{"html": rendered})
}

// previewRequestData rebuilds the `request` context for a page path the
// editor is viewing. Term archives (/<listing>/<taxonomy>/<term>) resolve
// the same way the router does. "preview" marks the render as a draft so
// its output never enters the shared block output cache.
func (h *PublicHandler) previewRequestData(path string, query map[string]string) map[string]interface{} {
	page := 1
	if n, err := strconv.Atoi(query["page"]); err == nil && n > 1 {
		page = n
	}
	q := make(map[string]interface{}, len(query))
	for k, v := range query {
		q[k] = v
	}
	data := map[string]interface{}{
		"path":    path,
		"page":    page,
		"query":   q,
		"archive": nil,
		"preview": true,
	}
	clean := "/" + strings.Trim(path, "/")
	if clean != "/" {
		if _, archive, ok := h.resolveTermArchive(clean); ok && archive != nil {
			data["archive"] = archive.toMap()
		}
	}
	return data
}

// PreviewTemplateFuncs returns the per-render helpers block templates get
// on the public site (themeSetting, themeSettingsPage, request, node),
// filled for a preview with no page behind it: default-language theme
// settings, an empty request and no page node. The block-type editor's
// template preview merges these in so theme blocks render there too.
func (h *PublicHandler) PreviewTemplateFuncs() template.FuncMap {
	ts := h.loadThemeSettingsForRender(context.Background(), h.defaultLanguageCode())
	req := emptyRequestData()
	req["preview"] = true
	return mergeFuncMaps(template.FuncMap{
		"request": func() map[string]interface{} { return req },
		"node":    func() map[string]interface{} { return nil },
	}, themeSettingsFuncs(ts))
}
