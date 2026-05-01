package coreapi

import (
	"context"
	"squilla/internal/events"
	"squilla/internal/models"
	"strings"
)

// SendEmail is the kernel's generic outbound-mail primitive. It routes the
// payload via the event bus to whichever provider extension is configured
// — the kernel doesn't ship its own SMTP/Resend/SES code (per the
// kernel/extensions hard rule). Errors from the provider plugin propagate
// back via PublishRequest, so the caller (HTTP handler, MCP tool, the
// email-manager dispatcher) sees the real failure instead of a swallowed
// log line.
//
// What the kernel does keep here:
//   - A "no provider configured" short-circuit so the error message is
//     actionable without each caller probing site_settings.
//   - Bundling provider-namespaced settings (`ext.<provider>.*`) into the
//     event payload. The shape is generic — the kernel doesn't know the
//     names of any specific provider, just that the configured one stores
//     its config under that prefix.
//
// What's NOT in the kernel:
//   - Template rendering, rule matching, recipient resolution. Those live
//     in the email-manager extension's plugin (extensions/email-manager/
//     cmd/plugin/dispatcher.go) and only run when that extension is active.
func (c *coreImpl) SendEmail(ctx context.Context, req EmailRequest) error {
	if len(req.To) == 0 {
		return NewValidation("at least one recipient is required")
	}
	if req.Subject == "" {
		return NewValidation("subject is required")
	}

	if !c.eventBus.HasHandlers("email.send") {
		return NewValidation("no email provider configured — install an email provider extension (e.g. smtp-provider or resend-provider) and set email_provider in site settings")
	}

	// Load provider settings so the provider plugin can actually send.
	var allSettings []models.SiteSetting
	c.db.Find(&allSettings)

	settingsMap := make(map[string]string, len(allSettings))
	for _, s := range allSettings {
		if s.Value != nil {
			settingsMap[s.Key] = *s.Value
		}
	}

	providerName := settingsMap["email_provider"]
	if providerName == "" {
		return NewValidation("no email provider configured — set email_provider in site settings")
	}

	providerSettings := map[string]string{
		"provider":   providerName,
		"from_email": settingsMap["from_email"],
		"from_name":  settingsMap["from_name"],
	}
	extPrefix := "ext." + providerName + "."
	for k, v := range settingsMap {
		if strings.HasPrefix(k, extPrefix) {
			providerSettings[strings.TrimPrefix(k, extPrefix)] = v
		}
	}

	// PublishRequest hits the provider plugin's SubscribeErr handler
	// (registered automatically by the plugin manager when a plugin
	// declares `events: ["email.send"]`). The first non-nil error wins
	// — typically the only provider answering for a given install.
	if err := c.eventBus.PublishRequest("email.send", events.Payload{
		"to":       req.To,
		"subject":  req.Subject,
		"html":     req.HTML,
		"settings": providerSettings,
	}); err != nil {
		return NewInternal("email provider rejected message: " + err.Error())
	}
	return nil
}
