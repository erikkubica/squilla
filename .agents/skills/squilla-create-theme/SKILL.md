---
name: squilla-create-theme
description: |
  Complete, standalone guide for building a Squilla theme from scratch —
  scaffolding themes/<name>/, authoring theme.json, layouts, partials,
  atomic blocks, templates, Tengo seeds, settings, and forms.
---

# Creating a Squilla Theme

Squilla themes operate on an **Operating System Kernel metaphor**:
- The **Kernel** (`cmd/squilla/`, `internal/`) provides infrastructure only (content nodes, authentication, CoreAPI, event bus, template rendering).
- **Themes** (`themes/<slug>/`) represent the entire visitor-facing presentation layer. A theme is a **self-bootstrapping marketing site**: drop a folder into `themes/`, activate it, and an entire turnkey site appears — pages, layouts, atomic blocks, navigation menus, taxonomies, settings, and demo content.

This skill is the **100% self-contained, standalone engineering contract** for building production-ready Squilla themes.

---

## 1. The Three-Layer UI Architecture

Squilla enforces a strict separation of concerns across three template surfaces. Conflating these layers is the #1 architectural bug in themes.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Layout (layouts/*.html)                                             │
│    Document shell, <html>, <head>, global metadata, composite slots.   │
│    Renders page body via: {{ renderLayoutBlock "content" }}            │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │ 2. Partial (partials/*.html)                                 │    │
│    │    Persistent chrome: <header>, nav, <footer>, language bar.  │    │
│    │    Included via: {{ renderLayoutBlock "site-header" }}       │    │
│    └──────────────────────────────────────────────────────────────┘    │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │ 3. Atomic Blocks (blocks/<slug>/view.html)                   │    │
│    │    Reorderable, page-builder section units:                  │    │
│    │    Hero, Features, Pricing, FAQ, Testimonials, CTA.          │    │
│    └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

### Boundary Responsibilities

| Layer | Location | Role & Contents | What it MUST NOT do |
|---|---|---|---|
| **Layout** | `layouts/*.html` | Defines the outer HTML document: `<!doctype html>`, `<head>`, asset link tags, and calls `{{ renderLayoutBlock "content" }}` (or `{{ .node.blocks_html }}`). | NEVER inline block section markup (e.g. hero cards, pricing tables) directly in layouts. |
| **Partial** | `partials/*.html` | Defines persistent global chrome: `<header>`, site navigation, `<footer>`, language switcher. Included via `{{ renderLayoutBlock "partial-slug" }}`. | NEVER put page-specific content or marketing blocks into partials. |
| **Block** | `blocks/<slug>/` | Self-contained, reorderable section units: Hero, Features grid, Testimonials, CTA banner, Pricing matrix, FAQ accordion. | **STRICTLY FORBIDDEN: Monolithic blocks.** Never dump an entire multi-section page or global header/footer into a block. |

### Content Modeling: Node Type Custom Fields vs. Page Blocks
Before building any theme components, map your data to the correct layer:

| Category | Entity Custom Field (`nodetypes.register` -> `fields_data`) | Content Block (`block.json` -> `blocks_data`) |
|---|---|---|
| **What it is** | Inherent properties of the entity (e.g. Tour price, duration, location, max_guests, difficulty, gallery) | Modular, editorial section in the page body (e.g. "Our Story", "FAQ Accordion", "Customer Reviews") |
| **Where it appears** | Archive grid cards (`/experiences`), search filters, booking sidebars, schema.org / JSON-LD, and page hero | Strictly inside the flow of that specific page |
| **Reusability** | Queryable across the entire site by filters and templates | Isolated to the single page where it is placed |
| **BANNED Anti-Pattern** | Dumping entity attributes into a page block (`experience-detail-block`), leaving the node with zero custom fields | Building hardcoded page-specific blocks instead of generic modular sections |

### The Zero-SQL Seeding Law
- **STRICTLY FORBIDDEN**: Running raw SQL queries or manual DB migrations to seed theme content.
- **MANDATORY**: All node types, taxonomies, demo pages, and forms MUST be seeded via `scripts/theme.tengo` on theme activation using the official `core/nodetypes`, `core/nodes`, and `core/taxonomies` modules.

---

## 2. The ZERO FALLBACKS Rule

In Squilla Go templates, the fallback idiom `{{ or .heading "Default Heading" }}` is **STRICTLY FORBIDDEN**.
Furthermore, **naked HTML tags are FORBIDDEN**. Every HTML element containing a field MUST be conditionally wrapped with `{{ if .field }}` or `{{ with .field }}` regardless of whether the field is required or optional, to ensure empty tags (`<h1></h1>`, `<p></p>`) are never rendered into the DOM.

```html
{{/* ❌ FORBIDDEN: Fallbacks hide data bugs, broken seeds, and missing migrations */}}
<h2>{{ or .heading "Welcome to our website" }}</h2>
<a href="{{ or .cta.url "#" }}">{{ or .cta.text "Click Here" }}</a>

{{/* ❌ FORBIDDEN: Naked tags emit empty tags if field is missing or nil */}}
<h1>{{ .heading }}</h1>
<p>{{ .description }}</p>

{{/* ✅ MANDATORY: Gate every field with {{with}} or {{if}}. Zero fallbacks, zero empty DOM tags. */}}
{{ with .heading }}
  <h2>{{ . }}</h2>
{{ end }}
{{ if .description }}
  <p>{{ .description }}</p>
{{ end }}
{{ with .cta }}
  <a href="{{ .url }}" target="{{ .target }}">{{ .text }}</a>
{{ end }}
```

### Why Fallbacks are Toxic:
1. **Silent Bug Masking**: If a Tengo seed script has a typo (`heding` instead of `heading`), an `{{ or .heading "Default" }}` fallback silently renders the fallback string in production while the database row is empty or corrupted.
2. **Editor Confusion**: When an editor empties a field in the admin intending to hide it, a fallback string forces the field to reappear on the live site.
3. **Canonical Location for Defaults**:
   - For fresh editor entries: set `"initialValue"` in `block.json`.
   - For demo sites and seeded pages: pass rich, real-world copy in `scripts/theme.tengo`.
   - Non-content technical parameters (like integer query limits or pagination counts) may use fallback assignment: `{{- $limit := .limit -}}{{- if not $limit -}}{{- $limit = 3 -}}{{- end -}}`. Visible copy MUST NEVER have fallbacks.

---

## 3. Field Types & Best Practices

For in-depth block development, schema mechanics, and editor controls, consult the `squilla-create-block` skill. Theme authors must strictly follow these field type invariants:

### Strict Field Discipline

| Anti-Pattern (FORBIDDEN) | Correct Field Type | Rationale |
|---|---|---|
| Separate `link_text` + `link_url` strings | `type: "link"` | Provides target (`_self`/`_blank`), internal page picker, and URL validation in a single atomic object: `{"text": "...", "url": "...", "target": "_self"}`. |
| Numbered fields (`badge_1_title`, `badge_2_title`, `card_1_img`, `card_2_img`) | `type: "repeater"` (or `type: "array"`) | Dynamic lists must be arrays with nested `fields`. Numbered fields pollute schemas and prevent editors from reordering or scaling items. |
| Numbered image fields (`gallery_1`, `gallery_2`, `gallery_3`, `gallery_4`) | `type: "gallery"` (or `type: "repeater"` of images) | A single image is NOT a gallery. Collections of images must be a `gallery` or array of image objects. |
| Building form input fields inside block schemas | Official `forms` extension (`forms:upsert`) | Forms must never be modeled as block fields. Use the `forms` extension and embed with `{{ event "forms:render" (dict "form_id" "...") }}`. |
| Raw string URL for images (`type: "string"`, `name: "image_url"`) | `type: "image"` | Images are structured objects `{"url": "theme-asset:<key>", "alt": "..."}` that plug into media optimization and responsive srcset pipelines. |
| String `"yes"` / `"no"` or `"true"` / `"false"` | `type: "toggle"` (or `type: "checkbox"`) | Booleans must be native JSON booleans (`true`/`false`), never loose strings. |
| Object array for select options `[{"label": "Red", "value": "red"}]` | Flat string array `["red", "blue", "green"]` | Squilla `select` and `radio` fields expect flat string options. Objects crash the admin editor with React errors. |
| Creating a repeater with manual fields (`title`, `image`, `price`, `url`) for existing entities ("Related Experiences", "Featured Posts") | `type: "reference"` with `node_type_filter` | Entities already exist in the database. Duplicating entity attributes inside repeaters creates disconnected duplicate data that goes stale. |

### Complete Field Types Reference Table

| Type Slug | Editor UI | Stored Data Shape | `test_data` / Seed Shape | Template Access Idiom |
|---|---|---|---|---|
| `string` | Single-line text input | `string` | `"Discover Vietnam"` | `{{ with .heading }}<h1>{{ . }}</h1>{{ end }}` |
| `textarea` | Multi-line text box | `string` | `"Hand-crafted small group tours."` | `{{ with .body }}<p>{{ . }}</p>{{ end }}` |
| `richtext` | WYSIWYG editor | HTML `string` | `"<p>Rich text <strong>markup</strong>.</p>"` | `{{ with .content }}{{ safeHTML . }}{{ end }}` |
| `number` | Numeric input | `float64` / `int` | `42` | `{{ with .count }}<span>{{ . }}</span>{{ end }}` |
| `toggle` | Boolean switch | `bool` | `true` | `{{ if .is_featured }}<span class="badge">Featured</span>{{ end }}` |
| `select` | Dropdown picker | `string` | `"primary"` | `<div class="btn-{{ .style }}">` |
| `radio` | Radio button group | `string` | `"left"` | `<div class="text-{{ .align }}">` |
| `color` | Color picker | hex `string` | `"#0F172A"` | `<div style="background-color: {{ .bg_color }};">` |
| `link` | Text + URL + Target picker | `map[string]any` | `{"text": "Explore", "url": "/trips", "target": "_self"}` | `{{ with .cta }}<a href="{{ .url }}" target="{{ .target }}">{{ .text }}</a>{{ end }}` |
| `image` | Media asset picker | `map[string]any` | `{"url": "theme-asset:hero", "alt": "Hero banner"}` | `{{ with .image }}{{ with .url }}<img src="{{ image_url . "large" }}" alt="{{ $.image.alt }}">{{ end }}{{ end }}` |
| `gallery` | Multi-image selector | `[]map[string]any` | `[{"url": "theme-asset:g1", "alt": "A"}, {"url": "theme-asset:g2", "alt": "B"}]` | `{{ range .gallery }}<img src="{{ .url }}" alt="{{ .alt }}">{{ end }}` |
| `term` | Taxonomy term selector | `map[string]any` | `{"slug": "foodie", "name": "Foodie"}` | `{{ with .category }}<span class="tag">{{ .name }}</span>{{ end }}` |
| `reference` | Node relationship picker (`node_type_filter`, `multiple: true/false`) | `map[string]any` or `[]map[string]any` | `[{"id": 1, "title": "Hanoi Tour", "slug": "hanoi-tour"}]` | `{{ range .related_nodes }}{{ $n := filter "get_node" (dict "id" .id) }}<a href="{{ $n.full_url }}">{{ $n.title }}</a>{{ end }}` |
| `form_selector` | Forms dropdown | `string` (slug) | `"contact"` | `{{ safeHTML (event "forms:render" (dict "form_id" .form_slug)) }}` |
| `repeater` / `array` | Nested array list (ad-hoc items only!) | `[]map[string]any` | `[{"title": "Item 1"}, {"title": "Item 2"}]` | `{{ range .items }}<div>{{ .title }}</div>{{ end }}` |
| `object` | Key-value container | `map[string]any` | `{"title": "Card", "link": {"url": "..."}}` | `{{ with .card }}<h3>{{ .title }}</h3>{{ end }}` |

---

## 4. Theme Structure & Folder Anatomy

Every theme lives in its own subdirectory under `themes/<slug>/`:

```
themes/my-theme/
├── theme.json                     # Theme manifest (metadata, styles, scripts, layouts, blocks)
├── layouts/                       # Go html/template page shells
│   ├── default.html               # Default layout (REQUIRED, is_default: true)
│   ├── 404.html                   # Dedicated Not Found layout (slug: "404")
│   └── post.html                  # Custom layout for specific node types
├── partials/                      # Reusable layout fragments (headers, footers)
│   ├── site-header.html           # Rendered via {{ renderLayoutBlock "site-header" }}
│   └── site-footer.html           # Rendered via {{ renderLayoutBlock "site-footer" }}
├── blocks/                        # Atomic content blocks (slug prefixed: sq-hero, sq-cta)
│   ├── sq-hero/
│   │   ├── block.json             # Block schema and test_data
│   │   ├── view.html              # Go html/template view
│   │   ├── style.css              # (Optional) Auto-injected block styles
│   │   └── script.js              # (Optional) Auto-injected block scripts
│   └── sq-features/
│       ├── block.json
│       └── view.html
├── templates/                     # Pre-packaged page blueprints for admin "Load Template"
│   ├── homepage.json
│   └── contact.json
├── assets/                        # Static assets served from /theme/assets/
│   ├── styles/theme.css           # Global theme stylesheet
│   ├── scripts/theme.js           # Global theme javascript
│   └── images/hero.webp           # Registered in theme.json assets[]
├── forms/                         # (Optional) Themed HTML layouts for forms extension
│   └── contact.html
├── settings/                      # (Optional) Schema for admin-editable Theme Settings
│   ├── header.json
│   └── footer.json
└── scripts/
    ├── theme.tengo                # Entry point: runs once on activation to seed content
    └── filters/                   # Reusable Tengo filters
        └── list_nodes.tengo       # Callable via {{ filter "list_nodes" (dict ...) }}
```

---

## 5. The Theme Manifest (`theme.json`)

`theme.json` is the static contract. Everything the theme registers must be explicitly declared here.

```json
{
  "name": "Squilla Showcase",
  "slug": "squilla-showcase",
  "version": "1.0.0",
  "description": "High-performance marketing theme with atomic blocks and dark mode.",
  "author": "Squilla Core Team",

  "styles": [
    { "handle": "theme-css", "src": "styles/theme.css", "position": "head" }
  ],

  "scripts": [
    { "handle": "theme-js", "src": "scripts/theme.js", "position": "footer", "defer": true, "deps": [] }
  ],

  "layouts": [
    { "slug": "default", "name": "Default Layout", "file": "default.html", "is_default": true },
    { "slug": "404", "name": "404 Not Found", "file": "404.html" }
  ],

  "partials": [
    { "slug": "site-header", "name": "Site Header", "file": "site-header.html" },
    { "slug": "site-footer", "name": "Site Footer", "file": "site-footer.html" }
  ],

  "blocks": [
    { "slug": "sq-hero", "dir": "sq-hero" },
    { "slug": "sq-features", "dir": "sq-features" }
  ],

  "templates": [
    { "slug": "homepage", "name": "Home Page", "file": "homepage.json" }
  ],

  "assets": [
    { "key": "hero-bg", "src": "images/hero.webp", "alt": "Modern architecture showcase", "width": 1920, "height": 1080 }
  ],

  "image_sizes": [
    { "name": "card-thumb", "width": 480, "height": 320, "mode": "crop", "quality": 85 }
  ],

  "settings_pages": [
    { "slug": "brand", "name": "Brand Settings", "file": "settings/brand.json", "icon": "Palette" }
  ]
}
```

### Manifest Field Specifications

- **`slug`**: Alphanumeric and dashes only (`^[a-z0-9_-]+$`). Required for remote deploys.
- **`styles[].position`**: `"head"` or `"footer"`.
- **`scripts[].position`**: `"head"` or `"footer"`. Set `"defer": true` for non-blocking execution.
- **`layouts[].is_default`**: Exactly one layout MUST be designated as default (`true`).
- **`layouts[].slug: "404"`**: Special reserved slug. Automatically rendered by the public router when a requested URL is not found.
- **`blocks[].slug`**: Always namespace your block slugs with your theme prefix (e.g. `sq-hero`, `sq-grid`) to avoid collisions with extension-registered blocks.
- **`assets[].key`**: Alphanumeric key used for the `theme-asset:<key>` resolution system.

---

## 6. Template Engine, Contexts & Built-in Functions

### Context Scope Separation (Layout vs Partial vs Block)

Conflating context scopes causes immediate render errors or silent empty strings:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LAYOUT CONTEXT (layouts/*.html)                                        │
│ .node            → Full node record (id, title, slug, fields, seo...) │
│ .site            → Site-wide metadata (name, url, tagline)             │
│ .settings        → Map of all site settings: map[string]string         │
│ .app             → Runtime chrome: .app.menus, .app.head, .app.theme_url│
│ .user            → Auth status (logged_in, id, email, role)            │
│ .theme_settings  → Theme-specific settings pages                      │
├────────────────────────────────────────────────────────────────────────┤
│ PARTIAL CONTEXT (partials/*.html)                                      │
│ Sees everything a Layout sees, plus `.partial` field values.           │
├────────────────────────────────────────────────────────────────────────┤
│ BLOCK VIEW CONTEXT (blocks/<slug>/view.html)                           │
│ ONLY the block's own fields at root! ({{ .heading }}, {{ .cta }})      │
│ ❌ .app is NOT in scope!                                               │
│ ❌ .node is NOT in scope!                                              │
│ (To query other nodes, use {{ filter "list_nodes" ... }})              │
└────────────────────────────────────────────────────────────────────────┘
```

### Content Ingestion in Layouts

A layout template wraps the page and renders the compiled blocks using either:
1. `{{ renderLayoutBlock "content" }}` — Standard semantic block call.
2. `{{ .node.blocks_html }}` — Direct output of the pre-rendered block HTML.

Both inject the sequence of blocks configured for the current node.

### Settings Keys & Dotted Namespaces

All site settings in Squilla keep their literal dotted strings in the database (e.g. `site.name`, `sq.brand.tagline`, `theme.brand.name`).
Because Go `html/template` interprets dots as object field selectors, writing `{{ .app.settings.theme.brand.name }}` will FAIL.

**Always use the `index` function or `mustSetting` helper**:

```html
{{/* Standard safe access */}}
{{ $tagline := index .app.settings "sq.brand.tagline" }}
{{ with $tagline }}<p>{{ . }}</p>{{ end }}

{{/* mustSetting: Fails LOUDLY with an error if the key is missing or empty */}}
<span>{{ mustSetting .app.settings "site.copyright_year" }}</span>
```

### Modern Composite Slots

Rather than manually looping through style and script tags in `<head>`, use Squilla's 4 composite slots. These aggregate theme assets and extension contributions:

```html
<!doctype html>
<html lang="{{ .node.language_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ if and .node.seo .node.seo.meta_title }}{{ .node.seo.meta_title }}{{ else }}{{ .node.title }}{{ end }}</title>
  {{ .app.head }} {{/* Theme CSS + Block CSS + SEO meta/OG tags + Extension <head> contributions */}}
</head>
<body>
  {{ .app.body_start }} {{/* Extension scripts immediately after <body> (e.g. GTM noscript) */}}

  {{ renderLayoutBlock "site-header" }}

  <main id="main-content">
    {{ renderLayoutBlock "content" }}
  </main>

  {{ renderLayoutBlock "site-footer" }}

  {{ .app.footer }}   {{/* Extension footer widgets */}}
  {{ .app.body_end }} {{/* Theme JS + Block JS + Analytics + Extension deferred scripts */}}
</body>
</html>
```

### Template Helper Functions

Available in all layouts, partials, and block views:

| Function | Signature | Usage & Description |
|---|---|---|
| `renderLayoutBlock` | `(slug string) → template.HTML` | **Layouts/partials only.** Renders a partial by its declared slug: `{{ renderLayoutBlock "site-header" }}`. |
| `safeHTML` | `(string) → template.HTML` | Marks HTML string as trusted (bypasses auto-escaping). Use for rich text and `event` output. |
| `safeURL` | `(string) → template.URL` | Marks URL string as trusted. |
| `image_url` | `(url string, size string) → template.URL` | Returns optimized media URL for size variant: `{{ image_url .url "card-thumb" }}`. |
| `image_srcset` | `(url string, sizes ...string) → string` | Generates HTML `srcset` attribute: `{{ image_srcset .url "small" "medium" "large" }}`. |
| `filter` | `(name string, payload any) → any` | Executes a registered Tengo filter: `{{ $nodes := filter "list_nodes" (dict "type" "post") }}`. |
| `event` | `(name string, payload any) → template.HTML` | Emits an event to extensions and returns compiled HTML (e.g. forms render). |
| `dict` | `(keysAndValues ...any) → map[string]any` | Constructs a dictionary in templates: `(dict "limit" 3 "type" "trip")`. |
| `list` | `(items ...any) → []any` | Constructs an array slice in templates: `(list "a" "b" "c")`. |
| `seq` | `(n int) → []int` | Generates a 0-indexed slice of length n: `{{ range seq 5 }}`. |
| `mod`, `add`, `sub` | `(a int, b int) → int` | Arithmetic helpers: `{{ if eq (mod $index 2) 0 }}`. |
| `split` | `(sep string, s string) → []string` | Splits a string into an array. |
| `lastWord` | `(s string) → string` | Returns the last word in a sentence (great for gradient-text styling). |
| `beforeLastWord` | `(s string) → string` | Returns everything preceding the last word. |
| `themeSetting` | `(page string, key string) → any` | Reads a setting from a Theme Settings page: `{{ themeSetting "brand" "logo" }}`. |
| `themeSettingsPage` | `(page string) → map[string]any` | Reads an entire Theme Settings page as a map. |

---

## 7. Tengo Seeding Scripts (`scripts/theme.tengo`)

`scripts/theme.tengo` executes when a theme is activated and on every app restart. It is responsible for setting up everything the static JSON cannot declare: custom node types, taxonomies, settings, menus, and initial demo pages.

### The Idempotency Law
**Every seed action in `theme.tengo` MUST be idempotent.** If a page, setting, or menu already exists, the script must safely skip it or perform an upsert without duplicating database records or overwriting editor edits.

### `blocks_data` vs `fields_data` (The #1 Silent Data Drop)

When writing Tengo scripts, understand the difference between node fields and block fields:

```tengo
// 1. Top-level node creation uses `fields_data:` for custom node fields
nodes.create({
    node_type: "post",
    title: "My Post",
    slug: "my-post",
    fields_data: {
        read_time: "5 min",
        author_name: "Jane Doe"
    }
})

// 2. Block instances inside `blocks_data:` use `fields:` for their field values!
nodes.create({
    node_type: "page",
    title: "Home",
    slug: "home",
    status: "published",
    blocks_data: [
        {
            type: "sq-hero",
            fields: { // ◄── MUST BE "fields", NEVER "fields_data"
                heading: "Empower Your Digital Growth",
                cta: { text: "Get Started", url: "/contact", target: "_self" },
                image: { url: "theme-asset:hero-bg", alt: "Squilla Hero" }
            }
        }
    ]
})
```

### Core Tengo Modules

```tengo
log         := import("core/log")          // log.info, log.warn, log.err (NOTE: log.error is a parse error!)
nodes       := import("core/nodes")        // nodes.create, nodes.query, nodes.get, nodes.delete
nodetypes   := import("core/nodetypes")    // nodetypes.register
taxonomies  := import("core/taxonomies")   // taxonomies.register
terms       := import("core/terms")        // terms.create
settings    := import("core/settings")     // settings.get, settings.set
menus       := import("core/menus")        // menus.upsert
filters     := import("core/filters")      // filters.add
events      := import("core/events")       // events.emit, events.subscribe
assets      := import("core/assets")       // assets.read("forms/contact.html")
```

### Tengo Caveats to Remember:
1. `error` is a reserved identifier in Tengo. Writing `log.error("...")` will cause a **Tengo parse error**. Always use `log.err("...")` or `log.warn("...")`.
2. Navigation menu items should always reference pages by slug using `page: "<slug>"`. Do NOT use hardcoded paths like `url: "/about"`. If an editor changes a page's URL slug, slug-bound menu items track it automatically.
3. Fast dev-mode iteration: Squilla provides a global `dev_mode` boolean inside Tengo when `SQUILLA_DEV_MODE=true` is set. Use this to delete and recreate pages during active local development.

---

## 8. Theme Settings (Editor-Driven Customization)

Themes can expose custom settings panels directly in the Squilla Admin UI under **Theme Settings** without writing any React code.

1. Declare pages in `theme.json`:
   ```json
   "settings_pages": [
     { "slug": "brand", "name": "Brand & Styles", "file": "settings/brand.json", "icon": "Palette" }
   ]
   ```
2. Create the schema in `settings/brand.json`:
   ```json
   {
     "name": "Brand & Styles",
     "description": "Configure company logo, brand color, and announcement banner.",
     "fields": [
       { "name": "logo", "title": "Logo", "type": "image", "description": "Header brand logo" },
       { "name": "accent_color", "title": "Accent Color", "type": "color", "initialValue": "#3B82F6" },
       { "name": "announcement_text", "title": "Announcement Text", "type": "string" },
       { "name": "show_announcement", "title": "Show Announcement", "type": "toggle", "initialValue": false }
     ]
   }
   ```
3. Access values in templates:
   ```html
   {{ $brand := themeSettingsPage "brand" }}
   {{ if $brand.show_announcement }}
     <div class="announcement">{{ $brand.announcement_text }}</div>
   {{ end }}
   ```

---

## 9. Assets & `theme-asset:<key>` Resolution

Never hardcode public URLs like `/theme/assets/images/hero.webp` in templates, test data, or seeds.

### The `theme-asset:` Contract
1. Put the image in `assets/images/hero.webp`.
2. Declare it in `theme.json` `assets[]`:
   ```json
   "assets": [
     { "key": "hero-img", "src": "images/hero.webp", "alt": "Mountain sunrise" }
   ]
   ```
3. Reference it everywhere using the URI scheme `theme-asset:hero-img`:
   - In `block.json` `test_data`: `{"url": "theme-asset:hero-img", "alt": "Mountain sunrise"}`
   - In `theme.tengo` seed data: `image: { url: "theme-asset:hero-img", alt: "Mountain sunrise" }`
   - In page blueprints (`templates/*.json`): `{"url": "theme-asset:hero-img", ...}`

When the theme activates, the kernel's media pipeline imports the asset into the media library, resolves `theme-asset:hero-img` to its real cached media path, and serves responsive webp/avif sizes via `image_url` and `image_srcset`.

---

## 10. Forms Extension Handshake

Themes do NOT render raw HTML `<form action="/submit">` tags with custom submission scripts. Instead, themes integrate seamlessly with Squilla's **forms extension** via a clean 3-step handshake:

### Step 1: Create the Styled Form Layout (`forms/contact.html`)
The theme supplies the input classes and visual structure:

```html
<form class="space-y-4">
  <div class="form-group">
    <label class="block text-sm font-medium">{{ .name.label }}</label>
    <input type="text" name="{{ .name.id }}" class="theme-input" placeholder="{{ .name.placeholder }}" {{ if .name.required }}required{{ end }}>
  </div>
  <div class="form-group">
    <label class="block text-sm font-medium">{{ .email.label }}</label>
    <input type="email" name="{{ .email.id }}" class="theme-input" placeholder="{{ .email.placeholder }}" {{ if .email.required }}required{{ end }}>
  </div>
  <div class="form-group">
    <label class="block text-sm font-medium">{{ .message.label }}</label>
    <textarea name="{{ .message.id }}" class="theme-textarea" rows="4" {{ if .message.required }}required{{ end }}></textarea>
  </div>
  <button type="submit" class="theme-btn-primary">Send Message</button>
</form>
```

### Step 2: Seed the Form in `scripts/theme.tengo`
Read the layout using `core/assets` and emit `forms:upsert`:

```tengo
events := import("core/events")
assets := import("core/assets")
log    := import("core/log")

layout_code := assets.read("forms/contact.html")
if is_error(layout_code) {
    log.err("Failed to load contact form layout: " + string(layout_code))
    layout_code = ""
}

events.emit("forms:upsert", {
    slug: "contact",
    name: "Contact Form",
    layout: layout_code,
    settings: {
        success_message: "Thank you! Your message has been received.",
        store_ip: true,
        honeypot_enabled: true
    },
    fields: [
        { id: "name", type: "text", label: "Full Name", placeholder: "Alex Morgan", required: true },
        { id: "email", type: "email", label: "Email Address", placeholder: "alex@example.com", required: true },
        { id: "message", type: "textarea", label: "Message", placeholder: "How can we help?", required: true }
    ]
})
```

### Step 3: Render the Form in a Block or Layout
Use the `event "forms:render"` template function:

```html
<div class="contact-form-container">
  {{ safeHTML (event "forms:render" (dict "form_id" "contact")) }}
</div>
```

The forms extension handles input validation, spam filtering, database storage, email notifications, and AJAX success state transitions automatically.

---

## 11. Complete Working Starter Theme

Here is a minimal, fully functioning starter theme implementing all core rules.

### `theme.json`
```json
{
  "name": "Starter Theme",
  "slug": "starter-theme",
  "version": "1.0.0",
  "description": "Minimal, clean Squilla starter theme.",
  "author": "Squilla Architect",
  "styles": [
    { "handle": "theme-css", "src": "styles/theme.css", "position": "head" }
  ],
  "scripts": [],
  "layouts": [
    { "slug": "default", "name": "Default Layout", "file": "default.html", "is_default": true },
    { "slug": "404", "name": "Not Found", "file": "404.html" }
  ],
  "partials": [
    { "slug": "site-header", "name": "Site Header", "file": "site-header.html" },
    { "slug": "site-footer", "name": "Site Footer", "file": "site-footer.html" }
  ],
  "blocks": [
    { "slug": "sq-hero", "dir": "sq-hero" },
    { "slug": "sq-features", "dir": "sq-features" }
  ],
  "templates": [
    { "slug": "homepage", "name": "Homepage", "file": "homepage.json" }
  ],
  "assets": [
    { "key": "hero-bg", "src": "images/hero.webp", "alt": "Starter Hero" }
  ]
}
```

### `layouts/default.html`
```html
<!doctype html>
<html lang="{{ .node.language_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ if and .node.seo .node.seo.meta_title }}{{ .node.seo.meta_title }}{{ else }}{{ .node.title }}{{ end }}</title>
  {{ .app.head }}
</head>
<body class="bg-slate-50 text-slate-900 antialiased flex flex-col min-h-screen">
  {{ .app.body_start }}

  {{ renderLayoutBlock "site-header" }}

  <main class="flex-grow">
    {{ renderLayoutBlock "content" }}
  </main>

  {{ renderLayoutBlock "site-footer" }}

  {{ .app.footer }}
  {{ .app.body_end }}
</body>
</html>
```

### `partials/site-header.html`
```html
{{- $menu := index .app.menus "main-nav" -}}
<header class="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
    <a href="/" class="font-bold text-xl tracking-tight text-slate-900">
      {{ index .app.settings "site.name" }}
    </a>
    <nav class="flex items-center gap-6">
      {{- if $menu -}}
        {{- range $menu.items -}}
          <a href="{{ .url }}" target="{{ .target }}" class="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            {{ .title }}
          </a>
        {{- end -}}
      {{- end -}}
    </nav>
  </div>
</header>
```

### `partials/site-footer.html`
```html
<footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
  <div class="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
    <div class="text-sm">
      © {{ mustSetting .app.settings "site.copyright_year" }} {{ index .app.settings "site.name" }}. All rights reserved.
    </div>
    <div class="text-sm">
      Powered by <span class="text-white font-medium">Squilla CMS</span>
    </div>
  </div>
</footer>
```

### `blocks/sq-hero/block.json`
```json
{
  "slug": "sq-hero",
  "name": "Hero Section",
  "description": "High-impact opening hero with title, description, call to action, and image.",
  "category": "marketing",
  "fields": [
    { "name": "heading", "title": "Heading", "type": "string", "description": "Main H1 title", "required": true },
    { "name": "subheading", "title": "Subheading", "type": "textarea", "description": "Supporting paragraph" },
    { "name": "cta", "title": "Call to Action", "type": "link", "description": "Primary action button" },
    { "name": "image", "title": "Hero Image", "type": "image", "description": "Featured visual asset" }
  ],
  "test_data": {
    "heading": "Build Smarter Sites Faster",
    "subheading": "Squilla combines kernel simplicity with dynamic Go templates and Tengo scripting.",
    "cta": { "text": "Explore Features", "url": "#features", "target": "_self" },
    "image": { "url": "theme-asset:hero-bg", "alt": "Squilla Dashboard Preview" }
  }
}
```

### `blocks/sq-hero/view.html`
```html
{{- $imgUrl := "" -}}{{- $imgAlt := "" -}}
{{- with .image -}}
  {{- with .url -}}{{- $imgUrl = . -}}{{- end -}}
  {{- with .alt -}}{{- $imgAlt = . -}}{{- end -}}
{{- end -}}

<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
    <div>
      {{ with .heading }}
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          {{ . }}
        </h1>
      {{ end }}

      {{ with .subheading }}
        <p class="text-lg text-slate-600 mb-8 leading-relaxed">
          {{ . }}
        </p>
      {{ end }}

      {{ with .cta }}
        <div>
          <a href="{{ .url }}" target="{{ .target }}" class="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm">
            {{ .text }}
          </a>
        </div>
      {{ end }}
    </div>

    {{ if $imgUrl }}
      <div class="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-100">
        <img src="{{ image_url $imgUrl "large" }}" alt="{{ $imgAlt }}" class="w-full h-auto object-cover" loading="eager">
      </div>
    {{ end }}
  </div>
</section>
```

### `blocks/sq-features/block.json`
```json
{
  "slug": "sq-features",
  "name": "Features Grid",
  "description": "Displays a grid of value propositions using a repeater list.",
  "category": "marketing",
  "fields": [
    { "name": "section_title", "title": "Section Title", "type": "string" },
    {
      "name": "features",
      "title": "Feature Cards",
      "type": "repeater",
      "fields": [
        { "name": "title", "title": "Feature Title", "type": "string", "required": true },
        { "name": "description", "title": "Description", "type": "textarea", "required": true }
      ]
    }
  ],
  "test_data": {
    "section_title": "Why Choose Squilla",
    "features": [
      { "title": "Pure Go Performance", "description": "Sub-millisecond render times with zero Node.js server dependencies." },
      { "title": "Self-Bootstrapping", "description": "Themes seed their own layouts, blocks, and demo pages on activation." },
      { "title": "Atomic Extensibility", "description": "Clean gRPC and Tengo contracts keep the kernel lightweight and decoupled." }
    ]
  }
}
```

### `blocks/sq-features/view.html`
```html
<section id="features" class="py-20 bg-slate-50 border-t border-slate-200">
  <div class="max-w-6xl mx-auto px-4">
    {{ with .section_title }}
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">{{ . }}</h2>
      </div>
    {{ end }}

    {{ with .features }}
      <div class="grid md:grid-cols-3 gap-8">
        {{ range . }}
          <div class="p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 class="text-xl font-semibold text-slate-900 mb-3">{{ .title }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ .description }}</p>
          </div>
        {{ end }}
      </div>
    {{ end }}
  </div>
</section>
```

### `scripts/theme.tengo`
```tengo
log      := import("core/log")
settings := import("core/settings")
menus    := import("core/menus")
nodes    := import("core/nodes")

log.info("Starting Starter Theme activation...")

// 1. Seed Site Settings (Idempotent: only sets if missing)
seed_setting := func(key, value) {
    existing := settings.get(key)
    if existing == "" || is_error(existing) {
        settings.set(key, value)
    }
}
seed_setting("site.name", "Squilla Showcase")
seed_setting("site.copyright_year", "2026")

// 2. Seed Homepage (Existence checked: never overwrites existing content)
home_res := nodes.query({ node_type: "page", slug: "home", limit: 1 })
home_id := 0

if home_res.total == 0 {
    home_node := nodes.create({
        title: "Home",
        slug: "home",
        node_type: "page",
        status: "published",
        blocks_data: [
            {
                type: "sq-hero",
                fields: {
                    heading: "Build Smarter Sites Faster",
                    subheading: "Squilla combines kernel simplicity with dynamic Go templates and Tengo scripting.",
                    cta: { text: "Explore Features", url: "#features", target: "_self" },
                    image: { url: "theme-asset:hero-bg", alt: "Squilla Dashboard Preview" }
                }
            },
            {
                type: "sq-features",
                fields: {
                    section_title: "Engineered for Velocity",
                    features: [
                        { title: "Pure Go Performance", description: "Sub-millisecond render times with zero runtime overhead." },
                        { title: "Zero Fallback Architecture", description: "Bulletproof schemas and seeds ensure production data integrity." },
                        { title: "Atomic Blocks", description: "Modular sections that editors can reorder and customize with ease." }
                    ]
                }
            }
        ]
    })
    home_id = home_node.id
    log.info("Seeded homepage with ID: " + string(home_id))
} else {
    home_id = home_res.nodes[0].id
}

if home_id > 0 {
    settings.set("homepage_node_id", string(home_id))
}

// 3. Seed Primary Navigation Menu (Slug-based: survives URL changes)
menus.upsert({
    slug: "main-nav",
    name: "Primary Navigation",
    items: [
        { label: "Home", page: "home" },
        { label: "Features", url: "/#features", target: "_self" }
    ]
})

log.info("Starter Theme activated successfully.")
```

---

## 12. The 12 Mandalorian Invariant Theme Laws

Memorize these twelve rules. They represent the boundary between fragile sites and flawless production themes:

1. **Atomic Blocks Only (No Monoliths)**: Every block represents a single semantic section. Never combine header, body, and footer into one mega-block.
2. **The ZERO FALLBACKS Rule**: `{{ or .field "Default" }}` is forbidden. Gate fields with `{{ with }}`; defaults belong in `block.json` or Tengo seeds.
3. **Strict Field Typing**: Always use `link` for links, `repeater` for lists, `image` for media, and `toggle` for booleans.
4. **All Images Use `theme-asset:<key>`**: Never hardcode direct file system paths like `/theme/assets/images/...`.
5. **Assets Declared in `theme.json`**: Every image referenced via `theme-asset:` must appear in the manifest's `assets[]` array with an informative `alt` string.
6. **Blueprints for Demo Pages**: Every seeded page should have an accompanying `templates/<slug>.json` file so editors can recreate it in the admin.
7. **Idempotent Tengo Scripts**: Activation seeds must check for existence before inserting. Menus and settings must use upsert semantics.
8. **Delegated Form Handshake**: Never code custom `<form>` submission endpoints in JavaScript. Always use the `forms:upsert` and `event "forms:render"` handshake.
9. **Namespaced Settings**: Namespace theme settings using `<prefix>.<dot.path>` (e.g. `sq.brand.tagline`) to avoid clobbering system settings.
10. **Slug-Bound Menus**: Menu items must link to pages via `page: "<slug>"` rather than static `url: "/..."`.
11. **Proper CSS Scoping**: Block-specific styling belongs in `blocks/<slug>/style.css`. Global theme styling belongs in `assets/styles/theme.css`.
12. **Zero Dead Fields**: If a field is removed from `view.html`, remove it from `block.json`, `templates/*.json`, and `theme.tengo`. Schema and templates must remain in 100% synchronization.

---

## 13. Troubleshooting & Verification

| Symptom | Root Cause | Solution |
|---|---|---|
| Block does not appear in admin picker | Block slug not listed in `theme.json` `blocks[]`, or theme inactive. | Add block entry to `theme.json` and reactivate the theme. |
| Block renders completely blank on page | Field missing from `blocks_data`, or `{{with}}` gate hides unset field. | Verify the block instance fields in the admin node editor or Tengo seed. |
| Admin shows `[object Object]` in field | `test_data` shape does not match declared `type` (e.g. `image` given as a string). | Check the Field Types Reference table and format `test_data` as `{ url, alt }`. |
| Block schema edits not visible in admin | `content_hash` matches cached DB row. | Update `content_hash` in `block_types` or restart the app container. |
| Image renders as `#ZgotmplZ` | `theme-asset:<key>` failed to resolve (typo or key missing from `theme.json`). | Verify the key in `theme.json` `assets[]` and ensure the file exists on disk. |
| Layout fails with empty settings value | Settings key accessed using dot traversal (e.g. `.app.settings.theme.brand`). | Use `{{ index .app.settings "theme.brand" }}` or `{{ mustSetting .app.settings "theme.brand" }}`. |
| Form submissions not saving | Theme used raw HTML `<form>` instead of the forms extension handshake. | Switch to `event "forms:render"` and seed the form layout with `forms:upsert`. |
| Tengo script throws parse error on boot | Used `log.error(...)` instead of `log.err(...)` or `log.warn(...)`. | Replace `log.error` with `log.err` or `log.warn`. `error` is a reserved keyword in Tengo. |
| `renderLayoutBlock` renders nothing in block | `renderLayoutBlock` is only available in Layouts and Partials, not in Block views. | Render partials in your layout shell, not inside individual blocks. |
