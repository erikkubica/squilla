package mcp

import (
	"context"
	"encoding/json"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/coreapi"
)

func (s *Server) registerHTTPTools() {
	api := s.deps.CoreAPI

	// Gated to scope=full because this is SSRF-reachable.
	s.addTool(mcp.NewTool("core.http.fetch",
		mcp.WithDescription("Make an outbound HTTP request. Requires 'full' scope (SSRF risk). Returns {status_code, headers, body}."),
		mcp.WithString("method", mcp.DefaultString("GET"), mcp.Enum("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD")),
		mcp.WithString("url", mcp.Required()),
		mcp.WithObject("headers"),
		mcp.WithString("body"),
		mcp.WithNumber("timeout", mcp.Description("Seconds; default 30")),
	), "full", func(ctx context.Context, args map[string]any) (any, error) {
		req := coreapi.FetchRequest{
			Method:  stringArg(args, "method"),
			URL:     stringArg(args, "url"),
			Body:    stringArg(args, "body"),
			Timeout: intArg(args, "timeout"),
		}
		if raw, ok := args["headers"]; ok {
			b, _ := json.Marshal(raw)
			_ = json.Unmarshal(b, &req.Headers)
		}
		return api.Fetch(ctx, req)
	})
}
