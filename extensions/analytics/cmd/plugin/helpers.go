package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
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
	return jsonResponse(400, map[string]any{
		"error":   "VALIDATION_ERROR",
		"message": strings.Join(sortedStrings(msgs), "; "),
		"fields":  fields,
	})
}

func sortedStrings(in []string) []string {
	sort.Strings(in)
	return in
}

func (p *AnalyticsPlugin) logf(ctx context.Context, level, format string, args ...any) {
	if p.host == nil {
		return
	}
	_ = p.host.Log(ctx, level, fmt.Sprintf(format, args...), nil)
}

// randomHex returns n random bytes hex-encoded.
func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func toInt64(v any) (int64, bool) {
	switch n := v.(type) {
	case int:
		return int64(n), true
	case int32:
		return int64(n), true
	case int64:
		return n, true
	case uint:
		return int64(n), true
	case uint64:
		return int64(n), true
	case float64:
		return int64(n), true
	case json.Number:
		i, err := n.Int64()
		return i, err == nil
	case string:
		i, err := strconv.ParseInt(n, 10, 64)
		return i, err == nil
	}
	return 0, false
}

func toFloat(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case float32:
		return float64(n), true
	case int, int32, int64, uint, uint64:
		i, _ := toInt64(n)
		return float64(i), true
	case json.Number:
		f, err := n.Float64()
		return f, err == nil
	case string:
		f, err := strconv.ParseFloat(n, 64)
		return f, err == nil
	}
	return 0, false
}

func num(row map[string]any, key string) int64 {
	n, _ := toInt64(row[key])
	return n
}

func str(row map[string]any, key string) string {
	switch v := row[key].(type) {
	case string:
		return v
	case nil:
		return ""
	default:
		return fmt.Sprint(v)
	}
}

// globMatch matches s against a pattern where * matches any run of
// characters (including /). Comparison is case-insensitive.
func globMatch(pattern, s string) bool {
	pattern, s = strings.ToLower(pattern), strings.ToLower(s)
	parts := strings.Split(pattern, "*")
	if len(parts) == 1 {
		return pattern == s
	}
	if !strings.HasPrefix(s, parts[0]) {
		return false
	}
	s = s[len(parts[0]):]
	for i := 1; i < len(parts)-1; i++ {
		idx := strings.Index(s, parts[i])
		if idx < 0 {
			return false
		}
		s = s[idx+len(parts[i]):]
	}
	return strings.HasSuffix(s, parts[len(parts)-1])
}
