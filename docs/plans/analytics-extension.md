# Analytics extension — design v2 (reviewed)

First-party, cookieless web analytics for Squilla that ships **zero JavaScript
to the public site**. Everything is measured on the server from HTTP requests,
optionally confirmed by a CSS beacon (still no JS). The admin dashboard is a
normal extension micro-frontend and may use JS freely.

v1 was reviewed by two adversarial reviewers (kernel/storage and
accuracy/privacy). This version incorporates their findings; the "Decisions"
section records why.

---

## 0. Decisions from review

| Topic | Decision |
| --- | --- |
| Event transport | Plain `Publish` leaks to every `SubscribeAll` listener (sdui SSE → every admin browser, email-manager → 2 DB queries per event). Use a new **explicit-only** publish that skips wildcard listeners. |
| Raw IP exposure | Only plugins declaring capability **`http:observe`** may subscribe to `http.requests`. |
| Client IP | Kernel resolves one trusted IP (`TRUSTED_PROXIES`, `CLIENT_IP_HEADER`). Behind Traefik `c.IP()` is the proxy today — this also fixes login rate limiting. |
| Plugin SQL | `DataExec` is internal-only and `DataQuery` can't aggregate. Add generic **`DataCall`** — call an extension-owned SQL function declared in `data_owned_functions`. All complex SQL lives in the extension's migrations. |
| Stale subscriptions | Plugin manager must unsubscribe on stop (generic bug fix). |
| Salt | Daily salt **in memory only**, rotated at site-timezone midnight. Never persisted (backups would allow re-identification). Restart = visitors split that day (accepted). |
| Timezone | Extension setting `timezone` (IANA, default `UTC`); days and salt rotation use it. |
| Unique visitors | Daily hash ⇒ multi-day "visitors" = sum of daily uniques. Labelled "Visitors (est.)" with a tooltip. |
| Bounce / duration | Renamed "Single-page visits"; duration shown only as "Median visit length (multi-page visits)". No time-on-page. |
| Bots | Classified into categories and kept as **daily counts** (not raw rows): search, ai_crawler, ai_search, ai_assistant (user-triggered), link_preview ("Shares by app"), seo_tool, monitor, http_client, headless, probe, other. |
| Prefetch | `Sec-Purpose`/`Purpose: prefetch` hits stored with `is_prefetch`; they count as pageviews only when confirmed by a beacon (enhanced mode). |
| 304s | Count as pageviews (HTML revalidation has no body). |
| Query strings | Never stored. Allowlisted campaign params extracted; click IDs stored as booleans only. |
| Outbound / downloads | First-party tracked links **`/go/<slug>`** (stored destinations only → no open redirect). Downloads = GET of configured extensions served by the origin. |
| Conversions | Goals match on observed requests, e.g. `POST /forms/submit/*` with 2xx — attributed to the visit/source with no extra hooks. |
| Storage | Raw `analytics_events` (BRIN on ts), additive daily rollups rebuilt idempotently, bot daily counts, no sessions table (session_id column), no partitioning. |
| GPC | `Sec-GPC: 1` ⇒ counted in aggregate only (no visitor/session id). |

---

## 1. Kernel changes (generic, analytics-agnostic)

### 1.1 Event bus — `internal/events/bus.go`
```go
// HasExplicitHandlers reports handlers registered for exactly this action
// via Subscribe (ignores SubscribeAll / Result / Err handlers).
func (b *EventBus) HasExplicitHandlers(action string) bool
// PublishExplicitSync calls only the handlers registered for exactly this
// action (Subscribe), synchronously, in registration order. Wildcard
// listeners never see the event.
func (b *EventBus) PublishExplicitSync(action string, payload Payload)
```

### 1.2 Plugin manager — `internal/cms/plugin_manager.go`
- Keep the `UnsubscribeFunc`s per running plugin; call them on stop.
- Subscribing to `http.requests` requires the plugin's extension to declare capability `http:observe`; otherwise log a warning and skip that subscription.
- Give plugin `HandleEvent` calls a deadline (60s — synchronous email.send may wait on SMTP) so a hung plugin can't leak goroutines.

### 1.3 Trusted client IP — `internal/config`, `cmd/squilla/main.go`
- `TRUSTED_PROXIES` (comma-separated CIDRs/IPs; default: loopback + private ranges `127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,::1/128,fc00::/7`).
- `CLIENT_IP_HEADER` (default `X-Forwarded-For`; may be `CF-Connecting-IP` or `X-Real-IP`; empty disables proxy handling).
- Configure Fiber `ProxyHeader`, `EnableTrustedProxyCheck`, `TrustedProxies`, `EnableIPValidation`.
- Helper `httpobs.ClientIP(c)`: when the peer is trusted and the header is XFF, walk right→left skipping trusted proxies; else use the peer address.

### 1.4 Request observer — new `internal/httpobs`
Mounted right after `logging.RequestID()`. Analytics is never mentioned.
- Per request (only when `bus.HasExplicitHandlers("http.requests")`), after `c.Next()`, build a `Record`; **copy every string** (fasthttp buffers are reused); bytes from `Response().Header.ContentLength()` (never `Body()`); status from the returned error (`*fiber.Error` code, else 500) when err != nil; skip `text/event-stream` and `/admin/api/events`; truncate UA 512, referer 1024, path 2048, query 2048.
- Non-blocking send to a bounded channel (8192); drops counted atomically.
- One flusher goroutine: every 2s or 500 records → `bus.PublishExplicitSync("http.requests", Payload{"records": [...], "dropped": n})`. One batch in flight. Explicit `Close()` drains + flushes; called in `main.go` after `ShutdownWithTimeout`, before plugins stop.

Record JSON (the contract with consumers):
```json
{
  "ts": "2026-10-23T08:15:30.123456789Z",
  "method": "GET",
  "host": "beyondvietnam.com",
  "path": "/en/experiences/old-quarter",
  "query": "utm_source=ig&fbclid=…",
  "status": 200,
  "duration_ms": 12,
  "content_type": "text/html; charset=utf-8",
  "bytes": 18234,
  "ip": "203.0.113.7",
  "user_agent": "Mozilla/5.0 …",
  "referer": "https://www.google.com/",
  "headers": { "accept": "…", "accept-language": "en-GB,en;q=0.9", "sec-fetch-mode": "navigate", "...": "..." },
  "has_session": false,
  "user_id": 0,
  "node_id": 42,
  "node_type": "experience",
  "language": "en",
  "request_id": "a1b2c3d4e5f60708"
}
```
`headers` is an allowlist (lower-case keys, only when present): `accept`, `accept-language`, `sec-fetch-mode`, `sec-fetch-dest`, `sec-fetch-site`, `sec-fetch-user`, `sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`, `sec-purpose`, `purpose`, `sec-gpc`, `dnt`, `upgrade-insecure-requests`, and `cf-ipcountry` **only when `CLIENT_IP_HEADER` is `CF-Connecting-IP`**.
`user_id` comes from `c.Locals("user")` when present (the public handler stores the resolved session user there). `node_id`/`node_type`/`language` come from `c.Locals("squilla.node_id"|"squilla.node_type"|"squilla.language")` set by the public handler when it renders a node (0/"" otherwise).

### 1.5 `DataCall` — CoreAPI
```go
// DataCall runs an extension-owned set-returning SQL function:
//   SELECT * FROM "<fn>"($1, $2, …)
// fn must be listed in the caller's manifest data_owned_functions.
// Returns rows as maps (column → value). Statement timeout 30s.
DataCall(ctx context.Context, fn string, args ...any) ([]map[string]any, error)
```
- Capability **`data:call`**. Manifest field `data_owned_functions: []string`. Function names must match `^[a-z_][a-z0-9_]*$`.
- gRPC: args and rows are JSON-encoded (`bytes args_json`, `bytes rows_json`); the server side converts whole-number float64 args to int64.
- Value types: SQL functions used through DataCall return only `text`, `bigint`/`int`, `double precision`, `boolean`, `timestamptz`, `date` (as text preferred), `jsonb`. jsonb columns come back as parsed JSON (not strings).
- Functions returning `void` may be declared `RETURNS TABLE(ok boolean)` or similar — DataCall always expects a row set (an empty slice is fine).

---

## 2. Extension `extensions/analytics/`

Manifest (key parts):
```json
{
  "slug": "analytics", "name": "Analytics", "version": "1.0.0",
  "capabilities": ["data:read","data:write","data:delete","data:call","http:observe","log:write","settings:read"],
  "data_owned_tables": ["analytics_events","analytics_daily","analytics_bots_daily","analytics_goals","analytics_links","analytics_config"],
  "data_owned_functions": ["analytics_ingest", "analytics_ingest_bots", "analytics_confirm", "analytics_rollup", "analytics_purge", "analytics_summary", "analytics_timeseries", "analytics_breakdown", "analytics_realtime", "analytics_heatmap", "analytics_bots", "analytics_goal_stats", "analytics_export_events"],
  "plugins": [{ "binary": "bin/analytics", "events": [] }],
  "public_routes": [{ "method": "GET", "path": "/go/*" }, { "method": "GET", "path": "/_s/*" }]
}
```
(The function list is owned by the backend implementation; keep it in sync with migrations.)

### 2.1 Ingest pipeline (plugin, in memory → batched `analytics_ingest(jsonb)`)
1. **Scope**: ignore `/admin`, `/api`, `/mcp`, `/_s/`, theme/extension assets (`/themes/`, `/extensions/`, `/admin/`, `/media/cache/`, static file extensions css/js/map/png/jpg/jpeg/webp/avif/gif/svg/ico/woff/woff2/ttf/txt/xml except configured downloads), user-configured exclude globs, requests with `user_id>0` (setting `exclude_logged_in`, default true).
2. **Kind**:
   - `pageview`: GET, status 200–299 with `text/html`, or 304 with `sec-fetch-dest: document` / Accept containing `text/html`.
   - `not_found`: GET 404 HTML (probe paths → bot category `probe`, not stored as event).
   - `download`: GET 200/206/304 of path with a configured download extension (default pdf, zip, docx, xlsx, pptx, gpx, kml, epub, mp3, mp4).
   - `outbound`: recorded by the `/go/<slug>` handler itself.
   - `goal`: any record matching a `request` goal (e.g. POST `/forms/submit/*`, 2xx).
3. **Bot classification** (before anything else; bots → daily counts only via `analytics_ingest_bots`): UA lists (embedded, updatable Go data file), request-shape and header-consistency heuristics (HEAD; modern browser UA without `sec-fetch-*`; Chromium without `sec-ch-ua` over HTTPS; navigation with `accept: */*`; no `accept-language`), probe paths, per-visitor rate (> 60 pageviews/min). Categories listed in §0.
4. **Visitor**: `sha256(salt_today || host || ip_norm || ua || primary_lang)` → first 16 hex chars; `ip_norm` = IPv4 as-is, IPv6 /64 prefix. GPC → visitor_id NULL.
5. **Session**: in-memory map visitor → (session_id, last_ts, pageviews); 30 min idle (setting). session_id = random 16 hex. Entry flag on first pageview of a session.
6. **Enrichment**: referrer host (own hosts stripped), source (known map: google, bing, duckduckgo, yahoo, yandex, baidu, naver, ecosia, facebook, instagram, tiktok, youtube, x/twitter, linkedin, reddit, pinterest, whatsapp, telegram, zalo, tripadvisor, getyourguide, viator, klook, gmail, outlook, AI hosts…; plus in-app UA detection: Instagram, FBAN/FBAV, TikTok/musical_ly/BytedanceWebview, Line, Zalo), channel (`direct`, `organic_search`, `paid_search`, `organic_social`, `paid_social`, `ai`, `email`, `referral`, `campaign`), UTM (`utm_source/medium/campaign/content/term`, `ref`, `source`, `via`), click-id booleans (gclid/gbraid/wbraid → paid search; msclkid → paid search; ttclid → paid social; fbclid → social), UA → browser, os, device (`mobile|tablet|desktop`), primary language, country (`cf-ipcountry`, or optional MaxMind `.mmdb` file path setting).
7. **Path normalisation**: strip query, lowercase, collapse trailing slash (except `/`).

### 2.2 Enhanced mode (off by default) — zero-JS beacon
- `render.head` → `<style>` with combined media rules (3 width buckets × light/dark = 6 rules + print rule) on a 0×0 element injected via `render.body_end` (`<i class="sq-s" aria-hidden="true"></i>`).
- Beacon URL `<prefix>/b?w=s|m|l&c=l|d` and `<prefix>/b?print=1`, default prefix `/_s` (neutral naming); response: 1×1 GIF, `Cache-Control: no-store`.
- Handler correlates by visitor hash + Referer path within 60 s and calls `analytics_confirm`, setting `confirmed=true`, `viewport`, `color_scheme` (or `printed=true`).
- Settings UI must explain the ePrivacy implications.

### 2.3 Workers
- Flush buffer every 2s / 500 events; flush on `Shutdown()` (≤3s).
- Rollup: `analytics_rollup(day)` for today every 10 min, yesterday once after local midnight (+ on start).
- Purge: raw events older than `raw_retention_days` (default 90) daily.

### 2.4 Admin HTTP API — `/admin/api/ext/analytics/…`
Common query params: `from`, `to` (`YYYY-MM-DD`, inclusive, site timezone; default last 30 days), `compare` (`previous` | `year` | omitted), filters `f.<dim>=<value>` where dim ∈ `page, entry_page, source, channel, referrer, utm_source, utm_medium, utm_campaign, country, language, device, browser, os, page_type, goal`.
Unfiltered ranges older than raw retention read `analytics_daily`; filtered ranges read raw events.

| Method & path | Response |
| --- | --- |
| `GET summary` | `{ "range": {"from","to","tz"}, "current": Metrics, "previous": Metrics\|null, "sparklines": {"visitors": number[], "pageviews": number[], "visits": number[], "conversions": number[]} }` where `Metrics = {visitors, pageviews, visits, pages_per_visit, single_page_rate, median_visit_seconds, conversions, conversion_rate}` (rates 0–1, seconds integer or null) |
| `GET timeseries?interval=hour\|day\|week\|month` | `{ "interval", "points": [{"t": "2026-10-01" or "2026-10-01T08:00", "visitors", "pageviews", "visits", "conversions"}], "previous_points": same\|null }` |
| `GET breakdown/<dim>?limit=10&offset=0&sort=visitors` | `{ "dimension", "rows": [{"value", "label", "visitors", "pageviews", "visits", "conversions", "share"}], "total_rows" }` — dims: `page, entry_page, exit_page, source, channel, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term, country, language, device, browser, os, page_type, not_found, download, outbound, goal, viewport, color_scheme` |
| `GET realtime` | `{ "visitors_5m", "visitors_30m", "pageviews_30m", "per_minute": [{"t","pageviews"}] (30 items), "recent": [{"ts","path","source","country","device","kind"}] (≤20), "top_pages": [{"value","visitors"}] }` |
| `GET heatmap` | `{ "cells": [{"dow": 0..6 (Mon=0), "hour": 0..23, "pageviews", "visitors"}] }` (site tz) |
| `GET bots` | `{ "totals": [{"category","hits"}], "timeseries": [{"t","category","hits"}], "top": [{"category","name","hits"}] }` |
| `GET goals` / `POST goals` / `PUT goals/<id>` / `DELETE goals/<id>` | Goal: `{"id","name","kind":"pageview"\|"request"\|"link","path_pattern","method","link_slug","created_at"}` (glob `*`) |
| `GET goals/stats` | `{ "rows": [{"id","name","conversions","visitors","conversion_rate"}] }` |
| `GET links` / `POST links` / `PUT links/<id>` / `DELETE links/<id>` | Link: `{"id","slug","label","destination","created_at","clicks_30d"}`; public URL `/go/<slug>` |
| `GET export?dataset=summary\|timeseries\|breakdown\|events&format=csv\|json&dim=…&interval=…` | File download (`Content-Disposition: attachment`). `events` = raw rows with safe columns only |
| `GET settings` / `PUT settings` | `{"timezone","exclude_paths":[],"exclude_logged_in":true,"respect_gpc":true,"raw_retention_days":90,"session_timeout_minutes":30,"enhanced_mode":false,"beacon_prefix":"/_s","download_extensions":[],"own_hosts":[],"geoip_db_path":""}` |
| `GET status` | `{ "receiving": bool, "last_record_at", "records_today", "pageviews_today", "dropped_total", "bots_today", "enhanced_mode", "geoip": bool, "salt_rotates_at" }` |

Errors use `{"error": CODE, "message": text}`.
Admin route capabilities: `view_analytics` (all GETs), `manage_analytics` (writes, settings).

### 2.5 Dashboard (React micro-frontend, own SVG charts, no chart dependency)
Routes: `/` Overview, `/breakdown/:dim` full table, `/bots` Bots & AI, `/goals` Goals & links, `/settings` Settings & status.
- Filter bar: date range presets (Today, Yesterday, 7d, 30d, 90d, This month, Last month, 12 months, custom), compare toggle (previous period / year over year), active filter chips. All state in URL params.
- KPI tiles with sparkline + delta and "How we count" tooltip: Visitors (est.), Pageviews, Visits, Pages / visit, Single-page visits, Conversions & rate.
- Main time-series area/line chart (metric switch), with compare overlay, crosshair tooltip, interval switch.
- Breakdown cards with tabs and inline share bars, click-to-filter: Pages (top/entry/exit/page type), Sources (channels/sources/referrers/campaigns), Locations (countries/languages), Devices (device/browser/os), Conversions (goals/outbound/downloads), Not found.
- Realtime card (visitors now + 30-minute per-minute bars + recent feed), auto-refresh 15s.
- Hour-of-week heatmap.
- Export menu per card and global (CSV / JSON).
- Bots & AI page: category totals, stacked time series, top bots table, "Shares by app" card.
- Light and dark theme.

---

## 3. Known limits (document in the UI)
- CDN-cached HTML never reaches the origin. Keep HTML uncached at the CDN.
- bfcache back/forward navigations are invisible.
- Visitors are estimated (CGNAT, private relay, UA reduction).
- `DataQuery.Raw` is pasted into WHERE (pre-existing kernel issue; not fixed here).
- Single process: salt, sessions and rate counters live in one plugin process; multiple replicas would split visitors and visits.
- No GeoIP reader is bundled; country comes from `cf-ipcountry` only (Cloudflare mode). `geoip_db_path` is reserved.
- The manifest routes only `/_s/*`; a different `beacon_prefix` needs a reverse-proxy rewrite.
- Public routes (`/go/*`, `/_s/*`) mount at boot: restart once after first activation.
- Multi-day "median visit length" is daily medians weighted by multi-page visits.
