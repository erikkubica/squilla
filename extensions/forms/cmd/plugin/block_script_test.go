package main

import (
	"os"
	"strings"
	"testing"
)

// The public form script must not write the admin-configured success
// message as HTML or follow a redirect_url without a scheme check
// (javascript: would run on the site origin).
func TestVibeFormScriptSuccessAndRedirectAreSafe(t *testing.T) {
	src, err := os.ReadFile("../../blocks/vibe-form/script.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(src)
	for _, bad := range []string{
		`+ successMsg +`,
		`window.location = formSettings.redirect_url`,
	} {
		if strings.Contains(js, bad) {
			t.Errorf("script.js still contains %q", bad)
		}
	}
	for _, good := range []string{
		`msgEl.textContent = String(successMsg)`,
		`vibeFormSafeRedirect(formSettings.redirect_url)`,
		`parsed.protocol === "http:" || parsed.protocol === "https:"`,
	} {
		if !strings.Contains(js, good) {
			t.Errorf("script.js is missing %q", good)
		}
	}
}
