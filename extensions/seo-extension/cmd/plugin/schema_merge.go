package main

import (
	"encoding/json"
	"strings"
)

// schema_merge.go — folds theme-provided structured data into the graph.
//
// The kernel forwards what the active theme's structured-data templates
// produced (node.structured_data: schema/<node_type>.json plus each
// block's schema.json) as a list of schema.org objects. Themes write
// page-relative ids, which are resolved here:
//
//	"#primary"        → <page url>#primary
//	"/#organization"  → <site url>/#organization
//	"/experiences/x"  → <site url>/experiences/x   (also for url/image/item/… values)
//
// An object whose @id matches a node already in the graph is merged into
// it: its properties win, @type values are unioned (WebPage + FAQPage),
// and two arrays are concatenated without duplicates. Anything else is
// appended as a new node.

// schemaURLKeys are properties whose root-relative string values are
// made absolute.
var schemaURLKeys = map[string]bool{
	"url": true, "image": true, "item": true, "logo": true, "contentUrl": true,
	"thumbnailUrl": true, "sameAs": true, "hasMap": true, "photo": true,
	"mainEntityOfPage": true, "embedUrl": true, "target": true,
}

func schemaMergeFragments(graph []any, fragments []any, siteURL, pageURL string) []any {
	if len(fragments) == 0 {
		return graph
	}
	index := map[string]map[string]any{}
	for _, n := range graph {
		if m, ok := n.(map[string]any); ok {
			if id, _ := m["@id"].(string); id != "" {
				index[id] = m
			}
		}
	}
	for _, f := range fragments {
		m, ok := schemaResolve(f, "", siteURL, pageURL).(map[string]any)
		if !ok {
			continue
		}
		delete(m, "@context")
		id, _ := m["@id"].(string)
		if id != "" {
			if dst, exists := index[id]; exists {
				schemaMergeNode(dst, m)
				continue
			}
		}
		if m["@type"] == nil {
			continue // an untyped, unknown id is a dangling patch — drop it
		}
		graph = append(graph, m)
		if id != "" {
			index[id] = m
		}
	}
	return graph
}

func schemaMergeNode(dst, src map[string]any) {
	for k, v := range src {
		switch k {
		case "@id":
			continue
		case "@type":
			dst[k] = schemaUnionTypes(dst[k], v)
			continue
		}
		if da, ok := dst[k].([]any); ok {
			if sa, ok := v.([]any); ok {
				dst[k] = schemaConcatUnique(da, sa)
				continue
			}
		}
		dst[k] = v
	}
}

func schemaUnionTypes(a, b any) any {
	var out []any
	seen := map[string]bool{}
	add := func(v any) {
		switch x := v.(type) {
		case string:
			if x != "" && !seen[x] {
				seen[x] = true
				out = append(out, x)
			}
		case []any:
			for _, y := range x {
				if s, ok := y.(string); ok && s != "" && !seen[s] {
					seen[s] = true
					out = append(out, s)
				}
			}
		}
	}
	add(a)
	add(b)
	if len(out) == 1 {
		return out[0]
	}
	return out
}

func schemaConcatUnique(a, b []any) []any {
	out := make([]any, 0, len(a)+len(b))
	seen := map[string]bool{}
	for _, v := range append(append([]any{}, a...), b...) {
		key, _ := json.Marshal(v)
		if seen[string(key)] {
			continue
		}
		seen[string(key)] = true
		out = append(out, v)
	}
	return out
}

// schemaResolve returns a deep copy of v with relative ids and URLs made
// absolute. key is the property name v was found under.
func schemaResolve(v any, key, siteURL, pageURL string) any {
	switch x := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(x))
		for k, val := range x {
			out[k] = schemaResolve(val, k, siteURL, pageURL)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, val := range x {
			out[i] = schemaResolve(val, key, siteURL, pageURL)
		}
		return out
	case string:
		if key == "@id" {
			switch {
			case strings.HasPrefix(x, "#"):
				return pageURL + x
			case strings.HasPrefix(x, "/") && !strings.HasPrefix(x, "//"):
				return siteURL + x
			}
			return x
		}
		if schemaURLKeys[key] && strings.HasPrefix(x, "/") && !strings.HasPrefix(x, "//") {
			return siteURL + x
		}
		return x
	default:
		return v
	}
}
