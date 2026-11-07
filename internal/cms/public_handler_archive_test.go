package cms

import (
	"testing"

	"gorm.io/gorm"

	"squilla/internal/models"
	"squilla/internal/testutil"
)

func archiveTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.NodeType{}, &models.Language{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	if err := db.Exec(`
		CREATE TABLE content_nodes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			node_type TEXT NOT NULL DEFAULT 'page',
			status TEXT NOT NULL DEFAULT 'draft',
			language_code TEXT NOT NULL DEFAULT 'en',
			slug TEXT NOT NULL,
			full_url TEXT NOT NULL,
			title TEXT NOT NULL,
			translation_group_id TEXT,
			created_at DATETIME, updated_at DATETIME, deleted_at DATETIME
		)
	`).Error; err != nil {
		t.Fatalf("create content_nodes: %v", err)
	}
	db.Create(&models.Language{Code: "en", Slug: "en", Name: "English", HidePrefix: true})
	db.Create(&models.Language{Code: "de", Slug: "de", Name: "Deutsch"})
	return db
}

func seedNode(t *testing.T, db *gorm.DB, id int, lang, url, status string, group string) {
	t.Helper()
	var g interface{}
	if group != "" {
		g = group
	}
	if err := db.Exec(`INSERT INTO content_nodes (id, node_type, status, language_code, slug, full_url, title, translation_group_id)
		VALUES (?, 'page', ?, ?, ?, ?, ?, ?)`, id, status, lang, url, url, url, g).Error; err != nil {
		t.Fatalf("seed node: %v", err)
	}
}

func TestArchiveNodeFor(t *testing.T) {
	db := archiveTestDB(t)
	seedNode(t, db, 1, "en", "/blog", "published", "")         // legacy prefix page
	seedNode(t, db, 2, "en", "/journal", "published", "g1")    // configured archive
	seedNode(t, db, 3, "de", "/de/journal", "published", "g1") // its translation
	seedNode(t, db, 4, "en", "/stories", "draft", "")          // unpublished archive
	seedNode(t, db, 5, "de", "/de/blog", "published", "")      // legacy prefix page (de)

	nt := &models.NodeType{Slug: "post", URLPrefixes: models.JSONB(`{"en":"blog","de":"blog"}`)}

	// Nothing configured: legacy prefix rule, language segment honoured.
	if n, ok := archiveNodeFor(db, nt, "en"); !ok || n.ID != 1 {
		t.Fatalf("en fallback = %v %v, want node 1", n, ok)
	}
	if n, ok := archiveNodeFor(db, nt, "de"); !ok || n.ID != 5 {
		t.Fatalf("de fallback = %v %v, want node 5", n, ok)
	}

	// Configured wins; a node saved under the wrong language resolves to
	// its translation.
	nt.ArchiveNodeIDs = normalizeArchiveNodeIDs(map[string]interface{}{"en": 2.0, "de": "2"})
	if n, ok := archiveNodeFor(db, nt, "en"); !ok || n.ID != 2 {
		t.Fatalf("en configured = %v %v, want node 2", n, ok)
	}
	if n, ok := archiveNodeFor(db, nt, "de"); !ok || n.ID != 3 {
		t.Fatalf("de configured = %v %v, want translation node 3", n, ok)
	}

	// Unpublished configured page falls back to the prefix page.
	nt.ArchiveNodeIDs = models.JSONB(`{"en":4}`)
	if n, ok := archiveNodeFor(db, nt, "en"); !ok || n.ID != 1 {
		t.Fatalf("unpublished configured = %v %v, want fallback node 1", n, ok)
	}

	// isArchiveFor: configured page is authoritative, legacy otherwise.
	nt.ArchiveNodeIDs = models.JSONB(`{"en":2}`)
	journal := &models.ContentNode{ID: 2, LanguageCode: "en", FullURL: "/journal"}
	blog := &models.ContentNode{ID: 1, LanguageCode: "en", FullURL: "/blog"}
	deBlog := &models.ContentNode{ID: 5, LanguageCode: "de", FullURL: "/de/blog"}
	if !isArchiveFor(db, nt, journal, "/journal") {
		t.Fatal("configured page should be the archive")
	}
	if isArchiveFor(db, nt, blog, "/blog") {
		t.Fatal("prefix page must not be the archive once one is configured")
	}
	if !isArchiveFor(db, nt, deBlog, "/de/blog") {
		t.Fatal("unconfigured language should keep the prefix rule")
	}

	if got := archiveURLForType(db, nt, "en"); got != "/journal" {
		t.Fatalf("archive url = %q, want /journal", got)
	}
	none := &models.NodeType{Slug: "faq", URLPrefixes: models.JSONB(`{}`)}
	if got := archiveURLForType(db, none, "en"); got != "" {
		t.Fatalf("archive url without archive = %q, want empty", got)
	}
}

func TestNormalizeArchiveNodeIDs(t *testing.T) {
	cases := []struct {
		in   interface{}
		want string
	}{
		{nil, `{}`},
		{map[string]interface{}{"en": 12.0, "de": "34", "fr": 0.0, "": 5.0, "it": nil}, `{"de":34,"en":12}`},
		{models.JSONB(`{"en":"7"}`), `{"en":7}`},
		{"not json", `{}`},
		{map[string]int{"en": 3, "de": -1}, `{"en":3}`},
	}
	for _, c := range cases {
		if got := string(normalizeArchiveNodeIDs(c.in)); got != c.want {
			t.Errorf("normalize(%v) = %s, want %s", c.in, got, c.want)
		}
	}
}
