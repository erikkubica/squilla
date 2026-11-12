package mcp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"runtime/debug"
	"strconv"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"squilla/internal/coreapi"
	"squilla/internal/models"
)

// scopeAllows reports whether the given scope may invoke a tool classified as
// class. Classes: "read" | "content" | "full".
// - read    — *.get / *.query / *.list / render
// - content — content mutations (nodes/taxonomies/menus/media/files)
// - full    — settings, users, extensions/themes, data.exec, http.fetch
func scopeAllows(scope, class string) bool {
	switch scope {
	case ScopeFull:
		return true
	case ScopeContent:
		return class == "read" || class == "content"
	case ScopeRead:
		return class == "read"
	}
	return false
}

// gate is the authorization path shared by tools and resources: token
// present, scope covers class, per-token rate limit. Returns an error code
// plus a caller-safe message when the request must be refused.
func (s *Server) gate(tok *models.McpToken, class, kind string) (code string, err error) {
	if tok == nil {
		return "unauthenticated", fmt.Errorf("missing token")
	}
	if !scopeAllows(tok.Scope, class) {
		return "scope_denied", fmt.Errorf("token scope %q cannot invoke %s %s", tok.Scope, class, kind)
	}
	if !s.limiter.allow(tok.ID) {
		return "rate_limited", fmt.Errorf("slow down: %s", s.limiter.describe())
	}
	return "", nil
}

// addTool is the single registration path for every MCP tool. It wires in the
// scope gate, rate limiter, audit log, panic recovery, and the InternalCaller
// context. Tool bodies return (data any, error); dispatch serializes data as
// JSON into a text tool result.
func (s *Server) addTool(tool mcp.Tool, class string, fn func(ctx context.Context, args map[string]any) (any, error)) {
	s.toolCatalog = append(s.toolCatalog, toolCatalogEntry{
		Name:        tool.Name,
		Description: tool.Description,
		Class:       class,
	})
	handler := func(ctx context.Context, req mcp.CallToolRequest) (result *mcp.CallToolResult, err error) {
		start := time.Now()
		args := req.GetArguments()
		tok := tokenFromCtx(ctx)
		var tokenID *int
		if tok != nil {
			tokenID = &tok.ID
		}

		entry := auditEntry{
			tokenID:  tokenID,
			tool:     tool.Name,
			argsHash: hashArgs(args),
		}

		defer func() {
			if r := recover(); r != nil {
				reqID := newRequestID()
				s.logger.Printf("PANIC in mcp tool %s request_id=%s: %v\n%s", tool.Name, reqID, r, debug.Stack())
				result = mcp.NewToolResultError("internal: " + internalMessage(reqID))
				entry.status = "error"
				entry.errorCode = "panic"
			}
			entry.durationMs = sinceMs(start)
			s.auditor.log(entry)
		}()

		if code, gerr := s.gate(tok, class, "tools"); gerr != nil {
			entry.status = "denied"
			entry.errorCode = code
			return toolError(code, gerr), nil
		}

		// Every tool talks to CoreAPI as InternalCaller — MCP is trusted kernel
		// infrastructure. Scope gating above already enforces per-token limits.
		coreCtx := coreapi.WithCaller(ctx, coreapi.InternalCaller())

		data, err := fn(coreCtx, args)
		if err != nil {
			code, msg := publicError(s.logger, tool.Name, err)
			entry.status = "error"
			entry.errorCode = code
			return mcp.NewToolResultError(code + ": " + msg), nil
		}
		entry.status = "ok"

		payload, err := json.Marshal(data)
		if err != nil {
			entry.status = "error"
			entry.errorCode = "marshal"
			reqID := newRequestID()
			s.logger.Printf("tool=%s request_id=%s marshal result: %v", tool.Name, reqID, err)
			return mcp.NewToolResultError("internal: " + internalMessage(reqID)), nil
		}
		return mcp.NewToolResultText(string(payload)), nil
	}

	s.mcp.AddTool(tool, handler)
}

// wrapResource applies the tool gate (scope class "read"), rate limiter,
// audit log, panic recovery and InternalCaller context to a resource read.
// Resources used to be registered straight on the MCP server, so an
// unauthenticated session or a rate-limited token could still read them
// and nothing was audited.
func (s *Server) wrapResource(name string, fn func(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error)) func(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
	return func(ctx context.Context, req mcp.ReadResourceRequest) (contents []mcp.ResourceContents, err error) {
		start := time.Now()
		tok := tokenFromCtx(ctx)
		var tokenID *int
		if tok != nil {
			tokenID = &tok.ID
		}
		entry := auditEntry{
			tokenID:  tokenID,
			tool:     "resource:" + name,
			argsHash: hashArgs(map[string]any{"uri": req.Params.URI}),
		}
		defer func() {
			if r := recover(); r != nil {
				reqID := newRequestID()
				s.logger.Printf("PANIC in mcp resource %s request_id=%s: %v\n%s", name, reqID, r, debug.Stack())
				contents = nil
				err = errors.New("internal: " + internalMessage(reqID))
				entry.status = "error"
				entry.errorCode = "panic"
			}
			entry.durationMs = sinceMs(start)
			s.auditor.log(entry)
		}()

		if code, gerr := s.gate(tok, "read", "resources"); gerr != nil {
			entry.status = "denied"
			entry.errorCode = code
			return nil, fmt.Errorf("%s: %s", code, gerr.Error())
		}
		coreCtx := coreapi.WithCaller(ctx, coreapi.InternalCaller())
		out, ferr := fn(coreCtx, req)
		if ferr != nil {
			code, msg := publicError(s.logger, "resource:"+name, ferr)
			entry.status = "error"
			entry.errorCode = code
			return nil, errors.New(code + ": " + msg)
		}
		entry.status = "ok"
		return out, nil
	}
}

// coerceNumber accepts any JSON-decoded numeric value and returns an int64.
// Handles float64 (default JSON), json.Number, int, int64, uint, plus strings
// that parse cleanly — some MCP clients serialize IDs as strings.
func coerceNumber(v any) (int64, bool) {
	switch t := v.(type) {
	case float64:
		return int64(t), true
	case float32:
		return int64(t), true
	case int:
		return int64(t), true
	case int32:
		return int64(t), true
	case int64:
		return t, true
	case uint:
		return int64(t), true
	case uint32:
		return int64(t), true
	case uint64:
		return int64(t), true
	case string:
		if t == "" {
			return 0, false
		}
		if n, err := strconv.ParseInt(t, 10, 64); err == nil {
			return n, true
		}
	case json.Number:
		if n, err := t.Int64(); err == nil {
			return n, true
		}
	}
	return 0, false
}

// stringArg extracts a string arg, returning "" if missing.
func stringArg(args map[string]any, key string) string {
	if v, ok := args[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// intArg extracts an int arg. Accepts any numeric type or numeric string.
func intArg(args map[string]any, key string) int {
	if v, ok := args[key]; ok {
		if n, ok := coerceNumber(v); ok {
			return int(n)
		}
	}
	return 0
}

// uintArg extracts a uint arg.
func uintArg(args map[string]any, key string) uint {
	return uint(intArg(args, key))
}

// boolArg extracts a bool arg.
func boolArg(args map[string]any, key string) bool {
	if v, ok := args[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

// mapArg extracts a nested object; always non-nil.
func mapArg(args map[string]any, key string) map[string]any {
	if v, ok := args[key]; ok {
		if m, ok := v.(map[string]any); ok {
			return m
		}
	}
	return map[string]any{}
}

// ensure server package referenced to avoid unused-import warnings when tools
// files are added incrementally.
var _ = server.NewMCPServer
