# VibeCMS

A high-performance, AI-native Go-based CMS optimized for sub-50ms TTFB, featuring a block-based JSON editor, zero-rebuild extension architecture (via Tengo), and automated SEO for agency-managed independent site deployments.

## Tech Stack
- **Languages:** Go 1.22+
- **Frameworks:** Fiber (routing, middleware), GORM (PostgreSQL ORM)
- **Database:** PostgreSQL 16+ (leveraging JSONB and GIN indexes)
- **Frontend/Admin:** React + TypeScript SPA (admin), Tailwind CSS
- **Templating:** Go `html/template` (layouts, partials, content blocks — all use the same engine)
- **Scripting:** Tengo (embedded sandboxed VM for hooks)
- **Storage:** AWS S3/Cloudflare R2 (S3-compatible) & Local Disk
- **Integrations:** Resend (email), OpenAI/Anthropic (AI), Ahrefs/Semrush (SEO)
- **Security:** Ed25519 (license verification)

## Architecture Overview
VibeCMS utilizes a "single-binary, single-site" deployment model. The "Vibe Loop" renders content by fetching JSONB blocks from Postgres, passing them through Tengo scripts for logic-injection, and rendering HTML via Go's `html/template` engine. Layouts define full page structure (`<head>` to `</footer>`), layout blocks are reusable partials (headers, footers, navs), and content blocks render individual page sections — all using the same Go template engine with a shared context (`.app` for global data, `.node` for current page). Themes register layouts, partials, blocks, and assets via `theme.json` manifests. Admin UI is a React + TypeScript SPA. Internal health monitoring APIs allow agency-level aggregation via static bearer tokens.

## Folder Structure
- `cmd/vibecms/`: Application entry point.
- `internal/`: Private core logic:
    - `cms/`: The core rendering loop and node management.
    - `scripting/`: Tengo VM runtime and hook management.
    - `models/`: GORM models, specifically `content_node` with JSONB.
    - `db/`: Migrations and connection pooling.
- `themes/`: Theme repository containing layouts, partials, blocks, assets, and `.tgo` extension scripts.
- `admin-ui/`: React + TypeScript admin SPA (Vite, Tailwind CSS, shadcn/ui).
- `pkg/`: Shared utility libraries (JSON-schema helpers).
- `storage/`: Local asset storage and backup cache.

## Key Conventions
- **Zero-Rebuild Hooks:** Use `.tgo` scripts in `themes/{theme}/scripts/` for custom logic.
- **Node-Based Content:** All pages, posts, and entities are treated as `content_nodes` with `blocks_data` storage.
- **Admin UI:** React SPA served at `/admin/*`. API endpoints at `/admin/api/*` with session-based auth.
- **Hard-Fail vs. Soft-Fail:** 
    - Database connectivity failures should trigger a fatal server halt.
    - Missing themes or Tengo script errors should log warnings but continue execution.
    - Invalid licenses should disable AI and Tengo features but keep the public site active.
- **Security:** Ensure scripts are executed within a sandboxed `tengo.VM` with restricted I/O.
- **Naming:** Follow `snake_case` for Go files, `.html` for templates (layouts, partials, blocks), `.tgo` for scripting hooks. Template variables use `snake_case` (`.app.head_styles`, `.node.blocks_html`).
- **Performance:** Always prefer atomic operations for hot-swapped configuration maps and cache management.