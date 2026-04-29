# Theme build notes — gotchas hit while building `themes/squilla`

A retrospective of every footgun and undocumented detail encountered while
porting the Squilla design into a real Squilla theme. Use this to
strengthen the `squilla-create-theme` skill / `themes/README.md`.

---

## 1. Tengo language gotchas

### 1.1 `log.error()` is a parse error
`error` is a reserved selector in Tengo (used by `is_error()`). `log.error("…")`
fails to compile with `expected selector, found 'error'`. Use `log.warn(…)` or
`log.info(…)` instead. The `log` core module DOES expose `error` as a Go
function but the parser can't reach it via dot-access.

> **Skill should say:** never use `log.error` from Tengo — use `log.warn`.

### 1.2 `is_string`, `is_undefined`, `is_error` are Tengo built-ins
Use them — don't try `typeof v == "string"`. They also work on map values
(undefined for missing keys) which is the only safe way to handle optional
input fields.

### 1.3 Tengo modular imports — relative paths, no extension
`import("./setup/foo")` resolves to `scripts/setup/foo.tengo`. Each module
must `export { … }` whatever the entry script needs.

> **Skill should say:** prefer modular Tengo (`scripts/setup/*`,
> `scripts/seeds/*`) over a 700-line `theme.tengo`. Entry script is just a
> manifest of `module.run()` calls.

---

## 2. Tengo CoreAPI quirks

### 2.1 `nodes.create` takes `fields_data:`, NOT `fields:`
`nodeInputFromMap` only reads `fields_data`. Passing `fields:` silently drops
your data — the node is created with empty `{}`.

```tengo
// CORRECT
nodes.create({
    title: "…",
    slug: "…",
    node_type: "post",
    fields_data: { category: "engineering", excerpt: "…" },
    blocks_data: [ … ]
})
```

### 2.2 But INSIDE blocks_data, blocks use `fields:`
That's right — the asymmetry is real:
- Node level: `fields_data: {…}`
- Block level (inside `blocks_data`): `fields: {…}`

> **Skill should call this out loudly.** It's the #1 silent-data-loss bug.

### 2.3 `terms.list(node_type, taxonomy)` is positional
Not `terms.list({taxonomy: "…", node_type: "…"})`. Passing a map gets coerced
to one string and matches nothing. Returns `[]TaxonomyTerm` for that pair.

### 2.4 `terms.create` requires `node_type` for term-typed fields to hydrate
A term created without `node_type` hydrates to nothing in templates.
The DB unique key is `(node_type, taxonomy, slug)` — you can have the
"same" slug under two node_types. Always pass `node_type` matching where
the term will be used.

### 2.5 Term-typed fields in `field_schema` need `term_node_type`
```json
{ "key": "section", "type": "term",
  "taxonomy": "doc_section",
  "term_node_type": "documentation" }
```
Without `term_node_type`, hydration can't find the matching term row.

### 2.6 Pass term values as plain slug strings in `fields_data`
`{ section: "getting-started" }` — not `{ section: { slug: "…", name: "…" } }`.
The hydration layer resolves slug → full term object at render time. Templates
then read `.node.fields.section` as either a string OR a hydrated map
depending on whether a matching term exists.

> **Skill should ship a "term field lifecycle" diagram:**
> 1. Theme registers taxonomy with `node_types: [...]`
> 2. Theme creates terms with `node_type` set
> 3. Theme stores `fields_data: { fieldname: "slug-string" }`
> 4. Public render hydrates → `.node.fields.fieldname` becomes `{id, slug, name, …}`
> 5. Templates handle BOTH shapes (string OR map) for safety

### 2.7 To attach an existing taxonomy to a node_type, RE-REGISTER it
Default theme creates `category` taxonomy. To make it appear in the
post-edit form of a custom or default node type, your theme must call:
```tengo
taxonomies.register({
    slug: "category",
    label: "Category",
    label_plural: "Categories",
    hierarchical: false,
    node_types: ["post"]
})
```
Without re-registering, the admin's post-edit form has no taxonomy selector.

### 2.8 `published_at` is null for newly-created nodes
Even with `status: "published"`. If you want real publish dates (for blog
post sorting / display), pass `published_at` explicitly in `nodes.create`.

---

## 3. Block & schema asymmetries

### 3.1 Repeater `sub_fields` use `"key":` in block.json, `"name":` in nodetype.register
- `themes/<t>/blocks/<b>/block.json` field_schema → `key`, sub_fields → `key`
- `nodetypes.register({ field_schema: [...] })` from Tengo → `name`, sub_fields → `name`

The admin reads sub_field VALUES against the schema's `key`/`name` field. If
your block.json sub_field has `"name"`, the admin shows EMPTY inputs even
though `fields_data` has the right shape. Server-side rendering still works
because templates access via the data key directly.

> **Skill should say:** in block.json everything is `key`. In Tengo
> nodetypes.register everything is `name`. Don't mix.

### 3.2 `select` options
- block.json: array of plain strings `["a", "b"]`
- nodetype.register: same — but ALSO accepts `{value, label}` objects

If you use `{value, label}` in a block.json `select`, the admin throws
React error #31 (`object with keys {label, value}`). Bare strings work
everywhere.

### 3.3 Block slug collisions with system / extension blocks
`hero`, `gallery`, `image`, `cta`, `text`, `video` are pre-registered
"custom" blocks; `cb-*` are owned by the content-blocks extension. If your
theme block has a colliding slug, the system block wins and your block is
silently NOT registered.

> **Skill should say:** prefix theme-specific blocks (`sq-hero`,
> `hv-popular-trips`, etc.) — like extension blocks use `cb-`.

### 3.4 Force schema resync after block.json changes
The `block_types.content_hash` is the resync gate. After editing `block.json`
field_schema, run:
```sql
UPDATE block_types SET content_hash = 'force-' || floor(random()*1e6)::text
  WHERE source = 'theme';
```
then re-activate the theme. Otherwise the admin keeps the old schema.

---

## 4. Templates / rendering

### 4.1 Settings keys keep dots — use `index`
Settings in DB keep their dotted keys (`squilla.brand.version`). Go templates
can't dot-traverse `.app.settings.squilla.brand.version`. Use:
```html
{{- $s := .app.settings -}}
{{ index $s "squilla.brand.version" }}
```

### 4.2 Menu items: input is `label:`, output is `.title`
- `menus.upsert({ items: [{ label: "Home", page: "home" }] })`
- Templates: `{{ range .items }}<a href="{{.url}}">{{.title}}</a>{{ end }}`

`.label` in templates returns empty.

### 4.3 `<template>` element content reads via `.innerHTML`
If you stash JSON inside `<template data-mcp-script>{...}</template>` for the
JS to consume, the JS must use `tpl.innerHTML` (not `.textContent` — that
returns 0 because the template body lives in a `DocumentFragment`).
Decode HTML entities (`&quot;` → `"`) before `JSON.parse`.

### 4.4 Available template funcs (whitelist)
`safeHTML`, `safeURL`, `raw`, `dict`, `list`, `seq`, `mod`, `add`, `sub`,
`json`, `lastWord`, `beforeLastWord`, `split`, `image_url`, `image_srcset`,
`filter`, `event`, `deref`, `renderLayoutBlock`. **Notably absent:**
`trimPrefix`, `hasPrefix`, `printf` (use directly), `eq`/`ne`/`gt`/etc.
(those are Go-template built-ins and DO work).

### 4.5 `{{ filter "name" }}` without args throws "wrong number of args"
The filter machinery wants 2 args (name + value). For filters that take no
input, pass an empty dict:
```html
{{ $things := filter "list_things" (dict) }}
```

### 4.5b Theme HTTP routes are mounted under `/api/theme/<path>`
`routes.register("GET", "/docs", "./routes/docs_redirect")` → handler ends up
at `/api/theme/docs`, NOT at `/docs`. Themes can't shadow core public routes.
To redirect a public path you'd need either an extension that proxies it, or
just point the menu link at the destination URL directly. (My fix: menu's
`Docs` item now uses `url: "/docs/introduction"` instead of `page: "docs"`.)

### 4.6 Filters need explicit registration via `filters.add`
Auto-discovery only loads `.tengo` files as importable modules. To register
them as named filter handlers, do it in your setup script:
```tengo
filters := import("core/filters")
filters.add("list_docs", "./filters/list_docs")
```

### 4.7 Don't share `{{define "name"}}` blocks across files
Each block view / partial / layout is parsed as its own template. `{{define}}`
inside one file is invisible from another. For shared chunks (SVGs etc.):
- inline duplicate (acceptable for small markup)
- use a JS placeholder: `<div data-squilla-eye …></div>` injected client-side
- make it a partial and `{{ renderLayoutBlock "name" }}` from the layout

### 4.8 `[hidden]` attr loses to CSS `display: grid`
Adding `hidden` programmatically doesn't hide rows that have `display: grid`
(or flex/etc.). Add an explicit guard:
```css
[hidden] { display: none !important; }
```

---

## 5. Theme activation lifecycle

### 5.1 Existing pages from a previous theme survive activation
Activating a new theme runs its `theme.tengo` but does NOT delete the
previous theme's seeded content. `ensure_page` early-returns when the slug
exists, so the new theme's blocks_data never gets written.

Workarounds when developing:
```sql
-- delete pages from prior theme first (handle menu_item FK)
DELETE FROM menu_items WHERE node_id IN (
  SELECT id FROM content_nodes WHERE slug='home' AND node_type='page');
DELETE FROM content_nodes WHERE slug='home' AND node_type='page';
```

### 5.2 `terms.create` raises duplicate-key on re-activation
Idempotent ensure pattern:
```tengo
ensure_term := func(slug, name) {
    found := terms.list("documentation", "doc_section")
    if !is_error(found) {
        for t in found { if t.slug == slug { return true } }
    }
    return !is_error(terms.create({ … }))
}
```

### 5.3 Hot-deploy without rebuilding
```bash
docker cp themes/<slug>/. <container>:/app/themes/<slug>/
docker exec <db> psql … -c "UPDATE block_types SET content_hash = '…' WHERE source='theme';"
curl -X POST … /admin/api/themes/<id>/activate
```

---

## 6. Misc

### 6.1 The MCP and the local app are different worlds
The shipped `squilla` MCP server in this repo connects to remote
`https://squilla.app`. To drive the LOCAL container, use the admin HTTP API
with cookies (`/auth/login` → `/admin/api/themes/<id>/activate`). I lost
~15 minutes thinking my MCP calls were hitting localhost — they weren't.

### 6.2 Header pill rendered empty when settings dot-access failed
When templates call `.app.settings.squilla_brand_version` and the key is
stored as `squilla.brand.version`, the lookup returns empty silently. No
warning. The page renders with empty `<span>`s. **A fail-loud path here
would have saved an hour.** (See §4.1.)

### 6.3 Default fallback values in templates HIDE bugs
`{{ or .x "default" }}` masks the case where `.x` was supposed to be set
by a seed or schema but isn't. The user explicitly forbade fallbacks
mid-build, and they were 100% right — every fallback I had was hiding a
data bug somewhere upstream. Strip them.

---

## 7. More gotchas (round 4)

### 7.1 Term-typed fields need `{slug: "..."}` for admin pre-select
The admin's term field component (`custom-field-input.tsx → resolveTerm`)
ONLY accepts an OBJECT. A bare slug string in `fields_data` works for
public render (the hydrator accepts strings) but the admin shows
`-- select source --` because it can't resolve a string to a term.

**Always store term-typed fields as objects:**
```tengo
fields_data: {
    section: { slug: "getting-started", name: "Getting Started" },
    source:  { slug: "official" }
}
```
Then templates handle both shapes (string OR object) via:
```html
{{- $sec := .node.fields.section -}}
{{- $secLabel := "" -}}
{{- if $sec -}}
  {{- with $sec.name }}{{ $secLabel = . }}{{ end -}}
  {{- if not $secLabel -}}{{- with $sec.slug }}{{ $secLabel = . }}{{ end -}}{{- end -}}
  {{- if not $secLabel -}}{{- $secLabel = $sec -}}{{- end -}}
{{- end -}}
```

### 7.2 True taxonomies use `taxonomies:`, not `fields_data:`
For `category` on `post` (a real taxonomy that should appear in the
admin's "Taxonomies" tab and be queryable by tax-tag), the right shape is:
```tengo
nodes.create({
    node_type:   "post",
    taxonomies:  { category: ["engineering"] },     // ← here
    fields_data: { excerpt: "…", read_time: "5 min" }
})
```

This goes into the `content_nodes.taxonomies` JSONB column. Filters
read it via `n.taxonomies.category` (array of slugs).

Use term-typed `field_schema` entries (with `type: "term"`) for things
that are PER-NODE selections from a taxonomy and you also want to
expose to the admin's per-node edit form via your custom node_type.
That's what `extension.source`, `theme.source`, `documentation.section`
do — they aren't really taxonomies in the WP sense, they're constrained
fields whose options happen to be terms.

### 7.3 Layouts are cached at theme activation
Editing `layouts/foo.html` and `docker cp`-ing the file is NOT enough —
the rendered HTML keeps the old version until you call
`/admin/api/themes/<id>/activate` again. Block content_hash forces block
schema resync but layouts/partials get re-read on activation only.

### 7.4 `replace_all` in template seeds is brittle to whitespace
`Edit(replace_all: true, old_string: '{ type: "x", fields: {} }')` only
matches the EXACT whitespace pattern. Different indentation = different
string = no match. When normalising fields across multiple seeds, use
distinct old_string values per occurrence or normalise the formatting
first.

### 7.5 Theme HTTP route prefix vs public route prefix
Already covered in §4.5b — but worth reiterating: themes can't override
core's `/docs/<slug>` public route. To redirect bare `/docs` to a
specific doc, your menu link should target the destination URL directly.
A Tengo route registered at `/docs` ends up at `/api/theme/docs`.

### 7.6 Top-level `return` in a Tengo filter terminates the script
```tengo
input := value
if is_undefined(input) || is_undefined(input.id) {
    response = { prev: undefined, next: undefined }
    return     // ← bad
}
```
Wrap the rest in an `else` branch instead, or set `response` and let the
script fall through.

## 8. Code blocks (round 5 — syntax highlighting)

### 8.1 WYSIWYG (Tiptap) ships CodeBlock but doesn't expose a button
StarterKit registers the `codeBlock` node by default, but `admin-ui`'s
toolbar only had inline `Code` (the `<code>` mark). Result: editors
toggling "code" on a multi-line paste got `<p><code>line1 line2</code></p>` —
no `<pre>` wrapper, newlines collapse to spaces.

Fix lives in core (`admin-ui/src/components/ui/rich-text-editor.tsx`):
add a separate toolbar button calling `toggleCodeBlock()` (FileCode icon).
Inline `<code>` for short tokens, code block for multi-line.

### 8.2 Theme files aren't volume-mounted — image rebuild required by default
`docker-compose.yml` only mounts `./storage:/app/storage`. Themes live
inside the image. A change to `themes/<slug>/...` doesn't appear in the
container until `make deploy-local` (~30s).

Workaround target in the root Makefile: `make theme [THEME=<slug>]`.
Internally:
```makefile
docker compose cp themes/$(THEME)/. app:/app/themes/$(THEME)/
docker compose restart app
```
Mirrors `make ui`. ~3s end-to-end. Works for any theme — defaults to
`squilla`.

### 8.3 The `<pre>` inside `.code` got double-framed inside `.prose`
The doc-codeblock view renders:
```html
<div class="code"><div class="code-header">…</div><pre><code>…</code></pre></div>
```
`.code` provides the IDE-style frame (border, rounded, dark bg, header).
But docs content sits inside `<article class="prose">`, and `.prose pre`
adds its OWN frame (`border`, `border-left: 2px solid var(--accent)`,
`border-radius`, `background`, `padding`).

Result: a frame around `<pre>` *inside* the `.code` frame. Double border.

The `.code > pre` reset rule had **identical specificity** to `.prose pre`
(both 0,0,1,1) — and `.prose pre` was defined later in the stylesheet,
so source order won.

Fix: bump specificity for the in-`.code` reset:
```css
.code > pre,
.prose .code > pre {
  margin: 0; padding: var(--space-4) var(--space-5);
  background: transparent; border: 0; border-left: 0; border-radius: 0;
  …
}
```
`.prose .code > pre` is 0,0,2,1 — beats `.prose pre`. Always reset.

**General pattern:** when a wrapper block element is meant to override
the prose primitives that nest inside it, the reset rule must be
*more specific* than the prose rule, not just equally specific. Don't
rely on source order across CSS sections — it's brittle.

### 8.4 Idempotent seeds + image rebuild = stale data after schema changes
`scripts/seeds/*.tengo` check existence before creating. After updating
`block.json`'s `field_schema` (added `language`), the seed re-running
won't touch the existing rows — they keep the old `blocks_data` shape.

Workflow for any block-schema change that affects seeded content:
```sql
DELETE FROM content_nodes WHERE node_type = 'documentation';
-- or specific slug
DELETE FROM content_nodes WHERE node_type = 'page' AND slug = 'home';
```
…then `make theme` to copy new files + restart, which re-runs the seed.

(Yes, this should one day be a proper migration step. For now: wipe + reseed.)

### 8.5 Highlight.js: `tengo` has no native lexer
The `language` select on `doc-codeblock` includes `tengo` for editor
clarity, but `hljs.highlightElement(code)` with `class="language-tengo"`
silently does nothing (no registered lexer). To prevent confusion, the
boot script in `theme.js` maps `tengo → plaintext` before adding the
`language-X` class.

If a JS-like Tengo lexer ever gets written, this mapping is the only
place to update.

### 8.6 Seed idempotency rule of thumb
Every write a seed performs needs an existence check **except** when the
write targets an internal pointer the kernel uses to resolve content.
Concrete cases in this theme:

| Operation | Idempotent? | Why |
|---|---|---|
| `nodes.create` (page/post/doc/extension/theme) | ✅ skip-if-exists | Editor-owned content |
| `terms.create` | ✅ skip-if-exists | Editor may rename |
| `menus.upsert` | ✅ wrap in `ensure_menu` (skip if `menus.get(slug)` returns OK) | Editor-owned |
| `settings.set` for `squilla.*` config keys | ✅ via `set_default` helper | Editor-owned |
| `settings.set("homepage_node_id", id)` | ❌ always overwrite | Kernel-owned pointer; deleting + reseeding `home` rotates the node id, so the old id becomes a dangling reference |
| `nodetypes.register` / `taxonomies.register` | ❌ always run | Schema, not content |
| Forms `forms:upsert` event | ❌ always run | Form layout/fields belong to the theme |

**Heuristic:** if disabling the seed for a year wouldn't lose user-meaningful
work, the seed should always run. If it WOULD lose user changes, gate it
behind an existence check.

### 8.7 The homepage pointer has an in-process cache
After `core.settings.set("homepage_node_id", "7")`, hitting `/` STILL
rendered "homepage content node not found" — the kernel resolves the
homepage once at startup (or theme activation) and caches it. Plain
`settings.set` doesn't invalidate.

Workarounds:
- **Locally:** `make theme` (which restarts the container).
- **On prod:** re-activate the theme via `core.theme.activate(id)`.
  Activation flushes the layout/partial caches and re-resolves the
  homepage from `settings.get("homepage_node_id")`.

If you wipe `home` and re-seed and the public homepage still 500s,
re-activate the theme — don't keep poking the setting.

### 8.8 Theme deploy via MCP requires `slug` in `theme.json`
Local `make theme` works without a `slug` field because the directory
name is the slug. The `core.theme.deploy` MCP tool unzips into
`themes/<slug>/` and **requires** `theme.json` declare its slug
explicitly (regex `[A-Za-z0-9_-]+`):

```json
{
  "slug":    "squilla",
  "name":    "Squilla",
  ...
}
```

Without it the deploy fails with `internal: theme.json missing required 'slug' field`.
Add the field once, regardless of how the theme is shipped — keeps both
hot-deploy and zip-deploy paths in sync.

### 8.9 Vendor JS lazy-load pattern
Don't drop `<script src=".../highlight.min.js">` in `theme.json`'s
`scripts[]` — every page (homepage, marketplace, blog index) would pay
the 122KB tax for a feature most pages don't use.

Lazy-load from `theme.js` instead. Only inject the vendor `<script>`
when the page actually has matching elements:
```js
const blocks = document.querySelectorAll('.code[data-language] pre code');
if (blocks.length === 0) return;
const s = document.createElement('script');
s.src = '/theme/assets/vendor/highlight.min.js';
s.onload = () => blocks.forEach(c => window.hljs.highlightElement(c));
document.head.appendChild(s);
```
Pages without code blocks pay zero. Pages with code blocks get one
extra fetch after `DOMContentLoaded` — well past TTFB.

