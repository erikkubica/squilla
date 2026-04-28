package mcp

import (
	"context"

	"squilla/internal/models"
)

type ctxKey int

const (
	ctxKeyToken ctxKey = iota
	ctxKeyConfig
)

// withToken attaches a validated McpToken to ctx for downstream tool handlers.
func withToken(ctx context.Context, tok *models.McpToken) context.Context {
	return context.WithValue(ctx, ctxKeyToken, tok)
}

// tokenFromCtx returns the validated token, or nil.
func tokenFromCtx(ctx context.Context) *models.McpToken {
	tok, _ := ctx.Value(ctxKeyToken).(*models.McpToken)
	return tok
}

// withServer attaches the Server so tool handlers can reach shared services.
func withServer(ctx context.Context, s *Server) context.Context {
	return context.WithValue(ctx, ctxKeyConfig, s)
}

func serverFromCtx(ctx context.Context) *Server {
	s, _ := ctx.Value(ctxKeyConfig).(*Server)
	return s
}
