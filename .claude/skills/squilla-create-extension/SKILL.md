---
name: squilla-create-extension
description: |
  Use when building a new Squilla extension from scratch — adding a feature
  package that owns its own database tables, HTTP routes, business logic,
  admin UI, or event handlers. Triggers: "add an extension that does X",
  "build a Y manager", "this should be an extension, not core",
  scaffolding under `extensions/<slug>/`, deciding between a gRPC plugin
  and a Tengo-only extension, declaring capabilities, wiring an admin
  micro-frontend into the SPA shell, registering custom field types or
  content blocks owned by an extension, or seeding initial data via SQL
  migrations. Pairs with `squilla-extension-frontend` for the React side.
---

# Creating a Squilla Extension

A Squilla extension is a **self-contained feature package**. Dropping a folder under `extensions/` and activating it registers custom database tables, public HTTP endpoints, admin micro-frontends, Tengo hooks, content blocks, and custom field types into the kernel without modifying a single file in core.

This guide is the complete, self-contained reference for architecting, building, and deploying Squilla extensions.

---

## 1. Core Architecture & Philosophy

Squilla operates on an **Operating System Kernel** model:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              KERNEL                                    │
│  Content Nodes (JSONB) │ Auth / RBAC │ Event Bus │ Theme Renderer      │
│  Capability-Guarded CoreAPI │ Extension Loader │ gRPC Host Proxy       │
└────────────────────────────────────────────────────────────────────────┘
          │ (gRPC / Bidirectional)        │ (Tengo Sandbox)   │ (HTTP Proxy)
          ▼                               ▼                   ▼
┌──────────────────┐            ┌──────────────────┐ ┌──────────────────┐
│  gRPC Subprocess │            │   Tengo Script   │ │ React Admin UI   │
│  Own DB Tables   │            │   Event Listeners│ │ Micro-Frontend   │
│  Go Plugin Exec  │            │   Lightweight API│ │ Vite ES Module   │
└──────────────────┘            └──────────────────┘ └──────────────────┘
       (extensions/media-manager)      (extensions/resend)  (admin-ui SPA)
```

### The Kernel vs. Extension Law
> **The Golden Rule**: *If disabling or removing the feature leaves dead code in core, that code belongs in an extension, not in core.*

- **Belongs in Core (`internal/`, `cmd/squilla/`)**: Content storage engines, user authentication, session cookies, RBAC enforcement, template compilation, event dispatcher, CoreAPI interface, and plugin supervisor.
- **Belongs in Extensions (`extensions/<slug>/`)**: Image optimization, form builders, email delivery, SEO sitemaps, analytics trackers, payment gateways, and custom field inputs.

### The Three Authoring Surfaces

| Surface | Language | Runtime Model | Best For |
|---|---|---|---|
| **gRPC Plugin** | Go | Independent persistent child process started by kernel | Custom DB tables, stateful goroutines, image/crypto processing, high-volume HTTP endpoints |
| **Tengo Scripts** | Tengo | Embedded sandboxed VM inside kernel; fresh VM per execution | Event webhooks, lightweight outbound API calls, simple data seeders |
| **Admin UI** | React + TypeScript | Browser; loaded dynamically as an ES module by Admin shell | Dashboard pages, settings views, custom field editors, modal pickers |

### Decision Matrix

```
Need custom SQL tables?                → gRPC plugin (Go) + migrations/
Need persistent state / goroutines?    → gRPC plugin (Go)
Need native Go libraries (imaging)?    → gRPC plugin (Go)
Need high-volume public endpoints?     → gRPC plugin (Go)
Only react to events + outbound HTTP?  → Tengo script (scripts/extension.tengo)
Only ship reusable blocks/templates?   → Declarative manifest (blocks/, templates/)
```

---

## 2. Directory Layout & Anatomy

```
extensions/my-extension/
├── extension.json                  # Manifest (contract with the kernel)
│
├── cmd/
│   └── plugin/
│       ├── main.go                 # Plugin entrypoint: implements ExtensionPlugin
│       ├── routes.go               # HTTP request router for HandleHTTPRequest
│       ├── handlers_*.go           # Domain handlers (CRUD, business logic)
│       ├── helpers.go              # Standard JSON envelopes (jsonResponse/jsonError)
│       └── fakehost_test.go        # In-memory CoreAPI test double for fast unit tests
│
├── bin/
│   └── my-extension                # Compiled Linux ELF binary (built via Docker/make)
│
├── migrations/
│   ├── 20260101_init.sql           # Idempotent DDL migrations executed on activation
│   └── 20260201_add_column.sql
│
├── scripts/
│   ├── extension.tengo             # Optional Tengo bootstrap script
│   └── handlers/                   # Tengo event or route handler scripts
│
├── admin-ui/
│   ├── package.json                # devDependencies only (Vite, React types, Tailwind)
│   ├── tsconfig.json
│   ├── vite.config.ts              # Vite library mode config (externalizes shared libs)
│   └── src/
│       ├── index.tsx               # Exports routed views & custom field components
│       ├── index.css               # Per-extension Tailwind v4 entrypoint
│       └── HelloPage.tsx
│
├── blocks/                         # Optional content blocks contributed by extension
│   └── my-custom-block/
│       ├── block.json              # Block schema and test data
│       ├── view.html               # html/template renderer
│       ├── style.css               # Scoped styles injected per page
│       └── script.js               # Scoped client JS injected per page
│
├── templates/                      # Optional page templates contributed by extension
│   └── demo-template.json
│
└── assets/                         # Static media imported into Media Library on activation
    └── images/
```

### Naming Conventions
- Extension slug: lowercase `kebab-case` matching the directory name.
- Go source files: `snake_case.go`.
- Tengo scripts: `snake_case.tengo`.
- SQL migrations: `<timestamp_or_sortable_prefix>_<description>.sql`.

---

## 3. `extension.json` — The Manifest Contract

The manifest is the single source of truth. Anything not explicitly declared here is invisible to the kernel.

```jsonc
{
  // 1. Identity
  "name": "Media Manager",
  "slug": "media-manager",
  "version": "1.0.0",
  "author": "Squilla Core Team",
  "description": "Upload, transform, optimize, and manage media assets.",

  // 2. Loading & Priority
  "priority": 50,                       // Boot order: lower = earlier (default: 50)
  "provides": ["media-provider"],       // Capability tags provided to kernel/extensions

  // 3. Capabilities Guard (Minimal Principle)
  "capabilities": [
    "data:read", "data:write", "data:delete",
    "files:write", "files:delete",
    "settings:read", "settings:write",
    "events:emit",
    "log:write"
  ],

  // 4. gRPC Plugin Binaries
  "plugins": [
    { "binary": "bin/media-manager", "events": [] }
  ],

  // 5. Public HTTP Routes (No Auth Middleware)
  "public_routes": [
    { "method": "GET",  "path": "/media/cache/*" },
    { "method": "POST", "path": "/forms/submit/*" }
  ],

  // 6. Admin UI Micro-Frontend Configuration
  "admin_ui": {
    "entry": "admin-ui/dist/index.js",
    "menu": {
      "label": "Media",
      "icon": "Image",                 // Any Lucide icon name
      "section": "content",            // "content" | "design" | "development" | "settings"
      "position": "3",
      "children": [
        { "label": "Library",   "route": "/admin/ext/media-manager/", "icon": "Images" },
        { "label": "Optimizer", "route": "/admin/ext/media-manager/optimizer", "icon": "Sliders" }
      ]
    },
    "routes": [
      { "path": "/",          "component": "MediaLibrary" },
      { "path": "/optimizer", "component": "ImageOptimizerSettings" }
    ],
    "settings_menu": [
      { "label": "Media Optimizer", "route": "/admin/ext/media-manager/optimizer", "icon": "Sliders" }
    ],
    "slots": {
      "email-settings": { "component": "SmtpSettings", "label": "SMTP" }
    },
    "field_types": [
      {
        "type": "media",
        "label": "Media Selector",
        "description": "Select or upload media assets",
        "icon": "Image",
        "group": "Media",
        "component": "MediaFieldInput",
        "supports": ["image", "gallery", "file"]
      }
    ]
  },

  // 7. Auto-Rendered Settings Schema
  "settings_schema": {
    "jpeg_quality": { "type": "number", "label": "JPEG Quality", "default": 85 },
    "api_key":      { "type": "string", "label": "API Key", "sensitive": true }
  },

  // 8. Custom Blocks & Templates
  "blocks": [
    { "slug": "vibe-form", "dir": "vibe-form" }
  ],
  "templates": [
    { "slug": "form-receipt", "file": "receipt.json" }
  ],

  // 9. Static Assets (Imported to Media Library on Activation)
  "assets": [
    { "key": "default-banner", "src": "images/banner.jpg", "alt": "Default Banner" }
  ]
}
```

---

## 4. Security & Capabilities Reference

Every CoreAPI method invoked by an extension is guarded by the kernel's `capabilityGuard`. If your plugin calls an API method without declaring its capability in `extension.json`, the kernel immediately fails the call with `ErrCapabilityDenied`.

### The 24 Capabilities

| Capability | Allowed CoreAPI Methods |
|---|---|
| `nodes:read` | `GetNode`, `QueryNodes`, `ListTaxonomyTerms`, `ListTerms`, `GetTerm` |
| `nodes:write` | `CreateNode`, `UpdateNode`, `CreateTerm`, `UpdateTerm`, `DeleteTerm` |
| `nodes:delete` | `DeleteNode` |
| `nodetypes:read` | `GetNodeType`, `ListNodeTypes`, `GetTaxonomy`, `ListTaxonomies` |
| `nodetypes:write` | `RegisterNodeType`, `UpdateNodeType`, `DeleteNodeType`, `RegisterTaxonomy`, `UpdateTaxonomy`, `DeleteTaxonomy` |
| `settings:read` | `GetSetting`, `GetSettings` |
| `settings:write` | `SetSetting` |
| `events:emit` | `Emit` |
| `events:subscribe` | `Subscribe` (runtime callback; startup `GetSubscriptions()` bypasses this guard) |
| `email:send` | `SendEmail` |
| `menus:read` | `GetMenu`, `GetMenus` |
| `menus:write` | `CreateMenu`, `UpdateMenu`, `UpsertMenu` |
| `menus:delete` | `DeleteMenu` |
| `routes:register` | `RegisterRoute`, `RemoveRoute` (dynamic Tengo/gRPC routes; declarative `public_routes` do not need this) |
| `filters:register` | `RegisterFilter` |
| `filters:apply` | `ApplyFilters` |
| `media:read` | `GetMedia`, `QueryMedia` |
| `media:write` | `UploadMedia` |
| `media:delete` | `DeleteMedia` |
| `users:read` | `GetUser`, `QueryUsers` (User provisioning is core-only; no users:write exists) |
| `http:fetch` | `Fetch` (outbound HTTP requests) |
| `log:write` | `Log` (structured logging routed through kernel) |
| `data:read` | `DataGet`, `DataQuery` (access to extension-owned tables) |
| `data:write` | `DataCreate`, `DataUpdate`, `DataExec` |
| `data:delete` | `DataDelete` |
| `files:write` | `StoreFile` |
| `files:delete` | `DeleteFile` |

---

## 5. The gRPC Plugin Runtime & RPC Lifecycle

Plugins communicate with the Squilla kernel via HashiCorp `go-plugin` over gRPC.

### The `ExtensionPlugin` Interface

Your plugin binary must implement the 5 lifecycle methods defined in `pkg/plugin/interface.go`:

```go
type ExtensionPlugin interface {
    Initialize(hostConn *grpc.ClientConn) error
    GetSubscriptions() ([]*pb.Subscription, error)
    HandleEvent(action string, payload []byte) (*pb.EventResponse, error)
    HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error)
    Shutdown() error
}
```

### Lifecycle Execution Sequence

1. **`Initialize(hostConn)`**: Invoked immediately after subprocess spawn. Wrap `hostConn` using `coreapi.NewGRPCHostClient(...)` to establish your CoreAPI host client. Start background goroutines using a cancellable context.
2. **`GetSubscriptions()`**: Returns array of events your plugin listens to, with priorities (lower priority numbers run first).
3. **`HandleEvent(action, payload)`**: Dispatches events from the kernel event bus.
4. **`HandleHTTPRequest(req)`**: Handles proxied HTTP traffic for both admin and public routes.
5. **`Shutdown()`**: Invoked on extension deactivation or system termination. Cancel background worker contexts, drain queues, and flush buffers.

### HTTP Routing: Admin Proxy vs. Public Routes

Understanding the two distinct routing proxies is critical:

| Feature | Admin Proxy | Public Proxy |
|---|---|---|
| **Mount URL** | `/admin/api/ext/{slug}/*` | Exact path declared in `public_routes[]` (e.g. `/forms/submit/*`) |
| **Authentication** | Automatic session cookie validation. Anonymous requests receive `401 Unauthorized`. | **Zero authentication**. Completely public. |
| **`req.UserId`** | Populated with logged-in admin user ID. | Always `0`. |
| **Headers** | Strips sensitive auth cookies before forwarding; adds `X-User-Email` & `X-User-Name`. | Forwards standard client headers as received. |

> **CRITICAL ROUTING LAW**: Public routes are **never** mounted under `/api/ext/...`. The path in `public_routes[].path` is the exact, literal public URL.

### Canonical Error & Response Envelopes

Plugins must emit standardized JSON envelopes across all endpoints:

```go
func jsonResponse(status int, data any) *pb.PluginHTTPResponse {
    body, _ := json.Marshal(data)
    return &pb.PluginHTTPResponse{
        StatusCode: int32(status),
        Headers:    map[string]string{"Content-Type": "application/json"},
        Body:       body,
    }
}

func jsonError(status int, code, message string) *pb.PluginHTTPResponse {
    return jsonResponse(status, map[string]string{
        "error":   code,
        "message": message,
    })
}
```

Format for field-level validation errors:
```json
{
  "error": "VALIDATION_FAILED",
  "message": "Invalid submission payload",
  "fields": {
    "email": "Must be a valid email address",
    "name": "This field is required"
  }
}
```

---

## 6. Event Bus & Messaging Patterns

Extensions communicate with the kernel and other extensions via the event bus.

### 1. Fire-and-Forget (Asynchronous Dispatch)
Used for lifecycle reactions, notifications, and webhooks. Return `Handled: true`:

```go
func (p *MyPlugin) handleNodePublished(ctx context.Context, payload []byte) (*pb.EventResponse, error) {
    var data struct {
        NodeID    uint   `json:"node_id"`
        NodeTitle string `json:"node_title"`
    }
    _ = json.Unmarshal(payload, &data)
    p.host.Log(ctx, "info", "Processing publication of: "+data.NodeTitle, nil)
    return &pb.EventResponse{Handled: true}, nil
}
```

### 2. Event-with-Result (Synchronous Template Injection)
Used when a template calls `{{ event "name" (dict ...) }}` expecting HTML rendered by an extension. Return rendered bytes in `EventResponse.Result`:

```go
func (p *MyPlugin) handleRender(ctx context.Context, payload []byte) (*pb.EventResponse, error) {
    var args struct {
        FormID string `json:"form_id"`
    }
    _ = json.Unmarshal(payload, &args)

    html := fmt.Sprintf("<div class='form-widget'>Rendered: %s</div>", args.FormID)
    return &pb.EventResponse{
        Handled: true,
        Result:  []byte(html),
    }, nil
}
```
*Note: If multiple extensions subscribe, the kernel concatenates all `Result` byte arrays in priority order.*

### Kernel Lifecycle Events

| Event Name | Trigger | Payload Keys |
|---|---|---|
| `node.created` | New content node created | `node_id`, `node_title`, `node_type`, `slug`, `language_code` |
| `node.updated` | Node fields/metadata updated | (same as node.created) |
| `node.published` | Node transitioned to `status=published` | (same as node.created) |
| `node.deleted` | Node removed | `node_id`, `node_title`, `node_type` |
| `user.registered` | New user created | `user_id`, `email`, `name` |
| `theme.activated` | Theme activated (replayed for active theme on extension activation) | `name`, `path`, `version`, `assets[]` |
| `extension.activated` | Any extension activated | `slug`, `path`, `version`, `assets[]` |
| `extension.deactivated`| Any extension deactivated | `slug` |

---

## 7. Custom Field Types & Extension Blocks

### Registering Custom Field Types

Extensions can contribute proprietary field inputs (color pickers, media selectors, form linkers) to the CMS node editor.

1. Declare in `extension.json`:
```jsonc
"admin_ui": {
  "field_types": [
    {
      "type":        "color_picker",
      "label":       "Color Picker",
      "description": "Hex color selector with palette presets",
      "icon":        "Palette",
      "group":       "Design",
      "component":   "ColorPickerField",
      "supports":    []
    }
  ]
}
```

2. Implement the React Component in `admin-ui/src/ColorPickerField.tsx`:
```tsx
interface FieldComponentProps {
  field: {
    key: string;              // Field identifier (snake_case)
    label: string;            // Editor label
    type: string;             // Registered field type
    required?: boolean;
    help_text?: string;
  };
  value: unknown;             // Stored value
  onChange: (val: unknown) => void;
}

export default function ColorPickerField({ field, value, onChange }: FieldComponentProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700">{field.label}</label>
      <input
        type="color"
        value={String(value || "#000000")}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded border border-slate-200 cursor-pointer"
      />
    </div>
  );
}
```

3. Export from `admin-ui/src/index.tsx`:
```tsx
export { default as ColorPickerField } from "./ColorPickerField";
```

### The Field Schema Naming Rule
Pay strict attention to naming when defining schemas:
- **`block.json`** uses `"key"`:
  ```json
  "field_schema": [{ "key": "hero_color", "type": "color_picker" }]
  ```
- **Tengo `nodetypes.register`** uses `"name"`:
  ```tengo
  nodetypes.register({
    slug: "article",
    fields: [{ name: "hero_color", type: "color_picker" }]
  })
  ```

### Content Blocks Owned by Extensions

When an extension contributes content blocks (e.g. `vibe-form` in `extensions/forms/blocks/vibe-form/`):
- Place files in `blocks/<slug>/` containing `block.json`, `view.html`, and optional `style.css` / `script.js`.
- Declare in `extension.json`:
  ```json
  "blocks": [{ "slug": "my-block", "dir": "my-block" }]
  ```
- In `view.html`, call back to the extension using `{{ event "myext:render" ... }}` to allow the Go plugin to produce dynamic HTML.

---

## 8. SQL Migrations & Data Store

Extensions own their database schema. SQL files in `migrations/` execute once in alphanumeric sequence.

### Idempotency Law
All migration SQL **must** be idempotent. Never assume a blank table:

```sql
-- migrations/20260101_init.sql
CREATE TABLE IF NOT EXISTS my_records (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active',
    metadata   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_my_records_status ON my_records(status);
```

### Table Prefix Convention
Always prefix tables with the extension domain (e.g., `forms_`, `media_`, `seo_`) to avoid collisions with core tables (`content_nodes`, `users`, `settings`).

### JSONB String Normalization Rule
GORM and the CoreAPI DataStore return JSONB columns as **raw JSON strings**, not parsed maps. Always normalize JSONB fields in your Go code before processing or returning them:

```go
func normalizeJSONBFields(row map[string]any, keys ...string) map[string]any {
    for _, key := range keys {
        s, ok := row[key].(string)
        if !ok || s == "" {
            continue
        }
        var parsed any
        if err := json.Unmarshal([]byte(s), &parsed); err == nil {
            row[key] = parsed
        }
    }
    return row
}
```

---

## 9. Tengo Scripting (`scripts/*.tengo`)

Tengo provides a sandboxed scripting environment inside the kernel VM. It is ideal for event listeners that require no external Go dependencies.

### Sandboxing Boundaries
- **Allocation limit**: 50,000 memory allocations per execution.
- **Wall-clock timeout**: 10 seconds hard cap.
- **Disk / Process access**: Strictly disallowed.
- **Network**: Outbound calls permitted exclusively via `core/http`.

### Standard Tengo Extension Example

`scripts/extension.tengo`:
```tengo
log    := import("core/log")
events := import("core/events")
http   := import("core/http")

log.info("Extension loaded")

events.on("node.published", func(e) {
    res := http.fetch({
        method: "POST",
        url: "https://webhook.site/notify",
        headers: {"Content-Type": "application/json"},
        body: json.encode({node_id: e.payload.node_id})
    })
    if res.status_code >= 400 {
        log.error("Webhook notification failed")
    }
})
```

---

## 10. Admin UI Micro-Frontend

Admin UIs are built as Vite ES modules externalizing shared runtime dependencies.

### Build Configuration (`admin-ui/vite.config.ts`)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.tsx",
      formats: ["es"],
      fileName: "index",
      cssFileName: "index", // Produces dist/index.css
    },
    rollupOptions: {
      external: [
        "react", "react/jsx-runtime",
        "react-dom", "react-dom/client",
        "react-router-dom",
        "sonner",
        "@squilla/ui", "@squilla/api", "@squilla/icons",
      ],
    },
    cssCodeSplit: false,
  },
});
```

### Shared Design System Primitives (`@squilla/ui`)
Extensions use pre-bundled UI primitives:
- **Layout**: `ListPageShell`, `ListHeader`, `ListSearch`, `ListFooter`, `Card`, `CardContent`, `EmptyState`.
- **Forms**: `Button`, `Input`, `Label`, `Select`, `Switch`, `Checkbox`, `Textarea`, `Dialog`, `Badge`.
- **Accessing Router / Notifications**:
  ```tsx
  import { toast } from "sonner";
  const SHARED = (window as any).__SQUILLA_SHARED__;
  const { useSearchParams, useNavigate } = SHARED.ReactRouterDOM;
  ```

### Docker Tailwind Build Requirement
During Docker container builds, only the `admin-ui/` directory is copied into the build stage. If an extension does not ship its own compiled `dist/index.css` with `@tailwindcss/vite`, modern utility classes (e.g. `gap-x-6`, `pt-3`) will not render. Always compile CSS per extension.

---

## 11. Assets & The Media-Manager Handshake

Static images shipped with an extension are declared under `assets[]` in `extension.json`.

```json
"assets": [
  { "key": "hero-bg", "src": "images/hero.jpg", "alt": "Hero Background" }
]
```

### The Handshake Sequence
1. Kernel activates extension and emits `extension.activated` with the asset list.
2. `media-manager` reads files from disk, verifies SHA-256 hashes, and registers entries in `media_files`.
3. In templates, seed scripts, or block configs, reference assets using the canonical URI scheme:
   ```
   extension-asset:<slug>:<key>
   ```
4. The template engine resolves `extension-asset:my-ext:hero-bg` to `/media/extension/my-ext/hero.jpg` automatically.

---

## 12. The 12 Mandalorian Rules

1. **The manifest is the contract.** Anything not in `extension.json` is invisible to the kernel.
2. **Capabilities are minimal.** Declare only what your code calls. Never over-declare permissions.
3. **`{"error": code, "message": text}` is the public error envelope.** Always adhere to this JSON structure.
4. **Public routes are mounted at the path you declare.** Not under `/api/...` or `/admin/...`.
5. **Tables are prefixed by domain.** E.g. `forms_*`, `media_*`. Never collide with core tables.
6. **JSONB columns come back as strings.** Always run them through a JSON normalization helper.
7. **Asset references survive switches.** Always use `extension-asset:<slug>:<key>`, never hardcode storage paths.
8. **Per-extension Tailwind builds are mandatory for Docker.** Always ship compiled `dist/index.css`.
9. **Use design system primitives.** Use `ListPageShell`, `ListHeader`, `Button`, and `Input` from `@squilla/ui`.
10. **State lives in URL params.** Page number, filters, search terms, and sort keys must sync with query parameters.
11. **Production code under 300 lines per file (500 hard limit).** Decompose handlers across small, modular files.
12. **Don't reach for a slot pattern when an event-with-result will do.** Prefer loose event coupling over UI slot dependencies.

---

## 13. Complete Copy-Paste Skeleton

A fully functional, runnable extension scaffold. Place these files in `extensions/my-extension/`.

### `extension.json`
```json
{
  "name": "My Extension",
  "slug": "my-extension",
  "version": "0.1.0",
  "author": "Developer",
  "description": "Production extension skeleton",
  "capabilities": ["data:read", "data:write", "data:delete", "log:write"],
  "plugins": [
    { "binary": "bin/my-extension", "events": [] }
  ],
  "public_routes": [
    { "method": "GET", "path": "/my-extension/ping" }
  ],
  "admin_ui": {
    "entry": "admin-ui/dist/index.js",
    "menu": {
      "label": "My Extension",
      "icon": "Puzzle",
      "section": "content",
      "position": "9"
    },
    "routes": [
      { "path": "/", "component": "HelloPage" }
    ]
  }
}
```

### `cmd/plugin/main.go`
```go
package main

import (
	"context"
	"encoding/json"
	"strings"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"

	"squilla/internal/coreapi"
	vibeplugin "squilla/pkg/plugin"
	coreapipb "squilla/pkg/plugin/coreapipb"
	pb "squilla/pkg/plugin/proto"
)

type Plugin struct {
	host coreapi.CoreAPI
}

func (p *Plugin) Initialize(hostConn *grpc.ClientConn) error {
	p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	return nil
}

func (p *Plugin) GetSubscriptions() ([]*pb.Subscription, error) {
	return []*pb.Subscription{
		{EventName: "node.published", Priority: 50},
	}, nil
}

func (p *Plugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	if action == "node.published" {
		_ = p.host.Log(context.Background(), "info", "Node published event received in plugin", nil)
		return &pb.EventResponse{Handled: true}, nil
	}
	return &pb.EventResponse{Handled: false}, nil
}

func (p *Plugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	path := strings.TrimPrefix(req.GetPath(), "/")
	method := strings.ToUpper(req.GetMethod())

	if (path == "ping" || path == "my-extension/ping") && method == "GET" {
		body, _ := json.Marshal(map[string]any{"ok": true, "message": "pong"})
		return &pb.PluginHTTPResponse{
			StatusCode: 200,
			Headers:    map[string]string{"Content-Type": "application/json"},
			Body:       body,
		}, nil
	}

	errBody, _ := json.Marshal(map[string]string{"error": "NOT_FOUND", "message": "Not found"})
	return &pb.PluginHTTPResponse{
		StatusCode: 404,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       errBody,
	}, nil
}

func (p *Plugin) Shutdown() error {
	return nil
}

func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		Plugins: map[string]goplugin.Plugin{
			"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &Plugin{}},
		},
		GRPCServer: goplugin.DefaultGRPCServer,
	})
}
```

### `migrations/20260101_init.sql`
```sql
CREATE TABLE IF NOT EXISTS my_extension_records (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `scripts/extension.tengo`
```tengo
log := import("core/log")
log.info("My Extension Tengo hook initialized")
```

### `admin-ui/package.json`
```json
{
  "name": "my-extension-admin-ui",
  "private": true,
  "type": "module",
  "scripts": { "build": "vite build" },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.4",
    "@types/react": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.2.4",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

### `admin-ui/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "declaration": false
  },
  "include": ["src"]
}
```

### `admin-ui/vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.tsx",
      formats: ["es"],
      fileName: "index",
      cssFileName: "index",
    },
    rollupOptions: {
      external: [
        "react", "react/jsx-runtime",
        "react-dom", "react-dom/client",
        "react-router-dom",
        "sonner",
        "@squilla/ui", "@squilla/api", "@squilla/icons",
      ],
    },
    cssCodeSplit: false,
  },
});
```

### `admin-ui/src/index.css`
```css
@import "tailwindcss";
@source "./**/*.{ts,tsx}";
```

### `admin-ui/src/index.tsx`
```tsx
import "./index.css";
export { default as HelloPage } from "./HelloPage";
```

### `admin-ui/src/HelloPage.tsx`
```tsx
import { Card, CardContent, Button } from "@squilla/ui";
import { useState } from "react";

export default function HelloPage() {
  const [response, setResponse] = useState<string>("");

  const pingServer = async () => {
    try {
      const res = await fetch("/admin/api/ext/my-extension/ping");
      const data = await res.json();
      setResponse(JSON.stringify(data));
    } catch (err: any) {
      setResponse("Error: " + err.message);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">My Extension</h1>
          <p className="text-sm text-slate-600">
            Micro-frontend loaded successfully.
          </p>
          <Button onClick={pingServer} className="cursor-pointer">
            Ping Extension RPC
          </Button>
          {response && (
            <pre className="p-3 bg-slate-100 rounded text-xs overflow-x-auto">
              {response}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 14. Testing & Development Recipes

### Fast Unit Testing with `FakeHost`
Never spin up a live PostgreSQL instance for unit tests. Mock the `coreapi.CoreAPI` interface using an in-memory double (see `extensions/forms/cmd/plugin/fakehost_test.go`):

```go
type FakeHost struct {
	coreapi.CoreAPI
	Logs []string
}

func (f *FakeHost) Log(ctx context.Context, level, msg string, fields map[string]any) error {
	f.Logs = append(f.Logs, fmt.Sprintf("[%s] %s", level, msg))
	return nil
}

func TestHandleEvent(t *testing.T) {
	fake := &FakeHost{}
	p := &Plugin{host: fake}

	resp, err := p.HandleEvent("node.published", []byte(`{}`))
	if err != nil || !resp.Handled {
		t.Fatalf("expected handled event")
	}
	if len(fake.Logs) != 1 {
		t.Fatalf("expected 1 log entry, got %d", len(fake.Logs))
	}
}
```

### Hot-Deploying Code to Docker Without Rebuilding Images

```bash
# 1. Compile plugin binary for Linux container
cd extensions/my-extension
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/my-extension ./cmd/plugin/

# 2. Build Admin UI bundle
cd admin-ui && npm run build && cd ..

# 3. Copy assets directly into container
docker cp bin/my-extension squilla-app-1:/app/extensions/my-extension/bin/my-extension
docker cp admin-ui/dist/. squilla-app-1:/app/extensions/my-extension/admin-ui/dist/

# 4. Restart container to bounce gRPC plugin subprocess
docker compose restart app
```

---

## 15. Troubleshooting Matrix

| Issue | Root Cause | Solution |
|---|---|---|
| `403 / ErrCapabilityDenied` | Called CoreAPI method without declaring permission in `capabilities[]`. | Add required capability from Section 4 to `extension.json` and reactivate. |
| Public route gives `404 Not Found` | Expected URL was prefixed with `/api/...` or route was not listed in `public_routes[]`. | Public routes mount at literal declared path. Check `public_routes` in manifest. |
| Admin UI styles broken/missing | Extension Tailwind not compiled into `dist/index.css`. | Ensure `admin-ui/vite.config.ts` includes `tailwindcss()` and `cssFileName: "index"`. |
| `[object Object]` in React list view | JSONB column treated as string instead of parsed JSON object. | Use `normalizeJSONBFields` helper in Go handler before serializing to JSON. |
| Events not received by plugin | Event subscriptions missing from `GetSubscriptions()` return value. | Return subscription explicitly in Go `GetSubscriptions()` method. |
| `extension-asset:...` displays raw string | Key contains invalid characters or extension was not reactivated. | Use `^[a-z0-9_-]+$` for keys; toggle extension activation in admin. |
| Plugin crashes on startup | Binary built with CGO or wrong architecture. | Compile with `CGO_ENABLED=0 GOOS=linux GOARCH=amd64`. |
