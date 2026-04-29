# Editing — Missing Features & MCP Gaps (Debug Log)

A running log of friction points hit while authoring documentation through MCP.
Each entry: what bit me, what the MCP guide should have said, the workaround.

> Session start: 2026-04-29
> Author: Claude (Opus 4.7) authoring the `Content Editing` docs section.

---

## 1. `core.node.create` does not accept `layout_slug`

**What bit me:** I created a `documentation` node and the page rendered without the docs sidebar/chrome. Existing docs pages had `layout_slug: "docs"` on the row; mine had `null`. The MCP `core.node.create` tool schema only exposes:

```
node_type, language_code, title, slug, status,
excerpt, featured_image, fields_data, blocks_data, seo_settings
```

There is no `layout_slug` parameter. Same gap on `core.node.update`.

**What the guide should say:**
- Either expose `layout_slug` on `core.node.create` / `core.node.update`, OR
- Document in `core.guide` (under `pages` topic) that node-type defaults usually pick the right layout, but when authoring a new section that does not match the default, you must set `layout_slug` after creation via `core.data.update`.
- Better: document on the `documentation` node-type how the docs theme expects `layout_slug: "docs"` and which layouts are available. (`core.layout.list` returns layouts but the relationship between node-type → expected-layout is implicit.)

**Workaround used:**
```
core.data.update({ table: "content_nodes", id: <id>,
                   data: { layout_slug: "docs" } })
```

---

## 2. `documentation` node-type schema is undocumented

**What bit me:** The `documentation` node-type expects `fields_data` to look like:

```json
{
  "order":   <int>,
  "section": { "name": "<Display>", "slug": "<kebab>" },
  "summary": "<string>"
}
```

…and the docs sidebar/section grouping renders off this. None of this is surfaced via `core.guide`, `core.nodetype.get`, or the MCP tool descriptions. I had to read existing docs nodes via `core.node.query` and reverse-engineer the shape.

**What the guide should say:**
- `core.nodetype.get("documentation")` should return the `field_schema` so callers see `order`, `section`, `summary` are required.
- A goal in `core.guide` along the lines of *"Add a docs page"* should list the required shape.
- Explain the `section` object's role in admin sidebar grouping.

**Workaround:** copy the shape from `core.node.query({ node_type: "documentation" })` of an existing page.

---

## 3. Theme block types (`doc-content`, `doc-callout`, `doc-codeblock`) are undiscoverable from `core.guide`

**What bit me:** I had to guess block types and their field schemas:
- `doc-content` — single field `body` (HTML)
- `doc-callout` — fields `body`, `label`, `variant` (one of `note` / `tip` / `heads-up` / `danger`)
- `doc-codeblock` — fields `body` (HTML containing `<pre><code>…</code></pre>`), `file`, `language`, `show_dots`

`core.block_types.list` returns these, but `core.guide(topic="blocks")` would have been more discoverable for a first-time agent. I instead inferred shapes by reading other docs nodes' `blocks_data`.

**What the guide should say:**
- Recipe in `core.guide`: *"Add a doc page using the `squilla` theme blocks"* listing the three doc blocks and their field schemas.
- The `doc-callout` variant enum is theme-specific and not validated by the kernel — silent fallback to default styling on unknown variants would be nice.

---

## 4. Block field shape — `body` field expects raw `<pre><code>` for code blocks

**What bit me:** `doc-codeblock.body` is not a code string — it expects HTML wrapping `<pre><code>…</code></pre>` itself. Easy to mis-read. `language` and `show_dots` are siblings.

**What the guide should say:** Either rename `body` → `html` for clarity, or document that the doc-codeblock is HTML-in / HTML-out.

---

## 5. `core.node.create` returns the node but not its rendered URL

**What bit me:** Verifying a freshly-created docs page meant calling `core.render.node_preview(id)` and inspecting HTML, or hitting `<full_url>` from the response in a browser. Fine, but the response could include a `preview_url` field for convenience.

---

## 6. No MCP tool to bulk-set `layout_slug` for a node-type's nodes

**What bit me:** If a user creates several docs nodes through MCP without `layout_slug`, they all need patching. There's no `core.node.update_many` and no node-type-level "default layout" enforcement at write time — it's enforced at render time only when set.

**What the guide should say:** Document that each docs page must explicitly set `layout_slug: "docs"`, OR have the kernel auto-fill from a node-type default at insert time.

---

## 7. SEO + excerpt: easy to forget on MCP-authored content

**What bit me:** The MCP `core.node.create` schema makes `excerpt` and `seo_settings` optional. For docs pages this means they ship with empty meta tags unless the agent remembers. There's no warning or default population from `title`/first-paragraph.

**What the guide should say:** Recipe in `core.guide` for "publish a docs page" should require `excerpt`, `seo_settings.meta_title`, `seo_settings.meta_description`. Or provide a `core.node.fill_seo(id)` helper that derives sensible defaults from title and first content block.

---

## 8. `core.guide(topic)` doesn't enumerate valid topics in the response

**What bit me:** I called `core.guide(topic: "pages")` and it worked, but I don't know what other topics exist without trial-and-error or reading the tool description carefully (`pages | blocks | themes | taxonomies | media | extensions`). If `topic="content-editing"` or `topic="docs"` had returned the missing context above, this debug log might be one entry shorter.

---

## 9. Section grouping uses `fields_data.section` but isn't surfaced anywhere as a *list of existing sections*

**What bit me:** When adding pages to a new "Content Editing" section, I had no MCP way to ask *"what sections already exist in the documentation node-type?"* I had to query all docs pages and `Set()` their `fields_data.section.slug` values.

**What the guide should say:** A helper like `core.docs.sections()` (or surface it under `core.guide(topic="docs")`).

---

## 10. SEO meta description / title length validation

**What bit me:** Nothing validates meta description length (>160 chars warns in Yoast-ish tools but not here). The agent can ship meta descriptions of any size.

**What the guide should say:** Soft validation hint in `core.node.create` response (`warnings: [{field, message}]`).

---

## 11. Default fallback for `featured_image: {}`

**What bit me:** Empty `featured_image: {}` is accepted by `core.node.create` but the JSON shape is asymmetric with the documented `{url, alt, ...}` shape. Templates handling `{{ if .node.featured_image.url }}` work; templates checking `{{ if .node.featured_image }}` always pass because `{}` is truthy. None of my created pages had a featured image and this rendered fine, but it's a footgun.

---

## 12. Preview button doesn't exist in the admin yet

**What bit me:** I wrote about a "Preview" button on the node edit screen in
several docs pages (Nodes, Custom Fields, Mailing). It doesn't actually exist.
The render endpoint (`core.render.node_preview`) is implemented and works, but
there's no admin UI affordance — no button, no keyboard shortcut, no preview
pane.

**What needs to ship:**
- A `Preview` button on every node edit screen, calling
  `core.render.node_preview(id)` and opening the result in a new tab or a
  side-by-side iframe.
- Same for email templates: render against the variables schema's sample
  values and show in a panel.
- Same for blocks (`core.render.block`) inside the block editor — currently
  the editor uses `test_data` for a static preview, but no live render of
  the block in its actual layout context.

**Docs cleanup:** the references to "Preview button" in the docs I just
authored are aspirational. Either ship the button so the docs become true,
or strip the references. (TODO before announcing the docs publicly.)

---

## 13. Revision browsing / comparison is missing

**What bit me:** Squilla writes `version: <int>` on every node row and
increments on save (visible in `core.data.get` output). But there's no admin
UI to:
- Browse the revision history of a node
- Diff two revisions
- Restore an older revision
- See who made which change (correlated with the audit log)

**What needs to ship:**
- A `Revisions` sidebar panel on the node edit screen listing prior versions
  with timestamp + author + change summary.
- A diff view (text + structured for `blocks_data` / `fields_data`).
- One-click "Restore this revision" with a fresh save (so the restore is
  itself a new revision, not a destructive overwrite).
- Storage: today only the current row is kept. A `content_node_revisions`
  table (or JSONB column on the node) needs to land first.
- Same model needed for: layouts, layout-blocks, content-blocks, email
  templates, menus — anywhere a user authors persisted text that they
  might want to roll back.

**MCP surface:**
- `core.node.revisions(id)` — list
- `core.node.revision_get(id, version)` — fetch
- `core.node.revision_restore(id, version)` — restore
- All read-only tools in the `read` class except restore which is `content`.

---

## 14. I fabricated UI affordances I didn't verify (block reordering, drag-and-drop, etc.)

**What bit me:** I described block reordering in the node editor as "drag handle"
in nodes 62 (Nodes) and 71 (Content Blocks). The actual UI uses **Up / Down
arrow buttons**, not drag handles. The user caught this on review.

**Root cause:** I extrapolated from "how every block editor I've seen works" and
from the kernel-level guidance that talks about reorder operations on
`blocks_data`, without opening the admin and looking. The MCP guide doesn't
expose admin-UI affordances at all — there's no `core.admin.uimap` or
similar — so it's easy to confabulate when writing user-facing docs.

**What needs to ship:**
- A fact-check pass over every page I just authored. Other unverified UI claims
  in the new docs that need eyes-on-screen verification:
  - Taxonomies & Terms: "Drag rows to reorder. For hierarchical taxonomies,
    drag onto another row to nest."
  - Menus: "Drag to reorder, drag onto another item to nest."
  - Forms: "Drag fields from the palette" (visual builder)
  - Custom Fields: width keywords "half / third / quarter / two-thirds /
    three-quarters"; sm/md/lg breakpoint syntax — I made up the exact tokens
  - Forms field-types list (`recaptcha`, `section`, etc. — named without
    looking)
  - Email rules condition-operators set (mirrored from forms; not verified
    against the rules editor)
  - Roles built-in defaults (`Administrator`, `Editor`, `Author`, `Subscriber`)
    — these mirror WP and may not be Squilla's actual defaults
  - "Subscribers" role at all (probably doesn't exist if there's no public
    subscription flow)
- Either an MCP `core.admin.uimap` (or `core.guide(topic="admin-ui")`) that
  enumerates the actual admin affordances per surface, OR a clear instruction
  in `core.guide` that AI-authored user docs MUST be reviewed against the live
  admin before publishing.

**Lesson:** when authoring docs that describe UI, don't extrapolate from
patterns. Either inspect the actual admin (Playwright / browse) or mark the
claim as TODO and ask the human to verify. Patterns from "every other CMS"
are a strong prior but not evidence.

---

## 15. Hierarchical taxonomies — listed but not creatable

**What bit me:** I documented hierarchical vs flat taxonomies as a configurable
boolean in the taxonomy editor (Taxonomies & Terms doc, node 65). Reality is
inconsistent across the admin:

- The **list** view at `/admin/taxonomies` shows a hierarchical column (or a
  hierarchical badge on each row).
- The **create** form at `/admin/taxonomies/new` has no toggle.
- The **edit** form at `/admin/taxonomies/<slug>/edit` (or wherever) also
  has no toggle.

Net effect: hierarchical taxonomies appear to be a kernel-level capability
that isn't actually wired into the admin UI. Either it's half-implemented
(model supports it; UI doesn't expose it), or the listing column is a
leftover.

**What needs to ship (pick one path):**
1. **If hierarchical IS supposed to work**: add the toggle to the create +
   edit forms; surface parent-picker on terms when the taxonomy is
   hierarchical; verify drag-nest in the term list actually saves a parent.
2. **If hierarchical is NOT shipped**: drop the column from the listing;
   remove `hierarchical` from the taxonomy schema; rewrite the docs page to
   say flat-only.

**Docs cleanup:** the Taxonomies & Terms page (node 65) currently asserts
hierarchical works and explains parent + drag-nest behavior. Both need to
be revised once the truth is decided. Mark this in the doc itself as a
known-broken section if the human can't fix it before publishing.

**MCP angle:** `core.taxonomy.create` accepts no `hierarchical` flag in its
current schema, which is consistent with "not actually shipped". But
`core.taxonomy.list` may still echo a `hierarchical` field on existing rows.
Worth checking and pruning if the feature is being dropped.

---

## 16. Translation-creation UI is inconsistent across surfaces

**What bit me:** The "create a translation in language X" affordance is shaped
differently depending on what you're translating:

- **Terms** — the term editor renders translation creation as a
  **dropdown** (pick a language, click, the row is cloned).
- **Nodes** — the node edit page renders translation creation as a
  **modal/popup** (with extra fields and a confirm step).

Same operation, two different UI patterns. Editors who learned the term flow
hit the node flow and vice versa, and have to re-learn each time.

**What needs to ship:** unify the UI. One pattern, used in both places (and
anywhere else translation creation lives — menus per-language? settings?).
Pick whichever is the better pattern (probably the dropdown for low-friction
single-click; the popup if there are options worth confirming) and apply it
everywhere.

**Bonus pass:** while unifying, surface this through MCP too — today term
translations have a dedicated route (`POST /admin/api/terms/<id>/translations`)
but node translations don't have an equivalent stable MCP-visible endpoint;
both should be reachable from the agent via the same shaped tool call.

---

## 17. Media library is images-only — videos / audio / documents not uploadable

**What bit me:** I asserted in the Media docs (node 67) that the media manager
accepts "images (jpeg, png, webp, avif, gif, svg), videos (mp4, webm), audio
(mp3, m4a, ogg), documents (pdf, docx, xlsx)". In reality, the upload flow
today only accepts images. Videos, audio, and document formats are rejected
(or simply not selectable in the picker / not shown in the library).

**What needs to ship:**
- **Backend** — extend `core.media.upload` mime-type allow-list, decide on
  per-format size caps, persist non-image variants without running them
  through the image-optimizer pipeline.
- **Storage / serving** — public URL routing for non-images: range requests
  for video/audio (so HTML5 `<video>`/`<audio>` can seek), correct
  `Content-Type`, no WebP rewriting on `.pdf` etc.
- **Admin UI** — file-type icons in grid view (no thumbnail to show for a
  PDF; render a generic doc icon), a video preview player when previewing,
  audio player likewise, a "download" button on the file-detail sheet.
- **Picker** — the media picker should be filterable by `image`, `video`,
  `audio`, `document` so a video field doesn't surface a 5000-image library.
- **Field types** — `video`, `audio`, `file` (generic) currently exist in
  the field-type catalogue but have nothing meaningful to pick from once
  hooked up to the empty media library.

**Docs cleanup:** node 67 (Media) needs the format list trimmed to images
only, with a roadmap note for video/audio/docs. Same for any field-type
docs that imply video/audio/file work end-to-end.

---

## 18. PNG compression level is not configurable

**What bit me:** Documented "PNG compression level" as a configurable in the
Media doc (node 67). It isn't — the admin settings/media surface exposes WebP
quality and JPEG quality + progressive, but PNG has no compression knob.

**Open question:** *do we even need it?* Given the default delivery path is
WebP-on-`Accept`, the PNG bytes are the cold-storage original; only clients
that explicitly refuse WebP fall back to PNG, and those are rare. Could be
fine to leave PNG at the encoder default and not surface a control.

**Action:** decide — either add the PNG-compression slider to settings/media
or strip the claim from the docs. Default recommendation: strip the claim
unless someone files a real perf complaint about PNG fallback weight.

---

## 19. Admin language-switcher behaviour is documented as "works", reality is buggy

**What bit me:** The Multi-language doc (node 68) asserts the following block
as if it works end-to-end:

> The admin top bar carries a language switcher. Picking a language sets the
> `X-Admin-Language` header on every admin request. From that point:
>
> - Lists scope to that language (you only see that language's posts unless
>   you toggle "all")
> - Save writes go to that language's row
> - Settings reads pick the localized row first, default-language second

**Reality:** the switcher is **half-implemented and buggy**. Some of the
pieces above happen sometimes; some don't. List scoping is unreliable, save
writes don't always honour the selected language, and settings reads don't
consistently fall back to default. You can produce visibly broken admin
state (orphan rows, edits that vanish, settings that look unset) by
exercising the switcher across modules.

**What needs to ship:**
- An audit pass: for every admin endpoint, confirm it reads `X-Admin-Language`
  and applies it to both reads and writes consistently.
- Fix the inconsistencies (probably a single shared middleware that pins the
  request locale instead of every endpoint reading the header by hand).
- E2E tests that exercise the switcher across nodes, terms, menus, settings,
  media — switching, editing, switching back, verifying nothing leaked across
  languages.
- Once stable, the doc's claims become true. Until then, node 68 should carry
  a "known broken" callout on this section, OR the section should be cut and
  rewritten as "what's intended" once the work lands.

**Docs cleanup:** node 68 needs either a HEADS-UP callout explicitly flagging
the language switcher as work-in-progress, or the entire "Editing in a
specific language" section trimmed back to what actually works today.

---

## 20. Site-wide SEO settings page doesn't exist

**What bit me:** The SEO doc (node 69) describes a `/admin/settings/seo`
surface with site title + tagline (per-language), default OG image, and a
site-wide robots index/noindex toggle. None of that ships today — there is
no `/admin/settings/seo` route and no UI for any of those controls.

**What probably exists vs. what doesn't:**
- Per-node meta title and meta description — yes, on the node SEO sidebar
  panel.
- Site title — lives somewhere in general settings (probably under
  brand/identity, not under "SEO"), and the per-language story for it is
  unverified.
- Tagline — unknown.
- Default OG image — not implemented.
- Site-wide robots toggle — not implemented.

**OG image handling overall is unverified.** Claims I made:
- "Featured image used as `og:image` automatically"
- Twitter card tags emitted
- `hreflang` alternates emitted per linked translation

None of these have been confirmed by inspecting the rendered `<head>` of an
actual public page. Could be partially or fully fabricated. Needs a
view-source check on a published node before the SEO doc is trustworthy.

**What needs to ship:**
- Build `/admin/settings/seo` (site title + tagline per-language, default OG
  image picker, robots toggle, social-card defaults).
- Wire site-wide robots toggle into the response header / `<meta>` emitter.
- Verify and (where missing) add the OG / Twitter / hreflang tag emission in
  the layout `<head>` template.
- Decide where "site title" really lives (its own settings page vs. brand
  settings) and document accordingly.

**Docs cleanup:** node 69 (SEO) currently asserts most of this as shipped.
Trim to per-node-only behaviour, mark site-wide as roadmap, and replace the
"What the public site emits" block with one that's been confirmed by
inspecting a real rendered page.

---

## 21. Forms doc fabricated a "visual builder" — there is none, and none planned

**What bit me:** I framed the Forms feature (node 72) as a Fluent-Forms-style
hybrid with a visual drag-from-palette builder + a custom-HTML mode. That's
wrong on multiple counts:

- There is **no visual form builder** in the admin, and **no plan to add
  one**.
- HTML is **always custom** — you write the markup yourself.
- The "builder" UI in the admin is a **field-schema editor** (metadata
  about each input), not a layout editor.

The mental model is closer to <em>Contact Form 7</em>: you write the form
HTML, you separately declare a typed schema for the fields, and the
extension wires up validation, notifications, submissions, and webhooks by
matching `name=\"…\"` attributes between the two.

**What I fixed:** rewrote the first three blocks of node 72 (intro, field
schema, HTML body) and added a code example showing real form HTML. The
"Custom HTML mode" block is removed (it never made sense given there is no
non-custom mode). Honeypot section updated to reflect the schema-plus-HTML
pattern (declare in schema, place a hidden input in HTML).

**What still needs verification in node 72:**

- Conditional logic operators, AND/OR groups, client-side + server-side
  enforcement — unverified, all asserted from CF7/Fluent priors.
- Notifications: multi-notification per form, placeholders, recipients
  pulled from role email-subscriptions — unverified.
- Webhooks with retries / backoff — unverified.
- Submissions browser at `/admin/forms/<slug>/submissions` with CSV/JSON
  export — route + UI unverified.
- Rate limiting, required-referrer — unverified.
- The `forms-form` content block and `{{ form \"<slug>\" }}` template
  helper — unverified.

These need an eyes-on-screen + code-grep pass before the Forms page is
trustworthy. Don't ship it publicly until the rest is verified or trimmed.

---

## Patterns to fix at the source

If this list grew, the right home is the MCP guide itself. Top three to ship first:

1. **Surface `layout_slug`** on `core.node.create` / `core.node.update` (or auto-fill from node-type default).
2. **Make `documentation` node-type self-describing** — `core.nodetype.get("documentation")` should expose the required `fields_data` shape (`order`, `section`, `summary`) and the layout convention.
3. **Add a "docs page" recipe** to `core.guide` listing required SEO + excerpt + section + layout fields, plus the doc-* block schemas.

After those three, an agent could author a docs page top-to-bottom in a single MCP round trip with no out-of-band reverse-engineering.
