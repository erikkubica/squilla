package config

import (
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
)

// validSSLModes is the closed set of values libpq (and therefore lib/pq +
// pgx) accepts for the sslmode connection parameter. Anything else fails
// at connect time with a confusing error, so we normalize early.
var validSSLModes = map[string]struct{}{
	"disable":     {},
	"allow":       {},
	"prefer":      {},
	"require":     {},
	"verify-ca":   {},
	"verify-full": {},
}

// sslModeAliases maps user-friendly values to canonical Postgres sslmode.
// Lets operators write DB_SSLMODE=enabled instead of having to look up
// the libpq vocabulary; we still write a Postgres-legal value into the DSN.
var sslModeAliases = map[string]string{
	"":         "disable",
	"on":       "require",
	"true":     "require",
	"yes":      "require",
	"enable":   "require",
	"enabled":  "require",
	"off":      "disable",
	"false":    "disable",
	"no":       "disable",
	"disabled": "disable",
}

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
	cfg.DBSSLMode = normalizeSSLMode(cfg.DBSSLMode)
	return cfg
}

// normalizeSSLMode maps friendly aliases (enabled/disabled/on/off/...)
// to libpq-canonical values. Unknown values are returned unchanged so
// Validate can emit a precise error listing the accepted set.
func normalizeSSLMode(v string) string {
	canonical := strings.ToLower(strings.TrimSpace(v))
	if alias, ok := sslModeAliases[canonical]; ok {
		return alias
	}
	return canonical
}

// isInternalDBHost reports whether the configured DB host is plausibly on
// a private network where TLS is impractical and disable is acceptable —
// docker-compose service names (no dots), localhost, and RFC1918 / link-
// local / loopback IPs. Public hostnames must still use TLS.
func isInternalDBHost(host string) bool {
	host = strings.ToLower(strings.TrimSpace(host))
	if host == "" || host == "localhost" {
		return true
	}
	// Single-token hostnames are docker-compose service names — by
	// construction they only resolve on the compose network.
	if !strings.Contains(host, ".") {
		return true
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsPrivate() {
		return true
	}
	return false
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
	// Reject unknown sslmode values regardless of host — better to fail
	// loudly here than at connect time with a generic libpq error.
	if _, ok := validSSLModes[c.DBSSLMode]; !ok {
		problems = append(problems,
			fmt.Sprintf("DB_SSLMODE=%q is not a valid Postgres sslmode (use one of: disable, allow, prefer, require, verify-ca, verify-full; or aliases enabled/disabled)", c.DBSSLMode))
	} else if c.DBSSLMode == "disable" && !isInternalDBHost(c.DBHost) {
		// disable is only acceptable when the database is on a private
		// network — docker-compose service name, localhost, or RFC1918.
		// Public hostnames must use TLS.
		problems = append(problems,
			fmt.Sprintf("DB_SSLMODE=disable with public DB host %q (use require/verify-ca/verify-full, or run the DB on the compose private network)", c.DBHost))
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
