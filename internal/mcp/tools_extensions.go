package mcp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/auth"
	"squilla/internal/cms"
	"squilla/internal/events"
	"squilla/internal/models"
	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"
)

// Extension-owned MCP tools.
//
// An extension lists tools under "mcp_tools" in extension.json (see
// cms.McpToolEntry). While the extension is active each one is exposed as
// "ext.<slug>.<name>" and served by the plugin's HandleHTTPRequest — the
// handler behind /admin/api/ext/<slug>/* — so the kernel holds no
// feature-specific tool code and a deactivated extension leaves nothing
// behind.

const (
	// extToolPrefix namespaces extension tools away from core.* ones.
	extToolPrefix = "ext."
	// maxExtToolsPerExtension bounds what one manifest can add to tools/list.
	maxExtToolsPerExtension = 64
	// maxExtToolResponse caps a plugin response returned to the agent.
	maxExtToolResponse = 4 << 20
	// maxExtToolErrorBody caps plugin error text relayed to the agent.
	maxExtToolErrorBody = 2000
)

var (
	reExtToolSlug  = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{0,63}$`)
	reExtToolName  = regexp.MustCompile(`^[a-z0-9_]+(\.[a-z0-9_]+)*$`)
	reExtToolParam = regexp.MustCompile(`\{([A-Za-z0-9_]+)\}`)
	// reExtToolSegment is what an argument may put into a path: one plain
	// segment. No separators, escapes, whitespace or control characters,
	// so a value can never change which route the request reaches.
	reExtToolSegment = regexp.MustCompile(`^[A-Za-z0-9._~-]{1,128}$`)
)

// extPluginCaller sends one request to an extension's plugin. Swappable
// so tests don't need a running gRPC plugin.
type extPluginCaller func(ctx context.Context, slug string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error)

// errExtensionNotRunning is returned when the tool's plugin isn't up.
var errExtensionNotRunning = errors.New("extension is not running")

// SetAdminRoutes wires the registry of admin_routes capability rules
// that extension tools are checked against.
func (s *Server) SetAdminRoutes(r *cms.AdminRouteRegistry) {
	s.adminRoutes = r
}

// SubscribeExtensionTools keeps the ext.* tools in step with extension
// activation. Call it before the boot-time extension.activated events
// are published so already-active extensions are picked up too.
//
// The events are only a trigger. Any extension holding events:emit (and
// core.event.emit) can publish extension.activated / .deactivated with a
// payload of its choosing, so nothing in the payload is trusted: the
// slug is looked up in the extension registry and the tools come from
// that extension's own registered manifest, or not at all.
func (s *Server) SubscribeExtensionTools(bus *events.EventBus) {
	if bus == nil {
		return
	}
	sync := func(_ string, p events.Payload) {
		if slug, _ := p["slug"].(string); slug != "" {
			s.SyncExtensionTools(slug)
		}
	}
	bus.Subscribe("extension.activated", sync)
	bus.Subscribe("extension.deactivated", sync)
}

// SyncExtensionTools makes the tools exposed for slug match the extension
// registry: the registered manifest's mcp_tools while the extension is
// active, none otherwise.
func (s *Server) SyncExtensionTools(slug string) {
	defs, active := s.activeExtensionTools(slug)
	if !active {
		s.DropExtensionTools(slug)
		return
	}
	for _, w := range s.RegisterExtensionTools(slug, defs) {
		s.logger.Printf("extension tools: %s: %s", slug, w)
	}
}

// activeExtensionTools returns the mcp_tools of the active extension
// registered under slug. The loader applies its trust checks (path
// containment, bundled-over-installed ownership) before a row counts as
// active. Fails closed: no loader, unknown slug or unreadable manifest
// means no tools.
func (s *Server) activeExtensionTools(slug string) ([]cms.McpToolEntry, bool) {
	if s.extManifest != nil {
		return s.extManifest(slug)
	}
	if s.deps.ExtensionLoader == nil {
		return nil, false
	}
	ext := s.deps.ExtensionLoader.GetActiveBySlug(slug)
	if ext == nil {
		return nil, false
	}
	var m struct {
		McpTools []cms.McpToolEntry `json:"mcp_tools"`
	}
	if err := json.Unmarshal(ext.Manifest, &m); err != nil {
		s.logger.Printf("extension tools: parse manifest for %q: %v", slug, err)
		return nil, true
	}
	return m.McpTools, true
}

// RegisterExtensionTools replaces the tools exposed for slug with defs.
// Invalid entries are skipped and reported in the returned warnings — one
// bad tool must not take the extension's other tools down.
func (s *Server) RegisterExtensionTools(slug string, defs []cms.McpToolEntry) (warnings []string) {
	s.DropExtensionTools(slug)
	if !reExtToolSlug.MatchString(slug) {
		if len(defs) > 0 {
			warnings = append(warnings, fmt.Sprintf("slug %q cannot namespace MCP tools", slug))
		}
		return warnings
	}
	if len(defs) > maxExtToolsPerExtension {
		warnings = append(warnings, fmt.Sprintf("only the first %d of %d mcp_tools are registered", maxExtToolsPerExtension, len(defs)))
		defs = defs[:maxExtToolsPerExtension]
	}
	seen := map[string]bool{}
	var names []string
	for _, d := range defs {
		def, err := normalizeExtTool(d)
		if err == nil && seen[def.Name] {
			err = errors.New("duplicate name")
		}
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("mcp tool %q skipped: %v", d.Name, err))
			continue
		}
		seen[def.Name] = true
		full := extToolPrefix + slug + "." + def.Name
		s.addTool(extToolSpec(full, def), def.Class, s.extToolHandler(slug, def))
		names = append(names, full)
	}
	if len(names) > 0 {
		s.catalogMu.Lock()
		if s.extTools == nil {
			s.extTools = map[string][]string{}
		}
		s.extTools[slug] = names
		s.catalogMu.Unlock()
	}
	return warnings
}

// DropExtensionTools removes every tool registered for slug.
func (s *Server) DropExtensionTools(slug string) {
	s.catalogMu.Lock()
	names := s.extTools[slug]
	delete(s.extTools, slug)
	if len(names) > 0 {
		gone := make(map[string]bool, len(names))
		for _, n := range names {
			gone[n] = true
		}
		kept := make([]toolCatalogEntry, 0, len(s.toolCatalog))
		for _, e := range s.toolCatalog {
			if !gone[e.Name] {
				kept = append(kept, e)
			}
		}
		s.toolCatalog = kept
	}
	s.catalogMu.Unlock()
	if len(names) > 0 {
		s.mcp.DeleteTools(names...)
	}
}

// normalizeExtTool validates one manifest entry and fills its defaults.
func normalizeExtTool(d cms.McpToolEntry) (cms.McpToolEntry, error) {
	d.Name = strings.TrimSpace(d.Name)
	if !reExtToolName.MatchString(d.Name) || len(d.Name) > 64 {
		return d, errors.New("name must be lower-case [a-z0-9_] segments separated by dots (max 64 characters)")
	}
	d.Method = strings.ToUpper(strings.TrimSpace(d.Method))
	if d.Method == "" {
		d.Method = "GET"
	}
	switch d.Method {
	case "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE":
	default:
		return d, fmt.Errorf("unsupported method %q", d.Method)
	}
	d.Path = strings.TrimSpace(d.Path)
	if !strings.HasPrefix(d.Path, "/") || strings.ContainsAny(d.Path, "?#%\\") || strings.Contains(d.Path, "..") {
		return d, errors.New("path must start with / and carry no query, fragment, escape or '..'")
	}
	// Only the canonical form: the capability check and the plugin must
	// see the same path, with nothing left for either to reinterpret.
	if cms.NormalizeAdminPath(d.Path) != d.Path {
		return d, errors.New("path must be normalised (no trailing slash, '//' or '.' segments)")
	}
	readOnly := d.Method == "GET" || d.Method == "HEAD"
	switch d.Class = strings.ToLower(strings.TrimSpace(d.Class)); d.Class {
	case "":
		d.Class = "full"
		if readOnly {
			d.Class = "read"
		}
	case "read":
		// A read token must never reach a mutating route, whatever the
		// manifest claims.
		if !readOnly {
			return d, errors.New(`class "read" is only allowed for GET/HEAD tools`)
		}
	case "content", "full":
	default:
		return d, fmt.Errorf("unknown class %q (read, content or full)", d.Class)
	}
	if strings.TrimSpace(d.Description) == "" {
		return d, errors.New("description is required")
	}
	if len(bytes.TrimSpace(d.InputSchema)) > 0 {
		var schema map[string]any
		if err := json.Unmarshal(d.InputSchema, &schema); err != nil {
			return d, fmt.Errorf("input_schema is not a JSON object: %v", err)
		}
		if t, _ := schema["type"].(string); t != "object" {
			return d, errors.New(`input_schema.type must be "object"`)
		}
	} else {
		d.InputSchema = nil
	}
	return d, nil
}

// extToolSpec builds the MCP tool definition for a normalized entry. A
// tool without input_schema still declares its {path} placeholders.
func extToolSpec(fullName string, d cms.McpToolEntry) mcp.Tool {
	if d.InputSchema != nil {
		return mcp.NewToolWithRawSchema(fullName, d.Description, d.InputSchema)
	}
	opts := []mcp.ToolOption{mcp.WithDescription(d.Description)}
	for _, m := range reExtToolParam.FindAllStringSubmatch(d.Path, -1) {
		opts = append(opts, mcp.WithString(m[1], mcp.Required()))
	}
	return mcp.NewTool(fullName, opts...)
}

// extToolHandler serves one extension tool: owner capability check, then
// the plugin's HTTP handler.
func (s *Server) extToolHandler(slug string, d cms.McpToolEntry) func(ctx context.Context, args map[string]any) (any, error) {
	return func(ctx context.Context, args map[string]any) (any, error) {
		relPath, rest, err := fillExtToolPath(d.Path, args)
		if err != nil {
			return nil, err
		}
		tok := tokenFromCtx(ctx)
		owner, err := s.extToolOwner(tok)
		if err != nil {
			return nil, err
		}
		if need := cms.RequiredAdminCapability(s.adminRoutes, slug, d.Method, relPath); need != "" && !auth.HasCapability(owner, need) {
			return nil, fmt.Errorf("forbidden: the token owner's role lacks the %q capability this tool requires", need)
		}

		req := &pb.PluginHTTPRequest{
			Method:      d.Method,
			Path:        relPath,
			Headers:     map[string]string{"Accept": "application/json", "X-User-Email": owner.Email},
			QueryParams: map[string]string{},
			PathParams:  map[string]string{"slug": slug},
			UserId:      uint64(owner.ID),
		}
		if owner.FullName != nil {
			req.Headers["X-User-Name"] = *owner.FullName
		}
		if p := strings.TrimPrefix(relPath, "/"); p != "" {
			req.PathParams["path"] = p
		}
		switch d.Method {
		case "GET", "HEAD", "DELETE":
			for k, v := range rest {
				if qv, ok := extQueryValue(v); ok {
					req.QueryParams[k] = qv
				}
			}
		default:
			body, merr := json.Marshal(rest)
			if merr != nil {
				return nil, fmt.Errorf("arguments are not JSON-encodable: %v", merr)
			}
			req.Body = body
			req.Headers["Content-Type"] = "application/json"
		}

		ctx, cancel := context.WithTimeout(ctx, vibeplugin.HTTPCallTimeout)
		defer cancel()
		resp, err := s.callExtPlugin(ctx, slug, req)
		if errors.Is(err, errExtensionNotRunning) {
			return nil, fmt.Errorf("extension %q is not running", slug)
		}
		if err != nil {
			reqID := newRequestID()
			s.logger.Printf("ext tool %s.%s request_id=%s plugin call failed: %v", slug, d.Name, reqID, err)
			return nil, fmt.Errorf("extension %q did not answer (request id %s)", slug, reqID)
		}
		return extToolResult(resp)
	}
}

// extToolOwner loads the token's owner with their role.
func (s *Server) extToolOwner(tok *models.McpToken) (*models.User, error) {
	if tok == nil || s.deps.DB == nil {
		return nil, errors.New("forbidden: token owner could not be resolved")
	}
	var owner models.User
	if err := s.deps.DB.Preload("Role").First(&owner, tok.UserID).Error; err != nil {
		return nil, errors.New("forbidden: token owner could not be resolved")
	}
	return &owner, nil
}

// callExtPlugin routes through the injected caller, else the plugin manager.
func (s *Server) callExtPlugin(ctx context.Context, slug string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	if s.extCall != nil {
		return s.extCall(ctx, slug, req)
	}
	if s.deps.PluginManager == nil {
		return nil, errExtensionNotRunning
	}
	client := s.deps.PluginManager.GetClient(slug)
	if client == nil {
		return nil, errExtensionNotRunning
	}
	return client.HandleHTTPRequestCtx(ctx, req)
}

// fillExtToolPath substitutes {param} placeholders from args and returns
// the path plus the arguments that were not consumed. A value may not
// change the route's shape, so separators and dot segments are refused.
func fillExtToolPath(tmpl string, args map[string]any) (string, map[string]any, error) {
	rest := make(map[string]any, len(args))
	for k, v := range args {
		rest[k] = v
	}
	var perr error
	out := reExtToolParam.ReplaceAllStringFunc(tmpl, func(m string) string {
		key := m[1 : len(m)-1]
		v, ok := extQueryValue(rest[key])
		delete(rest, key)
		switch {
		case !ok || v == "":
			perr = fmt.Errorf("missing required argument %q", key)
		case !reExtToolSegment.MatchString(v) || strings.Trim(v, ".") == "":
			perr = fmt.Errorf("argument %q is not a valid path segment", key)
		}
		return v
	})
	if perr != nil {
		return "", nil, perr
	}
	// Belt and braces: whatever was substituted, the result must still be
	// the canonical path the capability check is about to match.
	if cms.NormalizeAdminPath(out) != out {
		return "", nil, errors.New("arguments do not form a valid path")
	}
	return out, rest, nil
}

// extQueryValue renders an argument as a query-string value. Objects and
// arrays are sent as JSON; nil is omitted.
func extQueryValue(v any) (string, bool) {
	switch t := v.(type) {
	case nil:
		return "", false
	case string:
		return t, true
	case bool:
		return strconv.FormatBool(t), true
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64), true
	case json.Number:
		return t.String(), true
	default:
		b, err := json.Marshal(t)
		if err != nil {
			return "", false
		}
		return string(b), true
	}
}

// extToolResult turns the plugin response into the tool result. JSON
// passes through untouched; other content is returned as text.
func extToolResult(resp *pb.PluginHTTPResponse) (any, error) {
	if resp == nil {
		return nil, errors.New("extension returned no response")
	}
	body := resp.GetBody()
	status := int(resp.GetStatusCode())
	if status >= 400 {
		msg := strings.TrimSpace(string(body))
		if len(msg) > maxExtToolErrorBody {
			msg = msg[:maxExtToolErrorBody] + "…"
		}
		if msg == "" {
			msg = "no detail"
		}
		return nil, fmt.Errorf("extension answered %d: %s", status, msg)
	}
	if len(body) > maxExtToolResponse {
		return nil, fmt.Errorf("response is %d bytes, over the %d byte tool limit — narrow the request (date range, limit)", len(body), maxExtToolResponse)
	}
	if trimmed := bytes.TrimSpace(body); len(trimmed) == 0 {
		return map[string]any{"ok": true, "status": status}, nil
	} else if json.Valid(trimmed) {
		return json.RawMessage(trimmed), nil
	}
	ct := ""
	for k, v := range resp.GetHeaders() {
		if strings.EqualFold(k, "Content-Type") {
			ct = v
		}
	}
	return map[string]any{"content_type": ct, "body": string(body)}, nil
}

// extensionToolIndex lists the registered extension tools per slug, for
// core.guide.
func (s *Server) extensionToolIndex() map[string][]string {
	s.catalogMu.RLock()
	defer s.catalogMu.RUnlock()
	out := make(map[string][]string, len(s.extTools))
	for slug, names := range s.extTools {
		cp := append([]string(nil), names...)
		sort.Strings(cp)
		out[slug] = cp
	}
	return out
}
