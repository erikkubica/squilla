package main

// schema.go — phase 1 of the schema.org @graph for render.head.
//
// Emits one <script type="application/ld+json"> per public page with
// Organization, WebSite, WebPage, BreadcrumbList (non-home) and a
// BlogPosting for post nodes. Entities are linked by stable @ids:
//   {site}/#organization, {site}/#website, {url}#webpage,
//   {url}#breadcrumb, {url}#primary.
// Site-wide facts come from the site.schema settings; per-page facts
// from the node payload. Empty values are pruned so no property is ever
// "" or null.

import (
	"encoding/json"
	"fmt"
	"math"
	"net/url"
	"strconv"
	"strings"
	"unicode/utf8"
)

const (
	schemaContext        = "https://schema.org"
	schemaDefaultOrgType = "Organization"
)

// schemaBuildGraph returns either "" or exactly one JSON-LD script block.
func schemaBuildGraph(node map[string]any, seo map[string]any, settings map[string]string) string {
	if node == nil {
		return ""
	}
	id := schemaNodeID(node["id"])
	if id == "" {
		return ""
	}
	if settings == nil {
		settings = map[string]string{}
	}
	if schemaDisabled(seo, settings) {
		return ""
	}
	siteURL := strings.TrimRight(strings.TrimSpace(settings["site_url"]), "/")
	if siteURL == "" {
		// Relative @ids would be meaningless to crawlers; emit nothing.
		return ""
	}

	homeID := strings.TrimSpace(settings["homepage_node_id"])
	isHome := homeID != "" && id == homeID

	pageURL := siteURL + "/"
	if !isHome {
		pageURL = absoluteURL(siteURL, pickString(node, "full_url"))
	}
	if pageURL == "" {
		return ""
	}

	orgID := siteURL + "/#organization"
	websiteID := siteURL + "/#website"
	webpageID := pageURL + "#webpage"
	breadcrumbID := pageURL + "#breadcrumb"

	imageURL := schemaImageURL(node, siteURL)
	lang := pickString(node, "language_code")
	title := pickString(node, "title")
	desc := schemaFirst(pickString(seo, "meta_description"), pickString(node, "excerpt"))

	var crumbs []any
	if !isHome {
		crumbs = schemaCrumbItems(siteURL, pageURL, title, lang)
	}
	hasBreadcrumb := len(crumbs) > 0

	graph := []any{
		schemaOrganization(settings, siteURL, orgID),
		map[string]any{
			"@type":      "WebSite",
			"@id":        websiteID,
			"url":        siteURL,
			"name":       schemaFirst(settings["seo_og_site_name"], settings["site_name"]),
			"inLanguage": lang,
			"publisher":  map[string]any{"@id": orgID},
		},
		schemaWebPage(node, seo, pageURL, webpageID, websiteID, orgID, breadcrumbID, imageURL, isHome, hasBreadcrumb),
	}
	if hasBreadcrumb {
		graph = append(graph, map[string]any{
			"@type":           "BreadcrumbList",
			"@id":             breadcrumbID,
			"itemListElement": crumbs,
		})
	}
	if pickString(node, "node_type") == "post" {
		graph = append(graph, schemaBlogPosting(node, pageURL, webpageID, orgID, imageURL, title, desc, lang))
	}

	if frags, ok := node["structured_data"].([]any); ok {
		graph = schemaMergeFragments(graph, frags, siteURL, pageURL)
	}

	body, err := json.Marshal(struct {
		Context string `json:"@context"`
		Graph   any    `json:"@graph"`
	}{Context: schemaContext, Graph: schemaPrune(graph)})
	if err != nil {
		return ""
	}
	// json.Marshal already escapes < > & inside strings; the replace keeps
	// the guarantee explicit so content can never close the script tag.
	safe := strings.ReplaceAll(string(body), "</", `<\/`)
	return `<script type="application/ld+json">` + safe + `</script>` + "\n"
}

// schemaDisabled reports whether the whole graph should be suppressed.
// The indexing switch (seo_robots_index) deliberately does not: noindex
// already keeps the page out of search, and emitting the graph lets
// staging sites be checked with rich-result tools before launch. 404s
// are skipped because the kernel's synthetic 404 node has no id.
func schemaDisabled(seo map[string]any, settings map[string]string) bool {
	if strings.TrimSpace(settings["schema_enabled"]) == "false" {
		return true
	}
	switch v := seo["schema_disabled"].(type) {
	case bool:
		return v
	case string:
		return strings.TrimSpace(v) == "true"
	}
	return false
}

func schemaOrganization(settings map[string]string, siteURL, orgID string) map[string]any {
	orgType := schemaOrgType(settings["schema_org_type"])
	org := map[string]any{
		"@type":       orgType,
		"@id":         orgID,
		"url":         siteURL,
		"name":        schemaFirst(settings["schema_org_name"], settings["seo_og_site_name"], settings["site_name"]),
		"description": schemaFirst(settings["schema_org_description"], settings["site_description"]),
		"telephone":   strings.TrimSpace(settings["schema_org_phone"]),
		"email":       strings.TrimSpace(settings["schema_org_email"]),
		"sameAs":      schemaLines(settings["schema_org_same_as"]),
	}
	logo := absoluteURL(siteURL, strings.TrimSpace(settings["schema_org_logo"]))
	if orgType == "Person" {
		// Person has no logo/areaServed/address/priceRange/geo; the
		// logo field doubles as the person's photo.
		if logo != "" {
			org["image"] = map[string]any{"@type": "ImageObject", "url": logo}
		}
	} else {
		if logo != "" {
			org["logo"] = map[string]any{"@type": "ImageObject", "url": logo}
		}
		org["areaServed"] = strings.TrimSpace(settings["schema_org_area_served"])
		org["priceRange"] = strings.TrimSpace(settings["schema_org_price_range"])
		if addr := schemaPostalAddress(settings); addr != nil {
			org["address"] = addr
		}
		if geo := schemaGeo(settings); geo != nil {
			org["geo"] = geo
		}
	}
	return org
}

// schemaOrgType accepts a schema.org type name (letters only). Anything
// else, including blank, falls back to Organization.
func schemaOrgType(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return schemaDefaultOrgType
	}
	for _, r := range v {
		if !(r >= 'A' && r <= 'Z' || r >= 'a' && r <= 'z') {
			return schemaDefaultOrgType
		}
	}
	return v
}

func schemaPostalAddress(settings map[string]string) map[string]any {
	fields := map[string]any{}
	for key, field := range map[string]string{
		"schema_org_street":      "streetAddress",
		"schema_org_locality":    "addressLocality",
		"schema_org_region":      "addressRegion",
		"schema_org_postal_code": "postalCode",
		"schema_org_country":     "addressCountry",
	} {
		if v := strings.TrimSpace(settings[key]); v != "" {
			fields[field] = v
		}
	}
	if len(fields) == 0 {
		return nil
	}
	fields["@type"] = "PostalAddress"
	return fields
}

func schemaGeo(settings map[string]string) map[string]any {
	lat, errLat := strconv.ParseFloat(strings.TrimSpace(settings["schema_org_lat"]), 64)
	lng, errLng := strconv.ParseFloat(strings.TrimSpace(settings["schema_org_lng"]), 64)
	if errLat != nil || errLng != nil {
		return nil
	}
	// Written as "in range" so NaN (which ParseFloat accepts) is rejected.
	if !(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180) || math.IsInf(lat, 0) || math.IsInf(lng, 0) {
		return nil
	}
	return map[string]any{"@type": "GeoCoordinates", "latitude": lat, "longitude": lng}
}

func schemaWebPage(
	node, seo map[string]any,
	pageURL, webpageID, websiteID, orgID, breadcrumbID, imageURL string,
	isHome, hasBreadcrumb bool,
) map[string]any {
	wp := map[string]any{
		"@type":         "WebPage",
		"@id":           webpageID,
		"url":           pageURL,
		"name":          schemaFirst(pickString(seo, "meta_title"), pickString(node, "title")),
		"description":   schemaFirst(pickString(seo, "meta_description"), pickString(node, "excerpt")),
		"isPartOf":      map[string]any{"@id": websiteID},
		"inLanguage":    pickString(node, "language_code"),
		"datePublished": pickString(node, "published_at"),
		"dateModified":  pickString(node, "updated_at"),
	}
	if imageURL != "" {
		wp["primaryImageOfPage"] = map[string]any{"@type": "ImageObject", "url": imageURL}
	}
	if isHome {
		wp["about"] = map[string]any{"@id": orgID}
	} else if hasBreadcrumb {
		wp["breadcrumb"] = map[string]any{"@id": breadcrumbID}
	}
	return wp
}

func schemaBlogPosting(
	node map[string]any,
	pageURL, webpageID, orgID, imageURL, title, desc, lang string,
) map[string]any {
	var author any = map[string]any{"@id": orgID}
	if a, ok := node["author"].(map[string]any); ok {
		if name := pickString(a, "name"); name != "" {
			author = map[string]any{"@type": "Person", "name": name}
		}
	}
	bp := map[string]any{
		"@type":            "BlogPosting",
		"@id":              pageURL + "#primary",
		"headline":         title,
		"description":      desc,
		"datePublished":    pickString(node, "published_at"),
		"dateModified":     pickString(node, "updated_at"),
		"author":           author,
		"publisher":        map[string]any{"@id": orgID},
		"mainEntityOfPage": map[string]any{"@id": webpageID},
		"inLanguage":       lang,
	}
	if imageURL != "" {
		bp["image"] = map[string]any{"@type": "ImageObject", "url": imageURL}
	}
	return bp
}

// schemaCrumbItems builds the ListItems for a non-home page from the
// path segments of pageURL. Returns nil when there are no segments.
func schemaCrumbItems(siteURL, pageURL, title, lang string) []any {
	pu, err := url.Parse(pageURL)
	if err != nil {
		return nil
	}
	rel := strings.Trim(pu.Path, "/")
	if su, err := url.Parse(siteURL); err == nil {
		if base := strings.Trim(su.Path, "/"); base != "" {
			rel = strings.Trim(strings.TrimPrefix(rel, base), "/")
		}
	}
	var segs []string
	for _, s := range strings.Split(rel, "/") {
		if s != "" {
			segs = append(segs, s)
		}
	}
	// A leading language prefix (/vi/...) is part of every URL in that
	// language, not a crumb of its own.
	prefix := ""
	if lang != "" && len(segs) > 1 && strings.EqualFold(segs[0], lang) {
		prefix = "/" + segs[0]
		segs = segs[1:]
	}
	if len(segs) == 0 {
		return nil
	}

	items := []any{
		map[string]any{"@type": "ListItem", "position": 1, "name": "Home", "item": siteURL + prefix + "/"},
	}
	for i, seg := range segs {
		name := schemaHumanize(seg)
		itemURL := siteURL + prefix + "/" + strings.Join(segs[:i+1], "/")
		if i == len(segs)-1 {
			name = schemaFirst(title, name)
			itemURL = pageURL
		}
		items = append(items, map[string]any{
			"@type":    "ListItem",
			"position": i + 2,
			"name":     name,
			"item":     itemURL,
		})
	}
	return items
}

// schemaHumanize turns "best-street-food" into "Best street food".
func schemaHumanize(seg string) string {
	s := strings.TrimSpace(strings.ReplaceAll(seg, "-", " "))
	if s == "" {
		return s
	}
	r, size := utf8.DecodeRuneInString(s)
	return strings.ToUpper(string(r)) + s[size:]
}

func schemaImageURL(node map[string]any, siteURL string) string {
	if img := imageFrom(node["featured_image"]); img.URL != "" {
		return absoluteURL(siteURL, img.URL)
	}
	return absoluteURL(siteURL, imageFrom(node["featured_image_url"]).URL)
}

// schemaNodeID renders a node id the same way regardless of whether it
// arrived as a JSON number (float64) or a string.
func schemaNodeID(v any) string {
	switch x := v.(type) {
	case nil:
		return ""
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	case string:
		return strings.TrimSpace(x)
	default:
		return fmt.Sprint(x)
	}
}

// schemaFirst returns the first value that is non-blank after trimming.
func schemaFirst(vals ...string) string {
	for _, v := range vals {
		if t := strings.TrimSpace(v); t != "" {
			return t
		}
	}
	return ""
}

// schemaLines splits a textarea into trimmed, non-empty entries.
func schemaLines(s string) []any {
	var out []any
	for _, line := range splitLines(s) {
		out = append(out, line)
	}
	return out
}

// schemaPrune recursively drops empty strings, nil, empty maps and empty
// slices so no property is ever "" or null. Returns the pruned value.
func schemaPrune(v any) any {
	out, _ := schemaPruneValue(v)
	return out
}

func schemaPruneValue(v any) (any, bool) {
	switch x := v.(type) {
	case nil:
		return nil, false
	case string:
		if strings.TrimSpace(x) == "" {
			return nil, false
		}
		return x, true
	case map[string]any:
		m := make(map[string]any, len(x))
		for k, val := range x {
			if pv, ok := schemaPruneValue(val); ok {
				m[k] = pv
			}
		}
		if len(m) == 0 {
			return nil, false
		}
		return m, true
	case []any:
		s := make([]any, 0, len(x))
		for _, val := range x {
			if pv, ok := schemaPruneValue(val); ok {
				s = append(s, pv)
			}
		}
		if len(s) == 0 {
			return nil, false
		}
		return s, true
	default:
		return x, true
	}
}
