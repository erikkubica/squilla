package mcp

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
)

func (s *Server) registerSettingsTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.settings.get",
		mcp.WithDescription("Get one site setting by key (e.g. 'site.name', 'active_theme')."),
		mcp.WithString("key", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		v, err := api.GetSetting(ctx, stringArg(args, "key"))
		return map[string]any{"key": stringArg(args, "key"), "value": v}, err
	})

	s.addTool(mcp.NewTool("core.settings.list",
		mcp.WithDescription("List settings, optionally filtered by key prefix."),
		mcp.WithString("prefix"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetSettings(ctx, stringArg(args, "prefix"))
	})

	s.addTool(mcp.NewTool("core.settings.set",
		mcp.WithDescription("Set a site setting. Requires 'full' scope — settings can alter CMS-wide behavior."),
		mcp.WithString("key", mcp.Required()),
		mcp.WithString("value", mcp.Required()),
	), "full", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.SetSetting(ctx, stringArg(args, "key"), stringArg(args, "value"))
		return map[string]any{"ok": err == nil}, err
	})
}
