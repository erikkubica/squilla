package cms

import (
	"encoding/json"
	"strconv"
	"strings"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// This file owns the URL-construction helpers used by ContentService:
// converting a node into its full_url given language slug, parent
// slugs, and node-type prefixes. Pure functions, no DB writes.

// buildFullURL constructs the full URL path for a content node based on its
// language code, node type, parent hierarchy, and slug.
// Format for page/post: /{language_code}/{parent_slugs...}/{slug}
// Format for custom types: /{language_code}/{node_type_slug}/{parent_slugs...}/{slug}
// Special case: if slug is "index", full_url is /{language_code} (or / for default).
func buildFullURL(node *models.ContentNode, db *gorm.DB) string {
	langCode := node.LanguageCode
	if langCode == "" {
		langCode = "en"
	}

	// Resolve language slug (URL segment) from language code
	langSlug := resolveLanguageSlug(langCode, db)

	// Special case for index pages
	if node.Slug == "index" {
		if langSlug == "" {
			return "/"
		}
		return "/" + langSlug
	}

	// Special case: if this node is the homepage or a translation of the homepage,
	// use /{lang} (or / for default language) instead of /{lang}/slug.
	if isHomepageOrTranslation(node, db) {
		if langSlug == "" {
			return "/"
		}
		return "/" + langSlug
	}

	// Build segment chain
	var segments []string

	// Add language slug prefix (empty if hide_prefix is on)
	if langSlug != "" {
		segments = append(segments, langSlug)
	}

	// Custom node types get a URL prefix (translated if available)
	if node.NodeType != "page" && node.NodeType != "" {
		prefix := resolveURLPrefix(node.NodeType, langCode, db)
		if prefix != "" {
			segments = append(segments, prefix)
		}
	}

	if node.ParentID != nil {
		segments = append(segments, collectParentSlugs(*node.ParentID, db)...)
	}
	segments = append(segments, node.Slug)

	return "/" + strings.Join(segments, "/")
}

// isHomepageOrTranslation checks if a node is the configured homepage or a translation of it.
func isHomepageOrTranslation(node *models.ContentNode, db *gorm.DB) bool {
	var setting models.SiteSetting
	if err := db.Where("key = ?", "homepage_node_id").First(&setting).Error; err != nil || setting.Value == nil {
		return false
	}
	homepageID, err := strconv.Atoi(*setting.Value)
	if err != nil || homepageID <= 0 {
		return false
	}

	// Direct match: this IS the homepage
	if node.ID == homepageID {
		return true
	}

	// Translation match: shares translation_group_id with the homepage
	if node.TranslationGroupID == nil || *node.TranslationGroupID == "" {
		return false
	}
	var homepage models.ContentNode
	if err := db.Select("translation_group_id").First(&homepage, homepageID).Error; err != nil {
		return false
	}
	if homepage.TranslationGroupID == nil || *homepage.TranslationGroupID == "" {
		return false
	}
	return *node.TranslationGroupID == *homepage.TranslationGroupID
}

// resolveLanguageSlug returns the URL slug for a language code.
// Returns empty string if language has hide_prefix enabled.
// Falls back to the code itself if no language record is found.
func resolveLanguageSlug(langCode string, db *gorm.DB) string {
	var lang models.Language
	if err := db.Select("slug, hide_prefix").Where("code = ?", langCode).First(&lang).Error; err != nil {
		return langCode // fallback to code
	}
	if lang.HidePrefix {
		return ""
	}
	if lang.Slug == "" {
		return langCode
	}
	return lang.Slug
}

// resolveURLPrefix returns the URL prefix for a node type in the given language.
// It checks the node_types table for a translated prefix. Falls back to the type slug.
func resolveURLPrefix(nodeType, lang string, db *gorm.DB) string {
	var nt models.NodeType
	if err := db.Select("slug, url_prefixes").Where("slug = ?", nodeType).First(&nt).Error; err != nil {
		return nodeType // fallback to type slug
	}

	// Parse url_prefixes JSONB
	var prefixes map[string]string
	if len(nt.URLPrefixes) > 0 {
		if err := json.Unmarshal([]byte(nt.URLPrefixes), &prefixes); err == nil {
			if p, ok := prefixes[lang]; ok && p != "" {
				return p
			}
		}
	}

	return nodeType // fallback to type slug
}

