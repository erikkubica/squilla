package mcp

import (
	"context"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/coreapi"
)

func (s *Server) registerEmailTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.email.send",
		mcp.WithDescription("Send an email via the configured email provider extension (smtp-provider, resend-provider, etc). Requires an email extension to be active; otherwise the event is dropped."),
		mcp.WithArray("to", mcp.Required(), mcp.Description("Array of recipient addresses")),
		mcp.WithString("subject", mcp.Required()),
		mcp.WithString("html", mcp.Required(), mcp.Description("HTML body")),
	), "full", func(ctx context.Context, args map[string]any) (any, error) {
		req := coreapi.EmailRequest{
			Subject: stringArg(args, "subject"),
			HTML:    stringArg(args, "html"),
		}
		if v, ok := args["to"]; ok {
			decoded := jsonFieldDecode(v)
			if arr, ok := decoded.([]any); ok {
				for _, item := range arr {
					if s, ok := item.(string); ok {
						req.To = append(req.To, s)
					}
				}
			}
		}
		if len(req.To) == 0 {
			return nil, fmt.Errorf("to is required (non-empty array of addresses)")
		}
		if err := api.SendEmail(ctx, req); err != nil {
			return nil, err
		}
		return map[string]any{"ok": true}, nil
	})
}
