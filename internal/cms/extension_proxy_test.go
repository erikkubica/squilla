package cms

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestNormalizeProxyPath(t *testing.T) {
	for in, want := range map[string]string{
		"":                "/",
		"settings":        "/settings",
		"settings/":       "/settings",
		"/settings":       "/settings",
		"a//b":            "/a/b",
		"templates/../x":  "/x",
		"../../etc":       "/etc",
		"optimizer/./foo": "/optimizer/foo",
	} {
		if got := normalizeProxyPath(in); got != want {
			t.Errorf("normalizeProxyPath(%q) = %q, want %q", in, got, want)
		}
	}
}

// TestProxyRequiredCapability: unmatched mutations need manage_settings
// (they used to need only admin_access), and a trailing slash or double
// slash can't dodge a declared rule once the path is normalised.
func TestProxyRequiredCapability(t *testing.T) {
	routes := NewAdminRouteRegistry()
	routes.Set("email", CompileAdminRoutes([]AdminRouteEntry{
		{Method: "*", Path: "/settings", RequiredCapability: "manage_email"},
	}))
	cases := []struct {
		method, path, want string
	}{
		{"PUT", normalizeProxyPath("settings/"), "manage_email"},
		{"PUT", normalizeProxyPath("/settings"), "manage_email"},
		{"POST", normalizeProxyPath("whatever"), "manage_settings"},
		{"DELETE", "/1", "manage_settings"},
		{"GET", "/anything", ""},
		{"HEAD", "/anything", ""},
	}
	for _, tc := range cases {
		if got := proxyRequiredCapability(routes, "email", tc.method, tc.path); got != tc.want {
			t.Errorf("%s %s: got %q, want %q", tc.method, tc.path, got, tc.want)
		}
	}
	// An extension with no admin_routes at all: same default.
	if got := proxyRequiredCapability(routes, "seo-extension", "PUT", "/settings"); got != "manage_settings" {
		t.Errorf("undeclared extension mutation: got %q", got)
	}
}

// TestMediaManagerAdminRoutes checks the bundled manifest keeps authors'
// media workflow (browse, upload, edit, delete) on admin_access while
// optimizer/settings endpoints need manage_settings.
func TestMediaManagerAdminRoutes(t *testing.T) {
	raw, err := os.ReadFile("../../extensions/media-manager/extension.json")
	if err != nil {
		t.Fatal(err)
	}
	var m ExtensionManifest
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	routes := NewAdminRouteRegistry()
	routes.Set("media-manager", CompileAdminRoutes(m.AdminRoutes))
	cases := []struct{ method, path, want string }{
		{"GET", "/", ""},
		{"POST", "/upload", ""},
		{"GET", "/12", ""},
		{"PUT", "/12", ""},
		{"DELETE", "/12", ""},
		{"POST", "/12/restore", ""},
		{"POST", "/12/reoptimize", ""},
		{"GET", "/optimizer/settings", "manage_settings"},
		{"PUT", "/optimizer/settings", "manage_settings"},
		{"POST", "/optimizer/sizes", "manage_settings"},
		{"DELETE", "/optimizer/sizes/thumb", "manage_settings"},
		{"POST", "/optimizer/cache/clear", "manage_settings"},
		{"POST", "/optimizer/reoptimize-all", "manage_settings"},
	}
	for _, tc := range cases {
		if got := proxyRequiredCapability(routes, "media-manager", tc.method, tc.path); got != tc.want {
			t.Errorf("%s %s: got %q, want %q", tc.method, tc.path, got, tc.want)
		}
	}
}

// TestBundledAdminUIRoutes pins the capability every write the bundled
// forms / email-manager admin UIs make resolves to, so none of them falls
// through to the manage_settings default meant for undeclared routes.
func TestBundledAdminUIRoutes(t *testing.T) {
	routes := NewAdminRouteRegistry()
	for _, slug := range []string{"forms", "email-manager"} {
		raw, err := os.ReadFile("../../extensions/" + slug + "/extension.json")
		if err != nil {
			t.Fatal(err)
		}
		var m ExtensionManifest
		if err := json.Unmarshal(raw, &m); err != nil {
			t.Fatal(err)
		}
		routes.Set(slug, CompileAdminRoutes(m.AdminRoutes))
	}
	cases := []struct{ slug, method, path, want string }{
		{"forms", "POST", "/preview", "manage_forms"},
		{"forms", "POST", "/", "manage_forms"},
		{"forms", "PUT", "/7", "manage_forms"},
		{"forms", "DELETE", "/7", "manage_forms"},
		{"forms", "POST", "/7/duplicate", "manage_forms"},
		{"forms", "POST", "/import", "manage_forms"},
		{"forms", "POST", "/1/notifications/0/test", "manage_forms"},
		{"forms", "POST", "/submissions/bulk", "manage_forms"},
		{"forms", "PATCH", "/submissions/3", "manage_forms"},
		{"forms", "GET", "/submissions/export", "manage_forms"},
		{"email-manager", "GET", "/logs", "view_email_logs"},
		{"email-manager", "POST", "/logs/5/resend", "manage_email"},
		{"email-manager", "PUT", "/templates/2", "manage_email"},
		{"email-manager", "POST", "/settings/test", "manage_email"},
		{"email-manager", "PUT", "/layouts/1", "manage_email"},
	}
	for _, tc := range cases {
		if got := proxyRequiredCapability(routes, tc.slug, tc.method, tc.path); got != tc.want {
			t.Errorf("%s %s %s: got %q, want %q", tc.slug, tc.method, tc.path, got, tc.want)
		}
	}
}

func TestPluginRequestHeaders_StripsClientIdentity(t *testing.T) {
	app := fiber.New()
	var got map[string]string
	app.Get("/", func(c *fiber.Ctx) error {
		got = pluginRequestHeaders(c)
		return nil
	})
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-User-Email", "admin@example.com")
	req.Header.Set("x-user-id", "1")
	req.Header.Set("Cookie", "squilla_session=abc")
	req.Header.Set("Authorization", "Bearer x")
	req.Header.Set("X-Forwarded-For", "6.6.6.6")
	req.Header.Set("Accept", "application/json")
	if _, err := app.Test(req); err != nil {
		t.Fatal(err)
	}
	for k := range got {
		switch k {
		case "Accept", "X-Forwarded-For", "Host", "Content-Length", "User-Agent":
		default:
			t.Errorf("header %q must not be forwarded", k)
		}
	}
	if got["X-Forwarded-For"] == "6.6.6.6" {
		t.Error("client X-Forwarded-For must be replaced by the trusted client IP")
	}
}

func TestSetPluginResponseHeaders_Filters(t *testing.T) {
	ReserveCookieNames("squilla_session")
	app := fiber.New()
	headers := map[string]string{}
	app.Get("/", func(c *fiber.Ctx) error {
		setPluginResponseHeaders(c, "analytics", headers)
		return c.SendString("ok")
	})
	run := func(h map[string]string) *fiber.App {
		for k := range headers {
			delete(headers, k)
		}
		for k, v := range h {
			headers[k] = v
		}
		return app
	}
	cases := []struct {
		name, header, value string
		kept                bool
	}{
		{"own cookie", "Set-Cookie", "analytics_optout=1; Path=/", true},
		{"session cookie", "Set-Cookie", "squilla_session=evil; Path=/", false},
		{"foreign cookie", "Set-Cookie", "forms_x=1", false},
		{"csp (added, not replaced)", "Content-Security-Policy", "default-src 'none'; sandbox", true},
		{"hsts", "Strict-Transport-Security", "max-age=0", false},
		{"cors", "Access-Control-Allow-Origin", "*", false},
		{"hop-by-hop", "Transfer-Encoding", "chunked", false},
		{"content type", "Content-Type", "image/gif", true},
		{"cache", "Cache-Control", "no-store", true},
	}
	for _, tc := range cases {
		resp, err := run(map[string]string{tc.header: tc.value}).Test(httptest.NewRequest("GET", "/", nil))
		if err != nil {
			t.Fatal(err)
		}
		got := resp.Header.Get(tc.header)
		if tc.kept && got != tc.value {
			t.Errorf("%s: header dropped (got %q)", tc.name, got)
		}
		if !tc.kept && got == tc.value {
			t.Errorf("%s: header must be dropped", tc.name)
		}
	}
}

// TestBundledManifests_DeclareSubscriptionCapabilities scans every bundled
// plugin's GetSubscriptions (EventName literals / string constants) and
// checks its manifest grants what subscriptionAllowed requires — so the
// events:* gate can't silently drop a bundled plugin's subscriptions.
func TestBundledManifests_DeclareSubscriptionCapabilities(t *testing.T) {
	dirs, _ := filepath.Glob("../../extensions/*/cmd/plugin")
	if len(dirs) == 0 {
		t.Skip("no bundled plugins found")
	}
	eventRe := regexp.MustCompile(`EventName:\s*(?:"([^"]+)"|(\w+))`)
	for _, dir := range dirs {
		extDir := filepath.Dir(filepath.Dir(dir))
		raw, err := os.ReadFile(filepath.Join(extDir, "extension.json"))
		if err != nil {
			t.Fatal(err)
		}
		var m ExtensionManifest
		if err := json.Unmarshal(raw, &m); err != nil {
			t.Fatalf("%s: %v", extDir, err)
		}
		caps := m.CapabilityMap()
		files, _ := filepath.Glob(filepath.Join(dir, "*.go"))
		var src strings.Builder
		for _, f := range files {
			if strings.HasSuffix(f, "_test.go") {
				continue
			}
			b, _ := os.ReadFile(f)
			src.Write(b)
		}
		all := src.String()
		for _, match := range eventRe.FindAllStringSubmatch(all, -1) {
			event := match[1]
			if event == "" {
				cm := regexp.MustCompile(`\b` + match[2] + `\s*=\s*"([^"]+)"`).FindStringSubmatch(all)
				if cm == nil {
					t.Fatalf("%s: can't resolve event constant %s", dir, match[2])
				}
				event = cm[1]
			}
			if ok, missing := subscriptionAllowed(event, caps); !ok {
				t.Errorf("%s subscribes to %q but its manifest lacks %q", m.Slug, event, missing)
			}
		}
	}
}

// TestSetPluginResponseHeaders_CSPOnlyTightens: a kernel CSP already on the
// response survives; the plugin's policy is added alongside it.
func TestSetPluginResponseHeaders_CSPOnlyTightens(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		c.Set("Content-Security-Policy", "default-src 'self'")
		setPluginResponseHeaders(c, "media-manager", map[string]string{"Content-Security-Policy": "default-src *"})
		return nil
	})
	resp, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	got := resp.Header.Values("Content-Security-Policy")
	if len(got) != 2 || got[0] != "default-src 'self'" {
		t.Fatalf("kernel CSP must be kept and the plugin's added, got %q", got)
	}
}
