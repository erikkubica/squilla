# Hello Vietnam — Full Block Audit

Triggered by real bug report: 100% failure rate on 3 random clicks (hero fields empty in admin, hero buttons not clickable, trip accordion not opening). This is the systematic sweep.

## Bugs found and fixed

- [x] **hv-hero: admin fields empty** — home node's `hv-hero` block had `fields: {}`; template fallbacks masked the missing data. Fixed by populating node 328's blocks_data with the full hero schema.
- [x] **hv-hero: buttons not clickable** — `{{ with .cta_primary }}{{ with .url }} href=...{{ end }}{{ end }}` emitted nothing when field absent. Rewrote to always emit href with fallback (`/trips`, `/crew`).
- [x] **Trip accordion not opening** — JS only toggled `.is-open` class but panel had inline `style="display:none"` and no CSS rule overrode it. `initAccordions` now directly toggles `panel.style.display` + flips `+`/`–` icon.
- [x] **hv-contact-faq: accordion markup mismatched** — block used `<div data-accordion>` wrapper + `data-accordion-trigger` button, but JS expects `[data-accordion-row]` wrapper + `button[data-accordion]`. Normalized markup to match trip layout.
- [x] **Contact form missing `data-contact-form`** — form posted to `/contact/submit` (404). Added `data-contact-form` attr, `action="#"`, inserted `data-contact-success` div so JS preventDefault + success state works.
- [x] **Gallery filter broken: pills + tiles in separate `data-gallery-root` blocks** — `initGallery` queried pills/tiles inside ONE root; intro-block pills had no way to reach masonry-block tiles. Rewrote to scan globally across all roots.
- [x] **Newsletter form POSTs to blank action** — footer form had `data-newsletter-form` but no handler. Added `initNewsletter` that preventDefaults + flashes thank-you, auto-resets after 4s.
- [x] **`/crew` → 404** — nav linked to it but no node. Created published page (id 357) with `hv-crew-grid` block.
- [x] **All page nodes had `fields: {}` for most blocks** — admin editor showed empty fields on home/trips/gallery/legal/contact/crew. Populated nodes 324 (trips), 325 (gallery), 326 (legal), 328 (home hv-featured + hv-lead-magnet), 330 (contact), 357 (crew).

## Verification (all 200, all hooks present)

| Page | Status | Key hooks |
|---|---|---|
| / | 200 | hero href="/trips" + "/crew" |
| /trips | 200 | 4 pills, 1 staff-pick, 4 trip cards |
| /trips/hanoi-street-food | 200 | 8 accordion rows, booking card |
| /trips/ha-giang-loop | 200 | per-trip layout |
| /gallery | 200 | 5 pills, 13 tiles, lightbox present |
| /about | 200 | already populated |
| /contact | 200 | 4 FAQ rows, data-contact-form present |
| /crew | 200 | crew grid renders |
| /legal | 200 | 4 content sections + summary |

## Remaining punts (user-approved static)

- Contact/booking/newsletter forms don't POST to a backend (user said "only static thing for now will be forms").
- Gallery photos are placeholders (no real image uploads).
- Booking stripe integration deferred.
- About page `hv-crew-grid` block still has `{}` fields — queries crew_member nodes so it renders; admin just shows no overrides, matches intended dynamic behavior.

## Blocks touched this pass

Changed files: `blocks/hv-hero/view.html`, `blocks/hv-contact-form/view.html`, `blocks/hv-contact-faq/view.html`, `assets/scripts/theme.js`. All other 23 blocks audited, no bugs found.
