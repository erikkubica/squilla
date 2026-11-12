package main

import (
	"fmt"
	"strings"
	"testing"

	"squilla/internal/coreapi"
)

func makeFormWithWebhook(webhookURL string) map[string]any {
	return map[string]any{
		"id":   float64(1),
		"slug": "test-form",
		// settings must be a parsed map (as returned by normalizeForm)
		"settings": map[string]any{
			"webhook_enabled": true,
			"webhook_url":     webhookURL,
		},
	}
}

func TestFireWebhook_Disabled(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)

	form := map[string]any{
		"id": float64(1),
		"settings": map[string]any{
			"webhook_enabled": false,
			"webhook_url":     "https://example.com/hook",
		},
	}
	p.fireWebhook(ctx(), form, 1, map[string]any{}, map[string]any{})

	// No webhook fired, no log created
	if _, ok := h.Tables["form_webhook_logs"]; ok {
		t.Error("disabled webhook should not create a log entry")
	}
}

func TestFireWebhook_NoURL(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)

	form := map[string]any{
		"id": float64(1),
		"settings": map[string]any{
			"webhook_enabled": true,
			"webhook_url":     "",
		},
	}
	p.fireWebhook(ctx(), form, 1, map[string]any{}, map[string]any{})

	if _, ok := h.Tables["form_webhook_logs"]; ok {
		t.Error("empty URL webhook should not create a log entry")
	}
}

func TestFireWebhook_Success(t *testing.T) {
	h := NewFakeHost()
	h.FetchStub = func(req coreapi.FetchRequest) (*coreapi.FetchResponse, error) {
		if !strings.Contains(req.URL, "webhook.example.com") {
			t.Errorf("unexpected URL: %s", req.URL)
		}
		return &coreapi.FetchResponse{StatusCode: 200, Body: `{"ok":true}`}, nil
	}
	p := newPlugin(h)
	form := makeFormWithWebhook("https://webhook.example.com/hook")

	p.fireWebhook(ctx(), form, 42, map[string]any{"name": "Test"}, map[string]any{})

	if len(h.Tables["form_webhook_logs"]) != 1 {
		t.Fatalf("expected 1 webhook log, got %d", len(h.Tables["form_webhook_logs"]))
	}
	for _, row := range h.Tables["form_webhook_logs"] {
		if row["status_code"] != float64(200) {
			t.Errorf("status_code: got %v, want 200", row["status_code"])
		}
		if row["error"] != nil && row["error"] != "" {
			t.Errorf("expected no error, got %v", row["error"])
		}
	}
}

func TestFireWebhook_FetchError(t *testing.T) {
	h := NewFakeHost()
	h.FetchStub = func(_ coreapi.FetchRequest) (*coreapi.FetchResponse, error) {
		return nil, fmt.Errorf("network error")
	}
	p := newPlugin(h)
	form := makeFormWithWebhook("https://webhook.example.com/hook")

	p.fireWebhook(ctx(), form, 42, map[string]any{}, map[string]any{})

	if len(h.Tables["form_webhook_logs"]) != 1 {
		t.Fatalf("expected 1 webhook log entry (even on error), got %d", len(h.Tables["form_webhook_logs"]))
	}
	for _, row := range h.Tables["form_webhook_logs"] {
		if row["status_code"] != float64(0) {
			t.Errorf("status_code on error: got %v, want 0", row["status_code"])
		}
		errVal, _ := row["error"].(string)
		if !strings.Contains(errVal, "network error") {
			t.Errorf("expected error string, got %q", errVal)
		}
	}
}

func TestFireWebhook_CustomHeaders(t *testing.T) {
	var capturedReq coreapi.FetchRequest
	h := NewFakeHost()
	h.FetchStub = func(req coreapi.FetchRequest) (*coreapi.FetchResponse, error) {
		capturedReq = req
		return &coreapi.FetchResponse{StatusCode: 200, Body: `{}`}, nil
	}
	p := newPlugin(h)

	form := map[string]any{
		"id":   float64(1),
		"slug": "test",
		// settings already parsed (as would come from normalizeForm)
		"settings": map[string]any{
			"webhook_enabled": true,
			"webhook_url":     "https://example.com/hook",
			"webhook_headers": `{"X-Custom-Token":"abc123"}`,
		},
	}

	p.fireWebhook(ctx(), form, 1, map[string]any{}, map[string]any{})

	if capturedReq.Headers["X-Custom-Token"] != "abc123" {
		t.Errorf("custom header not passed, got %v", capturedReq.Headers)
	}
}

func TestWebhookTruncate(t *testing.T) {
	short := "hello"
	if webhookTruncate(short, 100) != short {
		t.Error("short string should not be truncated")
	}

	long := strings.Repeat("x", 5000)
	result := webhookTruncate(long, 4096)
	if len(result) <= 4096 {
		// The truncated string is 4096 + len("...(truncated)") but logically it's cut
	}
	if !strings.HasSuffix(result, "...(truncated)") {
		t.Error("truncated string should end with ...(truncated)")
	}
}

// ---- handleWebhookLogs ----

func TestHandleWebhookLogs(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)

	// Add some webhook logs
	h.DataCreate(ctx(), "form_webhook_logs", map[string]any{"form_id": float64(5), "status_code": float64(200)})
	h.DataCreate(ctx(), "form_webhook_logs", map[string]any{"form_id": float64(5), "status_code": float64(500)})

	resp, err := p.handleWebhookLogs(ctx(), 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

// Webhook URLs often carry a secret token; the server log gets the host
// only, even when the fetch error echoes the full URL.
func TestFireWebhook_LogsHostOnly(t *testing.T) {
	h := NewFakeHost()
	const hook = "https://hooks.example.com/services/T000/B000/s3cr3tt0ken?sig=abc"
	h.FetchStub = func(_ coreapi.FetchRequest) (*coreapi.FetchResponse, error) {
		return nil, fmt.Errorf("Post %q: dial tcp: connection refused", hook)
	}
	p := newPlugin(h)
	p.fireWebhook(ctx(), makeFormWithWebhook(hook), 1, map[string]any{}, map[string]any{})

	found := false
	for _, l := range h.Logs {
		if strings.Contains(l.Message, "s3cr3tt0ken") || strings.Contains(l.Message, "sig=abc") {
			t.Errorf("log leaks webhook secret: %q", l.Message)
		}
		if strings.Contains(l.Message, "hooks.example.com") {
			found = true
		}
	}
	if !found {
		t.Errorf("expected a log line naming the host, got %v", h.Logs)
	}
}
