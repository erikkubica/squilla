package mcp

import (
	"context"
	"strings"
	"testing"

	"squilla/internal/models"
)

// guardDataTable is the MCP-side table policy for core.data.*. Coverage
// here matters because the bypass it closes — a scope=read token reading
// the users table — would let any AI agent dump every password hash.

func TestGuardDataTable_DeniesUnlistedTablesForReadScope(t *testing.T) {
	// The read/content allow-list is empty: ordinary (non-kernel) tables
	// are still refused, with guidance towards typed tools / full scope.
	ctx := withToken(context.Background(), &models.McpToken{Scope: ScopeRead})
	for _, tab := range []string{"media_files", "content_nodes", "form_submissions"} {
		err := guardDataTable(ctx, tab)
		if err == nil {
			t.Errorf("table %q allowed for scope=read", tab)
		} else if !strings.Contains(err.Error(), "scope=full") {
			t.Errorf("expected scope=full guidance in error, got %v", err)
		}
	}
}

func TestGuardKernelTable_RefusesPrivateTablesForReadScope(t *testing.T) {
	ctx := withToken(context.Background(), &models.McpToken{Scope: ScopeRead})
	for _, tab := range []string{"users", "sessions", "password_reset_tokens", "mcp_tokens"} {
		if err := guardDataTable(ctx, tab); err == nil {
			t.Errorf("kernel-private %q allowed for scope=read", tab)
		} else if !strings.Contains(err.Error(), "kernel-private") {
			t.Errorf("expected kernel-private mention in error, got %v", err)
		}
	}
}

func TestGuardKernelTable_RefusesPrivateTablesForContentScope(t *testing.T) {
	// scope=content can mutate but still mustn't reach auth tables.
	ctx := withToken(context.Background(), &models.McpToken{Scope: ScopeContent})
	if err := guardDataTable(ctx, "users"); err == nil {
		t.Fatal("scope=content should be denied on users table")
	}
}

func TestGuardKernelTable_AllowsPrivateTablesForFullScope(t *testing.T) {
	// scope=full is admin-equivalent by design — operator opted in
	// when issuing the token, so direct access stays open.
	ctx := withToken(context.Background(), &models.McpToken{Scope: ScopeFull})
	for _, tab := range []string{"users", "sessions", "audit_log"} {
		if err := guardDataTable(ctx, tab); err != nil {
			t.Errorf("scope=full denied on %q: %v", tab, err)
		}
	}
}

func TestGuardKernelTable_DeniesWithoutToken(t *testing.T) {
	// Defensive: a context with no token (shouldn't happen post-auth
	// middleware, but tools shouldn't trust that) treats as
	// non-full-scope, i.e. still gated.
	if err := guardDataTable(context.Background(), "users"); err == nil {
		t.Fatal("missing token should not bypass kernel-private guard")
	}
}
