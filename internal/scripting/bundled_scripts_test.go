package scripting

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/d5/tengo/v2"

	"squilla/internal/coreapi"
)

// TestBundledTengoScriptsCompile compiles every .tengo file shipped in
// extensions/ and themes/. Tengo-only extensions have no Go build step, so
// without this a syntax error ships and only surfaces at runtime — the
// resend-provider handler used `result.error` (error is a keyword) and
// never ran in production.
func TestBundledTengoScriptsCompile(t *testing.T) {
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatal(err)
	}
	var files []string
	for _, dir := range []string{"extensions", "themes"} {
		_ = filepath.WalkDir(filepath.Join(root, dir), func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			if d.IsDir() && d.Name() == "node_modules" {
				return filepath.SkipDir
			}
			if !d.IsDir() && strings.HasSuffix(path, ".tengo") {
				files = append(files, path)
			}
			return nil
		})
	}
	if len(files) == 0 {
		t.Fatal("no bundled .tengo scripts found")
	}

	for _, path := range files {
		rel, _ := filepath.Rel(root, path)
		t.Run(rel, func(t *testing.T) {
			src, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			scriptsDir := scriptsRoot(path)
			s := tengo.NewScript(src)
			s.SetImports(coreapi.BuildTengoModules(nil, coreapi.CallerInfo{Type: "tengo"}, nil, scriptsDir, nil, nil))
			// Globals the engine injects into handler scripts.
			for _, name := range []string{"event", "request", "response", "value", "args"} {
				_ = s.Add(name, nil)
			}
			if _, err := s.Compile(); err != nil {
				t.Errorf("does not compile: %v", err)
			}
		})
	}
}

// scriptsRoot returns the enclosing scripts/ directory, which is what the
// engine resolves relative imports against.
func scriptsRoot(path string) string {
	dir := filepath.Dir(path)
	for d := dir; d != filepath.Dir(d); d = filepath.Dir(d) {
		if filepath.Base(d) == "scripts" {
			return d
		}
	}
	return dir
}
