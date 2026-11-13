package cms

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"squilla/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ThemeBlockDef is defined in theme_loader.go — reused here for extension block definitions.

// Extension auto-activation now reads the manifest's `auto_activate`
// field directly — the kernel no longer carries a hardcoded list of
// "official" extension slugs. Bundled extensions opt into auto-activation
// in their own extension.json, which keeps the kernel ignorant of which
// extensions exist (the entire point of the kernel/extensions split).

// AdminUISlot describes a component injected into a named slot.
type AdminUISlot struct {
	Component string `json:"component"`
	Label     string `json:"label"`
}

// AdminUIRoute describes a route registered by an extension.
type AdminUIRoute struct {
	Path      string `json:"path"`
	Component string `json:"component"`
}

// AdminUIMenuItem describes a menu child item.
type AdminUIMenuItem struct {
	Label string `json:"label"`
	Route string `json:"route"`
}

// AdminUIMenu describes a sidebar menu group registered by an extension.
type AdminUIMenu struct {
	Label    string `json:"label"`
	Icon     string `json:"icon"`
	Position string `json:"position"`
	// Section routes the menu into a sidebar section: "content" (default),
	// "design", "development", or "settings".
	Section  string            `json:"section,omitempty"`
	Children []AdminUIMenuItem `json:"children"`
}

// AdminUIFieldType describes a custom field type registered by an extension.
type AdminUIFieldType struct {
	Type        string   `json:"type"`
	Label       string   `json:"label"`
	Description string   `json:"description"`
	HowTo       string   `json:"how_to,omitempty"`
	Icon        string   `json:"icon"`
	Group       string   `json:"group"`
	Component   string   `json:"component"`
	Supports    []string `json:"supports,omitempty"`
}

// AdminUIManifest describes the admin UI components an extension provides.
type AdminUIManifest struct {
	Entry      string                 `json:"entry"`
	Slots      map[string]AdminUISlot `json:"slots"`
	Routes     []AdminUIRoute         `json:"routes"`
	Menu       *AdminUIMenu           `json:"menu"`
	FieldTypes []AdminUIFieldType     `json:"field_types,omitempty"`
}

// SettingsField describes a single setting field in the schema.
type SettingsField struct {
	Type      string   `json:"type"`
	Label     string   `json:"label"`
	Required  bool     `json:"required"`
	Default   any      `json:"default"`
	Sensitive bool     `json:"sensitive"`
	Enum      []string `json:"enum"`
}

// ExtensionManifest represents the extension.json manifest file.
// PublicRouteEntry declares a public route that should be proxied to an extension plugin.
//
// Passthrough marks a route the plugin may decline. Such a route is matched
// last — after kernel, static and ordinary extension routes, right before
// the public page router — and when the plugin answers with the
// X-Squilla-Passthrough response header the request carries on to the page
// router as if the route did not exist. It is how an extension inspects
// arbitrary public URLs (path "/*") without owning them, e.g. redirects.
type PublicRouteEntry struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	Passthrough bool   `json:"passthrough,omitempty"`
}

// AdminRouteEntry declares a per-capability gate on a request the
// kernel will proxy to the extension at /admin/api/ext/<slug>/<path>.
//
// Method is the HTTP method ("GET", "POST", …) or "*" (or empty) for
// any method.
//
// Path is a glob applied against the wildcard portion of the URL —
// what the plugin would call its "request path", with a leading slash.
// Two glob tokens:
//
//   - matches a single path segment (no slashes)
//     **  matches any number of segments (including zero)
//
// RequiredCapability is the boolean capability key that the user's
// role must carry. Empty means the route needs only admin_access (already
// verified by the proxy group) — use it deliberately to open a mutating
// route to every admin user.
//
// Matching is first-rule-wins, so order entries with most specific
// patterns first. Unmatched GET/HEAD requests need only admin_access;
// unmatched requests with any other method need manage_settings.
type AdminRouteEntry struct {
	Method             string `json:"method"`
	Path               string `json:"path"`
	RequiredCapability string `json:"required_capability"`
}

type ExtensionManifest struct {
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Version     string   `json:"version"`
	Author      string   `json:"author"`
	Description string   `json:"description"`
	Priority    int      `json:"priority"`
	Provides    []string `json:"provides"`
	// AutoActivate=true means the extension flips is_active=true on fresh
	// installs. The flag is ignored on existing installations (the
	// is_active column is not in the ON CONFLICT update set, so user
	// choices stick). Replaces the kernel-side hardcoded list of slugs.
	AutoActivate bool     `json:"auto_activate"`
	Capabilities []string `json:"capabilities"`
	// DataOwnedTables enumerates the database tables this extension
	// is allowed to read/write through the Data* CoreAPI methods. The
	// kernel default-denies any table not on this list (see
	// coreapi.checkTableAccess) so an extension granted "data:read"
	// can't pivot from its own data into users / sessions / etc.
	DataOwnedTables []string `json:"data_owned_tables"`
	// DataOwnedFunctions enumerates the SQL functions (created by the
	// extension's own migrations) this extension may invoke through
	// CoreAPI.DataCall. Default deny, like DataOwnedTables.
	DataOwnedFunctions []string                 `json:"data_owned_functions"`
	Plugins            []PluginManifestEntry    `json:"plugins"`
	AdminUI            *AdminUIManifest         `json:"admin_ui"`
	SettingsSchema     map[string]SettingsField `json:"settings_schema"`
	// Settings is the rich, schema-driven settings declaration. Each entry
	// is a complete settings.Schema (sections + fields with translatable
	// flags). Registered into the in-process settings registry on
	// activation, unregistered on deactivation. The schema ID is namespaced
	// to "ext.<slug>.<id>" by the activation bridge so two extensions can
	// declare schemas with the same local ID without collision.
	Settings     []json.RawMessage  `json:"settings"`
	Blocks       []ThemeBlockDef    `json:"blocks"`
	Templates    []ThemeTemplateDef `json:"templates"`
	Layouts      []ThemeLayoutDef   `json:"layouts"`
	Partials     []ThemePartialDef  `json:"partials"`
	PublicRoutes []PublicRouteEntry `json:"public_routes"`
	// AdminRoutes declares per-capability gates on /admin/api/ext/<slug>/*
	// requests. The proxy enforces these BEFORE forwarding to the plugin
	// so a logged-in admin without the right cap can't bypass UI guards
	// and POST directly. Without this list, extensions are gated only by
	// admin_access — which is fine for read-only extensions but a hole
	// for anything mutating data the user shouldn't touch.
	AdminRoutes []AdminRouteEntry    `json:"admin_routes"`
	Assets      []ThemeMediaAssetDef `json:"assets"`
}

// CapabilityMap returns the Capabilities slice as a map for quick lookup.
func (m *ExtensionManifest) CapabilityMap() map[string]bool {
	caps := make(map[string]bool, len(m.Capabilities))
	for _, c := range m.Capabilities {
		caps[c] = true
	}
	return caps
}

// OwnedTablesMap returns DataOwnedTables as a lookup map. Returns an
// empty (non-nil) map for extensions that didn't declare any tables —
// which is the safe default: no entries means no Data* access.
func (m *ExtensionManifest) OwnedTablesMap() map[string]bool {
	owned := make(map[string]bool, len(m.DataOwnedTables))
	for _, t := range m.DataOwnedTables {
		owned[t] = true
	}
	return owned
}

// ExtensionLoader handles scanning, registering, and managing extensions.
//
// Extensions live in two parallel directories:
//   - bundledDir   (e.g. "extensions")        — image-shipped, read-only intent.
//   - dataDir      (e.g. "data/extensions")   — operator-installed, persistent
//     across container restarts when mounted as a volume.
//
// Both are scanned at boot. Writes (zip upload, deploy) target dataDir so
// bundled extensions stay intact. On slug collision the data copy wins so
// an operator override replaces a bundled extension transparently.
type ExtensionLoader struct {
	db            *gorm.DB
	extensionsDir string // bundled (image)
	dataDir       string // operator-installed (volume)
}

// NewExtensionLoader creates a new ExtensionLoader. dataDir is auto-created
// if missing so a fresh container can scan/install without an explicit mkdir.
func NewExtensionLoader(db *gorm.DB, bundledDir, dataDir string) *ExtensionLoader {
	if dataDir != "" {
		_ = os.MkdirAll(dataDir, 0o755)
	}
	return &ExtensionLoader{
		db:            db,
		extensionsDir: bundledDir,
		dataDir:       dataDir,
	}
}

// DataDir returns the writable extensions directory. Install paths target
// it; bundled stays untouched.
func (l *ExtensionLoader) DataDir() string { return l.dataDir }

// ScanAndRegister walks both the data and bundled extension directories
// and upserts a row per valid extension.json. Data wins on slug collision
// because the upsert order claims dataDir slugs first; the bundled scan
// then skips any slug whose stored path already lives under dataDir.
func (l *ExtensionLoader) ScanAndRegister() {
	dataCount := l.scanDir(l.dataDir, true)
	bundledCount := l.scanDir(l.extensionsDir, false)
	log.Printf("[extensions] scanned %d extensions (%d data, %d bundled) from %s + %s",
		dataCount+bundledCount, dataCount, bundledCount, l.dataDir, l.extensionsDir)
}

// scanDir walks one root and registers each extension. Missing dir is fine.
func (l *ExtensionLoader) scanDir(root string, isData bool) int {
	if root == "" {
		return 0
	}
	entries, err := os.ReadDir(root)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("[extensions] error reading %s: %v", root, err)
		}
		return 0
	}

	registered := 0
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		if l.registerDir(filepath.Join(root, entry.Name()), isData, false) {
			registered++
		}
	}
	return registered
}

// registerDir upserts the extension whose manifest lives in extDir. A
// bundled registration never replaces a data-backed one unless force is set
// (AdoptBundled) or the data copy has vanished from disk — otherwise a row
// pointing at a deleted override would never fall back to the bundled copy.
func (l *ExtensionLoader) registerDir(extDir string, isData, force bool) bool {
	manifestPath := filepath.Join(extDir, "extension.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return false
	}

	var manifest ExtensionManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		log.Printf("[extensions] invalid extension.json in %s: %v", filepath.Base(extDir), err)
		return false
	}

	if manifest.Slug == "" {
		manifest.Slug = filepath.Base(extDir)
	}
	// The slug is joined into data-dir paths (delete, install) and used
	// as the capability/caller identity — reject anything but [A-Za-z0-9_-].
	if !isValidSettingsKey(manifest.Slug) {
		log.Printf("[extensions] skipping %s: invalid slug %q", extDir, manifest.Slug)
		return false
	}
	if manifest.Priority == 0 {
		manifest.Priority = 50
	}

	// Bundled scan must not overwrite a data-backed registration.
	if !isData && !force && l.dataDir != "" {
		var existing models.Extension
		if err := l.db.Where("slug = ?", manifest.Slug).First(&existing).Error; err == nil {
			if isUnderDir(existing.Path, l.dataDir) {
				if _, statErr := os.Stat(filepath.Join(existing.Path, "extension.json")); statErr == nil {
					return false
				}
			}
		}
	}

	ext := models.Extension{
		Slug:        manifest.Slug,
		Name:        manifest.Name,
		Version:     manifest.Version,
		Description: manifest.Description,
		Author:      manifest.Author,
		Path:        extDir,
		Priority:    manifest.Priority,
		Manifest:    models.JSONB(data),
		// auto_activate is honoured only for image-bundled extensions: an
		// operator-dropped or uploaded package must be activated explicitly.
		IsActive: manifest.AutoActivate && !isData && isUnderDir(extDir, l.extensionsDir),
	}

	result := l.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "slug"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"name", "version", "description", "author", "path", "priority", "manifest",
		}),
	}).Create(&ext)

	if result.Error != nil {
		log.Printf("[extensions] error registering %s: %v", manifest.Slug, result.Error)
		return false
	}
	return true
}

// BundledDirFor returns the image-bundled directory that ships slug, or ""
// when the image has no extension with that slug. Matches on the manifest's
// slug (falling back to the directory name) like the scanner does.
func (l *ExtensionLoader) BundledDirFor(slug string) string {
	if l.extensionsDir == "" || slug == "" {
		return ""
	}
	direct := filepath.Join(l.extensionsDir, slug)
	if manifestSlug(filepath.Join(direct, "extension.json"), slug) == slug {
		return direct
	}
	entries, err := os.ReadDir(l.extensionsDir)
	if err != nil {
		return ""
	}
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		dir := filepath.Join(l.extensionsDir, e.Name())
		if manifestSlug(filepath.Join(dir, "extension.json"), e.Name()) == slug {
			return dir
		}
	}
	return ""
}

// manifestSlug reads the "slug" of a manifest file, defaulting to fallback
// when the manifest omits it. Returns "" when the file is missing/invalid.
func manifestSlug(path, fallback string) string {
	raw, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	var m struct {
		Slug string `json:"slug"`
	}
	if json.Unmarshal(raw, &m) != nil {
		return ""
	}
	if m.Slug == "" {
		return fallback
	}
	return m.Slug
}

// BundledShadow reports the bundled copy hidden by ext's operator-installed
// copy, or nil when ext isn't a data-dir override of a bundled extension.
func (l *ExtensionLoader) BundledShadow(ext models.Extension) *BundledShadow {
	if !isUnderDir(ext.Path, l.dataDir) {
		return nil
	}
	bundled := l.BundledDirFor(ext.Slug)
	if bundled == "" {
		return nil
	}
	shadow, err := compareShadow(ext.Path, bundled, "extension.json", extensionRuntimeFile)
	if err != nil {
		log.Printf("[extensions] compare %s with bundled copy: %v", ext.Slug, err)
		return nil
	}
	return shadow
}

// ExtensionView is an extension row plus kernel-computed state that isn't
// stored: whether an operator-installed copy shadows a bundled one.
type ExtensionView struct {
	models.Extension
	ShadowedBundled *BundledShadow `json:"shadowed_bundled,omitempty"`
}

// View wraps ext with its shadowed-bundled state.
func (l *ExtensionLoader) View(ext models.Extension) ExtensionView {
	return ExtensionView{Extension: ext, ShadowedBundled: l.BundledShadow(ext)}
}

// ListViews is List with each row's shadowed-bundled state.
func (l *ExtensionLoader) ListViews() ([]ExtensionView, error) {
	exts, err := l.List()
	if err != nil {
		return nil, err
	}
	out := make([]ExtensionView, len(exts))
	for i := range exts {
		out[i] = l.View(exts[i])
	}
	return out, nil
}

// RegisterBundled re-registers slug from its bundled directory, replacing a
// data-backed registration. Used by AdoptBundled after the override is gone.
func (l *ExtensionLoader) RegisterBundled(slug string) error {
	dir := l.BundledDirFor(slug)
	if dir == "" {
		return fmt.Errorf("no bundled copy of extension %q", slug)
	}
	if !l.registerDir(dir, false, true) {
		return fmt.Errorf("failed to register bundled extension %q from %s", slug, dir)
	}
	return nil
}

// GetActive returns all active extensions sorted by priority (ascending).
// Rows are filtered through sanitizeActive: a row whose path is outside the
// bundled/data extension dirs is skipped (with a warning), and each
// manifest's data_owned_tables is stripped of kernel tables and of tables
// another active extension already owns. Every boot/activation consumer
// (migrations, scripts, plugins) goes through this method.
func (l *ExtensionLoader) GetActive() ([]models.Extension, error) {
	var exts []models.Extension
	err := l.db.Where("is_active = ?", true).Order("priority ASC, slug ASC").Find(&exts).Error
	if err != nil {
		return nil, err
	}
	return l.sanitizeActive(exts), nil
}

// Activate sets is_active=true for the extension with the given slug.
func (l *ExtensionLoader) Activate(slug string) error {
	result := l.db.Model(&models.Extension{}).Where("slug = ?", slug).Update("is_active", true)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("extension not found: %s", slug)
	}
	return nil
}

// Deactivate sets is_active=false for the extension with the given slug.
func (l *ExtensionLoader) Deactivate(slug string) error {
	result := l.db.Model(&models.Extension{}).Where("slug = ?", slug).Update("is_active", false)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("extension not found: %s", slug)
	}
	return nil
}

// GetBySlug returns a single extension by slug.
func (l *ExtensionLoader) GetBySlug(slug string) (*models.Extension, error) {
	var ext models.Extension
	err := l.db.Where("slug = ?", slug).First(&ext).Error
	if err != nil {
		return nil, err
	}
	return &ext, nil
}

// List returns all extensions ordered by priority.
func (l *ExtensionLoader) List() ([]models.Extension, error) {
	var exts []models.Extension
	err := l.db.Order("priority ASC, slug ASC").Find(&exts).Error
	return exts, err
}

// LoadBlocksForActiveExtensions loads block types from all active extensions
// that declare blocks in their manifest. This mirrors how ThemeLoader registers
// theme blocks but uses source="extension" and stores the extension slug in theme_name.
func (l *ExtensionLoader) LoadBlocksForActiveExtensions(registry *ThemeAssetRegistry) {
	exts, err := l.GetActive()
	if err != nil {
		log.Printf("[extensions] failed to get active extensions for block loading: %v", err)
		return
	}

	total := 0
	for _, ext := range exts {
		n := l.loadExtensionBlocks(ext, registry)
		total += n
	}
	if total > 0 {
		log.Printf("[extensions] loaded %d block types from active extensions", total)
	}
}

// LoadBlocksForExtension loads block types for a single extension.
func (l *ExtensionLoader) LoadBlocksForExtension(slug string, registry *ThemeAssetRegistry) {
	ext, err := l.GetBySlug(slug)
	if err != nil {
		log.Printf("[extensions] cannot load blocks for %s: %v", slug, err)
		return
	}
	n := l.loadExtensionBlocks(*ext, registry)
	if n > 0 {
		log.Printf("[extensions] loaded %d block types from extension %s", n, slug)
	}
}

// UnloadExtensionBlocks removes all block types, templates, layouts, and partials
// owned by an extension and clears their assets from the registry.
func (l *ExtensionLoader) UnloadExtensionBlocks(slug string, registry *ThemeAssetRegistry) {
	// Find all block slugs for this extension before deleting.
	var blockTypes []models.BlockType
	l.db.Where("source = ? AND theme_name = ?", "extension", slug).Find(&blockTypes)

	// Delete blocks from DB.
	result := l.db.Where("source = ? AND theme_name = ?", "extension", slug).Delete(&models.BlockType{})
	if result.RowsAffected > 0 {
		log.Printf("[extensions] removed %d block types from extension %s", result.RowsAffected, slug)
	}

	// Delete templates from DB.
	tResult := l.db.Where("source = ? AND theme_name = ?", "extension", slug).Delete(&models.Template{})
	if tResult.RowsAffected > 0 {
		log.Printf("[extensions] removed %d templates from extension %s", tResult.RowsAffected, slug)
	}

	// Delete layouts from DB.
	lResult := l.db.Where("source = ? AND theme_name = ?", "extension", slug).Delete(&models.Layout{})
	if lResult.RowsAffected > 0 {
		log.Printf("[extensions] removed %d layouts from extension %s", lResult.RowsAffected, slug)
	}

	// Delete partials from DB.
	pResult := l.db.Where("source = ? AND theme_name = ?", "extension", slug).Delete(&models.LayoutBlock{})
	if pResult.RowsAffected > 0 {
		log.Printf("[extensions] removed %d partials from extension %s", pResult.RowsAffected, slug)
	}

	// Remove from asset registry.
	registry.mu.Lock()
	for _, bt := range blockTypes {
		delete(registry.blockAssets, bt.Slug)
	}
	registry.mu.Unlock()
}

// loadExtensionBlocks loads blocks, templates, layouts, and partials for a single extension.
// Returns count of blocks loaded.
func (l *ExtensionLoader) loadExtensionBlocks(ext models.Extension, registry *ThemeAssetRegistry) int {
	var manifest ExtensionManifest
	if err := json.Unmarshal(ext.Manifest, &manifest); err != nil {
		return 0
	}

	loaded := 0

	// Load blocks.
	for _, def := range manifest.Blocks {
		blockDir, err := confinedDir(ext.Path, filepath.Join("blocks", def.Dir))
		if err != nil {
			log.Printf("[extensions] block %s from %s: %v", def.Slug, ext.Slug, err)
			continue
		}
		if err := RegisterBlockFromDir(l.db, registry, blockDir, def.Slug, "extension", ext.Slug); err != nil {
			log.Printf("[extensions] block %s from %s: %v", def.Slug, ext.Slug, err)
			continue
		}
		loaded++
	}

	// Load templates.
	for _, def := range manifest.Templates {
		filePath, err := confinedFile(ext.Path, filepath.Join("templates", def.File))
		if err != nil {
			log.Printf("[extensions] template %s from %s: %v", def.Slug, ext.Slug, err)
			continue
		}
		if err := RegisterTemplateFromFile(l.db, filePath, def.Slug, "extension", ext.Slug); err != nil {
			log.Printf("[extensions] template %s from %s: %v", def.Slug, ext.Slug, err)
			continue
		}
	}

	// Load layouts.
	for _, def := range manifest.Layouts {
		code, err := readConfinedFile(ext.Path, filepath.Join("layouts", def.File))
		if err != nil {
			log.Printf("[extensions] layout %s from %s: %v", def.Slug, ext.Slug, err)
			continue
		}
		if err := RegisterLayoutFromFile(l.db, def, string(code), "extension", ext.Slug); err != nil {
			log.Printf("[extensions] layout %s from %s: %v", def.Slug, ext.Slug, err)
		}
	}

	// Load partials.
	for _, def := range manifest.Partials {
		code, err := readConfinedFile(ext.Path, filepath.Join("partials", def.File))
		if err != nil {
			log.Printf("[extensions] partial %s from %s: %v", def.Slug, ext.Slug, err)
			continue
		}
		if err := RegisterPartialFromFile(l.db, def, string(code), "extension", ext.Slug); err != nil {
			log.Printf("[extensions] partial %s from %s: %v", def.Slug, ext.Slug, err)
		}
	}

	return loaded
}
