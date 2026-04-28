package config

import (
	"errors"
	"strings"
	"testing"
)

func TestNormalizeSSLMode(t *testing.T) {
	cases := map[string]string{
		"":            "disable",
		"disable":     "disable",
		"DISABLE":     "disable",
		"  disabled ": "disable",
		"off":         "disable",
		"false":       "disable",
		"no":          "disable",
		"enabled":     "require",
		"enable":      "require",
		"on":          "require",
		"true":        "require",
		"yes":         "require",
		"require":     "require",
		"verify-ca":   "verify-ca",
		"verify-full": "verify-full",
		"prefer":      "prefer",
		"allow":       "allow",
		"bogus":       "bogus", // unknown stays unchanged so Validate can reject it
	}
	for in, want := range cases {
		if got := normalizeSSLMode(in); got != want {
			t.Errorf("normalizeSSLMode(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestIsInternalDBHost(t *testing.T) {
	internal := []string{
		"", "localhost", "db", "postgres", "vibecms-db",
		"127.0.0.1", "10.0.0.5", "172.16.5.5", "192.168.1.10", "::1",
	}
	for _, h := range internal {
		if !isInternalDBHost(h) {
			t.Errorf("isInternalDBHost(%q) = false, want true", h)
		}
	}
	external := []string{
		"db.example.com", "supabase.co", "8.8.8.8", "1.1.1.1",
		"some-host.fly.dev",
	}
	for _, h := range external {
		if isInternalDBHost(h) {
			t.Errorf("isInternalDBHost(%q) = true, want false", h)
		}
	}
}

// productionCfg returns a Config that passes every other production check,
// so individual tests can flip a single field and assert it's the only
// thing that trips Validate.
func productionCfg() *Config {
	return &Config{
		AppEnv:             "production",
		DBHost:             "db",
		DBPassword:         "a-strong-password",
		DBSSLMode:          "disable",
		SessionSecret:      "session-secret-long-enough",
		MonitorBearerToken: "monitor-token",
		SecretKey:          "key",
	}
}

// withCORS sets CORS_ORIGINS for the duration of a test so Validate's
// production check passes the CORS gate.
func withCORS(t *testing.T) {
	t.Helper()
	t.Setenv("CORS_ORIGINS", "https://example.com")
}

func TestValidate_AcceptsDisableOnInternalHost(t *testing.T) {
	withCORS(t)
	cfg := productionCfg()
	cfg.DBSSLMode = "disable"
	cfg.DBHost = "db" // compose service name → internal
	if err := cfg.Validate(); err != nil {
		t.Fatalf("expected internal-host disable to validate, got %v", err)
	}
}

func TestValidate_RejectsDisableOnPublicHost(t *testing.T) {
	withCORS(t)
	cfg := productionCfg()
	cfg.DBSSLMode = "disable"
	cfg.DBHost = "db.example.com"
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected public-host disable to fail validation")
	}
	if !errors.Is(err, ErrUnsafeProduction) {
		t.Errorf("error should wrap ErrUnsafeProduction, got %v", err)
	}
	if !strings.Contains(err.Error(), "db.example.com") {
		t.Errorf("error should mention the public host, got %v", err)
	}
}

func TestValidate_RejectsUnknownSSLMode(t *testing.T) {
	withCORS(t)
	cfg := productionCfg()
	cfg.DBSSLMode = "totally-bogus"
	err := cfg.Validate()
	if err == nil {
		t.Fatal("expected unknown sslmode to fail validation")
	}
	if !strings.Contains(err.Error(), "totally-bogus") {
		t.Errorf("error should quote the bad value, got %v", err)
	}
	// Make sure we list the valid values so the operator knows what to set.
	for _, v := range []string{"disable", "require", "verify-full"} {
		if !strings.Contains(err.Error(), v) {
			t.Errorf("error should mention valid mode %q, got %v", v, err)
		}
	}
}

func TestLoad_NormalizesEnabledAlias(t *testing.T) {
	t.Setenv("DB_SSLMODE", "enabled")
	cfg := Load()
	if cfg.DBSSLMode != "require" {
		t.Errorf("DB_SSLMODE=enabled should normalize to %q, got %q", "require", cfg.DBSSLMode)
	}
}

func TestLoad_NormalizesDatabaseURLSslmode(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://u:p@db:5432/v?sslmode=enabled")
	cfg := Load()
	if cfg.DBSSLMode != "require" {
		t.Errorf("DATABASE_URL sslmode=enabled should normalize to require, got %q", cfg.DBSSLMode)
	}
}

func TestValidate_NonProductionAlwaysPasses(t *testing.T) {
	cfg := productionCfg()
	cfg.AppEnv = "development"
	cfg.DBSSLMode = "anything-here"
	cfg.SessionSecret = ""
	if err := cfg.Validate(); err != nil {
		t.Fatalf("non-production must skip all checks, got %v", err)
	}
}
