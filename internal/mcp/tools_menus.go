package mcp

import (
	"context"
	"encoding/json"

	"github.com/mark3labs/mcp-go/mcp"

	"vibecms/internal/coreapi"
)

func (s *Server) registerMenuTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.menu.list",
		mcp.WithDescription("List all menus with their items."),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetMenus(ctx)
	})

	s.addTool(mcp.NewTool("core.menu.get",
		mcp.WithDescription("Fetch a menu by slug."),
		mcp.WithString("slug", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetMenu(ctx, stringArg(args, "slug"))
	})

	s.addTool(mcp.NewTool("core.menu.create",
		mcp.WithDescription("Create a new menu. items is an array of {label,url,target?,parent_id?,position?,children?}."),
		mcp.WithString("name", mcp.Required()),
		mcp.WithString("slug"),
		mcp.WithArray("items"),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		return api.CreateMenu(ctx, menuInputFromArgs(args))
	})

	s.addTool(mcp.NewTool("core.menu.update",
		mcp.WithDescription("Update a menu by slug."),
		mcp.WithString("slug", mcp.Required()),
		mcp.WithString("name"),
		mcp.WithArray("items"),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		return api.UpdateMenu(ctx, stringArg(args, "slug"), menuInputFromArgs(args))
	})

	s.addTool(mcp.NewTool("core.menu.delete",
		mcp.WithDescription("Delete a menu by slug."),
		mcp.WithString("slug", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.DeleteMenu(ctx, stringArg(args, "slug"))
		return map[string]any{"ok": err == nil}, err
	})
}

func menuInputFromArgs(args map[string]any) coreapi.MenuInput {
	in := coreapi.MenuInput{
		Name: stringArg(args, "name"),
		Slug: stringArg(args, "slug"),
	}
	if raw, ok := args["items"]; ok {
		b, _ := json.Marshal(raw)
		var items []coreapi.MenuItem
		_ = json.Unmarshal(b, &items)
		in.Items = items
	}
	return in
}
