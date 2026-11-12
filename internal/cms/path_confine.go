package cms

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// errPathEscape is returned when a theme/extension-relative path resolves
// (lexically or through a symlink) outside its base directory.
var errPathEscape = errors.New("path escapes its base directory")

// confinedPath resolves rel inside base and returns the real (symlink-free)
// absolute path, but only when it stays inside base's own real path.
//
// Theme and extension packages are untrusted input: a manifest can name
// "../../etc/passwd" as a layout file, and a git clone or zip can carry a
// symlink pointing anywhere on the host. A lexical filepath.Clean check
// alone misses the symlink case, so both the joined path and base are run
// through EvalSymlinks and compared with a separator-terminated prefix.
// A missing target returns an error wrapping os.ErrNotExist.
func confinedPath(base, rel string) (string, error) {
	baseAbs, err := filepath.Abs(base)
	if err != nil {
		return "", err
	}
	joined := filepath.Join(baseAbs, filepath.FromSlash(rel))
	if !pathWithin(joined, baseAbs) {
		return "", fmt.Errorf("%w: %s", errPathEscape, rel)
	}
	baseReal, err := filepath.EvalSymlinks(baseAbs)
	if err != nil {
		return "", err
	}
	real, err := filepath.EvalSymlinks(joined)
	if err != nil {
		return "", err
	}
	if !pathWithin(real, baseReal) {
		return "", fmt.Errorf("%w: %s", errPathEscape, rel)
	}
	return real, nil
}

// confinedFile is confinedPath restricted to regular files — devices,
// FIFOs, sockets and directories are rejected so a hostile package can't
// point a "file" at /dev/zero or a named pipe.
func confinedFile(base, rel string) (string, error) {
	real, err := confinedPath(base, rel)
	if err != nil {
		return "", err
	}
	info, err := os.Lstat(real)
	if err != nil {
		return "", err
	}
	if !info.Mode().IsRegular() {
		return "", fmt.Errorf("%w: %s is not a regular file", errPathEscape, rel)
	}
	return real, nil
}

// confinedDir is confinedPath restricted to directories.
func confinedDir(base, rel string) (string, error) {
	real, err := confinedPath(base, rel)
	if err != nil {
		return "", err
	}
	info, err := os.Lstat(real)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", fmt.Errorf("%w: %s is not a directory", errPathEscape, rel)
	}
	return real, nil
}

// ConfinedFile is the exported form of confinedFile for static-file routes
// outside this package (cmd/squilla static handlers).
func ConfinedFile(base, rel string) (string, error) { return confinedFile(base, rel) }

// ConfinedDir is the exported form of confinedDir.
func ConfinedDir(base, rel string) (string, error) { return confinedDir(base, rel) }

// readConfinedFile reads base/rel after confinedFile accepted it.
func readConfinedFile(base, rel string) ([]byte, error) {
	p, err := confinedFile(base, rel)
	if err != nil {
		return nil, err
	}
	return os.ReadFile(p)
}

// pathWithin reports whether p equals dir or lies inside it.
func pathWithin(p, dir string) bool {
	return p == dir || strings.HasPrefix(p, strings.TrimSuffix(dir, string(os.PathSeparator))+string(os.PathSeparator))
}
