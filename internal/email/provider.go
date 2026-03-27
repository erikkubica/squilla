package email

// Provider defines the interface for sending emails.
type Provider interface {
	Name() string
	Send(to []string, subject string, html string) error
}

// NewProvider creates a provider from site settings map.
// Supports both legacy names ("smtp", "resend") and extension slugs ("smtp-provider", "resend-provider").
func NewProvider(name string, settings map[string]string) Provider {
	switch name {
	case "smtp", "smtp-provider":
		return NewSMTPProvider(settings)
	case "resend", "resend-provider":
		return NewResendProvider(settings)
	default:
		return nil
	}
}

// NewProviderFromExtension creates a provider using extension-scoped settings.
// Settings should already be the extension-scoped settings (without the ext.slug. prefix).
func NewProviderFromExtension(providerSlug string, extSettings map[string]string) Provider {
	switch providerSlug {
	case "smtp-provider":
		return NewSMTPProvider(extSettings)
	case "resend-provider":
		return NewResendProvider(extSettings)
	default:
		return nil
	}
}
