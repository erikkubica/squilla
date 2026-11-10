package events

import (
	"errors"
	"testing"
)

// provider mimics an email provider extension: it answers only when the
// request names it in settings.provider and declines otherwise.
func provider(slug string, sends map[string]int, fail error) ErrHandler {
	return func(_ string, p Payload) error {
		settings, _ := p["settings"].(map[string]string)
		if settings["provider"] != slug {
			return ErrNotHandled
		}
		sends[slug]++
		return fail
	}
}

func TestPublishRequest_TwoProvidersOnlySelectedSends(t *testing.T) {
	bus := New()
	sends := map[string]int{}
	// SMTP is registered first and unconfigured — before routing, its
	// "SMTP host is required" error won every send.
	bus.SubscribeErr("email.send", provider("smtp-provider", sends, errors.New("SMTP host is required")))
	bus.SubscribeErr("email.send", provider("resend-provider", sends, nil))

	err := bus.PublishRequest("email.send", Payload{"settings": map[string]string{"provider": "resend-provider"}})
	if err != nil {
		t.Fatalf("selected provider succeeded, got %v", err)
	}
	if sends["resend-provider"] != 1 || sends["smtp-provider"] != 0 {
		t.Fatalf("want exactly one send via resend-provider, got %v", sends)
	}
}

func TestPublishRequest_SelectedProviderErrorIsReturned(t *testing.T) {
	bus := New()
	sends := map[string]int{}
	resendErr := errors.New("resend: 401")
	bus.SubscribeErr("email.send", provider("smtp-provider", sends, nil))
	bus.SubscribeErr("email.send", provider("resend-provider", sends, resendErr))

	err := bus.PublishRequest("email.send", Payload{"settings": map[string]string{"provider": "resend-provider"}})
	if !errors.Is(err, resendErr) {
		t.Fatalf("want the selected provider's error, got %v", err)
	}
	if sends["smtp-provider"] != 0 {
		t.Fatalf("unselected provider sent: %v", sends)
	}
}

func TestPublishRequest_AllDeclinedIsNotHandled(t *testing.T) {
	bus := New()
	sends := map[string]int{}
	bus.SubscribeErr("email.send", provider("smtp-provider", sends, nil))

	err := bus.PublishRequest("email.send", Payload{"settings": map[string]string{"provider": "resend-provider"}})
	if !errors.Is(err, ErrNotHandled) {
		t.Fatalf("want ErrNotHandled when the selected provider is not active, got %v", err)
	}
}

func TestHasRequestHandlers_IgnoresWildcardAndPlainSubscribers(t *testing.T) {
	bus := New()
	bus.SubscribeAll(func(string, Payload) {})
	bus.Subscribe("email.send", func(string, Payload) {})
	if bus.HasRequestHandlers("email.send") {
		t.Fatal("wildcard/plain subscribers cannot answer PublishRequest")
	}
	bus.SubscribeErr("email.send", func(string, Payload) error { return nil })
	if !bus.HasRequestHandlers("email.send") {
		t.Fatal("expected a request handler")
	}
}
