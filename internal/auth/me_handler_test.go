package auth

import (
	"strings"
	"testing"
)

func TestValidateProfileEmail(t *testing.T) {
	tests := []struct {
		in      string
		want    string
		wantErr bool
	}{
		{"alice@example.com", "alice@example.com", false},
		{"  alice@example.com ", "alice@example.com", false},
		{"", "", true},
		{"alice", "", true},
		{"alice@localhost", "", true},
		{"Alice <alice@example.com>", "", true},
		{"a@b.c, d@e.f", "", true},
		{strings.Repeat("a", 250) + "@example.com", "", true},
	}
	for _, tc := range tests {
		got, msg := validateProfileEmail(tc.in)
		if (msg != "") != tc.wantErr {
			t.Errorf("validateProfileEmail(%q) msg=%q, wantErr=%v", tc.in, msg, tc.wantErr)
		}
		if !tc.wantErr && got != tc.want {
			t.Errorf("validateProfileEmail(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestValidateNewPassword(t *testing.T) {
	tests := []struct {
		in      string
		wantErr bool
	}{
		{"", true},
		{"short", true},
		{"12345678", false},
		{"pässwörd", false},
		{strings.Repeat("x", 72), false},
		{strings.Repeat("x", 73), true},
	}
	for _, tc := range tests {
		if msg := validateNewPassword(tc.in); (msg != "") != tc.wantErr {
			t.Errorf("validateNewPassword(len=%d) msg=%q, wantErr=%v", len(tc.in), msg, tc.wantErr)
		}
	}
}
