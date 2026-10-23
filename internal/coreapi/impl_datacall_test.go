package coreapi

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
)

func TestBuildDataCallSQL(t *testing.T) {
	// Always schema-qualified so a name colliding with a pg_catalog
	// built-in (query_to_xml, set_config…) can't resolve to it.
	cases := map[int]string{
		0: `SELECT * FROM "public"."analytics_summary"()`,
		1: `SELECT * FROM "public"."analytics_summary"($1)`,
		3: `SELECT * FROM "public"."analytics_summary"($1, $2, $3)`,
	}
	for n, want := range cases {
		if got := buildDataCallSQL("public", "analytics_summary", n); got != want {
			t.Fatalf("n=%d: got %q, want %q", n, got, want)
		}
	}
}

func dataCallCaller(caps, fns map[string]bool) context.Context {
	return WithCaller(context.Background(), CallerInfo{
		Slug: "analytics", Type: "grpc", Capabilities: caps, OwnedFunctions: fns,
	})
}

func TestDataCallGuard_RequiresCapability(t *testing.T) {
	stub := &stubCoreAPI{}
	ctx := dataCallCaller(map[string]bool{"data:read": true}, map[string]bool{"analytics_summary": true})
	_, err := NewCapabilityGuard(stub).DataCall(ctx, "analytics_summary")
	if !isCapabilityErr(err) && !errors.Is(err, ErrCapabilityDenied) {
		t.Fatalf("expected capability denial, got %v", err)
	}
	if len(stub.calls) != 0 {
		t.Fatal("inner DataCall invoked without data:call")
	}
}

func TestDataCallGuard_RequiresOwnership(t *testing.T) {
	stub := &stubCoreAPI{}
	ctx := dataCallCaller(map[string]bool{"data:call": true}, map[string]bool{"analytics_summary": true})
	for _, fn := range []string{"pg_sleep", "other_ext_fn"} {
		if _, err := NewCapabilityGuard(stub).DataCall(ctx, fn); !isCapabilityErr(err) && !errors.Is(err, ErrCapabilityDenied) {
			t.Fatalf("%s: expected ownership denial, got %v", fn, err)
		}
	}
	if len(stub.calls) != 0 {
		t.Fatal("inner DataCall invoked for an unowned function")
	}
	if _, err := NewCapabilityGuard(stub).DataCall(ctx, "analytics_summary", "2026-10-01"); err != nil {
		t.Fatalf("owned function denied: %v", err)
	}
}

func TestDataCallGuard_RejectsMalformedNames(t *testing.T) {
	stub := &stubCoreAPI{}
	bad := []string{"", "Analytics", "public.fn", `fn"; DROP TABLE users; --`, "1fn", "fn()", "fn name"}
	fns := map[string]bool{}
	for _, b := range bad {
		fns[b] = true // even a hostile manifest entry must not pass
	}
	ctx := dataCallCaller(map[string]bool{"data:call": true}, fns)
	internal := WithCaller(context.Background(), InternalCaller())
	for _, fn := range bad {
		if _, err := NewCapabilityGuard(stub).DataCall(ctx, fn); err == nil {
			t.Fatalf("%q: expected rejection", fn)
		}
		if _, err := NewCapabilityGuard(stub).DataCall(internal, fn); err == nil {
			t.Fatalf("%q: internal caller should still be name-checked", fn)
		}
	}
	if len(stub.calls) != 0 {
		t.Fatalf("inner invoked for malformed names: %v", stub.calls)
	}
}

func TestNormalizeCallArgs(t *testing.T) {
	got := normalizeCallArgs([]any{float64(3), 2.5, "x", float64(-7), map[string]any{"n": float64(1)}, nil, true})
	if v, ok := got[0].(int64); !ok || v != 3 {
		t.Fatalf("whole float not converted: %#v", got[0])
	}
	if v, ok := got[1].(float64); !ok || v != 2.5 {
		t.Fatalf("fraction changed: %#v", got[1])
	}
	if v, ok := got[3].(int64); !ok || v != -7 {
		t.Fatalf("negative whole float not converted: %#v", got[3])
	}
	if m := got[4].(map[string]any); m["n"] != float64(1) {
		t.Fatal("nested values must be left alone")
	}
}

func TestDecodeCallValue(t *testing.T) {
	if m, ok := decodeCallValue([]byte(`{"a":1}`), true).(map[string]any); !ok || m["a"] != float64(1) {
		t.Fatal("jsonb []byte not parsed")
	}
	if s, ok := decodeCallValue(`[1,2]`, true).([]any); !ok || len(s) != 2 {
		t.Fatal("jsonb string not parsed")
	}
	if v := decodeCallValue([]byte("hello"), false); v != "hello" {
		t.Fatalf("text []byte should become string, got %#v", v)
	}
	if v := decodeCallValue(int64(5), false); v != int64(5) {
		t.Fatal("scalar changed")
	}
}

// Integers beyond 2^53 must survive the gRPC JSON hop exactly.
func TestNormalizeCallArgs_JSONNumberPrecision(t *testing.T) {
	got := normalizeCallArgs([]any{json.Number("9007199254740993"), json.Number("2.5"), json.Number("1e3")})
	if v, ok := got[0].(int64); !ok || v != 9007199254740993 {
		t.Fatalf("large int lost precision: %#v", got[0])
	}
	if v, ok := got[1].(float64); !ok || v != 2.5 {
		t.Fatalf("fraction: %#v", got[1])
	}
	if v, ok := got[2].(int64); !ok || v != 1000 {
		t.Fatalf("whole exponent form: %#v", got[2])
	}
}
