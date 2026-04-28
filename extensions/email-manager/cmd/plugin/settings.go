package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the settings get/save endpoints plus the test-email
// flow used by the admin UI to verify SMTP/Resend credentials.

func (p *EmailManagerPlugin) getSettings(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	settings, err := p.host.GetSettings(ctx, "email_")
	if err != nil {
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email settings"), nil
	}

	result := make(map[string]string)
	for k, v := range settings {
		if maskedKeys[k] && v != "" {
			result[k] = "••••"
		} else {
			result[k] = v
		}
	}

	return jsonResponse(200, map[string]any{"data": result}), nil
}

func (p *EmailManagerPlugin) saveSettings(ctx context.Context, body []byte) (*pb.PluginHTTPResponse, error) {
	var settings map[string]string
	if err := json.Unmarshal(body, &settings); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	for key, value := range settings {
		if !strings.HasPrefix(key, "email_") {
			continue
		}
		// Skip masked values that were not changed.
		if maskedKeys[key] && value == "••••" {
			continue
		}
		if err := p.host.SetSetting(ctx, key, value); err != nil {
			return jsonError(500, "SAVE_FAILED", fmt.Sprintf("Failed to save setting %s", key)), nil
		}
	}

	return jsonResponse(200, map[string]any{"data": map[string]any{"message": "Email settings saved"}}), nil
}

func (p *EmailManagerPlugin) testEmail(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	// Get the current user email from request headers (set by auth middleware).
	userEmail := ""
	for k, v := range req.GetHeaders() {
		if strings.EqualFold(k, "x-user-email") {
			userEmail = v
			break
		}
	}
	if userEmail == "" {
		return jsonError(400, "NO_EMAIL", "Cannot determine user email for test"), nil
	}

	subject := "Squilla Test Email"
	body := fmt.Sprintf(`<html><body>
<h2>Squilla Test Email</h2>
<p>This is a test email confirming that your email configuration is working correctly.</p>
<p>Sent at: <strong>%s</strong></p>
</body></html>`, time.Now().Format(time.RFC1123))

	if err := p.host.SendEmail(ctx, coreapi.EmailRequest{
		To:      []string{userEmail},
		Subject: subject,
		HTML:    body,
	}); err != nil {
		return jsonError(500, "SEND_FAILED", "Failed to send test email: "+err.Error()), nil
	}

	return jsonResponse(200, map[string]any{"data": map[string]any{"message": "Test email sent to " + userEmail}}), nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
