package mcp

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/coreapi"
)

func (s *Server) registerUserTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.user.get",
		mcp.WithDescription("Read-only: fetch a user record by ID. Password hashes are never exposed."),
		mcp.WithNumber("id", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetUser(ctx, uintArg(args, "id"))
	})

	s.addTool(mcp.NewTool("core.user.query",
		mcp.WithDescription("Read-only: list users with optional filters. MCP has no write access to users."),
		mcp.WithString("role_slug"),
		mcp.WithString("search"),
		mcp.WithNumber("limit"),
		mcp.WithNumber("offset"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.QueryUsers(ctx, coreapi.UserQuery{
			RoleSlug: stringArg(args, "role_slug"),
			Search:   stringArg(args, "search"),
			Limit:    clampLimit(intArg(args, "limit")),
			Offset:   intArg(args, "offset"),
		})
	})
}
