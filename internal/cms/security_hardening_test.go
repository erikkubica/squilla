package cms

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/models"
	"squilla/internal/secrets"
	"squilla/internal/testutil"
)

// --- confinement helper ----------------------------------------------------

func TestConfinedPath(t *testing.T) {
	root := t.TempDir()
	base := filepath.Join(root, "theme")
	writeFiles(t, root, map[string]string{
		"theme/layouts/a.html": "a",
		"secret.txt":           "s",
		"theme-evil/x.html":    "x",
	})
	mustSymlink(t, filepath.Join(root, "secret.txt"), filepath.Join(base, "layouts", "link.html"))
	mustSymlink(t, filepath.Join(base, "layouts", "a.html"), filepath.Join(base, "layouts", "inner.html"))
	mustSymlink(t, root, filepath.Join(base, "updir"))

	if _, err := confinedFile(base, "layouts/a.html"); err != nil {
		t.Fatalf("regular file inside base: %v", err)
	}
	if _, err := confinedFile(base, "layouts/inner.html"); err != nil {
		t.Fatalf("symlink to a file inside base must be allowed: %v", err)
	}
	for _, rel := range []string{"../secret.txt", "layouts/../../secret.txt", "../theme-evil/x.html", "layouts/link.html", "updir/secret.txt"} {
		if _, err := confinedFile(base, rel); !errors.Is(err, errPathEscape) {
			t.Errorf("%q must be rejected as an escape, got %v", rel, err)
		}
	}
	if _, err := confinedFile(base, "layouts"); err == nil {
		t.Error("a directory is not a regular file")
	}
	if _, err := confinedFile(base, "missing.html"); !os.IsNotExist(err) {
		t.Errorf("missing file: want not-exist, got %v", err)
	}
}

func mustSymlink(t *testing.T, target, link string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(link), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(target, link); err != nil {
		t.Fatal(err)
	}
}

// --- theme manifest paths ----------------------------------------------------

// TestThemeLoader_ManifestPathsConfined: layouts[].file / partials[].file
// pointing outside the theme (../ or a symlink) must not be read into the
// layouts table, where they would render publicly.
func TestThemeLoader_ManifestPathsConfined(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Layout{}, &models.LayoutBlock{}, &models.BlockType{}, &models.Template{}, &models.Theme{}); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	themeDir := filepath.Join(root, "themes", "evil")
	writeFiles(t, root, map[string]string{
		"secret.html": "TOP-SECRET",
		"themes/evil/theme.json": `{"name":"Evil","slug":"evil","version":"1",
			"layouts":[{"slug":"good","name":"Good","file":"good.html"},
			           {"slug":"dotdot","name":"Dotdot","file":"../../../secret.html"},
			           {"slug":"linked","name":"Linked","file":"link.html"}],
			"partials":[{"slug":"p-dotdot","name":"P","file":"../../../secret.html"}]}`,
		"themes/evil/layouts/good.html": "<html>ok</html>",
	})
	mustSymlink(t, filepath.Join(root, "secret.html"), filepath.Join(themeDir, "layouts", "link.html"))

	tl := NewThemeLoader(db, NewThemeAssetRegistry(), nil)
	if err := tl.LoadTheme(themeDir); err != nil {
		t.Fatal(err)
	}
	var layouts []models.Layout
	db.Find(&layouts)
	var partials []models.LayoutBlock
	db.Find(&partials)
	if len(layouts) != 1 || layouts[0].Slug != "good" {
		t.Fatalf("only the confined layout may register, got %d layouts", len(layouts))
	}
	for _, l := range layouts {
		if strings.Contains(l.TemplateCode, "TOP-SECRET") {
			t.Fatal("host file content was loaded into a layout")
		}
	}
	if len(partials) != 0 {
		t.Fatalf("../ partial must not register, got %d", len(partials))
	}
}

func TestThemeAssetsPayload_Confined(t *testing.T) {
	root := t.TempDir()
	writeFiles(t, root, map[string]string{"secret.png": "s", "theme/assets/ok.png": "ok"})
	got := themeAssetsPayload(filepath.Join(root, "theme"), []ThemeMediaAssetDef{
		{Key: "ok", Src: "ok.png"}, {Key: "bad", Src: "../../secret.png"},
	})
	if len(got) != 1 || got[0]["key"] != "ok" {
		t.Fatalf("only the confined asset may be offered for import, got %v", got)
	}
}

// --- theme install / scan slugs ----------------------------------------------

func newThemeSvc(t *testing.T) (*ThemeMgmtService, string) {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Theme{}); err != nil {
		t.Fatal(err)
	}
	data := filepath.Join(t.TempDir(), "data", "themes")
	return NewThemeMgmtService(db, nil, "", data, nil), data
}

func TestInstallClonedTheme_TraversalSlugRejected(t *testing.T) {
	svc, data := newThemeSvc(t)
	sentinel := filepath.Join(filepath.Dir(data), "victim")
	writeFiles(t, sentinel, map[string]string{"keep.txt": "keep"})

	clone := t.TempDir()
	writeFiles(t, clone, map[string]string{"theme.json": `{"name":"x","slug":"../victim"}`})
	if _, err := svc.installClonedTheme(clone, "https://example.com/x.git", "main", ""); err == nil {
		t.Fatal("traversal slug must be rejected")
	}
	if b, err := os.ReadFile(filepath.Join(sentinel, "keep.txt")); err != nil || string(b) != "keep" {
		t.Fatalf("sibling dir outside the data dir was touched: %v", err)
	}
}

func TestInstallClonedTheme_ExistingSlugRefusedBeforeDisk(t *testing.T) {
	svc, data := newThemeSvc(t)
	live := filepath.Join(data, "live")
	writeFiles(t, live, map[string]string{"theme.json": `{"name":"Live","slug":"live"}`})
	if err := svc.db.Create(&models.Theme{Slug: "live", Name: "Live", Path: live, Source: "upload"}).Error; err != nil {
		t.Fatal(err)
	}
	clone := t.TempDir()
	writeFiles(t, clone, map[string]string{"theme.json": `{"name":"Other","slug":"live"}`})
	if _, err := svc.installClonedTheme(clone, "https://example.com/x.git", "main", ""); err == nil {
		t.Fatal("re-installing an existing slug from git must fail")
	}
	if _, err := os.Stat(filepath.Join(live, "theme.json")); err != nil {
		t.Fatalf("the live theme dir must be left alone: %v", err)
	}
}

func TestThemeScan_InvalidSlugSkipped(t *testing.T) {
	svc, data := newThemeSvc(t)
	writeFiles(t, data, map[string]string{
		"bad/theme.json":  `{"name":"Bad","slug":"../../etc"}`,
		"good/theme.json": `{"name":"Good","slug":"good"}`,
	})
	svc.ScanAndRegister()
	var themes []models.Theme
	svc.db.Find(&themes)
	if len(themes) != 1 || themes[0].Slug != "good" {
		t.Fatalf("invalid on-disk slug must be skipped, got %+v", themes)
	}
}

// --- extension loader trust ----------------------------------------------------

func newTrustLoader(t *testing.T) (*ExtensionLoader, string, string) {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Extension{}); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	bundled, data := filepath.Join(root, "extensions"), filepath.Join(root, "data", "extensions")
	return NewExtensionLoader(db, bundled, data), bundled, data
}

func TestExtensionLoader_InvalidSlugSkipped(t *testing.T) {
	l, _, data := newTrustLoader(t)
	writeFiles(t, data, map[string]string{"x/extension.json": `{"slug":"../../x","name":"X"}`})
	l.ScanAndRegister()
	if exts, _ := l.List(); len(exts) != 0 {
		t.Fatalf("invalid slug must not register, got %+v", exts)
	}
}

// TestExtensionLoader_GetActiveSkipsUntrustedPath: a row whose path was
// pointed outside both extension dirs (DB tamper) must not be returned —
// main.go runs its migrations, scripts and plugin binaries.
func TestExtensionLoader_GetActiveSkipsUntrustedPath(t *testing.T) {
	l, bundled, _ := newTrustLoader(t)
	writeFiles(t, bundled, map[string]string{"good/extension.json": `{"slug":"good","name":"Good","auto_activate":true}`})
	l.ScanAndRegister()
	outside := t.TempDir()
	writeFiles(t, outside, map[string]string{"extension.json": `{"slug":"evil"}`})
	if err := l.db.Create(&models.Extension{Slug: "evil", Name: "Evil", Path: outside, IsActive: true, Manifest: models.JSONB(`{}`)}).Error; err != nil {
		t.Fatal(err)
	}
	if err := l.db.Create(&models.Extension{Slug: "dotdot", Name: "Dotdot", Path: filepath.Join(bundled, "..", ".."), IsActive: true, Manifest: models.JSONB(`{}`)}).Error; err != nil {
		t.Fatal(err)
	}
	exts, err := l.GetActive()
	if err != nil {
		t.Fatal(err)
	}
	if len(exts) != 1 || exts[0].Slug != "good" {
		t.Fatalf("only the bundled extension may be returned, got %d rows", len(exts))
	}
}

func TestExtensionLoader_AutoActivateBundledOnly(t *testing.T) {
	l, bundled, data := newTrustLoader(t)
	writeFiles(t, bundled, map[string]string{"b/extension.json": `{"slug":"b","name":"B","auto_activate":true}`})
	writeFiles(t, data, map[string]string{"d/extension.json": `{"slug":"d","name":"D","auto_activate":true}`})
	l.ScanAndRegister()
	b, _ := l.GetBySlug("b")
	d, _ := l.GetBySlug("d")
	if b == nil || !b.IsActive {
		t.Fatal("bundled auto_activate must still activate")
	}
	if d == nil || d.IsActive {
		t.Fatal("operator-installed auto_activate must be ignored")
	}
}

// TestExtensionLoader_OwnedTablesSanitized: data_owned_tables can't claim
// kernel tables or another active extension's tables.
func TestExtensionLoader_OwnedTablesSanitized(t *testing.T) {
	l, bundled, data := newTrustLoader(t)
	writeFiles(t, bundled, map[string]string{"forms/extension.json": `{"slug":"forms","name":"F","priority":90,"data_owned_tables":["forms","form_submissions"]}`})
	writeFiles(t, data, map[string]string{"thief/extension.json": `{"slug":"thief","name":"T","priority":10,"data_owned_tables":["form_submissions","content_nodes","users","Templates","thief_data"]}`})
	l.ScanAndRegister()
	for _, s := range []string{"forms", "thief"} {
		if err := l.Activate(s); err != nil {
			t.Fatal(err)
		}
	}
	exts, err := l.GetActive()
	if err != nil {
		t.Fatal(err)
	}
	owned := map[string]map[string]bool{}
	for _, e := range exts {
		var m ExtensionManifest
		if err := jsonUnmarshal(e.Manifest, &m); err != nil {
			t.Fatal(err)
		}
		owned[e.Slug] = m.OwnedTablesMap()
	}
	if !owned["forms"]["forms"] || !owned["forms"]["form_submissions"] {
		t.Fatalf("bundled owner keeps its tables, got %v", owned["forms"])
	}
	if len(owned["thief"]) != 1 || !owned["thief"]["thief_data"] {
		t.Fatalf("thief may keep only its own table, got %v", owned["thief"])
	}
	if got := l.GetActiveBySlug("thief"); got == nil || strings.Contains(string(got.Manifest), "content_nodes") {
		t.Fatal("GetActiveBySlug (HotActivate path) must return the sanitized manifest")
	}
}

// --- zip extraction ------------------------------------------------------------

func TestCheckZipArchive_DuplicatesAndEntryCap(t *testing.T) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, name := range []string{"extension.json", "a.txt", "./extension.json"} {
		w, _ := zw.Create(name)
		_, _ = w.Write([]byte("{}"))
	}
	_ = zw.Close()
	if err := checkZipArchive(readZip(t, buf.Bytes())); err == nil {
		t.Fatal("duplicate (normalised) entry names must be rejected")
	}

	r := &zip.Reader{File: make([]*zip.File, maxZipEntries+1)}
	for i := range r.File {
		r.File[i] = &zip.File{FileHeader: zip.FileHeader{Name: "d/"}}
	}
	if err := checkZipArchive(r); err == nil {
		t.Fatal("entry count cap must be enforced")
	}
}

func TestExtractZipFile_TotalBudgetAndModeMask(t *testing.T) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	h := &zip.FileHeader{Name: "bin/tool", Method: zip.Store}
	h.SetMode(os.ModeSetuid | os.ModeSetgid | 0o777)
	w, _ := zw.CreateHeader(h)
	_, _ = w.Write(bytes.Repeat([]byte("x"), 100))
	_ = zw.Close()
	zr := readZip(t, buf.Bytes())
	dir := t.TempDir()

	dest := filepath.Join(dir, "tool")
	if err := extractZipFile(zr.File[0], dest, &zipBudget{remaining: 1000}); err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(dest)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode()&(os.ModeSetuid|os.ModeSetgid) != 0 || info.Mode().Perm()&0o022 != 0 {
		t.Fatalf("setuid/setgid/group-world-write bits must be stripped, got %v", info.Mode())
	}

	if err := extractZipFile(zr.File[0], filepath.Join(dir, "tool2"), &zipBudget{remaining: 50}); err == nil {
		t.Fatal("total extracted-size budget must be enforced")
	}
}

func TestCopyDir_SkipsSymlinks(t *testing.T) {
	root := t.TempDir()
	writeFiles(t, root, map[string]string{"secret": "TOP-SECRET", "src/ok.txt": "ok"})
	mustSymlink(t, filepath.Join(root, "secret"), filepath.Join(root, "src", "leak.txt"))
	dst := filepath.Join(root, "dst")
	if err := copyDir(filepath.Join(root, "src"), dst); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Lstat(filepath.Join(dst, "leak.txt")); !os.IsNotExist(err) {
		t.Fatal("symlinks must not be copied (their target would be materialised)")
	}
	if _, err := os.Stat(filepath.Join(dst, "ok.txt")); err != nil {
		t.Fatal(err)
	}
}

func TestInstallFromZip_PluginBinaryOutsideRejected(t *testing.T) {
	l, _, data := newTrustLoader(t)
	h := NewExtensionHandler(l.db, l)
	zipData := buildZip(t, map[string]string{
		"extension.json": `{"slug":"esc","name":"E","plugins":[{"binary":"../../outside"}]}`,
	})
	writeFiles(t, filepath.Dir(data), map[string]string{"outside": "x"})
	if _, err := h.InstallFromZip(zipData); err == nil {
		t.Fatal("a plugin binary path outside the extension dir must fail the install")
	}
}

// --- migrations / activation ----------------------------------------------------

func migrationsDB(t *testing.T) *gorm.DB {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.Exec(`CREATE TABLE extension_migrations (extension_slug TEXT, filename TEXT)`).Error; err != nil {
		t.Fatal(err)
	}
	return db
}

func TestRunExtensionMigrations_FailureRollsBack(t *testing.T) {
	db := migrationsDB(t)
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{
		"migrations/001_ok.sql":  `CREATE TABLE m_one (id INTEGER);`,
		"migrations/002_bad.sql": `CREATE TABLE m_two (id INTEGER); INSERT INTO no_such_table VALUES (1);`,
	})
	if err := RunExtensionMigrations(db, dir, "m"); err == nil {
		t.Fatal("failing migration must return an error")
	}
	var n int64
	db.Raw(`SELECT count(*) FROM extension_migrations WHERE filename = '002_bad.sql'`).Scan(&n)
	if n != 0 {
		t.Fatal("a failed migration must not be recorded as applied")
	}
	db.Raw(`SELECT count(*) FROM sqlite_master WHERE name = 'm_two'`).Scan(&n)
	if n != 0 {
		t.Fatal("a failed migration's partial DDL must be rolled back")
	}
	db.Raw(`SELECT count(*) FROM extension_migrations WHERE filename = '001_ok.sql'`).Scan(&n)
	if n != 1 {
		t.Fatal("the preceding successful migration stays recorded")
	}
}

func TestHotActivate_AbortsOnMigrationFailure(t *testing.T) {
	l, bundled, _ := newTrustLoader(t)
	if err := l.db.Exec(`CREATE TABLE extension_migrations (extension_slug TEXT, filename TEXT)`).Error; err != nil {
		t.Fatal(err)
	}
	writeFiles(t, bundled, map[string]string{
		"broken/extension.json":         `{"slug":"broken","name":"B"}`,
		"broken/migrations/001_bad.sql": `INSERT INTO no_such_table VALUES (1);`,
	})
	l.ScanAndRegister()
	pm := NewPluginManager(nil, nil, nil)
	h := NewExtensionHandler(l.db, l)
	h.SetPluginManager(pm)
	if err := h.HotActivate("broken"); err == nil {
		t.Fatal("activation must fail when migrations fail")
	}
	if ext, _ := l.GetBySlug("broken"); ext == nil || ext.IsActive {
		t.Fatal("extension must be left inactive after a migration failure")
	}
}

// --- git ------------------------------------------------------------------------

func TestValidateGitBranch(t *testing.T) {
	for _, ok := range []string{"main", "release/1.2", "feature_x-y", "v1.0.0"} {
		if err := validateGitBranch(ok); err != nil {
			t.Errorf("%q should be valid: %v", ok, err)
		}
	}
	for _, bad := range []string{"", "--upload-pack=touch /tmp/x", "-x", "a..b", "a b", "a//b", "x/", "x.lock", "x;rm", "$(id)"} {
		if err := validateGitBranch(bad); err == nil {
			t.Errorf("%q must be rejected", bad)
		}
	}
}

func TestSafeGitCommands(t *testing.T) {
	if !strings.Contains(strings.Join(safeGitFlags(), " "), "core.symlinks=false") {
		t.Fatal("git must check symlinks out as plain files")
	}
	cmd, cleanup, err := buildSafeGitPull("/tmp/t", "main", "")
	if err != nil {
		t.Fatal(err)
	}
	defer cleanup()
	args := strings.Join(cmd.Args, " ")
	if !strings.Contains(args, "pull -- origin main") {
		t.Fatalf("branch must follow --, got %s", args)
	}
	if _, _, err := buildSafeGitPull("/tmp/t", "--upload-pack=x", ""); err == nil {
		t.Fatal("option-shaped branch must be refused")
	}
	if _, _, err := buildSafeGitClone("https://example.com/r.git", "-b", "", "/tmp/d"); err == nil {
		t.Fatal("option-shaped branch must be refused on clone")
	}
}

func TestWebhookSecretQuery_PortableQuoting(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	stmt := webhookSecretQuery(db.Session(&gorm.Session{DryRun: true})).First(&models.SiteSetting{}).Statement
	sql := stmt.SQL.String()
	if strings.Contains(sql, "`key` = ?") || !strings.Contains(sql, `"key" = ?`) {
		t.Fatalf("webhook secret lookup must use ANSI quoting, got %s", sql)
	}
}

func TestAdminSafeError(t *testing.T) {
	err := errors.New("git clone failed: fatal: could not read /data/themes/x: exit status 128")
	if got := adminSafeError(err); strings.Contains(got, "/data") || got != "git clone failed" {
		t.Fatalf("got %q", got)
	}
}

// --- extension admin endpoints ---------------------------------------------------

func TestExtensionSettings_SecretsEncryptedAndMasked(t *testing.T) {
	l, bundled, _ := newTrustLoader(t)
	if err := l.db.AutoMigrate(&models.SiteSetting{}); err != nil {
		t.Fatal(err)
	}
	writeFiles(t, bundled, map[string]string{"mail/extension.json": `{"slug":"mail","name":"M",
		"settings_schema":{"password":{"type":"string","sensitive":true},"api_key":{"type":"string"},"host":{"type":"string"}}}`})
	l.ScanAndRegister()
	key, _ := secrets.GenerateKey()
	svc, err := secrets.NewFromBase64(key)
	if err != nil {
		t.Fatal(err)
	}
	h := NewExtensionHandler(l.db, l)
	h.SetSecrets(svc)
	app := fiber.New()
	app.Put("/x/:slug/settings", h.UpdateSettings)
	app.Get("/x/:slug/settings", h.GetSettings)

	put := func(body string) {
		req := httptest.NewRequest("PUT", "/x/mail/settings", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		if err != nil || resp.StatusCode != 200 {
			t.Fatalf("PUT: %v %v", err, resp.StatusCode)
		}
	}
	put(`{"api_key":"re_live_123","password":"pw","host":"smtp.example.com"}`)

	var row models.SiteSetting
	l.db.Where(`"key" = ?`, "ext.mail.api_key").First(&row)
	if row.Value == nil || !secrets.IsEncrypted(*row.Value) {
		t.Fatal("secret-shaped extension setting must be encrypted at rest")
	}
	resp, _ := app.Test(httptest.NewRequest("GET", "/x/mail/settings", nil))
	body, _ := io.ReadAll(resp.Body)
	if strings.Contains(string(body), "re_live_123") || strings.Contains(string(body), `"pw"`) || strings.Contains(string(body), "gcm") {
		t.Fatalf("secrets must be masked in GET, got %s", body)
	}
	if !strings.Contains(string(body), "smtp.example.com") {
		t.Fatalf("ordinary settings must be returned, got %s", body)
	}
	// Round-tripping the mask keeps the stored secret.
	put(`{"api_key":"***","password":"***"}`)
	var pw models.SiteSetting
	l.db.Where(`"key" = ?`, "ext.mail.password").First(&pw)
	if pw.Value == nil || !secrets.IsEncrypted(*pw.Value) {
		t.Fatal("ext.<slug>.password must be encrypted at rest")
	}
	if got, err := svc.Decrypt(*pw.Value); err != nil || got != "pw" {
		t.Fatalf("masked round-trip must not overwrite the stored secret, got %q %v", got, err)
	}
}

func TestServeAsset_SymlinkRejectedAndNosniff(t *testing.T) {
	l, bundled, _ := newTrustLoader(t)
	root := filepath.Dir(bundled)
	writeFiles(t, root, map[string]string{
		"secret.js":                            "TOP-SECRET",
		"extensions/ui/extension.json":         `{"slug":"ui","name":"UI"}`,
		"extensions/ui/admin-ui/dist/index.js": "export{}",
	})
	mustSymlink(t, filepath.Join(root, "secret.js"), filepath.Join(bundled, "ui", "admin-ui", "dist", "leak.js"))
	l.ScanAndRegister()
	h := NewExtensionHandler(l.db, l)
	app := fiber.New()
	app.Get("/e/:slug/assets/*", h.ServeAsset)

	resp, _ := app.Test(httptest.NewRequest("GET", "/e/ui/assets/index.js", nil))
	if resp.StatusCode != 200 || resp.Header.Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("asset: %d nosniff=%q", resp.StatusCode, resp.Header.Get("X-Content-Type-Options"))
	}
	resp, _ = app.Test(httptest.NewRequest("GET", "/e/ui/assets/leak.js", nil))
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == 200 || strings.Contains(string(body), "TOP-SECRET") {
		t.Fatalf("symlinked asset outside dist served: %d", resp.StatusCode)
	}
}

func TestBrowseFiles_SymlinkOutsideRejected(t *testing.T) {
	root := t.TempDir()
	writeFiles(t, root, map[string]string{"secret": "TOP-SECRET", "theme/ok.txt": "ok"})
	mustSymlink(t, filepath.Join(root, "secret"), filepath.Join(root, "theme", "leak.txt"))
	mustSymlink(t, root, filepath.Join(root, "theme", "up"))
	for _, p := range []string{"leak.txt", "up/secret", "../secret"} {
		if _, err := BrowseFilesInDir(filepath.Join(root, "theme"), p); err == nil || err.Error() != "INVALID_PATH" {
			t.Errorf("%q: want INVALID_PATH, got %v", p, err)
		}
	}
	if _, err := BrowseFilesInDir(filepath.Join(root, "theme"), "ok.txt"); err != nil {
		t.Fatal(err)
	}
}

func jsonUnmarshal(b []byte, v any) error { return json.Unmarshal(b, v) }
