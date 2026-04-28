package cms

import (
	"strconv"
	"strings"

	"squilla/internal/auth"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

// This file owns the "find a node for a request URL" logic. The
// public handler routes through three resolution paths in turn:
//   1. exact full_url match (findNodeByURL)
//   2. language-only homepage redirect (findLanguageHomepage)
//   3. hide_prefix tolerance (findNodeWithPrefixFallback)
// They share enough fall-back logic that keeping them adjacent (and
// out of public_handler.go's primary handler flow) makes the URL
// resolution rules easy to audit in one place.

// findLanguageHomepage checks if the path is just a language slug (e.g. /de)
// and returns the homepage translation for that language.
func (h *PublicHandler) findLanguageHomepage(path string) (*models.ContentNode, bool) {
	// Path must be /{something} with no further segments
	segments := strings.Split(strings.Trim(path, "/"), "/")
	if len(segments) != 1 || segments[0] == "" {
		return nil, false
	}
	langSlug := segments[0]

	// Check if this matches any active language slug
	var lang models.Language
	foundLang := false
	for _, l := range h.loadActiveLanguages() {
		if l.Slug == langSlug {
			lang = l
			foundLang = true
			break
		}
	}
	if !foundLang {
		return nil, false
	}

	// Find the configured homepage
	settings := h.loadSiteSettings()
	val, ok := settings["homepage_node_id"]
	if !ok || val == "" {
		return nil, false
	}
	homepageID, err := strconv.Atoi(val)
	if err != nil || homepageID <= 0 {
		return nil, false
	}

	var homepage models.ContentNode
	if err := h.db.First(&homepage, homepageID).Error; err != nil {
		return nil, false
	}

	// If homepage language matches, return it directly
	if homepage.LanguageCode == lang.Code {
		if homepage.Status == "published" {
			return &homepage, true
		}
		return nil, false
	}

	// Find translation of homepage in the target language
	if homepage.TranslationGroupID == nil || *homepage.TranslationGroupID == "" {
		return nil, false
	}
	var translated models.ContentNode
	if err := h.db.Where("translation_group_id = ? AND language_code = ? AND status = ? AND deleted_at IS NULL",
		*homepage.TranslationGroupID, lang.Code, "published").First(&translated).Error; err != nil {
		return nil, false
	}
	return &translated, true
}

// findNodeByURL does a direct full_url lookup.
func (h *PublicHandler) findNodeByURL(path string) (*models.ContentNode, bool) {
	var node models.ContentNode
	if err := h.db.
		Where("full_url = ? AND status = ? AND deleted_at IS NULL", path, "published").
		Where("node_type IN (?)", h.db.Model(&models.NodeType{}).Select("slug")).
		First(&node).Error; err != nil {
		return nil, false
	}
	return &node, true
}

// findNodeWithPrefixFallback handles both directions for hide_prefix languages:
// - /en/test -> tries /test (for when hide_prefix is ON but user typed with prefix)
// - /test -> tries /en/test (for when hide_prefix is OFF but URL has no prefix)
func (h *PublicHandler) findNodeWithPrefixFallback(path string) (*models.ContentNode, bool) {
	// Get all active languages
	allLangs := h.loadActiveLanguages()

	// Get all languages with hide_prefix enabled
	var hiddenLangs []models.Language
	for _, l := range allLangs {
		if l.HidePrefix {
			hiddenLangs = append(hiddenLangs, l)
		}
	}

	// Case 1: path is /en/something — check if "en" is a language slug with hide_prefix,
	// meaning the stored URL is just /something
	parts := strings.SplitN(strings.TrimPrefix(path, "/"), "/", 2)
	if len(parts) >= 2 {
		firstSegment := parts[0]
		rest := "/" + parts[1]
		for _, lang := range hiddenLangs {
			if lang.Slug == firstSegment || lang.Code == firstSegment {
				if node, found := h.findNodeByURL(rest); found {
					return node, true
				}
			}
		}
	}

	// Case 2: path is /something — try prepending each hide_prefix language slug
	for _, lang := range hiddenLangs {
		prefixed := "/" + lang.Slug + path
		if node, found := h.findNodeByURL(prefixed); found {
			return node, true
		}
	}

	// Case 3: path is /something — try prepending any active language slug
	// (handles case where URL was built without prefix but hide_prefix is now off)
	for _, lang := range allLangs {
		if lang.HidePrefix {
			continue // already tried above
		}
		prefixed := "/" + lang.Slug + path
		if node, found := h.findNodeByURL(prefixed); found {
			return node, true
		}
	}

	return nil, false
}

// currentUser attempts to retrieve the logged-in user from the session cookie.
// Returns nil if no valid session exists (does not require auth).
func (h *PublicHandler) currentUser(c *fiber.Ctx) *models.User {
	token := c.Cookies(auth.CookieName)
	if token == "" {
		return nil
	}
	user, err := h.sessions.ValidateSession(token)
	if err != nil {
		return nil
	}
	return user
}

// buildUserData converts a User model (possibly nil) to template-friendly UserData.
func buildUserData(user *models.User) UserData {
	if user == nil {
		return UserData{LoggedIn: false}
	}
	fullName := ""
	if user.FullName != nil {
		fullName = *user.FullName
	}
	return UserData{
		LoggedIn: true,
		ID:       user.ID,
		Email:    user.Email,
		Role:     user.Role.Slug,
		FullName: fullName,
	}
}
