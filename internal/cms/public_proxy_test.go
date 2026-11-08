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

func newTestProxy(running map[string]bool) *PublicExtensionProxy {
	pp := NewPublicExtensionProxy(nil)
	pp.running = func(slug string) bool { return running[slug] }
	pp.newHandler = func(slug, _ string) fiber.Handler {
		return func(c *fiber.Ctx) error {
			w, _ := c.Locals(publicRouteWildcardKey).(string)
			return c.SendString(slug + ":" + w)
		}
	}
	return pp
}

func get(t *testing.T, app *fiber.App, method, path string) (int, string) {
	t.Helper()
	resp, err := app.Test(httptest.NewRequest(method, path, nil))
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(body)
}

// Activating an extension whose manifest gained a public route must serve
// that route without a restart — the dispatcher reads the live table.
func TestPublicRoute_HotMountAfterRefresh(t *testing.T) {
	app := fiber.New()
	pp := newTestProxy(map[string]bool{"seo": true})
	active := []models.Extension{{Slug: "seo", Manifest: models.JSONB(`{"public_routes":[{"method":"GET","path":"/robots.txt"}]}`)}}
	pp.SetSource(func() ([]models.Extension, error) { return active, nil })
	pp.Mount(app)
	pp.Refresh()
	app.Get("/*", func(c *fiber.Ctx) error { return c.Status(404).SendString("page-router") })

	if code, body := get(t, app, "GET", "/robots.txt"); code != 200 || body != "seo:" {
		t.Fatalf("/robots.txt = %d %q", code, body)
	}
	if code, body := get(t, app, "GET", "/llms.txt"); code != 404 || body != "page-router" {
		t.Fatalf("/llms.txt before update = %d %q, want page router", code, body)
	}

	// The bundled copy (adopted at runtime) declares /llms.txt.
	active = []models.Extension{{Slug: "seo", Manifest: models.JSONB(`{"public_routes":[{"method":"GET","path":"/robots.txt"},{"method":"GET","path":"/llms.txt"}]}`)}}
	pp.Refresh()
	if code, body := get(t, app, "GET", "/llms.txt"); code != 200 || body != "seo:" {
		t.Fatalf("/llms.txt after refresh = %d %q, want served by seo", code, body)
	}

	// Deactivation drops the routes again.
	active = nil
	pp.Refresh()
	if code, _ := get(t, app, "GET", "/robots.txt"); code != 404 {
		t.Fatalf("/robots.txt after deactivate = %d, want fall-through", code)
	}
}

func TestPublicRoute_DispatchSemantics(t *testing.T) {
	app := fiber.New()
	pp := newTestProxy(map[string]bool{"media": true, "forms": true, "analytics": true})
	pp.RegisterPublicRoutes(app, []models.Extension{
		{Slug: "media", Manifest: models.JSONB(`{"public_routes":[{"method":"GET","path":"/media/*"}]}`)},
		{Slug: "forms", Manifest: models.JSONB(`{"public_routes":[{"method":"POST","path":"/forms/submit/:id"},{"method":"GET","path":"/login"}]}`)},
		{Slug: "analytics", Manifest: models.JSONB(`{"public_routes":[{"method":"ANY","path":"/_s/+"}]}`)},
	})
	app.All("/*", func(c *fiber.Ctx) error { return c.Status(404).SendString("next") })

	cases := []struct {
		method, path string
		code         int
		body         string
	}{
		{"GET", "/media/2026/a.jpg", 200, "media:2026/a.jpg"},
		{"HEAD", "/media/a.jpg", 200, ""},
		{"GET", "/MEDIA/a.jpg", 200, "media:a.jpg"},
		{"GET", "/media", 200, "media:"},
		{"POST", "/media/a.jpg", 404, "next"},
		{"POST", "/forms/submit/contact", 200, "forms:"},
		{"POST", "/forms/submit/contact/", 200, "forms:"},
		{"POST", "/forms/submit", 404, "next"},
		{"POST", "/forms/submit/a/b", 404, "next"},
		{"GET", "/login", 404, "next"}, // kernel-reserved: refused
		{"DELETE", "/_s/x.gif", 200, "analytics:x.gif"},
		{"GET", "/_s/", 404, "next"},
	}
	for _, c := range cases {
		code, body := get(t, app, c.method, c.path)
		if code != c.code || body != c.body {
			t.Errorf("%s %s = %d %q, want %d %q", c.method, c.path, code, body, c.code, c.body)
		}
	}
}
