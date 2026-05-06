package cms

import "testing"

func TestCompileGlob(t *testing.T) {
	tests := []struct {
		glob    string
		path    string
		matches bool
	}{
		// Single-segment wildcard
		{"/forms/*", "/forms/1", true},
		{"/forms/*", "/forms/abc", true},
		{"/forms/*", "/forms/1/edit", false}, // * is single segment
		{"/forms/*", "/forms", false},
		{"/forms/*", "/forms/", false},

		// Multi-segment wildcard
		{"/forms/**", "/forms/1", true},
		{"/forms/**", "/forms/1/edit", true},
		{"/forms/**", "/forms/", true},
		{"/forms/**", "/forms", false}, // ** still requires the literal slash

		// Literal
		{"/forms", "/forms", true},
		{"/forms", "/forms/1", false},

		// Anchoring
		{"/forms", "/api/forms", false},

		// Regex metacharacters in pattern are escaped
		{"/forms.json", "/forms.json", true},
		{"/forms.json", "/formsXjson", false},
	}
	for _, tc := range tests {
		t.Run(tc.glob+"_vs_"+tc.path, func(t *testing.T) {
			re, err := compileGlob(tc.glob)
			if err != nil {
				t.Fatalf("compile %q: %v", tc.glob, err)
			}
			got := re.MatchString(tc.path)
			if got != tc.matches {
				t.Errorf("compileGlob(%q).Match(%q) = %v, want %v", tc.glob, tc.path, got, tc.matches)
			}
		})
	}
}

func TestAdminRouteRule_Matches_Method(t *testing.T) {
	rule := AdminRouteRule{Method: "POST"}
	rule.pattern, _ = compileGlob("/forms")

	if !rule.Matches("POST", "/forms") {
		t.Error("POST should match POST rule")
	}
	if rule.Matches("GET", "/forms") {
		t.Error("GET must not match POST rule")
	}

	any := AdminRouteRule{Method: "*"}
	any.pattern, _ = compileGlob("/forms")
	for _, m := range []string{"GET", "POST", "PUT", "DELETE", "PATCH"} {
		if !any.Matches(m, "/forms") {
			t.Errorf("'*' rule should accept %s", m)
		}
	}
}

func TestAdminRouteRegistry_FirstMatch(t *testing.T) {
	r := NewAdminRouteRegistry()
	rules := CompileAdminRoutes([]AdminRouteEntry{
		// Most specific first — first-rule-wins.
		{Method: "GET", Path: "/logs", RequiredCapability: "view_email_logs"},
		{Method: "GET", Path: "/logs/**", RequiredCapability: "view_email_logs"},
		{Method: "*", Path: "/templates", RequiredCapability: "manage_email"},
		{Method: "*", Path: "/templates/**", RequiredCapability: "manage_email"},
	})
	r.Set("email-manager", rules)

	cases := []struct {
		method, path string
		wantCap      string
	}{
		{"GET", "/logs", "view_email_logs"},
		{"GET", "/logs/123", "view_email_logs"},
		{"POST", "/templates", "manage_email"},
		{"DELETE", "/templates/42", "manage_email"},
		{"GET", "/somewhere-else", ""}, // no match → fall through (nil)
	}
	for _, tc := range cases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			got := r.FirstMatch("email-manager", tc.method, tc.path)
			if tc.wantCap == "" {
				if got != nil {
					t.Errorf("expected no match, got %+v", got)
				}
				return
			}
			if got == nil {
				t.Fatalf("expected match for %q, got nil", tc.path)
			}
			if got.RequiredCapability != tc.wantCap {
				t.Errorf("got cap %q, want %q", got.RequiredCapability, tc.wantCap)
			}
		})
	}
}

func TestAdminRouteRegistry_DropClearsRules(t *testing.T) {
	r := NewAdminRouteRegistry()
	r.Set("forms", CompileAdminRoutes([]AdminRouteEntry{
		{Method: "*", Path: "/forms", RequiredCapability: "manage_forms"},
	}))
	if r.FirstMatch("forms", "POST", "/forms") == nil {
		t.Fatal("rule should match before drop")
	}
	r.Drop("forms")
	if r.FirstMatch("forms", "POST", "/forms") != nil {
		t.Error("rule should not match after drop — extension is no longer active")
	}
}

func TestCompileAdminRoutes_DropsEmptyPath(t *testing.T) {
	// Manifest authors who accidentally leave a Path empty would otherwise
	// install a rule that matches every request (^$ regex); drop them
	// silently rather than poison the whole rule list.
	rules := CompileAdminRoutes([]AdminRouteEntry{
		{Method: "GET", Path: "", RequiredCapability: "x"},
		{Method: "GET", Path: "/ok", RequiredCapability: "y"},
	})
	if len(rules) != 1 {
		t.Fatalf("expected 1 surviving rule, got %d", len(rules))
	}
	if rules[0].RequiredCapability != "y" {
		t.Errorf("wrong rule kept: %+v", rules[0])
	}
}
