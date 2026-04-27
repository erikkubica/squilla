package logging

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
)

// RequestIDHeader is the canonical request-correlation header. Mirrors
// what most reverse proxies and tracing systems use (Cloudflare,
// AWS ALB, Datadog, etc.) so an upstream-supplied ID is preserved.
const RequestIDHeader = "X-Request-ID"

// requestIDLocalKey is the fiber.Locals key for the per-request ID.
// Other handlers can pull it out for error responses or audit log
// rows; the recommended path is RequestIDFromCtx for the standard
// context.Context.
const requestIDLocalKey = "request_id"

// RequestID returns Fiber middleware that:
//
//  1. Reads X-Request-ID from the incoming request, or generates a
//     fresh hex token if absent.
//  2. Stores the ID in c.Locals so handlers can retrieve it.
//  3. Sets the same header on the response so clients can correlate
//     across hops.
//  4. Logs an access entry on completion via the package-default
//     logger, with method/path/status/latency/request_id.
//
// Plumbing the ID into context.Context for downstream services is the
// caller's responsibility: handlers that already create a derived
// context can do `ctx = logging.WithRequestID(c.Context(), rid)`.
func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		rid := c.Get(RequestIDHeader)
		if rid == "" {
			rid = newRequestID()
		}
		c.Locals(requestIDLocalKey, rid)
		c.Set(RequestIDHeader, rid)

		start := time.Now()
		err := c.Next()
		dur := time.Since(start)

		// Attach error info when present so the access log row pairs
		// with the failure rather than appearing as a clean 200.
		attrs := []any{
			"request_id", rid,
			"method", c.Method(),
			"path", c.Path(),
			"status", c.Response().StatusCode(),
			"duration_ms", dur.Milliseconds(),
			"remote", c.IP(),
		}
		if err != nil {
			attrs = append(attrs, "error", err.Error())
		}
		Default().Info("http_request", attrs...)
		return err
	}
}

// FromFiber returns a logger enriched with the request_id stored on c.Locals
// by the RequestID middleware. Suitable for handler-local logging when
// the caller doesn't have a context.Context handy.
func FromFiber(c *fiber.Ctx) *slogLite {
	rid, _ := c.Locals(requestIDLocalKey).(string)
	if rid == "" {
		return &slogLite{l: Default()}
	}
	return &slogLite{l: Default().With("request_id", rid)}
}

// slogLite wraps *slog.Logger with the same key-value style but
// without leaking slog's API into every caller. Lets us swap the
// underlying logger later without touching every call site.
type slogLite struct {
	l interface {
		Info(msg string, args ...any)
		Warn(msg string, args ...any)
		Error(msg string, args ...any)
		Debug(msg string, args ...any)
	}
}

func (s *slogLite) Info(msg string, args ...any)  { s.l.Info(msg, args...) }
func (s *slogLite) Warn(msg string, args ...any)  { s.l.Warn(msg, args...) }
func (s *slogLite) Error(msg string, args ...any) { s.l.Error(msg, args...) }
func (s *slogLite) Debug(msg string, args ...any) { s.l.Debug(msg, args...) }

// newRequestID returns a hex-encoded random 8-byte token. Short enough
// to read in a log line, long enough for collisions to be a non-issue
// inside a single deployment. crypto/rand keeps it unguessable so
// log-injection by guessing IDs is harder.
func newRequestID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		// crypto/rand failure on a healthy host is "your machine is
		// in serious trouble" — but blocking startup over a log id
		// would be worse. Fall back to a non-random sentinel so logs
		// remain attributable.
		return "00000000ffffffff"
	}
	return hex.EncodeToString(b[:])
}
