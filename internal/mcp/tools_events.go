package mcp

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
)

func (s *Server) registerEventTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.event.emit",
		mcp.WithDescription("Emit a custom event on the event bus. Extensions and Tengo scripts subscribed to 'action' receive the payload."),
		mcp.WithString("action", mcp.Required()),
		mcp.WithObject("payload"),
	), "full", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.Emit(ctx, stringArg(args, "action"), mapArg(args, "payload"))
		return map[string]any{"ok": err == nil}, err
	})
}
