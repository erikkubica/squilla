# Field Schema Naming Refactor

Worktree: Yes (`.worktrees/sanity-naming/`, branch `refactor/field-schema-naming`)
Status: PENDING
Mode: plan + execute (lighter)

## Goal

Standardize the field-schema vocabulary across the entire codebase to a single,
homogeneous, recursive shape that's friendly to both AI and humans. Today the
codebase mixes `field_schema` / `sub_fields` / `key` / `name` (per `tools_guide.go:557`,
this mix already produces empty-input bugs) and the `NodeTypeField` Go struct
carries dual JSON tags (`api.go:294-296`) with a normalizer mirroring them.

## Target Shape

```json
{
  "fields": [
    {
      "name": "hero",
      "title": "Hero Section",
      "type": "object",
      "description": "Top of page",
      "fields": [
        { "name": "heading", "title": "Heading", "type": "string" },
        { "name": "items", "title": "Items", "type": "array",
          "fields": [
            { "name": "label", "title": "Label", "type": "string" }
          ]
        }
      ]
    }
  ]
}
```

### Vocabulary (final)

| Old | New |
|---|---|
| `field_schema` (top-level container) | `fields` |
| `sub_fields` (nested container) | `fields` |
| `key` / `name` (identifier — both existed) | `name` |
| `label` (display) | `title` |
| `help` (helper text) | `description` |
| `default` (default value) | `initialValue` |
| `required: true` | unchanged (kept simple, no Sanity validation builder) |
| `options`, `min`, `max`, `multiple`, `node_types`, `taxonomy`, etc. | unchanged |

### Built-in type renames

| Old | New |
|---|---|
| `text` | `string` |
| `repeater` | `array` |
| `group` | `object` |
| `node` | `reference` |

Unchanged: `textarea`, `richtext`, `number`, `range`, `email`, `url`, `date`,
`color`, `toggle`, `select`, `radio`, `checkbox`, `image`, `gallery`, `file`,
`link`, `term`.

## Migration Strategy: Read-both, Write-new

To guarantee no production crash on deploy:

1. **Runtime back-compat reader.** Both Go core and admin UI always normalize
   incoming schemas before use:
   - `field_schema` → `fields`
   - `sub_fields` → `fields`
   - `key` → `name` (when `name` empty)
   - `label` → `title` (when `title` empty)
   - `help` → `description` (when `description` empty)
   - `default` → `initialValue` (when `initialValue` empty)
   - Old type names accepted: `text`, `repeater`, `group`, `node` map to new.

   This reader is **permanent for now** — drops in a future cleanup once we're
   confident no external themes/extensions depend on legacy names.

2. **DB migration.** A one-time GORM migration rewrites every JSONB column that
   stores a field schema:
   - `node_types.field_schema`
   - `taxonomies.field_schema`
   - `block_types.field_schema`
   - `layout_blocks.field_schema`

   Migration normalizes in-place using the same rules. Idempotent — safe to
   re-run. Runs on boot before extension activation.

3. **In-repo file rewrites.** All `block.json` files and theme `.tengo` scripts
   in this repo rewritten to the new shape mechanically.

4. **Output writers.** All MCP tool handlers, gRPC proto adapters, and admin
   UI form posts emit only the new shape.

## Phases

### Phase 1 — Foundation: types + normalizer (Go)

**Files:**
- `internal/coreapi/api.go` — rename struct fields:
  - `Name` → `Name` (kept), drop `key` JSON tag
  - `Label` → `Title`
  - `Help` → `Description`
  - `Default` → `InitialValue`
  - `SubFields` → `Fields`
  - JSON tags become `name`, `title`, `description`, `initial_value`, `fields`.
- `internal/coreapi/api.go` — new `NormalizeFieldSchema` that handles ALL
  legacy aliases (key/name, label/title, help/description, default/initialValue,
  field_schema/fields, sub_fields/fields, type aliases). Replaces the old
  Name↔Key mirror.
- `internal/cms/field_types/registry.go` — rename built-ins, add `aliases`
  field for legacy lookup, update `IsBuiltin` to accept either.
- `internal/cms/public_handler_hydrate.go` — `fieldSchemaDef.SubFields` →
  `Fields`, JSON tags updated.
- `internal/cms/theme_loader_register.go` — recognize both `sub_fields` and
  `fields`, both `field_schema` and `fields`.
- `internal/coreapi/tengo_nodes.go` — accept both legacy and new keys when
  reading Tengo maps.
- `internal/mcp/tools_theme_checklist.go` — both keys.
- `internal/mcp/tools_guide.go` — update guidance text + examples.

**Acceptance:** `go build ./...` clean. New struct fields used everywhere
internally; legacy keys only flow through the normalizer.

### Phase 2 — DB migration

**File:** `internal/db/migration_field_schema_v2.go` (new)

GORM migration that:
1. SELECTs JSONB content from each affected column.
2. Recursively normalizes the JSON tree (same rules as runtime normalizer).
3. UPDATEs only when the normalized form differs from stored.
4. Idempotent. Logs how many rows it touched.

Registered in the boot migration list before extension activation.

**Acceptance:** Migration runs on a populated dev DB without errors; second
run reports 0 changes (idempotency).

### Phase 3 — Admin UI

**Files:**
- `admin-ui/src/api/client.ts` — `NodeTypeField` interface updated; client
  normalizes responses on the way in (legacy → new) and writes only the new
  shape on the way out.
- `admin-ui/src/components/ui/sub-fields-editor.tsx` → renamed to
  `nested-fields-editor.tsx` (rename file + component).
- `admin-ui/src/components/ui/field-schema-editor.tsx` — update prop names,
  `sub_fields` → `fields` everywhere.
- `admin-ui/src/components/ui/custom-field-input.tsx` — same.
- `admin-ui/src/main.tsx` — register renamed component.
- `admin-ui/src/pages/{node-type-editor,taxonomy-editor,block-type-editor,
  layout-block-editor,node-editor,term-editor,theme-settings}.tsx` —
  field references updated.

**Acceptance:** `cd admin-ui && npm run build` clean. UI renders existing
node types and blocks correctly (back-compat).

### Phase 4 — Rewrite in-repo block.json + theme.tengo files

**Files:** ~37 `block.json` files (extensions/content-blocks, themes/*) +
theme `.tengo` files that call `nodetypes.register` / `taxonomies.register`.

A small Go cmd in `cmd/squilla-rewrite-fields/main.go` (temporary, deleted at
end of refactor) walks the repo, normalizes every block.json and tengo
schema literal it finds, writes back. Reuses Phase 1's normalizer.

Manually verify a sample of rewritten files. Delete the cmd before commit.

**Acceptance:** No file in `extensions/`, `themes/` contains `field_schema`,
`sub_fields`, `"key"` (in field schema context), `"label"` (display), or
old type names. `git diff` shows mechanical changes only.

### Phase 5 — Documentation

**Files:**
- `docs/extension_api.md`
- `docs/scripting_api.md`
- `docs/theme-checklist.md`
- `docs/theming.md`
- `docs/database-schema.md`
- `docs/core_features.md`
- `themes/README.md`
- `extensions/README.md`
- `admin-ui/README.md`
- `.claude/skills/squilla-create-theme/SKILL.md`
- The MCP `core.guide` text in `internal/mcp/tools_guide.go`

All examples + prose updated to the new vocabulary. Add a "legacy aliases"
note explaining read-back compatibility.

### Phase 6 — Verification

1. `gofmt -w .` + `go vet ./...` + `go build ./...`
2. `go test ./...`
3. Admin UI: `cd admin-ui && npm run build`
4. Boot the server with a populated dev DB — confirm migration runs, content
   loads, page renders.
5. MCP smoke: `core.guide` output references new vocabulary.
6. Verify a legacy-shaped block.json (kept as a single test fixture) still
   loads & renders correctly through the back-compat path.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| External theme/extension breaks | Permanent back-compat normalizer reads legacy shape forever |
| DB migration corrupts content | Idempotent, only rewrites when normalized form differs; tested on dev DB first |
| Missed file in repo causes runtime error | Back-compat normalizer catches it; Phase 4 sweep + grep gates |
| `name` collides with code conventions | `name` is the data identifier (Sanity meaning); `title` is human display |
| Type renames break stored block content | Block content stores values, not type names. Type names are only in schemas, all of which flow through the normalizer |

## Out of Scope

- Sanity's `validation` builder API (we keep `required: true` + numeric `min`/`max`)
- Sanity's `of: [...]` array element discrimination (we use a single `fields` array on `array` type)
- Renaming theme/extension capability strings, event names, or any other vocabulary outside field schemas
