# Squilla Security

This document describes the **current** security posture: what's implemented, where, and how a kernel or extension developer is expected to use it. For threat-model history and the per-issue audit trail, see commits prefixed `feat(security):`, `feat(auth):`, `feat(secrets):`, and `feat(themes):`.

---

## 1. Defense in Depth Summary

| Layer | Mechanism | Where |
|---|---|---|
| Boot | Refuse to start with unsafe config | `internal/config/config.go::Validate` |
| Transport | TLS expected at edge (Coolify/proxy); HSTS + baseline security headers at app level; read/idle timeouts; per-route body limits | `cmd/squilla/{http_hardening,body_limits}.go` |
| Auth | Bcrypt passwords, hashed sessions, account lockout, rate limit | `internal/auth/` |
| Authorization (admin shell) | `admin_access` gate on `/admin/api/*` group + post-auth redirect + SPA shell redirect | `cmd/squilla/{main,static_routes}.go`, `internal/auth/page_handler.go` |
| Authorization (API) | Per-handler `CapabilityRequired` + capability guard wrapping `CoreAPI` + manifest-driven `admin_routes` on extension proxy | `internal/auth/`, `internal/coreapi/capability.go`, `internal/cms/extension_proxy.go` |
| Authorization (UI) | `CapabilityGuard` on SPA routes + capability-filtered nav, dashboard, boot manifest, manifests endpoint | `admin-ui/src/App.tsx`, `internal/sdui/{engine,engine_navigation,extension_visibility}.go` |
| CSRF | JSON-only mutations + Sec-Fetch-Site / Origin check on cookie-authed mutations | `internal/auth/csrf.go` |
| XSS | bluemonday sanitization at render (richtext fields + block-view `safeHTML`/`raw`); sandboxed, nosniff media serving; sandboxed admin previews | `internal/sanitize/richtext.go`, `internal/rendering/block_funcs.go`, `extensions/media-manager/cmd/plugin/upload_safety.go` |
| Secrets at rest | AES-256-GCM envelope on flagged settings, theme git tokens | `internal/secrets/` |
| Plugin trust | gRPC extensions are native code running as the app user — **not sandboxed**. Kernel narrows what they inherit (env allow-list, AutoMTLS, confined binary path, optional SHA-256 pins, event-capability gates); capabilities bound only their CoreAPI use | `pkg/plugin/`, `internal/cms/plugin_manager.go`, `internal/cms/plugin_process.go`, `internal/cms/plugin_verify.go` |
| Outbound HTTP | Scheme allowlist, private/special-range blocklist enforced at dial time, no proxy, redirects bounded | `internal/coreapi/impl_http.go` |
| Theme git | HTTPS-only, scheme allowlist, encrypted tokens, HMAC-validated webhook | `internal/cms/theme_*.go` |
| MCP | Bearer token (hashed), per-token rate limit, scope×class ACL, audit log | `internal/mcp/` |
| Logs | Structured slog with request-id correlation, no secret leakage | `internal/logging/` |

---

## 2. Production Boot Gates

`config.Load` normalises `APP_ENV` (trimmed, lowercased) and `Config.Validate` runs before the server starts. `APP_ENV` must be `development`, `production` or `test`; any other value (`prod`, `staging`, …) refuses to boot rather than silently running with development defaults. Unset `APP_ENV` means `development` (so `go run` works) and logs a loud startup warning. In `APP_ENV=production`, the boot fails fast on:

| Problem | Error | Remediation |
|---|---|---|
| Example placeholders (`change-me…`) in `MONITOR_BEARER_TOKEN`, `SQUILLA_SECRET_KEY` or `DB_PASSWORD` | `… is still the example placeholder` | Generate real secrets |
| `ADMIN_PASSWORD=admin123` | `ADMIN_PASSWORD is the development default` | Unset it (random password logged on first boot) or set a strong one |
| `CORS_ORIGINS` containing `*` or `null` | `CORS_ORIGINS contains "*"` | List explicit origins |
| Empty `SQUILLA_SECRET_KEY` | `SQUILLA_SECRET_KEY unset; secret-bearing settings cannot be encrypted` | Generate via `openssl rand -base64 32` |
| Wrong `SQUILLA_SECRET_KEY` length | `secrets init failed: SQUILLA_SECRET_KEY must be 32 raw bytes (base64-encoded): got N bytes, want 32` | Value must base64-decode to **exactly 32 bytes**. Coolify's `SERVICE_BASE64_<NAME>` produces only 24 bytes — override manually with `openssl rand -base64 32`. |
| Default DB password | `DB_PASSWORD is the project default; refusing to start` | Use Coolify magic vars or a real secret |
| `DB_SSLMODE=disable` on a non-internal hostname | `DB_SSLMODE=disable on a public host` | `require` or `verify-full` |
| Empty `CORS_ORIGINS` | `CORS_ORIGINS unset; admin would be open to any origin` | Set the public admin URL list |
| Empty `MONITOR_BEARER_TOKEN` | `MONITOR_BEARER_TOKEN unset; /api/v1/stats unprotected` | Generate via `openssl rand -hex 32` |

Coolify's `coolify-compose.yml` populates all of these via `SERVICE_*` magic variables on first deploy.

`SESSION_SECRET` is **deprecated and unused** — sessions are random server-side tokens whose SHA-256 is stored; nothing is signed with a secret. It is no longer required in production; existing env files that set it keep working.

The Postgres DSN quotes every value (libpq rules), so passwords containing spaces, quotes or `key=value` text cannot inject connection parameters.

---

## 2a. HTTP Server Hardening

- **Security headers** on every response (`cmd/squilla/http_hardening.go`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (the visual editor and previews frame same-origin pages), and `Strict-Transport-Security: max-age=31536000; includeSubDomains` when the request is secure (`IsSecureRequest`; set `TRUST_FORWARDED_PROTO=true` behind a TLS proxy). The admin shell HTML gets a `Content-Security-Policy-Report-Only` — **report-only** until verified in a browser against the inline import map, extension micro-frontends and the srcdoc preview iframes (which load `cdn.tailwindcss.com` and theme head assets). The public site gets no CSP (themes use inline scripts).
- **Timeouts**: `ReadTimeout` 30 s (header + body; extended per request to 30 min for authenticated upload routes and 5 min for `/mcp` and `/forms/submit/*`), `IdleTimeout` 120 s. `WriteTimeout` is deliberately 0: fasthttp applies it to the whole response write, which would cut the SSE stream (`/admin/api/events`) and large downloads.
- **Body limits** (`cmd/squilla/body_limits.go`): request bodies are streamed (`StreamRequestBody`, multipart pre-parsing disabled) and a first-in-chain middleware enforces a per-route cap before anything reads the body — 2 MB by default (`SQUILLA_MAX_BODY_MB`), 50 MB for theme/extension zip upload, `/admin/api/ext/*`, `/mcp` and `/forms/submit/*`, and a 2 GB transport backstop for `/api/uploads/*` (the uploads handler enforces each token's `max_bytes`). Oversized `Content-Length` → 413 without reading; oversized chunked bodies → 413 after at most cap+1 bytes; chunked bodies on the 50 MB multipart routes → 411. Any response that leaves a streamed body unread closes the connection. `/api/uploads/*` is mounted through a streaming net/http bridge, so presigned uploads go straight to disk instead of being buffered.
- **Errors**: a custom Fiber `ErrorHandler` never returns `err.Error()`: `*fiber.Error` keeps its status/message, anything else is logged with the request id and answered with the `api.Error` envelope (`INTERNAL_ERROR`, generic message) on API paths or a generic HTML page elsewhere. Panics are recovered with stack traces logged (never sent).
- **Request ids**: a client-supplied `X-Request-ID` is honoured only if ≤128 chars of `[A-Za-z0-9._:-]`; otherwise a fresh id is minted.
- **Admin SSE** (`/admin/api/events`): carries invalidation signals only — `ENTITY_CHANGED` {entity, op, id}, `SETTING_CHANGED` {key}, `NAV_STALE` — never event payloads; `NOTIFY` toasts carry only message/variant/title. Max 8 concurrent streams per user; streams close when shutdown starts.
- **Media fallback** (`/media` static, used only when no media provider is active): `/media/originals/*` is 404 (as in media-manager), `nosniff` everywhere, and `Content-Disposition: attachment` plus `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox` for anything that isn't raster image/video/audio/PDF (SVG included — the fallback downloads SVGs, where media-manager serves them inline under the same CSP).
- **Database**: pool capped at 25 open connections (5 min idle timeout) to leave headroom under Postgres' default `max_connections`; GORM logs SQL with bind parameters elided (`ParameterizedQueries`).

---

## 3. Authentication

### 3.1 Sessions
- 32-byte cryptographic random token, hex-encoded; only the SHA-256 hash stored (`token_hash` column).
- Cookie `squilla_session`: `HttpOnly=true`, `SameSite=Strict`, `Secure` when behind TLS (honors `X-Forwarded-Proto` when `TRUST_FORWARDED_PROTO=true`).
- Stored fields: `user_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`.
- Hourly cleanup loop (`SessionService.CleanExpired`) removes expired rows.
- File: `internal/auth/session_svc.go`.

### 3.2 Login
- Bcrypt verification (`bcrypt.DefaultCost=10`; configurable via `BCRYPT_COST` env).
- Constant-time password compare (bcrypt is constant-time by construction).
- Account lockout: 5 failures within 15 minutes lock the account for 15 minutes. ONE tracker is shared by `/auth/login` (JSON) and `/auth/login-page` (form), keyed by the lowercased email: `internal/auth/lockout.go`.
- Per-IP rate limiter: 10 attempts/minute (burst 10) on login; 3/hour on register and forgot-password; 10/hour on reset: `internal/auth/rate_limit.go`.
- Emails longer than 254 bytes and passwords longer than 1024 bytes are rejected before any lockout or DB work, on every login/register/forgot/reset handler.
- Memory bounds: a janitor (`auth.StartJanitor`, every 5 min, started from `main.go`) prunes idle limiter/lockout entries; the lockout map is capped at 50k keys and each per-IP limiter at 100k IPs (oldest/unlocked entries evicted first).
- Emails are matched case-insensitively (`LOWER(email) = lower(input)`) and stored lowercased on every write path (register, admin create/update, `PATCH /me`). No schema migration: pre-existing mixed-case rows still match.
- File: `internal/auth/auth_handler.go`, `page_handler.go`.

### 3.3 Registration
- Public registration creates `member`-role users (not `editor`) since commit `76f6124`.
- Self-registration is gated by `setting.allow_registration=true` (default false in production seeds).

### 3.4 Password Reset
- Real flow (no longer a stub).
- Raw token generated, sent via email; only SHA-256 hash stored in `password_reset_tokens`.
- Tokens single-use: consumption is one conditional `UPDATE … WHERE used_at IS NULL AND expires_at > now` that must affect exactly one row, so concurrent replays can't both succeed. The new password is validated *before* the token is consumed.
- Timing/enumeration: forgot-password returns the same response immediately for every email; account lookup, token issue and the `user.password_reset_requested` publish run in the background.
- Link origin: the reset URL is built from the `site_url` setting (language-agnostic row → default-language row → any row), then `SQUILLA_PUBLIC_URL` / `SITE_URL`. In production the request `Host` / `X-Forwarded-Host` is never used and loopback values (the seeded `http://localhost:8099`) are ignored; when nothing resolves the email is not sent and an error is logged (the client still gets the generic success message). Development keeps the Host fallback.
- The reset event (and any payload carrying `reset_token` / `reset_url` / passwords / tokens) is never forwarded to the admin SSE stream (`internal/sdui/broadcaster.go`).
- Hourly cleanup of expired/used tokens.
- File: `internal/auth/password_reset.go`.
- **Graceful degradation:** when no `email.provider` plugin is active, the email-based reset flow is unavailable. The handler short-circuits with a clear error rather than panicking. For recovery, operators can use the `squilla reset-password <email> <new-password>` CLI subcommand which writes directly to the DB without going through the dispatcher (commit `c723983`).

### 3.5 User Management Boundaries
- `UserHandler.Update` refuses `role_id` changes when `target_user_id == current_user.id` (commit `76f6124`).
- `manage_users` is no longer equivalent to admin: a role may be assigned (create/update) only when its capabilities are a subset of the caller's (`canAssignRole` in `internal/auth/role_assign.go`; the `*` wildcard or `manage_roles` pass outright). Node access is compared per type (access level and scope). A caller also cannot change the email/password/role of, or delete, a user whose *current* role exceeds their own.
- `GET /admin/api/users/:id` requires `manage_users` or self.
- `PATCH /admin/api/users/:id` refuses email and password changes for one's own account (`USE_ME_ENDPOINT`) — use `PATCH /me` / `POST /me/password`, which require the current password.
- Admin create/update apply the same email and password policy as `/me` (8–72 bytes). Any admin-set password deletes all of the target's sessions and voids their reset tokens; an email change voids reset tokens.
- Self-registration never uses a `default_registration_role` that grants `admin_access` or `*` — it falls back to `member`.
- `RoleHandler.Update` requires `manage_roles` capability and refuses to mutate `is_system=true` rows.

### 3.6 Bearer Token (`/api/v1/stats`)
- Constant-time compare via `crypto/subtle.ConstantTimeCompare`.
- Token from `MONITOR_BEARER_TOKEN` env.

---

## 4. Authorization

The admin surface is gated by **five concentric checks**. Each layer assumes the layers above it ran but never trusts that they did.

```
post-auth redirect ──► /admin/* SPA gate ──► /admin/api group gate ─┐
                                                                     │
                                  per-handler CapabilityRequired ◄───┤
                                                                     │
                            CoreAPI capability guard (plugin/Tengo) ◄┘
```

| Layer | Where | Gate |
|---|---|---|
| **Post-auth redirect** | `internal/auth/page_handler.go::postAuthRedirectPath` | `admin_access` ➜ `/admin/dashboard`, otherwise `/`. Stops a fresh registration from landing in admin chrome. |
| **SPA shell** | `cmd/squilla/static_routes.go::registerAdminSPA` | If a session exists and lacks `admin_access`, redirect `/admin/*` to `/`. Anonymous users still get the bundle so the SPA's own login flow can render. |
| **Admin API group** | `cmd/squilla/main.go` (`adminAPI` group) | `auth.AuthRequired` ➜ `auth.CapabilityRequired("admin_access")` ➜ `auth.JSONOnlyMutations`. Order matters: a non-admin session 403s before any handler runs. |
| **Per-handler middleware** | each `*_handler.go` `RegisterRoutes` | `auth.CapabilityRequired("manage_users")` etc. on writes; reads are typically open to admin_access (see 4.4). |
| **CoreAPI capability guard** | `internal/coreapi/capability.go` | Plugin/Tengo callers — every method wrapped in `capabilityGuard.<Method>` checks `caller.Capabilities[cap]`. The unguarded `coreAPI` is internal-only. |

Wired in `cmd/squilla/main.go`:
```go
guardedAPI := coreapi.NewCapabilityGuard(coreAPI)              // Plugin/Tengo path
adminAPI := app.Group("/admin/api",
    auth.AuthRequired(sessionSvc),
    auth.CapabilityRequired("admin_access"),
    auth.JSONOnlyMutations(),
)
```

### 4.1 Capability Registry

Capabilities are not hardcoded. The registry is built dynamically and the role-editor fetches it from `/admin/api/capabilities`.

| Source tag | Origin |
|---|---|
| `kernel` | `auth.kernelCapabilities()` — `admin_access`, `manage_users`, `manage_roles`, `manage_settings`, `manage_menus`, `manage_layouts`. Always present. |
| `extension:<slug>` | Extension manifest `admin_ui.capabilities` — registered on `extension.activated`, dropped on `extension.deactivated`. |
| `theme:<slug>` | `theme.json` `admin_ui.capabilities` — registered on `theme.activated`. |

Pieces:
- `internal/auth/capability_registry.go` — `Capability{Key,Label,Description,Source}` + `Registry{Register,UnregisterBySource,List,Has}`.
- `internal/auth/capability_handler.go` — `GET /admin/api/capabilities`.
- `internal/cms/extension_capability_bridge.go` / `theme_capability_bridge.go` — subscribe + replay on boot.
- `admin-ui/src/pages/role-editor.tsx` — fetches via `getCapabilities()`, groups by source.

**Wildcard `*`.** `auth.HasCapability` and `sdui.hasNavCap` treat `caps["*"] == true` as a blanket grant for every boolean capability **except** `admin_access`. The seeded admin role has `"*":true` so it auto-receives every extension-contributed capability without a re-seed. `admin_access` is intentionally excluded — a misconfigured wildcard on a non-admin role must not silently bypass the shell gate.

### 4.2 Read vs. Write on Resources

Pattern across kernel handlers: GETs are open to admin_access; mutations gate on a specific manage cap. Reads coupled to writes force role authors to grant write access just to populate a dropdown — exactly the bug we hit when wiring `manage_email_rules`.

| Resource | GET gate | Write gate |
|---|---|---|
| Roles, languages, taxonomies, terms, node types, layouts, menus, templates, block types, layout blocks | `admin_access` | manage_* specific |
| Settings (with secrets redacted server-side) | `admin_access` | `manage_settings` |
| Users (PII) | `manage_users` | `manage_users` |
| Email logs (message bodies) | `view_email_logs` | `manage_email` |

Listing role/menu/layout names is not a meaningful information disclosure — any admin_access user already sees this when editing their own role.

### 4.3 Extension Admin Routes (per-route capabilities at the proxy)

Extension API calls flow through `/admin/api/ext/{slug}/*` to the gRPC plugin's `HandleHTTPRequest`. The kernel proxies but **plugins do not implement RBAC** — the kernel must enforce. Two layers:

1. **Group gate**: `auth.CapabilityRequired("admin_access")` on the catch-all proxy route.
2. **Per-route gate**: manifest-declared `admin_routes` enforced inside `ExtensionProxy.handleRequest` before the request reaches the plugin.

The same plugin routes are reachable a second way: MCP tools an extension declares under `mcp_tools` (`ext.<slug>.<name>`, see `internal/mcp/tools_extensions.go`). That path applies **both** gates plus the token scope: the MCP token must cover the tool's class, and the token owner's role must hold the `admin_routes` capability for the tool's method and path (`cms.RequiredAdminCapability`, the function the proxy itself uses). A tool on a mutating method can never be class `read`. Tool definitions come only from the manifest the kernel registered for the active extension — `extension.activated` is treated as a trigger, not as data, because any extension with `events:emit` can publish it. Path arguments are limited to one plain segment so a caller cannot steer a tool to a different route.

Manifest schema (`extensions/<slug>/extension.json`):
```json
"admin_routes": [
  { "method": "*",   "path": "/forms",         "required_capability": "manage_forms" },
  { "method": "*",   "path": "/forms/**",      "required_capability": "manage_forms" },
  { "method": "GET", "path": "/logs",          "required_capability": "view_email_logs" },
  { "method": "GET", "path": "/logs/**",       "required_capability": "view_email_logs" }
]
```

| Pattern | Matches |
|---|---|
| `*` | one path segment (no slashes) |
| `**` | any number of segments (including zero) |
| `method: "*"` (or empty) | any HTTP method |

**First-rule-wins.** Most specific patterns first. The request path is normalised before matching (`path.Clean`: trailing slash, `//`, `.`/`..` collapsed) and the same normalised path is forwarded to the plugin, so `/settings/` can't dodge a `/settings` rule. Plugins must route on exactly that path: re-stripping an `/admin/api/ext/<slug>` prefix inside the plugin (forms used to) lets `…/ext/forms/admin/api/ext/forms/submissions` miss every rule yet reach the handler. **Unmatched requests:** `GET`/`HEAD` need only `admin_access`; every other method needs `manage_settings`. A rule with `"required_capability": ""` explicitly opens a route to any `admin_access` user (media-manager uses this for upload/browse/edit so Authors keep their media workflow; its `/optimizer/**` endpoints require `manage_settings`).

The proxy also strips client-supplied `Cookie`, `Authorization`, `X-Forwarded-For`/`X-Real-IP` and **every `X-User-*`** request header before the kernel sets its own `X-User-Email`/`X-User-Name`, and filters plugin *response* headers: `Set-Cookie` only for a cookie in the extension's own namespace (`<slug_with_underscores>_*`, never a reserved/session cookie), never `Strict-Transport-Security`, `Access-Control-*` or hop-by-hop headers, and a plugin `Content-Security-Policy` is *added* next to any kernel policy (browsers enforce all of them), so it can tighten — media-manager's sandbox CSP — but never loosen. The same filters apply to `public_routes` (`internal/cms/public_proxy.go`). Response bodies are never logged. Each proxied call carries a 60 s deadline.

Pieces:
- `internal/cms/extension_route_matcher.go` — `compileGlob`, `AdminRouteRule`, `AdminRouteRegistry` (sync.RWMutex, per-slug rule lists).
- `internal/cms/extension_routes_bridge.go` — extension.activated/deactivated hooks + ReplayActive.
- `internal/cms/extension_proxy.go::handleRequest` — `registry.FirstMatch(slug, method, path)` ➜ 403 if cap missing.

This was the gap behind: "user has admin_access + manage_forms, opens form editor, then has manage_forms revoked — still saves the form". The SPA's stale capability cache was incidental; the real hole was the proxy.

### 4.4 SPA Capability Patterns

Server-side gates are the only thing that matters for security. SPA gates are UX — they stop the user from rendering chrome they can't use, which prevents both confusion and a minor information disclosure (page exists, page is named X).

#### `CapabilityGuard` route wrapper (`admin-ui/src/App.tsx`)
```tsx
<Route path="/admin/security/users" element={
  <ProtectedRoute>
    <CapabilityGuard requires="manage_users">
      <SduiUsersPage />
    </CapabilityGuard>
  </ProtectedRoute>
} />
```
Single string or array (any-of). For all-of semantics, nest two guards.

#### Per-section default capability for nav items (`internal/sdui/engine_navigation.go::extNavPasses`)
When an extension manifest doesn't declare `required_capability`, the kernel applies a sensible default by `section`:

| Section | Default cap |
|---|---|
| `settings`, `development` | `manage_settings` |
| `design` | `manage_layouts` |
| `content` | any write node access |
| `settings_menu` / `site_settings_menu` items | `manage_settings` |
| top-level (no section) | open |

Extensions opt out with `"required_capability": ""` explicitly. Without these defaults, every extension that forgot to declare one was silently visible to all admin_access users.

#### Group menus: child-driven visibility
A group menu is shown when **at least one child is visible**, regardless of the parent's own `required_capability`. Children inherit the parent's cap when they don't declare their own. This is what lets `manage_email` cover the email parent menu while `view_email_logs` exposes only the Logs row to a log-auditor role.

#### Boot manifest extension filter (`internal/sdui/extension_visibility.go::IsExtensionVisible`)

An extension is included in the boot manifest *and* in `/admin/api/extensions/manifests` when **any** of:

1. `provides` (top-level) is non-empty — provider extensions like `smtp-provider` (provides `email.provider`) need to be discoverable to consumers regardless of menu access.
2. `admin_ui.field_types` non-empty — the page editor needs the bundle to render the field component.
3. `admin_ui.slots` non-empty — cross-extension UI composition (e.g. SMTP fills email-manager's `email-settings` slot).
4. `admin_ui.menu` is a leaf and its required_capability passes, OR is a group with at least one visible child.
5. `admin_ui.settings_menu` / `site_settings_menu` has at least one item passing.

The `manifests` endpoint additionally always includes backend-only extensions (no `admin_ui` block at all) so consumers can iterate `provides` for runtime discovery.

#### Dashboard data scoping (`internal/sdui/engine.go::dashboardLayout`)
- Counts and recent-content / draft listings scoped to `readableNodeTypeSet(user)` so a user with read-only on `page` doesn't see draft titles for `testimonial`, and to the per-type `own` scope (`ownScopeFilter`, same rule as the node list) so an Author's totals and recent items cover only their own nodes.
- "Users" stat card rendered only when `manage_users`.
- Quick action shortcuts filtered per their target's capability (Pages: write on page; Users: manage_users; Themes / Extensions / Settings: manage_settings).
- "Create New Page" CTA hidden unless write access on `page`.
- Per-user dashboards skip the layout cache so one viewer's render can't leak to another.

### 4.5 Per-Table ACL on Extension Data
- `data:read`, `data:write`, `data:delete`, `data:exec` capabilities are checked against the manifest's `data_owned_tables` array.
- An extension declaring ownership over `forms`, `form_submissions` cannot read or write any other extension's tables.

### 4.6 Per-Node-Type Access
- `roles.capabilities` JSONB stores `nodes.<type>.access` and `nodes.<type>.scope` (`read`/`write`/`delete` × `all`/`own`).
- `default_node_access` covers types not explicitly listed.
- `auth.GetNodeAccess(user, nodeType)` → `NodeAccess.CanRead(node)`, `CanWrite(node)`.
- Node `Search` honors the access filter.

### 4.7 Authoring an Extension's Capability Surface (cookbook)

For an extension introducing admin pages:

1. **Declare capabilities** in `extension.json::admin_ui.capabilities` — one per logical area users can be assigned independently. Default to `manage_<area>`; add `view_<area>` only when the data is sensitive (logs, PII).
2. **Gate menu items** with `required_capability` — set the most common cap on the parent, override per child where needed.
3. **Gate API routes** with `admin_routes` — separate read from write where it matters; use `**` glob to cover sub-paths.
4. **Don't gate group parents** — let child visibility drive group visibility so partial-privilege roles still see the items they're entitled to.
5. **Test with a custom role.** Create a role with only the new capabilities (no `manage_settings`, no wildcard) and walk every page + every mutation. The kernel won't tell you about a missing gate — only the test will.

### 4.8 Known Limitations / Future Work

- **Bool-flag capabilities don't model referenced reads.** Listing roles for a "send to role X" picker reveals role names; listing users for an "assign to" picker would reveal user PII. Today's mitigation is "list endpoints stay open to admin_access; sensitive resources require their specific cap" — but it's coarse. A long-term solution is per-resource `{access: read|write|delete, scope: all|own|...}` mirroring the existing `nodes` JSONB shape, with cross-resource follow checks (listing roles also checks `users:read` before exposing member counts). Tracked as a refactor.
- **SPA capability cache is per-session.** When a role is edited, the affected user's open SPA tabs continue using stale capabilities until they reload. Server-side gates (every API call, every proxy request) re-evaluate every time, so this is a UX issue, not a security one — but a future SSE event (`role.updated`) propagating to the boot manifest would close the gap.

---

## 5. CSRF Protection

`auth.JSONOnlyMutations()` guards POST/PUT/PATCH/DELETE on `/admin/api/*` (and `PATCH /me`, `POST /me/password`):

- **Origin check** (cookie-authenticated requests only): when the browser sends `Sec-Fetch-Site`, it must be `same-origin` or `none` — `same-site` / `cross-site` pass only if `Origin` is in `CORS_ORIGINS`. Without `Sec-Fetch-Site`, a present `Origin` must match the request host or `CORS_ORIGINS`. Requests with neither header (curl, server-side clients) and requests without a session cookie are unaffected. This closes the gap where a same-*site* sibling origin (another subdomain) could forge multipart uploads, which skip the CORS preflight and are allowed for theme/extension upload and `/admin/api/ext/*`.
- **Content type**: the body must be `application/json` (multipart only on the upload paths), so classic cross-origin form posts can't reach handlers.
- `CORS_ORIGINS` is a strict allowlist (admin endpoints are credentialed) and the session cookie is `SameSite=Strict`.

Token-based CSRF middleware is **not** implemented; fetch metadata + content type + SameSite=Strict + strict CORS cover the admin API.

Public extension routes (`extension.json` `public_routes`) are not behind `JSONOnlyMutations` — extensions handling forms must include their own CAPTCHA and/or honeypot defenses (the `forms` extension includes both by default).

---

## 6. XSS Defense

### 6.1 Rich text and block views

`internal/sanitize/richtext.go` runs a bluemonday policy (UGC, minus its global `id`) **at render time**:

- Strips: `<script>`, `<iframe>`, `<form>`, `<input>`, `<style>`, event-handler attributes, `style` attributes, `javascript:`/`data:` URLs.
- Allows: prose markup (headings, lists, tables, `<br>`, `<em>`, `<strong>`, `<span>`, …), `class` on all elements, `<a>` with `rel`/`target`, `<img>` with `loading`/`decoding`, `id` **only on `h1`–`h6`** and only as a plain slug (`^[A-Za-z][A-Za-z0-9_-]{0,63}$`) so authored content can't clobber DOM globals.
- Every link gets `rel="nofollow noreferrer"`; `target="_blank"` links also get `noopener`.

Render-time (not write-time) sanitization means policy can tighten without rewriting stored data.

Where it is applied:

| Value | Treatment |
|---|---|
| Field typed `richtext` (incl. inside `object`/`array` rows) | Sanitised, then handed to the template as `template.HTML`. |
| `{{ safeHTML x }}` / `{{ raw x }}` **in a block view** (`blocks/*/view.html`, DB block templates, block preview) | Plain strings (textarea, string, select, … fields) go through the same sanitiser; `template.HTML` values (sanitised richtext, `event` output) pass through unchanged. `internal/rendering/block_funcs.go::BlockFuncOverrides`. |
| `{{ safeURL x }}` in a block view | Marked trusted, except `javascript:`, `vbscript:` and non-raster `data:` URLs, which become `#`. |
| Anything else in a block view | Go `html/template` auto-escaping. |
| `safeHTML` / `raw` **in layouts and partials** | Raw (unsanitised). Layouts use it to emit admin-only settings (`custom_head_code`, `custom_footer_code`, `analytics_code`). Theme authors must not pipe node/block field values through `safeHTML` in a layout. |

`seq` is capped at 10,000 items. Block template errors on public pages render as `<!-- block error: <slug> -->`; the error text is logged, not sent.

`POST /admin/api/block-types/preview` executes caller-supplied template source only for `manage_layouts` (the capability that can save a block template). Other admin users may preview a stored block type by `block_type_id`, or request only the theme chrome. Previews run with the block-view helpers above, a 5 s deadline (checked on every write and `seq` call) and a 2 MiB output cap.

### 6.2 Admin previews

Admin iframes that render stored or theme HTML are sandboxed:

- Email previews (logs, template editor, base layout) — `sandbox="allow-same-origin"` without `allow-scripts`: the parent writes the document, scripts and inline handlers in stored email HTML never run.
- Block-type editor and forms preview — `sandbox="allow-scripts"` without `allow-same-origin` (opaque origin; Tailwind CDN still runs, the admin session is unreachable). The forms preview renders through the forms extension's own renderer (`POST /admin/api/ext/forms/preview`) and asks the kernel preview endpoint only for the theme chrome.

### 6.3 Media uploads and serving (media-manager)

Media is served from the site origin, the same origin as `/admin`, so uploads are treated as hostile:

- **Upload validation** (`upload_safety.go::validateUpload`): the declared type must be allow-listed and the sniffed bytes must agree with it (HTML/XML bodies never pass; an `image/png` that sniffs as HTML is rejected). Images over 50 megapixels or 20,000 px per side are rejected before any decode.
- **Stored extension**: derived from the MIME type, or from the filename only if it is in a closed allow-list; otherwise `.bin`. `.html`, `.xhtml`, `.xml`, `.js`, … are never produced; `.svg` only for `image/svg+xml`.
- **SVG**: stays uploadable (logos) but is re-serialised through a strict allow-list sanitizer: no `<script>`, `<foreignObject>`, `<a>`, animation elements, event handlers, editor namespaces, DOCTYPE/entities, external or `javascript:` references (`href` may only be `#fragment`, or inline raster `data:` on `<image>`; CSS `url()` only `#fragment`/raster data). Invalid SVG is rejected.
- **Serving headers**: every media response carries `X-Content-Type-Options: nosniff`. SVGs carry `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, so they render in `<img>` but can't script when opened directly. Anything that is not a raster image, SVG, video, audio or PDF is served with `Content-Disposition: attachment` plus the same sandbox CSP.
- **Originals**: pre-optimisation backups under `media/originals/` (which may still carry EXIF/GPS) are never served by the public `/media/` or `/media/cache/` routes.
- **Decompression bombs / DoS**: every decode is preceded by an `image.DecodeConfig` dimension check; failed resizes/WebP conversions are negatively cached (bounded) so anonymous requests don't re-decode; cache generation uses a fixed set of striped locks taken only after the original is confirmed to exist.

### 6.4 Form submissions (forms extension)

Anonymous submissions may only attach files to fields of type `file`; files posted under other names are dropped. Single-file fields accept one file, multiple-file fields `max_files` (default 10). Without `allowed_types` a default document/image/audio/video allow-list applies, and active-content extensions (`html`, `svg`, `xml`, `js`, executables, …) are refused even if listed. Non-file values must be scalars or lists of scalars; values posted for file fields are discarded (they are set server-side). Storage errors return a generic message. The public form script writes the success message as text and only follows `http(s)` or relative redirect URLs.

---

## 7. Secrets at Rest

`internal/secrets/secrets.go` provides AES-256-GCM envelope encryption.

- Master key: `SQUILLA_SECRET_KEY` env — a base64 string that decodes to **exactly 32 raw bytes**. Generate with `openssl rand -base64 32` (produces a 44-character string). Hex-encoded keys, 24-byte Coolify magic vars, and arbitrary-length passphrases are all rejected; the secrets service requires exactly 32 bytes after `base64.StdEncoding.DecodeString`.
- Envelope format: `enc:v1:<base64(nonce || ciphertext || tag)>`.
- Fresh random 12-byte nonce per call.
- Encrypted columns:
  - `site_settings.value` for keys matching the secret heuristic — written through CoreAPI `SetSetting`, the kernel settings handlers, theme settings, and the extension settings handler (`PUT /admin/api/extensions/:slug/settings`, stored as `ext.<slug>.<key>`).
  - `themes.git_token`.
- Decryption mirrors the same key set: CoreAPI `GetSetting(s)` and the `email.send` payload (`ext.<provider>.*` settings bundled by `SendEmail`) decrypt transparently, so plugins and providers always see plaintext. Values without the envelope (written before a key was configured) pass through unchanged.

### Secret Heuristic
A `site_settings.key` is treated as secret-bearing (`secrets.IsSecretKey`) if, case-insensitively, it contains any of

```
_password   _key   _token   _apikey   _api_key   _credentials   _secret
```

or its last dot-separated segment is exactly one of `password secret token apikey api_key credentials` (so `ext.smtp-provider.password` counts). Extension `settings_schema` entries marked `"sensitive": true` are additionally masked in the admin UI; name such keys so the heuristic matches them, otherwise they are masked but stored in plaintext.

Reads via `GET /admin/api/settings` and `GET /admin/api/extensions/:slug/settings` mask secret keys as `"***"` (with an `is_set` flag on the kernel endpoint); sending `"***"` back on save keeps the stored value. Non-internal CoreAPI callers cannot read another extension's secret-shaped keys (§4).

Dev mode (no `SQUILLA_SECRET_KEY`) passes plaintext through and logs a warning; production refuses to boot.

> **Coolify deployment note:** Coolify's `SERVICE_BASE64_<NAME>` magic variable generates a 32-character base64 string, which decodes to only 24 raw bytes — not enough for an AES-256 key. The `coolify-compose.yml` uses `SERVICE_BASE64_SECRETKEY` as the fallback for `SQUILLA_SECRET_KEY`, but the auto-generated value will be rejected on boot. Always override `SQUILLA_SECRET_KEY` manually in the Coolify Environment Variables tab with the output of `openssl rand -base64 32`. See README §Deploy on Coolify for the full procedure.

---

## 8. Plugin Trust

**A gRPC extension is native code running as the Squilla process user.** Nothing below is a sandbox: a malicious or compromised plugin binary can read any file the app user can read, open network connections directly, and so on. Capabilities (`extension.json::capabilities`) bound only what the plugin can do **through the CoreAPI** (the `SquillaHost` gRPC service); they do not stop a native binary from exfiltrating data by other means. Install gRPC extensions only from sources you trust as much as Squilla itself. (Tengo scripts, by contrast, run in the embedded VM and can only reach the host through capability-gated `core/*` modules.)

What the kernel does to narrow a plugin's reach (`internal/cms/plugin_manager.go`, `plugin_process.go`, `plugin_verify.go`):

- **go-plugin v2, gRPC only**, magic cookie `SQUILLA_PLUGIN=squilla` (a compatibility check, not authentication).
- **AutoMTLS**: host and plugin negotiate a one-off mutual-TLS certificate pair at spawn, covering the plugin listener and the broker channel back to the host.
- **No inherited secrets**: the child process does not inherit the kernel environment (`SkipHostEnv`). It gets only `PATH HOME USER TZ LANG LC_ALL LC_CTYPE TMPDIR SSL_CERT_FILE SSL_CERT_DIR GOMEMLIMIT GOGC GOMAXPROCS GODEBUG STORAGE_DIR` plus go-plugin's handshake variables. Operators can pass more with `SQUILLA_PLUGIN_ENV=VAR1,VAR2`. `DB_*`/`DATABASE_URL`, `SESSION_SECRET`, `SQUILLA_SECRET_KEY` etc. stay in the kernel.
- **Confined binary path**: `plugins[].binary` must resolve (symlinks included) to a regular file inside the extension directory.
- **Optional SHA-256 pinning** (integrity pinning, *not* signature verification): if `site_settings` holds `plugin.<slug>.<binary-basename>.sha256`, a binary with a different digest is refused. Unpinned binaries load and their digest is logged — unless `SQUILLA_REQUIRE_PLUGIN_PINS=true`, which refuses every unpinned binary. A failed pin lookup refuses the plugin (fail closed). Extensions cannot read or write the `plugin.*` settings namespace through the CoreAPI. `squilla verify-plugin` prints the digest to pin.
- **Event-subscription gates**: every subscription needs `events:subscribe`; the wildcard `"*"` additionally needs `events:subscribe_all`; `email.send` (full outgoing mail + provider config) needs `email:provide`; `user.password_reset_requested` (reset token/URL) needs `auth:observe` — also for wildcard subscribers, filtered per delivery; `http.requests` needs `http:observe`; `render.transform` needs `render:transform`.
- **Bounded RPCs**: `GetSubscriptions`, `Initialize` and `Shutdown` have a 10 s deadline, `HandleEvent` 60 s, `HandleHTTPRequest` 60 s (or the caller's deadline). Spawning and initializing happen outside the plugin-manager lock; on stop the Shutdown RPC gets 10 s, then the process is killed regardless. A plugin whose process exited is treated as not running.
- **Trusted rows only**: at boot and on activation the kernel only runs extensions whose DB `path` resolves inside the bundled (`extensions/`) or data (`data/extensions/`) directory; `auto_activate` is honoured only for bundled extensions; `data_owned_tables` entries naming a kernel table or a table already owned by another active extension (bundled first, then priority order) are dropped.
- Plugin processes are crash-isolated: a panic inside a plugin never kills the kernel.

Each plugin receives a per-instance `SquillaHost` gRPC server backed by the **guarded** `CoreAPI`. Errors returned over it keep validation / not-found / capability-denied messages; any unclassified error (wrapped driver or filesystem error) is logged server-side and reaches the plugin as a generic `internal error`. The plugin's `CallerInfo` is constructed from its manifest's declared capabilities and `data_owned_tables`. The guard fails closed: a guarded call without a `CallerInfo` in its context holds no capabilities.

---

## 9. Outbound HTTP (`http.Fetch`)

`CoreAPI.Fetch` is the only path through which plugin/script code can make outbound HTTP requests. Hardening (`internal/coreapi/impl_http.go`):

- **Scheme allowlist**: `http`, `https`. Rejects `file://`, `gopher://`, `dict://`, etc.
- **Destination policy** (`IsFetchAddrAllowed`): only global unicast addresses; refuses loopback, RFC1918/unique-local, link-local (incl. cloud metadata `169.254.169.254`), unspecified (`0.0.0.0`, `::`), CGNAT `100.64.0.0/10`, `192.0.0.0/24`, benchmarking `198.18.0.0/15`, documentation ranges, multicast/broadcast/reserved, NAT64 `64:ff9b::/96` and `64:ff9b:1::/48`, 6to4 `2002::/16`, Teredo/`2001::/23`, and IPv4-mapped forms of all of these.
- **Dial-time enforcement**: the policy runs in the `net.Dialer` `Control` hook on the IP actually being connected to, so DNS rebinding between the pre-check and the connect, and every redirect hop, are covered. The URL pre-check remains for a clear error message.
- **No proxy**: the transport ignores `HTTP_PROXY`/`HTTPS_PROXY` (a proxy would make the dial check see only the proxy).
- **Redirect bound**: max 5 hops; each hop re-validated.
- **Body cap**: 10 MB. **Timeout**: 30 s default, max 120 s per call.

There is no environment override for the blocklist. Kernel code making outbound requests on behalf of extensions or MCP clients should use `coreapi.NewSafeTransport()` / `coreapi.IsFetchAddrAllowed` rather than its own list.

---

## 10. Theme & Extension Install

### Git install (`internal/cms/theme_git_safety.go`, `theme_mgmt_install_git.go`)

- **HTTPS-only** `git_url`, DNS-resolved and refused if it points at a private/loopback/link-local range. Enforced on install and when `git_url` is changed via `POST /themes/:id/git-config`.
- **Branch names** must match a conservative ref pattern (start alphanumeric, no `..`, no `//`, …) and are passed after `--`, so they can never be parsed as git options.
- **Hostile-config defense**: every clone/pull runs with `-c core.fsmonitor=false -c core.hooksPath=/dev/null -c alias.x= -c protocol.allow=never -c protocol.https.allow=always -c core.symlinks=false` (symlinks are checked out as plain files containing the link text).
- **Token never in argv**: tokens reach git through a temporary `GIT_ASKPASS` helper and an env var; `themes.git_token` is stored via the secrets envelope.
- **Timeout**: clone/pull are killed after 2 minutes.
- **Slug validation**: the manifest slug must match `[A-Za-z0-9_-]{1,128}` before it becomes a path; installing a slug that already exists is refused before anything on disk is touched. On-disk theme/extension slugs found by the scanners get the same check.
- Admin error responses carry a short message; git output and filesystem paths go to the server log.

### Zip install (themes and extensions)

- Archive size cap (themes: `MaxThemeUploadSize`, extensions 50 MB), **≤ 10,000 entries**, **≤ 500 MB extracted in total**, ≤ 256 MB per entry (over-cap is an error, not a silent truncation).
- Zip-slip rejected; **duplicate entry names rejected** (the validated manifest must be the one written to disk); file modes are masked to `0755` (no setuid/setgid/sticky, no group/world-write).
- Recursive copies (`copyDir`) skip symlinks and special files instead of following them.

### Path confinement for package contents (`internal/cms/path_confine.go`)

Theme and extension packages are untrusted input. Every manifest-named file — `layouts[].file`, `partials[].file`, `templates[].file`, `blocks[].dir` (and the files inside a block dir), `assets[].src`, theme `settings_pages[].file`, `plugins[].binary` — and every served file — `/theme/assets/*`, `/extensions/:slug/blocks/:dir/*`, extension `admin-ui/dist` assets and previews, theme previews, the admin file browser — and every file the Tengo runtime reads (entry and handler scripts, `./` source modules, `core/assets` reads) goes through `confinedPath`/`confinedFile`: symlinks are resolved, the real path must stay inside the package's real directory (separator-terminated prefix check), and "files" must be regular files. Extension `admin-ui/dist` assets and previews are served with `X-Content-Type-Options: nosniff`.

### Webhook (`POST /api/v1/theme-deploy`)

- Authenticated by GitHub `X-Hub-Signature-256` HMAC, GitLab `X-Gitlab-Token` or `X-Webhook-Secret`, all constant-time compares against `theme_webhook_secret` (decrypted from the secrets envelope).
- The legacy `?secret=` query param fallback was removed.
- There is **no per-IP rate limit** on this endpoint today; put it behind your reverse proxy's rate limiting if it is exposed. A replayed valid delivery just triggers another pull of the configured branch.

### Extension lifecycle

- Extension SQL migrations run each file and its bookkeeping row in one transaction; a failing migration rolls back and is retried on the next activation. Hot activation stops (and deactivates the extension again) when a migration fails instead of starting scripts/plugins against an unexpected schema; at boot, an active extension whose migrations fail is skipped (no scripts, no plugins, logged as an error) and retried on the next restart.
- Extension settings saved through `PUT /admin/api/extensions/:slug/settings` are encrypted at rest when the key is secret-shaped (same rule as the CoreAPI), and secret-shaped or schema-`sensitive` values are returned as `***` (saving `***` keeps the stored value).

---

## 11. CORS

Two policies are mounted in parallel (commit `ace0066`):

| Path | Policy |
|---|---|
| `/mcp` | Permissive: `Access-Control-Allow-Origin: *`, no credentials. Bearer-token auth means cookies are irrelevant. |
| Everything else (admin + public) | Strict: origins must match `CORS_ORIGINS` env (comma-separated), `AllowCredentials=true`, methods/headers allowlisted. |

In production `CORS_ORIGINS` may not contain `*` or `null` (boot refuses). The same allowlist feeds the CSRF origin check (§5).

`SERVICE_URL_APP` from Coolify is normalized to a list at startup (commits `279a2be`, `e84ffff`) — bare hostnames don't crash startup.

---

## 12. MCP Server (`/mcp`)

### Tokens
- Format: `vcms_<32 hex bytes>`.
- Stored as SHA-256 hash; `token_prefix` (first 8 chars) kept for log identification.
- Created via `POST /admin/api/mcp-tokens` (session auth); raw value returned **once** in the response.
- Minting requires the `admin_access` capability. Minting a `full` token additionally requires `manage_settings` (the seeded Author/Editor roles have `admin_access` but not `manage_settings`, so they can only mint `read`/`content`). If `scope` is omitted it defaults to `full` only for callers holding `manage_settings`; anyone else gets `400 SCOPE_REQUIRED`.
- Every request re-validates the owner: the token is rejected (401) if the owner was deleted, lost `admin_access`, or — for `full` tokens — lost `manage_settings`. Re-granting the capability revives the token.
- `last_used_at` is written once per HTTP request (auth middleware only).
- Per-token rate limiter: 600 req/min with a burst of 60 by default (`SQUILLA_MCP_RPM`, `SQUILLA_MCP_BURST`), in-memory (process-local). Backed by `golang.org/x/time/rate`. The `rate_limited` error message reports the configured values.

### Scope × Class ACL
| Scope | Allowed classes |
|---|---|
| `read` | read |
| `content` | read, content |
| `full` | read, content, full |

Tools **and resources** (`squilla://…`) go through the same gate (token, scope, rate limit, audit). Resources are class `read`. `core.filter.apply` is class `content` (it runs extension/theme filter handlers on caller input).

Every tool runs against CoreAPI as `InternalCaller`, so the MCP layer enforces its own data policy on top of the class:

- **Generic table tools (`core.data.get/query/create/update/delete`)** — `full` scope may touch any table. `read`/`content` scope is limited to an explicit allow-list (`dataToolScopedTables` in `tools_data.go`, currently **empty**), so in practice these tools require `full`; read/content agents use the typed tools. Kernel-private tables (`users`, `sessions`, `mcp_tokens`, `pending_uploads`, `extension_migrations`, …) are refused for anything below `full`.
- **`core.data.query` `raw`/`args`** — `full` scope only. The fragment must pass `coreapi.ValidateRawWhere` (unqualified column names, `AND/OR/NOT/IS/NULL/LIKE/ILIKE/IN/BETWEEN/TRUE/FALSE`, functions `lower/upper/coalesce/now`, `?` placeholders, numbers, single-quoted literals, comparison and JSON operators, `::<type>` casts from a fixed list; no sub-queries, `;`, comments, dollar quoting, qualified names or other function calls) unless `SQUILLA_MCP_ALLOW_RAW_SQL=true`. The same grammar applies to every non-internal (gRPC extension) `DataQuery` caller.
- **`order_by`** (nodes and data queries) — validated for every caller: `column [ASC|DESC] [NULLS FIRST|LAST]`, comma-separated; `COALESCE(col, col, …)` is the only expression allowed.
- **Settings** — `core.settings.get/list` redact secret-like keys (`secrets.IsSecretKey`) and every `plugin.*` key for `read`/`content` tokens.
- **`core.media.import_url`** — http/https only; the kernel outbound policy (`coreapi.IsFetchAddrAllowed` on a `coreapi.NewSafeTransport`, §9) is enforced at dial time (covers redirects and DNS rebinding); max 5 redirects; 60 s timeout; body capped at `SQUILLA_MEDIA_MAX_MB` (default 50).
- **`core.files.store/delete`** — confined to `storage/mcp/`; `..`, absolute paths and backslashes are rejected; `store` only accepts an extension allow-list (txt, md, json, csv, log, png, jpg, jpeg, gif, webp, avif, ico, pdf, zip, woff, woff2, ttf, otf, mp3, wav, ogg, mp4, webm) — no html/svg/js/xml.
- **Errors** — validation / not-found / permission messages are returned verbatim; internal errors (coreapi internal errors, DB driver, filesystem and network errors) and panics are replaced by `internal error (request id …)` and logged server-side with that id. Data* methods never return driver text to gRPC or MCP callers.

`tools_data.go` `core.data.exec` (raw SQL) requires both `full` scope and `SQUILLA_MCP_ALLOW_RAW_SQL=true` env.

### Audit Log
Every tool call and resource read writes `(token_id, tool, args_hash, status, error_code, duration_ms)` to `mcp_audit_log` (resource reads are logged as `resource:<name>`). Raw args are not stored (only SHA-256 hash) so PII does not leak. Daily retention sweep keeps the table bounded.

### Presigned Upload Tokens (`/api/uploads/<token>`)

For binaries above ~5 MB, MCP tools use a three-step presigned-upload flow
(`core.<kind>.upload_init` → `PUT /api/uploads/<token>` →
`core.<kind>.upload_finalize`). The PUT route is mounted as a **raw
`http.Handler` outside Fiber middleware** — there is no session, no bearer
header, and no capability check at the HTTP edge. The token in the URL is
the entire access-control story.

| Property | Value |
|---|---|
| Token entropy | 64 hex chars (32 random bytes via `crypto/rand`) |
| TTL | ~15 minutes (`expires_at`) |
| Stored as | SHA-256 of the token (the raw token is never persisted); `pending_uploads` is kernel-private, so the data API cannot read or forge rows |
| Single-use | Row goes `pending` → `uploaded` → `finalizing` → `finalized`; finalize claims the row with a conditional UPDATE, so concurrent finalize calls install once. A failed install releases the claim so the client can retry |
| Bound to user | `pending_uploads.user_id` is set at `_init`; `_finalize` is refused unless the calling MCP token belongs to the same user |
| Staging path | Always derived from the token (`Store.TempPathFor`); the `temp_path` column is informational and never opened or deleted. Tokens must be 64 lower-case hex chars |
| Bound to kind | `media`, `theme`, or `extension` only — finalize for the wrong kind is rejected |
| Size cap | Per token (`max_bytes`, fixed at `_init`): media 50 MB (`SQUILLA_MEDIA_MAX_MB`), theme and extension zips 200 MB (`SQUILLA_THEME_MAX_MB`, `SQUILLA_EXTENSION_MAX_MB`). The PUT reads at most `max_bytes`+1 bytes and answers 413 past it; the HTTP layer adds a 2 GB transport backstop for `/api/uploads/*` (§2a) |
| Cleanup | Background ticker every 5 minutes deletes expired pending/uploaded rows + temp files, rows stuck in `finalizing` 1 h past expiry, and finalized rows 24 h after finalize |
| Streamed | Body streamed to disk (net/http bridge, never buffered by Fiber) at `data/pending/<sha256(token)>.bin` while computing its SHA-256 — the staging file is named after the token hash, so a directory listing does not reveal live tokens |
| Error codes | 404 unknown, 410 expired, 409 already-uploaded / in-progress, 413 too large; 500 responses carry a generic message (details logged), never paths or driver errors |

**Why it's safe without Fiber auth:** the threat is unauthenticated parties
discovering a valid token. With 256 bits of entropy and a 15-minute window
the search space is far beyond brute-force reach. A successful upload still
needs an MCP token of the issuing user to call `_finalize`; the bytes on
disk without finalize are inert (the cleanup ticker reaps them).

Tables: `pending_uploads` (migration `0042_pending_uploads.sql`). Code:
`internal/uploads/`.

### Schema-driven settings & Capability propagation through providers

Two architectural changes from commit `7e49268` worth flagging here:

- **Settings registry** (`internal/settings/`): every kernel-owned setting
  is declared in `builtin.go` with an explicit `Translatable` flag and a
  group (general / SEO / advanced / languages / security). The registry
  drives both the admin UI and the per-language storage rules in `store.go`
  — non-translatable fields read/write the default-language row directly,
  translatable fields use the per-locale composite-PK lookup with
  default-language fallback. Extensions register their own groups via
  `Registry.RegisterGroup`, and the same secret-key heuristic from
  `internal/secrets/` applies to extension-owned keys without extra wiring.

- **Provider tags through the plugin manager**: kernel `core.media.*` and
  `SendEmail` no longer call concrete in-kernel services. Plugins declare a
  `provides` array in `extension.json` (`media-provider`, `email.provider`,
  …); media calls go to the highest-priority active `media-provider`.
  `SendEmail` publishes `email.send` with `PublishRequest` (subscribing
  needs `email:provide`); only the provider named in the `email_provider`
  setting answers, and its decrypted `ext.<provider>.*` settings travel in
  the payload. Capability checks still happen at the gRPC edge
  inside the plugin (the host calls `coreAPI.UploadMedia` with the
  caller's CallerInfo, the guard in `internal/coreapi/capability.go`
  evaluates against the plugin's manifest capabilities, then the call
  proceeds). Hot-swapping providers works because the routing is dynamic
  and the call surface (`MediaProvider` / `EmailProvider` interfaces in
  `internal/coreapi/`) is fixed.

---

## 13. Logging

Structured slog with request-id correlation (commit `dcde556`):

- Development: human-readable text format.
- Production: JSON to stdout for collector ingestion.
- Every request gets an `X-Request-Id` (generated if absent) propagated through the request context.
- `coreapi.Log` (callable by extensions) prefixes with `[ext:<slug>]` and writes through the same slog path.

### Don't Log
- Plaintext passwords (use bcrypt failures with masked email).
- Session cookie values (only token prefix).
- MCP raw token (only `token_prefix`).
- Secret site setting values.
- Plugin response bodies (commit `eb0c1eb` removed the leaky preview log).

### Required Fields on Errors
- Request-id (auto-injected).
- Error category (`auth`, `database`, `external`, `validation`).
- Caller info (when known).

---

## 14. Threat Model Quick Reference

| Threat | Status |
|---|---|
| **Tengo sandbox escape** | Explicit stdlib allow-list (`math`, `text`, `rand`, `json`, `base64`, `hex`, `fmt` without print functions, `times` without `sleep`; `os` is never importable); per-execution fresh VM. Resource caps: 50k Tengo object allocations (an object count, not bytes) plus 4 MiB per string/bytes value, 1 MiB script source, 1 MiB route request body, 64-level nesting limit on values converted back to Go. 10 s timeout: CoreAPI calls inherit the deadline and the caller is released at expiry even if a builtin blocks (the VM goroutine finishes when the builtin returns). Registration (`events.on`, `filters.add`, `routes.register`, `wellknown.register`) is capability-gated (`events:subscribe`, `filters:register`, `routes:register`; `email:provide` / `auth:observe` / `http:observe` for sensitive events), only allowed during the entry-script load, and scoped per load. Script routes never see Cookie/Authorization/CSRF headers and cannot set `Set-Cookie` or hop-by-hop headers. Unloading a theme/extension drops its event-bus subscriptions. Residual: Tengo's own `String()`/`Copy()`/`Equals()`/`json.encode` recurse without a depth limit, so a cyclic value passed to those builtins can still overflow the stack. |
| **Credential stuffing** | Bcrypt + per-IP rate limit + one shared per-account lockout; input size caps and bounded limiter maps. |
| **JSONB injection** | GORM parameterized queries; field schemas validated against block-type definition before save. |
| **Stored XSS in blocks** | bluemonday at render time on richtext fields and on block-view `safeHTML`/`raw` of plain strings; `safeURL` refuses script schemes; layouts keep raw `safeHTML` for admin-only settings (§6.1). |
| **Stored XSS via media uploads** | Sniffed-type check, safe stored extensions, SVG sanitiser, nosniff + sandbox CSP / attachment on serve (§6.3). |
| **CSRF** | JSON-only mutations + Sec-Fetch-Site/Origin check + strict CORS + SameSite=Strict cookie. |
| **MIME header injection** | Subjects rendered with `text/template` then validated for CR/LF (commit `eb0c1eb`). |
| **MITM STARTTLS downgrade** | `email_smtp_require_tls=true` setting (commit `eb0c1eb`); refuses plaintext if STARTTLS unavailable. |
| **Plugin tampering** | Optional operator SHA-256 pins (`SQUILLA_REQUIRE_PLUGIN_PINS=true` refuses unpinned), confined binary path, pins not reachable through the CoreAPI. A gRPC plugin is unsandboxed native code — trust the source (§8). |
| **SSRF via http.Fetch** | Scheme allowlist + private/special-range blocklist enforced at dial time (rebinding- and redirect-safe), proxy env ignored (§9). |
| **Theme webhook replay** | HMAC validation; no built-in rate limit — a replay only re-pulls the configured branch (§10). |
| **Mass-assignment via JSON parse** | Update handlers strip protected fields (`id`, `created_at`, `is_system`, `role_id` for non-self) before `db.Updates`. |
| **Privilege escalation via PATCH /users/me** | Self-edit cannot change `role_id`. |
| **Stored token replay (password reset)** | Single-use; atomic conditional `UPDATE` on consumption. |
| **Search bypassing access filter** | Search applies `NodeAccess` filter (commit `9f9239c`). |
| **Filter handler leak** | `RegisterFilter` returns `UnsubscribeFunc`; opaque ID-based unregister (commit `9f9239c`). |
| **Subscribe handler leak** | `Subscribe` returns `UnsubscribeFunc`; bus supports proper unregister. |
| **SSE blocking on slow client** | Bounded buffer (cap 32) with drop-on-full. |
| **Member auto-promoted to admin shell** | Login/register redirect honors `admin_access`; `/admin/*` SPA gate redirects logged-in non-admin sessions; `/admin/api/*` group requires `admin_access`. |
| **Member sees admin lists by direct URL** | `CapabilityGuard` on every privileged SPA route + per-handler `CapabilityRequired` on the API. |
| **Boot manifest leaks installed extensions** | `IsExtensionVisible` filters bootExts and `/admin/api/extensions/manifests` per user — extension included only if it has a visible nav entry, declares `provides`, contributes `slots`, or declares `field_types`. |
| **Dashboard leaks user count / cross-type drafts** | StatCards, recent-content, drafts feed, and quick actions all scoped to viewer capabilities; layout cache skipped for per-user pages. |
| **UI-revoked permission still saves via API** | `extension.json::admin_routes` enforced in `ExtensionProxy.handleRequest` before forwarding to plugin — plugins don't implement RBAC, kernel does. |
| **Wildcard role bypasses admin_access** | `auth.HasCapability` and `sdui.hasNavCap` exclude `admin_access` from `*` resolution — explicit flag always wins. |
| **Read endpoint coupled to write capability** | Picker-friendly resources (roles, taxonomies, layouts, …) drop their GETs to `admin_access`; mutations keep their specific manage cap. |
| **Stale extension `manage_*` toggle in role editor** | Capability list is dynamic — extension/theme bridges register on activation, drop on deactivation, surface via `GET /admin/api/capabilities`. |

---

## 15. PR-Time Security Checklist

Before merging any change touching kernel code:

- [ ] Capability gate on every admin endpoint that mutates state.
- [ ] Reads exposed for picker use cases drop to `admin_access`; sensitive reads (PII, logs) keep their specific cap.
- [ ] If the change adds an admin route on an extension, `extension.json::admin_routes` declares its `required_capability`.
- [ ] If the change adds an admin nav entry, the parent menu's `required_capability` (or section default) covers it; child overrides exist where appropriate.
- [ ] If the change adds a SPA route under `/admin/*`, it's wrapped with `<CapabilityGuard requires="...">`.
- [ ] If the change adds dashboard data, it's filtered per the viewer's capabilities (no leaked totals, no leaked node titles).
- [ ] If the change introduces a new capability key, it's declared in either `auth.kernelCapabilities()` (kernel) or `admin_ui.capabilities` (extension/theme manifest) so the role-editor surfaces it.
- [ ] DTO for body parsing — no `c.BodyParser(&model)` direct.
- [ ] Mass-assignment safe: protected fields explicitly stripped.
- [ ] Validation: enum fields whitelisted, required fields non-empty, lengths bounded.
- [ ] Constant-time compare for any secret check.
- [ ] No URL injection: scheme allowlist, no leading-wildcard ILIKE on indexed columns.
- [ ] No CRLF in headers: strip `\r\n` from any user-supplied value before writing to a header.
- [ ] Path-traversal defense on FS reads of theme/extension/user-influenced paths: `cms.ConfinedFile` / `confinedPath` (resolves symlinks, then prefix-checks against the real base) — a lexical `filepath.Clean` + prefix check misses symlinks.
- [ ] Context propagation: pass `c.UserContext()` through DB/HTTP/script calls.
- [ ] Error wrapping: `fmt.Errorf("...: %w", err)`.
- [ ] No silent `json.Marshal`: handle the error.
- [ ] No new file > 500 LOC.
- [ ] Tests for the new code path (capability denied, invalid input, success).

---

## 16. Reporting Vulnerabilities

Email `security@squilla.local` (placeholder — set in your fork). Disclose privately first; we aim for 7-day acknowledgement and 30-day fix turnaround for critical issues.
