package main

import (
	"encoding/json"
	"strings"
	"testing"
)

const schemaTestSite = "https://beyondvietnam.example"

func schemaTestSettings() map[string]string {
	return map[string]string{
		"site_url":               schemaTestSite,
		"site_name":              "Beyond Vietnam",
		"site_description":       "Hanoi food and culture tours",
		"homepage_node_id":       "1",
		"schema_org_type":        "TravelAgency",
		"schema_org_name":        "Beyond Vietnam Tours",
		"schema_org_logo":        "/media/logo.png",
		"schema_org_same_as":     "https://instagram.com/beyondvietnam\n\nhttps://facebook.com/beyondvietnam\n",
		"schema_org_phone":       "+84 000 000",
		"schema_org_email":       "hello@beyondvietnam.example",
		"schema_org_street":      "1 Hang Bac",
		"schema_org_locality":    "Hanoi",
		"schema_org_region":      "Hoan Kiem",
		"schema_org_postal_code": "100000",
		"schema_org_country":     "VN",
		"schema_org_lat":         "21.0285",
		"schema_org_lng":         "105.8542",
		"schema_org_price_range": "$$",
		"schema_org_area_served": "Hanoi",
		"seo_robots_index":       "true",
		"language_code":          "en",
	}
}

func schemaTestPostNode() map[string]any {
	return map[string]any{
		"id":             float64(42),
		"title":          "Best Pho in Hanoi",
		"slug":           "best-pho",
		"full_url":       "/journal/best-pho",
		"excerpt":        "Where locals eat pho at dawn.",
		"language_code":  "en",
		"node_type":      "post",
		"published_at":   "2026-01-10T08:00:00Z",
		"updated_at":     "2026-02-01T09:30:00Z",
		"featured_image": map[string]any{"url": "/media/pho.jpg"},
		"author":         map[string]any{"name": "Erik Kubica"},
	}
}

func schemaTestHomeNode() map[string]any {
	return map[string]any{
		"id":            float64(1),
		"title":         "Home",
		"full_url":      "/",
		"language_code": "en",
		"node_type":     "page",
	}
}

// schemaTestExtract strips the script wrapper and decodes the JSON-LD body.
func schemaTestExtract(t *testing.T, out string) map[string]any {
	t.Helper()
	const open = `<script type="application/ld+json">`
	const close = `</script>`
	if !strings.HasPrefix(out, open) {
		t.Fatalf("output does not start with the ld+json script tag: %q", out)
	}
	body := strings.TrimSuffix(strings.TrimPrefix(strings.TrimSpace(out), open), close)
	var doc map[string]any
	if err := json.Unmarshal([]byte(body), &doc); err != nil {
		t.Fatalf("script body is not valid JSON: %v\n%s", err, body)
	}
	if doc["@context"] != "https://schema.org" {
		t.Errorf("@context = %v", doc["@context"])
	}
	if _, ok := doc["@graph"].([]any); !ok {
		t.Fatalf("@graph missing or not an array: %v", doc["@graph"])
	}
	return doc
}

func schemaTestFindType(t *testing.T, doc map[string]any, typ string) map[string]any {
	t.Helper()
	for _, n := range doc["@graph"].([]any) {
		m := n.(map[string]any)
		if m["@type"] == typ {
			return m
		}
	}
	return nil
}

// schemaTestWalkRefs calls fn for every bare {"@id": ...} reference.
func schemaTestWalkRefs(v any, fn func(string)) {
	switch x := v.(type) {
	case map[string]any:
		if id, ok := x["@id"].(string); ok && len(x) == 1 {
			fn(id)
			return
		}
		for _, val := range x {
			schemaTestWalkRefs(val, fn)
		}
	case []any:
		for _, val := range x {
			schemaTestWalkRefs(val, fn)
		}
	}
}

// schemaTestNoEmpty fails if any "" or nil value appears anywhere.
func schemaTestNoEmpty(t *testing.T, v any, path string) {
	t.Helper()
	switch x := v.(type) {
	case nil:
		t.Errorf("null at %s", path)
	case string:
		if x == "" {
			t.Errorf("empty string at %s", path)
		}
	case map[string]any:
		for k, val := range x {
			schemaTestNoEmpty(t, val, path+"."+k)
		}
	case []any:
		for _, val := range x {
			schemaTestNoEmpty(t, val, path+"[]")
		}
	}
}

func TestSchemaValidJSONAndReferences(t *testing.T) {
	cases := []struct {
		name     string
		node     map[string]any
		settings map[string]string
	}{
		{"post", schemaTestPostNode(), schemaTestSettings()},
		{"homepage", schemaTestHomeNode(), schemaTestSettings()},
		{"nested page", map[string]any{"id": "a-7", "title": "Tour", "full_url": "/experiences/hanoi-food-tour/", "language_code": "en"}, schemaTestSettings()},
		{"minimal settings", schemaTestPostNode(), map[string]string{"site_url": schemaTestSite}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			out := schemaBuildGraph(tc.node, nil, tc.settings)
			if out == "" {
				t.Fatal("expected a graph")
			}
			doc := schemaTestExtract(t, out)
			declared := map[string]bool{}
			for _, n := range doc["@graph"].([]any) {
				if id, ok := n.(map[string]any)["@id"].(string); ok {
					declared[id] = true
				}
			}
			schemaTestWalkRefs(doc["@graph"], func(id string) {
				if !declared[id] {
					t.Errorf("dangling @id reference %q", id)
				}
			})
		})
	}
}

func TestSchemaHomepageHasNoBreadcrumb(t *testing.T) {
	doc := schemaTestExtract(t, schemaBuildGraph(schemaTestHomeNode(), nil, schemaTestSettings()))
	if schemaTestFindType(t, doc, "BreadcrumbList") != nil {
		t.Error("homepage must not emit BreadcrumbList")
	}
	wp := schemaTestFindType(t, doc, "WebPage")
	if _, ok := wp["breadcrumb"]; ok {
		t.Error("homepage WebPage must not reference a breadcrumb")
	}
	if wp["url"] != schemaTestSite+"/" {
		t.Errorf("homepage url = %v", wp["url"])
	}
	if _, ok := wp["about"]; !ok {
		t.Error("homepage WebPage should be about the organization")
	}
}

func TestSchemaBreadcrumbPath(t *testing.T) {
	node := map[string]any{"id": float64(9), "title": "Hanoi Food Tour", "full_url": "/experiences/hanoi-food-tour", "language_code": "en"}
	doc := schemaTestExtract(t, schemaBuildGraph(node, nil, schemaTestSettings()))
	bc := schemaTestFindType(t, doc, "BreadcrumbList")
	if bc == nil {
		t.Fatal("expected BreadcrumbList")
	}
	items := bc["itemListElement"].([]any)
	if len(items) != 3 {
		t.Fatalf("want 3 items, got %d", len(items))
	}
	wantNames := []string{"Home", "Experiences", "Hanoi Food Tour"}
	for i, it := range items {
		m := it.(map[string]any)
		if int(m["position"].(float64)) != i+1 {
			t.Errorf("item %d position = %v", i, m["position"])
		}
		if m["name"] != wantNames[i] {
			t.Errorf("item %d name = %v, want %s", i, m["name"], wantNames[i])
		}
	}
	if items[2].(map[string]any)["item"] != schemaTestSite+"/experiences/hanoi-food-tour" {
		t.Errorf("last item url = %v", items[2].(map[string]any)["item"])
	}
}

func TestSchemaPostGetsBlogPosting(t *testing.T) {
	cases := []struct {
		name       string
		author     any
		wantAuthor map[string]any
	}{
		{"author name", map[string]any{"name": "Erik Kubica"}, map[string]any{"@type": "Person", "name": "Erik Kubica"}},
		{"no author falls back to org", nil, map[string]any{"@id": schemaTestSite + "/#organization"}},
		{"blank author name falls back to org", map[string]any{"name": "  "}, map[string]any{"@id": schemaTestSite + "/#organization"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			node := schemaTestPostNode()
			if tc.author == nil {
				delete(node, "author")
			} else {
				node["author"] = tc.author
			}
			doc := schemaTestExtract(t, schemaBuildGraph(node, nil, schemaTestSettings()))
			bp := schemaTestFindType(t, doc, "BlogPosting")
			if bp == nil {
				t.Fatal("expected BlogPosting for a post node")
			}
			got, _ := json.Marshal(bp["author"])
			want, _ := json.Marshal(tc.wantAuthor)
			if string(got) != string(want) {
				t.Errorf("author = %s, want %s", got, want)
			}
			if bp["mainEntityOfPage"].(map[string]any)["@id"] != schemaTestSite+"/journal/best-pho#webpage" {
				t.Errorf("mainEntityOfPage = %v", bp["mainEntityOfPage"])
			}
		})
	}
}

func TestSchemaNonPostHasNoBlogPosting(t *testing.T) {
	doc := schemaTestExtract(t, schemaBuildGraph(schemaTestHomeNode(), nil, schemaTestSettings()))
	if schemaTestFindType(t, doc, "BlogPosting") != nil {
		t.Error("non-post node must not emit BlogPosting")
	}
}

func TestSchemaOrganizationFields(t *testing.T) {
	doc := schemaTestExtract(t, schemaBuildGraph(schemaTestHomeNode(), nil, schemaTestSettings()))
	org := schemaTestFindType(t, doc, "TravelAgency")
	if org == nil {
		t.Fatal("expected TravelAgency organization")
	}
	if org["@id"] != schemaTestSite+"/#organization" || org["name"] != "Beyond Vietnam Tours" {
		t.Errorf("org id/name = %v / %v", org["@id"], org["name"])
	}
	if org["logo"].(map[string]any)["url"] != schemaTestSite+"/media/logo.png" {
		t.Errorf("logo = %v", org["logo"])
	}
	if sa := org["sameAs"].([]any); len(sa) != 2 {
		t.Errorf("sameAs = %v, want 2 urls", sa)
	}
	if org["address"].(map[string]any)["addressCountry"] != "VN" {
		t.Errorf("address = %v", org["address"])
	}
	if org["geo"].(map[string]any)["latitude"] != 21.0285 {
		t.Errorf("geo = %v", org["geo"])
	}
}

func TestSchemaPersonOmitsAddressAndPriceRange(t *testing.T) {
	s := schemaTestSettings()
	s["schema_org_type"] = "Person"
	doc := schemaTestExtract(t, schemaBuildGraph(schemaTestHomeNode(), nil, s))
	p := schemaTestFindType(t, doc, "Person")
	if p == nil {
		t.Fatal("expected Person")
	}
	for _, k := range []string{"address", "priceRange", "geo", "logo", "areaServed"} {
		if _, ok := p[k]; ok {
			t.Errorf("Person must not carry %s", k)
		}
	}
	if img, ok := p["image"].(map[string]any); !ok || img["url"] != schemaTestSite+"/media/logo.png" {
		t.Errorf("Person image = %v, want the logo URL", p["image"])
	}
}

func TestSchemaBreadcrumbSkipsLanguagePrefix(t *testing.T) {
	node := map[string]any{"id": float64(9), "title": "Phố ẩm thực", "full_url": "/vi/experiences/food", "language_code": "vi"}
	doc := schemaTestExtract(t, schemaBuildGraph(node, nil, schemaTestSettings()))
	items := schemaTestFindType(t, doc, "BreadcrumbList")["itemListElement"].([]any)
	if len(items) != 3 {
		t.Fatalf("want Home > Experiences > page, got %d items", len(items))
	}
	if got := items[0].(map[string]any)["item"]; got != schemaTestSite+"/vi/" {
		t.Errorf("home crumb = %v, want language home", got)
	}
	if got := items[1].(map[string]any)["item"]; got != schemaTestSite+"/vi/experiences" {
		t.Errorf("middle crumb = %v", got)
	}
}

func TestSchemaInvalidOrgTypeFallsBack(t *testing.T) {
	s := schemaTestSettings()
	s["schema_org_type"] = `Travel"><script>`
	doc := schemaTestExtract(t, schemaBuildGraph(schemaTestHomeNode(), nil, s))
	if schemaTestFindType(t, doc, "Organization") == nil {
		t.Error("invalid schema_org_type should fall back to Organization")
	}
}

func TestSchemaScriptTagIsEscaped(t *testing.T) {
	node := map[string]any{
		"id":            float64(5),
		"title":         "</script><script>alert(1)</script>",
		"full_url":      "/x</script>",
		"excerpt":       "</script>",
		"language_code": "en",
	}
	out := schemaBuildGraph(node, map[string]any{"meta_title": "</script>"}, schemaTestSettings())
	if out == "" {
		t.Fatal("expected graph")
	}
	if n := strings.Count(out, "</script>"); n != 1 {
		t.Errorf("found %d closing script tags, want exactly 1: %s", n, out)
	}
	schemaTestExtract(t, out)
}

func TestSchemaNoEmptyProperties(t *testing.T) {
	cases := []struct {
		name     string
		node     map[string]any
		seo      map[string]any
		settings map[string]string
	}{
		{"empty settings", map[string]any{"id": float64(7), "title": "", "full_url": "/a"}, map[string]any{"meta_title": ""}, map[string]string{"site_url": schemaTestSite}},
		{"blank site fields", schemaTestPostNode(), nil, map[string]string{"site_url": schemaTestSite, "schema_org_same_as": " \n ", "schema_org_lat": "abc", "schema_org_lng": "1"}},
		{"homepage bare", schemaTestHomeNode(), nil, map[string]string{"site_url": schemaTestSite, "homepage_node_id": "1"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			out := schemaBuildGraph(tc.node, tc.seo, tc.settings)
			if out == "" {
				t.Fatal("expected graph")
			}
			schemaTestNoEmpty(t, schemaTestExtract(t, out), "doc")
		})
	}
}

func TestSchemaDisabledReturnsEmpty(t *testing.T) {
	cases := []struct {
		name     string
		node     map[string]any
		seo      map[string]any
		settings map[string]string
	}{
		{"nil node", nil, nil, schemaTestSettings()},
		{"node without id", map[string]any{"title": "x", "full_url": "/x"}, nil, schemaTestSettings()},
		{"node with blank id", map[string]any{"id": "  ", "full_url": "/x"}, nil, schemaTestSettings()},
		{"schema toggle off", schemaTestPostNode(), nil, map[string]string{"site_url": schemaTestSite, "schema_enabled": "false"}},
		{"page seo disabled bool", schemaTestPostNode(), map[string]any{"schema_disabled": true}, schemaTestSettings()},
		{"page seo disabled string", schemaTestPostNode(), map[string]any{"schema_disabled": "true"}, schemaTestSettings()},
		{"no site_url", schemaTestPostNode(), nil, map[string]string{}},
		// Kernel 404 render: synthetic node without id, robots forced off.
		{"404 render", map[string]any{"title": "Page Not Found", "full_url": "/nope"}, nil, map[string]string{"site_url": schemaTestSite, "seo_robots_index": "false"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if out := schemaBuildGraph(tc.node, tc.seo, tc.settings); out != "" {
				t.Errorf("expected empty output, got %s", out)
			}
		})
	}
}

func TestSchemaEmittedWhenIndexingOff(t *testing.T) {
	s := schemaTestSettings()
	s["seo_robots_index"] = "false"
	if schemaBuildGraph(schemaTestPostNode(), nil, s) == "" {
		t.Fatal("staging (indexing off) must still get the graph so it can be tested")
	}
}

func TestSchemaEnabledWhenSEODisabledIsFalse(t *testing.T) {
	out := schemaBuildGraph(schemaTestPostNode(), map[string]any{"schema_disabled": false}, schemaTestSettings())
	if out == "" {
		t.Fatal("schema_disabled=false must not suppress the graph")
	}
}

// TestSchemaSampleGraph prints the graph for a sample post so a reviewer
// can read it: go test -run SampleGraph -v ./extensions/seo-extension/cmd/plugin/
func TestSchemaSampleGraph(t *testing.T) {
	out := schemaBuildGraph(schemaTestPostNode(), nil, schemaTestSettings())
	if testing.Verbose() {
		t.Log("\n" + out)
	}
}
