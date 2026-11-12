package main

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"

	"squilla/internal/api"
)

// Request body limits.
//
// Fiber v2 has a single global BodyLimit and, by default, buffers every
// request body in full before any handler or middleware runs. The old
// 50 MB global limit therefore let any anonymous client make the server
// buffer 50 MB per request on every route.
//
// The server now runs with StreamRequestBody: fasthttp reads the headers
// plus at most 8 KB of body and hands the rest to the handler as a lazy
// stream. bodyLimitMiddleware (mounted first) then enforces a per-route
// cap BEFORE anything reads the body:
//
//   - Content-Length above the route cap → 413, nothing read.
//   - Chunked body on a normal route → read through a cap+1 limit; over
//     the cap → 413, else the buffered (≤ cap) body replaces the stream.
//   - Chunked body on a large-upload route → 411 (Length Required),
//     except /api/uploads/*, which streams through streamingHTTPHandler
//     with its own hard cap.
//
// DisablePreParseMultipartForm is required alongside streaming: with
// pre-parsing on, fasthttp reads an entire multipart body to temp files
// before the handler (and before this middleware) with no size check.
//
// Whenever a request's body stream is left unread (early 4xx, auth
// failure before the handler reads), the connection is closed after the
// response so the unread bytes can never be parsed as the next request on
// a kept-alive / proxy-pooled connection.

const (
	defaultBodyLimitMB = 2
	// largeBodyLimit matches the previous global BodyLimit for the routes
	// that legitimately accept big payloads.
	largeBodyLimit = 50 << 20
	// presignedUploadTransportCap is a transport-level backstop for
	// /api/uploads; the uploads handler enforces each token's max_bytes
	// (200 MB default for theme/extension zips, SQUILLA_*_MAX_MB).
	presignedUploadTransportCap = 2 << 30
	// fasthttp prefetches up to 8 KB of a streamed body; anything at or
	// below this was read in full and leaves nothing on the wire.
	streamPrefetch = 8 << 10

	defaultReadTimeout = 30 * time.Second
	// uploadReadTimeout replaces ReadTimeout (set per request from the
	// headers) for large-body routes so a 200 MB upload on a slow link
	// isn't cut off at 30 s. Public routes get the shorter value.
	uploadReadTimeout       = 30 * time.Minute
	publicUploadReadTimeout = 5 * time.Minute
)

// bodyRule is a path-prefix exception to the default body limit.
type bodyRule struct {
	prefix string
	max    int64
	// streamed: the handler reads the body as a stream with its own cap
	// (chunked bodies allowed). Otherwise chunked bodies are refused.
	streamed    bool
	readTimeout time.Duration
}

type bodyLimitPolicy struct {
	defaultMax int64
	rules      []bodyRule
}

// defaultBodyLimitPolicy lists every route that takes bodies above the
// default limit. Keep it explicit: a new upload endpoint must be added
// here deliberately.
func defaultBodyLimitPolicy() bodyLimitPolicy {
	return bodyLimitPolicy{
		defaultMax: int64(envIntMB("SQUILLA_MAX_BODY_MB", defaultBodyLimitMB)) << 20,
		rules: []bodyRule{
			// Presigned uploads (token in the path is the auth).
			{prefix: "/api/uploads/", max: presignedUploadTransportCap, streamed: true, readTimeout: uploadReadTimeout},
			// Theme / extension zip uploads (multipart, session-authed).
			{prefix: "/admin/api/themes/upload", max: largeBodyLimit, readTimeout: uploadReadTimeout},
			{prefix: "/admin/api/extensions/upload", max: largeBodyLimit, readTimeout: uploadReadTimeout},
			{prefix: "/admin/api/media/upload", max: largeBodyLimit, readTimeout: uploadReadTimeout},
			// Extension admin APIs (media-manager uploads, imports).
			{prefix: "/admin/api/ext/", max: largeBodyLimit, readTimeout: uploadReadTimeout},
			// MCP JSON-RPC with inline base64 payloads (bearer-authed).
			{prefix: "/mcp", max: largeBodyLimit, readTimeout: publicUploadReadTimeout},
			// Public form submissions with file fields (forms extension).
			{prefix: "/forms/submit/", max: largeBodyLimit, readTimeout: publicUploadReadTimeout},
		},
	}
}

// ruleFor returns the matching large-body rule, or nil for the default.
func (p bodyLimitPolicy) ruleFor(path string) *bodyRule {
	for i := range p.rules {
		r := &p.rules[i]
		if path == strings.TrimSuffix(r.prefix, "/") || strings.HasPrefix(path, r.prefix) {
			return r
		}
	}
	return nil
}

// fiberConfig returns the server settings that implement the policy.
func (p bodyLimitPolicy) applyTo(cfg *fiber.Config) {
	cfg.BodyLimit = int(p.defaultMax)
	cfg.StreamRequestBody = true
	cfg.DisablePreParseMultipartForm = true
	cfg.ReadTimeout = defaultReadTimeout
}

// headerReceived extends the read deadline for large-body routes once the
// headers are in (fasthttp's ReadTimeout otherwise covers header + body).
func (p bodyLimitPolicy) headerReceived(h *fasthttp.RequestHeader) fasthttp.RequestConfig {
	var u fasthttp.URI
	if err := u.Parse(nil, h.RequestURI()); err != nil {
		return fasthttp.RequestConfig{}
	}
	if r := p.ruleFor(string(u.Path())); r != nil && r.readTimeout > 0 {
		return fasthttp.RequestConfig{ReadTimeout: r.readTimeout}
	}
	return fasthttp.RequestConfig{}
}

// bodyLimitMiddleware enforces the policy. Mount it before every other
// middleware so nothing reads an oversized body first.
func bodyLimitMiddleware(p bodyLimitPolicy) fiber.Handler {
	return func(c *fiber.Ctx) error {
		max := p.defaultMax
		rule := p.ruleFor(c.Path())
		if rule != nil {
			max = rule.max
		}
		cl := c.Request().Header.ContentLength()
		switch {
		case cl > 0 && int64(cl) > max:
			c.Context().SetConnectionClose()
			return api.Error(c, fiber.StatusRequestEntityTooLarge, "BODY_TOO_LARGE",
				"Request body exceeds the "+strconv.FormatInt(max>>20, 10)+" MB limit for this endpoint")
		case cl == -1: // chunked
			if rule != nil && !rule.streamed {
				c.Context().SetConnectionClose()
				return api.Error(c, fiber.StatusLengthRequired, "LENGTH_REQUIRED",
					"Uploads to this endpoint must send a Content-Length")
			}
			if rule == nil {
				if stream := c.Context().RequestBodyStream(); stream != nil {
					buf, err := io.ReadAll(io.LimitReader(stream, max+1))
					if err != nil || int64(len(buf)) > max {
						c.Context().SetConnectionClose()
						return api.Error(c, fiber.StatusRequestEntityTooLarge, "BODY_TOO_LARGE",
							"Request body exceeds the "+strconv.FormatInt(max>>20, 10)+" MB limit for this endpoint")
					}
					// Replaces (and releases) the stream with the bounded copy.
					c.Request().SetBody(buf)
				}
			}
		}

		err := c.Next()

		if (cl > streamPrefetch || cl == -1) && c.Context().RequestBodyStream() != nil {
			// Body (partly) unread: never reuse this connection.
			c.Context().SetConnectionClose()
		}
		return err
	}
}

func envIntMB(key string, def int) int {
	if n, err := strconv.Atoi(strings.TrimSpace(os.Getenv(key))); err == nil && n > 0 {
		return n
	}
	return def
}

// errUploadTooLarge is returned by cappedReader once the cap is exceeded.
var errUploadTooLarge = errors.New("request body exceeds transport limit")

// cappedReader errors (instead of silently truncating) once more than
// remaining bytes are read, and records whether the source hit EOF.
type cappedReader struct {
	r         io.Reader
	remaining int64
	eof       bool
}

func (c *cappedReader) Read(p []byte) (int, error) {
	if c.remaining < 0 {
		return 0, errUploadTooLarge
	}
	if int64(len(p)) > c.remaining+1 {
		p = p[:c.remaining+1]
	}
	n, err := c.r.Read(p)
	c.remaining -= int64(n)
	if c.remaining < 0 {
		return n + int(c.remaining), errUploadTooLarge
	}
	if err == io.EOF {
		c.eof = true
	}
	return n, err
}

// streamingHTTPHandler mounts a net/http handler without buffering the
// request body. Fiber's adaptor.HTTPHandler calls PostBody(), which reads
// a streamed body fully into memory; this bridge hands the handler the
// fasthttp body stream directly, capped at max bytes.
func streamingHTTPHandler(h http.Handler, max int64) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ctx := c.Context()
		var src io.Reader
		if s := ctx.RequestBodyStream(); s != nil {
			src = s
		} else {
			src = bytes.NewReader(c.Body())
		}
		body := &cappedReader{r: src, remaining: max}

		req, err := http.NewRequestWithContext(ctx, c.Method(), string(ctx.RequestURI()), io.NopCloser(body))
		if err != nil {
			return api.Error(c, fiber.StatusBadRequest, "BAD_REQUEST", "Invalid request")
		}
		c.Request().Header.VisitAll(func(k, v []byte) {
			req.Header.Add(string(k), string(v))
		})
		if cl := c.Request().Header.ContentLength(); cl >= 0 {
			req.ContentLength = int64(cl)
		} else {
			req.ContentLength = -1
		}
		req.Host = string(c.Request().Host())
		req.RemoteAddr = ctx.RemoteAddr().String()
		req.RequestURI = string(ctx.RequestURI())

		rw := &fiberResponseWriter{c: c, header: http.Header{}}
		h.ServeHTTP(rw, req)
		rw.flushHeader(http.StatusOK)
		if body.eof {
			// Fully consumed: release the stream so the connection can be
			// kept alive (bodyLimitMiddleware closes it otherwise).
			_ = c.Request().CloseBodyStream()
		}
		return nil
	}
}

// fiberResponseWriter is a minimal http.ResponseWriter over fiber.Ctx.
type fiberResponseWriter struct {
	c           *fiber.Ctx
	header      http.Header
	wroteHeader bool
}

func (w *fiberResponseWriter) Header() http.Header { return w.header }

func (w *fiberResponseWriter) WriteHeader(code int) { w.flushHeader(code) }

func (w *fiberResponseWriter) flushHeader(code int) {
	if w.wroteHeader {
		return
	}
	w.wroteHeader = true
	for k, vs := range w.header {
		for i, v := range vs {
			if i == 0 {
				w.c.Set(k, v)
			} else {
				w.c.Append(k, v)
			}
		}
	}
	w.c.Status(code)
}

func (w *fiberResponseWriter) Write(b []byte) (int, error) {
	w.flushHeader(http.StatusOK)
	return w.c.Write(b)
}
