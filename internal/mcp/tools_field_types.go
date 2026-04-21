package mcp

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"

	"vibecms/internal/cms/field_types"
)

func (s *Server) registerFieldTypeTools() {
	s.addTool(mcp.NewTool("core.field_types.list",
		mcp.WithDescription("List all built-in field types with their how_to guides. Use before designing a node type's field_schema — the how_to text describes when each type is appropriate. Extension-contributed field types are not returned here; use core.extension.list and check each extension's admin_ui.field_types."),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return map[string]any{"builtin": field_types.Builtin()}, nil
	})
}
