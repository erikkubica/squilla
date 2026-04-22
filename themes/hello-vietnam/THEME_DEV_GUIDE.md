# VibeCMS Theme Development Guide

This guide codifies the rules for building a production-grade VibeCMS theme. It
exists because every rule below maps to a real bug we shipped, a session where
an editor opened the admin UI and saw `[object Object]`, a block that rendered
empty because `test_data` was stale, or a "Load from template" button that
produced a blank page.

The golden rule is **the theme must render correctly from a cold boot with
nothing but its own files** — no manual DB edits, no hidden fixups, no magic.
If a reviewer `git clone`s the theme into a fresh VibeCMS instance, activates
it, and loads a template, the result must look exactly like the designer's
handoff.

---

## 1. Blocks

### 1.1 Every block must have complete `test_data`

`test_data` is not decoration. It is:

1. The preview an editor sees before adding the block to a page.
2. The default payload dropped into `blocks_data` when a block is added.
3. The canary for the block renderer — if `test_data` renders correctly, the
   template is sound.

Rules:

- **Every field in `field_schema` must have a value in `test_data`**, including
  optional ones. "Optional" means the editor can remove it, not that the
  theme author is excused from demoing it.
- Content must be **on-brand** — real place names, real voice. Not
  `"Example heading"`, not Lorem Ipsum. An editor dragging in the block
  should see a working, sensible default that they merely tweak, not rebuild.
- Values must match the **exact shape** the renderer expects. Shape mistakes
  are the #1 source of "why does this show `[object Object]`" bugs.

### 1.2 Every field must be declared

No field may be read in `view.html` that is not declared in `block.json`'s
`field_schema`. Templates referring to undeclared fields work at render time
(Go's `html/template` tolerates missing keys) but break in admin — the editor
cannot edit what the schema does not expose.

Checklist before shipping a block:

- [ ] `field_schema` lists every field `view.html` reads.
- [ ] Every field has the **correct type** (see §2).
- [ ] `test_data` contains every field with realistic values.
- [ ] Repeater sub-structures use the key name `sub_fields` (not `fields`).
- [ ] `help` text is written for any field whose purpose isn't obvious from
      its label.

### 1.3 No fallback defaults — gate each field, not the block

Templates **must not** carry hardcoded fallback content. An unset field
means "don't render that piece of UI" — not "show this canned string
instead."

**Wrong** — invents content when data is missing:

```go
<h2>{{ or .heading "Welcome to Vietnam" }}</h2>
<p>{{ or .body "A journey of a lifetime" }}</p>
<a href="{{ or .cta.url "/trips" }}">{{ or .cta.text "Explore" }}</a>
```

**Right** — each piece of UI is wrapped in `{{ with }}` so its absence
removes just that piece, nothing else:

```go
<section>
  {{ with .heading }}<h2>{{ . }}</h2>{{ end }}
  {{ with .body }}<p>{{ . }}</p>{{ end }}
  {{ with .cta }}{{ with .url }}<a href="{{ . }}">{{ $.cta.text }}</a>{{ end }}{{ end }}
</section>
```

If the editor clears the heading, the `<h2>` disappears but the body and CTA
remain untouched. Each field is independent — one missing value must never
suppress siblings.

The only time you gate the *whole block* is when there's genuinely nothing
useful to render without a root input — for example a repeater block with no
items, or a query-driven block whose `list_nodes` query returned zero rows:

```go
{{- with .items -}}
<ul>{{ range . }}<li>{{ .title }}</li>{{ end }}</ul>
{{- end -}}
```

Or:

```go
{{- $trips := filter "list_nodes" (dict "type" "trip" "limit" 3) -}}
{{- if $trips -}}
<section>{{ range $trips }}…{{ end }}</section>
{{- end -}}
```

Why: fallbacks silently rescue missing data, then surprise editors who clear
a field and find it replaced by the theme author's ghost string. The seed,
the template, and the block's `test_data` must carry real content — but the
editor's right to remove that content must be honored literally at render.

### 1.4 Sync the DB after every `block.json` change

Block schemas and templates are cached in the `block_types` DB row. Editing
`block.json` alone does not update the live site. Either:

- Bump `content_hash` on the row to force the theme loader to re-import it, or
- Use the dev-loop shortcut:

  ```sh
  docker compose exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB \
    -c "UPDATE block_types \
        SET content_hash = '\''force-resync-'\''||floor(random()*1000000)::text \
        WHERE source='\''theme'\'';"'
  docker compose restart app
  ```

`source='theme'` must be preserved — block rows owned by extensions or
authored in admin have different sources and must not be touched.

---

## 2. Fields — picking the right type

Using the wrong field type is how you end up with text inputs where there
should be dropdowns, or a "button" that's actually three disconnected strings
the editor is asked to keep in sync by hand.

### 2.1 Taxonomies (tags, categories, topics, …) → `term` field

**Never** use a `text` field for tag/category slots, even if it "feels
simpler." The editor will type `"Foodie"` on Monday and `"foodie "` on Tuesday
and your filter-pills page breaks. Wrong:

```json
{ "key": "tag", "type": "text" }
```

Right:

1. Declare the taxonomy in `theme.tengo` (or via admin).
2. Seed its terms.
3. Use a `term` field bound to that taxonomy:

```json
{
  "key": "tag",
  "label": "Trip Tag",
  "type": "term",
  "taxonomy": "trip_tag",
  "term_node_type": "trip"
}
```

Template access:

```go
{{ with $fd.tag }}{{ .name }}{{ end }}
```

`test_data` shape: `{"name": "Foodie", "slug": "foodie"}` — always an object.

### 2.1b `select` / `radio` / `checkbox` — options are plain strings

Options must be a **flat array of strings**, not `{label, value}` objects:

```json
{ "key": "color", "type": "select", "options": ["red", "yellow", "green"] }
```

**Wrong** — the admin UI renders options directly as React children, and
object options crash the edit page with React error #31
(`Objects are not valid as a React child (found: object with keys {label,
value})`):

```json
{ "options": [{ "label": "Red", "value": "red" }] }
```

If you want human-readable labels that differ from stored values, that is
not yet a supported schema shape — use strings and capitalize them in the
template (`{{ title .color }}`) or map via a small dict. Don't invent an
options object format.

### 2.2 Galleries

There are two correct answers, and one wrong one.

- **Just images?** Use the `gallery` field.
- **Images plus per-item metadata** (caption, credit, link)? Use a `repeater`
  whose `sub_fields` contain exactly one `image` field plus the extra fields
  the template needs.
- **Wrong:** a repeater of `text` fields for image URLs. Editors cannot upload
  that way, and image objects carry `alt`, `width`, `height`, and storage
  metadata that naked URLs lose.

### 2.3 Links / CTAs → `link` field

**Never** split a button into `button_text` + `button_url` + `button_target`.
Use the `link` field:

```json
{ "key": "cta", "type": "link" }
```

`test_data` shape: `{"url": "/trips", "text": "Explore all trips", "target": "_self"}`.

Template:

```go
{{ with $fd.cta }}<a href="{{ .url }}"{{ with .target }} target="{{ . }}"{{ end }}>{{ .text }}</a>{{ end }}
```

### 2.4 Images → `image` field (always objects)

```json
{ "key": "hero", "type": "image" }
```

`test_data` shape: `{"url": "theme-asset:hero-grandma", "alt": "Grandma serving phở in Hanoi"}`.

Never flatten to `"hero": "theme-asset:hero-grandma"` — templates read
`.hero.url` and `.hero.alt`, and a flat string renders as empty in the admin
image picker.

### 2.5 Node references → `node` field

Use `node_type_filter` to scope what editors can pick. Use `multiple: true`
when the template iterates a list. Don't use `text` fields holding slugs —
slugs change, refs don't.

### 2.6 Summary table

| Intent                      | Field type | Shape in `test_data`                                  |
|-----------------------------|------------|-------------------------------------------------------|
| Taxonomy term               | `term`     | `{"name": "Foodie", "slug": "foodie"}`                |
| Image                       | `image`    | `{"url": "theme-asset:key", "alt": "…"}`              |
| Gallery of plain images     | `gallery`  | `[{"url": "theme-asset:a", "alt": "…"}, …]`           |
| Gallery with captions       | `repeater` with `sub_fields: [image, text]`           |
| Button / CTA / any URL      | `link`     | `{"url": "/path", "text": "…", "target": "_self"}`    |
| Reference to other content  | `node`     | `{"id": 123, "slug": "…", "title": "…"}`              |
| Short heading / inline copy | `text`     | `"…"`                                                 |
| Body / paragraph            | `textarea` or `richtext`                              |
| Boolean                     | `toggle`   | `true` / `false`                                      |

---

## 3. Templates

The theme **must** ship `templates/*.json` files — one per page it demos.

Without templates, the editor cannot instantiate a pre-built page. They see an
empty blocks list and must drag every block by hand. That is not a theme —
it's a kit with no assembly instructions.

### 3.1 File layout

```
themes/<name>/
└── templates/
    ├── homepage.json
    ├── about.json
    ├── contact.json
    ├── gallery.json
    └── trips.json
```

Each file is a JSON array of block entries matching what goes into
`content_nodes.blocks_data`:

```json
[
  { "type": "hv-hero",       "fields": { … full populated payload … } },
  { "type": "hv-categories", "fields": { "items": [ … ] } }
]
```

### 3.2 Templates must be fully populated

`fields: {}` is not a template — it is a placeholder with no payload. When an
editor clicks "Load template," every block must arrive with real content so
the page renders on first view, exactly as the design intended.

If your tengo seed passes `fields: {}` to a block, the template still has to
inline the full field payload. The seed and the template serve different
purposes:

- **Seed (tengo)** bootstraps demo content into the DB on first boot.
- **Template (JSON)** is what the editor can re-apply at any time, to any page.

Both must produce identical output. If they diverge, users will see a
regression the moment they click "Load template."

### 3.3 Register every template in `theme.json`

Dropping a JSON file into `templates/` is not enough — the theme loader only
exposes templates listed in `theme.json`:

```json
{
  "templates": [
    { "slug": "homepage", "file": "homepage.json" },
    { "slug": "about",    "file": "about.json" }
  ]
}
```

Without this block, `/admin/templates` is empty even though the files exist
on disk. The `slug` is what editors pick from "Load template"; the `file` is
the path inside `templates/`.

### 3.4 One template per real page

Don't invent templates for pages the theme doesn't seed. Templates that don't
correspond to a real demo page drift from reality and rot quickly. Every
template file should map one-to-one with a node seeded by the theme.

---

## 4. Assets

### 4.1 All media lives in the theme

Images, videos, audio, and fonts used by the theme must be committed under:

```
themes/<name>/assets/
├── images/
├── videos/
├── audio/
└── fonts/
```

No theme should depend on external CDNs, Unsplash hotlinks, or
user-uploaded media for its demo content. If the source goes away, the theme
breaks. Commit the bytes.

### 4.2 Register every asset in `theme.json`

```json
{
  "assets": [
    { "key": "hero-grandma",  "path": "assets/images/hero-grandma.jpg" },
    { "key": "trip-hanoi-food", "path": "assets/images/trip-hanoi-food.jpg" }
  ]
}
```

On activation, VibeCMS imports every registered asset into the media library
and resolves `theme-asset:<key>` refs to the imported media record's URL.
Unregistered files in `assets/` are ignored — they won't be available to
editors through the media picker.

### 4.3 Reference assets by key, never by path

In `test_data`, templates, and seeds, images are always referenced by key:

```json
{ "hero": { "url": "theme-asset:hero-grandma", "alt": "…" } }
```

**Not** `"url": "/theme/assets/images/hero-grandma.jpg"` — that path is an
implementation detail that can change (and has changed — routes collide with
`/media/:id`). Using the `theme-asset:` ref lets the platform swap the
resolution strategy without every theme breaking.

### 4.4 Subject matter must match intent

A "warm Vietnamese grandma" asset key should point at a warm Vietnamese
grandma, not a stock photo of the Grand Canyon because an image search
grabbed the wrong CDN thumbnail. Verify every asset visually before
committing.

---

## 5. Taxonomies & node types

### 5.1 Declare in `theme.tengo`, not in admin

Taxonomies and custom node types the theme relies on must be registered by
the theme's tengo script on activation:

```tengo
core_nodetypes := import("core/nodetypes")
core_taxonomies := import("core/taxonomies")

core_taxonomies.register({
    slug: "trip_tag",
    label: "Trip Tag",
    label_plural: "Trip Tags",
    node_types: ["trip"]
})

core_nodetypes.register({
    slug: "trip",
    label: "Trip",
    label_plural: "Trips",
    taxonomies: ["trip_tag"],
    field_schema: [ … ]
})
```

Why: activating the theme on a fresh instance must produce a working site.
If the node type or taxonomy is missing, every block that depends on it
fails silently.

### 5.2 Seed terms

Taxonomy terms the theme demos (e.g. `Foodie`, `Adventure`, …) must be
created in `theme.tengo` too. A filter-pills block that lists zero terms is
a broken block.

---

## 6. Verification checklist before shipping a theme

Run this list on a **fresh** container (`docker compose down -v &&
docker compose up -d`). Nothing below may pass because of leftover DB state.

- [ ] Every registered asset imports into the media library.
- [ ] Every seeded node renders at its public URL with a 200 status.
- [ ] Every `templates/*.json` loads into an empty page and renders identically
      to the matching seeded page.
- [ ] Every block's admin edit form renders all fields — no `[object Object]`,
      no text inputs where there should be selects or pickers.
- [ ] Every taxonomy listed in a block's or node type's schema has terms
      visible in `/admin/content/<type>/taxonomies/<tax>`.
- [ ] Every template and every demo page visually matches the design handoff
      (checked in a browser, not by diffing HTML).

If any item fails, the theme is not done — regardless of how the code looks.

---

## 7. Custom tengo filters

Blocks and layouts can call theme-provided filters from templates:

```go
{{- $items := filter "list_nodes" (dict "type" "trip" "limit" 6) -}}
```

To add one (e.g. `get_node` to fetch a single node by id):

1. Drop the script at `scripts/filters/<name>.tengo` — it reads `value` (the
   dict passed from the template) and writes `response`.
2. Register it in `scripts/theme.tengo`:

   ```tengo
   filters.add("get_node", "./filters/get_node")
   ```

3. Restart the app — scripts are loaded at boot. New filters aren't hot-reloaded.

If a template calls a filter that isn't registered, the call silently returns
an empty shape (enough to confuse a `{{ with }}` gate) — always double-check
`theme.tengo`'s `filters.add` block when adding a template that uses a new
filter.

---

## 8. Portable refs (slugs) — kernel contract

When a theme references core CMS entities from its seed / templates / block
logic, reference by **slug**, not by numeric id. Ids are local to the current
DB instance and get regenerated whenever a theme is deactivated/reactivated
or migrated between environments.

Entities the kernel guarantees slug-addressability for:

| Entity         | Where the slug lives            | Used by themes for                           |
|----------------|----------------------------------|----------------------------------------------|
| `layouts`      | `layouts.slug`                  | `content_nodes.layout_slug` (node → layout)  |
| `layout_blocks`| `layout_blocks.slug` (partials) | `renderLayoutBlock "<slug>"` in layouts      |
| `block_types`  | `block_types.slug`              | `blocks_data[].type`                         |
| `media_files`  | `media_files.slug`              | future portable media refs                   |
| `node_types`   | `node_types.slug`               | `list_nodes` / `node` field `node_type_filter`|
| `taxonomies`   | `taxonomies.slug`               | `term` field `taxonomy`                      |
| `terms`        | `terms.slug`                    | filter URLs (`/trips?tag=foodie`)            |

The kernel keeps id columns in sync behind the scenes (via `BeforeSave`
hooks) so the admin picker UIs can still talk ids — but the authoritative
reference is the slug. Never hardcode an id in `theme.tengo` or any template
JSON. If the seed needs to point at a layout, point at `"trip"`, not at
`layout_id=72`.

---

## 9. Admin-side theme-asset resolution

When an editor opens a page in admin, the `/admin/api/nodes/:id` endpoint
resolves `theme-asset:<key>` refs in the node's `fields_data` / `blocks_data`
/ `layout_data` / `featured_image` to concrete media objects
(`{url, alt, width, height, mime_type}`). The admin image picker only shows a
thumbnail when `mime_type` begins with `image/` — raw refs render as a file
icon.

For theme authors this means: every theme-asset key you reference from seeds
or templates **must** be declared in `theme.json`'s `assets[]`. The import
pipeline fills the `asset_key` column on `media_files`; the resolver uses
that column to map refs back to real URLs. An orphan `theme-asset:foo` ref
will render as a broken file icon in the admin edit form and as a missing
image in public render — verify every key round-trips before shipping.

---

## 10. The Mandalorian rule

Every block has proper `test_data`. Every field uses the right type. Every
theme ships templates that load fully-populated pages. Every asset lives in
the repo and is registered for import.

This is the way.
