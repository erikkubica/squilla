package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

// ErrUnsafeProduction is returned by Validate when the loaded config has
// development defaults that are unsafe to run in production.
var ErrUnsafeProduction = errors.New("refusing to start in production with unsafe defaults")

// Config holds all application configuration values loaded from environment variables.
type Config struct {
	Port               string
	AppEnv             string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	SessionSecret      string
	SessionExpiryHours int
	MonitorBearerToken string
	StorageDriver      string
	StoragePath        string
	// SecretKey holds the base64-encoded master key (32 raw bytes) for
	// at-rest encryption of secret-shaped settings and theme git
	// tokens. Empty in dev means "store plaintext"; production startup
	// rejects an empty value via Validate().
	SecretKey string
}

// Load reads configuration from environment variables with sensible defaults.
// If DATABASE_URL is set (postgres://user:pass@host:port/dbname?sslmode=...),
// it takes precedence over individual DB_* variables.
func Load() *Config {
	cfg := &Config{
		Port:               envOrDefault("PORT", "8080"),
		AppEnv:             envOrDefault("APP_ENV", "development"),
		DBHost:             envOrDefault("DB_HOST", "localhost"),
		DBPort:             envOrDefault("DB_PORT", "5432"),
		DBUser:             envOrDefault("DB_USER", "vibecms"),
		DBPassword:         envOrDefault("DB_PASSWORD", "vibecms_secret"),
		DBName:             envOrDefault("DB_NAME", "vibecms"),
		DBSSLMode:          envOrDefault("DB_SSLMODE", "disable"),
		SessionSecret:      envOrDefault("SESSION_SECRET", ""),
		SessionExpiryHours: envOrDefaultInt("SESSION_EXPIRY_HOURS", 24),
		MonitorBearerToken: envOrDefault("MONITOR_BEARER_TOKEN", ""),
		StorageDriver:      envOrDefault("STORAGE_DRIVER", "local"),
		StoragePath:        envOrDefault("STORAGE_PATH", "./storage"),
		SecretKey:          envOrDefault("VIBECMS_SECRET_KEY", ""),
	}
	if dburl := os.Getenv("DATABASE_URL"); dburl != "" {
		applyDatabaseURL(cfg, dburl)
	}
	return cfg
}

// Validate checks the configuration for production safety. When AppEnv is
// "production", the kernel must NOT boot with development defaults — empty
// session secret, missing monitor bearer, the seeded `vibecms_secret` DB
// password, disabled TLS to the database, or unset CORS allowlist. The
// returned error wraps ErrUnsafeProduction with a list of every violation.
func (c *Config) Validate() error {
	if !strings.EqualFold(c.AppEnv, "production") {
		return nil
	}
	var problems []string
	if c.SessionSecret == "" {
		problems = append(problems, "SESSION_SECRET is unset")
	}
	if c.MonitorBearerToken == "" {
		problems = append(problems, "MONITOR_BEARER_TOKEN is unset")
	}
	if c.DBPassword == "" || c.DBPassword == "vibecms_secret" {
		problems = append(problems, "DB_PASSWORD is empty or the seed default 'vibecms_secret'")
	}
	if c.DBSSLMode == "disable" {
		problems = append(problems, "DB_SSLMODE=disable (use require/verify-ca/verify-full)")
	}
	if os.Getenv("CORS_ORIGINS") == "" {
		problems = append(problems, "CORS_ORIGINS is unset (would default to localhost:8099)")
	}
	if c.SecretKey == "" {
		// Without a master key we'd silently store theme git PATs and
		// other credentials as plaintext, defeating the at-rest
		// encryption story. Refuse production boot.
		problems = append(problems, "VIBECMS_SECRET_KEY is unset (required for at-rest encryption of secrets)")
	}
	if len(problems) == 0 {
		return nil
	}
	return fmt.Errorf("%w: %s", ErrUnsafeProduction, strings.Join(problems, "; "))
}

// applyDatabaseURL parses a postgres:// URL and overrides individual DB_* fields.
// Invalid URLs are silently ignored so DB_* fallback remains usable.
func applyDatabaseURL(cfg *Config, dburl string) {
	u, err := url.Parse(dburl)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") {
		return
	}
	if u.Hostname() != "" {
		cfg.DBHost = u.Hostname()
	}
	if u.Port() != "" {
		cfg.DBPort = u.Port()
	}
	if u.User != nil {
		cfg.DBUser = u.User.Username()
		if pw, ok := u.User.Password(); ok {
			cfg.DBPassword = pw
		}
	}
	if name := strings.TrimPrefix(u.Path, "/"); name != "" {
		cfg.DBName = name
	}
	if ssl := u.Query().Get("sslmode"); ssl != "" {
		cfg.DBSSLMode = ssl
	}
}

// DSN returns a PostgreSQL connection string built from the configuration values.
func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

// envOrDefault returns the value of the environment variable named by key,
// or the provided default if the variable is unset or empty.
func envOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// envOrDefaultInt returns the integer value of the environment variable named by key,
// or the provided default if the variable is unset, empty, or not a valid integer.
func envOrDefaultInt(key string, fallback int) int {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return n
}
