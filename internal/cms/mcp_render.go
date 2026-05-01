package cms

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// MCP-facing render helpers. These let the MCP core.render.* tools preview
// content without going through the public HTTP path — no Fiber context, no
// redirects, no side-effects. They reuse the existing render primitives on
// PublicHandler so behavior stays identical to what a published page produces.

// RenderBlockPreview renders a single content block of the given type with the
// given field values. Returns the rendered HTML.
func (h *PublicHandler) RenderBlockPreview(blockType string, fields map[string]interface{}) (string, error) {
	block := map[string]interface{}{
		"type":   blockType,
		"fields": fields,
	}
	out := h.renderBlocksBatch([]map[string]interface{}{block}, "")
	if len(out) == 0 {
		return "", fmt.Errorf("render returned no output for block %q", blockType)
	}
	return out[0], nil
}

// RenderBlocksPreview renders a series of inline block specs into an HTML
// fragment (concatenated). Each block is a map with keys "type" and "fields".
func (h *PublicHandler) RenderBlocksPreview(blocks []map[string]interface{}) (string, error) {
	out := h.renderBlocksBatch(blocks, "")
	return strings.Join(out, "\n"), nil
}

// RenderLayoutPreview renders a layout with the given inline blocks. The
// layout is looked up by slug (optional languageCode narrows to a specific
// language variant). Use this to preview how a block composition looks inside
// a given layout without creating or publishing a node.
func (h *PublicHandler) RenderLayoutPreview(layoutSlug string, blocks []map[string]interface{}, languageCode string) (string, error) {
	languages := h.loadActiveLanguages()
	var languageID *int
	var currentLang *models.Language
	for i := range languages {
		if languageCode == "" && languages[i].IsDefault {
			id := languages[i].ID
			languageID = &id
			currentLang = &languages[i]
			break
		}
		if languages[i].Code == languageCode {
			id := languages[i].ID
			languageID = &id
			currentLang = &languages[i]
			break
		}
	}

	layout := h.layoutSvc.findBySlugAndLang(layoutSlug, languageID)
	if layout == nil {
		return "", fmt.Errorf("layout %q not found", layoutSlug)
	}

	renderedBlocks := h.renderBlocksBatch(blocks, languageCode)
	blocksHTML := strings.Join(renderedBlocks, "\n")

	settings := h.loadSiteSettings()
	menus := h.renderCtx.LoadMenus(languageID)
	usedSlugs := extractBlockSlugs(blocks)
	appData := h.renderCtx.BuildAppData(settings, languages, currentLang, usedSlugs)
	appData.Menus = menus

	// Stub node data — preview has no real node.
	fakeNode := &models.ContentNode{
		Title:        "[MCP Preview]",
		LanguageCode: func() string { if currentLang != nil { return currentLang.Code } ; return "" }(),
	}
	nodeData := h.renderCtx.BuildNodeData(fakeNode, blocksHTML, languages)

	// Theme settings must be present in preview data — layouts and partials
	// read .theme_settings.<page>.<key> directly. Without this map a node
	// with a theme that uses theme settings hits "index of untyped nil"
	// in the layout template before any block renders.
	templateData := TemplateData{
		App:           appData,
		Node:          nodeData,
		ThemeSettings: h.loadThemeSettingsForRender(context.Background(), nodeData.LanguageCode),
	}
	dataMap := templateData.ToMap()

	blockResolver := func(slug string) (string, error) {
		lb, err := h.layoutBlockSvc.Resolve(slug, languageID)
		if err != nil {
			return "", err
		}
		return lb.TemplateCode, nil
	}

	var buf bytes.Buffer
	if err := h.renderer.RenderLayout(&buf, layout.TemplateCode, dataMap, blockResolver); err != nil {
		return "", fmt.Errorf("render layout: %w", err)
	}
	return buf.String(), nil
}

// NodeDraftOverrides carries the in-flight form state from the editor so
// the renderer can preview unsaved edits without writing to the DB. Every
// field is optional — when nil, the persisted value wins. JSONB fields
// arrive as already-encoded byte slices so callers don't need to know the
// internal storage format.
type NodeDraftOverrides struct {
	Title         *string
	Slug          *string
	Status        *string
	LanguageCode  *string
	Excerpt       *string
	LayoutSlug    *string
	LayoutID      *int
	BlocksData    []byte
	FieldsData    []byte
	SeoSettings   []byte
	FeaturedImage []byte
	Taxonomies    []byte
}

// RenderNodePreview renders a specific node (published or draft) via the
// layout engine, returning HTML. No view counts, no node.viewed events,
// no DB writes. When draft is non-nil its fields override the persisted
// row in-memory only — the caller (admin Preview button) sees what the
// page would look like if they hit Save right now.
func (h *PublicHandler) RenderNodePreview(nodeID uint, draft *NodeDraftOverrides) (string, error) {
	var node models.ContentNode
	if err := h.db.Where("id = ?", nodeID).First(&node).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", fmt.Errorf("node %d not found", nodeID)
		}
		return "", err
	}

	if draft != nil {
		applyNodeDraft(&node, draft)
	}

	blocks := parseBlocks(node.BlocksData)
	renderedBlocks := h.renderBlocksBatch(blocks, node.LanguageCode)

	// Reuse the main render path but pass nil for Fiber ctx and nil user —
	// renderNodeWithLayout reads from c only via currentUser which we skip.
	// To avoid touching c, we inline the essentials of renderNodeWithLayout.
	languages := h.loadActiveLanguages()
	var languageID *int
	var currentLang *models.Language
	for i := range languages {
		if languages[i].Code == node.LanguageCode {
			id := languages[i].ID
			languageID = &id
			currentLang = &languages[i]
			break
		}
	}

	layout, err := h.layoutSvc.ResolveForNode(&node, languageID)
	if err != nil || layout == nil {
		return "", fmt.Errorf("no layout resolved for node %d", nodeID)
	}

	settings := h.loadSiteSettings()
	menus := h.renderCtx.LoadMenus(languageID)
	blocksHTML := strings.Join(renderedBlocks, "\n")
	usedSlugs := extractBlockSlugs(blocks)
	appData := h.renderCtx.BuildAppData(settings, languages, currentLang, usedSlugs)
	appData.Menus = menus
	nodeData := h.renderCtx.BuildNodeData(&node, blocksHTML, languages)
	appData.HeadMeta = h.renderHead(&node, nodeData, settings)
	appData.BodyStart = h.renderBodyStart(&node, nodeData, settings)
	extensionBodyEnd := h.renderBodyEnd(&node, nodeData, settings)
	appData.Footer = h.renderFooter(&node, nodeData, settings)
	appData.Head = composeHead(appData)
	appData.BodyEnd = composeBodyEnd(appData, extensionBodyEnd)

	templateData := TemplateData{
		App:           appData,
		Node:          nodeData,
		ThemeSettings: h.loadThemeSettingsForRender(context.Background(), nodeData.LanguageCode),
	}
	blockResolver := func(slug string) (string, error) {
		lb, err := h.layoutBlockSvc.Resolve(slug, languageID)
		if err != nil {
			return "", err
		}
		return lb.TemplateCode, nil
	}

	dataMap := templateData.ToMap()
	partialData := h.buildPartialData(&node, layout, languageID, dataMap)

	var buf bytes.Buffer
	if err := h.renderer.RenderLayout(&buf, layout.TemplateCode, dataMap, blockResolver, partialData); err != nil {
		return "", fmt.Errorf("render layout: %w", err)
	}
	return buf.String(), nil
}

// applyNodeDraft mutates an in-memory ContentNode with the in-flight draft
// values so the renderer sees the editor's current screen instead of the
// persisted row. Callers MUST pass a node loaded from the DB and discard it
// after rendering — the mutations are not safe to persist.
func applyNodeDraft(node *models.ContentNode, draft *NodeDraftOverrides) {
	if draft.Title != nil {
		node.Title = *draft.Title
	}
	if draft.Slug != nil {
		node.Slug = *draft.Slug
	}
	if draft.Status != nil {
		node.Status = *draft.Status
	}
	if draft.LanguageCode != nil && *draft.LanguageCode != "" {
		node.LanguageCode = *draft.LanguageCode
	}
	if draft.Excerpt != nil {
		node.Excerpt = *draft.Excerpt
	}
	if draft.LayoutSlug != nil {
		s := *draft.LayoutSlug
		if s == "" {
			node.LayoutSlug = nil
		} else {
			node.LayoutSlug = &s
		}
	}
	if draft.LayoutID != nil {
		v := *draft.LayoutID
		if v == 0 {
			node.LayoutID = nil
		} else {
			node.LayoutID = &v
		}
	}
	if draft.BlocksData != nil {
		node.BlocksData = models.JSONB(draft.BlocksData)
	}
	if draft.FieldsData != nil {
		node.FieldsData = models.JSONB(draft.FieldsData)
	}
	if draft.SeoSettings != nil {
		node.SeoSettings = models.JSONB(draft.SeoSettings)
	}
	if draft.FeaturedImage != nil {
		node.FeaturedImage = models.JSONB(draft.FeaturedImage)
	}
	if draft.Taxonomies != nil {
		node.Taxonomies = models.JSONB(draft.Taxonomies)
	}
}
