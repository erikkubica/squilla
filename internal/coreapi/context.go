package coreapi

import "context"

type ctxKey int

const callerKey ctxKey = iota

// CallerInfo identifies the caller of a CoreAPI method and carries
// the trust facts the capability guard needs: which capabilities the
// caller's extension declared, and which database tables it owns.
//
// OwnedTables gates the Data* methods. Without it, an extension
// granted data:read could SELECT * FROM users (password_hash exposed),
// sessions (token_hash exposed), password_reset_tokens, etc. The map
// is populated from the extension manifest's `data_owned_tables`
// declaration; "internal" callers bypass the check entirely.
//
// OwnedFunctions gates DataCall the same way, populated from the
// manifest's `data_owned_functions`.
type CallerInfo struct {
	Slug           string
	Type           string // "tengo", "grpc", "internal"
	Capabilities   map[string]bool
	OwnedTables    map[string]bool
	OwnedFunctions map[string]bool
}

func InternalCaller() CallerInfo {
	return CallerInfo{Slug: "", Type: "internal", Capabilities: nil, OwnedTables: nil}
}

func WithCaller(ctx context.Context, caller CallerInfo) context.Context {
	return context.WithValue(ctx, callerKey, caller)
}

// CallerFromContext returns the caller stored in ctx, or InternalCaller()
// when none is set. The unguarded CoreAPI implementation is called
// directly by kernel code with plain contexts and relies on that default.
func CallerFromContext(ctx context.Context) CallerInfo {
	if c, ok := ctx.Value(callerKey).(CallerInfo); ok {
		return c
	}
	return InternalCaller()
}

// guardCallerFromContext is CallerFromContext for the capability guard:
// it fails closed. Every legitimate guarded path (gRPC host server, Tengo
// adapter, MCP dispatch) sets an explicit CallerInfo, so a missing one is
// a wiring bug and gets an anonymous caller with no capabilities instead
// of full internal trust.
func guardCallerFromContext(ctx context.Context) CallerInfo {
	if c, ok := ctx.Value(callerKey).(CallerInfo); ok {
		return c
	}
	return CallerInfo{Type: "unknown"}
}
