package main

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"

	"squilla/internal/coreapi"
	vibeplugin "squilla/pkg/plugin"
	coreapipb "squilla/pkg/plugin/coreapipb"
	pb "squilla/pkg/plugin/proto"
)

// EmailManagerPlugin implements the ExtensionPlugin interface for email admin management.
type EmailManagerPlugin struct {
	host *coreapi.GRPCHostClient
}

func (p *EmailManagerPlugin) GetSubscriptions() ([]*pb.Subscription, error) {
	return nil, nil
}

func (p *EmailManagerPlugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	return &pb.EventResponse{Handled: false}, nil
}

func (p *EmailManagerPlugin) Shutdown() error {
	return nil
}

func (p *EmailManagerPlugin) Initialize(hostConn *grpc.ClientConn) error {
	p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	return nil
}

func (p *EmailManagerPlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	path := strings.TrimSuffix(req.GetPath(), "/")
	method := strings.ToUpper(req.GetMethod())
	ctx := context.Background()

	// Determine the resource and sub-path.
	// Paths arrive as: /templates, /templates/123, /rules, /rules/123, /logs, /settings, /settings/test, /logs/123/resend
	resource, subPath := splitResource(path)

	switch resource {
	case "templates", "email-templates":
		return p.routeTemplates(ctx, method, subPath, req)
	case "rules", "email-rules":
		return p.routeRules(ctx, method, subPath, req)
	case "logs", "email-logs":
		return p.routeLogs(ctx, method, subPath, req)
	case "settings", "email-settings":
		return p.routeSettings(ctx, method, subPath, req)
	case "layouts", "email-layouts":
		return p.routeLayouts(ctx, method, subPath, req)
	default:
		return jsonError(404, "NOT_FOUND", "Route not found"), nil
	}
}

// ---------------------------------------------------------------------------
// Routing helpers
// ---------------------------------------------------------------------------

func splitResource(path string) (string, string) {
	path = strings.TrimPrefix(path, "/")
	if path == "" {
		return "", ""
	}
	parts := strings.SplitN(path, "/", 2)
	resource := parts[0]
	sub := ""
	if len(parts) > 1 {
		sub = parts[1]
	}
	return resource, sub
}

func (p *EmailManagerPlugin) routeTemplates(ctx context.Context, method, subPath string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	if subPath == "" {
		switch method {
		case "GET":
			return p.listTemplates(ctx, req)
		case "POST":
			return p.createTemplate(ctx, req.GetBody())
		default:
			return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
		}
	}

	id := parseID(subPath, req.GetPathParams(), "id")
	if id == 0 {
		return jsonError(400, "INVALID_ID", "Template ID must be a valid integer"), nil
	}

	switch method {
	case "GET":
		return p.getTemplate(ctx, id)
	case "PUT", "PATCH":
		return p.updateTemplate(ctx, id, req.GetBody())
	case "DELETE":
		return p.deleteTemplate(ctx, id)
	default:
		return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
	}
}

func (p *EmailManagerPlugin) routeRules(ctx context.Context, method, subPath string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	if subPath == "" {
		switch method {
		case "GET":
			return p.listRules(ctx)
		case "POST":
			return p.createRule(ctx, req.GetBody())
		default:
			return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
		}
	}

	id := parseID(subPath, req.GetPathParams(), "id")
	if id == 0 {
		return jsonError(400, "INVALID_ID", "Rule ID must be a valid integer"), nil
	}

	switch method {
	case "GET":
		return p.getRule(ctx, id)
	case "PUT", "PATCH":
		return p.updateRule(ctx, id, req.GetBody())
	case "DELETE":
		return p.deleteRule(ctx, id)
	default:
		return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
	}
}

func (p *EmailManagerPlugin) routeLogs(ctx context.Context, method, subPath string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	if subPath == "" {
		if method == "GET" {
			return p.listLogs(ctx, req)
		}
		return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
	}

	// Check for /logs/:id/resend
	parts := strings.SplitN(subPath, "/", 2)
	id := parseIDStr(parts[0])
	if id == 0 {
		return jsonError(400, "INVALID_ID", "Log ID must be a valid integer"), nil
	}

	if len(parts) > 1 && parts[1] == "resend" && method == "POST" {
		return p.resendLog(ctx, id)
	}

	if method == "GET" {
		return p.getLog(ctx, id)
	}

	return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
}

func (p *EmailManagerPlugin) routeSettings(ctx context.Context, method, subPath string, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	if subPath == "test" && method == "POST" {
		return p.testEmail(ctx, req)
	}

	if subPath == "" {
		switch method {
		case "GET":
			return p.getSettings(ctx)
		case "POST", "PUT":
			return p.saveSettings(ctx, req.GetBody())
		default:
			return jsonError(405, "METHOD_NOT_ALLOWED", "Method not allowed"), nil
		}
	}

	return jsonError(404, "NOT_FOUND", "Route not found"), nil
}

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

func parseID(subPath string, pathParams map[string]string, key string) uint {
	if idStr, ok := pathParams[key]; ok {
		id, _ := strconv.ParseUint(idStr, 10, 64)
		if id > 0 {
			return uint(id)
		}
	}
	return parseIDStr(strings.SplitN(subPath, "/", 2)[0])
}

func parseIDStr(s string) uint {
	id, _ := strconv.ParseUint(s, 10, 64)
	return uint(id)
}

func toUint(v any) uint {
	switch n := v.(type) {
	case float64:
		return uint(n)
	case int:
		return uint(n)
	case int64:
		return uint(n)
	case json.Number:
		i, _ := n.Int64()
		return uint(i)
	default:
		return 0
	}
}

func parsePagination(params map[string]string) (page, perPage int) {
	page, _ = strconv.Atoi(paramOr(params, "page", "1"))
	perPage, _ = strconv.Atoi(paramOr(params, "per_page", "25"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 25
	}
	return
}

func stripFields(rows []map[string]any, fields ...string) []map[string]any {
	out := make([]map[string]any, len(rows))
	for i, row := range rows {
		cp := make(map[string]any, len(row))
		for k, v := range row {
			cp[k] = v
		}
		for _, f := range fields {
			delete(cp, f)
		}
		out[i] = cp
	}
	return out
}

func paramOr(params map[string]string, key, def string) string {
	if v, ok := params[key]; ok && v != "" {
		return v
	}
	return def
}

func isNotFound(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "NotFound")
}

func jsonResponse(status int, data any) *pb.PluginHTTPResponse {
	body, _ := json.Marshal(data)
	return &pb.PluginHTTPResponse{
		StatusCode: int32(status),
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       body,
	}
}

func jsonError(status int, code, message string) *pb.PluginHTTPResponse {
	body, _ := json.Marshal(map[string]any{
		"error": map[string]any{
			"code":    code,
			"message": message,
		},
	})
	return &pb.PluginHTTPResponse{
		StatusCode: int32(status),
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       body,
	}
}

func jsonValidationError(fields map[string]string) *pb.PluginHTTPResponse {
	body, _ := json.Marshal(map[string]any{
		"error": map[string]any{
			"code":    "VALIDATION_ERROR",
			"message": "One or more fields failed validation",
			"fields":  fields,
		},
	})
	return &pb.PluginHTTPResponse{
		StatusCode: 422,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       body,
	}
}

func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		VersionedPlugins: map[int]goplugin.PluginSet{
			2: {"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &EmailManagerPlugin{}}},
		},
		GRPCServer: goplugin.DefaultGRPCServer,
	})
}
