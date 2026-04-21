package mcp

import (
	"context"
	"encoding/base64"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
)

func (s *Server) registerFilesTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.files.store",
		mcp.WithDescription("Store a file on the configured storage backend at the given relative path. Returns the stored path. Prefer core.media.upload for anything that needs a DB record and URL."),
		mcp.WithString("path", mcp.Required()),
		mcp.WithString("body_base64", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		raw, err := base64.StdEncoding.DecodeString(stringArg(args, "body_base64"))
		if err != nil {
			return nil, fmt.Errorf("decode body_base64: %w", err)
		}
		stored, err := api.StoreFile(ctx, stringArg(args, "path"), raw)
		return map[string]any{"path": stored}, err
	})

	s.addTool(mcp.NewTool("core.files.delete",
		mcp.WithDescription("Delete a stored file by relative path."),
		mcp.WithString("path", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.DeleteFile(ctx, stringArg(args, "path"))
		return map[string]any{"ok": err == nil}, err
	})
}
