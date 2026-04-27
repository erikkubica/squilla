# VibeCMS Core — Development Guide

A practical reference for engineers working **on the kernel** (not on extensions; for that see `extension_api.md`). Distilled from a complete code review of `internal/`. Read alongside [`core_features.md`](./core_features.md) and [`architecture.md`](./architecture.md).

---

## 1. Foundational rules

### 1.1 The kernel/extension hard rule
From `CLAUDE.md`:

> If disabling/removing an extension would leave dead code in core, that code belongs in the extension, not core.

When designing a feature, ask: *"Could this be turned off without breaking the kernel?"* If yes → extension. If no → core. **The default is extension.**

Real violations to clean up:
- `internal/email/smtp.go`, `resend.go`, `provider.go` — should be in `extensions/smtp-provider`, `extensions/resend-provider`.
- `internal/rendering/template_renderer.go::image_url`, `image_srcset` — assume the media-manager extension's URL scheme; should move there.
- `internal/cms/media_handler.go` — competes with media-manager extension. Currently dead code.

### 1.2 File size limits
| Limit | Value |
|---|---|
| Soft target | 300 LOC (production code) |
| Hard limit | 500 LOC (production code) |
| Test files | exempt |

11 files currently exceed the hard limit (engine.go 2571, tengo_adapter.go 1572, public_handler.go 1524, grpc_client.go 974, theme_loader.go 967, db/seed.go 886, grpc_server.go 851, node_handler.go 777, theme_mgmt_service.go 596, content_svc.go 552, extension_handler.go 551). New work must not add to the list.

**When you must split**: organize by responsibility/domain, not arbitrarily. Examples:
- `sdui/engine.go` → one file per page builder (`layouts/dashboard.go`, `layouts/content.go`, …).
- `coreapi/grpc_server.go` → one file per domain (`grpc_nodes.go`, `grpc_taxonomies.go`, …).
- `db/seed.go` → one file per concern (`seed/auth.go`, `seed/content.go`, `seed/email.go`, …).

### 1.3 Coding standards (Go)
- **Errors**: never `result, _ := ...`. Always check. Wrap with context: `fmt.Errorf("creating node %s: %w", slug, err)`.
- **Sentinel errors**: define at package level. The kernel uses `coreapi.ErrCapabilityDenied`, `ErrNotFound`, `ErrValidation`, `ErrInternal` + `APIError` wrapper.
- **Context**: must be the first parameter, must be propagated to DB/HTTP/script calls. **Currently broken** in 13 of 15 `impl_*.go` files (they take `_ context.Context` and discard it). Fixing is part of #27 from the review.
- **`log.Fatalf`** only at the very top (`main.go`). Functions that return an error must not call `log.Fatalf` before returning — it makes the error return dead code (see `internal/db/postgres.go` for the anti-pattern).
- **`panic(`** in production code: never. Use error returns. Recovery only at handler boundaries (event bus, gRPC, Tengo callbacks).
- **No nil-deref**: GORM `First` returns `gorm.ErrRecordNotFound` — distinguish from other errors.
- **Comments**: only when WHY is non-obvious. Self-documenting code over comments.

### 1.4 What NOT to do
- Don't bind JSON request body directly to a model (`var u models.User; c.BodyParser(&u); db.Save(&u)`) — mass-assignment vulnerability. Always use a request DTO.
- Don't compare secrets with `!=` — use `crypto/subtle.ConstantTimeCompare`.
- Don't store secrets plaintext if the schema says `is_encrypted=true` — implement encryption or remove the flag.
- Don't ignore `json.Marshal` errors (`b, _ := json.Marshal(...)` — common in `impl_*.go`).
- Don't use `sync.Map` or `map[string]X` as an unbounded cache — use bounded LRU (e.g. `hashicorp/golang-lru`).

---

## 2. Module map

Quick reference; full reviews in the synthesis chat output.

```
internal/
├── api/             # Boot manifest endpoint, /health, /stats, response envelopes
├── auth/            # Sessions, login/logout, RBAC middleware, page-based auth, user CRUD
├── cms/             # The big one — content services, themes, extensions, public site, admin handlers
│   ├── field_types/ # 20-type built-in registry (consumed by admin UI + MCP)
│   ├── content_svc.go, node_handler.go, node_type_*.go
│   ├── taxonomy_*.go, term_handler.go
│   ├── block_type_*.go, layout_*.go, layout_block_*.go, template_*.go
│   ├── menu_*.go, language_*.go
│   ├── media_*.go, file_browser.go         (mostly dead; see §1.1)
│   ├── theme_*.go, theme_assets.go
│   ├── extension_*.go, plugin_manager.go, public_proxy.go
│   ├── public_handler.go (1524 LOC - public site rendering)
│   ├── render_context.go (TemplateData builder)
│   ├── settings_handler.go, wellknown.go
│   ├── slug.go, mcp_render.go
│   └── cache_handler.go, admin_handler.go (dead code; see §1.1)
├── config/          # env-driven Config struct
├── coreapi/         # The kernel API surface: interface + capability guard + 3 backends
│   ├── api.go (interface + types)
│   ├── capability.go (guard wrapper)
│   ├── context.go (CallerInfo plumbing)
│   ├── errors.go (sentinels + APIError)
│   ├── impl.go, impl_*.go (Go implementations)
│   ├── grpc_server.go, grpc_client.go (gRPC bridge for plugins)
│   └── tengo_adapter.go (Tengo modules)
├── db/              # Connection, migration runner, seed
├── email/           # Dispatcher, rules, logs, templates
├── events/          # Pub/sub bus
├── mcp/             # MCP server (28 files)
├── models/          # 28 GORM models
├── rbac/            # Role admin handler
├── rendering/       # html/template renderer
├── scripting/       # Tengo VM wrapper, script callbacks, HTTP route mounting
└── sdui/            # SDUI engine + SSE broadcaster + types

cmd/vibecms/         # main.go (boot wiring, route registration)
pkg/plugin/          # HashiCorp go-plugin contract + proto
proto/               # .proto files for plugin and CoreAPI
```

---

## 3. Common workflows

### 3.1 Adding a new CoreAPI method

The CoreAPI is the single contract that gRPC plugins, Tengo scripts, and internal callers all consume.

Steps:
1. **Add to interface** (`internal/coreapi/api.go`):
   ```go
   GetSomething(ctx context.Context, id uint) (*Something, error)
   ```
2. **Add capability check** (`internal/coreapi/capability.go`):
   ```go
   func (g *capabilityGuard) GetSomething(ctx context.Context, id uint) (*Something, error) {
       if err := checkCapability(ctx, "somethings:read"); err != nil { return nil, err }
       return g.inner.GetSomething(ctx, id)
   }
   ```
3. **Implement** in a domain `impl_*.go` (e.g. `impl_somethings.go`):
   ```go
   func (c *coreImpl) GetSomething(ctx context.Context, id uint) (*Something, error) {
       var m models.Something
       if err := c.db.WithContext(ctx).First(&m, id).Error; err != nil { return nil, NewNotFound("something", id) }
       return somethingFromModel(&m), nil
   }
   ```
   **Use `c.db.WithContext(ctx)`** — most existing impls fail to do this. Fix as you write new ones.
4. **Add proto** (`proto/coreapi/vibecms_coreapi.proto`):
   ```proto
   rpc GetSomething(GetSomethingRequest) returns (SomethingResponse);
   message GetSomethingRequest { uint64 id = 1; }
   ```
   Regenerate via `make proto` (or whatever the build target is).
5. **Add gRPC server method** (`internal/coreapi/grpc_server.go`):
   ```go
   func (s *GRPCHostServer) GetSomething(ctx context.Context, req *pb.GetSomethingRequest) (*pb.SomethingResponse, error) {
       sth, err := s.api.GetSomething(s.ctx(ctx), uint(req.Id))
       if err != nil { return nil, grpcError(err) }
       return &pb.SomethingResponse{Something: somethingToProto(sth)}, nil
   }
   ```
6. **Add gRPC client method** (`internal/coreapi/grpc_client.go`) — for plugins to call back into kernel.
7. **Add Tengo module function** (`internal/coreapi/tengo_adapter.go`) under the appropriate `core/<domain>` module.
8. **Register the new capability constant** (when capability registry exists; today it's just strings).
9. **Test the capability check**: granted, denied, missing-context paths.

### 3.2 Adding a new model

1. **Migration**: add `internal/db/migrations/00NN_<descriptive>.sql`. Use `IF NOT EXISTS`. Add CHECK constraints for enum-shaped columns. Add indexes for FK columns and WHERE/ORDER BY columns.
2. **Model**: add `internal/models/<entity>.go`. Use explicit `gorm:"column:..."` tags. Define `TableName() string`. Hide secrets with `json:"-"`.
3. **Seed defaults** (if applicable): add a `seedX` function in `internal/db/seed.go` (or wherever the seed package lands after the recommended split).
4. **Verify schema/model parity**: compile and test that auto-migrate finds no missing columns.

### 3.3 Adding an admin endpoint

1. **Define request DTO** (typed struct, no model binding):
   ```go
   type createXRequest struct { Name string `json:"name"`; … }
   ```
2. **Build handler with auth + capability**:
   ```go
   func (h *XHandler) RegisterRoutes(router fiber.Router) {
       g := router.Group("/x", auth.CapabilityRequired("manage_x"))
       g.Get("/", h.List)
       g.Post("/", h.Create)
       …
   }
   ```
3. **Validate input**: required fields, enum values, length limits.
4. **For Update endpoints**, strip mass-assignable fields explicitly:
   ```go
   delete(body, "id"); delete(body, "created_at"); delete(body, "updated_at"); delete(body, "is_system")
   ```
5. **Return via `api.Success` / `api.Created` / `api.ValidationError` / `api.Error`** (defined in `internal/api/response.go`) — never bare JSON.
6. **Wire into `main.go`** with the rest of the admin routes (under `adminAPI`).
7. **Emit lifecycle events** for entity create/update/delete so SDUI broadcaster picks them up (`<entity>.<op>` action shape).

### 3.4 Adding a migration

- Filename: `00NN_<snake_descriptive>.sql`. Strict numeric ordering.
- Always idempotent: `IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`.
- One change per file (data and schema separated, but the runner doesn't enforce).
- For NOT NULL columns: always provide `DEFAULT`. For text[] / JSONB: provide `DEFAULT '{}'` / `'[]'`.
- Indexes on large tables: prefer `CREATE INDEX CONCURRENTLY` — but the runner currently wraps every migration in a transaction, which Postgres rejects for concurrent index creation. **TODO** for the runner: support a `-- migrate:no-tx` directive.
- **Reversibility**: there is currently no down-migration support. Until that infrastructure is added, every migration must be designed so a failed deploy can be hand-rolled back.

### 3.5 Adding a capability

Capabilities today are loose strings. Until a registry is added, follow this pattern:
- Use `<domain>:<verb>` shape: `nodes:read`, `media:write`, `events:emit`.
- Add to the appropriate role's `capabilities` JSONB in `internal/db/seed.go::seedRoles`.
- Wrap every CoreAPI method that reads/writes the new domain in `capability.go`.
- Document the capability in the extension manifest schema (so extension authors know to declare it).

### 3.6 Adding an event

Publishing:
```go
if h.eventBus != nil {
    go h.eventBus.Publish("widget.updated", events.Payload{
        "id":           widget.ID,
        "widget_slug":  widget.Slug,
    })
}
```
**Always nil-check** `eventBus`. Use `Publish` for fire-and-forget; `PublishSync` only when you need delivery confirmation (and accept blocking risk); `PublishCollect` only for sync-result patterns like `{{event "..."}}`.

Action shape: `<entity>.<op>` so the SDUI broadcaster automatically routes it as `ENTITY_CHANGED`. Special prefixes (`theme.`, `setting.`, etc.) trigger NAV_STALE / SETTING_CHANGED instead.

Subscribing (kernel-internal):
```go
eventBus.Subscribe("widget.updated", func(action string, payload events.Payload) { ... })
```
**Be aware**: there is currently no `Unsubscribe`. Plan for a permanent subscription. (This is a known gap; until fixed, avoid Subscribing in any code path that runs on hot-reload.)

### 3.7 Adding an MCP tool

In `internal/mcp/tools_<domain>.go`:
```go
func (s *Server) registerWidgetTools() {
    s.addTool(mcp.NewTool("core.widgets.get",
        mcp.WithDescription("Fetch a widget by ID."),
        mcp.WithString("id", mcp.Required(), mcp.Description("Widget ID."))),
        "read",  // class: read | content | full
        func(ctx context.Context, args map[string]any) (any, error) {
            id := mustInt(args["id"])
            w, err := s.deps.CoreAPI.GetWidget(coreapi.WithCaller(ctx, coreapi.InternalCaller()), uint(id))
            if err != nil { return nil, err }
            return w, nil
        })
}
```
Then call `s.registerWidgetTools()` from `New(deps)`.

`addTool` automatically wires:
- Scope×class gate (`scopeAllows`).
- Per-token rate limiter.
- Audit log.
- Panic recovery.

**`coreapi.InternalCaller()`** is intentional — MCP enforces access via scope×class, not the kernel capability guard.

---

## 4. Boot sequence

`cmd/vibecms/main.go` orchestrates startup. Order matters; keep it documented when you add to it.

```
1. Load config.
2. Connect DB → run migrations → run SeedIfEmpty.
3. Create event bus.
4. Create SDUI engine + broadcaster (broadcaster subscribes to bus).
5. Build Fiber app with global middleware (logger, recover, CORS).
6. Construct services (sessions, content, node-types, languages, blocks, layouts, templates, menus, themes, etc).
7. Build asset registries; load block assets from DB.
8. Construct theme loader (DON'T load yet).
9. Build CoreAPI implementation (currently passes nil mediaSvc — flag for fix).
10. Construct script engine.
11. Scan extensions → for each active extension: run migrations, load scripts.
12. Construct render context, public handler.
13. Register all admin routes (under /admin/api with AuthRequired).
14. Construct MCP server, mount.
15. Start gRPC plugin manager → for each active extension: start plugins, publish extension.activated.
16. Wire email send func to plugin dispatch.
17. Activate theme (LoadTheme + LoadThemeScripts + PurgeInactiveThemes).
18. Mount static asset routes (/admin/assets, /admin/shims, /theme/assets, /extensions/<slug>/blocks).
19. Mount public-extension proxy.
20. Mount script HTTP routes + .well-known + public catch-all (LAST).
21. Start Listen in goroutine.
22. Wait for SIGINT/SIGTERM → app.Shutdown.
```

**Why theme load is last**: extensions must be subscribed before `theme.activated` fires so they can react (e.g. media-manager importing theme assets).

**Why public catch-all is last**: every other route (auth, admin API, static, well-known, extension public routes, script routes) takes precedence over the slug-lookup `GET /*`.

---

## 5. Subsystem deep dives

### 5.1 Auth flow

| URL | Handler |
|---|---|
| `POST /auth/login` | JSON API; returns session cookie + `{user_id, email, role}`. |
| `POST /auth/logout` | Auth-required; deletes session row, clears cookie. |
| `GET /me` | Auth-required; returns user + capabilities. |
| `POST /auth/login-page` | Form-based; redirects with flash cookies. |
| `POST /auth/register` | Form-based; **creates editor-role users — needs fix** (default to member). |
| `POST /auth/forgot-password` | **Stub — implement properly.** |
| `POST /auth/reset-password` | **Stub — implement properly.** |
| `GET /logout` | **CSRF-vulnerable — change to POST.** |

Sessions: 32-byte random hex, SHA-256 hashed at rest. Cookie `vibecms_session`, HttpOnly, SameSite=Lax, Secure when TLS. **Schedule `sessionSvc.CleanExpired` to run hourly** — currently never called.

### 5.2 Capability check flow

```
HTTP request → AuthRequired middleware → user in c.Locals
            → handler calls auth.HasCapability(user, "manage_X") OR
              CoreAPI.SomeMethod(ctx) where ctx has caller info
            → coreapi.checkCapability(ctx, "X:read")
                → CallerFromContext(ctx)
                    → if Type == "internal" → ALLOW (bypass)
                    → else if caller.Capabilities[cap] → ALLOW
                    → else → ErrCapabilityDenied
```

⚠️ The capability guard wraps the inner CoreAPI when constructed via `NewCapabilityGuard(inner)`. **Currently this wrapping is missing in `main.go:164` and the guard is bypassed for all extensions/themes/scripts.** Highest-priority fix.

### 5.3 Render pipeline

For a public page request to `/<lang>/<slug>`:

```
PublicHandler.PageByFullURL
  → DB lookup: WHERE full_url = ? AND status='published' AND deleted_at IS NULL
  → 404 fallback if not found
  → Resolve layout (by layout_slug → layouts row, fallback to default)
  → Build TemplateData{App, Node, User} via RenderContext
      → BuildAppData: settings, languages, current_lang, head/foot scripts, block CSS/JS
      → BuildNodeData: node fields with theme-asset refs resolved, blocks rendered
      → LoadMenus: 2 queries total + batch node URL fetch
  → Render blocks one by one (cached by content_hash if cache_output=true)
  → RenderLayout with renderLayoutBlock template func (max 5 levels recursion)
  → Set Content-Type: text/html, Send
```

Cache invalidation: `PublicHandler.SubscribeAll` clears caches on prefix-matched events (`theme.`, `setting.`, `block_type.`, `language.`, `layout`).

### 5.4 Extension lifecycle

```
Activate:
  1. UPDATE extensions SET is_active = true WHERE slug = ?
  2. Run pending SQL migrations (cms.RunExtensionMigrations).
  3. Load extension blocks into theme asset registry.
  4. Start plugin processes (PluginManager.StartPlugins).
  5. Load extension scripts (ScriptEngine.LoadExtensionScripts).
  6. Publish extension.activated event.
  7. Replay theme.activated for the new extension's benefit.

Deactivate:
  1. UPDATE extensions SET is_active = false WHERE slug = ?
  2. Stop plugin processes (PluginManager.StopPlugins).
  3. Unload extension scripts.
  4. Publish extension.deactivated event.
```

Plugin processes: spawned via `exec.Command(binaryPath)` with HashiCorp `go-plugin`. **Binaries are unsigned.**

### 5.5 Plugin gRPC contract

The kernel and plugin talk over two gRPC services that share a single connection:

```
Kernel ←─ ExtensionPlugin (proto/plugin/vibecms_plugin.proto) ──→ Plugin
       (HandleEvent, HandleHTTPRequest, GetSubscriptions, Shutdown, Initialize)

Kernel ──→ VibeCMSHost (proto/coreapi/vibecms_coreapi.proto) ←── Plugin
        (60 CoreAPI methods)
```

`Initialize` is what wires up the bidirectional path: kernel passes the plugin a broker ID, plugin dials back to call `VibeCMSHost`.

When adding plugin-side calls into the kernel, the plugin must use the connection from `Initialize` — this is the only path that gets the per-extension `CallerInfo` in the kernel's context.

---

## 6. Security checklist for every change

Before opening a PR that touches kernel code, verify each:

- [ ] **Capability gate** on every admin endpoint that mutates state. `auth.CapabilityRequired("manage_X")`.
- [ ] **DTO** for body parsing — no `c.BodyParser(&model)` or `c.BodyParser(&map[string]interface{})` without explicit field strip.
- [ ] **Mass-assignment safe**: protected fields (`id`, `created_at`, `is_system`, `role_id` for non-admins, etc.) explicitly stripped or absent from DTO.
- [ ] **Validation**: enum fields checked against whitelist; required fields non-empty; lengths bounded.
- [ ] **Constant-time compare** for any secret check (`crypto/subtle.ConstantTimeCompare`).
- [ ] **No URL injection**: scheme allowlist, no leading-wildcard ILIKE on indexed columns, no raw-SQL fragment from user input.
- [ ] **No CRLF in headers**: strip `\r\n` from any user-supplied value before writing to a header (HTTP, SMTP, etc.).
- [ ] **Path-traversal defense** on any FS read with user-supplied path: `filepath.Clean` + prefix check against absolute base.
- [ ] **Context propagation**: handlers pass `c.UserContext()` (Fiber) or request-derived ctx through the chain. Don't bury `context.Background()`.
- [ ] **Error wrapping**: `fmt.Errorf("...: %w", err)` with operation context.
- [ ] **No silent json.Marshal**: `if b, err := json.Marshal(x); err != nil { return err }` not `b, _ := ...`.
- [ ] **Defer-safe**: don't call `log.Fatalf` in code paths that have meaningful defers — `os.Exit` skips them. Return errors instead.
- [ ] **No new file > 500 LOC**.
- [ ] **CSRF**: state-changing endpoints either require a CSRF token OR rely on `SameSite=Strict` cookies + JSON-only Content-Type validation.
- [ ] **Rate limit** on auth-adjacent endpoints (login, register, password-reset, webhook).
- [ ] **Tests** for the new code path (capability denied, invalid input, success). Currently nearly absent — every new test moves the needle.

---

## 7. Production safety checklist (config)

Block the kernel from booting in `APP_ENV=production` when any of these are unsafe:

```go
// In config.Load() — RECOMMENDED ADDITION (not currently present)
if cfg.AppEnv == "production" {
    var problems []string
    if cfg.SessionSecret == "" { problems = append(problems, "SESSION_SECRET unset") }
    if cfg.MonitorBearerToken == "" { problems = append(problems, "MONITOR_BEARER_TOKEN unset") }
    if cfg.DBPassword == "vibecms_secret" { problems = append(problems, "DB_PASSWORD is the default") }
    if cfg.DBSSLMode == "disable" { problems = append(problems, "DB_SSLMODE=disable") }
    if os.Getenv("CORS_ORIGINS") == "" { problems = append(problems, "CORS_ORIGINS unset") }
    if len(problems) > 0 {
        log.Fatalf("refusing to start in production with unsafe defaults: %v", problems)
    }
}
```

This is the single most impactful change for deployment safety.

---

## 8. Testing strategy

The kernel ships with **1 test file** (`internal/scripting/engine_test.go`). The testing void is the largest single risk in the codebase. Until coverage exists, every refactor risks silent regressions.

### Minimum viable test pyramid (priority order)

1. **Capability guard** (`internal/coreapi/capability_test.go`):
   - Table-driven: every interface method × {internal, granted, denied, missing-context}. ~240 cases.
   - Asserts each method correctly delegates or denies.
   - This is the most security-critical 432 LOC in the codebase. **Untested today.**

2. **Migration + seed** integration test:
   - Spin a fresh Postgres via `testcontainers-go`.
   - Run all 37 migrations.
   - Run `Seed`.
   - Assert: every model loads, admin user exists, all roles seeded, homepage exists, every menu has its items.

3. **Auth flows** (smoke tests already exist; expand):
   - Login → /me → logout.
   - Self-registration produces correct role.
   - Password change rotates sessions.
   - Failed login does not leak account existence (timing).
   - CSRF: state-changing endpoint without token rejected.
   - Rate limit: 6th login attempt within window is throttled.

4. **Event bus** (`internal/events/bus_test.go`):
   - Publish runs subscribers async.
   - PublishSync blocks until all return.
   - PublishCollect returns ordered non-empty results.
   - Panic in handler doesn't kill bus.
   - Concurrent Subscribe + Publish under `-race`.
   - **Add Unsubscribe** then test it.

5. **Renderer** (`internal/rendering/renderer_test.go`):
   - FuncMap behavior: `safeHTML` does not escape; `dict` requires even args; `mod 0` returns 0.
   - Cache hit/miss correctness.
   - `RenderLayout` recursion limit.
   - Concurrent rendering under `-race`.
   - safeURL allowing `javascript:` (regression guard once fixed).

6. **CoreAPI implementations** — per-domain table tests (happy path + capability denied + invalid input).

7. **Public site** — integration tests for 200/404/redirect/lang fallback/draft hiding/cache invalidation.

8. **MCP** — scope×class matrix, rate limiter, audit log writes.

9. **Plugin contract** — handshake conformance against a stub binary.

Target: 80% coverage per backend standards.

### Test conventions

- Test files: `_test.go` suffix in the same package.
- Integration tests requiring DB/HTTP: `//go:build integration` tag.
- Use `testify` for assertions only if already imported (currently not used — stick to stdlib `testing` until added).
- Race detector: `go test ./... -race` in CI.

---

## 9. Common pitfalls (real, observed)

### 9.1 The unguarded CoreAPI
`main.go:164` constructs `coreImpl` directly and passes it to `mcpServer`, gRPC host server factory, and script engine — **not** wrapped in `NewCapabilityGuard`. Every extension and theme bypasses capability checks.

### 9.2 `_ context.Context` everywhere in `impl_*.go`
13 of 15 files take `_ context.Context` and discard it. DB calls don't honor cancellation. When fixing, use `c.db.WithContext(ctx)`.

### 9.3 `b, _ := json.Marshal(x)`
Common pattern in `impl_taxonomies.go`, `impl_nodes.go`, `impl_nodetypes.go`, etc. Silent error. Replace with proper handling.

### 9.4 `log.Fatalf` inside a function that returns an error
`internal/db/postgres.go::Connect` — calls `log.Fatalf` on every error path before returning, making the error return dead code. Fix by removing `log.Fatalf` and letting the caller decide.

### 9.5 Mass assignment via `c.BodyParser(&map[string]interface{})`
Several Update handlers parse to a map, then pass to `db.Updates(body)`. Without explicit field stripping, clients can write any column. Use a typed DTO.

### 9.6 Filter `unsub` pointer compare on copies
`impl_filters.go:31-42` — `&e.handler == &entry.handler` where `e` is a range-loop copy. Never matches. Filters never unregister. Fix: index-based compare, or opaque ID at register time.

### 9.7 Event handler subscribe-on-every-load
`scripting/engine.go::subscribeEventHandlers` re-subscribes ALL handlers on every load. Combined with bus having no Unsubscribe, dispatch multiplies on every reload.

### 9.8 `tmpl.Funcs(fullFuncMap)` after Parse, before Execute
`rendering/template_renderer.go::RenderParsed` mutates a parsed template's FuncMap on the cache-miss path. Concurrent calls race. Fix: clone after Parse.

### 9.9 Cache key = full template source
`renderer.RenderParsed`, `public_handler.go::renderBlock`. Map keys grow linearly with template size. Use `sha256(content)[:16]` or `ContentHash` from the model.

### 9.10 SubscribeAll handler captures privileged data
Email dispatcher uses `eventBus.SubscribeAll`. Any code path that subscribes-all sees `email.send` payloads (with `to`, `subject`, `html`). Be extremely careful adding new SubscribeAll handlers; consider a private channel for sensitive events.

### 9.11 `os.Exit` paths skip defers
`log.Fatalf` calls `os.Exit(1)`, which does NOT run deferred functions. The `defer pluginManager.StopAll()` in `main.go:262` doesn't run on fatal startup or shutdown errors → plugin processes leaked. Use `os.Exit(1)` after explicit cleanup.

### 9.12 `app.Shutdown()` has no timeout
`app.Shutdown()` blocks until all in-flight requests finish. SSE streams or hung MCP calls block forever. Use `app.ShutdownWithTimeout(30 * time.Second)`.

### 9.13 SMTP STARTTLS downgrade
`internal/email/smtp.go:85` — only upgrades if server advertises STARTTLS. MITM stripping the advertisement gets plaintext. Add `email_smtp_require_tls` setting.

### 9.14 No retention on log tables
`mcp_audit_log`, `email_logs`, `content_node_revisions`, `sessions` (after expiry) — none have TTL. Linear growth. Add scheduled cleanup.

### 9.15 `is_encrypted` flag is decorative
Schema supports the flag, no encryption code. Either implement (AES-GCM with master key in env) or remove the flag.

---

## 10. Where to find things (reference)

| I want to... | Look at |
|---|---|
| See full request/response wire format | `proto/coreapi/vibecms_coreapi.proto`, `proto/plugin/vibecms_plugin.proto` |
| Understand the boot order | `cmd/vibecms/main.go` (top to bottom is the order) |
| Find the capability for a method | `internal/coreapi/capability.go` |
| Find where an action is published | `grep -rn '\.Publish(' internal/` |
| Find an admin endpoint's handler | Each handler's `RegisterRoutes` is mounted in `main.go:212-237` |
| Add seed data | `internal/db/seed.go` (planned to be split into `internal/db/seed/`) |
| See SDUI layout for an admin page | `internal/sdui/engine.go` — search for `<page>Layout(...)` |
| See MCP tool definitions | `internal/mcp/tools_<domain>.go` |
| See built-in field types | `internal/cms/field_types/registry.go` |
| Trace public request rendering | `PublicHandler.PageByFullURL` → `RenderContext.BuildNodeData` → block render loop → `RenderLayout` |
| See the kernel's atomic-update pattern | `cmd/vibecms/theme_assets_resolver.go` (only `atomic` use) |

---

## 11. Suggested PR template

```markdown
## What
<one-line summary>

## Why
<motivation>

## Affected modules
- internal/<package>: <brief>

## Capability impact
- New capability: <name> (or "none")
- Affected role defaults: <admin/editor/author/member or "none">

## Migration
- 00NN_<name>.sql: <yes/no>

## Backward compatibility
- Breaking proto change: <yes/no>
- Breaking API change: <yes/no>

## Tests
- [ ] Unit tests pass
- [ ] Race detector pass
- [ ] go vet clean
- [ ] golangci-lint clean
- [ ] Coverage on new code: <%>

## Security checklist (§6)
- [ ] Capability gate
- [ ] DTO for body parsing
- [ ] Constant-time secret compare
- [ ] Path-traversal defense (if FS access)
- [ ] No new file > 500 LOC
- [ ] No log.Fatalf in functions returning error
```

---

## 12. Roadmap-shaped fixes (for kernel maintainers)

In rough priority:

**Phase 1 — Critical security**
1. Wrap CoreAPI with `NewCapabilityGuard` for gRPC + Tengo.
2. Default registration to `member`; add `allow_registration` setting.
3. Implement password reset properly (or remove the form).
4. Block self-promotion in UpdateUser + lock down RoleHandler.Update.
5. `config.Load` production safety guards.

**Phase 2 — Correctness**
6. Set `node.AuthorID = currentUser.ID` on Create.
7. Validate `status` and `node_type` in node Update.
8. Apply access filter to `Search`.
9. Fix filter unsubscribe (`impl_filters.go:31-42`).
10. Add Unsubscribe to event bus + plumb through scripting + Subscribe sites.
11. Bounded SSE buffer with drop-on-full.
12. CSRF tokens on form POSTs + admin API.
13. Rate limiting + account lockout on auth.

**Phase 3 — Hygiene**
14. Encrypt at rest: `Theme.GitToken`, `is_encrypted` settings, secret extension settings.
15. Move SMTP/Resend providers out of core.
16. Move `image_url`/`image_srcset` template helpers into media-manager extension.
17. Delete dead handler code (`admin_handler.go`, `media_handler.go`, duplicate handlers in `node_handler.go`).
18. Split files past 500 LOC.
19. Plugin binary signing.
20. Retention crons for `mcp_audit_log`, `email_logs`, `content_node_revisions`, expired `sessions`.

**Phase 4 — Operational**
21. Structured logger with levels, JSON output, correlation IDs.
22. `app.ShutdownWithTimeout` and defer-safe error paths.
23. Bounded LRU caches across renderer, public_handler, menu_svc, etc.
24. HMAC validation for theme webhook (GitHub/GitLab signature).
25. Constant-time bearer compare (`/stats`, theme webhook).

**Phase 5 — Test pyramid**
Coverage of capability guard, auth flows, event bus, renderer, public site, MCP, plugin contract — see §8.

Each phase is independently shippable and the order can be reordered based on production deployment urgency.
