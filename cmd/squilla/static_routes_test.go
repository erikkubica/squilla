package main

import (
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestThemeAssetsCacheControl(t *testing.T) {
	dir := t.TempDir()
	if err := os.MkdirAll(filepath.Join(dir, "styles"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "styles", "theme.css"), []byte("body{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	r := &themeAssetsResolver{}
	r.set(dir)
	app := fiber.New()
	registerThemeAssets(app, r)

	get := func(url string) (int, string) {
		resp, err := app.Test(httptest.NewRequest("GET", url, nil))
		if err != nil {
			t.Fatal(err)
		}
		return resp.StatusCode, resp.Header.Get("Cache-Control")
	}

	if code, cc := get("/theme/assets/styles/theme.css?v=abc123"); code != 200 || !strings.Contains(cc, "immutable") {
		t.Errorf("versioned asset: %d %q", code, cc)
	}
	if code, cc := get("/theme/assets/styles/theme.css"); code != 200 || strings.Contains(cc, "immutable") || !strings.Contains(cc, "stale-while-revalidate") {
		t.Errorf("bare asset: %d %q", code, cc)
	}
	if code, cc := get("/theme/assets/missing.css?v=1"); code != 404 || strings.Contains(cc, "immutable") {
		t.Errorf("missing asset must not be cached as immutable: %d %q", code, cc)
	}
}
