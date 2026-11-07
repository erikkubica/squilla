package cms

import (
	"bytes"
	"html/template"
	"testing"
)

func TestPreviewRequestData(t *testing.T) {
	h := &PublicHandler{db: archiveTestDB(t)}

	req := h.previewRequestData("", map[string]string{"page": "3", "q": "pho"})
	if req["page"] != 3 {
		t.Fatalf("page = %v, want 3", req["page"])
	}
	if q, _ := req["query"].(map[string]interface{}); q["q"] != "pho" {
		t.Fatalf("query = %v", req["query"])
	}
	if req["archive"] != nil {
		t.Fatalf("archive = %v, want nil", req["archive"])
	}

	// Bad or first-page values stay on page one.
	for _, v := range []string{"", "0", "-2", "abc", "1"} {
		if got := h.previewRequestData("/", map[string]string{"page": v})["page"]; got != 1 {
			t.Fatalf("page %q → %v, want 1", v, got)
		}
	}

	// A path that is not a term archive leaves archive empty.
	if got := h.previewRequestData("/about", nil)["archive"]; got != nil {
		t.Fatalf("non-archive path archive = %v", got)
	}
}

// Draft renders must never be stored in, or served from, the shared block
// output cache.
func TestPreviewRequestIsNotShareable(t *testing.T) {
	h := &PublicHandler{db: archiveTestDB(t)}
	if isDefaultRequest(h.previewRequestData("", nil)) {
		t.Fatal("preview request treated as shareable")
	}
	if !isDefaultRequest(emptyRequestData()) {
		t.Fatal("plain page-one request should stay shareable")
	}
}

// The block-type template preview must know the per-render helpers theme
// blocks use, or `function "themeSetting" not defined` aborts the parse.
func TestPreviewTemplateFuncs(t *testing.T) {
	h := &PublicHandler{db: archiveTestDB(t)}
	funcs := h.PreviewTemplateFuncs()
	for _, name := range []string{"themeSetting", "themeSettingsPage", "request", "node"} {
		if funcs[name] == nil {
			t.Fatalf("missing %q", name)
		}
	}
	tmpl, err := template.New("preview").Funcs(funcs).Parse(
		`{{ with themeSetting "header" "cta" }}{{ . }}{{ else }}none{{ end }}|{{ (request).page }}|{{ if node }}node{{ else }}no-node{{ end }}`)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, nil); err != nil {
		t.Fatalf("execute: %v", err)
	}
	if got, want := buf.String(), "none|1|no-node"; got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}
