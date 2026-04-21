# Hello Vietnam — Theme Build TODO

Living checklist. Commit this file as I move things. Nothing gets marked done until the live site proves it end-to-end.

## Scope note (per user, 2026-04-21)

**Only forms stay static.** Contact form, trip booking form, newsletter subscribe, tweaks panel (not shipped) — these are `view.html` markup + `theme.js` handlers. Everything else (copy, links, collections, labels, filter chips, CTAs that repeat across pages) is dynamic / settings / taxonomy / node-driven.

## 0 · Ground rules (production-ready mindset)

Imagine a real editor running this site in the admin. They must never:
1. Edit the same string twice. Any value that appears on multiple pages (site title, phone, WhatsApp, social URLs, primary CTA, trust stats, contact email, license number, footer tagline, copyright year) lives in **Site Settings** and is read by blocks/partials via `{{.app.settings.X}}` / `core.settings.get`.
2. Retype a collection. Repeated entities (trips, crew, testimonials, gallery photos, FAQs) live as **node types**, queried by blocks via `filter "list_nodes"`.
3. Maintain a label list in two places. Things the user would classify by (trip tag, gallery category, trip region) are **taxonomies** — blocks read terms, not hand-rolled string arrays. Pills/chips/filter lists render from the taxonomy's terms.
4. Rebuild a section because copy is in a template. Every *visible* string comes from a `field_schema` field on the block, with sane `test_data` defaults mirrored from the design.

Rules derived from that:

- **1:1 HTML fidelity.** Every rendered section must structurally match `design/rendered/<page>.html`. No silent restructuring.
- **Dynamic first.** Trips, crew, testimonials, gallery, FAQs, itinerary, reviews, included/not-included, timeline entries, values, category lists, trust badges, social links — all data, not HTML.
- **Taxonomies drive filters.** `hv-trips-filter` pills come from `trip_tag` terms; `hv-gallery-intro` pills from `gallery_category` terms. New term in admin → new pill on the site with no code change.
- **Lightbox wired.** `hv-gallery-masonry` tiles carry `data-bg` / `data-ph-variant` so `theme.js` opens them as a proper overlay.
- **No lazy stubs.** A block either renders real data with proper fields OR is explicitly called out here as "frozen HTML, awaiting split" with a dated TODO entry.
- **Settings are first-class.** Register a `hv.*` namespace (`hv.site_tagline`, `hv.primary_cta_label`, `hv.primary_cta_url`, `hv.trust_rating`, `hv.trust_count`, `hv.trust_platform`, `hv.whatsapp`, `hv.email`, `hv.phone`, `hv.address`, `hv.social.instagram` …). Seed defaults at activation.
- **Verify with screenshots.** Every page gets a Playwright full-page screenshot saved to `design/verify-<page>.png` after any block rewrite, compared to `design/rendered/<page>.html`.

## 0b · Settings to register (and the blocks/partials that read them)

| Setting key | Used by |
| --- | --- |
| `hv.site_tagline` | footer, meta |
| `hv.primary_cta_label` + `hv.primary_cta_url` | nav CTA, hero primary CTA, staff-pick CTA, custom-journey CTA |
| `hv.trust_rating` · `hv.trust_count` · `hv.trust_platform` | hero trust row, wall-of-love intro |
| `hv.whatsapp` · `hv.email` · `hv.phone` · `hv.address` | footer, contact cards |
| `hv.social.instagram` · `.tiktok` · `.youtube` · `.email` | footer socials, contact page socials |
| `hv.license` · `hv.copyright_owner` | footer bottom row |
| `hv.lead_magnet.title` · `.body` · `.cta` | hv-lead-magnet block default |
| `hv.impact_percent` | hv-impact block default (currently "5%") |

Seed these in `theme.tengo` on activation via `core/settings.set` if not already present.

## 0c · Reimport & cache gotchas (confirmed in core)

1. **Homepage is keyed by `homepage_node_id` site setting** (verified in `internal/cms/public_handler.go:136` + `internal/db/seed.go:268` + `internal/coreapi/tengo_adapter.go:784`). `/` resolves to that node id; without it, core falls through to default page logic. **Theme seed script MUST `settings.set("homepage_node_id", <home id>)` after creating the home page node.**
2. **Cache** = `PublicHandler.{siteSettings,blockTypes,themeBlockCache,blockOutputCache}` plus the renderer's own cache. `ClearCache` is subscribed to any event with prefix `theme.` / `setting.` / `block_type.` / `language.` / `layout*` (see `public_handler.go:82`). So:
   - Setting changes via `core.settings.set` → emits `setting.*` → cache auto-clears.
   - Theme activate/deactivate → emits `theme.*` → cache auto-clears.
   - **But `docker cp` of a changed `view.html` is filesystem-only → no event → cache stays stale** until a block-type DB update or restart. Dev loop: `docker cp` → `docker restart` (simplest, ~3s), or `curl -X POST http://…/admin/api/cache/clear` with admin auth.
3. Add `scripts/reload.sh` in theme: `docker cp themes/hello-vietnam vibecms-app-1:/app/themes/ && docker restart vibecms-app-1` — single command dev loop.

## 1 · Foundations

- [x] Theme manifest (`theme.json`) listing layouts/partials/blocks/styles/scripts
- [x] CSS copied verbatim from `design/styles.css` → `assets/styles/theme.css`
- [x] Vanilla-JS interactions ported from React prototype (`assets/scripts/theme.js`): trips filter, gallery filter+lightbox, accordion, booking form, contact form
- [x] `layouts/default.html` + `trip.html` + `legal.html` shell matching the React HTML shell
- [x] `partials/site-header.html` with template-driven active-link logic
- [x] `partials/site-footer.html` verbatim
- [x] Node types: `trip`, `crew_member`, `testimonial`, `gallery_photo` with full field schemas (incl. repeaters for stops/included/not_included/faqs)
- [x] Taxonomies: `trip_tag`, `gallery_category`
- [x] `list_nodes` filter (port of grotto's) for block-side queries
- [x] Demo seeds: 4 trips, 6 crew, 4 testimonials, 12 gallery photos, 7 page nodes

## 2 · Dynamic blocks (query nodes from DB) — must be rewritten to not hardcode content

All of these currently ship frozen HTML (first-pass verbatim). Rewrite `view.html` to pull from `filter "list_nodes"` or `.node.fields_data`, and expose editor-facing fields for headings/eyebrows/limits in `block.json`.

- [ ] `hv-popular-trips` — query 3 trip nodes, render trip-card markup (title, tag, duration, price, rating, accent color, link to `/trips/<slug>`). Fields: `eyebrow`, `heading`, `cta_text`, `cta_url`, `limit`.
- [ ] `hv-trips-grid` — query all trips, render full grid with `data-tag` / `data-title` / `data-location` for JS filter. Fields: `limit`, empty-state copy.
- [ ] `hv-staff-pick` — query 1 trip with `staff_pick=true`, render red-gradient banner. Fields: `badge_text`, `cta_text`, fallback copy.
- [ ] `hv-featured` — query 1 featured trip (staff pick, else first), render left image + right content. Fields: `eyebrow`, heading override, `cta_text`.
- [ ] `hv-wall-of-love` — query 4 testimonials, render white cards with alternating ±1° rotation. Fields: `eyebrow`, `heading`, `limit`.
- [ ] `hv-crew-grid` — query 6 crew, render polaroid grid. Fields: `eyebrow`, `heading`, `limit`.
- [ ] `hv-gallery-masonry` — query 12 gallery photos with category + color + tall, render CSS-column masonry with `data-category` for JS filter. Fields: `limit`.
- [ ] `hv-trips-map` — query trips, aggregate by region to render region list with counts. Fields: `eyebrow`, `heading`, `body`.
- [ ] `hv-trip-detail` — read current node (`trip`), render full detail page: gallery hero, title+rating, itinerary accordion (from `stops` repeater), included/not-included (from repeaters), reviews (query related testimonials), booking card with live price total (uses `data-price` from trip.price), FAQs accordion (from `faqs` repeater), related trips (query siblings, exclude self).

## 3 · Static / configured blocks — add proper editable fields

All HTML stays 1:1, but copy/links come from `block.json` `field_schema` instead of being hardcoded.

- [ ] `hv-hero` — `badge_text`, `headline_pre` (before "laugh"), `headline_mid` (after), `headline_tail` (before "Vietnam"), `subcopy` (textarea), `primary_cta` (link), `secondary_cta` (link), `trust_text`, `trust_count`.
- [ ] `hv-categories` — repeater of 4 `{ icon, label, href }`.
- [ ] `hv-how-it-works` — `eyebrow`, `heading`, repeater of 3 `{ numeral, title, body, color }`.
- [ ] `hv-lead-magnet` — `badge_text`, `heading`, `body`, `cta_text`.
- [ ] `hv-about-intro` — `eyebrow`, `heading`, `body_p1`, `body_p2`, `team_photo_caption`.
- [ ] `hv-timeline` — `eyebrow`, `heading`, `body`, repeater of entries `{ year, title, body, color }`.
- [ ] `hv-values` — `eyebrow`, `heading`, repeater of 3 `{ icon, title, body }`.
- [ ] `hv-impact` — `eyebrow`, `heading`, `body`, `cta_text`, `cta_url`.
- [ ] `hv-contact-band` — `heading`, `body`, `cta_text`, `cta_url`.
- [ ] `hv-trips-filter` — `eyebrow`, `heading`, `search_placeholder`, repeater of pill tags `{ label }`.
- [ ] `hv-custom-journey` — `heading`, `body`, `cta_text`, `cta_url`.
- [ ] `hv-contact-intro` — `eyebrow`, `heading`, `body`.
- [ ] `hv-contact-form` — 3 contact-card repeater `{ icon, label, value }`, subjects dropdown options as repeater, success copy.
- [ ] `hv-contact-faq` — `heading`, repeater of `{ q, a }` items.
- [ ] `hv-gallery-intro` — `eyebrow`, `heading`, `body`, category pills repeater.
- [ ] `hv-gallery-cta` — `heading`, `body`.
- [ ] `hv-legal-content` — `heading`, `updated_at`, `summary_points` repeater, `sections` repeater `{ h3, body }`, `contact_concern` card.

## 4 · Layouts

- [x] Generic `default.html` wired to `{{.node.blocks_html}}`
- [ ] Verify `trip.html` layout differs appropriately (no header CTA duplication — currently same as default, which is fine)
- [ ] Verify `legal.html` narrow-column behavior works when `hv-legal-content` ships its own `max-width: 760px` inner

## 5 · Partials

- [x] Header with per-page active-link logic
- [ ] Fix the header logo: design shows a 36px red circle + yellow star inside (`.logo-mark` CSS should render it via `::before`). Verify CSS actually paints the star — currently the `.logo-mark` span is empty.
- [x] Footer with all 4 columns

## 6 · Assets

- [ ] Currently zero image assets — all placeholders are CSS diagonal stripes (`.ph.red`, `.ph.yellow`, `.ph.green`, `.ph.ink`). Per README this is intentional until real photography lands.
- [ ] When real photos arrive: add `assets/images/*` + register in `theme.json` `assets[]` and wire block fields to accept `image` objects that fall through to placeholders when empty.

## 7 · Verification protocol

After every dynamic-block rewrite:

```sh
docker cp themes/hello-vietnam vibecms-app-1:/app/themes/
docker restart vibecms-app-1
# Wait for restart, then:
curl -sSf http://127.0.0.1:8099/        >/dev/null  # home
curl -sSf http://127.0.0.1:8099/trips   >/dev/null
curl -sSf http://127.0.0.1:8099/about   >/dev/null
curl -sSf http://127.0.0.1:8099/gallery >/dev/null
curl -sSf http://127.0.0.1:8099/contact >/dev/null
curl -sSf http://127.0.0.1:8099/trip    >/dev/null
curl -sSf http://127.0.0.1:8099/legal   >/dev/null
```

Then Playwright screenshots → diff against rendered baselines.

## 8 · Open design questions

- Trip detail URL: currently `/trip` (the demo node). Real site should have `/trips/<slug>` per node_type `url_prefixes: { en: "trips" }`. Verify core routing honors that and that `/trips` listing links to `/trips/<slug>` not `/trip`.
- Itinerary open state: single-open vs multi-open per README (multi-open is specced). JS handles this already; verify.
- Homepage featured trip: pick by `staff_pick=true` (currently "hanoi-street-food") or expose as block field with trip picker?

## 9 · Deferred / out-of-scope for first full pass

- Real photography (placeholders are intentional)
- Booking form back-end wiring (Stripe + email) — currently client-side success simulation only
- Contact form back-end wiring
- Newsletter subscribe wiring
- Tweaks panel (explicitly specced as dev-only, do not ship)
- Responsive mobile refinement beyond what the CSS ships — needs a dedicated pass per README note

## Status key
- `[ ]` not started
- `[~]` in progress
- `[x]` shipped and verified on live site
