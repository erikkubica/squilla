package secrets

import (
	"errors"
	"strings"
	"testing"
)

// freshService returns a Service backed by a generated key. Used by every
// test that needs encryption — keeps test setup terse.
func freshService(t *testing.T) *Service {
	t.Helper()
	k, err := GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey: %v", err)
	}
	s, err := NewFromBase64(k)
	if err != nil {
		t.Fatalf("NewFromBase64: %v", err)
	}
	if !s.IsActive() {
		t.Fatal("expected active service")
	}
	return s
}

func TestRoundtrip(t *testing.T) {
	s := freshService(t)
	cases := []string{"", "a", "hunter2", strings.Repeat("x", 4096), "unicode: ✨🔐"}
	for _, pt := range cases {
		ct, err := s.Encrypt(pt)
		if err != nil {
			t.Fatalf("Encrypt(%q): %v", pt, err)
		}
		if !IsEncrypted(ct) {
			t.Fatalf("Encrypt output not tagged: %q", ct)
		}
		got, err := s.Decrypt(ct)
		if err != nil {
			t.Fatalf("Decrypt: %v", err)
		}
		if got != pt {
			t.Fatalf("roundtrip mismatch: got %q want %q", got, pt)
		}
	}
}

func TestEncrypt_FreshNonceEachCall(t *testing.T) {
	// Two encryptions of the same plaintext must produce different
	// ciphertexts — otherwise we leak equality across rows.
	s := freshService(t)
	a, err := s.Encrypt("same")
	if err != nil {
		t.Fatal(err)
	}
	b, err := s.Encrypt("same")
	if err != nil {
		t.Fatal(err)
	}
	if a == b {
		t.Fatal("nonce reuse: identical plaintexts produced identical ciphertexts")
	}
}

func TestDecrypt_PassesThroughLegacy(t *testing.T) {
	// Plaintext rows from before encryption was enabled must keep
	// working without a key on the way out.
	s := freshService(t)
	got, err := s.Decrypt("plain-old-token")
	if err != nil {
		t.Fatal(err)
	}
	if got != "plain-old-token" {
		t.Fatalf("legacy passthrough: got %q", got)
	}
}

func TestDecrypt_TamperFails(t *testing.T) {
	s := freshService(t)
	ct, err := s.Encrypt("secret")
	if err != nil {
		t.Fatal(err)
	}
	// Flip a byte at the end (in the GCM tag region).
	tampered := ct[:len(ct)-2] + "AA"
	if _, err := s.Decrypt(tampered); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("expected ErrCorrupt, got %v", err)
	}
}

func TestDecrypt_WrongKeyFails(t *testing.T) {
	s1 := freshService(t)
	s2 := freshService(t)
	ct, err := s1.Encrypt("secret")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s2.Decrypt(ct); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("expected ErrCorrupt with foreign key, got %v", err)
	}
}

func TestInactiveService_IsPassthrough(t *testing.T) {
	s, err := NewFromBase64("")
	if err != nil {
		t.Fatal(err)
	}
	if s.IsActive() {
		t.Fatal("empty key should yield inactive service")
	}
	got, err := s.Encrypt("x")
	if err != nil {
		t.Fatal(err)
	}
	if got != "x" {
		t.Fatalf("inactive Encrypt should passthrough, got %q", got)
	}
	got, err = s.Decrypt("x")
	if err != nil {
		t.Fatal(err)
	}
	if got != "x" {
		t.Fatalf("inactive Decrypt should passthrough, got %q", got)
	}
}

func TestInactiveService_RefusesEnvelope(t *testing.T) {
	// An inactive service that encounters an envelope-tagged value MUST
	// fail loud — silently passing the ciphertext through to a caller
	// would surface as "your password is enc:v1:..." in an SMTP login.
	good := freshService(t)
	ct, _ := good.Encrypt("hi")

	off, _ := NewFromBase64("")
	if _, err := off.Decrypt(ct); !errors.Is(err, ErrNoKey) {
		t.Fatalf("expected ErrNoKey decrypting envelope w/o key, got %v", err)
	}
}

func TestNewFromBase64_InvalidKeys(t *testing.T) {
	cases := []string{
		"!!!not base64!!!",
		"YWJj", // 3 bytes, too short
	}
	for _, b := range cases {
		if _, err := NewFromBase64(b); !errors.Is(err, ErrInvalidKey) {
			t.Errorf("input %q: expected ErrInvalidKey, got %v", b, err)
		}
	}
}

func TestGenerateKey_Unique(t *testing.T) {
	a, err := GenerateKey()
	if err != nil {
		t.Fatal(err)
	}
	b, err := GenerateKey()
	if err != nil {
		t.Fatal(err)
	}
	if a == b {
		t.Fatal("GenerateKey returned identical keys back-to-back")
	}
	if _, err := NewFromBase64(a); err != nil {
		t.Fatalf("generated key not accepted: %v", err)
	}
}
