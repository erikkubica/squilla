package httpobs

import (
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"squilla/internal/logging"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

// Record describes one completed HTTP request. Its JSON shape is the
// contract with http.requests consumers (see docs/extension_api.md).
type Record struct {
	TS          time.Time         `json:"ts"`
	Method      string            `json:"method"`
	Host        string            `json:"host"`
	Path        string            `json:"path"`
	Query       string            `json:"query"`
	Status      int               `json:"status"`
	DurationMS  int64             `json:"duration_ms"`
	ContentType string            `json:"content_type"`
	Bytes       int64             `json:"bytes"`
	IP          string            `json:"ip"`
	UserAgent   string            `json:"user_agent"`
	Referer     string            `json:"referer"`
	Headers     map[string]string `json:"headers"`
	HasSession  bool              `json:"has_session"`
	UserID      int               `json:"user_id"`
	NodeID      int               `json:"node_id"`
	NodeType    string            `json:"node_type"`
	Language    string            `json:"language"`
	RequestID   string            `json:"request_id"`
}

// Field length caps (bytes). Values are cut on a rune boundary.
const (
	maxUserAgent = 512
	maxReferer   = 1024
	maxPath      = 2048
	maxQuery     = 2048
	maxHeader    = 512
)

// headerAllowlist lists the request headers copied into Record.Headers
// (lower-case keys, only when present). cf-ipcountry is added only when
// Cloudflare is the configured client-IP source — otherwise any client
// could forge it.
var headerAllowlist = []string{
	"accept", "accept-language",
	"sec-fetch-mode", "sec-fetch-dest", "sec-fetch-site", "sec-fetch-user",
	"sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform",
	"sec-purpose", "purpose", "sec-gpc", "dnt", "upgrade-insecure-requests",
}

// Locals keys set by the public node handler.
const (
	localsNodeID   = "squilla.node_id"
	localsNodeType = "squilla.node_type"
	localsLanguage = "squilla.language"
	localsUser     = "user"
)

// buildRecord snapshots the request/response after the handler chain
// returned. Every string is copied: fasthttp reuses its buffers once the
// request completes, and records outlive the request in the queue.
// Returns ok=false for requests that must not be observed (SSE).
func (o *Observer) buildRecord(c *fiber.Ctx, start time.Time, err error) (Record, bool) {
	req := c.Request()
	resp := c.Response()

	path := string(req.URI().Path())
	contentType := string(resp.Header.ContentType())
	if path == "/admin/api/events" || strings.HasPrefix(contentType, "text/event-stream") {
		return Record{}, false
	}

	status := resp.StatusCode()
	if err != nil {
		var fe *fiber.Error
		if errors.As(err, &fe) {
			status = fe.Code
		} else {
			status = fiber.StatusInternalServerError
		}
	}

	r := Record{
		TS:          start.UTC(),
		Method:      string(req.Header.Method()),
		Host:        strings.Clone(c.Hostname()),
		Path:        truncate(path, maxPath),
		Query:       truncate(string(req.URI().QueryString()), maxQuery),
		Status:      status,
		DurationMS:  time.Since(start).Milliseconds(),
		ContentType: contentType,
		Bytes:       responseBytes(resp),
		IP:          ClientIP(c),
		UserAgent:   truncate(string(req.Header.UserAgent()), maxUserAgent),
		Referer:     truncate(string(req.Header.Referer()), maxReferer),
		Headers:     make(map[string]string, 8),
		HasSession:  o.sessionCookie != "" && len(req.Header.Cookie(o.sessionCookie)) > 0,
		RequestID:   strings.Clone(logging.RequestIDFromFiber(c)),
	}
	for _, name := range headerAllowlist {
		if v := req.Header.Peek(name); len(v) > 0 {
			r.Headers[name] = truncate(string(v), maxHeader)
		}
	}
	// Only from a trusted proxy: a client reaching the origin directly
	// could otherwise forge its country.
	if strings.EqualFold(ClientIPHeader(), "CF-Connecting-IP") && peerTrusted(c) {
		if v := req.Header.Peek("cf-ipcountry"); len(v) > 0 {
			r.Headers["cf-ipcountry"] = truncate(string(v), maxHeader)
		}
	}

	if u, ok := c.Locals(localsUser).(*models.User); ok && u != nil {
		r.UserID = u.ID
	}
	if id, ok := c.Locals(localsNodeID).(int); ok {
		r.NodeID = id
	}
	if v, ok := c.Locals(localsNodeType).(string); ok {
		r.NodeType = strings.Clone(v)
	}
	if v, ok := c.Locals(localsLanguage).(string); ok {
		r.Language = strings.Clone(v)
	}
	return r, true
}

// responseBytes returns the response body size without draining body
// streams: a streamed body reports its declared Content-Length (0 when
// unknown/chunked); a buffered body is measured directly — fasthttp only
// fills the Content-Length header when the response is written, which
// happens after the middleware chain unwinds.
func responseBytes(resp *fasthttp.Response) int64 {
	if resp.IsBodyStream() {
		if n := resp.Header.ContentLength(); n > 0 {
			return int64(n)
		}
		return 0
	}
	return int64(len(resp.Body()))
}

// truncate caps s at max bytes without splitting a UTF-8 sequence.
func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	cut := max
	for cut > 0 && !utf8.RuneStart(s[cut]) {
		cut--
	}
	return s[:cut]
}
