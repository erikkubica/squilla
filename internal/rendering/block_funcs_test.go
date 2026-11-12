package rendering

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"golang.org/x/net/html"

	"squilla/internal/sanitize"
)

const hostile = `<script>alert("XSS1")</script><img src=x onerror=alert("XSS2")><a href="javascript:alert('XSS3')">l</a><svg onload=alert("XSS4")>`

// executablePayloads parses rendered HTML the way a browser would and
// reports any part of the hostile payload that became live markup: a
// script element carrying it, an event-handler attribute carrying it, or
// a javascript: URL. Escaped text is fine.
func executablePayloads(out string) []string {
	var problems []string
	doc, err := html.Parse(strings.NewReader(out))
	if err != nil {
		return []string{"unparseable output: " + err.Error()}
	}
	var walk func(n *html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode {
			if n.Data == "script" {
				var text strings.Builder
				for c := n.FirstChild; c != nil; c = c.NextSibling {
					text.WriteString(c.Data)
				}
				if strings.Contains(text.String(), "alert(\"XSS") {
					problems = append(problems, "live <script> with payload")
				}
			}
			for _, a := range n.Attr {
				key := strings.ToLower(a.Key)
				val := strings.ToLower(strings.Join(strings.Fields(a.Val), ""))
				if strings.HasPrefix(key, "on") && strings.Contains(a.Val, "XSS") {
					problems = append(problems, fmt.Sprintf("live %s=%q on <%s>", a.Key, a.Val, n.Data))
				}
				switch key {
				case "href", "src", "action", "formaction", "xlink:href", "poster", "data":
					if strings.HasPrefix(val, "javascript:") {
						problems = append(problems, fmt.Sprintf("javascript: URL in %s on <%s>", a.Key, n.Data))
					}
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)
	return problems
}

func renderBlock(t *testing.T, r *TemplateRenderer, name, src string, data map[string]interface{}) (string, error) {
	t.Helper()
	funcs := BlockFuncOverrides()
	funcs["request"] = func() map[string]interface{} {
		return map[string]interface{}{"path": "/", "page": 1, "query": map[string]interface{}{}}
	}
	funcs["node"] = func() map[string]interface{} { return nil }
	undefined := regexp.MustCompile(`function "([^"]+)" not defined`)
	for i := 0; i < 20; i++ {
		var buf bytes.Buffer
		err := r.RenderParsed(&buf, name, src, data, funcs)
		if err != nil {
			if m := undefined.FindStringSubmatch(err.Error()); m != nil {
				// Per-render helpers the public handler adds (themeSetting, …).
				funcs[m[1]] = func(args ...interface{}) interface{} { return "" }
				continue
			}
		}
		return buf.String(), err
	}
	return "", fmt.Errorf("too many undefined functions")
}

func TestBlockSafeHTMLSanitisesPlainStrings(t *testing.T) {
	r := NewTemplateRenderer(t.TempDir(), true)
	src := `<h2>{{ safeHTML .heading }}</h2><p>{{ .sub | raw }}</p><div>{{ safeHTML .body }}</div>`
	out, err := renderBlock(t, r, "t", src, map[string]interface{}{
		"heading": `Eat, wander, &amp;<br><em>repeat</em><script>alert(1)</script>`,
		"sub":     `<strong>Mon–Sat:</strong> 9am <img src=x onerror="alert(2)">`,
		// A richtext field the kernel already sanitised and marked HTML.
		"body": template.HTML(`<p>trusted <a href="/x">link</a></p>`),
	})
	if err != nil {
		t.Fatal(err)
	}
	for _, bad := range []string{"<script", "alert(1)", "onerror", "alert(2)"} {
		if strings.Contains(out, bad) {
			t.Errorf("output contains %q: %s", bad, out)
		}
	}
	for _, good := range []string{"Eat, wander, &amp;<br><em>repeat</em>", "<strong>Mon–Sat:</strong> 9am", `<p>trusted <a href="/x">link</a></p>`} {
		if !strings.Contains(out, good) {
			t.Errorf("output lost %q: %s", good, out)
		}
	}
}

func TestBlockSafeURLRefusesScriptSchemes(t *testing.T) {
	for in, want := range map[string]template.URL{
		"javascript:alert(1)":     "#",
		" JaVa\tScript:alert(1)":  "#",
		"vbscript:x":              "#",
		"data:text/html,<b>":      "#",
		"data:image/png;base64,A": "data:image/png;base64,A",
		"/media/a.jpg":            "/media/a.jpg",
		"https://example.com/":    "https://example.com/",
		"theme-asset:logo":        "theme-asset:logo",
	} {
		if got := SafeURLValue(in); got != want {
			t.Errorf("SafeURLValue(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSeqIsCapped(t *testing.T) {
	if n := len(Seq(1e9)); n != MaxSeq {
		t.Errorf("seq(1e9) len = %d", n)
	}
	if n := len(Seq(3.0)); n != 3 {
		t.Errorf("seq(3) len = %d", n)
	}
	if Seq(-1) != nil {
		t.Error("seq(-1) should be nil")
	}
}

type blockField struct {
	Name      string       `json:"name"`
	Key       string       `json:"key"`
	Type      string       `json:"type"`
	Fields    []blockField `json:"fields"`
	SubFields []blockField `json:"sub_fields"`
}

func hostileValue(f blockField, depth int) interface{} {
	switch f.Type {
	case "richtext":
		// What markRichTextFields hands the template.
		return template.HTML(sanitize.RichText(hostile))
	case "image":
		return map[string]interface{}{"url": "javascript:alert('XSS3')", "alt": hostile, "width": 10, "height": 10}
	case "link":
		return map[string]interface{}{"url": "javascript:alert('XSS3')", "text": hostile, "target": hostile, "alt": hostile}
	case "number":
		return 3.0
	case "toggle", "checkbox":
		return true
	case "array", "repeater":
		if depth > 3 {
			return []interface{}{}
		}
		row := hostileFields(append(append([]blockField{}, f.Fields...), f.SubFields...), depth+1)
		return []interface{}{row, row}
	case "object", "group":
		return hostileFields(append(append([]blockField{}, f.Fields...), f.SubFields...), depth+1)
	default:
		return hostile
	}
}

func hostileFields(defs []blockField, depth int) map[string]interface{} {
	out := map[string]interface{}{}
	for _, d := range defs {
		name := d.Name
		if name == "" {
			name = d.Key
		}
		if name == "" {
			continue
		}
		out[name] = hostileValue(d, depth)
	}
	return out
}

// Every bundled block view rendered with hostile values in every field
// must not emit an executable payload, whichever helpers it pipes the
// fields through.
func TestBundledBlocksDoNotEmitHostileMarkup(t *testing.T) {
	var dirs []string
	for _, pattern := range []string{"../../themes/*/blocks/*", "../../extensions/*/blocks/*", "../../starter/themes/*/blocks/*"} {
		m, _ := filepath.Glob(pattern)
		dirs = append(dirs, m...)
	}
	if len(dirs) < 50 {
		t.Fatalf("found only %d bundled blocks", len(dirs))
	}
	r := NewTemplateRenderer(t.TempDir(), true)
	checked := 0
	for _, dir := range dirs {
		view, err := os.ReadFile(filepath.Join(dir, "view.html"))
		if err != nil {
			continue
		}
		var def struct {
			Fields []blockField `json:"fields"`
		}
		if raw, err := os.ReadFile(filepath.Join(dir, "block.json")); err == nil {
			_ = json.Unmarshal(raw, &def)
		}
		data := hostileFields(def.Fields, 0)
		out, err := renderBlock(t, r, dir, string(view), data)
		if err != nil {
			// Partial output is still checked; shape mismatches between the
			// generic hostile data and a block's expectations are not what
			// this test is about.
			t.Logf("%s: render error (output still checked): %v", dir, err)
		}
		for _, problem := range executablePayloads(out) {
			t.Errorf("%s: %s", dir, problem)
		}
		checked++
	}
	t.Logf("checked %d block views", checked)
}
