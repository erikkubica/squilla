package auth

import "testing"

func TestCanonicalOrigin(t *testing.T) {
	cases := []struct {
		raw  string
		want string
	}{
		{"https://example.com", "https://example.com"},
		{"https://example.com/", "https://example.com"},
		{"https://example.com/admin/dashboard?foo=bar", "https://example.com"},
		{"http://localhost:8080/", "http://localhost:8080"},
		{"  https://example.com  ", "https://example.com"},
		// Reject anything that isn't a usable absolute URL — caller falls
		// back to the request-derived origin in those cases.
		{"", ""},
		{"example.com", ""},                  // no scheme
		{"javascript:alert(1)", ""},          // wrong scheme
		{"file:///etc/passwd", ""},           // wrong scheme
		{"not a url", ""},
	}
	for _, tc := range cases {
		if got := canonicalOrigin(tc.raw); got != tc.want {
			t.Errorf("canonicalOrigin(%q) = %q, want %q", tc.raw, got, tc.want)
		}
	}
}
