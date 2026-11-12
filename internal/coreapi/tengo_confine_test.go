package coreapi

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/d5/tengo/v2"
)

// A symlink inside a theme/extension that points outside its root must not
// be loaded as a source module nor read through core/assets.
func TestTengoFileAccess_SymlinkOutsideRootRejected(t *testing.T) {
	outside := t.TempDir()
	secret := filepath.Join(outside, "secret.txt")
	if err := os.WriteFile(secret, []byte("TOP-SECRET"), 0o644); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	sd := filepath.Join(root, "scripts")
	if err := os.MkdirAll(sd, 0o755); err != nil {
		t.Fatal(err)
	}
	os.WriteFile(filepath.Join(sd, "good.tengo"), []byte(`export 1`), 0o644)
	os.WriteFile(filepath.Join(root, "layout.html"), []byte("<p>ok</p>"), 0o644)
	if err := os.Symlink(secret, filepath.Join(sd, "evil.tengo")); err != nil {
		t.Skipf("symlinks unsupported: %v", err)
	}
	if err := os.Symlink(secret, filepath.Join(root, "leak.html")); err != nil {
		t.Fatal(err)
	}

	mods := tengo.NewModuleMap()
	loadSourceModules(mods, sd)
	if mods.Get("./good") == nil {
		t.Fatal("in-root module must load")
	}
	if mods.Get("./evil") != nil {
		t.Fatal("symlinked module outside the root was loaded")
	}

	assets := assetsModule(sd)
	read := assets["read"].(*tengo.UserFunction)
	exists := assets["exists"].(*tengo.UserFunction)
	if v, _ := read.Value(&tengo.String{Value: "layout.html"}); v.(*tengo.String) == nil {
		t.Fatal("in-root asset must be readable")
	}
	v, _ := read.Value(&tengo.String{Value: "leak.html"})
	if s, ok := v.(*tengo.String); ok && s.Value == "TOP-SECRET" {
		t.Fatal("core/assets read followed a symlink outside the root")
	}
	if v, _ := exists.Value(&tengo.String{Value: "leak.html"}); v != tengo.FalseValue {
		t.Fatal("core/assets exists must be false for an escaping symlink")
	}
	if v, _ := exists.Value(&tengo.String{Value: "layout.html"}); v != tengo.TrueValue {
		t.Fatal("core/assets exists must be true for an in-root file")
	}
}
