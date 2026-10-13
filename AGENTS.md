# AGENTS.md — Squilla CMS Agent Instructions

Welcome to **Squilla** (vibecms) — an AI-native, high-performance Go CMS built around a kernel + extension architecture.

This document guides AI coding agents (Gemini, Antigravity, Claude Code, Cursor, Windsurf, Copilot) working within this repository.

---

## 1. Core Architecture & Philosophy

Squilla operates on a strict **Operating System Kernel** metaphor:

1. **Kernel (`cmd/squilla/`, `internal/`) = Minimal OS Kernel**
   - Provides infrastructure only: content nodes, auth/sessions, RBAC, CoreAPI, event bus, template rendering, and plugin loader.
   - **Hard Rule**: If disabling or removing a feature leaves dead code in core, that code belongs in an **extension**, not in core.
   - Core never contains feature-specific logic (e.g., image compression, email dispatch rules, SEO policies belong in extensions).

2. **Extensions (`extensions/<slug>/`) = System Packages / daemons**
   - Own their full stack: Go gRPC plugin binary, SQL migrations, Tengo event hooks/routes, and Vite micro-frontends.
   - Communicate with the kernel exclusively via `CoreAPI` and event bus (`internal/coreapi/`).
   - Declare capabilities in `extension.json` (enforced at every CoreAPI boundary).

3. **Admin UI (`admin-ui/`) = Pure Shell**
   - React + TypeScript SPA shell (Vite, Tailwind CSS, shadcn/ui).
   - Only provides auth, layouts, navigation shell, and the extension import-map loader.
   - Feature views are micro-frontends loaded dynamically from extensions.

4. **Themes (`themes/<slug>/`) = Presentation Layer**
   - Go `html/template` layouts, partials, block templates, and styling.
   - Bundled themes live in `themes/` inside the image; user themes live in `/app/data/themes/`.

---

## 2. Directory Layout

- `cmd/squilla/`: Main entry point and dependency wiring.
- `internal/`:
  - `coreapi/`: CoreAPI interface, implementations, and gRPC/Tengo adapters.
  - `cms/`: Content service, theme manager, extension loader/proxy, migrations.
  - `scripting/`: Tengo sandboxed script engine and runtime callbacks.
  - `rendering/`: Template engine (`RenderParsed`, `RenderLayout`, theme asset resolver).
  - `models/`: Database entities (PostgreSQL GORM models).
  - `events/`: Event bus (publish, subscribe, request-response).
  - `auth/`: Session authentication and RBAC middleware.
  - `db/`: Database migrations and connection pool.
- `extensions/`: Bundled extensions (`media-manager`, `email-manager`, `seo-extension`, `forms`, etc.).
- `themes/`: Bundled themes (`default`, `curriculum-vitae`, etc.).
- `admin-ui/`: Admin single-page application shell.
- `starter/`: Minimal site repository template for operators running Squilla.
- `.agents/skills/`: Domain-specific agent skills.

---

## 3. Agent Skills Reference

When executing specialized tasks, consult the matching skill in `.agents/skills/`:

- **Creating an Extension**: [.agents/skills/squilla-create-extension/SKILL.md](file:///.agents/skills/squilla-create-extension/SKILL.md)  
  *Covers folder anatomy, `extension.json` schema, gRPC lifecycle, capabilities, SQL migrations, and CoreAPI bindings.*
- **Building Extension Admin UI**: [.agents/skills/squilla-extension-frontend/SKILL.md](file:///.agents/skills/squilla-extension-frontend/SKILL.md)  
  *Covers React micro-frontends, Vite configuration, import maps, and shared UI contracts.*
- **Creating a Theme**: [.agents/skills/squilla-create-theme/SKILL.md](file:///.agents/skills/squilla-create-theme/SKILL.md)  
  *Covers `theme.json`, layouts, content blocks, templates, and theme settings.*
- **Creating a Content Block**: [.agents/skills/squilla-create-block/SKILL.md](file:///.agents/skills/squilla-create-block/SKILL.md)  
  *Covers `block.json`, `view.html`, the Zero Fallbacks Rule, link and repeater typing, complete field type reference, and production examples.*

---

## 4. Engineering Standards & Workflows

### Static Analysis & Verification
- **Go**:
  - Run tests: `go test -race ./...` or target package `go test ./internal/coreapi/...`
  - Compile check: `go build -o /dev/null ./cmd/squilla`
- **Frontend (`admin-ui` & extensions)**:
  - Lint / formatting: `biome check <file>` or `biome check --write <file>`
  - Typecheck: `cd admin-ui && npx tsc --noEmit`
- **Docker / CI**:
  - Main image published via `.github/workflows/publish-image.yml` to `ghcr.io/erikkubica/squilla`.
  - Supports native multi-arch (`linux/amd64`, `linux/arm64`) using `--platform=$BUILDPLATFORM` cross-compilation.

### Scope & Patch Discipline
- **Minimal Diff**: Touch only the exact files and lines required for the requested change.
- **Fail-Closed**: Always validate inputs at boundaries and reject malformed data cleanly.
- **No Unused Code in Core**: Always protect kernel boundaries against feature creep.
