package main

import (
	"bytes"
	"encoding/json"
	"html/template"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestStarterTheme_ThemeJSON_Valid(t *testing.T) {
	manifestPath := filepath.Join("..", "..", "starter", "themes", "sample", "theme.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatalf("failed to read theme.json: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("theme.json is invalid JSON: %v", err)
	}

	if parsed["name"] != "Sample Theme" {
		t.Errorf("expected name 'Sample Theme', got %v", parsed["name"])
	}
}

func TestStarterTheme_Templates_ZeroEmptyTags(t *testing.T) {
	layoutPath := filepath.Join("..", "..", "starter", "themes", "sample", "layouts", "default.html")
	templatePath := filepath.Join("..", "..", "starter", "themes", "sample", "templates", "home.html")

	tmpl, err := template.ParseFiles(layoutPath, templatePath)
	if err != nil {
		t.Fatalf("failed to parse template files: %v", err)
	}

	t.Run("Populated Data Renders Heading and Paragraph", func(t *testing.T) {
		var buf bytes.Buffer
		data := map[string]interface{}{
			"node": map[string]interface{}{
				"title":         "My Amazing Site",
				"language_code": "en",
				"data": map[string]interface{}{
					"subtitle": "A custom description",
				},
			},
		}

		if err := tmpl.Execute(&buf, data); err != nil {
			t.Fatalf("template execution failed: %v", err)
		}

		out := buf.String()
		if !strings.Contains(out, "My Amazing Site") {
			t.Errorf("expected output to contain title 'My Amazing Site'")
		}
		if !strings.Contains(out, "<h1") {
			t.Errorf("expected <h1> tag when title is present")
		}
		if !strings.Contains(out, "A custom description") {
			t.Errorf("expected output to contain subtitle 'A custom description'")
		}
	})

	t.Run("Empty Data Emits ZERO Empty h1 and p Tags", func(t *testing.T) {
		var buf bytes.Buffer
		data := map[string]interface{}{
			"node": map[string]interface{}{
				"title":         "",
				"language_code": "en",
				"data":          map[string]interface{}{},
			},
		}

		if err := tmpl.Execute(&buf, data); err != nil {
			t.Fatalf("template execution failed: %v", err)
		}

		out := buf.String()
		if strings.Contains(out, "<h1") || strings.Contains(out, "</h1>") {
			t.Errorf("CRITICAL BUG: Empty title produced an empty <h1> tag in the DOM!")
		}
		if strings.Contains(out, "<p class=\"text-lg") {
			t.Errorf("CRITICAL BUG: Empty subtitle produced an empty <p> tag in the DOM!")
		}
	})
}
