package auth

import (
	"fmt"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"squilla/internal/events"

	"github.com/gofiber/fiber/v2"
)

// TestLogin_OversizedEmailNeverReachesLockout: huge attacker-chosen
// emails are rejected before they become lockout-map keys.
func TestLogin_OversizedEmailNeverReachesLockout(t *testing.T) {
	db := newAuthTestDB(t)
	h := NewAuthHandler(db, NewSessionService(db, 1))
	app := fiber.New()
	app.Post("/auth/login", h.Login)

	body := fmt.Sprintf(`{"email":"%s@x.io","password":"pw"}`, strings.Repeat("a", 5000))
	req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 15000)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("status = %d", resp.StatusCode)
	}
	if n := h.lockout.Len(); n != 0 {
		t.Fatalf("oversized email recorded in lockout map (%d entries)", n)
	}
}

// TestLogin_SharedLockoutAcrossSurfaces: /auth/login and
// /auth/login-page draw from one per-account failure budget, and the key
// is case-insensitive.
func TestLogin_SharedLockoutAcrossSurfaces(t *testing.T) {
	db := newAuthTestDB(t)
	member := mkRole(t, db, "member", memberCaps)
	mkUser(t, db, "alice@example.com", "correct horse", member)
	sess := NewSessionService(db, 1)
	api := NewAuthHandler(db, sess)
	page := NewPageAuthHandler(db, sess, events.New())
	page.ShareLockout(api.LoginLockout())

	app := fiber.New()
	app.Post("/auth/login", api.Login)
	app.Post("/auth/login-page", page.ProcessLogin)
	jsonFail := func() {
		req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(`{"email":"ALICE@example.com","password":"wrong"}`))
		req.Header.Set("Content-Type", "application/json")
		_, _ = app.Test(req, 15000)
	}
	formFail := func() {
		req := httptest.NewRequest("POST", "/auth/login-page", strings.NewReader(url.Values{"email": {"alice@example.com"}, "password": {"wrong"}}.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		_, _ = app.Test(req, 15000)
	}
	for i := 0; i < 3; i++ {
		jsonFail()
	}
	formFail()
	formFail()
	if !api.LoginLockout().IsLocked("alice@example.com") {
		t.Fatal("5 failures across both login surfaces must lock the account")
	}
	// Correct password is now refused too.
	req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(`{"email":"alice@example.com","password":"correct horse"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, 15000)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("locked account logged in: %d", resp.StatusCode)
	}
}

func TestLogin_EmailCaseInsensitive(t *testing.T) {
	db := newAuthTestDB(t)
	member := mkRole(t, db, "member", memberCaps)
	mkUser(t, db, "Alice@Example.com", "correct horse", member) // legacy mixed-case row
	h := NewAuthHandler(db, NewSessionService(db, 1))
	app := fiber.New()
	app.Post("/auth/login", h.Login)
	req := httptest.NewRequest("POST", "/auth/login", strings.NewReader(`{"email":" alice@example.COM ","password":"correct horse"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 15000)
	if err != nil || resp.StatusCode != 200 {
		t.Fatalf("status=%d err=%v", resp.StatusCode, err)
	}
}

func TestLockoutTracker_BoundedSize(t *testing.T) {
	l := NewLockoutTracker(5, time.Hour, time.Hour)
	l.maxEntries = 100
	for i := 0; i < 1000; i++ {
		l.RecordFailure(fmt.Sprintf("u%d@x.io", i))
	}
	if n := l.Len(); n > 100 {
		t.Fatalf("lockout map grew to %d, cap 100", n)
	}
}

func TestPerIPLimiter_BoundedSizeAndCleanRefilled(t *testing.T) {
	p := NewPerIPLimiter(10, time.Minute, 10)
	p.maxEntries = 50
	for i := 0; i < 500; i++ {
		p.Allow(fmt.Sprintf("10.0.%d.%d", i/256, i%256))
	}
	if n := p.Len(); n > 50 {
		t.Fatalf("limiter map grew to %d, cap 50", n)
	}
	p.mu.Lock()
	for ip := range p.lastSeen {
		p.lastSeen[ip] = time.Now().Add(-2 * time.Minute) // older than the 1-minute refill
	}
	p.mu.Unlock()
	p.CleanRefilled()
	if n := p.Len(); n != 0 {
		t.Fatalf("CleanRefilled left %d entries", n)
	}
}

type countingCleaner struct{ n chan struct{} }

func (c countingCleaner) CleanIdle() { c.n <- struct{}{} }

func TestStartJanitor_RunsCleaners(t *testing.T) {
	c := countingCleaner{n: make(chan struct{}, 4)}
	ctx, cancel := contextWithCancel()
	defer cancel()
	StartJanitor(ctx, 10*time.Millisecond, c)
	select {
	case <-c.n:
	case <-time.After(time.Second):
		t.Fatal("janitor never ran")
	}
}
