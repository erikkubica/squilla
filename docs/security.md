# Squilla Security

This document describes the **current** security posture: what's implemented, where, and how a kernel or extension developer is expected to use it. For threat-model history and the per-issue audit trail, see commits prefixed `feat(security):`, `feat(auth):`, `feat(secrets):`, and `feat(themes):`.

---

## 1. Defense in Depth Summary

| Layer | Mechanism | Where |
|---|---|---|
| Boot | Refuse to start with unsafe config | `internal/config/config.go::Validate` |
| Transport | TLS expected at edge (Coolify/proxy); HSTS at app level | Fiber middleware |
| Auth | Bcrypt passwords, hashed sessions, account lockout, rate limit | `internal/auth/` |
| Authorization (admin shell) | `admin_access` gate on `/admin/api/*` group + post-auth redirect + SPA shell redirect | `cmd/squilla/{main,static_routes}.go`, `internal/auth/page_handler.go` |
| Authorization (API) | Per-handler `CapabilityRequired` + capability guard wrapping `CoreAPI` + manifest-driven `admin_routes` on extension proxy | `internal/auth/`, `internal/coreapi/capability.go`, `internal/cms/extension_proxy.go` |
| Authorization (UI) | `CapabilityGuard` on SPA routes + capability-filtered nav, dashboard, boot manifest, manifests endpoint | `admin-ui/src/App.tsx`, `internal/sdui/{engine,engine_navigation,extension_visibility}.go` |
| CSRF | JSON-only mutations on `/admin/api/*` | `internal/auth/csrf.go` |
| XSS | bluemonday UGC sanitization at render | `internal/sanitize/richtext.go` |
| Secrets at rest | AES-256-GCM envelope on flagged settings, theme git tokens | `internal/secrets/` |
| Plugin trust | Signed binaries, gRPC handshake validates signature | `pkg/plugin/`, `internal/cms/plugin_manager.go` |
| Outbound HTTP | Scheme allowlist, internal-host blocklist, redirects bounded | `internal/coreapi/impl_http.go` |
| Theme git | HTTPS-only, scheme allowlist, encrypted tokens, HMAC-validated webhook | `internal/cms/theme_*.go` |
| MCP | Bearer token (hashed), per-token rate limit, scope×class ACL, audit log | `internal/mcp/` |
| Logs | Structured slog with request-id correlation, no secret leakage | `internal/logging/` |

---

## 2. Production Boot Gates

`config.Load` validates the environment before the server starts. In `APP_ENV=production`, the boot fails fast on:

| Problem | Error | Remediation |
|---|---|---|
| Empty `SESSION_SECRET` | `SESSION_SECRET unset in production` | Set a random 32+ byte hex string |
| Empty `SQUILLA_SECRET_KEY` | `SQUILLA_SECRET_KEY unset; secret-bearing settings cannot be encrypted` | Generate via `openssl rand -base64 32` |
| Wrong `SQUILLA_SECRET_KEY` length | `secrets init failed: SQUILLA_SECRET_KEY must be 32 raw bytes (base64-encoded): got N bytes, want 32` | Value must base64-decode to **exactly 32 bytes**. Coolify's `SERVICE_BASE64_<NAME>` produces only 24 bytes — override manually with `openssl rand -base64 32`. |
| Default DB password | `DB_PASSWORD is the project default; refusing to start` | Use Coolify magic vars or a real secret |
| `DB_SSLMODE=disable` on a non-internal hostname | `DB_SSLMODE=disable on a public host` | `require` or `verify-full` |
| Empty `CORS_ORIGINS` | `CORS_ORIGINS unset; admin would be open to any origin` | Set the public admin URL list |
| Empty `MONITOR_BEARER_TOKEN` | `MONITOR_BEARER_TOKEN unset; /api/v1/stats unprotected` | Generate via `openssl rand -hex 32` |

Coolify's `coolify-compose.yml` populates all of these via `SERVICE_*` magic variables on first deploy.

---

## 3. Authentication

### 3.1 Sessions
- 32-byte cryptographic random token, hex-encoded; only the SHA-256 hash stored (`token_hash` column).
- Cookie `squilla_session`: `HttpOnly=true`, `SameSite=Lax`, `Secure` when behind TLS (honors `X-Forwarded-Proto` from the trusted proxy).
- Stored fields: `user_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`.
- Hourly cleanup loop (`SessionService.CleanExpired`) removes expired rows.
- File: `internal/auth/session_svc.go`.

### 3.2 Login
- Bcrypt verification (`bcrypt.DefaultCost=10`; configurable via `BCRYPT_COST` env).
- Constant-time password compare (bcrypt is constant-time by construction).
- Account lockout after N failed attempts (default 5, exponential backoff): `internal/auth/lockout.go`.
- Per-IP rate limiter (default 5 attempts / 15 min): `internal/auth/rate_limit.go`.
- File: `internal/auth/auth_handler.go`, `page_handler.go`.

### 3.3 Registration
- Public registration creates `member`-role users (not `editor`) since commit `76f6124`.
- Self-registration is gated by `setting.allow_registration=true` (default false in production seeds).

### 3.4 Password Reset
- Real flow (no longer a stub).
- Raw token generated, sent via email; only SHA-256 hash stored in `password_reset_tokens`.
- Tokens single-use (`used_at` set on consumption to detect replay).
- Hourly cleanup of expired/used tokens.
- File: `internal/auth/password_reset.go`.
- **Graceful degradation:** when no `email.provider` plugin is active, the email-based reset flow is unavailable. The handler short-circuits with a clear error rather than panicking. For recovery, operators can use the `squilla reset-password <email> <new-password>` CLI subcommand which writes directly to the DB without going through the dispatcher (commit `c723983`).

### 3.5 Self-Promotion Block
- `UserHandler.Update` strips `role_id` from payloads when `target_user_id == current_user.id` (commit `76f6124`).
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

**First-rule-wins.** Most specific patterns first. Unmatched requests fall through to `admin_access` only — back-compat for extensions that haven't declared rules yet, but every mutating route SHOULD declare one.

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
- Counts and recent-content listings scoped to `readableNodeTypeSet(user)` so a user with read-only on `page` doesn't see draft titles for `testimonial`.
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

`auth.JSONOnlyMutations()` rejects POST/PUT/PATCH/DELETE on `/admin/api/*` unless `Content-Type` is `application/json`. This is sufficient because:

- Browsers cannot send a cross-origin `application/json` request without an explicit CORS preflight.
- `CORS_ORIGINS` is a strict allowlist (admin endpoints are credentialed).
- The session cookie is `SameSite=Lax`, so navigation-initiated requests carry the cookie but a forged form POST is blocked at the body-parser by content-type.

Token-based CSRF middleware is **not** currently implemented. The threat model deems content-type + same-site + strict CORS sufficient for the JSON admin API.

Public extension routes (`extension.json` `public_routes`) are not behind `JSONOnlyMutations` — extensions handling forms must include their own CAPTCHA and/or honeypot defenses (the `forms` extension includes both by default).

---

## 6. XSS Defense

`internal/sanitize/richtext.go` runs bluemonday's UGC policy on richtext fields **at render time**, with these tweaks:

- Strips: `<iframe>`, `<form>`, `<input>`, `<style>`.
- Allows: `<a>` with `rel`/`target`, `class` on all elements, `<img>` with `loading`/`decoding`.

Render-time (not write-time) sanitization means policy can tighten without rewriting stored data.

The Go `html/template` engine auto-escapes by default; `safeHTML` and `safeURL` template helpers explicitly opt out for cases where the kernel knows the value is safe (rendered block output, asset URLs from internal lookups). Treat any new use of `safeHTML`/`safeURL` as requiring a security review.

---

## 7. Secrets at Rest

`internal/secrets/secrets.go` provides AES-256-GCM envelope encryption.

- Master key: `SQUILLA_SECRET_KEY` env — a base64 string that decodes to **exactly 32 raw bytes**. Generate with `openssl rand -base64 32` (produces a 44-character string). Hex-encoded keys, 24-byte Coolify magic vars, and arbitrary-length passphrases are all rejected; the secrets service requires exactly 32 bytes after `base64.StdEncoding.DecodeString`.
- Envelope format: `enc:v1:<base64(nonce || ciphertext || tag)>`.
- Fresh random 12-byte nonce per call.
- Encrypted columns:
  - `site_settings.value` for keys matching the secret heuristic.
  - `themes.git_token`.
  - Reserved for future: `extension settings` flagged as secret in their manifest.

### Secret Heuristic
A `site_settings.key` is treated as secret-bearing if (case-insensitive) it contains any of:

```
_password   _key   _token   _apikey   _api_key   _credentials   _secret
```

Reads via `GET /admin/api/settings` redact secret keys (commit `54f573a`) — they return `"<redacted>"` regardless of stored value, unless the caller has explicit elevated capability.

Dev mode (no `SQUILLA_SECRET_KEY`) passes plaintext through and logs a warning; production refuses to boot.

> **Coolify deployment note:** Coolify's `SERVICE_BASE64_<NAME>` magic variable generates a 32-character base64 string, which decodes to only 24 raw bytes — not enough for an AES-256 key. The `coolify-compose.yml` uses `SERVICE_BASE64_SECRETKEY` as the fallback for `SQUILLA_SECRET_KEY`, but the auto-generated value will be rejected on boot. Always override `SQUILLA_SECRET_KEY` manually in the Coolify Environment Variables tab with the output of `openssl rand -base64 32`. See README §Deploy on Coolify for the full procedure.

---

## 8. Plugin Trust

- HashiCorp `go-plugin` v2 protocol with magic cookie `SQUILLA_PLUGIN=squilla`.
- gRPC-only (no NetRPC).
- **Binaries are signed** (commit `654dae5`). The handshake validates the embedded signature against the kernel's public key before allowing the plugin to register.
- Plugin processes are crash-isolated: a panic inside a plugin never kills the kernel.
- Plugin shutdown has a 30-second timeout (`pluginManager.StopAll()` runs `app.ShutdownWithTimeout(30*time.Second)`).

Each plugin receives a per-instance `SquillaHost` gRPC server backed by the **guarded** `CoreAPI`. The plugin's `CallerInfo` is constructed from its manifest's declared capabilities and `data_owned_tables`.

---

## 9. Outbound HTTP (`http.Fetch`)

`CoreAPI.Fetch` is the only path through which plugin/script code can make outbound HTTP requests. Hardening (commit `2344aa1`):

- **Scheme allowlist**: `http`, `https`. Rejects `file://`, `gopher://`, `dict://`, etc.
- **Internal-host blocklist**: rejects `localhost`, `127.0.0.0/8`, `169.254.0.0/16` (link-local, AWS metadata), `10.0.0.0/8` and `192.168.0.0/16` (RFC1918), `::1`, fc00::/7.
- **Redirect bound**: max 5 hops; each hop re-validated.
- **Body cap**: 10 MB default, configurable per call.
- **Timeout**: 30 s default, configurable per call.

Override the blocklist by setting `SQUILLA_ALLOW_PRIVATE_HTTP=true` (development only).

---

## 10. Theme Git Install

Hardening (commit `f4ac40f`):

- **HTTPS-only**: `git_url` must start with `https://`. SSH and `file://` are rejected.
- **Scheme allowlist**: enforced at clone and pull.
- **Encrypted tokens**: `themes.git_token` stored via the secrets envelope.
- **Token never in argv**: tokens injected via `git -c http.extraheader=Authorization:Bearer ...`, not in the URL (no `ps aux` leakage).
- **Hostile-config defense**: post-clone, `.git/config` is reset to a minimal known-good template before any further git operations run.

### Webhook (`POST /api/v1/theme-deploy`)

- HMAC-validated: GitHub `X-Hub-Signature-256`, GitLab `X-Gitlab-Token`. Constant-time compare.
- The legacy `?secret=` query param fallback was removed.
- Rate-limited per-IP.
- Idempotent: duplicate deliveries with the same commit SHA are no-ops.

---

## 11. CORS

Two policies are mounted in parallel (commit `ace0066`):

| Path | Policy |
|---|---|
| `/mcp` | Permissive: `Access-Control-Allow-Origin: *`, no credentials. Bearer-token auth means cookies are irrelevant. |
| Everything else (admin + public) | Strict: origins must match `CORS_ORIGINS` env (comma-separated), `AllowCredentials=true`, methods/headers allowlisted. |

`SERVICE_URL_APP` from Coolify is normalized to a list at startup (commits `279a2be`, `e84ffff`) — bare hostnames don't crash startup.

---

## 12. MCP Server (`/mcp`)

### Tokens
- Format: `vcms_<32 hex bytes>`.
- Stored as SHA-256 hash; `token_prefix` (first 8 chars) kept for log identification.
- Created via `POST /admin/api/mcp/tokens`; raw value returned **once** in the response.
- Per-token rate limiter: 60 req/10 s default, in-memory (process-local). Backed by `golang.org/x/time/rate`.

### Scope × Class ACL
| Scope | Allowed classes |
|---|---|
| `read` | read |
| `content` | read, content |
| `full` | read, content, full |

`tools_data.go` `core.data.exec` (raw SQL) requires both `full` scope and `SQUILLA_MCP_ALLOW_RAW_SQL=true` env.

### Audit Log
Every tool call writes `(token_id, tool, args_hash, status, error_code, duration_ms)` to `mcp_audit_log`. Raw args are not stored (only SHA-256 hash) so PII does not leak. Daily retention sweep keeps the table bounded.

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
| Single-use | Token row goes from `pending` → `uploaded` → `finalized` atomically |
| Bound to user | `pending_uploads.user_id` is set at `_init`; `_finalize` runs in the issuing user's auth context, so capability checks at finalize time still apply |
| Bound to kind | `media`, `theme`, or `extension` only — finalize for the wrong kind is rejected |
| Size cap | Per-kind, env-tunable (`SQUILLA_MEDIA_MAX_MB`, `SQUILLA_THEME_MAX_MB`, `SQUILLA_EXTENSION_MAX_MB`) |
| Cleanup | Background ticker deletes expired rows + temp files every 5 minutes |
| Streamed | Body written straight to `data/pending/<token>.bin` while computing SHA-256 — no full-buffer-in-memory |
| Error codes | 404 unknown, 410 expired, 409 already-uploaded / in-progress, 413 too large |

**Why it's safe without Fiber auth:** the threat is unauthenticated parties
discovering a valid token. With 256 bits of entropy and a 15-minute window
the search space is far beyond brute-force reach. A successful upload still
needs the issuing user's auth context to call `_finalize`; the bytes on
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
  …); the plugin manager indexes them and routes the call to the highest-
  priority active plugin. Capability checks still happen at the gRPC edge
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
| **Tengo sandbox escape** | Restricted standard library (`os`, `io`, network modules removed); 50k allocation cap; 10 s timeout; per-execution fresh VM. |
| **Credential stuffing** | Bcrypt + per-IP rate limit + account lockout. |
| **JSONB injection** | GORM parameterized queries; field schemas validated against block-type definition before save. |
| **Stored XSS in blocks** | bluemonday at render-time. |
| **CSRF** | JSON-only mutations + strict CORS + SameSite cookie. |
| **MIME header injection** | Subjects rendered with `text/template` then validated for CR/LF (commit `eb0c1eb`). |
| **MITM STARTTLS downgrade** | `email_smtp_require_tls=true` setting (commit `eb0c1eb`); refuses plaintext if STARTTLS unavailable. |
| **Plugin tampering** | Signed binaries + handshake validation. |
| **SSRF via http.Fetch** | Scheme allowlist + internal-host blocklist. |
| **Theme webhook replay** | HMAC validation + rate limit. |
| **Mass-assignment via JSON parse** | Update handlers strip protected fields (`id`, `created_at`, `is_system`, `role_id` for non-self) before `db.Updates`. |
| **Privilege escalation via PATCH /users/me** | Self-edit cannot change `role_id`. |
| **Stored token replay (password reset)** | Single-use; `used_at` set on consumption. |
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
- [ ] Path-traversal defense on FS reads: `filepath.Clean` + prefix check against absolute base.
- [ ] Context propagation: pass `c.UserContext()` through DB/HTTP/script calls.
- [ ] Error wrapping: `fmt.Errorf("...: %w", err)`.
- [ ] No silent `json.Marshal`: handle the error.
- [ ] No new file > 500 LOC.
- [ ] Tests for the new code path (capability denied, invalid input, success).

---

## 16. Reporting Vulnerabilities

Email `security@squilla.local` (placeholder — set in your fork). Disclose privately first; we aim for 7-day acknowledgement and 30-day fix turnaround for critical issues.
