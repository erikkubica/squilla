package main

import (
	"os"
	"path/filepath"
	"testing"
)

func touch(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// Every cached copy the public routes serve must go when its original
// changes or is deleted, including the full-size WebP under _webp/.
func TestRemoveCachedCopiesClearsEveryCopy(t *testing.T) {
	p := &MediaManagerPlugin{storageDir: t.TempDir()}
	base := filepath.Join(p.storageDir, "cache", "images")

	// The on-disk layout written by handlePublicCacheRequest and
	// handlePublicMediaRequest.
	gone := []string{
		filepath.Join(base, "thumbnail", "2026/11/photo.jpg"),
		filepath.Join(base, "thumbnail", "2026/11/photo.webp"),
		filepath.Join(base, "large", "2026/11/photo.jpg"),
		filepath.Join(base, "large", "2026/11/photo.webp"),
		filepath.Join(base, "_webp", "2026/11/photo.jpg.webp"),
	}
	kept := []string{
		filepath.Join(base, "thumbnail", "2026/11/other.jpg"),
		filepath.Join(base, "_webp", "2026/11/other.jpg.webp"),
	}
	for _, f := range append(append([]string{}, gone...), kept...) {
		touch(t, f)
	}

	p.removeCachedCopies([]string{"media/2026/11/photo.jpg"}, []string{"thumbnail", "large"})

	for _, f := range gone {
		if exists(f) {
			t.Errorf("still cached: %s", f)
		}
	}
	for _, f := range kept {
		if !exists(f) {
			t.Errorf("removed another original's copy: %s", f)
		}
	}
}

// Without the size list (lookup failed) the full-size WebP still goes.
func TestRemoveCachedCopiesWithoutSizes(t *testing.T) {
	p := &MediaManagerPlugin{storageDir: t.TempDir()}
	webp := p.cacheFullWebPPath("theme/bv/hero.jpg")
	touch(t, webp)

	p.removeCachedCopies([]string{"media/theme/bv/hero.jpg"}, nil)

	if exists(webp) {
		t.Errorf("full-size WebP still cached: %s", webp)
	}
}

func TestRemoveCachedCopiesIgnoresTraversal(t *testing.T) {
	p := &MediaManagerPlugin{storageDir: t.TempDir()}
	outside := filepath.Join(p.storageDir, "media", "keep.jpg")
	touch(t, outside)

	p.removeCachedCopies([]string{"media/../../../media/keep.jpg"}, []string{"..", "thumbnail"})

	if !exists(outside) {
		t.Fatal("removed a file outside the cache")
	}
}

func TestSizeCacheDir(t *testing.T) {
	p := &MediaManagerPlugin{storageDir: "storage"}
	if dir, ok := p.sizeCacheDir("thumbnail"); !ok || dir != filepath.Join("storage", "cache", "images", "thumbnail") {
		t.Errorf("thumbnail: got %q, %v", dir, ok)
	}
	for _, name := range []string{"", ".", "..", "../media", "a/b", `a\b`, "x..y"} {
		if _, ok := p.sizeCacheDir(name); ok {
			t.Errorf("%q should be rejected", name)
		}
	}
}
