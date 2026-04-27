package main

import "testing"

func TestIsSafeURL_AcceptsHTTPHTTPS(t *testing.T) {
	cases := []string{
		"https://example.com/policy",
		"http://example.com",
		"HTTPS://uppercase.tld",
		"//cdn.example.com",
		"/internal/policy",
		"./relative",
		"#anchor",
		"mailto:legal@example.com",
		"tel:+1-555-0100",
		"",
	}
	for _, u := range cases {
		if !isSafeURL(u) {
			t.Errorf("expected safe: %q", u)
		}
	}
}

func TestIsSafeURL_RejectsScriptSchemes(t *testing.T) {
	// These are the schemes a malicious form admin would smuggle into
	// privacy_policy_url to fire arbitrary JS on every visitor.
	cases := []string{
		"javascript:alert(1)",
		"JAVASCRIPT:alert(1)",
		"  javascript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:msgbox(1)",
		"file:///etc/passwd",
		"weird-scheme://x",
	}
	for _, u := range cases {
		if isSafeURL(u) {
			t.Errorf("must reject: %q", u)
		}
	}
}

func TestHTMLEscape_DoublesQuotesAndAngles(t *testing.T) {
	got := htmlescape(`"><script>alert(1)</script>`)
	want := `&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;`
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}
