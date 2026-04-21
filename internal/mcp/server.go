// Package mcp exposes VibeCMS as a Model Context Protocol server. AI clients
// authenticated with a bearer token can CRUD every CMS entity, render blocks
// and layouts, manage themes and extensions, and query the underlying CoreAPI.
package mcp

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/mark3labs/mcp-go/server"
	"gorm.io/gorm"

	"vibecms/internal/cms"
	"vibecms/internal/coreapi"
	"vibecms/internal/rendering"
)

// Deps holds the dependencies MCP tools need. Assembled once at boot.
type Deps struct {
	DB               *gorm.DB
	CoreAPI          coreapi.CoreAPI
	TokenSvc         *TokenService
	ContentSvc       *cms.ContentService
	ExtensionLoader  *cms.ExtensionLoader
	ExtensionHandler *cms.ExtensionHandler
	ThemeLoader      *cms.ThemeLoader
	ThemeMgmtSvc     *cms.ThemeMgmtService
	TemplateRenderer *rendering.TemplateRenderer
	BlockTypeSvc     *cms.BlockTypeService
	LayoutSvc        *cms.LayoutService
	PublicHandler    *cms.PublicHandler
}

// Server is the MCP adapter. One instance per process; mounted on Fiber at /mcp.
type Server struct {
	deps    Deps
	mcp     *server.MCPServer
	http    *server.StreamableHTTPServer
	limiter *perTokenLimiter
	auditor *auditor
	logger  *log.Logger
	// allowRawSQL gates core.data.exec behind an env flag in addition to scope=full.
	allowRawSQL bool
}

// New constructs the MCP server and registers every tool and resource.
func New(deps Deps) *Server {
	s := &Server{
		deps:        deps,
		limiter:     newPerTokenLimiter(60, 10),
		auditor:     newAuditor(deps.DB),
		logger:      log.New(os.Stderr, "[mcp] ", log.LstdFlags),
		allowRawSQL: strings.EqualFold(os.Getenv("VIBECMS_MCP_ALLOW_RAW_SQL"), "true"),
	}

	s.mcp = server.NewMCPServer(
		"vibecms",
		"0.1.0",
		server.WithInstructions(instructionText),
		server.WithToolCapabilities(true),
		server.WithResourceCapabilities(true, false),
	)

	// Streamable HTTP is the newer MCP transport — bidirectional HTTP without
	// long-lived SSE connections. Compatible with modern Claude clients.
	s.http = server.NewStreamableHTTPServer(
		s.mcp,
		server.WithHTTPContextFunc(func(ctx context.Context, r *http.Request) context.Context {
			// Validate the bearer token directly from the HTTP request. The
			// Fiber→http adaptor does not forward Fiber's UserContext, so we
			// re-parse the header here — a cheap DB lookup since the token
			// is hashed and indexed.
			if raw := extractBearer(r.Header.Get("Authorization")); raw != "" {
				if tok, err := s.deps.TokenSvc.Validate(raw); err == nil {
					ctx = context.WithValue(ctx, ctxKeyToken, tok)
				}
			}
			ctx = withServer(ctx, s)
			return ctx
		}),
	)

	s.registerCoreTools()
	s.registerSystemTools()
	s.registerRenderTools()
	s.registerResources()

	return s
}

// Mount wires /mcp on the given Fiber app. Bearer auth runs first; every tool
// call passes through authMiddleware before reaching the MCP handler.
// SetExtensionHandler wires the ExtensionHandler after construction. Needed
// because in main.go the handler is created after the MCP server (it depends
// on PluginManager, which depends on infrastructure set up later).
func (s *Server) SetExtensionHandler(h *cms.ExtensionHandler) {
	s.deps.ExtensionHandler = h
}

func (s *Server) Mount(app *fiber.App) {
	h := adaptor.HTTPHandler(s.http)
	app.All("/mcp", s.authMiddleware(), h)
	app.All("/mcp/*", s.authMiddleware(), h)
}

// registerCoreTools is defined in tools_*.go files; each domain lives in its
// own file for navigability. The split is purely organisational.
func (s *Server) registerCoreTools() {
	s.registerNodeTools()
	s.registerNodeTypeTools()
	s.registerTaxonomyTools()
	s.registerMenuTools()
	s.registerSettingsTools()
	s.registerMediaTools()
	s.registerUserTools()
	s.registerDataTools()
	s.registerFilesTools()
	s.registerHTTPTools()
	s.registerEventTools()
	s.registerFilterTools()
	s.registerFieldTypeTools()
	s.registerEmailTools()
}

const instructionText = `VibeCMS — an AI-native CMS exposed via MCP.

Every tool is namespaced core.<domain>.<verb>. Tools with "query" or "list" in
the name accept optional limit (default 25, max 200) and offset. Use
core.render.block / core.render.layout / core.render.node_preview to preview
content without publishing. core.extension.activate / core.extension.deactivate
flip the is_active flag but require a process restart to fully load plugin
binaries (the response carries restart_required=true).`
