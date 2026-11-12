package cms

import (
	"encoding/json"
	"log"
	"path/filepath"
	"sort"
	"strings"

	"squilla/internal/models"
)

// This file owns the boot-time trust checks applied to extension rows.
// An extensions row is just data: anyone who can write that table (a SQL
// injection, a restored backup, a compromised extension with raw SQL) could
// otherwise point `path` at an arbitrary directory — whose migrations,
// scripts and plugin binaries the kernel then runs — or claim another
// extension's tables through `data_owned_tables`.

// kernelTableModels are the core GORM models; their tables belong to the
// kernel and can never be claimed by an extension's data_owned_tables.
var kernelTableModels = []interface{ TableName() string }{
	models.BlockType{}, models.ContentNode{}, models.ContentNodeRevision{},
	models.Extension{}, models.Language{}, models.Layout{}, models.LayoutBlock{},
	models.McpAuditLog{}, models.McpToken{}, models.Menu{}, models.MenuItem{},
	models.NodeType{}, models.PasswordResetToken{}, models.Role{},
	models.Session{}, models.SiteSetting{}, models.SystemAction{},
	models.Taxonomy{}, models.TaxonomyTerm{}, models.Template{},
	models.Theme{}, models.User{},
}

// kernelMigrationTables are created by internal/db/migrations without a
// GORM model (or are bookkeeping/legacy kernel tables).
var kernelMigrationTables = []string{
	"redirects", "schema_migrations", "extension_migrations",
	"pending_uploads", "mcp_token_audit", "audit_log", "role_capabilities",
}

// kernelCoreTables is the union of the two lists above, lower-cased.
var kernelCoreTables = func() map[string]bool {
	m := make(map[string]bool, len(kernelTableModels)+len(kernelMigrationTables))
	for _, mod := range kernelTableModels {
		m[mod.TableName()] = true
	}
	for _, t := range kernelMigrationTables {
		m[t] = true
	}
	return m
}()

// IsKernelCoreTable reports whether table belongs to the kernel schema.
func IsKernelCoreTable(table string) bool {
	return kernelCoreTables[strings.Trim(strings.ToLower(strings.TrimSpace(table)), `"`)]
}

// trustedExtensionPath reports whether an extension row's path resolves
// (symlinks included) inside the bundled or the data extensions dir.
func (l *ExtensionLoader) trustedExtensionPath(p string) bool {
	for _, root := range []string{l.extensionsDir, l.dataDir} {
		if root == "" || !isUnderDir(p, root) {
			continue
		}
		rootAbs, err1 := filepath.Abs(root)
		pAbs, err2 := filepath.Abs(p)
		if err1 != nil || err2 != nil {
			continue
		}
		rel, err := filepath.Rel(rootAbs, pAbs)
		if err != nil {
			continue
		}
		if _, err := confinedDir(rootAbs, rel); err == nil {
			return true
		}
	}
	return false
}

// isBundledPath reports whether p lies inside the image-bundled dir.
func (l *ExtensionLoader) isBundledPath(p string) bool {
	return l.extensionsDir != "" && isUnderDir(p, l.extensionsDir)
}

// sanitizeActive drops rows whose path is outside both extension roots and
// rewrites each remaining row's manifest so data_owned_tables never lists a
// kernel table or a table already claimed by another active extension.
// Claims are resolved bundled-first, then in the rows' priority/slug order,
// so an operator-installed extension can't take a bundled one's tables.
func (l *ExtensionLoader) sanitizeActive(rows []models.Extension) []models.Extension {
	out := make([]models.Extension, 0, len(rows))
	for _, ext := range rows {
		if !l.trustedExtensionPath(ext.Path) {
			log.Printf("[extensions] WARNING: skipping active extension %q: path %q is outside %s and %s", ext.Slug, ext.Path, l.extensionsDir, l.dataDir)
			continue
		}
		out = append(out, ext)
	}

	order := make([]int, len(out))
	for i := range order {
		order[i] = i
	}
	sort.SliceStable(order, func(a, b int) bool {
		return l.isBundledPath(out[order[a]].Path) && !l.isBundledPath(out[order[b]].Path)
	})

	owner := map[string]string{}
	for _, i := range order {
		ext := &out[i]
		var probe struct {
			DataOwnedTables []string `json:"data_owned_tables"`
		}
		if err := json.Unmarshal(ext.Manifest, &probe); err != nil || len(probe.DataOwnedTables) == 0 {
			continue
		}
		kept := make([]string, 0, len(probe.DataOwnedTables))
		for _, t := range probe.DataOwnedTables {
			key := strings.Trim(strings.ToLower(strings.TrimSpace(t)), `"`)
			switch {
			case IsKernelCoreTable(key):
				log.Printf("[extensions] WARNING: %s: ignoring data_owned_tables entry %q (kernel table)", ext.Slug, t)
			case owner[key] != "" && owner[key] != ext.Slug:
				log.Printf("[extensions] WARNING: %s: ignoring data_owned_tables entry %q (owned by active extension %q)", ext.Slug, t, owner[key])
			default:
				owner[key] = ext.Slug
				kept = append(kept, t)
			}
		}
		if len(kept) != len(probe.DataOwnedTables) {
			ext.Manifest = replaceManifestField(ext.Manifest, "data_owned_tables", kept)
		}
	}
	return out
}

// replaceManifestField returns manifest with one top-level field replaced.
func replaceManifestField(manifest models.JSONB, field string, value any) models.JSONB {
	var m map[string]json.RawMessage
	if err := json.Unmarshal(manifest, &m); err != nil {
		return manifest
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return manifest
	}
	m[field] = raw
	b, err := json.Marshal(m)
	if err != nil {
		return manifest
	}
	return models.JSONB(b)
}

// GetActiveBySlug returns the sanitized active row for slug (see
// sanitizeActive), or nil when slug isn't active or isn't trusted.
func (l *ExtensionLoader) GetActiveBySlug(slug string) *models.Extension {
	exts, err := l.GetActive()
	if err != nil {
		return nil
	}
	for i := range exts {
		if exts[i].Slug == slug {
			return &exts[i]
		}
	}
	return nil
}
