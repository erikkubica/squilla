package mcp

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
)

func (s *Server) registerFilterTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.filter.apply",
		mcp.WithDescription("Run the filter chain for 'name' against 'value' and return the filtered result. Useful for testing filter registrations."),
		mcp.WithString("name", mcp.Required()),
		mcp.WithObject("value"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		v, ok := args["value"]
		if !ok {
			v = nil
		}
		return api.ApplyFilters(ctx, stringArg(args, "name"), v)
	})
}
