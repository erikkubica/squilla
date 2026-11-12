package coreapi

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestStoreFileRefusesSymlinkEscape(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	outside := filepath.Join(dir, "outside")
	if err := os.MkdirAll(filepath.Join(dir, "storage"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(outside, 0o755); err != nil {
		t.Fatal(err)
	}
	// A directory symlink and a file symlink inside storage/ that point out.
	if err := os.Symlink(outside, filepath.Join(dir, "storage", "evil")); err != nil {
		t.Skipf("symlinks unsupported: %v", err)
	}
	if err := os.Symlink(filepath.Join(outside, "target.txt"), filepath.Join(dir, "storage", "link.txt")); err != nil {
		t.Fatal(err)
	}

	c := &coreImpl{}
	ctx := context.Background()
	for _, p := range []string{"evil/x.txt", "evil/sub/x.txt", "link.txt", "../outside/y.txt"} {
		if _, err := c.StoreFile(ctx, p, []byte("pwn")); err == nil {
			t.Errorf("StoreFile(%q) succeeded", p)
		}
	}
	entries, _ := os.ReadDir(outside)
	if len(entries) != 0 {
		t.Errorf("files written outside storage: %v", entries)
	}
	if err := c.DeleteFile(ctx, "evil/x.txt"); err == nil {
		t.Error("DeleteFile through symlink succeeded")
	}

	// Ordinary nested writes still work.
	if url, err := c.StoreFile(ctx, "media/2026/11/a.txt", []byte("ok")); err != nil || url != "/media/2026/11/a.txt" {
		t.Fatalf("StoreFile normal path: %q %v", url, err)
	}
	if b, err := os.ReadFile(filepath.Join(dir, "storage", "media", "2026", "11", "a.txt")); err != nil || string(b) != "ok" {
		t.Errorf("stored content: %q %v", b, err)
	}
}
