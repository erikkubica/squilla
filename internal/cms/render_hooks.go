package cms

import (
	"html/template"
	"strings"

	"squilla/internal/events"
	"squilla/internal/models"
)

// renderHook fires a render-time event and joins every subscriber's
// returned HTML into one template.HTML block. Returns "" when no
// extension answered — the kernel ships zero feature-specific markup
// in <head>, <body>, or footer on its own; themes still call the
// `{{.app.<slot>}}` template variable but get nothing back.
//
// The kernel doesn't curate per-feature subsets of the payload — it
// hands extensions the same template-facing data the theme would see
// (full node payload + locale-resolved settings + translations) so any
// extension can extract whatever it needs. SEO, analytics, social
// preview, A/B testing pixels, GDPR consent banners, custom verification
// codes — they all share the same hook contract.
//
// The four supported events:
//
//	render.head        — emitted inside <head> (canonical, OG, robots, etc.)
//	render.body_start  — emitted immediately after <body> (skip-to-content, etc.)
//	render.body_end    — emitted immediately before </body> (analytics, lazy scripts)
//	render.footer      — emitted inside the theme's footer area (legal links, etc.)
func (h *PublicHandler) renderHook(
	action string,
	node *models.ContentNode,
	nodeData NodeData,
	settings map[string]string,
	user *models.User,
) template.HTML {
	if h.eventBus == nil {
		return ""
	}

	payload := events.Payload{
		"action":       action,
		"node":         buildHookNodePayload(node, nodeData),
		"settings":     settings,
		"translations": nodeData.Translations,
		"user":         buildHookUserPayload(user),
	}

	results := h.eventBus.PublishCollect(action, payload)
	if len(results) == 0 {
		return ""
	}
	return template.HTML(strings.Join(results, "\n"))
}

// renderHead, renderBodyStart, renderBodyEnd, renderFooter are tiny
// wrappers so call sites read naturally and the event names stay in one
// place. Adding a fifth hook is a one-line method here plus a matching
// field on AppData and template.ToMap key.
func (h *PublicHandler) renderHead(node *models.ContentNode, nodeData NodeData, settings map[string]string, user *models.User) template.HTML {
	return h.renderHook("render.head", node, nodeData, settings, user)
}

func (h *PublicHandler) renderBodyStart(node *models.ContentNode, nodeData NodeData, settings map[string]string, user *models.User) template.HTML {
	return h.renderHook("render.body_start", node, nodeData, settings, user)
}

func (h *PublicHandler) renderBodyEnd(node *models.ContentNode, nodeData NodeData, settings map[string]string, user *models.User) template.HTML {
	return h.renderHook("render.body_end", node, nodeData, settings, user)
}

func (h *PublicHandler) renderFooter(node *models.ContentNode, nodeData NodeData, settings map[string]string, user *models.User) template.HTML {
	return h.renderHook("render.footer", node, nodeData, settings, user)
}

// composeHead bundles the kernel-rendered theme/block asset tags with
// extension contributions (HeadMeta) into a single template.HTML block.
// Themes that drop {{.app.head}} into <head> get everything in one
// place; themes that prefer fine-grained control still iterate the
// individual arrays directly.
//
// Order: stylesheets → block-scoped CSS → head scripts → extension HTML.
// Stylesheets first so they parse before any inline <style>; extension
// HTML last so an analytics tag can override theme-set values if needed.
func composeHead(app AppData) template.HTML {
	var b strings.Builder
	for _, href := range app.HeadStyles {
		b.WriteString(`<link rel="stylesheet" href="`)
		b.WriteString(template.HTMLEscapeString(href))
		b.WriteString(`">`)
	}
	if app.BlockStyles != "" {
		b.WriteString(string(app.BlockStyles))
	}
	for _, src := range app.HeadScripts {
		b.WriteString(`<script src="`)
		b.WriteString(template.HTMLEscapeString(src))
		b.WriteString(`" defer></script>`)
	}
	if app.HeadMeta != "" {
		b.WriteString(string(app.HeadMeta))
	}
	return template.HTML(b.String())
}

// composeBodyEnd bundles foot scripts + block scripts + extension
// render.body_end contributions. Footer scripts ship deferred so they
// don't block first paint; extension HTML lands after them so an
// extension can register handlers or fire pixels with theme libs
// already loaded.
func composeBodyEnd(app AppData, extensionBodyEnd template.HTML) template.HTML {
	var b strings.Builder
	for _, src := range app.FootScripts {
		b.WriteString(`<script src="`)
		b.WriteString(template.HTMLEscapeString(src))
		b.WriteString(`" defer></script>`)
	}
	if app.BlockScripts != "" {
		b.WriteString(string(app.BlockScripts))
	}
	if extensionBodyEnd != "" {
		b.WriteString(string(extensionBodyEnd))
	}
	return template.HTML(b.String())
}

// buildHookNodePayload mirrors the node map themes already see via
// TemplateData.ToMap(). The contract is "you get what the template
// gets" — keeps things simple without the kernel curating per-feature
// subsets of the data.
//
// The included JSONB blobs (seo, fields, featured_image, taxonomies)
// are kernel data-schema concerns, not feature-specific code: the
// kernel doesn't interpret any of them, it just passes them through
// like any other column.
func buildHookNodePayload(node *models.ContentNode, nodeData NodeData) map[string]any {
	return map[string]any{
		"id":             node.ID,
		"title":          node.Title,
		"slug":           node.Slug,
		"full_url":       node.FullURL,
		"excerpt":        node.Excerpt,
		"language_code":  node.LanguageCode,
		"node_type":      node.NodeType,
		"seo":            nodeData.SEO,
		"fields":         nodeData.Fields,
		"featured_image": nodeData.FeaturedImage,
		"taxonomies":     nodeData.Taxonomies,
	}
}

// buildHookUserPayload returns the per-request user context for render
// hooks, or nil for anonymous visitors. Subscribers gate behavior on
// presence + role / capability — e.g. the visual-editor extension only
// emits its bootstrap script when this is non-nil and the user has node
// write capability for the rendered node's type.
//
// Kept small on purpose: id + role slug + a flag for "has at least one
// admin capability" cover the common gates without forcing extensions
// to round-trip through the host for every render. Extensions that
// need richer info can call core.users.get with the id.
func buildHookUserPayload(user *models.User) map[string]any {
	if user == nil {
		return nil
	}
	return map[string]any{
		"id":        user.ID,
		"email":     user.Email,
		"role_slug": user.Role.Slug,
	}
}

// mapClone returns a shallow copy of a string→string map. Used when a
// caller needs to override a single setting (e.g. force noindex on 404s)
// without mutating the cached site-settings map. Extensions read the
// override out of the payload's settings map and behave accordingly —
// so this helper still belongs in core because the 404 path lives here.
func mapClone(src map[string]string) map[string]string {
	out := make(map[string]string, len(src))
	for k, v := range src {
		out[k] = v
	}
	return out
}
