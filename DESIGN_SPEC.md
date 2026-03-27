# VibeCMS Design Spec: Extension System & Shared Globals

## 1. Extension Manifest Structure

**File:** `/root/projects/vibecms/extensions/hello-extension/extension.json`

```json
{
  "name": "Hello Extension",
  "slug": "hello-extension",
  "version": "1.0.0",
  "author": "VibeCMS",
  "description": "Example extension demonstrating the extension API",
  "priority": 50
}
```

**Fields:**
- `name` (string): Display name
- `slug` (string): Unique identifier
- `version` (string): Semantic version
- `author` (string): Author name
- `description` (string): Description
- `priority` (int): Load order (lower = earlier, default: 50)

---

## 2. Extension Go Model

**File:** `/root/projects/vibecms/internal/models/extension.go`

```go
type Extension struct {
    ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
    Slug        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"`
    Name        string    `gorm:"type:varchar(150);not null" json:"name"`
    Version     string    `gorm:"type:varchar(50);not null;default:'1.0.0'" json:"version"`
    Description string    `gorm:"type:text;not null;default:''" json:"description"`
    Author      string    `gorm:"type:varchar(150);not null;default:''" json:"author"`
    Path        string    `gorm:"type:text;not null" json:"path"`
    IsActive    bool      `gorm:"not null;default:false" json:"is_active"`
    Priority    int       `gorm:"not null;default:50" json:"priority"`
    Settings    JSONB     `gorm:"type:jsonb;not null;default:'{}'" json:"settings"`
    InstalledAt time.Time `gorm:"autoCreateTime" json:"installed_at"`
    UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
```

**Key Fields:**
- `Slug`: Unique constraint, indexed
- `Path`: Full filesystem path to extension directory
- `IsActive`: Boolean flag (default: false for new extensions)
- `Priority`: Sort order for initialization (ascending)
- `Settings`: JSONB field for extension-specific config

---

## 3. Email Provider Interface

**File:** `/root/projects/vibecms/internal/email/provider.go`

```go
type Provider interface {
    Name() string
    Send(to []string, subject string, html string) error
}

// Factory function
func NewProvider(name string, settings map[string]string) Provider {
    switch name {
    case "smtp":
        return NewSMTPProvider(settings)
    case "resend":
        return NewResendProvider(settings)
    default:
        return nil
    }
}
```

**Implementations:**
- `smtp`: SMTP server (NewSMTPProvider)
- `resend`: Resend API (NewResendProvider)

---

## 4. Email Settings Page - Form Fields & Save Logic

**File:** `/root/projects/vibecms/admin-ui/src/pages/email-settings.tsx`

### Form Fields:

**Provider Selection:**
- Radio buttons: None, SMTP, Resend

**SMTP Configuration (when provider="smtp"):**
- `smtp_host`: string
- `smtp_port`: string
- `smtp_username`: string
- `smtp_password`: string (password type)
- `from_email`: string
- `from_name`: string

**Resend Configuration (when provider="resend"):**
- `resend_api_key`: string (password type, prefix "re_")
- `from_email`: string
- `from_name`: string

### Save Flow:
```typescript
async function handleSave(e: FormEvent) {
    const data: Record<string, string> = { provider };
    
    if (provider === "smtp") {
        data.smtp_host = smtpHost;
        data.smtp_port = smtpPort;
        data.smtp_username = smtpUsername;
        data.smtp_password = smtpPassword;
        data.from_email = smtpFromEmail;
        data.from_name = smtpFromName;
    } else if (provider === "resend") {
        data.resend_api_key = resendApiKey;
        data.from_email = resendFromEmail;
        data.from_name = resendFromName;
    }
    
    await saveEmailSettings(data); // API call to /admin/api/settings/email
}
```

### API Endpoints Used:
- `getEmailSettings()`: Fetch current settings
- `saveEmailSettings(data)`: Save provider config
- `sendTestEmail()`: Send test email

---

## 5. Vite Config - Build Setup

**File:** `/root/projects/vibecms/admin-ui/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/admin/api': 'http://localhost:8099',
      '/auth': 'http://localhost:8099',
      '/me': 'http://localhost:8099',
      '/api': 'http://localhost:8099',
    },
  },
})
```

**Key Config:**
- **Base:** `/admin/` (assets served from this path)
- **Plugins:** React, Tailwind CSS (Vite plugin)
- **Alias:** `@` → `./src` for imports
- **Dev Proxy:** All API routes proxy to `http://localhost:8099`
- **Shared Globals Opportunity:** Define via Vite's define/env config to inject at build time

---

## 6. Extension Loader Code

**File:** `/root/projects/vibecms/internal/cms/extension_loader.go`

### Core Methods:

```go
type ExtensionLoader struct {
    db            *gorm.DB
    extensionsDir string
}

// ScanAndRegister: Reads extension.json from each directory, upserts to DB
// New extensions default to is_active=false
// Updates existing: name, version, description, author, path, priority
// Preserves existing: is_active
func (l *ExtensionLoader) ScanAndRegister()

// GetActive: Returns active extensions sorted by priority (ascending)
func (l *ExtensionLoader) GetActive() ([]models.Extension, error)

// Activate: Set is_active=true by slug
func (l *ExtensionLoader) Activate(slug string) error

// Deactivate: Set is_active=false by slug
func (l *ExtensionLoader) Deactivate(slug string) error

// GetBySlug: Fetch single extension
func (l *ExtensionLoader) GetBySlug(slug string) (*models.Extension, error)

// List: All extensions sorted by priority
func (l *ExtensionLoader) List() ([]models.Extension, error)
```

**Manifest Struct:**
```go
type ExtensionManifest struct {
    Name        string `json:"name"`
    Slug        string `json:"slug"`
    Version     string `json:"version"`
    Author      string `json:"author"`
    Description string `json:"description"`
    Priority    int    `json:"priority"`
}
```

**Upsert Strategy:**
- Conflict on: `slug` column
- Update on conflict: name, version, description, author, path, priority
- Preserve: is_active (allows admin control to persist across reloads)

---

## 7. Tengo Importer/Module System

**File:** `/root/projects/vibecms/internal/scripting/importer.go`

### Module Registration:

```go
func (e *ScriptEngine) buildModuleMap(renderCtx interface{}, scriptsDir ...string) *tengo.ModuleMap {
    modules := tengo.NewModuleMap()
    
    // Built-in CMS API modules
    modules.AddBuiltinModule("cms/nodes", e.nodesModule())
    modules.AddBuiltinModule("cms/settings", e.settingsModule())
    modules.AddBuiltinModule("cms/events", e.eventsModule())
    modules.AddBuiltinModule("cms/filters", e.filtersModule())
    modules.AddBuiltinModule("cms/http", e.httpModule())
    modules.AddBuiltinModule("cms/email", e.emailModule())
    modules.AddBuiltinModule("cms/menus", e.menusModule())
    modules.AddBuiltinModule("cms/log", logModule())
    modules.AddBuiltinModule("cms/routing", e.routingModule(renderCtx))
    modules.AddBuiltinModule("cms/helpers", helpersModule())
    
    // Safe stdlib modules
    safeModules := []string{"fmt", "math", "text", "times", "rand", "json", "base64", "hex", "enum"}
    for _, name := range safeModules {
        // Register builtin and source modules from Tengo stdlib
    }
    
    // Load user source modules from scripts/ directory
    e.loadSourceModules(modules, scriptsDir...)
}
```

### Source Module Loading:

```go
func (e *ScriptEngine) loadSourceModules(modules *tengo.ModuleMap, dir string) {
    // Walks scripts/ directory recursively
    // Adds all .tengo files as source modules
    // Module name format: "./path/to/module" (relative with ./ prefix)
    // Skips entry scripts: theme.tengo, extension.tengo
}
```

**Module Namespace:**
- `cms/*`: VibeCMS API modules
- `fmt`, `math`, etc.: Tengo stdlib (safe subset)
- `./path/to/module`: User source modules from scripts/

**Key Point:** Source modules from scripts/ are importable; theme.tengo and extension.tengo entry points are NOT importable.

---

## 8. Admin Routes Setup

**File:** `/root/projects/vibecms/admin-ui/src/App.tsx`

### Route Structure:

```
/admin/login
/admin/ (Protected, redirects to dashboard)
  ├── dashboard
  ├── pages, pages/:id/edit
  ├── posts, posts/:id/edit
  ├── content-types, content-types/:id/edit
  ├── block-types, block-types/:id/edit
  ├── templates, templates/:id/edit
  ├── layouts, layouts/:id/edit
  ├── layout-blocks, layout-blocks/:id/edit
  ├── menus, menus/:id/edit
  ├── languages
  ├── users, users/:id/edit
  ├── roles, roles/:id/edit
  ├── email-templates, email-templates/:id/edit
  ├── email-rules, email-rules/:id/edit
  ├── email-logs
  ├── email-settings
  ├── themes, themes/:id/files
  ├── extensions, extensions/:slug/files
  └── content/:nodeType, content/:nodeType/:id/edit (dynamic)
* (fallback redirects to /admin/dashboard)
```

### Route Features:
- **Protected routes:** Wrapped in `ProtectedRoute` component that checks `useAuth()`
- **Language context:** Routes under `/admin` wrapped in `AdminLanguageProvider`
- **Dynamic routes:** `/:nodeType` params for custom content types
- **Parent layout:** `AdminLayout` component provides sidebar/navigation
- **Auth check:** Redirect to login if not authenticated

### Key Components:
- `AuthProvider`: Manages auth state and loading
- `useAuth()`: Hook with `{ loading, isAuthenticated }`
- `AdminLanguageProvider`: Localization context
- `ProtectedRoute`: Conditional render/redirect wrapper

---

## Summary: Shared Globals Strategy

For implementing shared globals (extension config accessible to frontend):

1. **Vite Config Entry Point:** Use `vite.config.ts` `define` option to inject global constants at build time
2. **Environment Variables:** Define in `.env` / `.env.local`, access via `import.meta.env`
3. **API Endpoint:** Create `/admin/api/config/globals` endpoint that returns extension settings
4. **Type-safe Provider:** Create a React context hook similar to `useAuth()` for shared globals
5. **Extension Settings Column:** Leverage `Extension.Settings` (JSONB) to store per-extension config
6. **Module Loading:** Extend `importer.go` to expose extension settings as Tengo module
