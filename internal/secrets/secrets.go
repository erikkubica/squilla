// Package secrets provides AES-256-GCM envelope encryption for values
// that must not sit in the database in plaintext — site_settings rows
// matching the secret-key heuristic (passwords, API keys, OAuth tokens),
// theme git tokens, webhook secrets, etc.
//
// The service reads a single master key from the SQUILLA_SECRET_KEY env
// var (32 raw bytes, base64-encoded). When the env var is unset the
// service runs in pass-through mode: Encrypt is a no-op and Decrypt
// accepts plaintext. This keeps dev frictionless; production is gated
// by config.Validate which refuses to start without the key.
package secrets

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

const (
	// EnvKey is the env var holding the base64-encoded master key.
	EnvKey = "SQUILLA_SECRET_KEY"
	// envelopePrefix tags ciphertext so plaintext rows from the
	// pre-encryption era still pass through Decrypt unchanged.
	envelopePrefix = "enc:v1:"
	// keySize is the master-key length in raw bytes (AES-256).
	keySize = 32
)

// Sentinel errors callers can match against.
var (
	ErrNoKey      = errors.New("secrets: SQUILLA_SECRET_KEY not configured")
	ErrInvalidKey = errors.New("secrets: SQUILLA_SECRET_KEY must be 32 raw bytes (base64-encoded)")
	ErrCorrupt    = errors.New("secrets: ciphertext corrupt or wrong key")
)

// Service wraps a single AES-GCM AEAD. Methods are concurrency-safe:
// AEAD.Seal/Open are reentrant, and the underlying key is immutable
// after construction.
type Service struct {
	aead cipher.AEAD // nil → encryption disabled (dev pass-through).
}

// NewFromEnv constructs a Service from SQUILLA_SECRET_KEY. When the env
// var is absent, the returned Service is in pass-through mode and
// IsActive reports false; callers that require encryption (production
// startup, theme token storage in hardened mode) must check this and
// fail loudly.
func NewFromEnv() (*Service, error) {
	raw := os.Getenv(EnvKey)
	if raw == "" {
		return &Service{}, nil
	}
	return newFromBase64(raw)
}

// NewFromBase64 constructs a Service from an explicit base64 key. Used
// by tests that don't want to mutate process env.
func NewFromBase64(b64 string) (*Service, error) {
	if b64 == "" {
		return &Service{}, nil
	}
	return newFromBase64(b64)
}

func newFromBase64(b64 string) (*Service, error) {
	key, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return nil, fmt.Errorf("%w: not valid base64", ErrInvalidKey)
	}
	if len(key) != keySize {
		return nil, fmt.Errorf("%w: got %d bytes, want %d", ErrInvalidKey, len(key), keySize)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("secrets: aes init: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("secrets: gcm init: %w", err)
	}
	return &Service{aead: aead}, nil
}

// IsActive reports whether the service has a real key and will produce
// encrypted output. False means Encrypt returns plaintext unchanged.
func (s *Service) IsActive() bool { return s != nil && s.aead != nil }

// Encrypt encodes plaintext into a prefixed, base64-encoded envelope:
//
//	"enc:v1:" + base64(nonce || ciphertext+tag)
//
// A fresh random nonce is generated per call. When the service is
// inactive, plaintext is returned unchanged so writes from dev/test
// environments don't break.
func (s *Service) Encrypt(plaintext string) (string, error) {
	if !s.IsActive() {
		return plaintext, nil
	}
	nonce := make([]byte, s.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("secrets: nonce: %w", err)
	}
	ct := s.aead.Seal(nil, nonce, []byte(plaintext), nil)
	blob := make([]byte, 0, len(nonce)+len(ct))
	blob = append(blob, nonce...)
	blob = append(blob, ct...)
	return envelopePrefix + base64.StdEncoding.EncodeToString(blob), nil
}

// Decrypt recovers plaintext from an envelope produced by Encrypt.
// Values without the envelope prefix are returned unchanged so legacy
// plaintext rows keep working until they are rewritten.
func (s *Service) Decrypt(value string) (string, error) {
	if !IsEncrypted(value) {
		return value, nil
	}
	if !s.IsActive() {
		return "", ErrNoKey
	}
	blob, err := base64.StdEncoding.DecodeString(value[len(envelopePrefix):])
	if err != nil {
		return "", fmt.Errorf("secrets: base64: %w", err)
	}
	n := s.aead.NonceSize()
	if len(blob) < n+s.aead.Overhead() {
		return "", ErrCorrupt
	}
	nonce, ct := blob[:n], blob[n:]
	pt, err := s.aead.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", ErrCorrupt
	}
	return string(pt), nil
}

// IsEncrypted reports whether value already carries the envelope tag.
// Callers use this to skip double-encryption when round-tripping.
func IsEncrypted(value string) bool {
	return strings.HasPrefix(value, envelopePrefix)
}

// MaybeEncrypt returns the envelope-encrypted form of value when it
// isn't empty and isn't already encrypted. Empty strings stay empty
// (avoids leaking a non-zero ciphertext for a row that was supposed to
// be cleared); previously-encrypted values are passed through (keeps
// admin "save without edit" round-trips idempotent). When the service
// is inactive the original value is returned unchanged.
func (s *Service) MaybeEncrypt(value string) (string, error) {
	if value == "" || IsEncrypted(value) {
		return value, nil
	}
	return s.Encrypt(value)
}

// secretKeySuffixes are name fragments that mark a setting as
// credential-like. Kept package-private — callers go through IsSecretKey.
var secretKeySuffixes = []string{
	"_password",
	"_secret",
	"_key",
	"_token",
	"_apikey",
	"_api_key",
	"_credentials",
}

// IsSecretKey reports whether a setting key looks like a credential.
// The match is case-insensitive substring, not suffix only — it must
// catch things like "smtp_password" and "encrypted_secret_value" but
// also nested names like "providers.email_smtp_password".
func IsSecretKey(key string) bool {
	k := strings.ToLower(key)
	for _, s := range secretKeySuffixes {
		if strings.Contains(k, s) {
			return true
		}
	}
	return false
}

// GenerateKey returns a fresh base64-encoded 32-byte key, suitable for
// a one-shot CLI helper that prints a value the operator pastes into
// SQUILLA_SECRET_KEY.
func GenerateKey() (string, error) {
	k := make([]byte, keySize)
	if _, err := io.ReadFull(rand.Reader, k); err != nil {
		return "", fmt.Errorf("secrets: rand: %w", err)
	}
	return base64.StdEncoding.EncodeToString(k), nil
}
