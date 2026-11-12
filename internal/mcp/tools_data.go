package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/coreapi"
)

// dataToolScopedTables is the allow-list of tables the generic
// core.data.* tools may touch with a read or content token. It is
// deliberately empty: every table that is safe for those scopes already
// has a typed tool (core.node.*, core.media.*, core.menu.*,
// core.taxonomy.*, ...) that applies the right validation and events,
// while everything else is either configuration that the typed tools
// class as "full" (extensions, themes, layouts, block_types, templates,
// email_rules, email_templates, forms, redirects, system_actions — an
// extensions row alone is loaded at next boot) or private data
// (email_logs with rendered reset links, form_submissions, analytics).
// Add a table here only if it is non-sensitive for reads AND writes.
var dataToolScopedTables = map[string]bool{}

// guardDataTable gates the generic core.data.* tools. dispatch.go runs
// every tool as coreapi.InternalCaller, which makes the CoreAPI per-table
// data guard a no-op, so the MCP layer enforces its own policy:
//
//   - scope=full: admin-equivalent by design (the operator opted in when
//     issuing the token) — any table, including kernel-private ones.
//   - scope=read/content: kernel-private tables are always refused; any
//     other table must be in dataToolScopedTables.
func guardDataTable(ctx context.Context, table string) error {
	tok := tokenFromCtx(ctx)
	if tok != nil && tok.Scope == ScopeFull {
		return nil
	}
	if coreapi.IsKernelPrivateTable(table) {
		return fmt.Errorf("table %q is kernel-private; scope=full required for direct access", table)
	}
	norm := strings.Trim(strings.ToLower(strings.TrimSpace(table)), `"`)
	if dataToolScopedTables[norm] {
		return nil
	}
	scope := "none"
	if tok != nil {
		scope = tok.Scope
	}
	return fmt.Errorf("table %q is not open to core.data.* for scope=%s; use the typed tools (core.node.*, core.media.*, core.menu.*, core.taxonomy.*, ...) or a scope=full token", table, scope)
}

// dataScopeNote is appended to every core.data.* description.
const dataScopeNote = " Generic table access requires a scope=full token (read/content tokens are limited to an explicit allow-list, currently empty) — use the typed domain tools instead."

// checkRawWhere gates core.data.query's raw/args. The fragment is
// concatenated into the WHERE clause and MCP runs as InternalCaller, so a
// sub-select would read any table regardless of guardDataTable. Raw is
// therefore scope=full only, and even then limited to the conservative
// coreapi.ValidateRawWhere grammar unless the operator enabled raw SQL
// (SQUILLA_MCP_ALLOW_RAW_SQL=true), which already grants core.data.exec.
func (s *Server) checkRawWhere(ctx context.Context, raw string, hasArgs bool) error {
	if raw == "" && !hasArgs {
		return nil
	}
	tok := tokenFromCtx(ctx)
	if tok == nil || tok.Scope != ScopeFull {
		return fmt.Errorf("'raw'/'args' require a scope=full token; use 'where' (column equality) and 'search' instead")
	}
	if s.allowRawSQL || raw == "" {
		return nil
	}
	return coreapi.ValidateRawWhere(raw)
}

func (s *Server) registerDataTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.data.get",
		mcp.WithDescription("Low-level: read a row from a table by ID. Prefer domain tools (core.node.*, etc.)."+dataScopeNote),
		mcp.WithString("table", mcp.Required()),
		mcp.WithNumber("id", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		table := stringArg(args, "table")
		if err := guardDataTable(ctx, table); err != nil {
			return nil, err
		}
		return api.DataGet(ctx, table, uintArg(args, "id"))
	})

	s.addTool(mcp.NewTool("core.data.query",
		mcp.WithDescription("Low-level: query rows from a table with where (column equality)/search/order_by (column [ASC|DESC], comma-separated). 'raw' is a WHERE-fragment with ? placeholders bound from 'args' — scope=full only, and limited to plain column comparisons (no sub-queries or function calls beyond lower/upper/coalesce/now) unless the server enables raw SQL."+dataScopeNote),
		mcp.WithString("table", mcp.Required()),
		mcp.WithObject("where"),
		mcp.WithString("search"),
		mcp.WithString("order_by"),
		mcp.WithNumber("limit"),
		mcp.WithNumber("offset"),
		mcp.WithString("raw"),
		mcp.WithArray("args"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		table := stringArg(args, "table")
		if err := guardDataTable(ctx, table); err != nil {
			return nil, err
		}
		q := coreapi.DataStoreQuery{
			Where:   mapArg(args, "where"),
			Search:  stringArg(args, "search"),
			OrderBy: stringArg(args, "order_by"),
			Limit:   clampLimit(intArg(args, "limit")),
			Offset:  intArg(args, "offset"),
			Raw:     stringArg(args, "raw"),
		}
		_, hasArgs := args["args"]
		if err := s.checkRawWhere(ctx, q.Raw, hasArgs); err != nil {
			return nil, err
		}
		if raw, ok := args["args"]; ok {
			b, _ := json.Marshal(raw)
			_ = json.Unmarshal(b, &q.Args)
		}
		return api.DataQuery(ctx, table, q)
	})

	s.addTool(mcp.NewTool("core.data.create",
		mcp.WithDescription("Low-level: insert a row into a table. Returns the new row."+dataScopeNote),
		mcp.WithString("table", mcp.Required()),
		mcp.WithObject("data", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		table := stringArg(args, "table")
		if err := guardDataTable(ctx, table); err != nil {
			return nil, err
		}
		return api.DataCreate(ctx, table, mapArg(args, "data"))
	})

	s.addTool(mcp.NewTool("core.data.update",
		mcp.WithDescription("Low-level: update a row by ID."+dataScopeNote),
		mcp.WithString("table", mcp.Required()),
		mcp.WithNumber("id", mcp.Required()),
		mcp.WithObject("data", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		table := stringArg(args, "table")
		if err := guardDataTable(ctx, table); err != nil {
			return nil, err
		}
		err := api.DataUpdate(ctx, table, uintArg(args, "id"), mapArg(args, "data"))
		return map[string]any{"ok": err == nil}, err
	})

	s.addTool(mcp.NewTool("core.data.delete",
		mcp.WithDescription("Low-level: delete a row by ID."+dataScopeNote),
		mcp.WithString("table", mcp.Required()),
		mcp.WithNumber("id", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		table := stringArg(args, "table")
		if err := guardDataTable(ctx, table); err != nil {
			return nil, err
		}
		err := api.DataDelete(ctx, table, uintArg(args, "id"))
		return map[string]any{"ok": err == nil}, err
	})

	// Raw SQL is gated: scope=full AND the env flag must be set.
	if s.allowRawSQL {
		s.addTool(mcp.NewTool("core.data.exec",
			mcp.WithDescription("Execute a raw parameterized SQL statement. Gated behind scope=full and SQUILLA_MCP_ALLOW_RAW_SQL=true. Returns rows_affected. Use with extreme care — this bypasses all model-level validation and events."),
			mcp.WithString("sql", mcp.Required()),
			mcp.WithArray("args"),
		), "full", func(ctx context.Context, args map[string]any) (any, error) {
			sql := stringArg(args, "sql")
			if sql == "" {
				return nil, fmt.Errorf("sql is required")
			}
			var bound []any
			if raw, ok := args["args"]; ok {
				b, _ := json.Marshal(raw)
				_ = json.Unmarshal(b, &bound)
			}
			n, err := api.DataExec(ctx, sql, bound...)
			return map[string]any{"rows_affected": n}, err
		})
	}
}
