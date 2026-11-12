package sdui

import (
	"encoding/json"
	"strings"
	"testing"

	"squilla/internal/events"
	"squilla/internal/models"
	"squilla/internal/testutil"
)

// TestNodeListLayout_FiltersByNodeAccess: the SDUI node list used to be
// built without the caller, so an author (scope "own") saw every user's
// nodes and a role without read access saw the whole type.
func TestNodeListLayout_FiltersByNodeAccess(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.NodeType{}, &models.Taxonomy{}, &models.Language{}, &models.SiteSetting{}); err != nil {
		t.Fatal(err)
	}
	for _, q := range []string{
		`CREATE TABLE content_nodes (
			id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER, node_type TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'draft', language_code TEXT NOT NULL DEFAULT 'en',
			slug TEXT NOT NULL DEFAULT '', full_url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
			author_id INTEGER, taxonomies TEXT NOT NULL DEFAULT '{}',
			created_at DATETIME, updated_at DATETIME, deleted_at DATETIME)`,
		`INSERT INTO content_nodes (id, node_type, status, title, author_id) VALUES
			(1, 'post', 'published', 'Mine-Alpha', 1), (2, 'post', 'draft', 'Theirs-Beta', 2)`,
	} {
		if err := db.Exec(q).Error; err != nil {
			t.Fatal(err)
		}
	}
	db.Create(&models.NodeType{Slug: "post", Label: "Post", LabelPlural: "Posts", Fields: models.JSONB(`[]`), Taxonomies: models.JSONB(`[]`), URLPrefixes: models.JSONB(`{}`)})

	e := NewEngine(db, events.New())
	render := func(u *models.User) string {
		layout := e.nodeListLayout(map[string]string{"nodeType": "post"}, u)
		b, _ := json.Marshal(layout)
		return string(b)
	}

	author := userWithCaps(`{"admin_access":true,"default_node_access":{"access":"write","scope":"own"}}`)
	out := render(author)
	if !strings.Contains(out, "Mine-Alpha") || strings.Contains(out, "Theirs-Beta") {
		t.Fatalf("author list must contain only own nodes: %s", out)
	}

	editor := userWithCaps(`{"admin_access":true,"default_node_access":{"access":"write","scope":"all"}}`)
	out = render(editor)
	if !strings.Contains(out, "Mine-Alpha") || !strings.Contains(out, "Theirs-Beta") {
		t.Fatalf("editor list must contain all nodes: %s", out)
	}

	noAccess := userWithCaps(`{"admin_access":true,"default_node_access":{"access":"write","scope":"all"},"nodes":{"post":{"access":"none"}}}`)
	out = render(noAccess)
	if strings.Contains(out, "Mine-Alpha") || strings.Contains(out, "Theirs-Beta") {
		t.Fatalf("role without read access saw nodes: %s", out)
	}
}

// TestDashboardLayout_AppliesOwnScope: the dashboard's stat counts and
// recent-content / drafts lists honour per-type "own" scope, not just the
// readable-type set.
func TestDashboardLayout_AppliesOwnScope(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.NodeType{}, &models.User{}); err != nil {
		t.Fatal(err)
	}
	for _, q := range []string{
		`CREATE TABLE content_nodes (
			id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER, node_type TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'draft', language_code TEXT NOT NULL DEFAULT 'en',
			slug TEXT NOT NULL DEFAULT '', full_url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
			author_id INTEGER, taxonomies TEXT NOT NULL DEFAULT '{}',
			created_at DATETIME, updated_at DATETIME, deleted_at DATETIME)`,
		`INSERT INTO content_nodes (id, node_type, status, title, author_id, updated_at) VALUES
			(1, 'post', 'draft', 'Mine-Alpha', 1, CURRENT_TIMESTAMP),
			(2, 'post', 'draft', 'Theirs-Beta', 2, CURRENT_TIMESTAMP),
			(3, 'page', 'published', 'Shared-Page', 2, CURRENT_TIMESTAMP)`,
	} {
		if err := db.Exec(q).Error; err != nil {
			t.Fatal(err)
		}
	}
	for _, slug := range []string{"post", "page"} {
		db.Create(&models.NodeType{Slug: slug, Label: slug, LabelPlural: slug, Fields: models.JSONB(`[]`), Taxonomies: models.JSONB(`[]`), URLPrefixes: models.JSONB(`{}`)})
	}
	e := NewEngine(db, events.New())
	render := func(u *models.User) string {
		b, _ := json.Marshal(e.dashboardLayout("X", u))
		return string(b)
	}

	// Author: own scope everywhere.
	out := render(userWithCaps(`{"admin_access":true,"default_node_access":{"access":"write","scope":"own"}}`))
	if !strings.Contains(out, "Mine-Alpha") || strings.Contains(out, "Theirs-Beta") || strings.Contains(out, "Shared-Page") {
		t.Fatalf("author dashboard must list only own nodes: %s", out)
	}
	if !strings.Contains(out, `"label":"Total Content","value":"1"`) {
		t.Fatalf("author total must count only own nodes: %s", out)
	}

	// Own on posts only, all on everything else.
	out = render(userWithCaps(`{"admin_access":true,"default_node_access":{"access":"read","scope":"all"},"nodes":{"post":{"access":"write","scope":"own"}}}`))
	if !strings.Contains(out, "Mine-Alpha") || strings.Contains(out, "Theirs-Beta") || !strings.Contains(out, "Shared-Page") {
		t.Fatalf("per-type own scope not applied: %s", out)
	}

	// Editor: sees everything.
	out = render(userWithCaps(`{"admin_access":true,"default_node_access":{"access":"write","scope":"all"}}`))
	if !strings.Contains(out, "Theirs-Beta") || !strings.Contains(out, `"label":"Total Content","value":"3"`) {
		t.Fatalf("editor dashboard must see all nodes: %s", out)
	}
}

func TestTermFilterJSON_Escapes(t *testing.T) {
	if got := termFilterJSON(`a"],"x":["b\`); got != `["a\"],\"x\":[\"b\\"]` {
		t.Fatalf("got %s", got)
	}
}
