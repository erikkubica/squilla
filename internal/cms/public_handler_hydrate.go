package cms

import (
	"encoding/json"
	"html/template"

	"squilla/internal/models"
	"squilla/internal/sanitize"
)

// This file owns "field hydration": expanding stored block field
// values from compact references (a node ID, a term slug) into the
// fully-shaped objects the templates expect. Lives separately from
// public_handler.go because the recursive walkers (group/repeater
// schemas, term/node refs, richtext marking) form a self-contained
// subsystem that can be tested without standing up a Fiber app.

// fieldSchemaDef represents a field definition from the block type's field_schema.
type fieldSchemaDef struct {
	Key       string           `json:"key"`
	Type      string           `json:"type"`
	Taxonomy  string           `json:"taxonomy"`
	Multiple  bool             `json:"multiple"`
	SubFields []fieldSchemaDef `json:"sub_fields"`
}

// hydrateFields walks through field values and hydrates node references.
// Note: Preferred way is to use renderBlocksBatch for superior performance.
func (h *PublicHandler) hydrateFields(fields map[string]interface{}) {
	nodeIDs := make(map[int]bool)
	collectNodeIDs(fields, nodeIDs)
	if len(nodeIDs) == 0 {
		return
	}

	var ids []int
	for id := range nodeIDs {
		ids = append(ids, id)
	}

	var nodes []models.ContentNode
	if err := h.db.Where("id IN ?", ids).Find(&nodes).Error; err != nil {
		return
	}

	nodeTypeSlugs := make(map[string]bool)
	for _, n := range nodes {
		if n.NodeType != "" {
			nodeTypeSlugs[n.NodeType] = true
		}
	}
	var types []string
	for nt := range nodeTypeSlugs {
		types = append(types, nt)
	}

	var nodeTypes []models.NodeType
	if len(types) > 0 {
		h.db.Where("slug IN ?", types).Find(&nodeTypes)
	}
	typeSchemaMap := make(map[string]models.JSONB)
	for _, nt := range nodeTypes {
		typeSchemaMap[nt.Slug] = nt.Fields
	}

	nodeMap := make(map[int]map[string]interface{})
	for _, node := range nodes {
		var featuredImage interface{}
		if len(node.FeaturedImage) > 0 {
			json.Unmarshal(node.FeaturedImage, &featuredImage)
		}

		var taxonomies map[string][]string
		if len(node.Taxonomies) > 0 {
			json.Unmarshal(node.Taxonomies, &taxonomies)
		}

		hydrated := map[string]interface{}{
			"id":             node.ID,
			"uuid":           node.UUID,
			"title":          node.Title,
			"slug":           node.Slug,
			"full_url":       node.FullURL,
			"featured_image": featuredImage,
			"excerpt":        node.Excerpt,
			"taxonomies":     taxonomies,
			"node_type":      node.NodeType,
			"status":         node.Status,
			"language_code":  node.LanguageCode,
			"version":        node.Version,
			"created_at":     node.CreatedAt,
			"updated_at":     node.UpdatedAt,
		}
		if node.PublishedAt != nil {
			hydrated["published_at"] = *node.PublishedAt
		}

		if len(node.FieldsData) > 0 {
			var fieldsData map[string]interface{}
			if err := json.Unmarshal([]byte(node.FieldsData), &fieldsData); err == nil {
				if schema, ok := typeSchemaMap[node.NodeType]; ok {
					markRichTextFields(fieldsData, schema)
				}
				for k, v := range fieldsData {
					hydrated[k] = v
				}
			}
		}

		if len(node.BlocksData) > 0 {
			var blocksData []map[string]interface{}
			if err := json.Unmarshal([]byte(node.BlocksData), &blocksData); err == nil {
				hydrated["blocks"] = blocksData
			}
		}

		nodeMap[int(node.ID)] = hydrated
	}

	applyHydratedNodes(fields, nodeMap)
}

// hydrateTermFields resolves partial term refs in blocks_data against the DB.
// Accepts bare slug strings, {"slug":"..."} partials, or full term objects.
// After this call, term-field values are always full term objects (or untouched
// if no match is found — the template can still read .slug / .name).
func (h *PublicHandler) hydrateTermFields(fields map[string]interface{}, schema models.JSONB) {
	var defs []fieldSchemaDef
	if err := json.Unmarshal(schema, &defs); err != nil {
		return
	}
	needs := map[string]map[string]bool{}
	collectTermSlugs(fields, defs, needs)
	if len(needs) == 0 {
		return
	}
	resolved := map[string]map[string]map[string]interface{}{}
	for tax, slugs := range needs {
		slugList := make([]string, 0, len(slugs))
		for s := range slugs {
			slugList = append(slugList, s)
		}
		var terms []models.TaxonomyTerm
		if err := h.db.Where("taxonomy = ? AND slug IN ?", tax, slugList).Find(&terms).Error; err != nil {
			continue
		}
		m := map[string]map[string]interface{}{}
		for _, t := range terms {
			b, _ := json.Marshal(t)
			var obj map[string]interface{}
			_ = json.Unmarshal(b, &obj)
			m[t.Slug] = obj
		}
		resolved[tax] = m
	}
	applyTermHydration(fields, defs, resolved)
}

func termSlugFromRef(v interface{}) string {
	switch r := v.(type) {
	case string:
		return r
	case map[string]interface{}:
		if idv, ok := r["id"]; ok {
			if id := parseNodeID(idv); id > 0 {
				return ""
			}
		}
		if s, ok := r["slug"].(string); ok {
			return s
		}
	}
	return ""
}

func collectTermSlugs(fields map[string]interface{}, defs []fieldSchemaDef, out map[string]map[string]bool) {
	for _, def := range defs {
		val, ok := fields[def.Key]
		if !ok || val == nil {
			continue
		}
		switch def.Type {
		case "term":
			tax := def.Taxonomy
			if tax == "" {
				continue
			}
			add := func(v interface{}) {
				if s := termSlugFromRef(v); s != "" {
					if out[tax] == nil {
						out[tax] = map[string]bool{}
					}
					out[tax][s] = true
				}
			}
			if def.Multiple {
				if arr, ok := val.([]interface{}); ok {
					for _, it := range arr {
						add(it)
					}
				}
			} else {
				add(val)
			}
		case "object", "group":
			if m, ok := val.(map[string]interface{}); ok && len(def.SubFields) > 0 {
				collectTermSlugs(m, def.SubFields, out)
			}
		case "array", "repeater":
			if arr, ok := val.([]interface{}); ok && len(def.SubFields) > 0 {
				for _, item := range arr {
					if m, ok := item.(map[string]interface{}); ok {
						collectTermSlugs(m, def.SubFields, out)
					}
				}
			}
		}
	}
}

func applyTermHydration(fields map[string]interface{}, defs []fieldSchemaDef, resolved map[string]map[string]map[string]interface{}) {
	for _, def := range defs {
		val, ok := fields[def.Key]
		if !ok || val == nil {
			continue
		}
		switch def.Type {
		case "term":
			tax := def.Taxonomy
			if tax == "" {
				continue
			}
			lookup := resolved[tax]
			resolve := func(v interface{}) interface{} {
				s := termSlugFromRef(v)
				if s == "" {
					return v
				}
				if hit, ok := lookup[s]; ok {
					return hit
				}
				return v
			}
			if def.Multiple {
				if arr, ok := val.([]interface{}); ok {
					for i, it := range arr {
						arr[i] = resolve(it)
					}
					fields[def.Key] = arr
				}
			} else {
				fields[def.Key] = resolve(val)
			}
		case "object", "group":
			if m, ok := val.(map[string]interface{}); ok && len(def.SubFields) > 0 {
				applyTermHydration(m, def.SubFields, resolved)
			}
		case "array", "repeater":
			if arr, ok := val.([]interface{}); ok && len(def.SubFields) > 0 {
				for _, item := range arr {
					if m, ok := item.(map[string]interface{}); ok {
						applyTermHydration(m, def.SubFields, resolved)
					}
				}
			}
		}
	}
}

// markRichTextFields walks field values and converts richtext/textarea HTML strings
// to template.HTML so Go's html/template does not escape them.
// It uses the block type's field_schema to identify which fields are richtext.
func markRichTextFields(fields map[string]interface{}, schema models.JSONB) {
	var defs []fieldSchemaDef
	if err := json.Unmarshal(schema, &defs); err != nil {
		return
	}
	applyRichTextMarking(fields, defs)
}

// applyRichTextMarking recursively walks fields and marks richtext values as template.HTML.
func applyRichTextMarking(fields map[string]interface{}, defs []fieldSchemaDef) {
	for _, def := range defs {
		val, ok := fields[def.Key]
		if !ok || val == nil {
			continue
		}
		switch def.Type {
		case "richtext":
			// Sanitize stored HTML before handing it to template.HTML.
			// Authors with content-write capability would otherwise be
			// able to inject <script> into block fields and have them
			// execute on every visitor's browser. The sanitizer strips
			// scripts/iframes/event handlers but keeps the typical
			// prose markup themes expect (headings, lists, links, etc.).
			if s, ok := val.(string); ok {
				fields[def.Key] = template.HTML(sanitize.RichText(s))
			}
		case "image":
			// Normalize image fields to always be a map with at least "url".
			// Media picker stores full objects (url, alt, width, height, etc.).
			// Plain strings (from test_data) get wrapped as {"url": "..."}.
			// Templates access via .field.url, .field.alt, .field.width, etc.
			switch v := val.(type) {
			case string:
				if v != "" {
					fields[def.Key] = map[string]interface{}{"url": v}
				}
			case map[string]interface{}:
				// Already a proper object — leave as-is.
			}
		case "link":
			// Normalize link fields to always be a map with text, url, alt, target.
			// Templates access via .field.url, .field.text, .field.target, etc.
			switch v := val.(type) {
			case string:
				if v != "" {
					fields[def.Key] = map[string]interface{}{"url": v, "text": v}
				}
			case map[string]interface{}:
				// Already a proper object — leave as-is.
			}
		case "object", "group":
			// Recurse into nested object/group sub-fields
			if m, ok := val.(map[string]interface{}); ok && len(def.SubFields) > 0 {
				applyRichTextMarking(m, def.SubFields)
			}
		case "array", "repeater":
			// Recurse into each array/repeater row
			if arr, ok := val.([]interface{}); ok && len(def.SubFields) > 0 {
				for _, item := range arr {
					if m, ok := item.(map[string]interface{}); ok {
						applyRichTextMarking(m, def.SubFields)
					}
				}
			}
		}
	}
}

func parseNodeID(idVal interface{}) int {
	switch id := idVal.(type) {
	case float64:
		return int(id)
	case int:
		return id
	case json.Number:
		n, _ := id.Int64()
		return int(n)
	}
	return 0
}

// isMediaLikeMap reports whether m looks like a media-file or asset object
// rather than a node reference. The hydrator must NOT treat its `id` as a
// content-node id, otherwise a feature card with `{image: {id: 2, url: ...}}`
// gets its image silently replaced by node #2's data and the rendered <img>
// tag ends up with src="" (because the swapped node has no url field).
//
// Heuristic: media objects always carry url/mime_type/width/height. Node
// references at this stage carry only `id` (or id + slug placeholder).
// Presence of any of these media-only keys is a hard signal to skip hydration.
func isMediaLikeMap(m map[string]interface{}) bool {
	if _, ok := m["url"]; ok {
		return true
	}
	if _, ok := m["mime_type"]; ok {
		return true
	}
	if _, ok := m["width"]; ok {
		return true
	}
	if _, ok := m["height"]; ok {
		return true
	}
	return false
}

func collectNodeIDs(fields map[string]interface{}, nodeIDs map[int]bool) {
	for _, val := range fields {
		switch v := val.(type) {
		case map[string]interface{}:
			if isMediaLikeMap(v) {
				continue
			}
			if idVal, hasID := v["id"]; hasID {
				if id := parseNodeID(idVal); id > 0 {
					nodeIDs[id] = true
				}
			}
		case []interface{}:
			if len(v) > 0 {
				if first, ok := v[0].(map[string]interface{}); ok {
					_, firstHasID := first["id"]
					if firstHasID && !isMediaLikeMap(first) {
						for _, item := range v {
							if m, ok := item.(map[string]interface{}); ok {
								if isMediaLikeMap(m) {
									continue
								}
								if idVal, hasID := m["id"]; hasID {
									if id := parseNodeID(idVal); id > 0 {
										nodeIDs[id] = true
									}
								}
							}
						}
					} else {
						for _, item := range v {
							if m, ok := item.(map[string]interface{}); ok {
								collectNodeIDs(m, nodeIDs)
							}
						}
					}
				}
			}
		}
	}
}

func applyHydratedNodes(fields map[string]interface{}, nodeMap map[int]map[string]interface{}) {
	for key, val := range fields {
		switch v := val.(type) {
		case map[string]interface{}:
			if isMediaLikeMap(v) {
				continue
			}
			if idVal, hasID := v["id"]; hasID {
				if id := parseNodeID(idVal); id > 0 {
					if hydrated, ok := nodeMap[id]; ok {
						fields[key] = hydrated
					}
				}
			}
		case []interface{}:
			if len(v) > 0 {
				if first, ok := v[0].(map[string]interface{}); ok {
					_, firstHasID := first["id"]
					if firstHasID && !isMediaLikeMap(first) {
						for i, item := range v {
							if m, ok := item.(map[string]interface{}); ok {
								if isMediaLikeMap(m) {
									continue
								}
								if idVal, hasID := m["id"]; hasID {
									if id := parseNodeID(idVal); id > 0 {
										if hydrated, ok := nodeMap[id]; ok {
											v[i] = hydrated
										}
									}
								}
							}
						}
						fields[key] = v
					} else {
						for _, item := range v {
							if m, ok := item.(map[string]interface{}); ok {
								applyHydratedNodes(m, nodeMap)
							}
						}
					}
				}
			}
		}
	}
}
