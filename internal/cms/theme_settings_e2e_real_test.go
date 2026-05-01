package cms

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/models"
	"squilla/internal/testutil"
)

// These tests model real operator workflows end-to-end. Each one walks
// through "operator does X in admin → visitor lands on the public site
// → assert the rendered context reflects X correctly" because that's
// the path real users hit. Textbook unit tests on individual functions
// don't catch the kind of bugs we saw last week (two code paths reading
// settings differently); these do.

// TestE2E_OperatorSavesAccent_VisitorSeesIt is the workflow the squilla
// theme operator actually performs: pick an accent color in admin,
// reload the live site, see the new color. The full path is admin save
// (PUT /theme-settings/appearance) → DB row at language_code='' → public
// render context build (BuildThemeSettingsContextForLocale) → template
// reads .theme_settings.appearance.accent.
//
// This test crosses both code paths the real bug spanned. If either
// regresses, this fails. The earlier round-trip test only covered
// admin save→read; this one walks the full distance.
func TestE2E_OperatorSavesAccent_VisitorSeesIt(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	mustCreateLang(t, db, "en", true)

	tt := true
	ff := false
	branding := ThemeSettingsPage{
		Slug: "branding",
		Fields: []ThemeSettingsField{
			{Key: "tagline", Type: "text", Translatable: &tt},
		},
	}
	appearance := ThemeSettingsPage{
		Slug: "appearance",
		Fields: []ThemeSettingsField{
			{Key: "accent", Type: "select", Translatable: &ff, Default: jsonRaw(`"teal"`)},
		},
	}
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{branding, appearance})

	api := newDBSettingsAPI(db)
	h := NewThemeSettingsHandler(reg, api, db, nil, nil)
	app := fiber.New()
	app.Put("/theme-settings/:page", h.Save)

	// 1. Operator saves accent=violet via admin (X-Admin-Language='en').
	saveJSON(t, app, "PUT", "/theme-settings/appearance", "en",
		`{"values":{"accent":"violet"}}`)

	// 2. Visitor lands on /en — render context is built for that locale.
	ctxEn, err := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "en")
	if err != nil {
		t.Fatalf("build en context: %v", err)
	}
	if v, _ := ctxEn["appearance"]["accent"].(string); v != "violet" {
		t.Errorf("en visitor sees stale accent: got %v, want %q", ctxEn["appearance"]["accent"], "violet")
	}

	// 3. Visitor in a future-added locale — global field must still
	//    surface even though no per-locale row exists.
	mustCreateLang(t, db, "sk", false)
	ctxSk, err := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "sk")
	if err != nil {
		t.Fatalf("build sk context: %v", err)
	}
	if v, _ := ctxSk["appearance"]["accent"].(string); v != "violet" {
		t.Errorf("sk visitor (regression — global field invisible per-locale): got %v, want %q",
			ctxSk["appearance"]["accent"], "violet")
	}
}

// TestE2E_TranslatableLocaleFallback covers the translation-coverage
// hole every multilingual site hits at some point: operator translates
// the tagline into English first, then a Slovak visitor lands before
// the Slovak translation is done. The site should show the English
// tagline (default-language fallback), NOT an empty string.
func TestE2E_TranslatableLocaleFallback(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	mustCreateLang(t, db, "en", true)
	mustCreateLang(t, db, "sk", false)

	tt := true
	branding := ThemeSettingsPage{
		Slug: "branding",
		Fields: []ThemeSettingsField{
			{Key: "tagline", Type: "text", Translatable: &tt, Default: jsonRaw(`""`)},
		},
	}
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{branding})

	api := newDBSettingsAPI(db)
	h := NewThemeSettingsHandler(reg, api, db, nil, nil)
	app := fiber.New()
	app.Put("/theme-settings/:page", h.Save)

	saveJSON(t, app, "PUT", "/theme-settings/branding", "en",
		`{"values":{"tagline":"AI does the work"}}`)

	// English visitor — exact value.
	ctxEn, _ := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "en")
	if v, _ := ctxEn["branding"]["tagline"].(string); v != "AI does the work" {
		t.Errorf("en visitor: got %v, want %q", ctxEn["branding"]["tagline"], "AI does the work")
	}

	// Slovak visitor — no Slovak override, must fall back to English
	// (the default language). Empty string would mean "site looks half
	// translated"; that's the failure mode operators complain about.
	ctxSk, _ := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "sk")
	if v, _ := ctxSk["branding"]["tagline"].(string); v != "AI does the work" {
		t.Errorf("sk visitor (locale fallback): got %v, want en value %q",
			ctxSk["branding"]["tagline"], "AI does the work")
	}
}

// TestE2E_SwitchAdminLocale_PreservesGlobals models the operator who
// edits the English copy, switches the admin language picker to Slovak,
// and starts editing translations. Global fields (accent, toggles)
// must stay visible — flipping the picker shouldn't make them appear
// empty, or the operator will save the empty value over the real one.
func TestE2E_SwitchAdminLocale_PreservesGlobals(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	mustCreateLang(t, db, "en", true)
	mustCreateLang(t, db, "sk", false)

	tt := true
	ff := false
	header := ThemeSettingsPage{
		Slug: "header",
		Fields: []ThemeSettingsField{
			{Key: "cta_label", Type: "text", Translatable: &tt, Default: jsonRaw(`""`)},
			{Key: "show_pill", Type: "toggle", Translatable: &ff, Default: jsonRaw(`false`)},
		},
	}
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{header})

	api := newDBSettingsAPI(db)
	h := NewThemeSettingsHandler(reg, api, db, nil, nil)
	app := fiber.New()
	app.Get("/theme-settings/:page", h.Get)
	app.Put("/theme-settings/:page", h.Save)

	// Operator saves both fields while editing in 'en'.
	saveJSON(t, app, "PUT", "/theme-settings/header", "en",
		`{"values":{"cta_label":"docker compose up","show_pill":true}}`)

	// Operator switches the admin picker to 'sk' and re-fetches the
	// page. The global toggle MUST still show its stored value.
	skValues := decodeThemeSettingsGetForPage(t, app, "sk", "header")
	if v := strFromValue(skValues["cta_label"]); v != "docker compose up" {
		t.Errorf("translatable cta_label fallback in sk: got %q, want en value %q", v, "docker compose up")
	}
	pillVal, ok := skValues["show_pill"].Value.(bool)
	if !ok {
		t.Fatalf("show_pill not bool: %T = %v", skValues["show_pill"].Value, skValues["show_pill"].Value)
	}
	if !pillVal {
		t.Errorf("global toggle invisible after admin locale switch: got false, want true")
	}
}

// TestE2E_TypedFieldsRoundTrip covers the silent type-corruption class
// of bug. We round-trip toggle (bool), number (float64), and select
// (string) through save → public render context. Each must come back
// in its proper typed form so templates calling `if .show_pill` and
// `range $i := seq .count` get sensible inputs.
func TestE2E_TypedFieldsRoundTrip(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	mustCreateLang(t, db, "en", true)

	ff := false
	features := ThemeSettingsPage{
		Slug: "features",
		Fields: []ThemeSettingsField{
			{Key: "show_pill", Type: "toggle", Translatable: &ff, Default: jsonRaw(`false`)},
			{Key: "posts_per_page", Type: "number", Translatable: &ff, Default: jsonRaw(`6`)},
			{Key: "accent", Type: "select", Translatable: &ff, Default: jsonRaw(`"teal"`)},
		},
	}
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{features})

	api := newDBSettingsAPI(db)
	h := NewThemeSettingsHandler(reg, api, db, nil, nil)
	app := fiber.New()
	app.Put("/theme-settings/:page", h.Save)

	saveJSON(t, app, "PUT", "/theme-settings/features", "en",
		`{"values":{"show_pill":true,"posts_per_page":12,"accent":"violet"}}`)

	ctx, _ := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "en")
	feat := ctx["features"]

	if b, ok := feat["show_pill"].(bool); !ok || !b {
		t.Errorf("toggle: got %T %v, want bool true", feat["show_pill"], feat["show_pill"])
	}
	if n, ok := feat["posts_per_page"].(float64); !ok || n != 12 {
		t.Errorf("number: got %T %v, want float64 12", feat["posts_per_page"], feat["posts_per_page"])
	}
	if s, ok := feat["accent"].(string); !ok || s != "violet" {
		t.Errorf("select: got %T %v, want string \"violet\"", feat["accent"], feat["accent"])
	}
}

// TestE2E_DefaultsFlowThroughEverything is the fresh-install path:
// operator activates a theme, has not saved any settings yet, public
// site renders. Defaults declared in the field schema must surface in
// the render context — otherwise the site looks broken until the
// operator clicks save on every settings page.
func TestE2E_DefaultsFlowThroughEverything(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	mustCreateLang(t, db, "en", true)

	tt := true
	ff := false
	branding := ThemeSettingsPage{
		Slug: "branding",
		Fields: []ThemeSettingsField{
			{Key: "name", Type: "text", Translatable: &tt, Default: jsonRaw(`"Squilla"`)},
			{Key: "accent", Type: "select", Translatable: &ff, Default: jsonRaw(`"violet"`)},
			{Key: "show_pill", Type: "toggle", Translatable: &ff, Default: jsonRaw(`true`)},
		},
	}
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{branding})

	api := newDBSettingsAPI(db)
	ctx, err := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "en")
	if err != nil {
		t.Fatalf("build context: %v", err)
	}
	if v, _ := ctx["branding"]["name"].(string); v != "Squilla" {
		t.Errorf("translatable default: got %v, want %q", ctx["branding"]["name"], "Squilla")
	}
	if v, _ := ctx["branding"]["accent"].(string); v != "violet" {
		t.Errorf("global string default: got %v, want %q", ctx["branding"]["accent"], "violet")
	}
	if b, _ := ctx["branding"]["show_pill"].(bool); !b {
		t.Errorf("global bool default: got %v, want true", ctx["branding"]["show_pill"])
	}
}

// TestE2E_PartialSavePreservesUntouched is the "edit one tab in a
// multi-tab UI" workflow. The admin SPA only sends fields the operator
// changed — the handler must not zero out unsent fields. Operators
// who edit the header tab and never touch the footer expect footer
// values to survive.
func TestE2E_PartialSavePreservesUntouched(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}, &models.Language{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	mustCreateLang(t, db, "en", true)

	tt := true
	branding := ThemeSettingsPage{
		Slug: "branding",
		Fields: []ThemeSettingsField{
			{Key: "name", Type: "text", Translatable: &tt},
			{Key: "tagline", Type: "text", Translatable: &tt},
		},
	}
	reg := NewThemeSettingsRegistry()
	reg.SetActive("squilla", []ThemeSettingsPage{branding})

	api := newDBSettingsAPI(db)
	h := NewThemeSettingsHandler(reg, api, db, nil, nil)
	app := fiber.New()
	app.Put("/theme-settings/:page", h.Save)

	// First save: both fields.
	saveJSON(t, app, "PUT", "/theme-settings/branding", "en",
		`{"values":{"name":"Squilla","tagline":"AI does the work"}}`)
	// Second save: only tagline.
	saveJSON(t, app, "PUT", "/theme-settings/branding", "en",
		`{"values":{"tagline":"Now with extensions"}}`)

	ctx, _ := BuildThemeSettingsContextForLocale(context.Background(), reg, api, "en")
	if v, _ := ctx["branding"]["name"].(string); v != "Squilla" {
		t.Errorf("untouched field zeroed (regression): got %v, want %q",
			ctx["branding"]["name"], "Squilla")
	}
	if v, _ := ctx["branding"]["tagline"].(string); v != "Now with extensions" {
		t.Errorf("touched field stale: got %v, want %q",
			ctx["branding"]["tagline"], "Now with extensions")
	}
}

// The kernel-side robots.txt test moved to the seo-extension package
// alongside the handler itself. The kernel no longer ships a robots.txt
// route — disabling the seo-extension cleanly removes it.

// --- helpers ---

func mustCreateLang(t *testing.T, db *gorm.DB, code string, isDefault bool) {
	t.Helper()
	if err := db.Create(&models.Language{Code: code, Slug: code, Name: code, IsDefault: isDefault, IsActive: true}).Error; err != nil {
		t.Fatalf("seed lang %q: %v", code, err)
	}
}

func saveJSON(t *testing.T, app *fiber.App, method, path, locale, body string) {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if locale != "" {
		req.Header.Set("X-Admin-Language", locale)
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, path, err)
	}
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("%s %s status %d: %s", method, path, resp.StatusCode, respBody)
	}
}

func jsonRaw(s string) []byte { return []byte(s) }
