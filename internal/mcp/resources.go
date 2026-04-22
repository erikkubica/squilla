package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
)

// registerResources exposes CMS entities as MCP resources under the vibecms://
// URI scheme. Clients can list and read these for discovery; mutations always
// go through tools.
func (s *Server) registerResources() {
	api := s.deps.CoreAPI

	// Node resource — dynamic URI template vibecms://nodes/{id}
	s.mcp.AddResourceTemplate(
		mcp.NewResourceTemplate(
			"vibecms://nodes/{id}",
			"VibeCMS node",
			mcp.WithTemplateDescription("A content node (page, post, etc.) by numeric ID. URI form: vibecms://nodes/{id}"),
			mcp.WithTemplateMIMEType("application/json"),
		),
		func(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
			id, err := parseResourceID(req.Params.URI, "vibecms://nodes/")
			if err != nil {
				return nil, err
			}
			node, err := api.GetNode(ctx, id)
			if err != nil {
				return nil, err
			}
			return jsonResource(req.Params.URI, node)
		},
	)

	// Theme resource — vibecms://themes/{slug}
	s.mcp.AddResourceTemplate(
		mcp.NewResourceTemplate(
			"vibecms://themes/{slug}",
			"VibeCMS theme",
			mcp.WithTemplateDescription("A theme by slug."),
			mcp.WithTemplateMIMEType("application/json"),
		),
		func(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
			if s.deps.ThemeMgmtSvc == nil {
				return nil, fmt.Errorf("theme management service not wired")
			}
			slug := strings.TrimPrefix(req.Params.URI, "vibecms://themes/")
			themes, err := s.deps.ThemeMgmtSvc.List()
			if err != nil {
				return nil, err
			}
			for _, t := range themes {
				if t.Slug == slug {
					return jsonResource(req.Params.URI, t)
				}
			}
			return nil, fmt.Errorf("theme %q not found", slug)
		},
	)

	// Extension resource — vibecms://extensions/{slug}
	s.mcp.AddResourceTemplate(
		mcp.NewResourceTemplate(
			"vibecms://extensions/{slug}",
			"VibeCMS extension",
			mcp.WithTemplateDescription("An extension by slug."),
			mcp.WithTemplateMIMEType("application/json"),
		),
		func(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
			if s.deps.ExtensionLoader == nil {
				return nil, fmt.Errorf("extension loader not wired")
			}
			slug := strings.TrimPrefix(req.Params.URI, "vibecms://extensions/")
			ext, err := s.deps.ExtensionLoader.GetBySlug(slug)
			if err != nil {
				return nil, err
			}
			return jsonResource(req.Params.URI, ext)
		},
	)

	// Theme Guidelines resource — vibecms://guidelines/themes
	s.mcp.AddResource(
		mcp.NewResource(
			"vibecms://guidelines/themes",
			"Theme Development Standards",
			mcp.WithDescription("Official VibeCMS theme development guidelines (Rules 1.1 - 1.6)."),
			mcp.WithMIMEType("application/json"),
		),
		func(ctx context.Context, req mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
			return jsonResource(req.Params.URI, themeStandards())
		},
	)
}

func parseResourceID(uri, prefix string) (uint, error) {
	rest := strings.TrimPrefix(uri, prefix)
	id, err := strconv.ParseUint(rest, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid id in URI %q: %w", uri, err)
	}
	return uint(id), nil
}

func jsonResource(uri string, v any) ([]mcp.ResourceContents, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	return []mcp.ResourceContents{
		mcp.TextResourceContents{
			URI:      uri,
			MIMEType: "application/json",
			Text:     string(b),
		},
	}, nil
}
