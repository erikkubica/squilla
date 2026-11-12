package cms

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Fingerprinting of asset references inside pages and theme CSS.
//
// Declared styles and scripts already get ?v=<hash> (theme_asset_version.go),
// but the images, fonts and SVGs a theme references from its templates and
// stylesheets were served bare, so browsers could cache them for an hour
// only. Here every /theme/assets/ URL in rendered HTML and every url() in a
// served theme stylesheet gets the referenced file's content hash, so all of
// them are immutable for a year and still change the moment the file does.
//
// A stylesheet's own ?v= covers its rewritten body, which embeds the hashes
// of the files it references: editing an image changes the image URL inside
// the CSS, which changes the CSS URL in the page.

// themeAssetRefRe matches a /theme/assets/ path with an extension, plus a
// query string when one is already present (those are left alone).
var themeAssetRefRe = regexp.MustCompile(`/theme/assets/[A-Za-z0-9_\-./%@+]+\.[A-Za-z0-9]{1,6}(\?[^"'\s)<>,]*)?`)

// cssURLRe matches url(...) in a stylesheet, quoted or not.
var cssURLRe = regexp.MustCompile(`url\(\s*(['"]?)([^'")\s]+)(['"]?)\s*\)`)

// VersionThemeAssetRefs adds ?v=<hash> to every bare /theme/assets/ URL in
// s whose file exists in the active theme. Safe to run on whole pages.
func VersionThemeAssetRefs(themeDir, s string) string {
	if themeDir == "" || !strings.Contains(s, themeAssetURLPrefix) {
		return s
	}
	return themeAssetRefRe.ReplaceAllStringFunc(s, func(m string) string {
		if strings.Contains(m, "?") {
			return m
		}
		return versionThemeAssetURL(themeDir, m)
	})
}

// VersionThemeAssetRefs on the registry uses the active theme's directory.
func (r *ThemeAssetRegistry) VersionThemeAssetRefs(s string) string {
	if r == nil {
		return s
	}
	r.mu.RLock()
	dir := r.themeDir
	r.mu.RUnlock()
	return VersionThemeAssetRefs(dir, s)
}

// rewriteThemeCSS versions the references in a stylesheet that lives at
// assets/<rel>. Absolute /theme/assets/ URLs and relative url()s that point
// at existing theme files both get ?v=<hash>. It also returns the asset
// files referenced, so the cache can tell when one of them changes.
func rewriteThemeCSS(themeDir, rel string, css []byte) ([]byte, []string) {
	assetsDir := filepath.Join(themeDir, "assets")
	var refs []string
	out := cssURLRe.ReplaceAllFunc(css, func(m []byte) []byte {
		sub := cssURLRe.FindSubmatch(m)
		if len(sub) < 4 || string(sub[1]) != string(sub[3]) {
			return m
		}
		ref := string(sub[2])
		if ref == "" || strings.ContainsAny(ref, "?") || strings.HasPrefix(ref, "data:") ||
			strings.HasPrefix(ref, "#") || strings.Contains(ref, "://") || strings.HasPrefix(ref, "//") {
			return m
		}
		frag := ""
		if i := strings.IndexByte(ref, '#'); i >= 0 {
			ref, frag = ref[:i], ref[i:]
		}
		var target string // path under assets/
		if strings.HasPrefix(ref, themeAssetURLPrefix) {
			target = strings.TrimPrefix(ref, themeAssetURLPrefix)
		} else if strings.HasPrefix(ref, "/") {
			return m
		} else {
			target = path.Join(path.Dir("/"+filepath.ToSlash(rel)), ref)[1:]
		}
		file := filepath.Join(assetsDir, filepath.FromSlash(path.Clean("/"+target)))
		hash := fingerprintFile(file)
		if hash == "" {
			return m
		}
		refs = append(refs, file)
		return []byte("url(" + string(sub[1]) + ref + "?v=" + hash + frag + string(sub[3]) + ")")
	})
	return out, refs
}

type themeCSSEntry struct {
	modTime time.Time
	size    int64
	refs    []string
	refsSig string
	body    []byte
	gz      []byte
	hash    string
}

var (
	themeCSSMu    sync.Mutex
	themeCSSCache = map[string]*themeCSSEntry{}
)

func refsSignature(refs []string) string {
	var b strings.Builder
	for _, f := range refs {
		b.WriteString(fingerprintFile(f))
		b.WriteByte(',')
	}
	return b.String()
}

// ThemeCSS returns a theme stylesheet (assets/<rel>) with its references
// versioned, the same body gzipped, and a hash of the body. ok is false
// when the file can't be read.
func ThemeCSS(themeDir, rel string) (body, gz []byte, hash string, ok bool) {
	// Confined: the body is served publicly, so a symlink in assets/ that
	// points outside the theme must not be followed.
	file, err := confinedFile(themeDir, filepath.Join("assets", filepath.FromSlash(path.Clean("/"+rel))))
	if err != nil {
		return nil, nil, "", false
	}
	info, err := os.Stat(file)
	if err != nil || info.IsDir() {
		return nil, nil, "", false
	}
	themeCSSMu.Lock()
	e := themeCSSCache[file]
	themeCSSMu.Unlock()
	if e != nil && e.size == info.Size() && e.modTime.Equal(info.ModTime()) && refsSignature(e.refs) == e.refsSig {
		return e.body, e.gz, e.hash, true
	}
	raw, err := os.ReadFile(file)
	if err != nil {
		return nil, nil, "", false
	}
	out, refs := rewriteThemeCSS(themeDir, rel, raw)
	sum := sha256.Sum256(out)
	var buf bytes.Buffer
	zw, _ := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	_, _ = zw.Write(out)
	_ = zw.Close()
	e = &themeCSSEntry{modTime: info.ModTime(), size: info.Size(), refs: refs, refsSig: refsSignature(refs),
		body: out, gz: buf.Bytes(), hash: hex.EncodeToString(sum[:])[:12]}
	themeCSSMu.Lock()
	themeCSSCache[file] = e
	themeCSSMu.Unlock()
	return e.body, e.gz, e.hash, true
}
