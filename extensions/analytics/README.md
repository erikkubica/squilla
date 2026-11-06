# Analytics

First-party, cookieless web analytics for Squilla. Everything is measured on
the server from the HTTP requests the site already handles. **No JavaScript
is sent to the public site.** Optional *in-page signals* (markup and CSS only,
see below) add time on page, section impressions, link clicks, form and FAQ
use, viewport and colour scheme.

The dashboard lives at **Admin → Analytics**: Overview, Why they leave,
Clicks & CTAs, Page insights (`/page?path=`), Bots & AI, Goals & links, and
Settings.

## Requirements

- The kernel's request observer (`http.requests` event). The extension
  declares `http:observe`, which is required to receive raw request data.
- **`TRUSTED_PROXIES` must be set correctly.** Visitors are recognised partly
  by IP address. Behind Traefik, Caddy, nginx or Cloudflare, the kernel needs
  to know which hops it can trust before it reads `X-Forwarded-For` (or
  `CF-Connecting-IP` when `CLIENT_IP_HEADER=CF-Connecting-IP`). If this is
  wrong, every visitor appears to have the proxy's IP. The visitor count then
  collapses towards one, and the per-visitor rate limit treats the whole site
  as a bot.
- Country data comes from Cloudflare's `cf-ipcountry` header. The kernel
  forwards it only when `CLIENT_IP_HEADER=CF-Connecting-IP`.
- The extension ships with `auto_activate: false`, so activate it under
  Extensions.

## What is measured

| Kind | Rule |
| --- | --- |
| Pageview | `GET` returning 2xx with an HTML content type, or a `304` for a document (`Sec-Fetch-Dest: document` or `Accept: text/html`). |
| Not found | `GET` 404 for an HTML page. Requests to known scanner paths count as bot `probe` hits instead. |
| Download | `GET` 200/206/304 for a file whose extension is listed in *download extensions*. Repeat requests within 30 s are counted once. |
| Outbound | A click on a tracked link `/go/<slug>`. The visitor is sent with a 302 to the destination stored in the database. |
| Goal | A pageview, request (for example `POST /forms/submit/*` with a 2xx/3xx response) or tracked-link click that matches a goal. |

Never counted: `/admin`, `/api`, `/mcp`, theme and extension assets,
`/media/cache`, static files (css, js, images, fonts), your *exclude paths*,
and signed-in users (unless that setting is turned off).

Server-only measurement also gives, without any signal: page→page edges
(from the next request's `Referer`), the form errors (`POST /forms/*` answered
4xx/5xx), server time per page, and an **exit reason** for every finished visit
(see *Exit reasons*).

Each visit records its source, channel (direct, organic/paid search,
organic/paid social, AI assistants, email, referral, campaign), referrer,
UTM parameters, entry and exit page, country, browser language, device,
browser and OS.

### Bots

Bots never become raw rows. They are stored only as **daily hit counts** by
category and name:

- Search engines
- AI crawlers (training)
- AI search
- AI assistants (fetches a user asked for, such as ChatGPT-User)
- Link previews, shown as "Shares by app": WhatsApp, Zalo, Telegram, iMessage, Facebook, Slack and others
- SEO tools
- Uptime monitors
- HTTP clients
- Headless browsers
- Vulnerability probes
- Other

Detection runs in this order:

1. User-agent lists in `cmd/plugin/bots_data.go`. To recognise a new agent, edit that file.
2. Probe paths.
3. Request-shape and header-consistency checks:
   - `HEAD` requests
   - no `Accept-Language`
   - `Accept: */*` on page loads
   - a modern browser user agent without `Sec-Fetch-*` (checked only after real browsers have been seen sending it)
   - Chromium without client hints
4. More than 60 pageviews per minute from one visitor.

## Privacy model

- **No cookies, no local storage, no fingerprinting scripts.**
- The visitor ID is the first 16 hex characters of `sha256(daily salt ‖ host ‖ IP ‖ user agent ‖ primary language)`.
  - IPv6 addresses are cut to their /64 prefix.
  - The salt is random, **kept only in memory**, and replaced at midnight in the site time zone. It is never written to the database, so an ID from yesterday cannot be recomputed, even from a backup.
  - A restart starts a new salt. Visitors on that day may be counted twice.
- IPs and user agents are never stored. The extension stores the derived browser, OS and device class instead.
- Query strings are never stored.
  - Only `utm_source`/`medium`/`campaign`/`content`/`term` (with `ref`, `source` and `via` as source fallbacks) are extracted.
  - Click IDs (`gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid`, `ttclid`) are stored only as *present yes/no*.
- **Global Privacy Control** (`Sec-GPC: 1`, setting *respect GPC*): these requests get no visitor or session ID and are counted in aggregate only. Each visit that starts a session counts as one visitor. They also receive no in-page signal markup at all.
- **Opt-out**: `/_s/optout` sets one cookie, `analytics_optout` (declared in the manifest as `observe_cookies` / `public_route_cookies`; the kernel only passes cookies that start with the extension's slug and never the session cookie). Opted-out browsers are not measured and get no signal markup.
- **Midnight carry-over**: the previous day's salt stays in memory for one session timeout, so a visit open at midnight is not cut in two. It is never written anywhere.
- Sessions exist only in memory. They end after 30 idle minutes (configurable).
- Raw events are deleted after the raw retention period (90 days by default). Daily rollups and bot counters are kept.
- Exports never include visitor or session IDs.

## How we count

| Metric | Definition |
| --- | --- |
| Visitors (est.) | Distinct visitor IDs per day, **summed across days**. The salt rotates daily, so one person on three days counts as three. CGNAT, iCloud Private Relay and user-agent reduction also blur the estimate. |
| Pageviews | Counted pageview events. Prefetches count only if a beacon confirms them in enhanced mode. |
| Visits | Sessions: a pageview after more than the session timeout of inactivity starts a new visit. |
| Pages / visit | Pageviews ÷ visits. |
| Single-page visits | Share of visits with exactly one pageview. This replaces "bounce rate". |
| Median visit length | Median of first-to-last pageview time, for multi-page visits only. For multi-day ranges, this is the daily medians weighted by multi-page visits. |
| Engaged visit | Two or more pages, a conversion, or (with signals) 10 s on the exit page or the end of the page reached. |
| Section impression | A section scrolled at least 60 % into view (scroll-driven animation entry range). Click-through = clicks ÷ impressions. |
| Time on page | With signals: the last stay mark received (10 s, 30 s, 1 min, 3 min) — a lower bound on the server's clock. Without: the gap to the next page in the visit. |
| Conversions | Goal events. *Conversion rate* = visits with at least one conversion ÷ visits. |

Acquisition (source, channel, UTM, click IDs) is taken from the first
pageview of a visit and copied onto every event of that visit.

Unfiltered reports read the daily rollups for completed days and raw events
for today. Filtered reports, hourly data, the heatmap and realtime read raw
events, so they only cover the raw retention window.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| `timezone` | `UTC` | IANA name. Sets day boundaries and salt rotation. Changing it rebuilds rollups for the raw retention window in the background. |
| `exclude_paths` | `[]` | Globs on the lower-cased path, where `*` matches anything, for example `/preview/*`. |
| `exclude_logged_in` | `true` | Ignore requests from signed-in users. |
| `respect_gpc` | `true` | See the Global Privacy Control item under Privacy model. |
| `raw_retention_days` | `90` | 1–3650. |
| `session_timeout_minutes` | `30` | 5–240. |
| `enhanced_mode` | `false` | In-page signals master switch. See the next section. |
| `signal_dwell`, `signal_sections`, `signal_clicks`, `signal_forms` | `true` | Which signals to send while `enhanced_mode` is on. |
| `beacon_prefix` | `/_s` | The manifest routes only `/_s/*`. A different prefix needs a reverse-proxy rewrite to `/_s`. |
| `download_extensions` | pdf, zip, docx, xlsx, pptx, gpx, kml, epub, mp3, mp4 | |
| `own_hosts` | `[]` | Extra host names treated as internal referrers, such as a CDN or a second domain. |
| `geoip_db_path` | `""` | Reserved. No GeoIP reader is bundled. |

## In-page signals (no JavaScript)

When `enhanced_mode` is on, the extension rewrites the final HTML of every
public page through the kernel's generic `render.transform` hook (capability
`render:transform`, 50 ms deadline, fail-open; previews are never rewritten).
It inserts attributes only — `data-sq-b` on each block's top-level elements,
`ping` on links — plus one `<style>` and one fixed, invisible 1 px container
before `</body>`. Nothing is render-blocking and nothing runs as a script.
Signed-in editors, Global Privacy Control, opted-out visitors, 404s and
excluded paths get the page unchanged.

| Signal | Trigger | Request |
| --- | --- | --- |
| Activation | SVG SMIL timer, 1 s after load | `GET /_s/b?p=<page id>` |
| Time on page | SMIL timers at 10 s, 30 s, 1 and 3 min | `GET /_s/t?p=&s=` |
| Section impression, end of page | scroll-driven animation → custom property → style query | `GET /_s/v?p=&k=<block>`, `/_s/e?p=` |
| Link click | the `ping` attribute | `POST /_s/c?p=&k=<block>` (destination from `Ping-To`) |
| Form focus, FAQ opened | `:has()` | `GET /_s/i?p=&k=&t=f\|d` |
| Viewport, colour scheme, print | `@media` | `GET /_s/m?p=&w=&c=` |

Every URL carries only a page number and a block key; the visit is recognised
on the server from the same daily hash and the `Referer` / `Ping-From` page.
Signals are deduplicated per page view, capped per visitor per minute, and a
signal that carries `Sec-Purpose` (prerender) is ignored. Signals that arrive
before their page's request is recorded (requests reach the plugin in batches,
about every 2 s) wait for it. A page shown from a cache (no document request)
is counted once from its activation when no request turns up within 10 seconds;
no views are created that way for 10 minutes after a plugin start or salt
rotation.
Page weight, measured on the Beyond Vietnam homepage (9 sections, 27 links): about
+5.4 KB raw and +1 KB gzip on the HTML document, no extra blocking request.
How each browser behaves is in [docs/browser-matrix.md](docs/browser-matrix.md).

**ePrivacy note:** the EDPB treats a request made only for measurement as
access to the visitor's device (Guidelines 2/2023, §47-51). The CNIL exempts
strictly anonymous audience measurement from consent when visitors are
informed and can opt out. This mode is built for that: add the privacy-notice
paragraph shown under Settings and link to `/_s/optout`. Other regulators may
differ; check yours before enabling it.

## Exit reasons

Every finished visit (idle for the session timeout) gets one reason, first
match wins: `converted`, `left_to_contact` (WhatsApp, Zalo, Messenger, tel,
mailto), `left_to_partner` (other outbound), `hit_error` (404 or a rejected
form last), `browsed_and_left` (two or more pages), `single_page` (one page,
no signals), then with signals `read_and_left` (≥ 60 s or end reached),
`skimmed` (≥ 10 s) and `quick_exit`. Flag `exit_ambiguous`: the last page may
have been prerendered without any request revealing it. These are heuristics.

## Limits

- HTML cached by a CDN never reaches the origin. Keep HTML uncached at the CDN, or those views are not counted.
- Back/forward-cache navigations make no request and are invisible.
- Visitor numbers are estimates (see the table above).
- In-memory state (salt, sessions, rate counters) belongs to one process. Running several app replicas splits visitors and sessions.
- Bot detection is heuristic. Determined scrapers that copy a full browser header set are counted as people.
- Firefox never sends `ping`, and uBlock Origin / Brave block it: outbound click-through is understated for those visitors. Internal clicks are still visible as page→page edges.
- Browsers without scroll-driven animations or style queries (Firefox today) send no section signals.
- With signals off, the plugin answers the kernel's `render.transform` call once, then is skipped for 30 s.

## Storage

- `analytics_events`: raw rows, BRIN index on `ts` only
- `analytics_daily`: additive rollups keyed by `(day, dimension, value)`
- `analytics_bots_daily`
- `analytics_goals`
- `analytics_links`
- `analytics_config`
- `analytics_interactions`: in-page signals and clicks, no visitor id, same retention as raw events
- `analytics_visits`: one row per finished session (random session id), kept 13 months
- `analytics_page_elements`: the last rendered blocks and links of each page

All aggregation SQL lives in `migrations/` as functions. The plugin calls
them through `DataCall`, and each one is listed in `data_owned_functions`.

## Development

```sh
go test ./extensions/analytics/...
# Browser matrix (Chromium, Chrome, Firefox, WebKit):
cd extensions/analytics/e2e && npm install && npm run fixture && npx playwright install chromium firefox webkit && npm test
# Optional end-to-end test against a disposable Postgres (runs migrations twice):
ANALYTICS_TEST_DATABASE_URL=postgres://user:pass@localhost:5432/db?sslmode=disable \
  go test -run TestPostgresEndToEnd ./extensions/analytics/...
```
