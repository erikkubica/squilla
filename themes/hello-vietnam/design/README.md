# Handoff: Hello Vietnam Adventures — Marketing Website

## Overview

A complete marketing & booking website for **Hello Vietnam Adventures**, a locally-guided, small-group tour operator running food crawls, motorbike loops, cooking classes and homestays across Vietnam. The design covers 7 connected pages: Home, About, Trips listing, Trip detail (with full booking form), Contact, Gallery, and a Privacy/Legal template. The site is warm, playful, and people-focused — meant to feel like being guided by a knowledgeable local friend, not a corporate travel portal.

## About the Design Files

The files in this bundle are **design references created in HTML/React+Babel** — prototypes showing intended look, copy, interactions and state transitions. They are **not production code to copy directly**.

Your job is to **recreate these HTML designs in the target codebase's existing environment** using that codebase's established patterns, routing, component library, form handling, CMS/data layer, and styling conventions. If no environment exists yet, pick the most appropriate framework for a marketing site (Next.js App Router + Tailwind, Astro + MDX, SvelteKit, etc.) and implement the designs there. The HTML is the spec; the implementation should look identical but live inside the real stack.

## Fidelity

**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, component sizing, and interactions. Recreate the UI faithfully:

- Colors are exact hex values (see Design Tokens).
- Typography uses Fredoka (display) + Montserrat (body) from Google Fonts.
- Spacing, radii, shadows, and button sizes are defined as CSS custom properties in `styles.css`.
- Every interaction (hover, active, accordion open/close, form submit, filter, lightbox) is implemented in the prototype and should behave identically in production.

Image content is represented by **striped color-block placeholders with monospace captions** (e.g., "hero · bún chả grandma, hanoi"). These mark where **real photography** must be dropped in. Placeholders have defined aspect ratios and positions — preserve those exactly and swap in real imagery.

---

## Screens / Views

### 1. Home (`page === "home"`)

**Purpose:** Hook visitors with trip personality; funnel to Trips listing or Trip detail.

**Sections, in order:**

1. **Hero** — 2-column grid (1.1fr / 0.9fr), 48px gap.
   - Left: `badge-yellow` pill "Xin chào! We're Hello Vietnam.", H1 with multi-line headline ("Eat, wander, & **laugh** your way through **Vietnam**."). The word "laugh" is `color: --red`; "Vietnam" has a hand-drawn SVG yellow underline (quadratic curve, 6px stroke, rounded caps). Subcopy in `--ink-soft`. Two CTAs: `btn-primary` "Find Your Adventure →" + `btn-ghost` "Meet the Crew". Below: stacked avatar group (4 × 40px circles, 2px cream border, -10px overlap) + 5-star row (`--yellow`) + "2,400+ travelers · Rated 4.9 on TripAdvisor".
   - Right: 560px-tall relative container with 3 overlapping placeholder tiles rotated at +1.5°, -3°, +6° and a floating yellow pill sticker ("100% local-guided") rotated -8°.

2. **Categories strip** — full-width band, `--cream-warm` bg, top/bottom `--line` border. 4-column grid (no gap) with vertical `--line` dividers between cells. Each cell: 54px circular placeholder + icon + label + "Explore →". Icons: `food`, `trail`, `workshop`, `family`.

3. **Featured Experience** — section (96px top/bottom). 2-col grid, 56px gap. Left: 480px-tall red placeholder card (radius `--r-xl`, `--shadow-lg`). Right: eyebrow "Featured Experience" → H2 "Phở at 6am, like the locals mean it." → paragraph → 2-col meta grid (icon + label: `clock`/4 hours, `pin`/Old Quarter, `family`/max 6, `chef`/Hosted by Linh) → `btn-primary` "See this trip".

4. **How It Works** — `--ink` background section, cream text. Centered eyebrow + H2. 3-column grid of cards (`rgba(255,255,255,.04)` bg, `--r-lg` radius, 1px white-8% border, 32×28 padding). Each: giant Fredoka numeral ("01", "02", "03") in `--red` / `--yellow` / `--green`, then H3 title, then body copy.

5. **Popular Trips** — section. Header row: left title block ("Our most-booked" eyebrow + H2 "Trips travelers can't stop talking about."), right `btn-ghost` "See all trips →". Below: 3-column `TripCard` grid, 24px gap. Cards show first 3 from TRIPS data.

6. **Wall of Love** — `--cream-warm` bg section. Centered title. 4-column grid of testimonial cards on white, `--r-lg`, each card alternately rotated ±1°. Card: 180px placeholder "insta post" + quote + name/handle row with Instagram icon.

7. **Lead Magnet** — section with full-bleed rounded banner, `linear-gradient(135deg, --red, --red-deep)`, `--r-xl`, 56×64 padding, two translucent yellow circles as decor. Left: yellow badge "Free · 12-page PDF", H2 "The Hanoi Street Food Map.", paragraph, email input + yellow CTA. Right: rotated yellow placeholder "PDF mockup".

### 2. About (`page === "about"`)

1. **Intro hero** — 2-col grid, left: eyebrow + H1 + 2 paragraphs; right: 440px yellow "team photo · lunch on plastic stools" placeholder.
2. **Origin Story timeline** — centered vertical spine timeline, 880px max. Spine is 3px `--line`. Alternating left/right cards with year in Fredoka (1.8rem) colored per entry, small body copy. Each spine node is an 18px colored dot with 4px cream border and 2px ring. 5 entries: 2016 → 2018 → 2020 → 2022 → 2026.
3. **Meet the Crew** — `--cream-warm` section. 3-col grid of polaroid cards (white bg, 20×24 padding, `--r-md`), each rotated ±1.5°, hover removes rotation and scales 1.03. Card: 260px placeholder + name H3 + role/location + "Fun fact" callout in cream-warm mini-card with sparkle icon. 6 crew members.
4. **Values** — 3-col card grid. Cards: 32px padding, 60px colored circle with icon (`x` / `heart` / `leaf`), H3, body. Titles: "No tourist traps", "Supporting locals", "Always sustainable".
5. **Community Impact** — 2-col grid, 380px green placeholder left, eyebrow + H2 "5% of every booking funds a village school." + paragraph + `btn-green` on right.
6. **Contact CTA band** — `--ink` bg, centered, "Got a question?" H2 + body + `btn-yellow` "Let's chat".

### 3. Trips Listing (`page === "trips"`)

1. **Filter header** — `--cream-warm` bg. Centered eyebrow + H1 "I'm looking for...". Below: search bar row (flex, 680px max) — search input with leading magnifier icon (pill radius, 52px height) + `btn-primary` "Filter". Below that: pill filter row, centered, `--red` background when active else white with `--line` border. Tags: All / Foodie / Adventure / Relaxing.
2. **Staff Pick banner** (shown only when All + no search) — full-width rounded banner with red-gradient bg. 1.1fr/1fr grid. Left padding 48×56: yellow "#1 Staff Pick" badge + H2 + body + meta row + yellow CTA. Right: image placeholder, min-height 380px.
3. **Grid** — results count + sort dropdown row, then 3-col TripCard grid. Empty state: centered cream-warm card with heading "No trips match that search."
4. **Map** — 2-col grid. Left: eyebrow + H2 + body + 3 rows listing regions (color dot + region name + trip count). Right: 480px ink placeholder "interactive map of vietnam" with 6 decorative absolute-positioned pins (red/yellow/green, 20px circles with 3px white border).
5. **Custom Journey callout** — yellow-soft rounded banner, flex with wrap. H2 "Don't see it? Build it." + body + `btn-primary`.

### 4. Trip Detail (`page === "trip"`)

1. **Breadcrumbs** — Home › Trips › [trip title], `--ink-soft` 0.85rem.
2. **Gallery hero** — 2fr/1fr grid, 520px tall. Left: full-height main image placeholder (color matches trip.color). Right: stacked 1fr/1fr; top yellow, bottom 1fr/1fr split (green, red with "+2 more" label). All `--r-xl`.
3. **Two-column content layout** — 1.4fr/1fr, 56px gap.
   - **Left column:**
     - Badge row: trip.tag badge + duration badge + location badge + (if staff pick) yellow sparkle badge.
     - H1 trip title.
     - Rating row: 5 yellow stars + number + "· N reviews" muted.
     - "What to expect" H3 + paragraph.
     - **Itinerary accordion** — 1px line border, `--r-lg`, overflow hidden. Each stop: button with 36px colored numeral circle + stop title + "Stop N" subtitle + plus/minus icon. Open state: cream-warm bg, revealing briefing copy at 76px left indent.
     - **What's included / Not included** — 2-col grid. Green checkmark circles for included (5 items), cream-warm `x` circles for not included (4 items).
     - **Reviews** — 3 cards, each with 56px circular avatar, name + 5 stars + quote + "Booked the [trip] · 2 months ago".
     - **Quick FAQs** — 4 accordion rows.
   - **Right column (sticky, top: 100):**
     - **Booking card** (28px padding, `--r-lg`, white card): price block ("$NN" Fredoka 2rem + "per adult" + "Kids under 12 · 50% off" small). Fields in order: First / Surname (2-col); Email; WhatsApp/Phone (with hint); Date picker; Adults / Kids steppers (±buttons flanking number); Dietary dropdown (None / Veg / Vegan / GF / Allergies); Experience level (only if tag === "Adventure"); Vibe Check textarea. Total summary in cream-warm block with "50% now / 50% on trip day" note. Full-width `btn-primary` "Reserve my spot". Free-cancellation microcopy. On submit (requires firstName + email), swap to success state with green check, "You're in!" heading, confirmation copy, "Book another" ghost button.
     - **WhatsApp help tile** below booking card, cream-warm.
4. **Related trips** — `--cream-warm` section, 3-col TripCard grid of other trips.

### 5. Contact (`page === "contact"`)

1. **Intro** — centered, eyebrow + H1 "We check our WhatsApp constantly." + body.
2. **2-col grid** (1fr / 1.2fr, 56px gap):
   - **Left:** 3 contact cards (WhatsApp / Email / Meet us), each: 50px colored circle + icon + uppercase label + Fredoka value. The "Meet us" card additionally shows address, 180px ink placeholder map, and hours. Below: 3 dark social icon buttons (square ink bg).
   - **Right:** form card (white, 36px padding). Fields: Name / Email / Subject dropdown / Message textarea / `btn-primary` "Send message". On submit (name + email required) → success state with green check, "Message sent!", "Send another" ghost button.
3. **FAQ preview** — `--cream-warm` band. 1fr/2fr grid: left title, right 4 accordion FAQs.

### 6. Gallery (`page === "gallery"`)

1. **Intro** — centered eyebrow + H1 "Ten years of candid Vietnam." + body. Category filter pills row: All / Street Food / Landscapes / People / Workshops. Active is `--ink` bg + cream text.
2. **Masonry grid** — CSS `column-count: 4`, 16px column-gap. 12 tiles, alternating tall (340px) / short (240px), colored placeholders with captions. `break-inside: avoid`. Hover scales 1.02, cursor zoom-in.
3. **Lightbox** — fixed overlay, `rgba(44,62,80,.92)`, fade-in. Close button top-right. Expanded tile: 900px max, 640px max, `--r-lg`. Click backdrop to close.
4. **Bottom CTA band** — yellow bg, H2 "Want to be featured?" + tag prompt.

### 7. Legal / Privacy (`page === "legal"`)

1. Breadcrumbs (Home › Legal › Privacy).
2. H1 + "Last updated" muted.
3. **"Too Long? Summary" callout** — `--yellow-soft` bg, 2px dashed `#c49a00` border, `--r-lg`. Sparkle icon + H3 + 4-item bullet list.
4. **Readable content column** — max-width 760px, narrow single column. Sections 1–4 with Fredoka H3 headings.
5. **Contact concern card** — `--cream-warm` card with mail icon + "Have a concern?" prompt.

### Chrome (all pages)

- **Nav** (sticky, 72px, backdrop-filter blur 14px on `rgba(249,247,242,.82)`): logo (36px red circle with yellow star + "Hello **Vietnam**" wordmark) · center nav links (pill-style, active is `--ink` bg + cream text) · right `nav-cta` red pill "Find Your Adventure →".
- **Footer** — `--ink` bg, 64×28 padding, 4-col grid (2fr/1fr/1fr/1fr). Col 1: logo + tagline + 4 social icons. Cols 2–3: "Explore" and "Support" link lists. Col 4: newsletter mini-form. Bottom row: copyright + license number.

---

## Interactions & Behavior

- **Routing:** in-memory page state (`page`) plus a separate `tripId`. Persisted to `localStorage` (keys `hv-page`, `hv-trip`). In production, replace with proper routing (Next.js route segments or equivalent).
- **Scroll-to-top on page change.**
- **Nav active state** matches current page id.
- **Trip cards** hover: `translateY(-4px)` + `--shadow-md`.
- **All buttons** hover: `translateY(-2px)` + elevated shadow.
- **Accordion rows** (itinerary, FAQs): single-open is NOT enforced; each row toggles independently. Plus ↔ minus icon swap; for FAQs the icon circle swaps from cream-warm to red on open.
- **Trip filter:** tag filter + search both filter client-side against TRIPS list. Search matches title or location, case-insensitive.
- **Staff Pick banner** hidden when filter ≠ All or search is non-empty.
- **Booking form validation:** requires `firstName` + `email` non-empty to submit. Total recalculates live: `price × adults + price × 0.5 × kids`.
- **Experience level field** only renders if `trip.tag === "Adventure"`.
- **Gallery lightbox:** click tile opens overlay; click backdrop closes; inner image `stopPropagation` so clicks inside don't close.
- **Page transitions:** all page roots animate in with `fadeUp` keyframe (0.35s ease, translateY 8→0 + opacity 0→1).
- **Tweaks panel** (optional, dev-only): floating bottom-right panel activated via host toolbar; swatches for accent color, select for display font. Posts `__edit_mode_set_keys` to persist.

## State Management

- `page: string` — current route segment (`home` | `about` | `trips` | `trip` | `contact` | `gallery` | `legal`)
- `tripId: string` — currently-viewed trip slug
- `filter, search` — Trips listing UI state
- `photo` — Trip detail gallery index (wired for future carousel)
- `openDay: number` — itinerary accordion open index (-1 = all closed)
- `booking: object` — booking form fields
- `bookedDone: boolean` — booking success state
- `form, sent` — Contact form + success state
- `filter, lightbox` — Gallery UI state
- `open: boolean` — per-FAQ accordion
- `tweakOn, tweaks` — Tweaks panel state

In production: move trips, testimonials, crew, and FAQs to a CMS (Sanity, Contentful, or MDX files). Wire booking form to a real endpoint (Stripe + webhook + email). Wire Contact form to transactional email. Replace localStorage page state with framework routing.

## Design Tokens

### Colors
```
--red:       #E31D2B   (primary)
--red-deep:  #B8141F
--yellow:    #FFD200   (secondary)
--yellow-soft: #FFE770
--green:     #007A33   (tertiary)
--green-deep:#005A24
--cream:     #F9F7F2   (page bg)
--cream-warm:#F2EEE4   (section bg)
--ink:       #2C3E50   (text, dark sections)
--ink-soft:  #5A6B7A   (secondary text)
--line:      #E6E1D4   (borders)
--white:     #FFFFFF
```

### Typography
- **Display:** Fredoka (weights 400/500/600/700) — used for all H1–H4, buttons, numerals, price, logo wordmark.
- **Body:** Montserrat (400/500/600/700) — all paragraph and UI text.
- **Mono:** JetBrains Mono 400/500 — used only for placeholder captions.
- H1: `clamp(2.2rem, 4.4vw, 4rem)`, line-height 1.02, letter-spacing -0.02em
- H2: `clamp(1.8rem, 3vw, 2.6rem)`, line-height 1.1
- H3: 1.35rem, line-height 1.2
- Body: 16px base, line-height 1.55, `text-wrap: pretty`
- Eyebrow: 0.8rem, uppercase, 0.12em letter-spacing, `--red`

### Radii
```
--r-sm: 8px    --r-md: 14px    --r-lg: 22px
--r-xl: 32px   --r-pill: 999px
```

### Shadows
```
--shadow-sm: 0 1px 2px rgba(44,62,80,.06), 0 2px 8px rgba(44,62,80,.04)
--shadow-md: 0 4px 14px rgba(44,62,80,.08), 0 10px 30px rgba(44,62,80,.06)
--shadow-lg: 0 14px 40px rgba(44,62,80,.14)
```
Red button shadow: `0 6px 18px rgba(227,29,43,.3)` → `0 10px 24px rgba(227,29,43,.4)` on hover.

### Spacing
- Container max-width: 1240px, 28px side padding.
- Section vertical padding: 96px (`.section`), 64px (`.section-tight`).
- Nav height: 72px.

### Buttons
- `.btn` — pill, Fredoka 500, 14×24 padding, `transform: translateY(-2px)` on hover.
- Variants: `.btn-primary` (red), `.btn-yellow`, `.btn-green`, `.btn-ghost` (transparent, 1.5px ink border, inverts on hover).

### Placeholders
All photography is represented by `.ph` — 135° repeating diagonal-stripe pattern on a base color. Variants: `.ph.red`, `.ph.yellow`, `.ph.green`, `.ph.ink`. The stripe opacity varies per color. Each has a `.ph-label` monospace pill describing intended content. **Replace with real photography** in production.

## Imagery Style

Per the brief: **candid, high-saturation, people-focused** (laughing with locals), and macro shots of street food. No stock photography. No AI-generated images. Every placeholder in the prototype has a caption describing exactly what kind of photo belongs there.

## Assets

- **Fonts:** Fredoka, Montserrat, JetBrains Mono — Google Fonts.
- **Icons:** Custom inline SVGs in `components/shared.jsx` (`Icon` component). 22 icons, stroke-width 2, rounded caps/joins. If the target codebase uses Lucide, Phosphor, or Heroicons, the names map closely — feel free to substitute.
- **Imagery:** None. All images are placeholders pending real photography. 24 distinct image positions are captioned in the prototypes.

## Files

- `Hello Vietnam.html` — entrypoint; loads fonts, stylesheet, React/Babel, and component modules. Contains the App shell, routing state, and Tweaks panel.
- `styles.css` — all design tokens, base element styles, nav/footer, buttons, forms, placeholders, cards, tweaks panel, responsive breakpoints.
- `components/shared.jsx` — data (TRIPS, TESTIMONIALS, CREW, FAQS), `Icon` component, `Nav`, `Footer`.
- `components/home.jsx` — `Home`, `TripCard`.
- `components/pages.jsx` — `About`, `Contact`, `Gallery`, `Legal`, `FAQ` accordion.
- `components/trips.jsx` — `Trips` listing, `TripDetail`, `Stepper`.

## Implementation notes for the developer

- Break down the React+Babel monolith into proper components in your framework's conventions. Each top-level page component here maps 1:1 to a route.
- Move the TRIPS / TESTIMONIALS / CREW / FAQS arrays in `components/shared.jsx` to a CMS or typed JSON/MDX — they are the content source of truth.
- The Tweaks panel is a design-tool affordance; **do not ship it to production**.
- The accent-color theming via `data-accent` on `<body>` is a prototype hook — accent color in production should be a single choice, not user-switchable.
- Icon set is hand-rolled inline SVG; swap to your icon library if you have one. Names: food, trail, workshop, family, map, clock, star, arrow, heart, check, x, plus, minus, instagram, tiktok, whatsapp, mail, phone, pin, filter, search, calendar, globe, sparkle, chef, leaf.
- Responsive: prototype collapses nav links under 860px and reduces section padding. Flesh out a full mobile spec per page before launch.
