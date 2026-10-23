# Analytics

First-party, cookieless web analytics for Squilla. Everything is measured on
the server from the HTTP requests the site already handles. **No JavaScript
is sent to the public site.** An optional CSS beacon (still no JavaScript)
adds viewport and colour-scheme data.

The dashboard lives at **Admin → Analytics**: Overview, Bots & AI, Goals &
links, and Settings.

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
- **Global Privacy Control** (`Sec-GPC: 1`, setting *respect GPC*): these requests get no visitor or session ID and are counted in aggregate only. Each visit that starts a session counts as one visitor.
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
| Median visit length | Median of first-to-last pageview time, for multi-page visits only. Time on page is not measured. For multi-day ranges, this is the daily medians weighted by multi-page visits. |
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
| `enhanced_mode` | `false` | CSS beacon. See the next section. |
| `beacon_prefix` | `/_s` | The manifest routes only `/_s/*`. A different prefix needs a reverse-proxy rewrite to `/_s`. |
| `download_extensions` | pdf, zip, docx, xlsx, pptx, gpx, kml, epub, mp3, mp4 | |
| `own_hosts` | `[]` | Extra host names treated as internal referrers, such as a CDN or a second domain. |
| `geoip_db_path` | `""` | Reserved. No GeoIP reader is bundled. |

## Enhanced mode (CSS beacon)

When enabled, every rendered page gets:

- a `<style>` in `<head>` with seven media rules: three width buckets × light/dark, plus `print`
- a 1 px `<i class="sq-s">` before `</body>`

The browser fetches only the background image of the rule that matches,
`/_s/b?w=s|m|l&c=l|d` or `/_s/b?print=1`. The response is a 1×1 GIF with
`Cache-Control: no-store`. The beacon is matched to its pageview by visitor
ID and referrer path within 60 s. It marks the pageview `confirmed` and
records the viewport and colour scheme, or `printed`.

**ePrivacy note:** the beacon makes the visitor's browser send an extra
request whose only purpose is measurement. Under the ePrivacy Directive
(Art. 5(3)), some EU regulators may treat this as accessing the terminal
device. Check your legal basis before you enable it. Server-side
measurement without the beacon reads only requests the visitor already
made.

## Limits

- HTML cached by a CDN never reaches the origin. Keep HTML uncached at the CDN, or those views are not counted.
- Back/forward-cache navigations make no request and are invisible.
- Visitor numbers are estimates (see the table above).
- In-memory state (salt, sessions, rate counters) belongs to one process. Running several app replicas splits visitors and sessions.
- Bot detection is heuristic. Determined scrapers that copy a full browser header set are counted as people.
- The plugin subscribes to `render.head` and `render.body_end` even when enhanced mode is off, so each page render makes two quick, empty plugin calls.

## Storage

- `analytics_events`: raw rows, BRIN index on `ts` only
- `analytics_daily`: additive rollups keyed by `(day, dimension, value)`
- `analytics_bots_daily`
- `analytics_goals`
- `analytics_links`
- `analytics_config`

All aggregation SQL lives in `migrations/` as functions. The plugin calls
them through `DataCall`, and each one is listed in `data_owned_functions`.

## Development

```sh
go test ./extensions/analytics/...
# Optional end-to-end test against a disposable Postgres (runs migrations twice):
ANALYTICS_TEST_DATABASE_URL=postgres://user:pass@localhost:5432/db?sslmode=disable \
  go test -run TestPostgresEndToEnd ./extensions/analytics/...
```
