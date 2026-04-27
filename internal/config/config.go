package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
)

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
	}
	if dburl := os.Getenv("DATABASE_URL"); dburl != "" {
		applyDatabaseURL(cfg, dburl)
	}
	return cfg
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
