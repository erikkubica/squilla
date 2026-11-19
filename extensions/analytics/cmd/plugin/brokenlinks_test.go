package main

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"
)

func TestBrokenLinksEvent(t *testing.T) {
	p, h := newTestPlugin(t)
	h.CallStub["analytics_breakdown"] = stubRows(
		map[string]any{"value": "/old-page", "visitors": 9.0, "pageviews": 12.0, "share": 0.8, "total_rows": 2.0},
		map[string]any{"value": "", "visitors": 1.0, "pageviews": 1.0, "share": 0.2, "total_rows": 2.0},
	)
	resp, err := p.HandleEvent(eventBrokenLinks, []byte(`{"days":7,"limit":9999,"verified":true}`))
	if err != nil || !resp.Handled {
		t.Fatalf("%v %+v", err, resp)
	}
	var out struct {
		Source, From, To string
		Rows             []brokenLink
	}
	if err := json.Unmarshal(resp.Result, &out); err != nil {
		t.Fatal(err)
	}
	if out.Source != "analytics" || out.From != "2026-10-17" || out.To != "2026-10-23" {
		t.Errorf("header %+v", out)
	}
	if len(out.Rows) != 1 || out.Rows[0] != (brokenLink{Path: "/old-page", Hits: 12, Visitors: 9}) {
		t.Errorf("rows %+v", out.Rows)
	}
	args := h.callsTo("analytics_breakdown")[0].Args
	if args[3] != kindNotFound || args[5] != "pageviews" || args[6] != 500.0 {
		t.Errorf("args %v", args)
	}
	if f, _ := args[4].(map[string]any); f[filterVerified] != "1" {
		t.Errorf("verified filter not passed: %v", args[4])
	}

	// Default window is the last 30 days.
	resp, _ = p.HandleEvent(eventBrokenLinks, nil)
	_ = json.Unmarshal(resp.Result, &out)
	if out.From != "2026-09-24" || out.To != "2026-10-23" {
		t.Errorf("default range %s..%s", out.From, out.To)
	}
}

func TestBrokenLinksEventErrorsAndPaging(t *testing.T) {
	p, h := newTestPlugin(t)
	long := "/" + strings.Repeat("a", maxPathLen-1)
	h.CallStub["analytics_breakdown"] = stubRows(
		map[string]any{"value": long, "visitors": 1.0, "pageviews": 1.0, "total_rows": 900.0},
		map[string]any{"value": "/ok", "visitors": 1.0, "pageviews": 1.0, "total_rows": 900.0},
	)
	resp, _ := p.HandleEvent(eventBrokenLinks, []byte(`{"offset":500,"limit":0,"days":-4}`))
	var out struct {
		Total            int64
		ConfirmAvailable bool `json:"confirm_available"`
		Rows             []brokenLink
	}
	_ = json.Unmarshal(resp.Result, &out)
	if out.Total != 900 || len(out.Rows) != 1 || out.Rows[0].Path != "/ok" {
		t.Errorf("got %+v (cut paths must be skipped)", out)
	}
	if args := h.callsTo("analytics_breakdown")[0].Args; args[6] != 100.0 || args[7] != 500.0 {
		t.Errorf("limit/offset args %v", args)
	}

	// Bad payloads and query failures answer with an error, never silence.
	for _, payload := range []string{`{"days":"x"}`, `{}`} {
		if payload == `{}` {
			h.CallStub["analytics_breakdown"] = func([]any) ([]map[string]any, error) { return nil, errors.New("boom") }
		}
		resp, _ := p.HandleEvent(eventBrokenLinks, []byte(payload))
		var e struct{ Source, Error string }
		_ = json.Unmarshal(resp.Result, &e)
		if !resp.Handled || e.Source != "analytics" || e.Error == "" || strings.Contains(e.Error, "boom") {
			t.Errorf("%s: %+v %s", payload, resp, resp.Result)
		}
	}
}
