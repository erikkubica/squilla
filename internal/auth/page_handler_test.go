package auth

import (
	"testing"

	"squilla/internal/models"
)

// TestPostAuthRedirectPath documents the contract that drives the
// "is the SPA shell allowed to open?" decision after login and
// registration. Members and any other admin_access:false role land on
// the public homepage; anyone with admin_access goes to the dashboard.
//
// This pairs with the /admin/* SPA gate (cmd/squilla/static_routes.go)
// and the /admin/api capability gate (cmd/squilla/main.go) — drift
// between any of these three is a security regression.
func TestPostAuthRedirectPath(t *testing.T) {
	tests := []struct {
		name string
		caps string
		want string
	}{
		{
			name: "admin role gets dashboard",
			caps: `{"admin_access":true}`,
			want: "/admin/dashboard",
		},
		{
			name: "editor with admin_access gets dashboard",
			caps: `{"admin_access":true,"manage_users":false}`,
			want: "/admin/dashboard",
		},
		{
			name: "member without admin_access goes home",
			caps: `{"admin_access":false,"default_node_access":{"access":"read","scope":"all"}}`,
			want: "/",
		},
		{
			name: "missing capability key defaults closed",
			caps: `{}`,
			want: "/",
		},
		{
			name: "malformed JSON defaults closed",
			caps: `not-json`,
			want: "/",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			user := &models.User{Role: models.Role{Capabilities: models.JSONB(tc.caps)}}
			got := postAuthRedirectPath(user)
			if got != tc.want {
				t.Fatalf("postAuthRedirectPath(%s) = %q, want %q", tc.caps, got, tc.want)
			}
		})
	}
}
