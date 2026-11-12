package auth

import (
	"context"
	"testing"
	"time"

	"squilla/internal/models"
	"squilla/internal/testutil"

	"gorm.io/gorm"
)

// newAuthTestDB returns an in-memory SQLite DB with the tables the auth
// handlers touch. sessions is hand-written because the model's
// gen_random_uuid() default is Postgres-only.
func newAuthTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	t.Setenv("BCRYPT_COST", "10")
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Role{}, &models.User{}, &models.PasswordResetToken{}, &models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if err := db.Exec(`CREATE TABLE sessions (
		id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
		user_id INTEGER NOT NULL,
		token_hash TEXT NOT NULL UNIQUE,
		ip_address TEXT,
		user_agent TEXT,
		expires_at DATETIME NOT NULL,
		created_at DATETIME
	)`).Error; err != nil {
		t.Fatalf("sessions: %v", err)
	}
	return db
}

func mkRole(t *testing.T, db *gorm.DB, slug, caps string) models.Role {
	t.Helper()
	r := models.Role{Slug: slug, Name: slug, Capabilities: models.JSONB(caps)}
	if err := db.Create(&r).Error; err != nil {
		t.Fatalf("create role %s: %v", slug, err)
	}
	return r
}

func mkUser(t *testing.T, db *gorm.DB, email, password string, role models.Role) *models.User {
	t.Helper()
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	u := models.User{Email: email, PasswordHash: string(hash), RoleID: role.ID}
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("create user %s: %v", email, err)
	}
	u.Role = role
	return &u
}

func mkSession(t *testing.T, db *gorm.DB, userID int) {
	t.Helper()
	if err := db.Exec(`INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
		userID, time.Now().String()+string(rune('a'+userID)), time.Now().Add(time.Hour)).Error; err != nil {
		t.Fatal(err)
	}
}

func countSessions(t *testing.T, db *gorm.DB, userID int) int64 {
	t.Helper()
	var n int64
	db.Raw(`SELECT COUNT(*) FROM sessions WHERE user_id = ?`, userID).Scan(&n)
	return n
}

const (
	adminCaps   = `{"*":true,"admin_access":true,"manage_users":true,"manage_roles":true,"default_node_access":{"access":"write","scope":"all"}}`
	editorCaps  = `{"admin_access":true,"manage_users":false,"default_node_access":{"access":"write","scope":"all"}}`
	authorCaps  = `{"admin_access":true,"default_node_access":{"access":"write","scope":"own"}}`
	userMgrCaps = `{"admin_access":true,"manage_users":true,"default_node_access":{"access":"read","scope":"all"}}`
	memberCaps  = `{"admin_access":false,"default_node_access":{"access":"read","scope":"all"}}`
)

func contextWithCancel() (context.Context, context.CancelFunc) {
	return context.WithCancel(context.Background())
}
