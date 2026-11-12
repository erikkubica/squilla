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

// TestThemeAssets_SymlinkOutsideNotServed: a theme (git clone / zip) can
// carry assets/x -> /some/host/file. The lexical Clean check alone
// followed it; the asset route must resolve symlinks and refuse.
func TestThemeAssets_SymlinkOutsideNotServed(t *testing.T) {
	root := t.TempDir()
	themeDir := filepath.Join(root, "theme")
	assets := filepath.Join(themeDir, "assets")
	if err := os.MkdirAll(assets, 0o755); err != nil {
		t.Fatal(err)
	}
	secret := filepath.Join(root, "secret.txt")
	if err := os.WriteFile(secret, []byte("TOP-SECRET"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(assets, "ok.txt"), []byte("fine"), 0o644); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"leak.txt", "leak.css"} {
		if err := os.Symlink(secret, filepath.Join(assets, name)); err != nil {
			t.Fatal(err)
		}
	}
	r := &themeAssetsResolver{}
	r.set(assets)
	app := fiber.New()
	registerThemeAssets(app, r)
	for _, url := range []string{"/theme/assets/leak.txt", "/theme/assets/leak.css"} {
		resp, err := app.Test(httptest.NewRequest("GET", url, nil))
		if err != nil {
			t.Fatal(err)
		}
		body := make([]byte, 64)
		n, _ := resp.Body.Read(body)
		if resp.StatusCode == 200 || strings.Contains(string(body[:n]), "TOP-SECRET") {
			t.Fatalf("%s served a file outside the theme: %d %q", url, resp.StatusCode, body[:n])
		}
	}
	resp, err := app.Test(httptest.NewRequest("GET", "/theme/assets/ok.txt", nil))
	if err != nil || resp.StatusCode != 200 {
		t.Fatalf("regular asset must still be served: %v %d", err, resp.StatusCode)
	}
}
