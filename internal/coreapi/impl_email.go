package coreapi

import (
	"context"
	"errors"
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
	// Header injection guard for every address the provider will put in a header.
	for _, list := range [][]string{req.To, req.CC, req.BCC, {req.ReplyTo}} {
		for _, a := range list {
			if strings.ContainsAny(a, "\r\n") {
				return NewValidation("invalid characters in email address")
			}
		}
	}

	if !c.eventBus.HasRequestHandlers("email.send") {
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
			// Secret-shaped keys (SMTP password, API key) are encrypted at
			// rest by SetSetting / the extension settings handler; decrypt
			// them exactly like GetSetting so the provider receives the
			// credential, not the envelope. Legacy plaintext passes through.
			plain, err := c.decryptIfSecret(k, v)
			if err != nil {
				return NewInternal("could not decrypt email provider setting " + k)
			}
			providerSettings[strings.TrimPrefix(k, extPrefix)] = plain
		}
	}

	// PublishRequest reaches every active provider: gRPC plugins that
	// declare `events: ["email.send"]` and Tengo scripts that call
	// events.on("email.send", …). Each provider answers only when
	// settings.provider is its own slug and declines (ErrNotHandled)
	// otherwise, so with several providers installed exactly the selected
	// one sends, and its error is the one returned.
	err := c.eventBus.PublishRequest("email.send", events.Payload{
		"to":       req.To,
		"subject":  req.Subject,
		"html":     req.HTML,
		"cc":       req.CC,
		"bcc":      req.BCC,
		"reply_to": req.ReplyTo,
		"settings": providerSettings,
	})
	if errors.Is(err, events.ErrNotHandled) {
		return NewValidation("email provider \"" + providerName + "\" did not handle the message — is that extension active? Check email_provider in Email Settings")
	}
	if err != nil {
		return NewInternal("email provider rejected message: " + err.Error())
	}
	return nil
}
