package cms

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// This file owns small filesystem helpers used by the theme
// management service: zip extraction, manifest discovery, and
// recursive copy. Pure utilities, no DB access.

// Archive extraction limits shared by the theme and extension installers.
// The per-file cap stops a single zip bomb entry; the total and entry-count
// caps stop many small entries from filling the disk or inode table.
const (
	maxZipFileBytes   = 256 << 20
	maxZipTotalBytes  = 500 << 20
	maxZipEntries     = 10000
	zipExtractedPerms = 0o755
)

// zipBudget tracks bytes written across one archive extraction.
type zipBudget struct{ remaining int64 }

func newZipBudget() *zipBudget { return &zipBudget{remaining: maxZipTotalBytes} }

// checkZipArchive rejects archives with too many entries or with two
// entries that normalise to the same path. Duplicate names are dangerous
// because manifest discovery reads the FIRST extension.json/theme.json
// while extraction writes them in order, so the LAST copy wins on disk:
// the validated manifest would not be the one installed.
func checkZipArchive(r *zip.Reader) error {
	if len(r.File) > maxZipEntries {
		return fmt.Errorf("archive has %d entries (max %d)", len(r.File), maxZipEntries)
	}
	seen := make(map[string]bool, len(r.File))
	for _, f := range r.File {
		name := path.Clean("/" + strings.ReplaceAll(f.Name, "\\", "/"))
		if f.FileInfo().IsDir() {
			continue
		}
		if seen[name] {
			return fmt.Errorf("archive contains duplicate entry %q", f.Name)
		}
		seen[name] = true
	}
	return nil
}

// extractZipFile writes one archive entry to destPath. Archive mode bits
// are masked to 0755 so setuid/setgid/sticky bits (or world-writable
// files) in a hostile archive never reach the disk. budget, when non-nil,
// enforces the per-archive total size cap.
func extractZipFile(f *zip.File, destPath string, budget *zipBudget) error {
	rc, err := f.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode().Perm()&zipExtractedPerms)
	if err != nil {
		return err
	}
	defer out.Close()

	limit := int64(maxZipFileBytes)
	if budget != nil && budget.remaining < limit {
		limit = budget.remaining
	}
	// Read one byte past the limit so an over-cap entry is an error, not
	// a silently truncated file.
	n, err := io.Copy(out, io.LimitReader(rc, limit+1))
	if err != nil {
		return err
	}
	if n > limit {
		if budget != nil && limit == budget.remaining {
			return fmt.Errorf("archive exceeds total extracted size of %d bytes", maxZipTotalBytes)
		}
		return fmt.Errorf("entry exceeds maximum size of %d bytes", maxZipFileBytes)
	}
	if budget != nil {
		budget.remaining -= n
	}
	return nil
}

// findAndParseManifest looks for theme.json in dir or one level deep.
//
// Ambiguous-archive guard: when theme.json sits at the root, a sibling
// subdirectory whose name equals the manifest slug is rejected. Without this
// check, copyDir(tmpDir, stagingDir) in InstallFromZip would faithfully copy
// that sibling into themes/<slug>/<slug>/, baking a permanent nesting bug
// into the deploy. This was the root cause of curriculum-vitae shipping with
// themes/curriculum-vitae/curriculum-vitae/ on a live site — a polluted
// source tree got re-zipped, and the deploy had no defense.
func findAndParseManifest(dir string) (*themeMgmtManifest, string, error) {
	// Check root.
	rootManifest := filepath.Join(dir, "theme.json")
	if data, err := os.ReadFile(rootManifest); err == nil {
		var m themeMgmtManifest
		if err := json.Unmarshal(data, &m); err != nil {
			return nil, "", fmt.Errorf("failed to parse theme.json: %w", err)
		}
		if m.Slug != "" {
			nested := filepath.Join(dir, m.Slug)
			if info, statErr := os.Stat(nested); statErr == nil && info.IsDir() {
				return nil, "", fmt.Errorf(
					"ambiguous archive: theme.json at root declares slug %q but the archive also contains a sibling directory %q/ — this would deploy as themes/%s/%s/. Re-zip from a clean source tree or remove the duplicate wrapper directory before deploying",
					m.Slug, m.Slug, m.Slug, m.Slug,
				)
			}
		}
		return &m, dir, nil
	}

	// Check one level deep.
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read temp dir: %w", err)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		subManifest := filepath.Join(dir, entry.Name(), "theme.json")
		if data, err := os.ReadFile(subManifest); err == nil {
			var m themeMgmtManifest
			if err := json.Unmarshal(data, &m); err != nil {
				return nil, "", fmt.Errorf("failed to parse theme.json: %w", err)
			}
			return &m, filepath.Join(dir, entry.Name()), nil
		}
	}

	return nil, "", fmt.Errorf("theme.json not found in archive (checked root and one level deep)")
}

// copyDir recursively copies a directory tree from src to dst.
func copyDir(src, dst string) error {
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dst, srcInfo.Mode().Perm()&zipExtractedPerms|0o700); err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		// Symlinks and special files are skipped, never followed: copying
		// a link's target would materialise an arbitrary host file (e.g.
		// /etc/passwd) inside the theme as an ordinary, servable file.
		switch {
		case entry.Type()&os.ModeSymlink != 0:
			continue
		case entry.IsDir():
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		case entry.Type().IsRegular():
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}

	return nil
}

// copyFile copies a single file from src to dst.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	info, err := in.Stat()
	if err != nil {
		return err
	}

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, info.Mode().Perm()&zipExtractedPerms)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
