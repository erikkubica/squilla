package cms

import (
	"encoding/json"
	"strings"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// Templates are portable between sites, so they cannot carry node IDs.
// A relation value is written as {"$ref": "<node_type>/<slug>"} instead
// (the same notation theme seeds use) and resolved here, when the
// template is read for the editor, into the shape the node pickers store:
// {"id", "node_type", "slug", "title"}. A reference that matches no node
// on this site becomes null, so the field is simply left empty.

// ResolveNodeRefsInJSON rewrites every {"$ref": "type/slug"} object in raw.
func ResolveNodeRefsInJSON(db *gorm.DB, raw []byte) []byte {
	if db == nil {
		return raw
	}
	cache := map[string]interface{}{}
	return resolveNodeRefsWith(raw, func(ref string) interface{} { return lookupNodeRef(db, ref, cache) })
}

// resolveNodeRefsWith does the rewrite with any lookup (tests use a fake).
func resolveNodeRefsWith(raw []byte, lookup func(ref string) interface{}) []byte {
	if len(raw) == 0 || !strings.Contains(string(raw), `"$ref"`) {
		return raw
	}
	var v interface{}
	if err := json.Unmarshal(raw, &v); err != nil {
		return raw
	}
	v = resolveNodeRefs(v, lookup)
	out, err := json.Marshal(v)
	if err != nil {
		return raw
	}
	return out
}

func resolveNodeRefs(v interface{}, lookup func(string) interface{}) interface{} {
	switch t := v.(type) {
	case map[string]interface{}:
		if ref, ok := t["$ref"].(string); ok && len(t) == 1 {
			return lookup(ref)
		}
		for k, x := range t {
			t[k] = resolveNodeRefs(x, lookup)
		}
		return t
	case []interface{}:
		out := t[:0]
		for _, x := range t {
			r := resolveNodeRefs(x, lookup)
			// Drop unresolved entries from lists so pickers don't show blanks.
			if r == nil {
				if m, ok := x.(map[string]interface{}); ok && len(m) == 1 && m["$ref"] != nil {
					continue
				}
			}
			out = append(out, r)
		}
		return out
	default:
		return v
	}
}

func lookupNodeRef(db *gorm.DB, ref string, cache map[string]interface{}) interface{} {
	if r, ok := cache[ref]; ok {
		return r
	}
	nodeType, slug, ok := strings.Cut(ref, "/")
	if !ok || nodeType == "" || slug == "" {
		cache[ref] = nil
		return nil
	}
	var n models.ContentNode
	err := db.Where("node_type = ? AND slug = ?", nodeType, slug).
		Order("CASE WHEN status = 'published' THEN 0 ELSE 1 END, id").
		First(&n).Error
	if err != nil {
		cache[ref] = nil
		return nil
	}
	r := map[string]interface{}{"id": n.ID, "node_type": n.NodeType, "slug": n.Slug, "title": n.Title}
	cache[ref] = r
	return r
}
