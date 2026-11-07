package icons

import (
	"bytes"
	"html/template"
	"strings"
	"testing"
)

func TestTemplateFuncKnownLucide(t *testing.T) {
	out := string(TemplateFunc("lucide:map-pin"))
	for _, want := range []string{
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"`,
		`fill="none"`, `stroke="currentColor"`, `stroke-width="2"`,
		`aria-hidden="true"`, `<circle`, `</svg>`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("lucide:map-pin output missing %q:\n%s", want, out)
		}
	}
	if strings.Contains(out, "class=") {
		t.Errorf("no class requested but got one: %s", out)
	}
}

func TestTemplateFuncKnownMaterial(t *testing.T) {
	out := string(TemplateFunc("material:restaurant", "w-6", "h-6"))
	for _, want := range []string{`viewBox="0 -960 960 960"`, `fill="currentColor"`, `class="w-6 h-6"`, `<path d="`} {
		if !strings.Contains(out, want) {
			t.Errorf("material:restaurant output missing %q:\n%s", want, out)
		}
	}
	if strings.Contains(out, "stroke=") {
		t.Errorf("material icons must not carry stroke attrs: %s", out)
	}
}

func TestTemplateFuncUnknownAndEmpty(t *testing.T) {
	for _, v := range []any{
		nil, "", "   ", "lucide:", ":map-pin", "lucide:definitely-not-an-icon",
		"nope:map-pin", "javascript:alert(1)", 42, map[string]any{},
	} {
		if out := TemplateFunc(v, "x"); out != "" {
			t.Errorf("TemplateFunc(%#v) = %q, want empty", v, out)
		}
	}
}

func TestTemplateFuncBareLegacyNameIsMaterial(t *testing.T) {
	bare := TemplateFunc("restaurant")
	prefixed := TemplateFunc("material:restaurant")
	if bare == "" || bare != prefixed {
		t.Fatalf("bare legacy name should render as material:\nbare=%s\nprefixed=%s", bare, prefixed)
	}
	if ic, ok := Lookup(" restaurant "); !ok || ic.Value != "material:restaurant" {
		t.Fatalf("Lookup bare name = %+v, %v", ic, ok)
	}
}

func TestTemplateFuncEscapesClass(t *testing.T) {
	out := string(TemplateFunc("lucide:map-pin", `x" onload="alert(1)`, "<b>"))
	if strings.Contains(out, `onload="alert`) || strings.Contains(out, "<b>") {
		t.Fatalf("class attribute not escaped: %s", out)
	}
	if !strings.Contains(out, `class="x&#34; onload=&#34;alert(1) &lt;b&gt;"`) {
		t.Fatalf("unexpected class escaping: %s", out)
	}
}

func TestTemplateFuncInHTMLTemplate(t *testing.T) {
	tmpl := template.Must(template.New("t").Funcs(template.FuncMap{"icon": TemplateFunc}).
		Parse(`<span>{{ icon .v "icon" }}</span>{{ icon .missing }}`))
	var b bytes.Buffer
	if err := tmpl.Execute(&b, map[string]any{"v": "lucide:map-pin"}); err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(b.String(), `<span><svg `) || strings.Contains(b.String(), "&lt;svg") {
		t.Fatalf("icon output was escaped or missing: %s", b.String())
	}
}

func TestValidate(t *testing.T) {
	cases := []struct {
		value   string
		allowed []string
		ok      bool
	}{
		{"", nil, true},
		{"lucide:map-pin", nil, true},
		{"material:restaurant", nil, true},
		{"restaurant", nil, true},
		{"lucide:map-pin", []string{"lucide"}, true},
		{"material:restaurant", []string{"lucide"}, false},
		{"restaurant", []string{"lucide"}, false},
		{"lucide:nope-nope", nil, false},
		{"fa:map", nil, false},
	}
	for _, c := range cases {
		err := Validate(c.value, c.allowed)
		if (err == nil) != c.ok {
			t.Errorf("Validate(%q, %v) err=%v, want ok=%v", c.value, c.allowed, err, c.ok)
		}
	}
}

func TestSearch(t *testing.T) {
	res, err := Search("lucide", "map pin", 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	if res.Total == 0 || res.Icons[0].Name != "map-pin" {
		t.Fatalf("expected map-pin first, got %+v", res.Icons)
	}
	all, _ := Search("material", "", 1, 50)
	if all.Total < 3000 || len(all.Icons) != 50 {
		t.Fatalf("material listing: total=%d len=%d", all.Total, len(all.Icons))
	}
	if _, err := Search("nope", "", 1, 10); err == nil {
		t.Fatal("unknown provider should error")
	}
}

func TestProviders(t *testing.T) {
	ps := Providers()
	if len(ps) != 2 || ps[0].ID != "lucide" || ps[1].ID != "material" {
		t.Fatalf("providers = %+v", ps)
	}
	for _, p := range ps {
		if p.Count == 0 || p.License == "" || p.Version == "" {
			t.Errorf("incomplete provider metadata: %+v", p)
		}
	}
}
