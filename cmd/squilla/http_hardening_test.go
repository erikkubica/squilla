package main

import (
	"errors"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestSecurityHeaders(t *testing.T) {
	app := fiber.New()
	app.Use(securityHeaders())
	app.Get("/*", func(c *fiber.Ctx) error { return c.SendString("ok") })

	get := func(path string, mut func(r *httptestReq)) map[string]string {
		req := httptest.NewRequest("GET", path, nil)
		if mut != nil {
			mut(&httptestReq{req.Header.Set})
		}
		resp, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		out := map[string]string{}
		for _, h := range []string{"X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options", "Strict-Transport-Security", "Content-Security-Policy-Report-Only", "Content-Security-Policy"} {
			out[h] = resp.Header.Get(h)
		}
		return out
	}

	h := get("/some-page", nil)
	if h["X-Content-Type-Options"] != "nosniff" || h["Referrer-Policy"] != "strict-origin-when-cross-origin" || h["X-Frame-Options"] != "SAMEORIGIN" {
		t.Fatalf("baseline headers missing: %v", h)
	}
	if h["Strict-Transport-Security"] != "" {
		t.Fatal("HSTS must not be sent over plain HTTP")
	}
	if h["Content-Security-Policy-Report-Only"] != "" || h["Content-Security-Policy"] != "" {
		t.Fatal("public pages must not get a CSP (themes use inline scripts)")
	}

	t.Setenv("TRUST_FORWARDED_PROTO", "true")
	h = get("/admin/dashboard", func(r *httptestReq) { r.set("X-Forwarded-Proto", "https") })
	if !strings.HasPrefix(h["Strict-Transport-Security"], "max-age=") {
		t.Fatalf("HSTS missing on secure request: %v", h)
	}
	if !strings.Contains(h["Content-Security-Policy-Report-Only"], "frame-ancestors 'self'") {
		t.Fatalf("admin shell CSP (report-only) missing: %v", h)
	}
	if h = get("/admin/api/boot", nil); h["Content-Security-Policy-Report-Only"] != "" {
		t.Fatal("JSON API must not carry the admin shell CSP")
	}
}

type httptestReq struct{ set func(k, v string) }

func TestErrorHandler_HidesInternalErrors(t *testing.T) {
	app := fiber.New(fiber.Config{ErrorHandler: errorHandler})
	app.Use(recoverMiddleware())
	app.Get("/admin/api/boom", func(c *fiber.Ctx) error {
		return errors.New(`pq: relation "secret_table" does not exist`)
	})
	app.Get("/admin/api/panic", func(c *fiber.Ctx) error { panic("db password is hunter2") })
	app.Get("/page", func(c *fiber.Ctx) error { return errors.New("open /etc/squilla/secret: denied") })
	app.Get("/admin/api/missing", func(c *fiber.Ctx) error { return fiber.NewError(fiber.StatusNotFound, "Thing not found") })

	cases := []struct {
		path, wantBody, leak string
		status               int
	}{
		{"/admin/api/boom", `"code":"INTERNAL_ERROR"`, "secret_table", 500},
		{"/admin/api/panic", `"message":"An unexpected error occurred"`, "hunter2", 500},
		{"/page", "<h1>500</h1>", "/etc/squilla", 500},
		{"/admin/api/missing", `"message":"Thing not found"`, "", 404},
	}
	for _, tc := range cases {
		resp, err := app.Test(httptest.NewRequest("GET", tc.path, nil))
		if err != nil {
			t.Fatal(err)
		}
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != tc.status || !strings.Contains(string(body), tc.wantBody) {
			t.Errorf("%s: status=%d body=%s", tc.path, resp.StatusCode, body)
		}
		if tc.leak != "" && strings.Contains(string(body), tc.leak) {
			t.Errorf("%s leaked internal error text: %s", tc.path, body)
		}
	}
}

func TestMediaFallbackHeaders(t *testing.T) {
	dir := t.TempDir()
	for _, f := range []string{"x.html", "y.svg", "z.png"} {
		os.WriteFile(filepath.Join(dir, f), []byte("<script>alert(1)</script>"), 0o644)
	}
	app := fiber.New()
	app.Use("/media", mediaFallbackHeaders())
	app.Static("/media", dir)
	for path, attach := range map[string]bool{"/media/x.html": true, "/media/y.svg": true, "/media/z.png": false} {
		resp, err := app.Test(httptest.NewRequest("GET", path, nil))
		if err != nil {
			t.Fatal(err)
		}
		if resp.Header.Get("X-Content-Type-Options") != "nosniff" {
			t.Errorf("%s: nosniff missing", path)
		}
		got := resp.Header.Get("Content-Disposition") == "attachment"
		if got != attach {
			t.Errorf("%s: attachment=%v, want %v", path, got, attach)
		}
		hasCSP := strings.Contains(resp.Header.Get("Content-Security-Policy"), "sandbox")
		if hasCSP != attach {
			t.Errorf("%s: sandbox CSP=%v, want %v", path, hasCSP, attach)
		}
	}

	os.MkdirAll(filepath.Join(dir, "originals"), 0o755)
	os.WriteFile(filepath.Join(dir, "originals", "raw.png"), []byte("raw"), 0o644)
	for _, p := range []string{"/media/originals/raw.png", "/media/x/../originals/raw.png", "/media/Originals/raw.png"} {
		resp, err := app.Test(httptest.NewRequest("GET", p, nil))
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != 404 {
			t.Errorf("%s: status %d, want 404 (originals are private)", p, resp.StatusCode)
		}
	}
}
