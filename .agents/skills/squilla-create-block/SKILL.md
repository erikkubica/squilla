---
name: squilla-create-block
description: |
  Create modular, self-contained content blocks for Squilla CMS themes and
  page templates. Covers block anatomy (block.json + view.html + scoped CSS/JS),
  the strict Zero Fallbacks Rule, atomic block architecture, complete field type
  reference with schemas and Go template patterns, strict rules & anti-patterns,
  and production-ready copy-pasteable blocks.
---

# Creating Squilla Content Blocks

This skill is the complete, self-contained reference guide for building content blocks in **Squilla CMS**. A content block is a modular, reusable slice of a page (Hero, Feature Grid, Testimonials, FAQ, Pricing, CTA) that combines a typed data schema with a Go `html/template` view.

---

## 1. Block Anatomy & Architecture

Every block lives in its own directory under the active theme:

```text
themes/<theme-slug>/blocks/<block-slug>/
├── block.json       # Field schema definition and preview test_data (Required)
├── view.html        # Go html/template markup (Required)
├── style.css        # Scoped CSS injected into <head> on pages using this block (Optional)
└── script.js        # Scoped JS injected before </body> on pages using this block (Optional)
```

### Manifest Registration

Every block must be registered in the theme manifest (`themes/<theme-slug>/theme.json`) under the `blocks` array:

```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "blocks": [
    "hero",
    "feature-grid"
  ]
}
```

The directory name under `blocks/` must match the slug in `theme.json` exactly.

---

## 2. Core Architectural Principles

### 2.1 Atomic Block Boundaries & Composition
1. **Single Responsibility**: Each block owns exactly ONE cohesive visual section (e.g., Hero, Features, Pricing, Testimonials, FAQ, CTA, RichText, Form, Stats, Team).
2. **Mega-Blocks Are Strictly Forbidden**: Never create monolithic blocks like `homepage_content`, `all_in_one_landing`, `experience_detail`, or `product_detail` that combine an entire page into a single block. Divide distinct sections into atomic, standalone blocks.
3. **Chrome Isolation**: Blocks **never** render global site chrome like `<header>` with site navigation, breadcrumbs, or `<footer>`. Page chrome belongs strictly in theme layouts (`layouts/*.html`) or partials (`partials/*.html`). Blocks only render section body content (`<section>`, `<article>`, `<div>`).
4. **Re-Orderability**: Blocks must be completely decoupled and independent. Any block must be able to appear multiple times on a page, in any order, without breaking styling or JavaScript behavior.

### 2.2 Content Modeling Law: Node Type Custom Fields vs. Content Blocks
Before creating any block, determine whether the data belongs to the **Node Entity** or to the **Page Layout**:

| Category | Entity Custom Field (`nodetypes.register` -> `fields_data`) | Content Block (`block.json` -> `blocks_data`) |
|---|---|---|
| **What it is** | Inherent properties of the entity (e.g. Tour price, duration, location, max_guests, difficulty, gallery) | Modular, editorial section in the page body (e.g. "Our Story", "FAQ Accordion", "Customer Reviews") |
| **Where it appears** | Archive grid cards (`/experiences`), search filters, booking sidebars, schema.org / JSON-LD, and page hero | Strictly inside the flow of that specific page |
| **Reusability** | Queryable across the entire site by filters and templates | Isolated to the single page where it is placed |
| **BANNED Anti-Pattern** | Dumping entity attributes into a page block (`experience-detail-block`), leaving the node with zero custom fields | Building hardcoded page-specific blocks instead of generic modular sections |

### 2.3 The Forms Extension Law (No Forms in Blocks)
- **STRICTLY FORBIDDEN**: Creating form inputs (`name`, `email`, `phone`, `date`, `guests`, `message`) as fields in `block.json` or hardcoding HTML `<form>` elements in `view.html`.
- **MANDATORY**: All forms belong to the official Squilla `forms` extension. Forms are registered in `scripts/theme.tengo` via `forms:upsert` and embedded in templates via:
  `{{ event "forms:render" (dict "form_id" "booking-form") }}`.
  The forms extension handles validation, notifications, CSRF protection, and database submissions.

---

### 2.4 The Zero Fallbacks Rule (CRITICAL)

> **STRICT RULE**: Using `{{ or .heading "Lorem Ipsum" }}` or `{{ or .title "Default Title" }}` in `view.html` is **STRICTLY FORBIDDEN**.

#### Why Fallbacks Are Banned
- **Hides Schema & Mapping Typos**: If `block.json` declares a field as `"subtitle"` but the template writes `{{ or .sub_title "Our Subtitle" }}`, the typo is silently masked by the fallback text.
- **Masks Broken Data Pipelines**: If the database query, Tengo seed script, or API hydration fails to load fields, template fallbacks disguise the failure.
- **Corrupts Automated Testing**: Automated canary render checks and previews return false positives because the page appears populated even when zero data was injected.
- **Destroys Editorial Intent**: When an editor intentionally leaves an optional field empty (e.g., opting not to display a secondary button or badge), a template fallback will force unwanted placeholder text onto the live site.

#### Where Defaults Belong
- Default values belong in `block.json` under `"initialValue"` (or `"default"`) and in theme seed scripts (`scripts/theme.tengo` / `blocks_data`).
- In `view.html`, templates must conditionally gate fields using `{{ with .field }}` or `{{ if .field }}`.
- **NEVER write naked tags** like `<h1>{{ .title }}</h1>` or `<p>{{ .description }}</p>`. Every HTML tag wrapping a field MUST be conditionally gated with `{{ if .title }}` or `{{ with .title }}`, regardless of whether the field is marked required or optional in the schema. This guarantees zero empty DOM elements (`<h1></h1>`, `<p></p>`) are injected into the page when a field is unpopulated, preventing accessibility violations and broken spacing.

```html
{{/* ❌ FORBIDDEN: Fallbacks hide data bugs and schema typos */}}
<h2>{{ or .heading "Default Section Heading" }}</h2>
<a href="{{ or .cta.url '#' }}">{{ or .cta.text "Click Here" }}</a>

{{/* ❌ FORBIDDEN: Naked tags emit empty <h1></h1> or <p></p> if field is empty/nil */}}
<h1>{{ .title }}</h1>
<p>{{ .description }}</p>

{{/* ✅ MANDATORY: Every HTML element is conditionally wrapped. Zero fallbacks, zero empty DOM tags. */}}
{{ with .heading }}
  <h2>{{ . }}</h2>
{{ end }}

{{ if .description }}
  <p>{{ .description }}</p>
{{ end }}

{{ with .cta }}
  {{ if and .url .text }}
    <a href="{{ .url }}" class="btn btn-primary"{{ with .target }} target="{{ . }}"{{ end }}>
      {{ .text }}
    </a>
  {{ end }}
{{ end }}
```

*Note on non-content primitives*: Default fallback values are acceptable strictly for non-editorial query/layout primitives where a numeric limit or layout CSS class is required for calculation, for example:
```html
{{- $cols := .columns -}}{{- if not $cols -}}{{- $cols = 3 -}}{{- end -}}
```
Never use this for visible text copy or media URLs.

---

## 3. Field Types Strict Rules & Anti-Patterns

Squilla enforces strict, structured field typing. Avoid legacy flat CMS patterns:

| Field Kind | Strict Rule | Forbidden Anti-Pattern |
|---|---|---|
| **Buttons & Links** | **ALWAYS** use `type: "link"`. Stores `{ "url", "text", "target", "new_tab" }`. | **NEVER** create separate loose text fields like `link_text` and `link_url`. |
| **Lists & Grids** | **ALWAYS** use `type: "repeater"` (canonical: `array`). Defines nested `fields`. | **NEVER** flatten repeating items into numbered fields (`item_1_title`, `item_2_title`). |
| **Images & Media** | **ALWAYS** use `type: "image"` or `type: "media"`. Stores `{ "url", "alt", "width", "height" }`. | **NEVER** create separate loose text fields like `image_url` and `image_alt`. |
| **Galleries** | **ALWAYS** use `type: "gallery"` or `type: "repeater"` of image objects. | **NEVER** create numbered image fields (`gallery_1`, `gallery_2`, `gallery_3`, `gallery_4`). A single image is NOT a gallery. |
| **Interactive Forms** | **ALWAYS** integrate with the official `forms` extension via `{{ event "forms:render" ... }}`. | **NEVER** build input fields (`name`, `email`, `phone`, `date`) inside a block schema or write HTML `<form>` tags in block templates. |
| **Booleans & Flags** | **ALWAYS** use `type: "toggle"` or `type: "checkbox"`. Stores boolean `true`/`false`. | **NEVER** use text inputs with `"true"`/`"false"` or `"yes"`/`"no"`. |
| **Variants & Styles** | **ALWAYS** use `type: "select"` or `type: "radio"` with explicit `options: ["opt1", "opt2"]`. | **NEVER** use free-form text strings for layout variants, alignments, or color themes. |
| **Editorial Copy** | **ALWAYS** use `type: "richtext"` for WYSIWYG formatted text. | **NEVER** put raw HTML in `text` or `textarea` fields. |
| **Composite Objects**| **ALWAYS** use `type: "group"` (canonical: `object`) with child `fields`. | **NEVER** flatten into `author_name`, `author_role`, `author_avatar`. |
| **Relations & Nodes**| **ALWAYS** use `type: "reference"` (or `term` for taxonomy). | **NEVER** store raw integer IDs or taxonomy slugs in text fields. |
| **Colors** | **ALWAYS** use `type: "color"`, or `type: "select"` for a curated design system palette. | **NEVER** use generic text fields for hex codes. |

---

## 4. The Link Field Type (`type: "link"`)

When an element needs a URL and a label (CTAs, hero buttons, navigation links, read more links), use `type: "link"`.

### Stored Data Shape
A `link` field produces a JSON object:
```json
{
  "url": "/pricing",
  "text": "Get Started",
  "target": "_blank",
  "new_tab": true
}
```

### Schema Definition (`block.json`)
```json
{
  "name": "cta_primary",
  "title": "Primary CTA",
  "type": "link",
  "description": "Main call-to-action button"
}
```

### Go Template Usage (`view.html`)
Always gate with `{{ with .cta_primary }}` and verify that both `.url` and `.text` are non-empty:

```html
{{ with .cta_primary }}
  {{ if and .url .text }}
    <a href="{{ .url }}"
       class="btn btn-primary"
       {{ with .target }} target="{{ . }}"{{ end }}
       {{ if or (eq .target "_blank") .new_tab }} rel="noopener noreferrer"{{ end }}>
      {{ .text }}
    </a>
  {{ end }}
{{ end }}
```

---

## 5. The Repeater Field Type (`type: "repeater"` / `type: "array"`)

When repeating items occur (feature cards, pricing tiers, FAQs, team members, client logos, statistics), use `type: "repeater"` (canonical name: `"array"`).

### Schema Definition (`block.json`)
Declare nested child fields inside the `fields` array:

```json
{
  "name": "items",
  "title": "Feature Cards",
  "type": "repeater",
  "description": "List of features to display in the grid",
  "fields": [
    {
      "name": "title",
      "title": "Title",
      "type": "text"
    },
    {
      "name": "description",
      "title": "Description",
      "type": "textarea"
    },
    {
      "name": "link",
      "title": "Learn More Link",
      "type": "link"
    }
  ]
}
```

### Go Template Usage (`view.html`)
Iterate through the array with `{{ range .items }}`. Inside the loop, context `.` is the current row item:

```html
{{ with .items }}
  <div class="features-grid">
    {{ range . }}
      <div class="feature-card">
        {{ with .title }}
          <h3>{{ . }}</h3>
        {{ end }}
        {{ with .description }}
          <p>{{ . }}</p>
        {{ end }}
        {{ with .link }}
          {{ if and .url .text }}
            <a href="{{ .url }}" class="feature-link"{{ with .target }} target="{{ . }}"{{ end }}>
              {{ .text }} &rarr;
            </a>
          {{ end }}
        {{ end }}
      </div>
    {{ end }}
  </div>
{{ end }}
```

*Accessing parent variables from inside a repeater*: To access top-level block data from inside a `{{ range }}`, prefix with `$.` (e.g., `{{ $.section_title }}`).

---

## 6. Complete Field Types Reference

Every field type supported by the Squilla kernel is documented below with its JSON schema and Go template rendering pattern.

---

### 6.1 `text` (canonical: `string`)
Single-line plain text.
- **Schema**:
```json
{
  "name": "heading",
  "title": "Section Heading",
  "type": "text",
  "description": "Main heading text"
}
```
- **Test Data**: `"Grow your audience with Squilla"`
- **Template**:
```html
{{ with .heading }}
  <h2>{{ . }}</h2>
{{ end }}
```

---

### 6.2 `textarea`
Multi-line plain text.
- **Schema**:
```json
{
  "name": "subheading",
  "title": "Subheading",
  "type": "textarea",
  "description": "Brief introductory description"
}
```
- **Test Data**: `"Discover an AI-native CMS built for ultimate speed, flexibility, and developer joy."`
- **Template**:
```html
{{ with .subheading }}
  <p class="subtitle">{{ . }}</p>
{{ end }}
```

---

### 6.3 `richtext`
WYSIWYG HTML formatted text.
- **Schema**:
```json
{
  "name": "body",
  "title": "Content Body",
  "type": "richtext",
  "description": "Formatted article copy with links, lists, and bold text"
}
```
- **Test Data**: `"<p>Squilla delivers <strong>blazing fast</strong> pages with zero runtime overhead. Learn more in our documentation.</p>"`
- **Template**:
```html
{{ with .body }}
  <div class="prose">
    {{ . | safeHTML }}
  </div>
{{ end }}
```

---

### 6.4 `number`
Numeric values (integer or float).
- **Schema**:
```json
{
  "name": "stat_count",
  "title": "Stat Value",
  "type": "number",
  "description": "Key milestone number"
}
```
- **Test Data**: `99`
- **Template**:
```html
{{ with .stat_count }}
  <span class="stat-number">{{ . }}%</span>
{{ end }}
```

---

### 6.5 `email`
Validated email address.
- **Schema**:
```json
{
  "name": "contact_email",
  "title": "Support Email",
  "type": "email"
}
```
- **Test Data**: `"support@example.com"`
- **Template**:
```html
{{ with .contact_email }}
  <a href="mailto:{{ . }}">{{ . }}</a>
{{ end }}
```

---

### 6.6 `url`
Standalone web address string. Use `url` when only a destination string is required without custom anchor text. If clickable text is needed, use `link` instead.
- **Schema**:
```json
{
  "name": "video_url",
  "title": "Embed Video URL",
  "type": "url"
}
```
- **Test Data**: `"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"`
- **Template**:
```html
{{ with .video_url }}
  <iframe src="{{ . }}" loading="lazy" allowfullscreen></iframe>
{{ end }}
```

---

### 6.7 `color`
Hex color code picker.
- **Schema**:
```json
{
  "name": "accent_color",
  "title": "Accent Color",
  "type": "color"
}
```
- **Test Data**: `"#3b82f6"`
- **Template**:
```html
{{ with .accent_color }}
  <div style="--block-accent: {{ . }};" class="accent-box">
{{ end }}
```

---

### 6.8 `range`
Slider input with min, max, and step attributes.
- **Schema**:
```json
{
  "name": "columns",
  "title": "Grid Columns",
  "type": "range",
  "min": 1,
  "max": 4,
  "step": 1,
  "initialValue": 3
}
```
- **Test Data**: `3`
- **Template**:
```html
{{- $cols := .columns -}}{{- if not $cols -}}{{- $cols = 3 -}}{{- end -}}
<div class="grid cols-{{ $cols }}">
```

---

### 6.9 `date`
ISO date string picker.
- **Schema**:
```json
{
  "name": "event_date",
  "title": "Event Date",
  "type": "date"
}
```
- **Test Data**: `"2026-11-20"`
- **Template**:
```html
{{ with .event_date }}
  <time datetime="{{ . }}">{{ . }}</time>
{{ end }}
```

---

### 6.10 `select`
Dropdown selection from predefined options.

> **CRITICAL**: In Squilla `block.json`, `options` must be a flat array of strings (`["opt1", "opt2"]`). Do **not** use objects like `[{"label": "...", "value": "..."}]` in `block.json`, as the block schema loader will reject them with an error.

- **Schema**:
```json
{
  "name": "theme_variant",
  "title": "Theme Style",
  "type": "select",
  "options": ["default", "dark", "subtle", "brand"]
}
```
- **Test Data**: `"brand"`
- **Template**:
```html
{{- $variant := .theme_variant -}}{{- if not $variant -}}{{- $variant = "default" -}}{{- end -}}
<div class="card card--{{ $variant }}">
```

---

### 6.11 `radio`
Radio button group for selecting one of 2–4 visible options.
- **Schema**:
```json
{
  "name": "alignment",
  "title": "Content Alignment",
  "type": "radio",
  "options": ["left", "center", "right"]
}
```
- **Test Data**: `"center"`
- **Template**:
```html
{{- $align := .alignment -}}{{- if not $align -}}{{- $align = "left" -}}{{- end -}}
<div class="section-header text-{{ $align }}">
```

---

### 6.12 `checkbox`
Multi-selection checkbox group storing an array of selected strings.
- **Schema**:
```json
{
  "name": "platforms",
  "title": "Supported Platforms",
  "type": "checkbox",
  "options": ["macOS", "Linux", "Windows", "Docker"]
}
```
- **Test Data**: `["macOS", "Linux", "Docker"]`
- **Template**:
```html
{{ with .platforms }}
  <ul class="badge-list">
    {{ range . }}
      <li class="badge">{{ . }}</li>
    {{ end }}
  </ul>
{{ end }}
```

---

### 6.13 `toggle`
Binary on/off boolean switch.
- **Schema**:
```json
{
  "name": "show_badge",
  "title": "Show New Feature Badge",
  "type": "toggle"
}
```
- **Test Data**: `true`
- **Template**:
```html
{{ if .show_badge }}
  <span class="pill-badge">New Release</span>
{{ end }}
```

---

### 6.14 `link`
Clickable hyperlink with URL, label text, and target options.
- **Schema**:
```json
{
  "name": "action_button",
  "title": "Action Button",
  "type": "link"
}
```
- **Test Data**:
```json
{
  "url": "/docs/quickstart",
  "text": "Read the Guide",
  "target": "_blank",
  "new_tab": true
}
```
- **Template**:
```html
{{ with .action_button }}
  {{ if and .url .text }}
    <a href="{{ .url }}" class="btn"{{ with .target }} target="{{ . }}"{{ end }}>
      {{ .text }}
    </a>
  {{ end }}
{{ end }}
```

---

### 6.15 `repeater` (canonical: `array`)
Repeatable rows of structured nested fields.
- **Schema**:
```json
{
  "name": "stats",
  "title": "Statistics",
  "type": "repeater",
  "fields": [
    { "name": "number", "title": "Value", "type": "text" },
    { "name": "label", "title": "Label", "type": "text" }
  ]
}
```
- **Test Data**:
```json
[
  { "number": "100%", "label": "Open Source" },
  { "number": "0ms", "label": "Cold Start" }
]
```
- **Template**:
```html
{{ with .stats }}
  <div class="stats-row">
    {{ range . }}
      <div class="stat-item">
        {{ with .number }}<strong>{{ . }}</strong>{{ end }}
        {{ with .label }}<span>{{ . }}</span>{{ end }}
      </div>
    {{ end }}
  </div>
{{ end }}
```

---

### 6.16 `group` (canonical: `object`)
Single composite object containing nested fields.
- **Schema**:
```json
{
  "name": "author",
  "title": "Author Profile",
  "type": "group",
  "fields": [
    { "name": "name", "title": "Full Name", "type": "text" },
    { "name": "role", "title": "Job Title", "type": "text" },
    { "name": "avatar", "title": "Avatar Image", "type": "image" }
  ]
}
```
- **Test Data**:
```json
{
  "name": "Sarah Connor",
  "role": "Security Engineer",
  "avatar": {
    "url": "theme-asset:avatar-sarah",
    "alt": "Portrait of Sarah Connor"
  }
}
```
- **Template**:
```html
{{ with .author }}
  <div class="author-card">
    {{ with .avatar }}
      {{ with .url }}
        <img src="{{ . }}" alt="{{ $.author.avatar.alt }}" class="avatar">
      {{ end }}
    {{ end }}
    <div class="author-info">
      {{ with .name }}<h4>{{ . }}</h4>{{ end }}
      {{ with .role }}<p class="role">{{ . }}</p>{{ end }}
    </div>
  </div>
{{ end }}
```

---

### 6.17 `image`
Single media asset with URL and accessibility metadata.
- **Schema**:
```json
{
  "name": "featured_image",
  "title": "Featured Image",
  "type": "image"
}
```
- **Test Data**:
```json
{
  "url": "theme-asset:hero-banner",
  "alt": "Squilla dashboard on desktop display",
  "width": 1200,
  "height": 675
}
```
- **Template**:
```html
{{ with .featured_image }}
  {{ with .url }}
    <img src="{{ . }}"
         alt="{{ $.featured_image.alt }}"
         {{ with $.featured_image.width }}width="{{ . }}"{{ end }}
         {{ with $.featured_image.height }}height="{{ . }}"{{ end }}
         loading="lazy">
  {{ end }}
{{ end }}
```

---

### 6.18 `media` / `file`
Downloadable file asset (PDF, ZIP, spreadsheet).
- **Schema**:
```json
{
  "name": "brochure",
  "title": "Download Brochure",
  "type": "file"
}
```
- **Test Data**:
```json
{
  "url": "theme-asset:whitepaper-pdf",
  "filename": "squilla-whitepaper.pdf",
  "mime_type": "application/pdf"
}
```
- **Template**:
```html
{{ with .brochure }}
  {{ with .url }}
    <a href="{{ . }}" class="file-download" download>
      Download {{ with $.brochure.filename }}{{ . }}{{ else }}File{{ end }}
    </a>
  {{ end }}
{{ end }}
```

---

### 6.19 `gallery`
Array of images for carousels, masonry grids, or photo showcases.
- **Schema**:
```json
{
  "name": "screenshots",
  "title": "Product Screenshots",
  "type": "gallery"
}
```
- **Test Data**:
```json
[
  { "url": "theme-asset:screen-1", "alt": "Page editor overview" },
  { "url": "theme-asset:screen-2", "alt": "Theme live customization" }
]
```
- **Template**:
```html
{{ with .screenshots }}
  <div class="gallery-grid">
    {{ range . }}
      {{ with .url }}
        <img src="{{ . }}" alt="{{ .alt }}" loading="lazy" class="gallery-img">
      {{ end }}
    {{ end }}
  </div>
{{ end }}
```

---

## 7. Complete Production Examples

### Example 1: Hero Block (`hero`)

#### `themes/my-theme/blocks/hero/block.json`
```json
{
  "slug": "hero",
  "name": "Hero Banner",
  "description": "Primary landing page hero with heading, body copy, dual action buttons, and a featured image.",
  "category": "marketing",
  "fields": [
    {
      "name": "badge_text",
      "title": "Badge Text",
      "type": "text",
      "description": "Optional pill tag displayed above the heading"
    },
    {
      "name": "heading",
      "title": "Heading",
      "type": "text",
      "description": "Main hero headline"
    },
    {
      "name": "description",
      "title": "Description",
      "type": "textarea",
      "description": "Supporting paragraph text under the main headline"
    },
    {
      "name": "cta_primary",
      "title": "Primary CTA",
      "type": "link",
      "description": "Primary high-contrast button"
    },
    {
      "name": "cta_secondary",
      "title": "Secondary CTA",
      "type": "link",
      "description": "Secondary outline or text link"
    },
    {
      "name": "hero_image",
      "title": "Hero Image",
      "type": "image",
      "description": "Hero photograph or illustration"
    }
  ],
  "test_data": {
    "badge_text": "v2.0 Released",
    "heading": "Build faster with Squilla CMS",
    "description": "An AI-native, high-performance Go content management system architected for speed, modularity, and zero boilerplate.",
    "cta_primary": {
      "url": "/docs",
      "text": "Start Building Free",
      "target": "_self"
    },
    "cta_secondary": {
      "url": "https://github.com/erikkubica/vibecms",
      "text": "View on GitHub",
      "target": "_blank",
      "new_tab": true
    },
    "hero_image": {
      "url": "theme-asset:hero-preview",
      "alt": "Squilla architecture diagram illustrating core and extensions",
      "width": 1200,
      "height": 800
    }
  }
}
```

#### `themes/my-theme/blocks/hero/view.html`
```html
{{- /* Hero Block — Follows Zero Fallbacks Rule strictly */ -}}
{{- $heroImg := "" -}}{{- $heroAlt := "" -}}
{{- with .hero_image -}}
  {{- with .url -}}{{- $heroImg = . -}}{{- end -}}
  {{- with .alt -}}{{- $heroAlt = . -}}{{- end -}}
{{- end -}}

<section class="hero-section">
  <div class="hero-container">
    <div class="hero-content">
      {{ with .badge_text }}
        <span class="hero-badge">{{ . }}</span>
      {{ end }}

      {{ with .heading }}
        <h1 class="hero-title">{{ . }}</h1>
      {{ end }}

      {{ with .description }}
        <p class="hero-description">{{ . }}</p>
      {{ end }}

      <div class="hero-actions">
        {{ with .cta_primary }}
          {{ if and .url .text }}
            <a href="{{ .url }}"
               class="btn btn-primary"
               {{ with .target }} target="{{ . }}"{{ end }}>
              {{ .text }}
            </a>
          {{ end }}
        {{ end }}

        {{ with .cta_secondary }}
          {{ if and .url .text }}
            <a href="{{ .url }}"
               class="btn btn-outline"
               {{ with .target }} target="{{ . }}"{{ end }}
               {{ if or (eq .target "_blank") .new_tab }} rel="noopener noreferrer"{{ end }}>
              {{ .text }}
            </a>
          {{ end }}
        {{ end }}
      </div>
    </div>

    {{ if $heroImg }}
      <div class="hero-media">
        <img src="{{ $heroImg }}"
             alt="{{ $heroAlt }}"
             loading="eager"
             class="hero-image">
      </div>
    {{ end }}
  </div>
</section>
```

---

### Example 2: Feature Grid Block (`feature-grid`)

#### `themes/my-theme/blocks/feature-grid/block.json`
```json
{
  "slug": "feature-grid",
  "name": "Feature Grid",
  "description": "Multi-column grid showcasing features, services, or benefits using a structured repeater.",
  "category": "marketing",
  "fields": [
    {
      "name": "section_title",
      "title": "Section Title",
      "type": "text",
      "description": "Primary section title"
    },
    {
      "name": "section_subtitle",
      "title": "Section Subtitle",
      "type": "textarea",
      "description": "Brief explanation or lead paragraph"
    },
    {
      "name": "features",
      "title": "Features",
      "type": "repeater",
      "description": "Feature items displayed in the grid",
      "fields": [
        {
          "name": "icon",
          "title": "Icon Name",
          "type": "text",
          "description": "Icon identifier or SVG name (e.g., 'bolt', 'shield', 'code')"
        },
        {
          "name": "title",
          "title": "Feature Title",
          "type": "text"
        },
        {
          "name": "description",
          "title": "Feature Description",
          "type": "textarea"
        },
        {
          "name": "link",
          "title": "Feature Link",
          "type": "link",
          "description": "Optional link to explore this feature further"
        }
      ]
    }
  ],
  "test_data": {
    "section_title": "Everything you need to ship",
    "section_subtitle": "Engineered from the ground up for high reliability, autonomous coding agents, and instant response times.",
    "features": [
      {
        "icon": "zap",
        "title": "Sub-millisecond Rendering",
        "description": "Direct compiled Go templates render pages in single-digit microseconds.",
        "link": {
          "url": "/docs/performance",
          "text": "Explore benchmarks",
          "target": "_self"
        }
      },
      {
        "icon": "box",
        "title": "Modular Extension Kernel",
        "description": "Core is completely decoupled from business features via gRPC and CoreAPI.",
        "link": {
          "url": "/docs/architecture",
          "text": "Kernel architecture",
          "target": "_self"
        }
      },
      {
        "icon": "shield-check",
        "title": "Type-Safe Contracts",
        "description": "Homogeneous recursive field schemas eliminate data mismatch errors across admin and public pages.",
        "link": {
          "url": "/docs/schemas",
          "text": "Schema reference",
          "target": "_self"
        }
      }
    ]
  }
}
```

#### `themes/my-theme/blocks/feature-grid/view.html`
```html
{{- /* Feature Grid Block — Iterates repeater with zero fallbacks */ -}}
<section class="features-section">
  <div class="features-container">
    {{ if or .section_title .section_subtitle }}
      <div class="features-header">
        {{ with .section_title }}
          <h2 class="features-title">{{ . }}</h2>
        {{ end }}
        {{ with .section_subtitle }}
          <p class="features-subtitle">{{ . }}</p>
        {{ end }}
      </div>
    {{ end }}

    {{ with .features }}
      <div class="features-grid">
        {{ range . }}
          <article class="feature-card">
            {{ with .icon }}
              <div class="feature-icon" data-icon="{{ . }}">
                <span class="icon-indicator"></span>
              </div>
            {{ end }}

            {{ with .title }}
              <h3 class="feature-card-title">{{ . }}</h3>
            {{ end }}

            {{ with .description }}
              <p class="feature-card-desc">{{ . }}</p>
            {{ end }}

            {{ with .link }}
              {{ if and .url .text }}
                <a href="{{ .url }}"
                   class="feature-card-link"
                   {{ with .target }} target="{{ . }}"{{ end }}
                   {{ if or (eq .target "_blank") .new_tab }} rel="noopener noreferrer"{{ end }}>
                  {{ .text }} &rarr;
                </a>
              {{ end }}
            {{ end }}
          </article>
        {{ end }}
      </div>
    {{ end }}
  </div>
</section>
```

---

## 8. Verification & Authoring Checklist

Before publishing or committing any block, execute this verification pass:

1. **Zero Fallbacks**:
   - Check `view.html`: Are there any instances of `{{ or .field "..." }}`? Remove them immediately.
   - Are optional fields cleanly wrapped in `{{ with .field }}...{{ end }}`?
2. **Schema & Field Rules**:
   - Are CTAs and buttons typed as `type: "link"` (never loose `link_text`/`link_url`)?
   - Are repeating cards/items typed as `type: "repeater"` (never numbered fields)?
   - Are images typed as `type: "image"` with `.url` and `.alt` access in templates?
   - Are `select` and `radio` options flat string arrays (`["a", "b"]`), never `{label, value}` objects?
3. **Test Data Quality**:
   - Does `test_data` in `block.json` contain realistic, non-lorem copy for **every** declared field?
   - Does the shape of each `test_data` value match the field type exactly (e.g. object for `link` and `image`, array of objects for `repeater`)?
4. **Theme Manifest**:
   - Is the block slug registered in `themes/<theme>/theme.json` under `blocks`?
5. **No Site Chrome**:
   - Does the block avoid rendering global headers, footers, or `<main>` tags?
