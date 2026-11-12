package cms

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Theme asset fingerprinting. Declared theme styles/scripts are emitted
// as /theme/assets/<src>?v=<content-hash>; the /theme/assets handler
// serves any request carrying ?v= as immutable for a year (see
// ThemeAssetCacheControl). A changed file gets a new hash, so browsers
// pick it up on the next page view without ever revalidating the
// unchanged ones — on a high-latency link that removes a render-blocking
// round trip from every navigation.

const themeAssetURLPrefix = "/theme/assets/"

type assetFingerprint struct {
	modTime time.Time
	size    int64
	hash    string
}

var (
	assetFingerprintMu    sync.Mutex
	assetFingerprintCache = map[string]assetFingerprint{}
)

// fingerprintFile returns a short content hash for path, cached by
// (mtime, size) so the hot render path costs one stat per asset.
// Returns "" when the file can't be read.
func fingerprintFile(path string) string {
	info, err := os.Stat(path)
	if err != nil || !info.Mode().IsRegular() {
		return ""
	}
	assetFingerprintMu.Lock()
	cached, ok := assetFingerprintCache[path]
	assetFingerprintMu.Unlock()
	if ok && cached.size == info.Size() && cached.modTime.Equal(info.ModTime()) {
		return cached.hash
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	sum := sha256.Sum256(data)
	hash := hex.EncodeToString(sum[:])[:12]
	assetFingerprintMu.Lock()
	assetFingerprintCache[path] = assetFingerprint{modTime: info.ModTime(), size: info.Size(), hash: hash}
	assetFingerprintMu.Unlock()
	return hash
}

// versionThemeAssetURL appends ?v=<hash> to a /theme/assets/ URL whose
// file exists under themeDir/assets. Other URLs (CDNs, extension assets,
// URLs that already carry a query) pass through unchanged.
func versionThemeAssetURL(themeDir, url string) string {
	if themeDir == "" || !strings.HasPrefix(url, themeAssetURLPrefix) || strings.ContainsAny(url, "?#") {
		return url
	}
	rel := filepath.Clean("/" + strings.TrimPrefix(url, themeAssetURLPrefix))
	var hash string
	if strings.EqualFold(filepath.Ext(rel), ".css") {
		// A stylesheet is served rewritten (theme_asset_refs.go); its
		// version covers the files it references too.
		_, _, hash, _ = ThemeCSS(themeDir, rel)
	} else {
		hash = fingerprintFile(filepath.Join(themeDir, "assets", rel))
	}
	if hash == "" {
		return url
	}
	return url + "?v=" + hash
}

func versionThemeAssetURLs(themeDir string, urls []string) []string {
	out := make([]string, len(urls))
	for i, u := range urls {
		out[i] = versionThemeAssetURL(themeDir, u)
	}
	return out
}

// ThemeAssetCacheControl is the Cache-Control for a /theme/assets/ file.
// Fingerprinted URLs (?v=) are immutable. Bare URLs — fonts and images
// referenced from CSS, favicons, hand-written <link>s — get a short
// fresh window plus a long stale-while-revalidate, so repeat views never
// block on a revalidation while edits still propagate within an hour.
func ThemeAssetCacheControl(hasVersion bool) string {
	if hasVersion {
		return "public, max-age=31536000, immutable"
	}
	return "public, max-age=3600, stale-while-revalidate=604800"
}
