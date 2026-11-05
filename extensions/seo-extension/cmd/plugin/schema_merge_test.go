package main

import (
	"encoding/json"
	"testing"
)

func TestSchemaMergeFragments(t *testing.T) {
	node := schemaTestPostNode()
	node["structured_data"] = []any{
		// Upgrades the built-in WebPage and adds questions.
		map[string]any{"@id": "#webpage", "@type": "FAQPage", "mainEntity": []any{
			map[string]any{"@type": "Question", "name": "Q1"},
		}},
		// A second block adds more questions to the same page.
		map[string]any{"@id": "#webpage", "mainEntity": []any{
			map[string]any{"@type": "Question", "name": "Q1"},
			map[string]any{"@type": "Question", "name": "Q2"},
		}},
		// Theme replaces the built-in author fallback.
		map[string]any{"@id": "#primary", "author": []any{map[string]any{"@id": "/#host-linh"}}},
		// New node with site-relative id and URL.
		map[string]any{"@id": "/#host-linh", "@type": "Person", "name": "Linh", "image": "/media/linh.jpg"},
		// Untyped patch for an unknown id is dropped.
		map[string]any{"@id": "#nothing", "name": "x"},
	}
	doc := schemaTestExtract(t, schemaBuildGraph(node, nil, schemaTestSettings()))
	page := schemaTestSite + "/journal/best-pho"
	byID := map[string]map[string]any{}
	for _, n := range doc["@graph"].([]any) {
		m := n.(map[string]any)
		byID[m["@id"].(string)] = m
	}

	wp := byID[page+"#webpage"]
	types, _ := json.Marshal(wp["@type"])
	if string(types) != `["WebPage","FAQPage"]` {
		t.Errorf("webpage @type = %s", types)
	}
	if n := len(wp["mainEntity"].([]any)); n != 2 {
		t.Errorf("want 2 deduplicated questions, got %d", n)
	}
	author := byID[page+"#primary"]["author"].([]any)[0].(map[string]any)
	if author["@id"] != schemaTestSite+"/#host-linh" {
		t.Errorf("author not resolved: %v", author)
	}
	linh := byID[schemaTestSite+"/#host-linh"]
	if linh == nil || linh["image"] != schemaTestSite+"/media/linh.jpg" {
		t.Errorf("host node missing or image not absolute: %v", linh)
	}
	if _, ok := byID[page+"#nothing"]; ok {
		t.Error("untyped unknown patch should be dropped")
	}
}
