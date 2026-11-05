package cms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/models"
)

// Structured data templates.
//
// A theme may describe its content as data (schema.org JSON-LD, or any
// other vocabulary) next to its HTML:
//
//	<theme>/schema/<node_type>.json   rendered once per page, with the page node as data
//	<theme>/blocks/<dir>/schema.json  rendered once per block instance, with the block's fields
//
// Both are text/templates with the same functions and data as the HTML
// templates (node, request, filter, dict, list, json, themeSetting, …),
// so a template can resolve references and query related content the
// same way its view.html does. The output must be JSON: one object, an
// array of objects, or nothing.
//
// The kernel only renders, validates and forwards: the collected objects
// reach render hooks as node.structured_data. What they mean is up to
// the subscriber (the SEO extension merges them into its JSON-LD graph).

const structuredDataLocalsKey = "squilla.structured_data"

// trailingComma matches a comma followed only by whitespace before a
// closing bracket — the usual artefact of `range` loops in JSON templates.
var trailingComma = regexp.MustCompile(`,(\s*[\]}])`)

var (
	// Block-level tags separate words; inline tags (<strong>, <a>) don't.
	blockTag   = regexp.MustCompile(`(?i)</?(p|br|div|li|ul|ol|h[1-6]|blockquote|tr|td|th|section|article)\b[^>]*>`)
	anyTag     = regexp.MustCompile(`<[^>]*>`)
	whitespace = regexp.MustCompile(`\s+`)
)

func structuredPlainText(v interface{}) string {
	if v == nil {
		return ""
	}
	s := blockTag.ReplaceAllString(fmt.Sprintf("%v", v), " ")
	s = anyTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	return strings.TrimSpace(whitespace.ReplaceAllString(s, " "))
}

// renderPageBlocks renders a page's blocks and collects the page's
// structured data (block templates first, then the node-type template)
// into the request locals for the head hooks.
func (h *PublicHandler) renderPageBlocks(c *fiber.Ctx, blocks []map[string]interface{}, locale string, current map[string]interface{}) []string {
	req := requestDataFrom(c)
	var sd []any
	rendered := h.renderBlocksCollect(blocks, locale, req, current, &sd)
	sd = append(sd, h.renderNodeStructuredData(locale, req, current)...)
	if len(sd) > 0 {
		c.Locals(structuredDataLocalsKey, sd)
	}
	return rendered
}

// structuredDataFrom returns what renderPageBlocks collected for this request.
func structuredDataFrom(c *fiber.Ctx) []any {
	if c == nil {
		return nil
	}
	sd, _ := c.Locals(structuredDataLocalsKey).([]any)
	return sd
}

// renderNodeStructuredData renders <theme>/schema/<node_type>.json.
func (h *PublicHandler) renderNodeStructuredData(locale string, req, current map[string]interface{}) []any {
	if current == nil {
		return nil
	}
	nodeType, _ := current["node_type"].(string)
	if nodeType == "" || strings.ContainsAny(nodeType, `/\.`) {
		return nil
	}
	src := h.themeStructuredTemplate(filepath.Join("schema", nodeType+".json"))
	if src == "" {
		return nil
	}
	// References in the node's own fields (authors, FAQs, meeting points)
	// are hydrated so the template can read them like view.html does.
	if fields, ok := current["fields"].(map[string]interface{}); ok {
		ids := map[int]bool{}
		collectNodeIDs(fields, ids)
		if len(ids) > 0 {
			applyHydratedNodes(fields, h.fetchHydrationNodes(ids))
		}
	}
	ts := h.loadThemeSettingsForRender(context.Background(), locale)
	return h.execStructuredTemplate("schema/"+nodeType, src, current, req, current, ts)
}

// renderBlockStructuredData renders the block's schema.json, if its theme
// ships one.
func (h *PublicHandler) renderBlockStructuredData(bt models.BlockType, fields, req, current map[string]interface{}, ts map[string]map[string]any) []any {
	if bt.ViewFile == "" || bt.Source == "custom" {
		return nil
	}
	src := h.themeStructuredTemplate(filepath.Join(filepath.Dir(bt.ViewFile), "schema.json"))
	if src == "" {
		return nil
	}
	return h.execStructuredTemplate("block/"+bt.Slug, src, fields, req, current, ts)
}

func (h *PublicHandler) execStructuredTemplate(name, src string, data, req, current map[string]interface{}, ts map[string]map[string]any) []any {
	if req == nil {
		req = emptyRequestData()
	}
	funcs := map[string]interface{}{
		"request":  func() map[string]interface{} { return req },
		"node":     func() map[string]interface{} { return current },
		"safeHTML": func(s interface{}) template.HTML { return template.HTML(fmt.Sprintf("%v", s)) },
		"safeURL":  func(s interface{}) template.URL { return template.URL(fmt.Sprintf("%v", s)) },
		// plainText strips tags and collapses whitespace — for rich-text
		// fields that become schema.org text properties.
		"plainText": structuredPlainText,
	}
	for k, v := range themeSettingsFuncs(ts) {
		funcs[k] = v
	}

	var buf bytes.Buffer
	var err error
	func() {
		defer func() {
			if r := recover(); r != nil {
				err = fmt.Errorf("panic: %v", r)
			}
		}()
		err = h.renderer.RenderText(&buf, name, src, data, funcs)
	}()
	if err != nil {
		log.Printf("WARN: structured data template %s: %v", name, err)
		return nil
	}
	out, perr := parseStructuredData(buf.Bytes())
	if perr != nil {
		log.Printf("WARN: structured data template %s produced invalid JSON: %v", name, perr)
		return nil
	}
	return out
}

// parseStructuredData accepts an object, an array of objects, or blank
// output. Trailing commas are forgiven; anything else invalid is an error.
func parseStructuredData(raw []byte) ([]any, error) {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return nil, nil
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		cleaned := trailingComma.ReplaceAll(raw, []byte("$1"))
		if err2 := json.Unmarshal(cleaned, &v); err2 != nil {
			return nil, err
		}
	}
	switch x := v.(type) {
	case map[string]any:
		if len(x) == 0 {
			return nil, nil
		}
		return []any{x}, nil
	case []any:
		out := make([]any, 0, len(x))
		for _, item := range x {
			if m, ok := item.(map[string]any); ok && len(m) > 0 {
				out = append(out, m)
			}
		}
		return out, nil
	case nil:
		return nil, nil
	default:
		return nil, fmt.Errorf("expected an object or array, got %T", v)
	}
}

// themeStructuredTemplate reads a file relative to the active theme's
// directory. Reads (and misses) are cached in themeBlockCache, which
// ClearCache resets on theme and block changes.
func (h *PublicHandler) themeStructuredTemplate(rel string) string {
	root := h.activeThemePath()
	if root == "" {
		return ""
	}
	path := filepath.Join(root, rel)
	key := "sd:" + path

	h.cacheMu.RLock()
	cached, ok := h.themeBlockCache[key]
	h.cacheMu.RUnlock()
	if ok {
		return cached
	}
	content := ""
	if data, err := os.ReadFile(path); err == nil {
		content = string(data)
	}
	h.cacheMu.Lock()
	h.themeBlockCache[key] = content
	h.cacheMu.Unlock()
	return content
}

func (h *PublicHandler) activeThemePath() string {
	const key = "sd:active-theme-path"
	h.cacheMu.RLock()
	cached, ok := h.themeBlockCache[key]
	h.cacheMu.RUnlock()
	if ok {
		return cached
	}
	var theme models.Theme
	path := ""
	if err := h.db.Select("path").Where("is_active = ?", true).First(&theme).Error; err == nil {
		path = theme.Path
	}
	h.cacheMu.Lock()
	h.themeBlockCache[key] = path
	h.cacheMu.Unlock()
	return path
}
