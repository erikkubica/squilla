package coreapi

import (
	"context"
	"testing"

	"squilla/internal/events"
	"squilla/internal/models"
	"squilla/internal/secrets"
	"squilla/internal/testutil"
)

// A provider credential encrypted at rest must reach the provider plugin
// decrypted; a legacy plaintext row must arrive unchanged.
func TestSendEmail_DecryptsProviderSecrets(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}); err != nil {
		t.Fatal(err)
	}
	key, _ := secrets.GenerateKey()
	svc, err := secrets.NewFromBase64(key)
	if err != nil {
		t.Fatal(err)
	}
	enc, err := svc.Encrypt("s3cret-pw")
	if err != nil {
		t.Fatal(err)
	}
	rows := map[string]string{
		"email_provider":              "smtp-provider",
		"from_email":                  "noreply@example.com",
		"ext.smtp-provider.password":  enc,
		"ext.smtp-provider.api_key":   "legacy-plain-key",
		"ext.smtp-provider.host":      "smtp.example.com",
		"ext.other-provider.password": "not-mine",
	}
	for k, v := range rows {
		v := v
		if err := db.Create(&models.SiteSetting{Key: k, Value: &v}).Error; err != nil {
			t.Fatal(err)
		}
	}

	bus := events.New()
	var got map[string]string
	bus.SubscribeErr("email.send", func(_ string, p events.Payload) error {
		got, _ = p["settings"].(map[string]string)
		return nil
	})
	c := &coreImpl{db: db, eventBus: bus, secrets: svc}
	if err := c.SendEmail(context.Background(), EmailRequest{To: []string{"a@example.com"}, Subject: "hi"}); err != nil {
		t.Fatalf("SendEmail: %v", err)
	}
	if got["password"] != "s3cret-pw" {
		t.Errorf("encrypted password arrived as %q, want decrypted plaintext", got["password"])
	}
	if got["api_key"] != "legacy-plain-key" {
		t.Errorf("legacy plaintext api_key arrived as %q", got["api_key"])
	}
	if got["host"] != "smtp.example.com" {
		t.Errorf("host = %q", got["host"])
	}
	if _, leaked := got["other-provider.password"]; leaked {
		t.Error("another provider's settings must not be included")
	}
}
