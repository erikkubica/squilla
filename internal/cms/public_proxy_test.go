package cms

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/models"
)

// TestIsReservedPublicPath_Refuses pins the kernel-owned paths that an
// extension manifest must NOT be allowed to claim through public_routes.
// Each entry below represents a real attack vector: shadowing /login
// would let a malicious extension phish credentials; shadowing
// /admin/api/users would let it bypass auth on a privileged endpoint.
func TestIsReservedPublicPath_Refuses(t *testing.T) {
	cases := []string{
		"/", // root catch-all would intercept every request
		"/login",
		"/logout",
		"/register",
		"/forgot-password",
		"/reset-password",
		"/me",
		"/admin",
		"/admin/dashboard",
		"/admin/api/users",
		"/admin/api/ext/x/y",
		"/auth/login",
		"/auth/forgot-password",
		"/api/v1/theme-deploy",
		"/api/v1/anything",
	}
	for _, p := range cases {
		if !isReservedPublicPath(p) {
			t.Errorf("path %q should be reserved", p)
		}
	}
}

func TestIsReservedPublicPath_Allows(t *testing.T) {
	// Legitimate public extension routes — must not be refused.
	cases := []string{
		"/forms/submit/contact",
		"/media/photo.jpg",
		"/media/cache/thumb/foo.jpg",
		"/sitemap.xml",
		"/feed.rss",
		"/.well-known/security.txt",
		"/login-ext",     // not /login
		"/admin-toolkit", // not /admin
		"/auth-callback", // not /auth/
	}
	for _, p := range cases {
		if isReservedPublicPath(p) {
			t.Errorf("path %q should be allowed", p)
		}
	}
}

// An installed but inactive extension's public route must step aside so a
// fallback (or the page router) answers, rather than 503 every request.
func TestPublicRoute_InactiveExtensionFallsThrough(t *testing.T) {
	app := fiber.New()
	pp := NewPublicExtensionProxy(NewPluginManager(nil, nil, nil))
	pp.RegisterPublicRoutes(app, []models.Extension{{
		Slug:     "analytics",
		Manifest: models.JSONB(`{"public_routes":[{"method":"GET","path":"/_s/*"}]}`),
	}})
	app.Get("/_s/*", func(c *fiber.Ctx) error { return c.SendString("fallback") })

	resp, err := app.Test(httptest.NewRequest("GET", "/_s/x.gif", nil))
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 || string(body) != "fallback" {
		t.Fatalf("got %d %q, want the fallback route", resp.StatusCode, body)
	}
}
