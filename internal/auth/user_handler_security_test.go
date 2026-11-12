package auth

import (
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"

	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type userFixture struct {
	db                         *gorm.DB
	adminRole, editorRole      models.Role
	authorRole, userMgrRole    models.Role
	viewerRole                 models.Role
	admin, editor, author, mgr *models.User
	viewer                     *models.User
}

func newUserFixture(t *testing.T) *userFixture {
	db := newAuthTestDB(t)
	f := &userFixture{db: db}
	f.adminRole = mkRole(t, db, "admin", adminCaps)
	f.editorRole = mkRole(t, db, "editor", editorCaps)
	f.authorRole = mkRole(t, db, "author", authorCaps)
	f.userMgrRole = mkRole(t, db, "usermgr", userMgrCaps)
	f.viewerRole = mkRole(t, db, "viewer", `{"admin_access":true,"default_node_access":{"access":"read","scope":"own"}}`)
	f.admin = mkUser(t, db, "admin@x.io", "admin password", f.adminRole)
	f.editor = mkUser(t, db, "editor@x.io", "editor password", f.editorRole)
	f.author = mkUser(t, db, "author@x.io", "author password", f.authorRole)
	f.mgr = mkUser(t, db, "mgr@x.io", "mgr password!", f.userMgrRole)
	f.viewer = mkUser(t, db, "viewer@x.io", "viewer password", f.viewerRole)
	return f
}

func (f *userFixture) do(t *testing.T, actor *models.User, method, path, body string) int {
	t.Helper()
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error { c.Locals(localsUserKey, actor); return c.Next() })
	NewUserHandler(f.db, nil).RegisterRoutes(app)
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 10000)
	if err != nil {
		t.Fatal(err)
	}
	return resp.StatusCode
}

func TestUserHandler_PrivilegeBoundaries(t *testing.T) {
	f := newUserFixture(t)
	u := func(x *models.User) string { return fmt.Sprintf("/users/%d", x.ID) }
	cases := []struct {
		name   string
		actor  func() *models.User
		method string
		path   func() string
		body   func() string
		want   int
	}{
		{"mgr cannot create admin", func() *models.User { return f.mgr }, "POST", func() string { return "/users" },
			func() string {
				return fmt.Sprintf(`{"email":"n1@x.io","password":"long password","role_id":%d}`, f.adminRole.ID)
			}, 403},
		{"mgr cannot create editor (more node access)", func() *models.User { return f.mgr }, "POST", func() string { return "/users" },
			func() string {
				return fmt.Sprintf(`{"email":"n2@x.io","password":"long password","role_id":%d}`, f.editorRole.ID)
			}, 403},
		{"mgr can create subset role", func() *models.User { return f.mgr }, "POST", func() string { return "/users" },
			func() string {
				return fmt.Sprintf(`{"email":"N3@X.io","password":"long password","role_id":%d}`, f.viewerRole.ID)
			}, 201},
		{"create rejects weak password", func() *models.User { return f.admin }, "POST", func() string { return "/users" },
			func() string {
				return fmt.Sprintf(`{"email":"n4@x.io","password":"short","role_id":%d}`, f.viewerRole.ID)
			}, 422},
		{"create rejects bad email", func() *models.User { return f.admin }, "POST", func() string { return "/users" },
			func() string {
				return fmt.Sprintf(`{"email":"Bob <b@x.io>","password":"long password","role_id":%d}`, f.viewerRole.ID)
			}, 422},
		{"create rejects unknown role", func() *models.User { return f.admin }, "POST", func() string { return "/users" },
			func() string { return `{"email":"n5@x.io","password":"long password","role_id":9999}` }, 422},
		{"mgr cannot reset admin password", func() *models.User { return f.mgr }, "PATCH", func() string { return u(f.admin) },
			func() string { return `{"password":"attacker password"}` }, 403},
		{"mgr cannot change admin email", func() *models.User { return f.mgr }, "PATCH", func() string { return u(f.admin) },
			func() string { return `{"email":"evil@x.io"}` }, 403},
		{"mgr cannot promote viewer to admin", func() *models.User { return f.mgr }, "PATCH", func() string { return u(f.viewer) },
			func() string { return fmt.Sprintf(`{"role_id":%d}`, f.adminRole.ID) }, 403},
		{"mgr cannot delete admin", func() *models.User { return f.mgr }, "DELETE", func() string { return u(f.admin) },
			func() string { return `` }, 403},
		{"self cannot change own password here", func() *models.User { return f.author }, "PATCH", func() string { return u(f.author) },
			func() string { return `{"password":"new long password"}` }, 403},
		{"self cannot change own email here", func() *models.User { return f.author }, "PATCH", func() string { return u(f.author) },
			func() string { return `{"email":"other@x.io"}` }, 403},
		{"self can change own name", func() *models.User { return f.author }, "PATCH", func() string { return u(f.author) },
			func() string { return `{"full_name":"A. Author"}` }, 200},
		{"author cannot read other user", func() *models.User { return f.author }, "GET", func() string { return u(f.admin) },
			func() string { return `` }, 403},
		{"author can read self", func() *models.User { return f.author }, "GET", func() string { return u(f.author) },
			func() string { return `` }, 200},
		{"admin can set editor password", func() *models.User { return f.admin }, "PATCH", func() string { return u(f.editor) },
			func() string { return `{"password":"brand new password"}` }, 200},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := f.do(t, tc.actor(), tc.method, tc.path(), tc.body()); got != tc.want {
				t.Fatalf("status = %d, want %d", got, tc.want)
			}
		})
	}

	var created models.User
	if err := f.db.Where("email = ?", "n3@x.io").First(&created).Error; err != nil {
		t.Fatalf("created user email not normalised to lowercase: %v", err)
	}
}

// TestUserHandler_PasswordChangeRevokesSessionsAndTokens: a password set
// by an administrator signs the target out everywhere and voids pending
// reset links.
func TestUserHandler_PasswordChangeRevokesSessionsAndTokens(t *testing.T) {
	f := newUserFixture(t)
	mkSession(t, f.db, f.editor.ID)
	tok, _, _ := NewPasswordResetService(f.db).IssueToken(f.editor.ID, "", "")

	if got := f.do(t, f.admin, "PATCH", fmt.Sprintf("/users/%d", f.editor.ID), `{"password":"brand new password"}`); got != 200 {
		t.Fatalf("status %d", got)
	}
	if n := countSessions(t, f.db, f.editor.ID); n != 0 {
		t.Fatalf("%d sessions survived an admin password change", n)
	}
	if _, err := NewPasswordResetService(f.db).VerifyAndConsume(tok); err == nil {
		t.Fatal("reset token still valid after admin password change")
	}
}

func TestCanAssignRole(t *testing.T) {
	actor := &models.User{Role: models.Role{Capabilities: models.JSONB(`{"admin_access":true,"manage_users":true,"manage_menus":true,"default_node_access":{"access":"write","scope":"own"}}`)}}
	cases := []struct {
		caps string
		want bool
	}{
		{`{"admin_access":true,"manage_menus":true}`, true},
		{`{"admin_access":true,"manage_settings":true}`, false},
		{`{"*":true}`, false},
		{`{"default_node_access":{"access":"write","scope":"own"}}`, true},
		{`{"default_node_access":{"access":"write","scope":"all"}}`, false},
		{`{"default_node_access":{"access":"read","scope":"own"}}`, true},
		{`{"manage_menus":false,"manage_settings":false}`, true},
	}
	for _, tc := range cases {
		if got := canAssignRole(actor, models.Role{Capabilities: models.JSONB(tc.caps)}); got != tc.want {
			t.Errorf("canAssignRole(%s) = %v, want %v", tc.caps, got, tc.want)
		}
	}
	// The role's default access would reach a type the actor is barred from.
	barred := &models.User{Role: models.Role{Capabilities: models.JSONB(`{"admin_access":true,"default_node_access":{"access":"write","scope":"all"},"nodes":{"secret":{"access":"none"}}}`)}}
	if canAssignRole(barred, models.Role{Capabilities: models.JSONB(`{"default_node_access":{"access":"read","scope":"own"}}`)}) {
		t.Error("role reaching a node type the actor is barred from must be refused")
	}
	wild := &models.User{Role: models.Role{Capabilities: models.JSONB(`{"*":true,"admin_access":true}`)}}
	if !canAssignRole(wild, models.Role{Capabilities: models.JSONB(`{"*":true,"admin_access":true}`)}) {
		t.Error("wildcard actor must be able to assign anything")
	}
}

func TestRegistrationRole_RefusesAdminRoles(t *testing.T) {
	db := newAuthTestDB(t)
	mkRole(t, db, "member", memberCaps)
	mkRole(t, db, "editor", editorCaps)
	v := "editor"
	db.Create(&models.SiteSetting{Key: "default_registration_role", LanguageCode: "", Value: &v})
	role, err := registrationRole(db)
	if err != nil {
		t.Fatal(err)
	}
	if role.Slug != "member" {
		t.Fatalf("self-registration got role %q, want member (editor has admin_access)", role.Slug)
	}
}
