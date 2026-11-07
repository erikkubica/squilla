package cms

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"squilla/internal/models"
)

// This file owns content-type archive pages, taxonomy-term archives and the
// per-request context that templates read through `request` (blocks) and
// `.request` (layouts).
//
// Each node type has an archive page per language: the page that lists its
// items. It is the node configured in node_types.archive_node_ids[lang], or,
// when none is configured (or it isn't published), the published node whose
// URL is the type's URL prefix (the original convention, kept so existing
// sites need no data migration).
//
// Term archives live under the archive page's URL:
//
//	/<archive page>/<taxonomy>/<term>      e.g. /blog/category/hidden-hanoi-cafes
//
// They render the archive page with request.archive populated, so the
// listing block can filter by the term. Nothing resolves unless the base path
// is a node type's archive page, that node type declares the taxonomy, and
// the term exists — every other path still 404s.

const requestLocalsKey = "squilla.request"

// termArchive is the resolved archive a request points at.
type termArchive struct {
	NodeType        string
	Taxonomy        string
	TaxonomyLabel   string
	Term            string
	TermID          int
	TermName        string
	TermDescription string
	BaseURL         string
}

func (a *termArchive) toMap() map[string]interface{} {
	return map[string]interface{}{
		"node_type":        a.NodeType,
		"taxonomy":         a.Taxonomy,
		"taxonomy_label":   a.TaxonomyLabel,
		"term":             a.Term,
		"term_name":        a.TermName,
		"term_description": a.TermDescription,
		"base_url":         a.BaseURL,
		"url":              a.BaseURL + "/" + a.Taxonomy + "/" + a.Term,
	}
}

// archiveNodeFor returns the published archive page of nt in lang: the
// configured archive_node_ids[lang] node, else the published node at the
// type's URL prefix.
func archiveNodeFor(db *gorm.DB, nt *models.NodeType, lang string) (*models.ContentNode, bool) {
	if n, ok := configuredArchiveNode(db, nt, lang); ok {
		return n, true
	}
	return prefixArchiveNode(db, nt, lang)
}

// configuredArchiveNode loads archive_node_ids[lang] when it is published.
// A node saved for the wrong language resolves to its translation in lang.
func configuredArchiveNode(db *gorm.DB, nt *models.NodeType, lang string) (*models.ContentNode, bool) {
	id := nt.ArchiveNodeIDMap()[lang]
	if id <= 0 {
		return nil, false
	}
	var n models.ContentNode
	if err := db.Where("id = ? AND deleted_at IS NULL", id).First(&n).Error; err != nil {
		return nil, false
	}
	if n.LanguageCode != lang {
		if n.TranslationGroupID == nil || *n.TranslationGroupID == "" {
			return nil, false
		}
		var tr models.ContentNode
		if err := db.Where("translation_group_id = ? AND language_code = ? AND deleted_at IS NULL",
			*n.TranslationGroupID, lang).First(&tr).Error; err != nil {
			return nil, false
		}
		n = tr
	}
	if n.Status != "published" {
		return nil, false
	}
	return &n, true
}

// prefixArchiveNode is the legacy rule: the published node in lang whose
// full_url is the type's explicit URL prefix (with or without the language
// segment). Types without an explicit prefix for lang have none.
func prefixArchiveNode(db *gorm.DB, nt *models.NodeType, lang string) (*models.ContentNode, bool) {
	var prefixes map[string]string
	if json.Unmarshal(nt.URLPrefixes, &prefixes) != nil {
		return nil, false
	}
	prefix := strings.Trim(prefixes[lang], "/")
	if prefix == "" {
		return nil, false
	}
	candidates := []string{"/" + prefix}
	if langSlug := resolveLanguageSlug(lang, db); langSlug != "" {
		candidates = append([]string{"/" + langSlug + "/" + prefix}, candidates...)
	}
	var n models.ContentNode
	err := db.
		Where("full_url IN ? AND language_code = ? AND status = ? AND deleted_at IS NULL", candidates, lang, "published").
		Order(clause.OrderBy{Expression: clause.Expr{
			SQL:  "CASE WHEN full_url = ? THEN 0 ELSE 1 END, id",
			Vars: []interface{}{candidates[0]},
		}}).
		First(&n).Error
	if err != nil {
		return nil, false
	}
	return &n, true
}

// typeArchiveURL returns the URL of the archive page listing nodeType's items
// in lang, or "" when the type has none.
func typeArchiveURL(db *gorm.DB, nodeType, lang string) string {
	var nt models.NodeType
	if err := db.Select("slug, url_prefixes, archive_node_ids").Where("slug = ?", nodeType).First(&nt).Error; err != nil {
		return ""
	}
	return archiveURLForType(db, &nt, lang)
}

func archiveURLForType(db *gorm.DB, nt *models.NodeType, lang string) string {
	if n, ok := archiveNodeFor(db, nt, lang); ok {
		return n.FullURL
	}
	return ""
}

// isArchiveFor reports whether listing (found at base) is nt's archive page in
// its language. A configured, published archive page is authoritative; types
// without one keep the legacy rule (base ends with the type's URL prefix).
func isArchiveFor(db *gorm.DB, nt *models.NodeType, listing *models.ContentNode, base string) bool {
	if configured, ok := configuredArchiveNode(db, nt, listing.LanguageCode); ok {
		return configured.ID == listing.ID
	}
	var prefixes map[string]string
	if json.Unmarshal(nt.URLPrefixes, &prefixes) != nil {
		return false
	}
	prefix := strings.Trim(prefixes[listing.LanguageCode], "/")
	return prefix != "" && strings.HasSuffix(base, "/"+prefix)
}

// resolveTermArchive maps /<archive page>/<taxonomy>/<term> to the archive
// page and the matching term.
func (h *PublicHandler) resolveTermArchive(path string) (*models.ContentNode, *termArchive, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	// Two segments are enough when the archive page is the homepage ("/").
	if len(parts) < 2 {
		return nil, nil, false
	}
	taxSlug := parts[len(parts)-2]
	termSlug := parts[len(parts)-1]
	base := "/" + strings.Join(parts[:len(parts)-2], "/")

	listing, found := h.findNodeByURL(base)
	if !found {
		listing, found = h.findNodeWithPrefixFallback(base)
	}
	if !found {
		return nil, nil, false
	}

	var nodeTypes []models.NodeType
	if err := h.db.Find(&nodeTypes).Error; err != nil {
		return nil, nil, false
	}
	for i := range nodeTypes {
		nt := &nodeTypes[i]
		if !isArchiveFor(h.db, nt, listing, base) {
			continue
		}
		var taxonomies []struct {
			Slug  string `json:"slug"`
			Label string `json:"label"`
		}
		if json.Unmarshal(nt.Taxonomies, &taxonomies) != nil {
			continue
		}
		for _, tx := range taxonomies {
			if tx.Slug != taxSlug {
				continue
			}
			var term models.TaxonomyTerm
			err := h.db.
				Where("node_type = ? AND taxonomy = ? AND slug = ?", nt.Slug, taxSlug, termSlug).
				// Prefer the listing's language, then any translation sharing the slug.
				Order(clause.OrderBy{Expression: clause.Expr{
					SQL:  "CASE WHEN language_code = ? THEN 0 ELSE 1 END, id",
					Vars: []interface{}{listing.LanguageCode},
				}}).
				First(&term).Error
			if err != nil {
				return nil, nil, false
			}
			return listing, &termArchive{
				NodeType:        nt.Slug,
				Taxonomy:        taxSlug,
				TaxonomyLabel:   tx.Label,
				Term:            term.Slug,
				TermID:          term.ID,
				TermName:        term.Name,
				TermDescription: term.Description,
				BaseURL:         strings.TrimSuffix(listing.FullURL, "/"),
			}, true
		}
	}
	return nil, nil, false
}

// buildRequestData captures the parts of the request templates may react to.
// Values come from the visitor and are escaped by html/template on output.
func buildRequestData(c *fiber.Ctx, archive *termArchive) map[string]interface{} {
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	query := map[string]interface{}{}
	c.Context().QueryArgs().VisitAll(func(k, v []byte) {
		query[string(k)] = string(v)
	})
	data := map[string]interface{}{
		"path":    c.Path(),
		"page":    page,
		"query":   query,
		"archive": nil,
	}
	if archive != nil {
		data["archive"] = archive.toMap()
	}
	return data
}

// requestDataFrom returns the request context stored for this render, or an
// empty context for renders that have no visitor request (MCP, previews).
func requestDataFrom(c *fiber.Ctx) map[string]interface{} {
	if c != nil {
		if v, ok := c.Locals(requestLocalsKey).(map[string]interface{}); ok {
			return v
		}
	}
	return emptyRequestData()
}

func emptyRequestData() map[string]interface{} {
	return map[string]interface{}{"path": "", "page": 1, "query": map[string]interface{}{}, "archive": nil}
}

// isDefaultRequest reports whether output can be shared across requests
// (first page, no archive) and is therefore safe for the block output cache.
func isDefaultRequest(req map[string]interface{}) bool {
	if req == nil {
		return true
	}
	if req["archive"] != nil {
		return false
	}
	// Editor previews render unsaved field values; keep them out of the
	// shared block output cache.
	if preview, _ := req["preview"].(bool); preview {
		return false
	}
	page, _ := req["page"].(int)
	return page <= 1
}

// requestHookNode adapts the node payload given to render hooks for archive
// and paginated views: canonical URL, title and description describe the
// view itself. Plain page-one requests get the node unchanged.
func requestHookNode(node NodeData, req map[string]interface{}) NodeData {
	page, _ := req["page"].(int)
	archive, _ := req["archive"].(map[string]interface{})
	if archive == nil && page <= 1 {
		return node
	}
	out := node
	url := node.FullURL
	seo := make(map[string]interface{}, len(node.SEO)+1)
	for k, v := range node.SEO {
		seo[k] = v
	}
	if archive != nil {
		url, _ = archive["url"].(string)
		name, _ := archive["term_name"].(string)
		out.Title = name
		out.Excerpt, _ = archive["term_description"].(string)
		delete(seo, "meta_title")
		delete(seo, "meta_description")
		// Translations point at the listing page, not this term.
		out.Translations = nil
	}
	if page > 1 {
		url = fmt.Sprintf("%s?page=%d", url, page)
		out.Title = fmt.Sprintf("%s — Page %d", out.Title, page)
	}
	out.FullURL = url
	delete(seo, "canonical")
	seo["canonical_url"] = url
	out.SEO = seo
	return out
}
