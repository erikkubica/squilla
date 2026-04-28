package mcp

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/cms"
)

func (s *Server) registerRenderTools() {
	// PublicHandler carries the rendering primitives (block lookups, layout
	// resolver, TemplateRenderer). We reach it via a small wrapper on Deps.
	pub := s.publicHandler()

	s.addTool(mcp.NewTool("core.render.block",
		mcp.WithDescription("Smoke-test ONE block with given field values. Returns rendered HTML. No writes, no events, no view counts.\n\nUse when: iterating on a block template and you want to see what it produces. Validating test_data during block creation.\nDO NOT use when: rendering a full page — use core.render.node_preview. Rendering a layout with multiple blocks — use core.render.layout."),
		mcp.WithString("block_type", mcp.Required(), mcp.Description("Block type slug (e.g. 'hero', 'text_columns')")),
		mcp.WithObject("fields", mcp.Required(), mcp.Description("Field values keyed by field name")),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		if pub == nil {
			return nil, fmt.Errorf("render tools not wired: PublicHandler missing from MCP Deps")
		}
		html, err := pub.RenderBlockPreview(stringArg(args, "block_type"), mapArg(args, "fields"))
		if err != nil {
			return nil, err
		}
		return map[string]any{"html": html}, nil
	})

	s.addTool(mcp.NewTool("core.render.layout",
		mcp.WithDescription("Render a layout with a given sequence of inline blocks. Returns the full page HTML. Pass blocks as an array of {type, fields} objects."),
		mcp.WithString("layout_slug", mcp.Required()),
		mcp.WithString("language_code", mcp.Description("Optional — uses default language if omitted")),
		mcp.WithArray("blocks", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		if pub == nil {
			return nil, fmt.Errorf("render tools not wired: PublicHandler missing from MCP Deps")
		}
		rawBlocks, _ := args["blocks"]
		blocks, err := coerceBlocks(rawBlocks)
		if err != nil {
			return nil, err
		}
		html, err := pub.RenderLayoutPreview(stringArg(args, "layout_slug"), blocks, stringArg(args, "language_code"))
		if err != nil {
			return nil, err
		}
		return map[string]any{"html": html}, nil
	})

	s.addTool(mcp.NewTool("core.render.node_preview",
		mcp.WithDescription("Render a node AS A FULL PAGE — layout + blocks + theme CSS — exactly as the public site would serve it. Side-effect-free: no view counts, no events, safe to call repeatedly.\n\nUse when: verifying a node renders correctly before telling the user 'done'. Reproducing a rendering bug. Previewing a draft.\nDO NOT use when: testing a single block in isolation — use core.render.block."),
		mcp.WithNumber("id", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		if pub == nil {
			return nil, fmt.Errorf("render tools not wired: PublicHandler missing from MCP Deps")
		}
		html, err := pub.RenderNodePreview(uintArg(args, "id"))
		if err != nil {
			return nil, err
		}
		return map[string]any{"html": html}, nil
	})
}

// coerceBlocks converts an arbitrary MCP array payload into the
// []map[string]interface{} shape renderBlocksBatch expects.
func coerceBlocks(raw any) ([]map[string]interface{}, error) {
	b, err := json.Marshal(raw)
	if err != nil {
		return nil, fmt.Errorf("marshal blocks: %w", err)
	}
	var out []map[string]interface{}
	if err := json.Unmarshal(b, &out); err != nil {
		return nil, fmt.Errorf("blocks must be an array of {type, fields} objects: %w", err)
	}
	return out, nil
}

// publicHandler returns the PublicHandler from Deps if wired, nil otherwise.
// The render tools use this to reach the shared rendering primitives.
func (s *Server) publicHandler() *cms.PublicHandler {
	return s.deps.PublicHandler
}
