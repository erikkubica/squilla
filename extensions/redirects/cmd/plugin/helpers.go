package main

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"

	pb "squilla/pkg/plugin/proto"
)

func jsonResponse(status int, data any) *pb.PluginHTTPResponse {
	b, err := json.Marshal(data)
	if err != nil {
		return jsonError(500, "INTERNAL", "failed to encode response")
	}
	return &pb.PluginHTTPResponse{
		StatusCode: int32(status),
		Headers:    map[string]string{"Content-Type": "application/json", "Cache-Control": "no-store"},
		Body:       b,
	}
}

// jsonError returns the shared {"error": CODE, "message": text} shape.
func jsonError(status int, code, message string) *pb.PluginHTTPResponse {
	return jsonResponse(status, map[string]string{"error": code, "message": message})
}

// validationError adds a per-field map to the error shape.
func validationError(fields map[string]string) *pb.PluginHTTPResponse {
	msgs := make([]string, 0, len(fields))
	for k, v := range fields {
		msgs = append(msgs, k+": "+v)
	}
	sort.Strings(msgs)
	return jsonResponse(400, map[string]any{
		"error":   "VALIDATION_FAILED",
		"message": strings.Join(msgs, "; "),
		"fields":  fields,
	})
}

func (p *Plugin) logf(ctx context.Context, level, format string, args ...any) {
	if p.host == nil {
		return
	}
	_ = p.host.Log(ctx, level, fmt.Sprintf(format, args...), nil)
}

func str(r map[string]any, key string) string {
	switch v := r[key].(type) {
	case nil:
		return ""
	case string:
		return v
	default:
		return fmt.Sprint(v)
	}
}

func num(r map[string]any, key string) int64 {
	switch v := r[key].(type) {
	case int:
		return int64(v)
	case int32:
		return int64(v)
	case int64:
		return v
	case uint:
		return int64(v)
	case uint64:
		return int64(v)
	case float64:
		return int64(v)
	case json.Number:
		i, _ := v.Int64()
		return i
	case string:
		i, _ := strconv.ParseInt(v, 10, 64)
		return i
	}
	return 0
}

func boolean(r map[string]any, key string) bool {
	switch v := r[key].(type) {
	case bool:
		return v
	case string:
		return v == "true" || v == "t" || v == "1"
	default:
		return num(r, key) != 0
	}
}

// header reads a request header case-insensitively.
func header(h map[string]string, name string) string {
	if v, ok := h[name]; ok {
		return v
	}
	for k, v := range h {
		if strings.EqualFold(k, name) {
			return v
		}
	}
	return ""
}
