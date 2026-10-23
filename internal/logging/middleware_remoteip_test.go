package logging

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

// The access log must use the installed trusted-proxy-aware resolver,
// not Fiber's c.IP() (leftmost, client-forgeable X-Forwarded-For).
func TestRemoteIP_UsesInstalledResolver(t *testing.T) {
	SetRemoteIPFunc(func(*fiber.Ctx) string { return "203.0.113.7" })
	t.Cleanup(func() { SetRemoteIPFunc(nil) })

	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(remoteIP(c)) })
	resp, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	b, _ := io.ReadAll(resp.Body)
	if string(b) != "203.0.113.7" {
		t.Fatalf("remoteIP = %q, want resolver result", b)
	}
	SetRemoteIPFunc(nil)
	if resp, err = app.Test(httptest.NewRequest("GET", "/", nil)); err != nil {
		t.Fatal(err)
	}
	b, _ = io.ReadAll(resp.Body)
	if string(b) != "0.0.0.0" {
		t.Fatalf("default remoteIP = %q, want peer", b)
	}
}
