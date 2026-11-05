# In-page signals: browser matrix

Measured with `e2e/` (Playwright 1.64: Chromium 152-era build, Google Chrome stable, Firefox, WebKit 27.2
(Safari 26 engine)) against a page produced by the real instrumenter. Re-run with
`cd extensions/analytics/e2e && npm run fixture && npx playwright install chromium firefox webkit && npm test`.
Real Safari (macOS, iOS) and headed Chrome prerender are **not** covered by this automation; see "Still open".

| Signal | Mechanism | Chromium / Chrome | Firefox | WebKit |
| --- | --- | --- | --- | --- |
| Activation (~1 s after load) | SVG SMIL `<set href begin=1s>` | ✅ once | ✅ once | ✅ once |
| Dwell 10 s / 30 s / 1 / 3 / 10 min | SMIL timers | ✅ | ✅ | ✅ |
| Viewport + colour scheme | `@media` background image (never counts a view) | ✅ | ✅ | ✅ |
| Section impressions, scroll-back safe | scroll timeline → registered custom property → style query | ✅ only what scrolls into view, once | none (no scroll timelines) | ✅ |
| End of page | same, last section | ✅ | none | ✅ |
| Form focus, FAQ opened (not items open at start) | `:has()` + `data-sq-o` | ✅ | ✅ | ✅ |
| Link ping (`Ping-From`, `Ping-To`, POST) | `<a ping>` | ✅ internal, outbound, `mailto:`, `wa.me`, `rel=noreferrer` | ❌ never sent | ✅ outbound, `mailto:`; internal link not observed |
| Theme `prefers-reduced-motion` reset (`*{animation:none!important}`) | n/a: timers are SMIL, sections use `!important` longhands | ✅ unaffected | ✅ | ✅ |
| UA and `Accept-Language` of beacons equal the document's | visitor-hash inputs | ✅ | ✅ | ✅ |

## What the measurements changed

* **WebKit fetches every CSS image it can see at load**: images named in `@keyframes`, and images inside
  `content-visibility:hidden`. Firefox also fetches the latter. So no CSS image is ever animated or hidden.
  Time triggers use SMIL instead — the only lazy timer in all three engines, and it ignores the theme's
  `animation:none!important` reset.
* **Two animations on one element break WebKit's style queries**, so the 1 s silence for section beacons sits on a
  parent (`.sq-g`) and each section wrapper has exactly one animation.
* **`display:none` → `display:block` keyframes never fire** (animations do not run on `display:none`).
* **`Ping-From` survives `rel=noreferrer`**, `Referer` does not; the handler reads `Ping-From` first.
* **Firefox never sends pings** (off by default): outbound CTR is understated there. Internal clicks still show up
  as page→page edges from the next request's `Referer`.
* The browsers that cannot do scroll timelines (Firefox here) still send activation, dwell, form and FAQ signals.

## Still open (needs real devices)

1. **Prerender / prefetch**: do SMIL timers and CSS beacons run inside a Chrome prerender, and with `Sec-Purpose`?
   Server side already ignores any signal that carries `Sec-Purpose`, and a signal without it activates the stored
   speculative row, so the worst case is a view counted at prerender time instead of activation time.
2. **Real Safari** (macOS, iOS) for `ping`, SMIL while the tab is backgrounded, and iCloud Private Relay.
3. **bfcache restore** and background-tab timers (SMIL pauses in some engines when hidden: marks then arrive late,
   which the server clock treats as a heartbeat, never as extra dwell).
4. Lighthouse mobile before/after on the BV homepage.
