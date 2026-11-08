package cms

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
)

// BundledShadow describes an image-bundled copy of an extension or theme that
// is hidden because an operator-installed copy with the same slug lives in
// the data dir (data wins on slug collision).
//
// The two copies are compared by version AND content, because version
// strings are unreliable: an old data copy and a newer bundled build can
// both say "1.0.0" while shipping different routes, settings or binaries.
type BundledShadow struct {
	// Version and Path describe the bundled copy.
	Version string `json:"version"`
	Path    string `json:"path"`
	// InstalledVersion is the version of the data copy that is in use.
	InstalledVersion string `json:"installed_version"`
	// VersionCmp compares installed to bundled: -1 older, 0 same, 1 newer.
	VersionCmp int `json:"version_cmp"`
	// Differs is true when the manifests or the runtime files differ.
	Differs bool `json:"differs"`
	// Differences lists what differs: "version", "manifest", "files".
	Differences []string `json:"differences,omitempty"`
	// UpdateAvailable is true when the bundled copy differs and is not
	// older than the installed one — i.e. adopting it is an update, not a
	// downgrade of an intentionally newer operator install.
	UpdateAvailable bool `json:"update_available"`
}

// compareShadow fingerprints an installed (data) copy against a bundled copy.
// manifestName is "extension.json" or "theme.json"; include filters which
// files count as runtime content (relative, slash-separated paths).
func compareShadow(installedDir, bundledDir, manifestName string, include func(rel string) bool) (*BundledShadow, error) {
	instRaw, err := os.ReadFile(filepath.Join(installedDir, manifestName))
	if err != nil {
		return nil, err
	}
	bundRaw, err := os.ReadFile(filepath.Join(bundledDir, manifestName))
	if err != nil {
		return nil, err
	}
	instVer := manifestVersion(instRaw)
	bundVer := manifestVersion(bundRaw)

	out := &BundledShadow{
		Version:          bundVer,
		Path:             bundledDir,
		InstalledVersion: instVer,
		VersionCmp:       compareVersions(instVer, bundVer),
	}
	if instVer != bundVer {
		out.Differences = append(out.Differences, "version")
	}
	if normalizedJSONHash(instRaw) != normalizedJSONHash(bundRaw) {
		out.Differences = append(out.Differences, "manifest")
	}
	instFiles, err := treeFingerprint(installedDir, manifestName, include)
	if err != nil {
		return nil, err
	}
	bundFiles, err := treeFingerprint(bundledDir, manifestName, include)
	if err != nil {
		return nil, err
	}
	if instFiles != bundFiles {
		out.Differences = append(out.Differences, "files")
	}
	out.Differs = len(out.Differences) > 0
	out.UpdateAvailable = out.Differs && out.VersionCmp <= 0
	return out, nil
}

func manifestVersion(raw []byte) string {
	var m struct {
		Version string `json:"version"`
	}
	_ = json.Unmarshal(raw, &m)
	return strings.TrimSpace(m.Version)
}

// normalizedJSONHash hashes a JSON document independent of whitespace and
// key order (maps re-marshal with sorted keys). Invalid JSON hashes raw.
func normalizedJSONHash(raw []byte) string {
	var v any
	if err := json.Unmarshal(raw, &v); err == nil {
		if norm, err := json.Marshal(v); err == nil {
			raw = norm
		}
	}
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:])
}

// compareVersions compares dotted numeric versions ("1.2.10" > "1.2.9"),
// ignoring a leading "v" and any pre-release/build suffix. Non-numeric parts
// fall back to string comparison. Returns -1, 0 or 1.
func compareVersions(a, b string) int {
	norm := func(s string) []string {
		s = strings.TrimPrefix(strings.TrimSpace(s), "v")
		if i := strings.IndexAny(s, "-+"); i >= 0 {
			s = s[:i]
		}
		if s == "" {
			return nil
		}
		return strings.Split(s, ".")
	}
	pa, pb := norm(a), norm(b)
	for i := 0; i < len(pa) || i < len(pb); i++ {
		x, y := "0", "0"
		if i < len(pa) {
			x = pa[i]
		}
		if i < len(pb) {
			y = pb[i]
		}
		xi, errX := strconv.Atoi(x)
		yi, errY := strconv.Atoi(y)
		switch {
		case errX == nil && errY == nil:
			if xi != yi {
				if xi < yi {
					return -1
				}
				return 1
			}
		case x != y:
			if x < y {
				return -1
			}
			return 1
		}
	}
	return 0
}

// extensionRuntimeFile reports whether a file inside an extension directory
// is shipped runtime content. Source trees (Go plugin source, admin-ui src,
// node_modules) are excluded because the image carries them for the build
// while a deployed zip usually doesn't — counting them would flag every
// operator install as different.
func extensionRuntimeFile(rel string) bool {
	if !commonRuntimeFile(rel) {
		return false
	}
	first, rest, _ := strings.Cut(rel, "/")
	switch first {
	case "cmd", "internal", "pkg", "src", "proto":
		return false
	case "admin-ui":
		return strings.HasPrefix(rest, "dist/")
	}
	if strings.HasSuffix(rel, ".go") || rel == "go.mod" || rel == "go.sum" ||
		rel == "package.json" || rel == "package-lock.json" || rel == "Makefile" {
		return false
	}
	return true
}

// themeRuntimeFile: everything in a theme is runtime content except VCS and
// dependency directories and OS junk.
func themeRuntimeFile(rel string) bool {
	return commonRuntimeFile(rel)
}

func commonRuntimeFile(rel string) bool {
	for _, part := range strings.Split(rel, "/") {
		switch part {
		case ".git", "node_modules", ".DS_Store", "Thumbs.db":
			return false
		}
		if strings.HasSuffix(part, ".deploy.tmp") {
			return false
		}
	}
	return true
}

// fingerprintCache memoises tree hashes keyed by directory + a cheap stat
// signature (names, sizes, mtimes), so list endpoints that run on every admin
// page load re-hash file contents only after something on disk changed.
var fingerprintCache sync.Map // dir -> fingerprintEntry

type fingerprintEntry struct {
	stat string
	hash string
}

// treeFingerprint hashes the content of every included file under root,
// excluding the manifest itself (compared separately, normalized).
func treeFingerprint(root, manifestName string, include func(rel string) bool) (string, error) {
	type file struct {
		rel  string
		path string
		size int64
		mod  int64
	}
	var files []file
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if d.Name() == ".git" || d.Name() == "node_modules" {
				return filepath.SkipDir
			}
			return nil
		}
		if !d.Type().IsRegular() {
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		if rel == manifestName || !include(rel) {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		files = append(files, file{rel: rel, path: path, size: info.Size(), mod: info.ModTime().UnixNano()})
		return nil
	})
	if err != nil {
		return "", err
	}
	sort.Slice(files, func(i, j int) bool { return files[i].rel < files[j].rel })

	stat := sha256.New()
	for _, f := range files {
		fmt.Fprintf(stat, "%s\x00%d\x00%d\n", f.rel, f.size, f.mod)
	}
	statSig := hex.EncodeToString(stat.Sum(nil))
	key, _ := filepath.Abs(root)
	if cached, ok := fingerprintCache.Load(key); ok {
		if e := cached.(fingerprintEntry); e.stat == statSig {
			return e.hash, nil
		}
	}

	h := sha256.New()
	for _, f := range files {
		fh, err := os.Open(f.path)
		if err != nil {
			return "", err
		}
		content := sha256.New()
		_, err = io.Copy(content, fh)
		fh.Close()
		if err != nil {
			return "", err
		}
		fmt.Fprintf(h, "%s\x00%x\n", f.rel, content.Sum(nil))
	}
	sum := hex.EncodeToString(h.Sum(nil))
	fingerprintCache.Store(key, fingerprintEntry{stat: statSig, hash: sum})
	return sum, nil
}

// isUnderDir reports whether path lies strictly inside dir.
func isUnderDir(path, dir string) bool {
	if dir == "" || path == "" {
		return false
	}
	p, err1 := filepath.Abs(path)
	d, err2 := filepath.Abs(dir)
	if err1 != nil || err2 != nil {
		return false
	}
	return p != d && strings.HasPrefix(p, d+string(os.PathSeparator))
}
