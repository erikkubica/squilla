// Package logging provides a thin wrapper around log/slog for the
// VibeCMS kernel. Replaces ad-hoc log.Printf calls with structured,
// JSON-able output that can be filtered by level and enriched with
// per-request correlation IDs.
//
// The package keeps the surface minimal on purpose: callers reach for
// Info/Warn/Error/Debug with key-value attrs, and From(ctx) when they
// want the request-scoped logger. Anything more elaborate (custom
// handlers, log shipping) wraps the returned *slog.Logger directly.
package logging

import (
	"context"
	"io"
	"log/slog"
	"os"
	"strings"
	"sync"
)

// LevelEnv is the env var that controls log verbosity. Values:
// "debug", "info" (default), "warn", "error".
const LevelEnv = "VIBECMS_LOG_LEVEL"

// FormatEnv selects the output format: "json" (default in production)
// or "text" (more human-readable, default in development).
const FormatEnv = "VIBECMS_LOG_FORMAT"

// requestIDKey is the context key under which the per-request
// correlation ID is stashed. Stays unexported so callers go through
// WithRequestID / RequestIDFromContext rather than threading raw keys.
type ctxKey struct{}

var requestIDKey ctxKey

var (
	defaultLogger *slog.Logger
	initOnce      sync.Once
)

// Init configures the package-default logger. Safe to call once;
// subsequent calls are ignored. main.go calls this near startup so
// every other package that uses Default() gets the configured handler.
func Init(isDev bool) {
	initOnce.Do(func() {
		defaultLogger = build(os.Stderr, isDev)
	})
}

// build constructs a logger writing to w. Honours VIBECMS_LOG_LEVEL
// and VIBECMS_LOG_FORMAT. Pulled out for tests so a buffer can stand
// in for stderr.
func build(w io.Writer, isDev bool) *slog.Logger {
	lvl := parseLevel(os.Getenv(LevelEnv), slog.LevelInfo)
	format := strings.ToLower(os.Getenv(FormatEnv))
	if format == "" {
		if isDev {
			format = "text"
		} else {
			format = "json"
		}
	}
	opts := &slog.HandlerOptions{Level: lvl}
	var h slog.Handler
	if format == "text" {
		h = slog.NewTextHandler(w, opts)
	} else {
		h = slog.NewJSONHandler(w, opts)
	}
	// Attach a constant field so logs from the kernel are
	// distinguishable from anything else sharing stderr (e.g. plugin
	// stderr captured by go-plugin).
	return slog.New(h).With("service", "vibecms")
}

func parseLevel(s string, fallback slog.Level) slog.Level {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	}
	return fallback
}

// Default returns the package-default logger. If Init wasn't called,
// returns a sensible json-on-stderr logger so packages that import
// logging during early startup don't panic.
func Default() *slog.Logger {
	if defaultLogger == nil {
		return slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelInfo})).With("service", "vibecms")
	}
	return defaultLogger
}

// WithRequestID attaches a request correlation ID to ctx. Downstream
// callers retrieve it with RequestIDFromContext and From(ctx) returns
// a logger that includes it as a "request_id" attribute.
func WithRequestID(ctx context.Context, id string) context.Context {
	if id == "" {
		return ctx
	}
	return context.WithValue(ctx, requestIDKey, id)
}

// RequestIDFromContext returns the correlation ID, or "" if absent.
func RequestIDFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if v, ok := ctx.Value(requestIDKey).(string); ok {
		return v
	}
	return ""
}

// From returns a logger pre-populated with any request-scoped fields
// available on ctx — currently just request_id. Callers stay terse:
//
//	logging.From(ctx).Info("user authenticated", "user_id", id)
//
// without manually threading the ID through every call site.
func From(ctx context.Context) *slog.Logger {
	l := Default()
	if rid := RequestIDFromContext(ctx); rid != "" {
		l = l.With("request_id", rid)
	}
	return l
}
