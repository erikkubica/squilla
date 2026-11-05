package cms

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"time"

	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

func speculationDoc(t *testing.T, html string) map[string]any {
	t.Helper()
	m := regexp.MustCompile(`<script type="speculationrules">(.*?)</script>`).FindStringSubmatch(html)
	if m == nil {
		t.Fatalf("no speculationrules script in %q", html)
	}
	var doc map[string]any
	if err := json.Unmarshal([]byte(m[1]), &doc); err != nil {
		t.Fatalf("speculation rules are not valid JSON: %v", err)
	}
	return doc
}

func TestNavigationSpeculationDefaultsToPrerenderModerate(t *testing.T) {
	html := string(navigationSpeculationHTML(map[string]string{}, nil))
	doc := speculationDoc(t, html)
	for _, kind := range []string{"prefetch", "prerender"} {
		rules, ok := doc[kind].([]any)
		if !ok || len(rules) != 1 {
			t.Fatalf("%s rules missing: %v", kind, doc)
		}
		rule := rules[0].(map[string]any)
		if rule["eagerness"] != "moderate" || rule["source"] != "document" {
			t.Errorf("%s rule = %v", kind, rule)
		}
	}
	for _, want := range []string{`"/admin/*"`, `"/api/*"`, `"/logout"`, `"/login"`, `"/register"`, `"/auth/*"`, `nofollow`, `data-no-prefetch`, `[download]`} {
		if !strings.Contains(html, want) {
			t.Errorf("rules do not exclude %s", want)
		}
	}
	if !strings.Contains(html, `supports("speculationrules")`) {
		t.Error("fallback prefetch script missing")
	}
}

func TestNavigationSpeculationModes(t *testing.T) {
	if got := navigationSpeculationHTML(map[string]string{SettingNavSpeculation: "off"}, nil); got != "" {
		t.Errorf("off mode emitted %q", got)
	}
	doc := speculationDoc(t, string(navigationSpeculationHTML(map[string]string{
		SettingNavSpeculation:          "prefetch",
		SettingNavSpeculationEagerness: "conservative",
	}, nil)))
	if _, ok := doc["prerender"]; ok {
		t.Error("prefetch mode must not prerender")
	}
	if doc["prefetch"].([]any)[0].(map[string]any)["eagerness"] != "conservative" {
		t.Error("eagerness setting ignored")
	}
	// Unknown values fall back to safe defaults.
	doc = speculationDoc(t, string(navigationSpeculationHTML(map[string]string{
		SettingNavSpeculation:          "bogus",
		SettingNavSpeculationEagerness: "immediate",
	}, nil)))
	if doc["prerender"].([]any)[0].(map[string]any)["eagerness"] != "moderate" {
		t.Error("invalid eagerness should fall back to moderate")
	}
}

func TestNavigationSpeculationSkipsLoggedInUsers(t *testing.T) {
	if got := navigationSpeculationHTML(map[string]string{}, &models.User{ID: 1}); got != "" {
		t.Errorf("logged-in user got speculation tags: %q", got)
	}
}

func TestNavigationSpeculationExtraExcludes(t *testing.T) {
	html := string(navigationSpeculationHTML(map[string]string{
		SettingNavSpeculationExclude: "/checkout/*\n  not-a-path\n/book</script><script>alert(1)//",
	}, nil))
	if !strings.Contains(html, `"/checkout/*"`) {
		t.Error("extra exclude missing from rules")
	}
	if strings.Contains(html, "not-a-path") {
		t.Error("non-path line should be ignored")
	}
	if strings.Count(html, "</script>") != 2 {
		t.Errorf("operator input broke out of the script element: %s", html)
	}
	speculationDoc(t, html)
}

func TestPathPatternToRegex(t *testing.T) {
	cases := []struct {
		pattern, path string
		match         bool
	}{
		{"/admin/*", "/admin/settings", true},
		{"/admin/*", "/administrator", false},
		{"/logout", "/logout", true},
		{"/logout", "/logout-now", false},
		{"/*.xml", "/sitemap.xml", true},
		{"/*.xml", "/blog/xml", false},
	}
	for _, c := range cases {
		re := regexp.MustCompile(pathPatternToRegex(c.pattern))
		if got := re.MatchString(c.path); got != c.match {
			t.Errorf("%s ~ %s = %v, want %v", c.pattern, c.path, got, c.match)
		}
	}
}

func TestHTMLCacheSeconds(t *testing.T) {
	cases := map[string]int{"": 60, "0": 0, "120": 120, "-5": 60, "abc": 60, "999999": 86400}
	for in, want := range cases {
		if got := htmlCacheSeconds(map[string]string{SettingHTMLCacheSeconds: in}); got != want {
			t.Errorf("htmlCacheSeconds(%q) = %d, want %d", in, got, want)
		}
	}
}

func cacheHeadersFor(t *testing.T, settings map[string]string, user *models.User, status int) (string, string) {
	t.Helper()
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		c.Status(status)
		setPublicHTMLCacheHeaders(c, settings, user)
		return c.SendString("ok")
	})
	resp, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	return resp.Header.Get("Cache-Control"), resp.Header.Get("Vary")
}

func TestPublicHTMLCacheHeaders(t *testing.T) {
	cc, vary := cacheHeadersFor(t, map[string]string{}, nil, 200)
	if cc != "private, max-age=60, stale-while-revalidate=300" {
		t.Errorf("anonymous Cache-Control = %q", cc)
	}
	if !strings.Contains(vary, "Cookie") {
		t.Errorf("Vary = %q, want Cookie", vary)
	}
	if cc, _ := cacheHeadersFor(t, map[string]string{}, &models.User{ID: 1}, 200); cc != "private, no-cache" {
		t.Errorf("logged-in Cache-Control = %q", cc)
	}
	if cc, _ := cacheHeadersFor(t, map[string]string{}, nil, 404); cc != "private, no-cache" {
		t.Errorf("404 Cache-Control = %q", cc)
	}
	if cc, _ := cacheHeadersFor(t, map[string]string{SettingHTMLCacheSeconds: "0"}, nil, 200); cc != "private, no-cache" {
		t.Errorf("disabled Cache-Control = %q", cc)
	}
}

func TestVersionThemeAssetURL(t *testing.T) {
	dir := t.TempDir()
	css := filepath.Join(dir, "assets", "styles", "theme.css")
	if err := os.MkdirAll(filepath.Dir(css), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(css, []byte("body{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	v1 := versionThemeAssetURL(dir, "/theme/assets/styles/theme.css")
	if !regexp.MustCompile(`^/theme/assets/styles/theme\.css\?v=[0-9a-f]{12}$`).MatchString(v1) {
		t.Fatalf("versioned URL = %q", v1)
	}
	if again := versionThemeAssetURL(dir, "/theme/assets/styles/theme.css"); again != v1 {
		t.Errorf("hash not stable: %q vs %q", again, v1)
	}
	if err := os.WriteFile(css, []byte("body{color:red}"), 0o644); err != nil {
		t.Fatal(err)
	}
	future := time.Now().Add(time.Minute)
	_ = os.Chtimes(css, future, future)
	if v2 := versionThemeAssetURL(dir, "/theme/assets/styles/theme.css"); v2 == v1 {
		t.Error("hash did not change after the file changed")
	}
	for _, u := range []string{"/theme/assets/missing.css", "https://cdn.example.com/x.css", "/theme/assets/styles/theme.css?x=1"} {
		if got := versionThemeAssetURL(dir, u); got != u {
			t.Errorf("%q should pass through, got %q", u, got)
		}
	}
	if got := versionThemeAssetURL(dir, "/theme/assets/../../etc/passwd"); strings.Contains(got, "?v=") {
		t.Errorf("path traversal was fingerprinted: %q", got)
	}
}

func TestThemeAssetRegistryEmitsVersionedURLs(t *testing.T) {
	dir := t.TempDir()
	js := filepath.Join(dir, "assets", "scripts", "theme.js")
	_ = os.MkdirAll(filepath.Dir(js), 0o755)
	_ = os.WriteFile(js, []byte("1"), 0o644)
	r := NewThemeAssetRegistry()
	r.themeDir = dir
	r.footScripts = []string{"/theme/assets/scripts/theme.js"}
	got := r.GetFootScripts()
	if len(got) != 1 || !strings.Contains(got[0], "?v=") {
		t.Errorf("GetFootScripts = %v", got)
	}
	if r.footScripts[0] != "/theme/assets/scripts/theme.js" {
		t.Error("registry slice was mutated")
	}
}

func TestThemeAssetCacheControl(t *testing.T) {
	if got := ThemeAssetCacheControl(true); !strings.Contains(got, "immutable") || !strings.Contains(got, "31536000") {
		t.Errorf("versioned = %q", got)
	}
	if got := ThemeAssetCacheControl(false); strings.Contains(got, "immutable") {
		t.Errorf("unversioned must not be immutable: %q", got)
	}
}
