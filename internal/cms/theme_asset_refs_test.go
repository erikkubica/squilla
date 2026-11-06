package cms

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func writeAsset(t *testing.T, dir, rel, body string) {
	t.Helper()
	p := filepath.Join(dir, "assets", filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestVersionThemeAssetRefsInHTML(t *testing.T) {
	dir := t.TempDir()
	writeAsset(t, dir, "images/a.webp", "A")
	writeAsset(t, dir, "images/b.svg", "B")
	html := `<img src="/theme/assets/images/a.webp" srcset="/theme/assets/images/a.webp 1x, /theme/assets/images/b.svg 2x">` +
		`<link href="/theme/assets/images/a.webp?v=keep"><img src="/theme/assets/images/missing.png">` +
		`<div style="background:url(/theme/assets/images/b.svg#x)"></div>`
	out := VersionThemeAssetRefs(dir, html)
	ha, hb := fingerprintFile(filepath.Join(dir, "assets/images/a.webp")), fingerprintFile(filepath.Join(dir, "assets/images/b.svg"))
	for _, want := range []string{
		`src="/theme/assets/images/a.webp?v=` + ha + `"`,
		`/theme/assets/images/a.webp?v=` + ha + ` 1x`,
		`/theme/assets/images/b.svg?v=` + hb + ` 2x`,
		`/theme/assets/images/a.webp?v=keep"`,
		`src="/theme/assets/images/missing.png"`,
		`url(/theme/assets/images/b.svg?v=` + hb + `#x)`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("missing %q in\n%s", want, out)
		}
	}
}

func TestThemeCSSVersionsReferencesAndTracksChanges(t *testing.T) {
	dir := t.TempDir()
	writeAsset(t, dir, "images/p.webp", "one")
	writeAsset(t, dir, "fonts/f.woff2", "font")
	writeAsset(t, dir, "styles/x.css", `a{background:url("/theme/assets/images/p.webp")}`+
		`@font-face{src:url(../fonts/f.woff2) format("woff2")}b{background:url(data:image/png;base64,AA)}c{background:url(https://x.test/y.png)}`)
	body, gz, h1, ok := ThemeCSS(dir, "/styles/x.css")
	if !ok || len(gz) == 0 {
		t.Fatal("ThemeCSS failed")
	}
	s := string(body)
	if !strings.Contains(s, `url("/theme/assets/images/p.webp?v=`) || !strings.Contains(s, `url(../fonts/f.woff2?v=`) {
		t.Fatalf("refs not versioned: %s", s)
	}
	if !strings.Contains(s, "data:image/png;base64,AA") || !strings.Contains(s, "https://x.test/y.png)") {
		t.Fatalf("foreign urls changed: %s", s)
	}
	// Changing a referenced image changes the stylesheet's hash.
	time.Sleep(10 * time.Millisecond)
	writeAsset(t, dir, "images/p.webp", "two!")
	_, _, h2, _ := ThemeCSS(dir, "/styles/x.css")
	if h1 == h2 {
		t.Fatal("stylesheet hash did not change after a referenced file changed")
	}
	if got := versionThemeAssetURL(dir, "/theme/assets/styles/x.css"); got != "/theme/assets/styles/x.css?v="+h2 {
		t.Fatalf("css url version = %s, want hash %s", got, h2)
	}
}
