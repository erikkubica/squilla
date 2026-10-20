package cms

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm/clause"

	"squilla/internal/models"
)

// This file owns taxonomy-term archives and the per-request context that
// templates read through `request` (blocks) and `.request` (layouts).
//
// Archive URLs live under a node type's URL prefix:
//
//	/<prefix>/<taxonomy>/<term>      e.g. /blog/category/hidden-hanoi-cafes
//
// They render the published node at /<prefix> (the listing page) with
// request.archive populated, so the listing block can filter by the term.
// Nothing resolves unless the prefix belongs to a node type, that node type
// declares the taxonomy, and the term exists — every other path still 404s.

const requestLocalsKey = "squilla.request"

// termArchive is the resolved archive a request points at.
type termArchive struct {
	NodeType        string
	Taxonomy        string
	TaxonomyLabel   string
	Term            string
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

// resolveTermArchive maps /<prefix>/<taxonomy>/<term> to the listing node at
// /<prefix> and the matching term.
func (h *PublicHandler) resolveTermArchive(path string) (*models.ContentNode, *termArchive, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 3 {
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
	for _, nt := range nodeTypes {
		var prefixes map[string]string
		if json.Unmarshal(nt.URLPrefixes, &prefixes) != nil {
			continue
		}
		prefix := strings.Trim(prefixes[listing.LanguageCode], "/")
		if prefix == "" || !strings.HasSuffix(base, "/"+prefix) {
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
