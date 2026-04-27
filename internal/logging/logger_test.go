package logging

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"
)

// captureLogger builds a logger writing into a bytes.Buffer for
// assertion. Mirrors how Init/Default work but without the package
// global so tests don't bleed state.
func captureLogger(t *testing.T, isDev bool) (*slog.Logger, *bytes.Buffer) {
	t.Helper()
	buf := &bytes.Buffer{}
	return build(buf, isDev), buf
}

func TestParseLevel(t *testing.T) {
	cases := []struct {
		in   string
		want slog.Level
	}{
		{"debug", slog.LevelDebug},
		{"DEBUG", slog.LevelDebug},
		{"info", slog.LevelInfo},
		{"warn", slog.LevelWarn},
		{"warning", slog.LevelWarn},
		{"error", slog.LevelError},
		{"", slog.LevelInfo},
		{"nonsense", slog.LevelInfo},
	}
	for _, c := range cases {
		if got := parseLevel(c.in, slog.LevelInfo); got != c.want {
			t.Errorf("parseLevel(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestBuild_DevDefaultsText(t *testing.T) {
	l, buf := captureLogger(t, true)
	l.Info("hello", "k", "v")
	out := buf.String()
	// text handler outputs key=val, JSON would have quoted keys.
	if !strings.Contains(out, "msg=hello") {
		t.Fatalf("text format expected, got: %q", out)
	}
}

func TestBuild_ProdDefaultsJSON(t *testing.T) {
	l, buf := captureLogger(t, false)
	l.Info("hello", "k", "v")
	var record map[string]any
	if err := json.Unmarshal(buf.Bytes(), &record); err != nil {
		t.Fatalf("expected JSON, got %q: %v", buf.String(), err)
	}
	if record["msg"] != "hello" || record["k"] != "v" {
		t.Fatalf("missing fields: %v", record)
	}
	// "service" attribute is added by build() so kernel logs are
	// distinguishable from anything else on the same stream.
	if record["service"] != "vibecms" {
		t.Fatalf("missing service tag: %v", record)
	}
}

func TestRequestID_RoundtripsThroughContext(t *testing.T) {
	ctx := WithRequestID(context.Background(), "abc-123")
	if got := RequestIDFromContext(ctx); got != "abc-123" {
		t.Fatalf("got %q want abc-123", got)
	}
}

func TestRequestID_EmptyIsNoOp(t *testing.T) {
	// Empty IDs shouldn't pollute the context — From(ctx) would
	// otherwise log request_id="" on every subsequent line.
	ctx := WithRequestID(context.Background(), "")
	if got := RequestIDFromContext(ctx); got != "" {
		t.Fatalf("expected empty, got %q", got)
	}
}

func TestNewRequestID_HexAndUnique(t *testing.T) {
	a := newRequestID()
	b := newRequestID()
	if a == b {
		t.Fatal("two ids should not collide")
	}
	if len(a) != 16 {
		t.Fatalf("expected 16 hex chars, got %d", len(a))
	}
	for _, r := range a {
		ok := (r >= '0' && r <= '9') || (r >= 'a' && r <= 'f')
		if !ok {
			t.Fatalf("non-hex char %q in id %q", r, a)
		}
	}
}
