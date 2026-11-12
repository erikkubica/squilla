package cms

import (
	"strings"
	"testing"

	"squilla/internal/models"
	"squilla/internal/rendering"
)

func blockTestHandler(t *testing.T, types ...models.BlockType) *PublicHandler {
	t.Helper()
	h := &PublicHandler{
		renderer:         rendering.NewTemplateRenderer(t.TempDir(), true),
		blockTypes:       map[string]models.BlockType{},
		themeBlockCache:  map[string]string{},
		blockOutputCache: map[string]string{},
	}
	for _, bt := range types {
		h.blockTypes[bt.Slug] = bt
	}
	return h
}

// A textarea field piped through safeHTML in a block view must not be
// able to store script for every visitor.
func TestBlockSafeHTMLOnTextareaIsSanitised(t *testing.T) {
	h := blockTestHandler(t, models.BlockType{
		Slug:         "hero",
		Fields:       models.JSONB(`[{"name":"heading","type":"textarea"},{"name":"body","type":"richtext"}]`),
		HTMLTemplate: `<h1>{{ .heading | safeHTML }}</h1><div>{{ safeHTML .body }}</div><p>{{ raw .heading }}</p>`,
	})
	out := h.renderBlocksBatch([]map[string]interface{}{{
		"type": "hero",
		"fields": map[string]interface{}{
			"heading": `Eat, wander,<br><em>repeat</em><script>alert(1)</script><img src=x onerror="alert(2)">`,
			"body":    `<p>Rich <strong>text</strong></p><script>alert(3)</script>`,
		},
	}}, "en")
	if len(out) != 1 {
		t.Fatalf("rendered %d blocks", len(out))
	}
	html := out[0]
	for _, bad := range []string{"<script", "onerror", "alert("} {
		if strings.Contains(html, bad) {
			t.Errorf("rendered block contains %q: %s", bad, html)
		}
	}
	for _, good := range []string{"Eat, wander,<br><em>repeat</em>", "<p>Rich <strong>text</strong></p>"} {
		if !strings.Contains(html, good) {
			t.Errorf("rendered block lost %q: %s", good, html)
		}
	}
	// Richtext is sanitised once and passes through safeHTML unchanged,
	// not double-escaped.
	if strings.Contains(html, "&lt;p&gt;") {
		t.Errorf("richtext was double-escaped: %s", html)
	}
}

// Template errors are logged; the public page only gets a generic marker,
// never the error text (which can echo template source or field values).
func TestBlockRenderErrorIsGeneric(t *testing.T) {
	h := blockTestHandler(t, models.BlockType{
		Slug:         "broken",
		Fields:       models.JSONB(`[]`),
		HTMLTemplate: `{{ index .items 5 }}`,
	})
	out := h.renderBlocksBatch([]map[string]interface{}{{
		"type":   "broken",
		"fields": map[string]interface{}{"items": []interface{}{"secret-value"}},
	}}, "en")
	if len(out) != 1 {
		t.Fatalf("rendered %d blocks", len(out))
	}
	if out[0] != "<!-- block error: broken -->" {
		t.Errorf("error marker = %q", out[0])
	}
}
