package cms

import (
	"strings"
	"testing"

	"squilla/internal/models"
)

func barUser(caps string) *models.User {
	name := `Eve <script>alert(1)</script>`
	return &models.User{ID: 7, Email: "eve@example.com", FullName: &name, Role: models.Role{Slug: "x", Capabilities: models.JSONB(caps)}}
}

const adminCaps = `{"admin_access":true,"*":true,"default_node_access":{"access":"write","scope":"all"}}`

func TestInjectAfterBodyTag(t *testing.T) {
	cases := map[string]struct{ in, want string }{
		"plain":      {`<html><body><p>x</p></body></html>`, `<html><body>BAR<p>x</p></body></html>`},
		"attributes": {`<html><BODY class="a" data-x='>'><p>x</p>`, `<html><BODY class="a" data-x='>'>BAR<p>x</p>`},
		"attrs":      {`<head></head><body class="home page" id=top>`, `<head></head><body class="home page" id=top>BAR`},
		"no body":    {`<p>fragment</p>`, `<p>fragment</p>`},
		"not body":   {`<bodyx><body>`, `<bodyx><body>BAR`},
	}
	for name, tc := range cases {
		if got := injectAfterBodyTag(tc.in, "BAR"); got != tc.want {
			t.Errorf("%s: got %q want %q", name, got, tc.want)
		}
	}
}

func TestAdminBarAllowed(t *testing.T) {
	if adminBarAllowed(nil, "") {
		t.Error("anonymous visitor must not get the bar")
	}
	if adminBarAllowed(barUser(`{"*":true}`), "") {
		t.Error("'*' must not grant admin_access")
	}
	if !adminBarAllowed(barUser(adminCaps), "") {
		t.Error("admin should get the bar")
	}
	if adminBarAllowed(barUser(adminCaps), "1") {
		t.Error("hide cookie must suppress the bar")
	}
}

func TestWithAdminBarAnonymousUnchanged(t *testing.T) {
	h := &PublicHandler{}
	html := `<html><body><p>x</p></body></html>`
	// user == nil short-circuits before the fiber ctx is touched.
	if got := h.withAdminBarFor(html, nil, nil, false, "", nil); got != html {
		t.Fatalf("anonymous page changed: %q", got)
	}
}

func TestBuildAdminBarViewCapabilities(t *testing.T) {
	types := []models.NodeType{
		{Slug: "page", Label: "Page", Public: true},
		{Slug: "tour", Label: `Tour "<b>"`, Public: true},
		{Slug: "faq", Label: "FAQ", Public: false},
	}
	authorID := 99
	node := &models.ContentNode{ID: 12, NodeType: "tour", AuthorID: &authorID}
	archive := &termArchive{NodeType: "tour", Taxonomy: "region", Term: "north", TermID: 5, TermName: "North & <Hills>"}

	v := buildAdminBarView(barUser(adminCaps), node, false, archive, types)
	if len(v.Edit) != 2 || v.Edit[0].URL != "/admin/content/tour/12/edit" || v.Edit[1].URL != "/admin/content/tour/taxonomies/region/5/edit" {
		t.Fatalf("edit links: %+v", v.Edit)
	}
	if len(v.New) != 2 || v.New[0].URL != "/admin/pages/new" || v.New[1].URL != "/admin/content/tour/new" {
		t.Fatalf("new links (non-public types excluded): %+v", v.New)
	}
	if !v.ClearCache || v.ProfileURL != "/admin/profile" {
		t.Fatalf("clear=%v profile=%q", v.ClearCache, v.ProfileURL)
	}

	if v404 := buildAdminBarView(barUser(adminCaps), nil, true, nil, types); len(v404.Edit) != 0 {
		t.Fatalf("404 must have no edit link: %+v", v404.Edit)
	}

	// Write access scoped to own nodes, not the author → no edit link;
	// read-only types are missing from New; no manage_* capabilities.
	limited := barUser(`{"admin_access":true,"default_node_access":{"access":"write","scope":"own"},"nodes":{"page":{"access":"read","scope":"all"}}}`)
	lv := buildAdminBarView(limited, node, false, nil, types)
	if len(lv.Edit) != 0 {
		t.Fatalf("own-scope user must not edit someone else's node: %+v", lv.Edit)
	}
	if len(lv.New) != 1 || lv.New[0].Label != `Tour "<b>"` {
		t.Fatalf("new for limited user: %+v", lv.New)
	}
	if lv.ClearCache || lv.ProfileURL != "/admin/profile" {
		t.Fatalf("limited user got clear=%v profile=%q", lv.ClearCache, lv.ProfileURL)
	}
}

func TestRenderAdminBarEscapes(t *testing.T) {
	types := []models.NodeType{{Slug: "tour", Label: `Tour "<b>"`, Public: true}}
	node := &models.ContentNode{ID: 3, NodeType: "tour"}
	archive := &termArchive{NodeType: "tour", Taxonomy: "region", Term: "n", TermID: 5, TermName: "North & <Hills>"}
	out := renderAdminBar(buildAdminBarView(barUser(adminCaps), node, false, archive, types))

	for _, bad := range []string{"<script>alert(1)", "<b>", "<Hills>"} {
		if strings.Contains(out, bad) {
			t.Errorf("unescaped %q in bar", bad)
		}
	}
	for _, want := range []string{
		"Eve &lt;script&gt;alert(1)&lt;/script&gt;",
		"Edit Tour &#34;&lt;b&gt;&#34;",
		"Edit North &amp; &lt;Hills&gt;",
		`<template shadowrootmode="open">`,
		`href="/admin/content/tour/3/edit"`,
		`data-act="clear"`,
		"squilla:adminbar-ready",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("bar missing %q", want)
		}
	}
	if strings.Count(out, "<script>") != 1 {
		t.Errorf("expected exactly the one constant script tag")
	}
}
