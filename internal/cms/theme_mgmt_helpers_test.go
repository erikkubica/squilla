package cms

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestFindAndParseManifest_RejectsAmbiguousNestedDir guards against the
// curriculum-vitae prod regression: a zip that contains theme.json at the
// root AND a sibling directory whose name matches the slug would silently
// deploy as themes/<slug>/<slug>/.
func TestFindAndParseManifest_RejectsAmbiguousNestedDir(t *testing.T) {
	dir := t.TempDir()

	manifest := `{"slug":"curriculum-vitae","name":"CV","version":"1.0.0"}`
	if err := os.WriteFile(filepath.Join(dir, "theme.json"), []byte(manifest), 0o644); err != nil {
		t.Fatalf("write root manifest: %v", err)
	}
	nested := filepath.Join(dir, "curriculum-vitae")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatalf("mkdir nested: %v", err)
	}
	if err := os.WriteFile(filepath.Join(nested, "theme.json"), []byte(manifest), 0o644); err != nil {
		t.Fatalf("write nested manifest: %v", err)
	}

	_, _, err := findAndParseManifest(dir)
	if err == nil {
		t.Fatal("expected ambiguous-archive error, got nil")
	}
	if !strings.Contains(err.Error(), "ambiguous archive") {
		t.Fatalf("expected ambiguous-archive error, got: %v", err)
	}
}

// Root-only layout keeps working.
func TestFindAndParseManifest_RootLayout(t *testing.T) {
	dir := t.TempDir()
	manifest := `{"slug":"squilla","name":"Squilla","version":"1.0.0"}`
	if err := os.WriteFile(filepath.Join(dir, "theme.json"), []byte(manifest), 0o644); err != nil {
		t.Fatalf("write manifest: %v", err)
	}

	m, mdir, err := findAndParseManifest(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m.Slug != "squilla" {
		t.Fatalf("slug: got %q", m.Slug)
	}
	if mdir != dir {
		t.Fatalf("manifestDir: got %q want %q", mdir, dir)
	}
}

// One-level-deep wrapper layout keeps working.
func TestFindAndParseManifest_WrapperLayout(t *testing.T) {
	dir := t.TempDir()
	wrap := filepath.Join(dir, "any-name")
	if err := os.MkdirAll(wrap, 0o755); err != nil {
		t.Fatalf("mkdir wrapper: %v", err)
	}
	manifest := `{"slug":"hello-vietnam","name":"Hello Vietnam","version":"1.0.0"}`
	if err := os.WriteFile(filepath.Join(wrap, "theme.json"), []byte(manifest), 0o644); err != nil {
		t.Fatalf("write manifest: %v", err)
	}

	m, mdir, err := findAndParseManifest(dir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m.Slug != "hello-vietnam" {
		t.Fatalf("slug: got %q", m.Slug)
	}
	if mdir != wrap {
		t.Fatalf("manifestDir: got %q want %q", mdir, wrap)
	}
}

// Sibling dir with a name unrelated to the slug must NOT trigger the guard
// (assets folders, screenshots, etc. are legitimate).
func TestFindAndParseManifest_UnrelatedSiblingDirAllowed(t *testing.T) {
	dir := t.TempDir()
	manifest := `{"slug":"curriculum-vitae","name":"CV","version":"1.0.0"}`
	if err := os.WriteFile(filepath.Join(dir, "theme.json"), []byte(manifest), 0o644); err != nil {
		t.Fatalf("write manifest: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0o755); err != nil {
		t.Fatalf("mkdir sibling: %v", err)
	}

	if _, _, err := findAndParseManifest(dir); err != nil {
		t.Fatalf("unexpected error for unrelated sibling: %v", err)
	}
}
