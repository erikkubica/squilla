package main

import (
	"bytes"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"image"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"testing"

	pb "squilla/pkg/plugin/proto"
)

func tinyPNG(t *testing.T) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

// pngClaiming returns a valid PNG whose IHDR claims w x h (CRC fixed up),
// i.e. a decompression bomb header.
func pngClaiming(t *testing.T, w, h uint32) []byte {
	t.Helper()
	data := tinyPNG(t)
	// 8-byte signature, 4-byte length, "IHDR", then width/height.
	binary.BigEndian.PutUint32(data[16:20], w)
	binary.BigEndian.PutUint32(data[20:24], h)
	crc := crc32.ChecksumIEEE(data[12:29])
	binary.BigEndian.PutUint32(data[29:33], crc)
	return data
}

func TestValidateUploadRejectsHTMLDeclaredAsImage(t *testing.T) {
	html := []byte("<!DOCTYPE html><html><body><script>alert(document.cookie)</script></body></html>")
	for _, declared := range []string{"image/png", "image/jpeg", "text/plain", "application/pdf", "", "text/html"} {
		if _, _, resp := validateUpload(html, declared, "x.png"); resp == nil {
			t.Errorf("HTML body declared %q was accepted", declared)
		}
	}
}

func TestValidateUploadAcceptsRealFiles(t *testing.T) {
	cases := []struct {
		data     []byte
		declared string
		name     string
	}{
		{tinyPNG(t), "image/png", "a.png"},
		{tinyPNG(t), "", "a.png"},
		{[]byte("%PDF-1.7\n..."), "application/pdf", "a.pdf"},
		{[]byte("name,age\nbob,3\n"), "text/csv", "a.csv"},
		{[]byte("PK\x03\x04rest-of-zip"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "a.docx"},
	}
	for _, c := range cases {
		if _, _, resp := validateUpload(c.data, c.declared, c.name); resp != nil {
			t.Errorf("%s (%q) rejected: %s", c.name, c.declared, resp.Body)
		}
	}
}

func TestValidateUploadSanitisesSVG(t *testing.T) {
	svg := `<?xml version="1.0"?>
<!DOCTYPE svg [<!ENTITY x "boom">]>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)" viewBox="0 0 10 10">
  <script>alert(2)</script>
  <style>.a{fill:url(#g)}</style>
  <linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient>
  <a xlink:href="javascript:alert(3)"><rect width="5" height="5"/></a>
  <foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(4)"/></body></foreignObject>
  <use xlink:href="#g"/>
  <use href="https://evil.example/x.svg#a"/>
  <rect class="a" width="10" height="10" onclick="alert(5)" style="fill:url(javascript:alert(6))"/>
  <set attributeName="href" to="javascript:alert(7)"/>
  <circle r="3" fill="url(#g)"/>
</svg>`
	clean, mimeType, resp := validateUpload([]byte(svg), "image/svg+xml", "logo.svg")
	if resp != nil {
		t.Fatalf("SVG rejected: %s", resp.Body)
	}
	if mimeType != "image/svg+xml" {
		t.Fatalf("mime = %q", mimeType)
	}
	out := strings.ToLower(string(clean))
	for _, bad := range []string{"<script", "onload", "onclick", "onerror", "javascript:", "foreignobject", "evil.example", "<set", "<!doctype", "<a "} {
		if strings.Contains(out, bad) {
			t.Errorf("sanitised SVG still contains %q:\n%s", bad, clean)
		}
	}
	for _, good := range []string{"<svg", `viewbox="0 0 10 10"`, ".a{fill:url(#g)}", `<use xlink:href="#g">`, `<circle r="3" fill="url(#g)">`, "lineargradient"} {
		if !strings.Contains(out, strings.ToLower(good)) {
			t.Errorf("sanitised SVG lost %q:\n%s", good, clean)
		}
	}
	// Output must still be a parseable SVG.
	if _, err := sanitizeSVG(clean); err != nil {
		t.Errorf("sanitised output does not re-parse: %v", err)
	}
}

func TestValidateUploadRejectsNonSVGDeclaredSVG(t *testing.T) {
	for _, body := range []string{
		"<html><script>alert(1)</script></html>",
		"not xml at all",
		`<svg xmlns="http://www.w3.org/2000/svg"><rect></svg>`,
	} {
		if _, _, resp := validateUpload([]byte(body), "image/svg+xml", "x.svg"); resp == nil {
			t.Errorf("accepted %q as SVG", body)
		}
	}
	// An .svg file without a usable declared type still goes through the
	// sanitiser rather than the generic path.
	if _, m, resp := validateUpload([]byte(`<svg xmlns="http://www.w3.org/2000/svg"/>`), "", "x.svg"); resp != nil || m != "image/svg+xml" {
		t.Errorf("unlabelled svg: mime=%q resp=%v", m, resp)
	}
}

func TestSafeExtensionNeverReturnsActiveContent(t *testing.T) {
	active := map[string]bool{".html": true, ".htm": true, ".xhtml": true, ".xml": true, ".js": true, ".mjs": true,
		".svg": true, ".shtml": true, ".php": true, ".xht": true, ".svgz": true, ".swf": true}
	mimes := []string{"image/x-foo", "image/vnd.microsoft.icon", "video/x-foo", "audio/x-foo", "application/msword", "text/markdown", "", "application/octet-stream"}
	names := []string{"evil.html", "evil.HTM", "evil.xhtml", "evil.xml", "evil.js", "evil.svg", "evil.shtml", "evil.php", "evil.svgz"}
	for _, m := range mimes {
		for _, n := range names {
			if ext := safeExtension(m, n); active[ext] {
				t.Errorf("safeExtension(%q, %q) = %q", m, n, ext)
			}
		}
	}
	if got := safeExtension("image/svg+xml", "logo.svg"); got != ".svg" {
		t.Errorf("svg mime -> %q, want .svg", got)
	}
	if got := safeExtension("application/msword", "spec.doc"); got != ".doc" {
		t.Errorf("doc -> %q, want .doc", got)
	}
}

func servePublic(t *testing.T, rel string, body []byte) *pb.PluginHTTPResponse {
	t.Helper()
	dir := t.TempDir()
	t.Chdir(dir)
	full := filepath.Join(dir, "storage", "media", rel)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(full, body, 0o644); err != nil {
		t.Fatal(err)
	}
	p := &MediaManagerPlugin{storageDir: filepath.Join(dir, "storage")}
	resp, err := p.handlePublicMediaRequest(t.Context(), &pb.PluginHTTPRequest{Path: "/media/" + rel, Headers: map[string]string{}})
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func TestServedSVGCarriesSandboxCSP(t *testing.T) {
	resp := servePublic(t, "2026/11/logo.svg", []byte(`<svg xmlns="http://www.w3.org/2000/svg"/>`))
	if resp.StatusCode != 200 {
		t.Fatalf("status %d", resp.StatusCode)
	}
	h := resp.Headers
	if h["Content-Security-Policy"] != sandboxCSP {
		t.Errorf("CSP = %q", h["Content-Security-Policy"])
	}
	if h["X-Content-Type-Options"] != "nosniff" {
		t.Errorf("nosniff missing")
	}
	if h["Content-Type"] != "image/svg+xml" {
		t.Errorf("content-type = %q", h["Content-Type"])
	}
	if _, ok := h["Content-Disposition"]; ok {
		t.Errorf("svg should stay inline")
	}
}

func TestServedDocumentIsAttachment(t *testing.T) {
	for _, rel := range []string{"2026/11/notes.txt", "2026/11/blob.bin", "2026/11/old.html"} {
		resp := servePublic(t, rel, []byte("<script>alert(1)</script>"))
		h := resp.Headers
		if h["Content-Disposition"] != "attachment" || h["Content-Security-Policy"] != sandboxCSP || h["X-Content-Type-Options"] != "nosniff" {
			t.Errorf("%s headers = %v", rel, h)
		}
	}
	resp := servePublic(t, "2026/11/clip.mp4", []byte("....ftypmp42"))
	if _, ok := resp.Headers["Content-Disposition"]; ok || resp.Headers["X-Content-Type-Options"] != "nosniff" {
		t.Errorf("mp4 headers = %v", resp.Headers)
	}
}

func TestOriginalsAreNotPublic(t *testing.T) {
	for _, rel := range []string{"originals/2026/11/123.jpg", "originals/2026/11/123.pdf", "./originals/2026/11/123.jpg"} {
		resp := servePublic(t, rel, tinyPNG(t))
		if resp.StatusCode != 404 {
			t.Errorf("%s served with status %d", rel, resp.StatusCode)
		}
	}
	p := &MediaManagerPlugin{storageDir: t.TempDir()}
	resp, _ := p.handlePublicCacheRequest(t.Context(), &pb.PluginHTTPRequest{Path: "/media/cache/thumbnail/originals/2026/11/1.jpg"})
	if resp.StatusCode != 404 {
		t.Errorf("cache route served an original: %d", resp.StatusCode)
	}
}

func TestDecompressionBombRejected(t *testing.T) {
	bomb := pngClaiming(t, 60000, 60000)
	if err := checkImageDimensions(bomb); !errors.Is(err, errImageTooLarge) {
		t.Fatalf("checkImageDimensions = %v", err)
	}
	if err := checkImageDimensions(pngClaiming(t, 8000, 7000)); !errors.Is(err, errImageTooLarge) {
		t.Errorf("56 MP image accepted")
	}
	if err := checkImageDimensions(pngClaiming(t, 25000, 10)); !errors.Is(err, errImageTooLarge) {
		t.Errorf("25000 px side accepted")
	}
	if err := checkImageDimensions(tinyPNG(t)); err != nil {
		t.Errorf("small image rejected: %v", err)
	}
	if _, err := convertToWebP(bytes.NewReader(bomb), 75); !errors.Is(err, errImageTooLarge) {
		t.Errorf("convertToWebP = %v", err)
	}
	if _, _, err := resizeImage(bytes.NewReader(bomb), "image/png", 100, 100, "fit", 80); !errors.Is(err, errImageTooLarge) {
		t.Errorf("resizeImage = %v", err)
	}
}

func TestConversionFailuresAreBounded(t *testing.T) {
	p := &MediaManagerPlugin{}
	p.markConversionFailed("a")
	if !p.conversionFailed("a") || p.conversionFailed("b") {
		t.Fatal("negative cache lookup wrong")
	}
	for i := 0; i < maxFailedConversions+5; i++ {
		p.markConversionFailed(strings.Repeat("x", i%50) + string(rune('a'+i%26)) + string(rune(i)))
	}
	if len(p.failed) > maxFailedConversions {
		t.Errorf("negative cache grew to %d", len(p.failed))
	}
	p.removeCachedCopies(nil, nil)
	if len(p.failed) != 0 {
		t.Errorf("cache clear kept failures")
	}
	// Locks are striped: distinct paths never allocate new mutexes.
	if p.getPathMutex("/nonexistent/1") == nil || p.getPathMutex("a") != p.getPathMutex("a") {
		t.Error("getPathMutex not stable")
	}
}
