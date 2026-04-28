package main

import "testing"

func TestNormalizeCORSOrigins(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "bare hostname gets https scheme",
			in:   "hello-vietnam-demo.erik-kubica.dev",
			want: "https://hello-vietnam-demo.erik-kubica.dev",
		},
		{
			name: "explicit https passes through",
			in:   "https://example.com",
			want: "https://example.com",
		},
		{
			name: "explicit http passes through",
			in:   "http://localhost:8099",
			want: "http://localhost:8099",
		},
		{
			name: "trailing slash stripped",
			in:   "https://example.com/",
			want: "https://example.com",
		},
		{
			name: "comma list mixed",
			in:   "example.com, https://other.io/, http://localhost:3000",
			want: "https://example.com,https://other.io,http://localhost:3000",
		},
		{
			name: "wildcard preserved",
			in:   "*",
			want: "*",
		},
		{
			name: "null origin preserved",
			in:   "null",
			want: "null",
		},
		{
			name: "blank entries dropped",
			in:   ",, https://a.com,,",
			want: "https://a.com",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeCORSOrigins(tc.in)
			if got != tc.want {
				t.Errorf("normalizeCORSOrigins(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}
