package coreapi

import (
	"context"
	"os"
	"path/filepath"
	"strings"
)

// safeStoragePath validates that the resolved path stays within the storage
// directory. The check is done twice: lexically (no ".." escapes) and after
// resolving symlinks, so a symlink planted inside storage/ (e.g. by an
// extracted archive or another extension) can't redirect a write outside it.
// The returned path is the symlink-resolved one.
func safeStoragePath(path string) (string, error) {
	baseDir, _ := filepath.Abs("storage")
	cleanPath := filepath.Clean(filepath.Join(baseDir, path))
	if !pathWithin(baseDir, cleanPath) {
		return "", NewValidation("invalid file path: path traversal not allowed")
	}
	realBase, err := resolveExisting(baseDir)
	if err != nil {
		return "", NewInternal("resolve storage dir: " + err.Error())
	}
	realPath, err := resolveExisting(cleanPath)
	if err != nil {
		return "", NewValidation("invalid file path")
	}
	if !pathWithin(realBase, realPath) {
		return "", NewValidation("invalid file path: path escapes storage via a symlink")
	}
	return realPath, nil
}

// pathWithin reports whether p is base or inside it.
func pathWithin(base, p string) bool {
	return p == base || strings.HasPrefix(p, base+string(os.PathSeparator))
}

// resolveExisting resolves symlinks in the longest existing prefix of p
// and re-appends the components that don't exist yet.
func resolveExisting(p string) (string, error) {
	existing, rest := p, ""
	for {
		if _, err := os.Lstat(existing); err == nil {
			break
		}
		parent := filepath.Dir(existing)
		if parent == existing {
			break
		}
		rest = filepath.Join(filepath.Base(existing), rest)
		existing = parent
	}
	real, err := filepath.EvalSymlinks(existing)
	if err != nil {
		return "", err
	}
	if rest == "" {
		return real, nil
	}
	return filepath.Join(real, rest), nil
}

func (c *coreImpl) StoreFile(ctx context.Context, path string, data []byte) (string, error) {
	fullPath, err := safeStoragePath(path)
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", NewInternal("store file mkdir: " + err.Error())
	}
	if err := os.WriteFile(fullPath, data, 0644); err != nil {
		return "", NewInternal("store file write: " + err.Error())
	}
	return "/" + path, nil
}

func (c *coreImpl) DeleteFile(ctx context.Context, path string) error {
	fullPath, err := safeStoragePath(path)
	if err != nil {
		return err
	}
	if err := os.Remove(fullPath); err != nil {
		if os.IsNotExist(err) {
			return NewNotFound("file", path)
		}
		return NewInternal("delete file: " + err.Error())
	}
	return nil
}
