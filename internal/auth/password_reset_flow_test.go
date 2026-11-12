package auth

import (
	"encoding/json"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"

	"squilla/internal/events"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

// resetTestBus returns a bus with a stub email provider (so forgot-password
// is enabled) and a channel receiving every reset event payload.
func resetTestBus() (*events.EventBus, chan events.Payload) {
	bus := events.New()
	bus.SubscribeErr("email.send", func(string, events.Payload) error { return nil })
	got := make(chan events.Payload, 4)
	bus.Subscribe("user.password_reset_requested", func(_ string, p events.Payload) { got <- p })
	return bus, got
}

func waitPayload(t *testing.T, ch chan events.Payload) events.Payload {
	t.Helper()
	select {
	case p := <-ch:
		return p
	case <-time.After(3 * time.Second):
		t.Fatal("no password reset event published")
		return nil
	}
}

// TestForgotPassword_UsesConfiguredOriginNotHost is the regression test
// for reset-link poisoning: site_url lives at the default language row
// ('en'), which the old code never read, so it fell back to the forged
// Host / X-Forwarded-Host header.
func TestForgotPassword_UsesConfiguredOriginNotHost(t *testing.T) {
	db := newAuthTestDB(t)
	db.Create(&models.Language{Code: "en", Name: "English", IsDefault: true})
	v := "https://cms.example.com/some/path"
	db.Create(&models.SiteSetting{Key: "site_url", LanguageCode: "en", Value: &v})
	member := mkRole(t, db, "member", memberCaps)
	mkUser(t, db, "alice@example.com", "correct horse", member)

	for _, surface := range []string{"admin", "page"} {
		t.Run(surface, func(t *testing.T) {
			bus, got := resetTestBus()
			app := fiber.New()
			var req = httptest.NewRequest("POST", "/", nil)
			var wantPath string
			if surface == "admin" {
				h := NewAdminAuthHandler(db, NewSessionService(db, 1), bus)
				app.Post("/", h.ForgotPassword)
				req = httptest.NewRequest("POST", "/", strings.NewReader(`{"email":"  ALICE@Example.com "}`))
				req.Header.Set("Content-Type", "application/json")
				wantPath = "/admin/reset-password?token="
			} else {
				h := NewPageAuthHandler(db, NewSessionService(db, 1), bus)
				app.Post("/", h.ProcessForgotPassword)
				req = httptest.NewRequest("POST", "/", strings.NewReader(url.Values{"email": {"Alice@example.com"}}.Encode()))
				req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
				wantPath = "/reset-password?token="
			}
			req.Host = "evil.example"
			req.Header.Set("X-Forwarded-Host", "evil.example")
			if _, err := app.Test(req, 15000); err != nil {
				t.Fatal(err)
			}
			p := waitPayload(t, got)
			resetURL, _ := p["reset_url"].(string)
			if !strings.HasPrefix(resetURL, "https://cms.example.com"+wantPath) {
				t.Fatalf("reset_url = %q, want configured origin", resetURL)
			}
		})
	}
}

// TestForgotPassword_DoesNotWaitForDispatch proves the response no longer
// waits on the email chain (the timing oracle between known and unknown
// accounts).
func TestForgotPassword_DoesNotWaitForDispatch(t *testing.T) {
	db := newAuthTestDB(t)
	member := mkRole(t, db, "member", memberCaps)
	mkUser(t, db, "alice@example.com", "correct horse", member)
	t.Setenv("SQUILLA_PUBLIC_URL", "https://cms.example.com")

	bus := events.New()
	bus.SubscribeErr("email.send", func(string, events.Payload) error { return nil })
	release := make(chan struct{})
	var once sync.Once
	defer once.Do(func() { close(release) })
	started := make(chan struct{}, 1)
	bus.Subscribe("user.password_reset_requested", func(string, events.Payload) {
		started <- struct{}{}
		<-release
	})

	h := NewAdminAuthHandler(db, NewSessionService(db, 1), bus)
	app := fiber.New()
	app.Post("/", h.ForgotPassword)
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{"email":"alice@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 5000)
	if err != nil {
		t.Fatalf("handler blocked on email dispatch: %v", err)
	}
	var body struct {
		Data struct{ Message string } `json:"data"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	if body.Data.Message != forgotPasswordSuccessMsg {
		t.Fatalf("unexpected body %+v", body)
	}
	select {
	case <-started:
	case <-time.After(3 * time.Second):
		t.Fatal("background dispatch never ran")
	}
}

func TestSiteOrigin_StrictModeNeverUsesHost(t *testing.T) {
	db := newAuthTestDB(t)
	SetStrictSiteOrigin(true)
	defer SetStrictSiteOrigin(false)
	t.Setenv("SQUILLA_PUBLIC_URL", "")
	t.Setenv("SITE_URL", "")

	app := fiber.New()
	var origin string
	var ok bool
	app.Get("/", func(c *fiber.Ctx) error { origin, ok = siteOriginFor(db, c); return nil })
	do := func() {
		req := httptest.NewRequest("GET", "/", nil)
		req.Host = "evil.example"
		if _, err := app.Test(req, 15000); err != nil {
			t.Fatal(err)
		}
	}

	do()
	if ok || origin != "" {
		t.Fatalf("strict mode with nothing configured: got %q ok=%v", origin, ok)
	}

	// The seeded localhost placeholder doesn't count in production.
	v := "http://localhost:8099"
	db.Create(&models.SiteSetting{Key: "site_url", LanguageCode: "en", Value: &v})
	do()
	if ok {
		t.Fatalf("loopback placeholder accepted in strict mode: %q", origin)
	}

	t.Setenv("SQUILLA_PUBLIC_URL", "https://public.example.com/")
	do()
	if !ok || origin != "https://public.example.com" {
		t.Fatalf("env fallback: got %q ok=%v", origin, ok)
	}
}

// TestForgotPassword_StrictNoOriginSendsNothing: production without a
// configured origin returns the generic success but never publishes a
// reset link.
func TestForgotPassword_StrictNoOriginSendsNothing(t *testing.T) {
	db := newAuthTestDB(t)
	member := mkRole(t, db, "member", memberCaps)
	mkUser(t, db, "alice@example.com", "correct horse", member)
	SetStrictSiteOrigin(true)
	defer SetStrictSiteOrigin(false)
	t.Setenv("SQUILLA_PUBLIC_URL", "")
	t.Setenv("SITE_URL", "")

	done := make(chan struct{}, 1)
	resetDispatchHook = func() { done <- struct{}{} }
	defer func() { resetDispatchHook = nil }()

	bus, got := resetTestBus()
	h := NewAdminAuthHandler(db, NewSessionService(db, 1), bus)
	app := fiber.New()
	app.Post("/", h.ForgotPassword)
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{"email":"alice@example.com"}`))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 15000)
	if err != nil || resp.StatusCode != 200 {
		t.Fatalf("status=%v err=%v", resp.StatusCode, err)
	}
	<-done
	select {
	case p := <-got:
		t.Fatalf("reset published without trusted origin: %v", p)
	default:
	}
	var n int64
	db.Model(&models.PasswordResetToken{}).Count(&n)
	if n != 0 {
		t.Fatalf("token issued without a deliverable link (%d rows)", n)
	}
}

func TestVerifyAndConsume_SingleUse(t *testing.T) {
	db := newAuthTestDB(t)
	member := mkRole(t, db, "member", memberCaps)
	u := mkUser(t, db, "alice@example.com", "correct horse", member)
	svc := NewPasswordResetService(db)
	tok, _, err := svc.IssueToken(u.ID, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if id, err := svc.VerifyAndConsume(tok); err != nil || id != u.ID {
		t.Fatalf("first consume: id=%d err=%v", id, err)
	}
	if _, err := svc.VerifyAndConsume(tok); err == nil {
		t.Fatal("token consumed twice")
	}
}

// TestResetPassword_PolicyFailureKeepsToken: a weak password is rejected
// before the token is consumed, so the user can retry with the same link.
func TestResetPassword_PolicyFailureKeepsToken(t *testing.T) {
	db := newAuthTestDB(t)
	member := mkRole(t, db, "member", memberCaps)
	u := mkUser(t, db, "alice@example.com", "correct horse", member)
	tok, _, _ := NewPasswordResetService(db).IssueToken(u.ID, "", "")

	h := NewAdminAuthHandler(db, NewSessionService(db, 1), events.New())
	app := fiber.New()
	app.Post("/", h.ResetPassword)
	post := func(pw string) int {
		body, _ := json.Marshal(map[string]string{"token": tok, "password": pw, "password_confirm": pw})
		req := httptest.NewRequest("POST", "/", strings.NewReader(string(body)))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req, 15000)
		if err != nil {
			t.Fatal(err)
		}
		return resp.StatusCode
	}
	if code := post("short"); code != fiber.StatusUnprocessableEntity {
		t.Fatalf("weak password: status %d", code)
	}
	if code := post("long enough password"); code != 200 {
		t.Fatalf("retry with same token: status %d", code)
	}
}
