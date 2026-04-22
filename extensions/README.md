# Extensions

## Overview

Extensions are self-contained feature packages that add functionality to VibeCMS without modifying the core kernel. Every feature beyond basic content management lives in an extension — media management, email delivery, form handling, sitemap generation, and more.

There are two flavors:

| Flavor | What it is | Best for |
|--------|-----------|----------|
| **gRPC plugin** | Compiled Go binary communicating over gRPC | Complex logic, database tables, admin UI, HTTP endpoints |
| **Tengo-only** | `.tgo` scripts running in a sandboxed VM | Event listeners, lightweight hooks, email providers |

Most real-world extensions are **gRPC plugins with optional Tengo scripts**. The Tengo scripts handle event hooks and route registration, while the Go binary handles HTTP requests and database operations. Some extensions (like `resend-provider`) are Tengo-only — no compiled binary needed.

The core kernel provides infrastructure only: content nodes, authentication, rendering, and the extension system itself. Extensions own their full stack — business logic, database tables, admin UI, and public endpoints.

---

## Directory Structure

The standard layout for a full-featured extension:

```
extensions/my-extension/
  extension.json          # Manifest — describes capabilities, plugins, UI, routes
  cmd/
    plugin/
      main.go             # Go plugin source (gRPC plugin binary)
  bin/
    my-extension          # Compiled binary (output of Go build)
  admin-ui/
    src/
      index.tsx           # React micro-frontend entry point
    dist/
      index.js            # Built ES module (output of Vite build)
    vite.config.ts
    package.json
  scripts/
    extension.tengo       # Tengo entry point — loaded on activation
    handlers/
      my_handler.tengo    # Event/route handler scripts
  migrations/
    20250101_init.sql     # SQL migrations — run on activation
  blocks/
    my-block/
      view.html           # Block view template
      edit.html           # Block editor template
      block.json          # Block schema definition
  templates/
    my-template.json      # Page template definitions
  assets/
    images/
      banner.jpg          # Extension-owned media assets
  preview.svg             # Extension preview image for admin UI
```

Minimal extensions can omit most of these. A Tengo-only extension only needs:

```
extensions/my-extension/
  extension.json
  scripts/
    extension.tengo
```

---

## Manifest (`extension.json`)

The manifest declares everything about your extension — its identity, required permissions, plugin binaries, admin UI, public routes, and more.

### Full Schema

```json
{
  "name":             "string  — Human-readable name",
  "slug":             "string  — Unique identifier (kebab-case, must match directory name)",
  "version":          "string  — Semantic version (e.g. '1.0.0')",
  "author":           "string  — Author name or organization",
  "description":      "string  — Short description shown in admin UI",
  "priority":         "int     — Loading order (lower = earlier). Default: 50",
  "provides":         "string[] — Feature tags this extension supplies (e.g. ['email.provider'])",
  "capabilities":     "string[] — Required permissions (enforced at every CoreAPI call)",
  "plugins":          "object[] — gRPC plugin binaries to start",
  "admin_ui":         "object  — React micro-frontend definition",
  "settings_schema":  "object  — Settings fields for the extension",
  "blocks":           "object[] — Content block type definitions",
  "templates":        "object[] — Page template definitions",
  "layouts":          "object[] — Layout definitions",
  "partials":         "object[] — Partial definitions",
  "public_routes":    "object[] — Public (unauthenticated) routes to proxy",
  "assets":           "object[] — Media assets owned by this extension"
}
```

### Capabilities

Every CoreAPI call is guarded by capability checks. Declare exactly what your extension needs — requesting more than necessary is a code smell.

| Capability | Allows |
|-----------|--------|
| `nodes:read` | Get, query, list taxonomy terms |
| `nodes:write` | Create, update nodes |
| `nodes:delete` | Delete nodes |
| `nodetypes:read` | Get, list node types |
| `nodetypes:write` | Register, update, delete node types and taxonomies |
| `settings:read` | Get settings |
| `settings:write` | Set settings |
| `events:emit` | Emit events |
| `events:subscribe` | Subscribe to events |
| `email:send` | Send emails |
| `menus:read` | Get menus |
| `menus:write` | Create, update menus |
| `menus:delete` | Delete menus |
| `routes:register` | Register/remove Tengo HTTP routes |
| `filters:register` | Register filters |
| `filters:apply` | Apply filters |
| `media:read` | Get, query media |
| `media:write` | Upload media |
| `media:delete` | Delete media |
| `users:read` | Get, query users |
| `http:fetch` | Make outbound HTTP requests |
| `log:write` | Write to the log |
| `data:read` | DataGet, DataQuery |
| `data:write` | DataCreate, DataUpdate, DataExec |
| `data:delete` | DataDelete |
| `files:write` | StoreFile |
| `files:delete` | DeleteFile |

### Complete Example Manifest

Here's a real-world manifest for the **Media Manager** extension:

```json
{
  "name": "Media Manager",
  "slug": "media-manager",
  "version": "1.0.0",
  "author": "VibeCMS",
  "description": "Upload, organize, and manage media files. Supports images, documents, and other file types.",
  "provides": ["media"],
  "capabilities": [
    "media:read",
    "media:write",
    "media:delete",
    "data:read",
    "data:write",
    "files:write",
    "files:delete",
    "settings:read",
    "settings:write",
    "events:emit",
    "log:write"
  ],
  "plugins": [
    {
      "binary": "bin/media-manager",
      "events": []
    }
  ],
  "public_routes": [
    {"method": "GET", "path": "/media/cache/*"},
    {"method": "GET", "path": "/media/*"}
  ],
  "admin_ui": {
    "entry": "admin-ui/dist/index.js",
    "routes": [
      {"path": "/", "component": "MediaLibrary"},
      {"path": "/optimizer", "component": "ImageOptimizerSettings"}
    ],
    "menu": {
      "label": "Media",
      "icon": "Image",
      "position": "3"
    },
    "settings_menu": [
      {"label": "Image Optimizer", "route": "/admin/ext/media-manager/optimizer", "icon": "ImageDown"}
    ],
    "field_types": [
      {
        "type": "media",
        "label": "Media Selector",
        "description": "Select files from media library",
        "icon": "Image",
        "group": "Media",
        "component": "MediaFieldInput",
        "supports": ["image", "gallery", "file"]
      }
    ]
  }
}
```

### Manifest Fields in Detail

#### `plugins`

Each entry starts one gRPC plugin process:

```json
"plugins": [
  {
    "binary": "bin/my-extension",   // Path relative to extension directory
    "events": ["email.send"]         // Event names to subscribe to (optional hint)
  }
]
```

The `events` field is informational — actual subscriptions are returned by the plugin's `GetSubscriptions()` RPC at runtime.

#### `admin_ui`

Describes the React micro-frontend loaded into the admin SPA shell:

```json
"admin_ui": {
  "entry": "admin-ui/dist/index.js",
  "slots": {
    "email-settings": {
      "component": "SmtpSettings",
      "label": "SMTP"
    }
  },
  "routes": [
    {"path": "/", "component": "Dashboard"},
    {"path": "/edit/:id", "component": "Editor"}
  ],
  "menu": {
    "label": "My Extension",
    "icon": "Package",
    "position": "5",
    "section": "content",
    "children": [
      {"label": "All Items", "route": "/admin/ext/my-extension/"},
      {"label": "Settings", "route": "/admin/ext/my-extension/settings"}
    ]
  },
  "settings_menu": [
    {"label": "My Settings", "route": "/admin/ext/my-extension/settings", "icon": "Settings"}
  ],
  "field_types": [
    {
      "type": "my_selector",
      "label": "My Custom Selector",
      "description": "Select items from my extension",
      "icon": "List",
      "group": "Custom",
      "component": "MyFieldInput"
    }
  ]
}
```

- **`entry`**: Path to the built ES module (relative to extension directory).
- **`slots`**: Named UI injection points. The key (e.g. `"email-settings"`) matches a slot defined by another extension's admin UI. This is how `smtp-provider` and `resend-provider` inject their settings into `email-manager`.
- **`routes`**: SPA routes registered under `/admin/ext/{slug}/`. The `path` is relative to that prefix.
- **`menu`**: Sidebar menu entry. `section` can be `"content"` (default), `"design"`, `"development"`, or `"settings"`. Set to `null` to hide from sidebar (useful for slot-only extensions).
- **`settings_menu`**: Links that appear in the global Settings area of the admin UI.
- **`field_types`**: Custom field types registered for use in node type schemas.

#### `settings_schema`

Defines configuration fields that the admin UI can render automatically:

```json
"settings_schema": {
  "host": {"type": "string", "label": "SMTP Host", "required": true},
  "port": {"type": "number", "label": "SMTP Port", "default": 587},
  "password": {"type": "string", "label": "Password", "sensitive": true},
  "encryption": {"type": "string", "label": "Encryption", "enum": ["none", "tls", "starttls"], "default": "tls"}
}
```

Supported field types: `"string"`, `"number"`, `"boolean"`. Use `"sensitive": true` for passwords and API keys.

#### `public_routes`

Routes that bypass authentication and are proxied directly to the extension's gRPC plugin:

```json
"public_routes": [
  {"method": "POST", "path": "/forms/submit/*"},
  {"method": "GET", "path": "/media/cache/*"}
]
```

These are registered on the public Fiber app without any auth middleware. The plugin's `HandleHTTPRequest` RPC receives the full request.

#### `blocks`, `templates`, `layouts`, `partials`

Extensions can provide content blocks and templates just like themes:

```json
"blocks": [
  {"slug": "vibe-form", "dir": "vibe-form"}
]
```

Each block lives in `blocks/{dir}/` with `view.html`, `edit.html`, and `block.json`. See the `content-blocks` extension for a full reference with 40 block types.

#### `assets`

Extension-owned media files that get imported into the media library on activation:

```json
"assets": [
  {
    "key": "demo-banner",
    "src": "images/demo-banner.jpg",
    "alt": "Hello extension demo banner"
  }
]
```

Reference these in templates using `extension-asset:{slug}:{key}` (see [Asset References](#asset-references)).

---

## Building Extensions

### Go Plugin Binary

Build the plugin as a statically-linked binary:

```bash
cd extensions/my-extension
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/my-extension ./cmd/plugin/
```

**Requirements:**

- **`CGO_ENABLED=0`** — Required. The plugin runs inside an Alpine-based Docker container that doesn't have glibc.
- **Static linking** — No CGO, no external dependencies.
- **HashiCorp go-plugin** — Your `main.go` must use `github.com/hashicorp/go-plugin` to serve the gRPC interface.

The Dockerfile automatically builds all built-in extensions. For development, you can build manually and restart the server.

#### Plugin Interface

Your Go binary must implement the `ExtensionPlugin` interface:

```go
type ExtensionPlugin interface {
    GetSubscriptions() ([]*pb.Subscription, error)
    HandleEvent(action string, payload []byte) (*pb.EventResponse, error)
    HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error)
    Shutdown() error
    Initialize(hostConn *grpc.ClientConn) error
}
```

- **`Initialize`** — Called once at startup. Use the `hostConn` to create a `VibeCMSHostClient` for calling back into CoreAPI.
- **`GetSubscriptions`** — Return the list of events this plugin wants to handle.
- **`HandleEvent`** — Called when a subscribed event fires.
- **`HandleHTTPRequest`** — Called for proxied admin API and public route requests.
- **`Shutdown`** — Called before the plugin process is killed. Clean up resources.

#### Minimal Plugin `main.go`

```go
package main

import (
    "context"
    "log"

    "github.com/hashicorp/go-plugin"
    "google.golang.org/grpc"

    pb "vibecms/pkg/plugin/proto"
    vibeplugin "vibecms/pkg/plugin"
    coreapipb "vibecms/pkg/plugin/coreapipb"
)

type MyPlugin struct {
    api coreapipb.VibeCMSHostClient
}

func (p *MyPlugin) Initialize(hostConn *grpc.ClientConn) error {
    p.api = coreapipb.NewVibeCMSHostClient(hostConn)
    log.Println("[my-extension] initialized with CoreAPI connection")
    return nil
}

func (p *MyPlugin) GetSubscriptions() ([]*pb.Subscription, error) {
    return []*pb.Subscription{
        {EventName: "node.published"},
    }, nil
}

func (p *MyPlugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
    log.Printf("[my-extension] event: %s", action)
    return &pb.EventResponse{}, nil
}

func (p *MyPlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
    return &pb.PluginHTTPResponse{
        StatusCode: 200,
        Headers:    map[string]string{"Content-Type": "application/json"},
        Body:       []byte(`{"status":"ok"}`),
    }, nil
}

func (p *MyPlugin) Shutdown() error {
    log.Println("[my-extension] shutting down")
    return nil
}

func main() {
    plugin.Serve(&plugin.ServeConfig{
        HandshakeConfig: vibeplugin.Handshake,
        Plugins: map[string]plugin.Plugin{
            "extension": &vibeplugin.ExtensionGRPCPlugin{
                Impl: &MyPlugin{},
            },
        },
        GRPCServer: plugin.DefaultGRPCServer,
    })
}
```

### Admin UI Frontend

Extension admin UIs are **isolated Vite builds** that output ES modules. They're loaded into the admin SPA shell via import maps.

#### Build Setup

```bash
cd extensions/my-extension/admin-ui
npm create vite@latest . -- --template react-ts
npm install
npm run build
```

#### Import Map Shims

Extensions import shared dependencies from `window.__VIBECMS_SHARED__` rather than bundling their own copies:

```typescript
// In your extension's code
import React from 'react'           // Resolved via import map to shared React
import { Button } from '@vibecms/ui' // Resolved via import map to shared UI lib
```

The admin shell provides these shared dependencies:
- `react`, `react-dom`, `react-router-dom`
- `@vibecms/ui` (shadcn/ui components)
- `@vibecms/api` (API client helpers)
- `@vibecms/icons` (Lucide icon components)

Configure Vite to externalize these:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom', '@vibecms/ui', '@vibecms/api', '@vibecms/icons'],
    },
  },
});
```

#### Route Registration

Your extension's routes are automatically mounted at `/admin/ext/{slug}/`. The `routes` in the manifest tell the admin shell which components to render:

```json
"routes": [
  {"path": "/", "component": "ItemList"},
  {"path": "/new", "component": "ItemEditor"},
  {"path": "/edit/:id", "component": "ItemEditor"}
]
```

The admin shell handles lazy-loading your extension's JS bundle when the user navigates to any of these paths.

### SQL Migrations

Place `.sql` files in `migrations/`. They run automatically when the extension is activated:

```
migrations/
  20250101_init.sql
  20250102_add_index.sql
```

**Naming convention:** Use a date prefix for ordering. Files are sorted alphabetically and applied once each.

**Requirements:**

- Each file runs as a single transaction.
- Migrations are tracked in the `extension_migrations` table — they only run once.
- Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for idempotency.
- Prefix table names with your extension's concern (e.g., `forms`, `form_submissions`) to avoid collisions.

Example migration:

```sql
-- Up
CREATE TABLE IF NOT EXISTS forms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    fields_schema JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);

-- Down (commented out — migrations are one-way)
-- DROP TABLE IF EXISTS forms;
```

---

## How Extensions Work

### gRPC Plugin Lifecycle

1. **Scan & Register** — On startup, the `ExtensionLoader` scans `extensions/`, reads every `extension.json`, and upserts records into the database. New extensions default to `is_active = false` (built-in extensions are auto-activated).

2. **Activation** — When activated (at boot for active extensions, or via admin UI):
   - SQL migrations run from `migrations/`
   - Tengo scripts load from `scripts/extension.tengo`
   - gRPC plugin processes start (each binary becomes a child process)
   - Block types, templates, layouts, and partials register
   - Public routes register on the Fiber app
   - `extension.activated` event fires
   - `theme.activated` event replays for the current active theme

3. **Runtime** — The plugin process stays alive. Core communicates via gRPC:
   - Events are delivered to `HandleEvent`
   - HTTP requests are proxied to `HandleHTTPRequest`
   - The plugin calls CoreAPI via the bidirectional `VibeCMSHost` gRPC service

4. **Deactivation** — When deactivated:
   - `extension.deactivated` event fires
   - Tengo scripts unload
   - Plugin processes stop (graceful `Shutdown()` then `Kill()`)
   - Block types, templates, layouts, partials unregister

5. **Crash Isolation** — If a plugin crashes, only that extension is affected. Other extensions and the core kernel continue operating.

### CoreAPI Access Patterns

Three adapters provide CoreAPI access from different contexts:

| Adapter | Context | How it works |
|---------|---------|--------------|
| **Internal** | Core Go code | Direct Go function calls — bypasses capability checks |
| **Tengo** | `.tgo` scripts | `core/*` modules in the Tengo VM — capability checks enforced |
| **gRPC** | Plugin binaries | `VibeCMSHost` gRPC service via GRPCBroker — capability checks enforced |

The `capabilityGuard` wraps every call. It extracts `CallerInfo` from context:
- `type: "internal"` → all capabilities granted
- `type: "grpc"` or `type: "tengo"` → only declared capabilities granted

### Extension HTTP Proxy

Admin API requests to `/admin/api/ext/{slug}/*` are proxied to the plugin's `HandleHTTPRequest` RPC:

```
Browser → /admin/api/ext/forms/submit → Fiber → PluginManager.GetClient("forms") → HandleHTTPRequest RPC
```

The plugin receives:
- `method` — HTTP method (GET, POST, etc.)
- `path` — Relative path after `/ext/{slug}` (e.g., `/submit`)
- `headers` — Request headers (Cookie and Authorization stripped)
- `body` — Raw request body
- `query_params` — Query string parameters
- `path_params` — Extracted path parameters (includes `"slug"`)
- `user_id` — Authenticated user ID (0 if not authenticated)

The plugin returns:
- `status_code` — HTTP status code
- `headers` — Response headers
- `body` — Response body bytes

### Public Routes

Routes declared in `public_routes` are registered on the **public** Fiber app without auth middleware:

```json
"public_routes": [
  {"method": "POST", "path": "/forms/submit/*"}
]
```

These are proxied to the plugin the same way as admin routes, but `user_id` is always `0`.

---

## Tengo Scripts for Extensions

### Entry Point

The file `scripts/extension.tengo` is the entry point. It's loaded when the extension activates and unloaded when it deactivates.

### Example: Sitemap Generator

```tengo
log := import("core/log")
events := import("core/events")
routes := import("core/routes")

log.info("Sitemap Generator extension loaded!")

// Rebuild sitemaps when content changes
events.on("node.published", "handlers/rebuild_sitemap", 10)
events.on("node.deleted", "handlers/rebuild_sitemap", 10)

// Register public routes
routes.register("GET", "/sitemap.xml", "handlers/serve_index")
routes.register("GET", "/sitemap-:type.xml", "handlers/serve_type")
```

### Example: Hello Extension

```tengo
log := import("core/log")
events := import("core/events")

log.info("Hello Extension loaded!")

// Register an event handler
events.on("after_main_content", "handlers/powered_by", 99)
```

### Available Modules

| Module | Import | Purpose |
|--------|--------|---------|
| **Nodes** | `core/nodes` | CRUD, query, list taxonomy terms |
| **Node Types** | `core/nodetypes` | Register, get, list, update, delete node types |
| **Taxonomies** | `core/taxonomies` | Register, get, list, update, delete taxonomies and terms |
| **Menus** | `core/menus` | Get, create, update, delete menus |
| **Settings** | `core/settings` | Get, set, get-all |
| **Events** | `core/events` | Emit events, subscribe with `events.on()` |
| **Routes** | `core/routes` | Register HTTP routes with `routes.register()` |
| **Filters** | `core/filters` | Register filters |
| **HTTP** | `core/http` | Outbound HTTP fetch |
| **Log** | `core/log` | Leveled logging (`log.info()`, `log.warn()`, `log.error()`) |
| **Helpers** | `core/helpers` | Utility functions |
| **Routing** | `core/routing` | Render context access (available in render-time scripts) |

### Loading & Unloading

- Scripts are loaded on activation — the `extension.tengo` file executes top-to-bottom.
- Handler files referenced by `events.on()` and `routes.register()` are resolved relative to `scripts/`.
- Scripts are unloaded on deactivation — all event subscriptions and routes are cleaned up.
- Script errors log warnings but don't crash the extension or the server.

---

## Extension Lifecycle Events

| Event | When it fires | Payload |
|-------|--------------|---------|
| `extension.activated` | Extension is activated (after migrations, scripts, plugins) | `slug`, `path`, `version`, `assets` |
| `extension.deactivated` | Extension is deactivated (before cleanup) | `slug` |
| `theme.activated` | Any theme is activated | `name`, `path`, `version`, `assets` |
| `theme.deactivated` | Any theme is deactivated | `name` |

### Using Lifecycle Events

Extensions subscribe to these events to coordinate. For example, `media-manager` listens for `extension.activated` to import extension assets, and `theme.activated` to import theme assets into its media library.

```tengo
// In media-manager's extension.tengo
events.on("extension.activated", "handlers/import_extension_assets", 10)
events.on("theme.activated", "handlers/import_theme_assets", 10)
events.on("extension.deactivated", "handlers/purge_extension_assets", 10)
events.on("theme.deactivated", "handlers/purge_theme_assets", 10)
```

**Important:** When an extension is activated at runtime (after boot), the `theme.activated` event is replayed for the current active theme. This ensures extensions activated later don't miss the theme event.

---

## Best Practices

### CRITICAL: Data Shape Consistency Between Seeds and Templates

This is the **#1 source of bugs** in extension and theme development. When a Tengo seed script stores data, the template that renders it must use the **exact same data shape**. Mismatches cause silent template errors or blank output.

#### The Bug Pattern

**Seed stores `tag` as a string:**

```tengo
// In theme.tengo or extension seed script
{ tag: "Foodie" }
```

**Template treats `tag` as an object:**

```html
{{ with $fd.tag }}{{ .name }}{{ end }}
```

This crashes at render time — you can't access `.name` on a string.

#### The Fix

Either make the seed data match the template, or the template match the seed:

**Option A — String everywhere:**

```tengo
// Seed
{ tag: "Foodie" }
```

```html
<!-- Template -->
{{ with $fd.tag }}{{ . }}{{ end }}
```

**Option B — Object everywhere:**

```tengo
// Seed
{ tag: { name: "Foodie", slug: "foodie" } }
```

```html
<!-- Template -->
{{ with $fd.tag }}{{ .name }}{{ end }}
```

**Rule: The seed script OWNS the data contract. Templates must match.** Document the expected shape of every field in your extension's seed data.

### Template Context: `.fields` vs `.fields_data`

Two different rendering contexts exist and they use **different key names**. Getting these mixed up is a common source of blank renders.

| Context | Where | Key name | How to access |
|---------|-------|----------|---------------|
| Layout templates | `layouts/*.html` | `.node.fields` | `{{ .node.fields.my_field }}` |
| Block templates | `blocks/*/view.html` | `.fields` (direct) | `{{ .my_field }}` |
| Tengo filter results | `list_nodes` returns | `.fields_data` | `{{ .fields_data.my_field }}` |

#### Layout Templates

Layouts receive the full node object from `ToMap()`, so fields are nested:

```html
{{- $fd := .node.fields -}}
{{ $fd.color }}
```

#### Block Templates

Blocks receive fields as their top-level context:

```html
{{- $fd := .fields -}}
{{ $fd.heading }}
```

#### Tengo Filter Results

When iterating over nodes returned from Tengo's `list_nodes` or similar queries:

```html
{{- range $trips -}}
{{- $fd := .fields_data -}}
{{ $fd.color }}
{{- end -}}
```

### Import Cycle Avoidance

If you need to wire packages together across `internal/`, watch for import cycles. The most common trap:

```
cms → scripting → coreapi → cms   ← CYCLE
```

**Solution:** Use callback functions (func types) instead of direct type references:

```go
// Instead of importing scripting.Engine:
type MyService struct {
    loadScripts func(extPath, slug string, caps map[string]bool) error
}

// Wire it up in main:
svc.loadScripts = scriptingEngine.LoadExtensionScripts
```

The core codebase uses this pattern extensively — `PluginManager` receives a `HostServerRegistrar` function type rather than importing `coreapi` directly.

### Asset References

Use special URI schemes to reference theme and extension assets. These are resolved to real URLs at render time by walking the JSON data and replacing string values.

| Pattern | Resolves to | Example |
|---------|-------------|---------|
| `theme-asset:{key}` | Current theme's media asset | `theme-asset:hero-banner` |
| `extension-asset:{slug}:{key}` | Extension's media asset | `extension-asset:hello-extension:demo-banner` |

The resolver walks all JSON data (strings, objects, arrays) and replaces these references with full media objects containing `id`, `url`, `alt`, `mime_type`, `width`, `height`.

**Never hardcode `/media/` paths in seed data.** Use the asset reference scheme instead:

```tengo
// WRONG
{ image: "/media/uploads/hero.jpg" }

// RIGHT
{ image: "theme-asset:hero-banner" }
{ image: "extension-asset:my-extension:banner" }
```

### Extension Isolation

Design your extension so that disabling it doesn't break the site:

- **Don't modify core tables.** Use your own tables via migrations and the Data Store API.
- **Don't assume other extensions are present.** Check for capabilities, don't hard-depend on specific extensions.
- **Graceful degradation.** If your extension provides a block type, make sure templates that use it degrade gracefully when the block is unregistered.
- **Clean up on deactivation.** Subscribe to `extension.deactivated` to remove your data if appropriate.

### Naming Conventions

- Extension slugs: `kebab-case` (e.g., `media-manager`, `sitemap-generator`)
- Database tables: descriptive, unprefixed by extension slug but unique (e.g., `forms`, `form_submissions`)
- Go files: `snake_case`
- Tengo scripts: `snake_case.tengo`
- Templates: `.html` extension

---

## Existing Extensions Reference

### media-manager
**Type:** gRPC plugin + React micro-frontend + Tengo scripts

Upload, organize, and manage media files. Handles theme and extension asset import/export. Provides the `media` field type for node schemas. Listens for `extension.activated`, `theme.activated`, and their deactivation counterparts to manage asset ownership in the media library.

### email-manager
**Type:** gRPC plugin + React micro-frontend

Manage email templates, base layouts, delivery rules, and logs. Provides an `email-settings` admin UI slot that email providers (SMTP, Resend) inject into. Does not send emails itself — it manages templates and rules, then emits events that providers handle.

### sitemap-generator
**Type:** gRPC plugin + Tengo scripts

Automatic XML sitemap generation with Yoast-style organization. Rebuilds sitemaps when content is published or deleted. Registers public routes for `/sitemap.xml` and `/sitemap-{type}.xml` via Tengo scripts.

### smtp-provider
**Type:** gRPC plugin

Sends emails via any SMTP server. Subscribes to `email.send` events. Injects its settings UI into the `email-settings` slot provided by `email-manager`. Configuration stored via `settings_schema`.

### resend-provider
**Type:** Tengo-only (no compiled binary)

Sends emails via the Resend.com API. Subscribes to `email.send` events and uses `core/http` for outbound requests. Demonstrates that not every extension needs a Go binary.

### forms
**Type:** gRPC plugin + React micro-frontend + Tengo scripts + content block

Form builder with submission tracking and email notifications. Provides a `vibe-form` content block, custom `form_selector` field type, and a public `/forms/submit/*` route. Owns `forms` and `form_submissions` database tables. Seeds demo forms via Tengo scripts on activation.

### hello-extension
**Type:** Tengo-only

Minimal demo extension. Shows the basic structure: a manifest, an `extension.tengo` entry point, and an event handler. Use this as a starting template for new extensions.

### content-blocks
**Type:** Content blocks + templates (no gRPC plugin, no admin UI)

Premium collection of 40 content blocks and 10 page templates. Purely declarative — no Go binary, no scripts. The manifest lists all blocks and templates, and the extension loader registers them from the filesystem. Includes text, media, CTA, features, pricing, social proof, layout, and AJAX-powered blocks.
```

 vibecms/extensions/README.md#L1-756