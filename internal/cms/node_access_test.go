package cms

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/models"
	"squilla/internal/testutil"
)

func newNodeAccessDB(t *testing.T) *gorm.DB {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	stmts := []string{
		`CREATE TABLE content_nodes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			parent_id INTEGER, node_type TEXT NOT NULL DEFAULT 'page',
			status TEXT NOT NULL DEFAULT 'draft', language_code TEXT NOT NULL DEFAULT 'en',
			language_id INTEGER, slug TEXT NOT NULL DEFAULT '', full_url TEXT NOT NULL DEFAULT '',
			title TEXT NOT NULL DEFAULT '', author_id INTEGER, translation_group_id TEXT,
			created_at DATETIME, updated_at DATETIME, deleted_at DATETIME)`,
		`CREATE TABLE content_node_revisions (
			id INTEGER PRIMARY KEY AUTOINCREMENT, node_id INTEGER NOT NULL,
			title TEXT NOT NULL DEFAULT '', slug TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
			language_code TEXT NOT NULL DEFAULT 'en', layout_slug TEXT, excerpt TEXT NOT NULL DEFAULT '',
			featured_image TEXT NOT NULL DEFAULT '{}', blocks_snapshot TEXT NOT NULL DEFAULT '[]',
			fields_snapshot TEXT NOT NULL DEFAULT '{}', seo_snapshot TEXT NOT NULL DEFAULT '{}',
			taxonomies_snapshot TEXT NOT NULL DEFAULT '{}', version_number INTEGER NOT NULL DEFAULT 0,
			created_by INTEGER, created_at DATETIME)`,
		`CREATE TABLE users (id INTEGER PRIMARY KEY, full_name TEXT, email TEXT)`,
		// Node 1: authored by user 1 (the author under test). Node 2: by user 2.
		`INSERT INTO content_nodes (id, node_type, title, author_id, translation_group_id) VALUES (1, 'post', 'Mine', 1, 'g1'), (2, 'post', 'Theirs', 2, 'g2')`,
		`INSERT INTO content_node_revisions (id, node_id, title) VALUES (1, 1, 'mine v1'), (2, 2, 'theirs v1')`,
	}
	for _, q := range stmts {
		if err := db.Exec(q).Error; err != nil {
			t.Fatalf("%v\n%s", err, q)
		}
	}
	return db
}

// TestNodeSideDoors_EnforceOwnScope: an author (write, scope "own") must
// not reach another user's node through translations, revisions or
// preview — the main /nodes/:id handlers already refuse it.
func TestNodeSideDoors_EnforceOwnScope(t *testing.T) {
	db := newNodeAccessDB(t)
	author := &models.User{ID: 1, Role: models.Role{Capabilities: models.JSONB(
		`{"admin_access":true,"manage_content":true,"default_node_access":{"access":"write","scope":"own"}}`)}}
	reader := &models.User{ID: 3, Role: models.Role{Capabilities: models.JSONB(
		`{"admin_access":true,"manage_content":true,"default_node_access":{"access":"read","scope":"all"}}`)}}

	newApp := func(u *models.User) *fiber.App {
		app := fiber.New()
		app.Use(func(c *fiber.Ctx) error { c.Locals("user", u); return c.Next() })
		svc := NewContentService(db, nil)
		NewNodeHandler(svc, db, nil).RegisterRoutes(app)
		NewRevisionHandler(db, svc).RegisterRoutes(app)
		(&PublicHandler{db: db}).RegisterAdminPreviewRoutes(app)
		return app
	}

	cases := []struct {
		name   string
		user   *models.User
		method string
		path   string
		body   string
		want   int
	}{
		{"translations list, other's node", author, "GET", "/nodes/2/translations", "", 403},
		{"create translation, other's node", author, "POST", "/nodes/2/translations", `{"language_code":"de"}`, 403},
		{"revision list, other's node", author, "GET", "/nodes/2/revisions", "", 403},
		{"revision detail, other's node", author, "GET", "/nodes/2/revisions/2", "", 403},
		{"revision restore, other's node", author, "POST", "/nodes/2/revisions/2/restore", "", 403},
		{"preview GET, other's node", author, "GET", "/nodes/2/preview", "", 403},
		{"preview POST, other's node", author, "POST", "/nodes/2/preview", `{}`, 403},
		{"render-blocks, other's node", author, "POST", "/nodes/2/render-blocks", `{"blocks":[]}`, 403},
		{"render-blocks, missing node", author, "POST", "/nodes/99/render-blocks", `{"blocks":[]}`, 404},
		{"revision list, own node", author, "GET", "/nodes/1/revisions", "", 200},
		{"revision detail, own node", author, "GET", "/nodes/1/revisions/1", "", 200},
		{"translations list, own node", author, "GET", "/nodes/1/translations", "", 200},
		{"read-only role cannot restore", reader, "POST", "/nodes/2/revisions/2/restore", "", 403},
		{"read-only role cannot create translation", reader, "POST", "/nodes/2/translations", `{"language_code":"de"}`, 403},
		{"read-only role can list revisions", reader, "GET", "/nodes/2/revisions", "", 200},
		{"missing node", author, "GET", "/nodes/99/revisions", "", 404},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := newApp(tc.user).Test(req)
			if err != nil {
				t.Fatal(err)
			}
			if resp.StatusCode != tc.want {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tc.want)
			}
		})
	}
}
