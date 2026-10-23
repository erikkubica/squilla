package httpobs

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

// app.Test connections always come from 0.0.0.0, so "trusted peer"
// cases list 0.0.0.0 among the proxies and "untrusted" cases don't.
func clientIPFor(t *testing.T, trusted []string, header string, reqHeaders map[string]string) string {
	t.Helper()
	if err := ConfigureClientIP(trusted, header); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { clientIPConfig.Store(nil) })

	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(ClientIP(c)) })
	req := httptest.NewRequest("GET", "/", nil)
	for k, v := range reqHeaders {
		req.Header.Set(k, v)
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	b, _ := io.ReadAll(resp.Body)
	return string(b)
}

func TestClientIP(t *testing.T) {
	trusted := []string{"0.0.0.0", "10.0.0.0/8", "fc00::/7"}
	cases := []struct {
		name    string
		trusted []string
		header  string
		hdrs    map[string]string
		want    string
	}{
		{"unconfigured header ignored", trusted, "", map[string]string{"X-Forwarded-For": "203.0.113.7"}, "0.0.0.0"},
		{"untrusted peer ignores header", []string{"10.0.0.0/8"}, "X-Forwarded-For", map[string]string{"X-Forwarded-For": "203.0.113.7"}, "0.0.0.0"},
		{"single hop", trusted, "X-Forwarded-For", map[string]string{"X-Forwarded-For": "203.0.113.7"}, "203.0.113.7"},
		{"spoofed left entry ignored", trusted, "X-Forwarded-For", map[string]string{"X-Forwarded-For": "1.2.3.4, 203.0.113.7, 10.0.0.5"}, "203.0.113.7"},
		{"invalid hop stops walk", trusted, "X-Forwarded-For", map[string]string{"X-Forwarded-For": "1.2.3.4, garbage, 10.0.0.5"}, "10.0.0.5"},
		{"all trusted -> leftmost", trusted, "X-Forwarded-For", map[string]string{"X-Forwarded-For": "10.0.0.9, 10.0.0.5"}, "10.0.0.9"},
		{"ipv6 with port", trusted, "X-Forwarded-For", map[string]string{"X-Forwarded-For": "[2001:db8::1]:443"}, "2001:db8::1"},
		{"missing header -> peer", trusted, "X-Forwarded-For", nil, "0.0.0.0"},
		{"single-value header", trusted, "CF-Connecting-IP", map[string]string{"CF-Connecting-IP": "198.51.100.2", "X-Forwarded-For": "1.2.3.4"}, "198.51.100.2"},
		{"single-value header invalid", trusted, "X-Real-IP", map[string]string{"X-Real-IP": "nope"}, "0.0.0.0"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := clientIPFor(t, tc.trusted, tc.header, tc.hdrs); got != tc.want {
				t.Fatalf("ClientIP = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestConfigureClientIP_RejectsInvalid(t *testing.T) {
	t.Cleanup(func() { clientIPConfig.Store(nil) })
	if err := ConfigureClientIP([]string{"10.0.0.0/33"}, "X-Forwarded-For"); err == nil {
		t.Fatal("expected error for invalid CIDR")
	}
	if err := ConfigureClientIP([]string{"not-an-ip"}, "X-Forwarded-For"); err == nil {
		t.Fatal("expected error for invalid IP")
	}
}

func TestTruncate_RuneBoundary(t *testing.T) {
	s := "abé" // é is 2 bytes
	if got := truncate(s, 3); got != "ab" {
		t.Fatalf("truncate split a rune: %q", got)
	}
	if got := truncate("abc", 5); got != "abc" {
		t.Fatalf("short string changed: %q", got)
	}
}

// A proxy that appends its own X-Forwarded-For line (HAProxy) leaves the
// client's forged line first; only reading every line finds the real hop.
func TestClientIP_MultipleHeaderLines(t *testing.T) {
	if err := ConfigureClientIP([]string{"0.0.0.0", "10.0.0.0/8"}, "X-Forwarded-For"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { clientIPConfig.Store(nil) })

	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(ClientIP(c)) })
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Add("X-Forwarded-For", "6.6.6.6")     // forged by the client
	req.Header.Add("X-Forwarded-For", "203.0.113.7") // appended by the proxy
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	b, _ := io.ReadAll(resp.Body)
	if got := string(b); got != "203.0.113.7" {
		t.Fatalf("ClientIP = %q, want 203.0.113.7 (forged first line believed)", got)
	}
}
