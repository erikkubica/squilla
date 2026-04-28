package cms

import (
	"encoding/json"
	"log"

	"squilla/internal/models"
)

// This file collects the small helpers that don't belong to the
// page-render flow but are needed by it: site-setting and language
// caches, blocks_data parsing, theme-asset reference resolution, and
// block-slug extraction.

// loadSiteSettings loads all site settings into a map keyed by setting key.
func (h *PublicHandler) loadSiteSettings() map[string]string {
	h.cacheMu.RLock()
	settings := h.siteSettings
	h.cacheMu.RUnlock()

	if settings != nil {
		return settings
	}

	h.cacheMu.Lock()
	defer h.cacheMu.Unlock()
	if h.siteSettings != nil {
		return h.siteSettings
	}

	settings = make(map[string]string)
	var allSettings []models.SiteSetting
	h.db.Find(&allSettings)
	for _, s := range allSettings {
		if s.Value != nil {
			settings[s.Key] = *s.Value
		}
	}

	h.siteSettings = settings
	return settings
}

// loadActiveLanguages loads all active languages as a slice.
func (h *PublicHandler) loadActiveLanguages() []models.Language {
	h.cacheMu.RLock()
	languages := h.activeLanguages
	h.cacheMu.RUnlock()

	if languages != nil {
		return languages
	}

	h.cacheMu.Lock()
	defer h.cacheMu.Unlock()
	if h.activeLanguages != nil {
		return h.activeLanguages
	}

	var langs []models.Language
	h.db.Where("is_active = ?", true).Order("sort_order ASC").Find(&langs)

	h.activeLanguages = langs
	return langs
}

// parseBlocks unmarshals JSONB blocks_data into a slice of maps.
func parseBlocks(data models.JSONB) []map[string]interface{} {
	if len(data) == 0 {
		return nil
	}

	var blocks []map[string]interface{}
	if err := json.Unmarshal([]byte(data), &blocks); err != nil {
		log.Printf("warning: failed to parse blocks_data: %v", err)
		return nil
	}
	return blocks
}

// resolveAssetRefsInBlocks walks each block's "fields" map and substitutes
// any `theme-asset:<key>` / `extension-asset:<slug>:<key>` string references
// with the matching media object, using the active theme's asset map.
// Without this, live renders leak "theme-asset:..." strings into templates
// and Go's safeURL sanitiser replaces them with "#ZgotmplZ".
func (h *PublicHandler) resolveAssetRefsInBlocks(blocks []map[string]interface{}) {
	if len(blocks) == 0 {
		return
	}
	var active models.Theme
	if err := h.db.Where("is_active = ?", true).First(&active).Error; err != nil {
		return
	}
	lookup := LoadAssetLookup(h.db, active.Name)
	for i := range blocks {
		fields, ok := blocks[i]["fields"].(map[string]interface{})
		if !ok {
			continue
		}
		blocks[i]["fields"] = ResolveThemeAssetRefs(fields, lookup)
	}
}

// extractBlockSlugs returns the unique block type slugs used in a parsed blocks list.
func extractBlockSlugs(blocks []map[string]interface{}) []string {
	seen := make(map[string]bool, len(blocks))
	slugs := make([]string, 0, len(blocks))
	for _, b := range blocks {
		if t, ok := b["type"].(string); ok && t != "" && !seen[t] {
			seen[t] = true
			slugs = append(slugs, t)
		}
	}
	return slugs
}
