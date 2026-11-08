package cms

import (
	"os"
	"path/filepath"
	"testing"

	"squilla/internal/models"
	"squilla/internal/testutil"
)

func writeFiles(t *testing.T, root string, files map[string]string) {
	t.Helper()
	for rel, content := range files {
		p := filepath.Join(root, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(p, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

const seoOld = `{"name":"SEO","slug":"seo","version":"1.0.0",
  "plugins":[{"binary":"bin/seo"}],
  "public_routes":[{"method":"GET","path":"/robots.txt"}]}`

// Same version string, one more route — the erik-kubica.dev incident.
const seoNew = `{"name":"SEO","slug":"seo","version":"1.0.0",
  "plugins":[{"binary":"bin/seo"}],
  "public_routes":[{"method":"GET","path":"/robots.txt"},{"method":"GET","path":"/llms.txt"}]}`

func TestCompareShadow_SameVersionDifferentManifest(t *testing.T) {
	dir := t.TempDir()
	inst, bund := filepath.Join(dir, "data", "seo"), filepath.Join(dir, "bundled", "seo")
	writeFiles(t, inst, map[string]string{"extension.json": seoOld, "bin/seo": "old-binary"})
	writeFiles(t, bund, map[string]string{"extension.json": seoNew, "bin/seo": "new-binary"})

	sh, err := compareShadow(inst, bund, "extension.json", extensionRuntimeFile)
	if err != nil {
		t.Fatal(err)
	}
	if !sh.Differs || !sh.UpdateAvailable || sh.VersionCmp != 0 {
		t.Fatalf("want differs+update_available with equal versions, got %+v", sh)
	}
	if !hasDiff(sh.Differences, "manifest") || !hasDiff(sh.Differences, "files") || hasDiff(sh.Differences, "version") {
		t.Fatalf("differences = %v, want manifest+files (no version)", sh.Differences)
	}
}

func TestCompareShadow_IdenticalIgnoresSourceAndFormatting(t *testing.T) {
	dir := t.TempDir()
	inst, bund := filepath.Join(dir, "data", "seo"), filepath.Join(dir, "bundled", "seo")
	// Installed copy: re-formatted manifest, no Go source (a deploy zip).
	writeFiles(t, inst, map[string]string{
		"extension.json":          `{"slug":"seo","version":"1.0.0","name":"SEO","plugins":[{"binary":"bin/seo"}],"public_routes":[{"path":"/robots.txt","method":"GET"}]}`,
		"bin/seo":                 "bin",
		"admin-ui/dist/index.js":  "js",
		"scripts/extension.tengo": "x",
	})
	// Bundled copy: the image also carries plugin and admin-ui sources.
	writeFiles(t, bund, map[string]string{
		"extension.json":          seoOld,
		"bin/seo":                 "bin",
		"admin-ui/dist/index.js":  "js",
		"admin-ui/src/App.tsx":    "src",
		"admin-ui/package.json":   "{}",
		"scripts/extension.tengo": "x",
		"cmd/plugin/main.go":      "package main",
		"go.mod":                  "module x",
	})
	sh, err := compareShadow(inst, bund, "extension.json", extensionRuntimeFile)
	if err != nil {
		t.Fatal(err)
	}
	if sh.Differs || sh.UpdateAvailable {
		t.Fatalf("identical runtime content must not differ, got %+v", sh)
	}
}

func TestCompareShadow_InstalledNewerIsNotAnUpdate(t *testing.T) {
	dir := t.TempDir()
	inst, bund := filepath.Join(dir, "data", "x"), filepath.Join(dir, "bundled", "x")
	writeFiles(t, inst, map[string]string{"extension.json": `{"slug":"x","version":"1.10.0"}`})
	writeFiles(t, bund, map[string]string{"extension.json": `{"slug":"x","version":"1.9.2"}`})
	sh, err := compareShadow(inst, bund, "extension.json", extensionRuntimeFile)
	if err != nil {
		t.Fatal(err)
	}
	if !sh.Differs || sh.UpdateAvailable || sh.VersionCmp != 1 {
		t.Fatalf("newer operator install: want differs, no update, cmp=1; got %+v", sh)
	}
}

func TestCompareVersions(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"1.0.0", "1.0.0", 0},
		{"1.0", "1.0.0", 0},
		{"v1.2.0", "1.2.0", 0},
		{"1.2.9", "1.2.10", -1},
		{"2.0.0", "1.99.99", 1},
		{"1.0.0-beta", "1.0.0", 0},
		{"", "1.0.0", -1},
	}
	for _, c := range cases {
		if got := compareVersions(c.a, c.b); got != c.want {
			t.Errorf("compareVersions(%q,%q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestTreeFingerprint_DetectsContentChangeWithSameStat(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"extension.json": "{}", "bin/x": "aaaa"})
	h1, err := treeFingerprint(dir, "extension.json", extensionRuntimeFile)
	if err != nil {
		t.Fatal(err)
	}
	writeFiles(t, dir, map[string]string{"bin/x": "bbbbb"})
	h2, err := treeFingerprint(dir, "extension.json", extensionRuntimeFile)
	if err != nil {
		t.Fatal(err)
	}
	if h1 == h2 {
		t.Fatal("fingerprint must change when a runtime file changes")
	}
}

// newShadowLoader builds an ExtensionLoader over temp bundled/data dirs with
// the stale data copy shadowing a newer bundled copy.
func newShadowLoader(t *testing.T) (*ExtensionLoader, string, string) {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Extension{}); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	bundled, data := filepath.Join(root, "extensions"), filepath.Join(root, "data", "extensions")
	writeFiles(t, filepath.Join(bundled, "seo"), map[string]string{"extension.json": seoNew})
	writeFiles(t, filepath.Join(bundled, "forms"), map[string]string{"extension.json": `{"slug":"forms","name":"Forms","version":"1.0.0"}`})
	writeFiles(t, filepath.Join(data, "seo"), map[string]string{"extension.json": seoOld})
	l := NewExtensionLoader(db, bundled, data)
	l.ScanAndRegister()
	return l, bundled, data
}

func TestExtensionLoader_ReportsShadowedBundled(t *testing.T) {
	l, bundled, data := newShadowLoader(t)
	views, err := l.ListViews()
	if err != nil {
		t.Fatal(err)
	}
	byslug := map[string]ExtensionView{}
	for _, v := range views {
		byslug[v.Slug] = v
	}
	seo := byslug["seo"]
	if seo.Path != filepath.Join(data, "seo") {
		t.Fatalf("data copy must win, path = %s", seo.Path)
	}
	if seo.ShadowedBundled == nil || !seo.ShadowedBundled.UpdateAvailable {
		t.Fatalf("seo must report an available bundled update, got %+v", seo.ShadowedBundled)
	}
	if seo.ShadowedBundled.Path != filepath.Join(bundled, "seo") {
		t.Fatalf("bundled path = %s", seo.ShadowedBundled.Path)
	}
	if byslug["forms"].ShadowedBundled != nil {
		t.Fatal("a bundled-only extension shadows nothing")
	}
}

func TestExtensionHandler_AdoptBundled(t *testing.T) {
	l, bundled, data := newShadowLoader(t)
	h := NewExtensionHandler(l.db, l)

	res, err := h.AdoptBundled("seo")
	if err != nil {
		t.Fatal(err)
	}
	if res.Path != filepath.Join(bundled, "seo") {
		t.Fatalf("result path = %s", res.Path)
	}
	if _, err := os.Stat(filepath.Join(data, "seo")); !os.IsNotExist(err) {
		t.Fatalf("installed copy must be removed, stat err = %v", err)
	}
	ext, err := l.GetBySlug("seo")
	if err != nil {
		t.Fatal(err)
	}
	if ext.Path != filepath.Join(bundled, "seo") || string(ext.Manifest) != seoNew {
		t.Fatalf("row must now point at the bundled copy, got path=%s", ext.Path)
	}
	if l.View(*ext).ShadowedBundled != nil {
		t.Fatal("after adopting, nothing is shadowed")
	}
	// A bundled-only extension has nothing to adopt.
	if _, err := h.AdoptBundled("forms"); err == nil || err.Error() != "NOT_SHADOWED" {
		t.Fatalf("forms: want NOT_SHADOWED, got %v", err)
	}
}

func TestExtensionLoader_VanishedDataCopyFallsBackToBundled(t *testing.T) {
	l, bundled, data := newShadowLoader(t)
	if err := os.RemoveAll(filepath.Join(data, "seo")); err != nil {
		t.Fatal(err)
	}
	l.ScanAndRegister()
	ext, err := l.GetBySlug("seo")
	if err != nil {
		t.Fatal(err)
	}
	if ext.Path != filepath.Join(bundled, "seo") {
		t.Fatalf("row must fall back to the bundled copy, path = %s", ext.Path)
	}
}

func hasDiff(xs []string, s string) bool {
	for _, x := range xs {
		if x == s {
			return true
		}
	}
	return false
}

func TestThemeMgmt_ShadowAndAdoptBundled(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Theme{}); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	bundled, data := filepath.Join(root, "themes"), filepath.Join(root, "data", "themes")
	writeFiles(t, filepath.Join(bundled, "default"), map[string]string{
		"theme.json":          `{"name":"Default","slug":"default","version":"1.0.0"}`,
		"layouts/base.html":   "<html>new</html>",
		"node_modules/x/a.js": "ignored",
	})
	writeFiles(t, filepath.Join(data, "default"), map[string]string{
		"theme.json":        `{"name":"Default","slug":"default","version":"1.0.0"}`,
		"layouts/base.html": "<html>old</html>",
	})
	svc := NewThemeMgmtService(db, nil, bundled, data, nil)
	svc.ScanAndRegister()

	views, err := svc.ListViews()
	if err != nil || len(views) != 1 {
		t.Fatalf("views = %v, err = %v", views, err)
	}
	sh := views[0].ShadowedBundled
	if sh == nil || !sh.UpdateAvailable || !hasDiff(sh.Differences, "files") || hasDiff(sh.Differences, "manifest") {
		t.Fatalf("want a files-only bundled update, got %+v", sh)
	}

	res, err := svc.AdoptBundled(views[0].ID)
	if err != nil {
		t.Fatal(err)
	}
	if res.Path != filepath.Join(bundled, "default") || res.Activated {
		t.Fatalf("result = %+v", res)
	}
	if _, err := os.Stat(filepath.Join(data, "default")); !os.IsNotExist(err) {
		t.Fatalf("installed theme copy must be removed, stat err = %v", err)
	}
	th, _ := svc.GetByID(views[0].ID)
	if th.Path != filepath.Join(bundled, "default") || svc.BundledShadow(*th) != nil {
		t.Fatalf("theme must now run from the bundled copy, path = %s", th.Path)
	}
}
