package main

import (
	"bytes"
	"encoding/xml"
	"errors"
	"fmt"
	"image"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	pb "squilla/pkg/plugin/proto"
)

// This file owns the upload safety checks: content sniffing against the
// declared type, the SVG sanitizer, and the image dimension guard that
// keeps decompression bombs away from image.Decode.

// Image dimension limits applied before every full decode. A 20k x 20k
// RGBA image is 1.6 GB in memory, so the pixel cap is the one that
// usually bites.
const (
	maxImagePixels = 50_000_000
	maxImageSide   = 20_000
)

var errImageTooLarge = errors.New("image dimensions exceed the allowed maximum")

// checkImageDimensions reads only the image header and rejects images
// whose decoded size would be unreasonable. Formats the decoder doesn't
// know (or corrupt headers) return the DecodeConfig error so callers can
// treat them the same way a failed decode would be treated.
func checkImageDimensions(data []byte) error {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return err
	}
	if cfg.Width <= 0 || cfg.Height <= 0 {
		return fmt.Errorf("invalid image dimensions %dx%d", cfg.Width, cfg.Height)
	}
	if cfg.Width > maxImageSide || cfg.Height > maxImageSide ||
		int64(cfg.Width)*int64(cfg.Height) > maxImagePixels {
		return fmt.Errorf("%w (%dx%d)", errImageTooLarge, cfg.Width, cfg.Height)
	}
	return nil
}

// decodeImageBounded is image.Decode behind checkImageDimensions.
func decodeImageBounded(data []byte) (image.Image, string, error) {
	if err := checkImageDimensions(data); err != nil {
		return nil, "", err
	}
	return image.Decode(bytes.NewReader(data))
}

// baseMime lowercases a media type and drops its parameters.
func baseMime(m string) string {
	if m == "" {
		return ""
	}
	if parsed, _, err := mime.ParseMediaType(m); err == nil {
		return strings.ToLower(parsed)
	}
	if i := strings.IndexByte(m, ';'); i >= 0 {
		m = m[:i]
	}
	return strings.ToLower(strings.TrimSpace(m))
}

// sniffedMatchesDeclared reports whether the bytes (as sniffed by
// http.DetectContentType) are plausibly of the declared type. Markup a
// browser could render as a document (HTML, XML) never matches — SVG is
// handled separately by the caller. A sniff of application/octet-stream
// means "unknown binary" (AVIF, HEIC, MKV, old Office files…) and is
// accepted for binary declared types; we serve with nosniff, so an
// unknown blob can't be reinterpreted as a document.
func sniffedMatchesDeclared(declared, sniffed string) bool {
	declared = baseMime(declared)
	sniffed = baseMime(sniffed)

	switch sniffed {
	case "text/html", "text/xml", "application/xml":
		return false
	}

	family := func(m string) string {
		if i := strings.IndexByte(m, '/'); i > 0 {
			return m[:i]
		}
		return m
	}

	switch {
	case strings.HasPrefix(declared, "image/"):
		return family(sniffed) == "image" || sniffed == "application/octet-stream"
	case strings.HasPrefix(declared, "video/"), strings.HasPrefix(declared, "audio/"):
		// Go sniffs every ISO-BMFF file as video/mp4 and Ogg as
		// application/ogg, so audio and video are interchangeable here.
		f := family(sniffed)
		return f == "video" || f == "audio" || sniffed == "application/ogg" || sniffed == "application/octet-stream"
	case declared == "application/pdf":
		return sniffed == "application/pdf"
	case declared == "application/zip",
		strings.HasPrefix(declared, "application/vnd.openxmlformats-officedocument."),
		strings.HasPrefix(declared, "application/vnd.oasis.opendocument."):
		return sniffed == "application/zip"
	case declared == "application/msword",
		declared == "application/vnd.ms-excel",
		declared == "application/vnd.ms-powerpoint":
		return sniffed == "application/octet-stream" || sniffed == "application/zip"
	case strings.HasPrefix(declared, "text/"):
		return sniffed == "text/plain"
	}
	return false
}

// safeStoredExtensions is the closed set of extensions a stored file may
// carry. Anything a browser treats as an active document (.html, .xhtml,
// .xml, .js, …) is deliberately absent; .svg is produced only for
// image/svg+xml, never from a user's filename.
var safeStoredExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
	".avif": true, ".bmp": true, ".ico": true, ".heic": true, ".heif": true, ".tif": true, ".tiff": true,
	".mp4": true, ".webm": true, ".mov": true, ".m4v": true, ".mkv": true, ".ogv": true,
	".mp3": true, ".wav": true, ".ogg": true, ".oga": true, ".m4a": true, ".flac": true, ".aac": true,
	".pdf": true, ".zip": true,
	".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".ppt": true, ".pptx": true,
	".odt": true, ".ods": true, ".odp": true,
	".txt": true, ".csv": true, ".md": true,
}

// looksLikeSVGUpload reports whether an upload should go through the SVG
// path: declared as SVG, or an .svg file the browser didn't label.
func looksLikeSVGUpload(declared, filename string) bool {
	d := baseMime(declared)
	if d == "image/svg+xml" {
		return true
	}
	if strings.EqualFold(filepath.Ext(filename), ".svg") {
		return d == "" || d == "application/octet-stream" || d == "text/xml" || d == "application/xml"
	}
	return false
}

// --- SVG sanitizer ---

const (
	svgNS   = "http://www.w3.org/2000/svg"
	xlinkNS = "http://www.w3.org/1999/xlink"
)

// svgAllowedElements is the element allow-list. Anything else (script,
// foreignObject, iframe, a, animate/set — which can rewrite href — and
// every editor-specific namespace) is dropped together with its subtree.
var svgAllowedElements = map[string]bool{
	"svg": true, "g": true, "defs": true, "symbol": true, "use": true, "title": true, "desc": true,
	"path": true, "rect": true, "circle": true, "ellipse": true, "line": true, "polyline": true, "polygon": true,
	"text": true, "tspan": true, "textpath": true,
	"lineargradient": true, "radialgradient": true, "stop": true,
	"clippath": true, "mask": true, "pattern": true, "marker": true, "image": true, "style": true,
	"filter": true, "feblend": true, "fecolormatrix": true, "fecomponenttransfer": true, "fecomposite": true,
	"feconvolvematrix": true, "fediffuselighting": true, "fedisplacementmap": true, "fedistantlight": true,
	"feflood": true, "fefunca": true, "fefuncb": true, "fefuncg": true, "fefuncr": true, "fegaussianblur": true,
	"femerge": true, "femergenode": true, "femorphology": true, "feoffset": true, "fepointlight": true,
	"fespecularlighting": true, "fespotlight": true, "fetile": true, "feturbulence": true, "fedropshadow": true,
}

var errNotSVG = errors.New("file is not a valid SVG image")

// sanitizeSVG re-serialises an SVG document keeping only allow-listed
// elements and safe attributes: no scripts, no event handlers, no
// foreignObject, no external or javascript: references. It returns an
// error when the input isn't well-formed XML with an <svg> root.
func sanitizeSVG(data []byte) ([]byte, error) {
	dec := xml.NewDecoder(bytes.NewReader(data))
	dec.Strict = true
	// Unknown entities fail in strict mode; we never expand DTD entities.
	dec.Entity = map[string]string{}

	var out bytes.Buffer
	out.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")

	// prefixes declared for the SVG and XLink namespaces.
	svgPrefixes := map[string]bool{"": true}
	xlinkPrefixes := map[string]bool{}

	depth := 0     // open allowed elements
	skipDepth := 0 // >0 while inside a dropped subtree
	sawRoot := false
	inStyle := 0
	var styleBuf bytes.Buffer

	for {
		tok, err := dec.RawToken()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, errNotSVG
		}
		switch t := tok.(type) {
		case xml.StartElement:
			if skipDepth > 0 {
				skipDepth++
				continue
			}
			if !sawRoot {
				// Namespace declarations on the root decide which
				// prefixes mean SVG / XLink.
				for _, a := range t.Attr {
					if a.Name.Space == "xmlns" && a.Value == svgNS {
						svgPrefixes[a.Name.Local] = true
					}
					if a.Name.Space == "xmlns" && a.Value == xlinkNS {
						xlinkPrefixes[a.Name.Local] = true
					}
				}
				if !svgPrefixes[t.Name.Space] || strings.ToLower(t.Name.Local) != "svg" {
					return nil, errNotSVG
				}
				sawRoot = true
			} else if depth == 0 {
				// A second root element — not a well-formed document.
				return nil, errNotSVG
			}
			local := strings.ToLower(t.Name.Local)
			if !svgPrefixes[t.Name.Space] || !svgAllowedElements[local] {
				skipDepth = 1
				continue
			}
			writeSVGStart(&out, t, local, xlinkPrefixes)
			depth++
			if local == "style" {
				inStyle++
				styleBuf.Reset()
			}
		case xml.EndElement:
			if skipDepth > 0 {
				skipDepth--
				continue
			}
			if depth == 0 {
				return nil, errNotSVG
			}
			if inStyle > 0 && strings.ToLower(t.Name.Local) == "style" {
				inStyle--
				if cssValueSafe(styleBuf.String()) {
					_ = xml.EscapeText(&out, styleBuf.Bytes())
				}
				styleBuf.Reset()
			}
			out.WriteString("</")
			if t.Name.Space != "" {
				out.WriteString(t.Name.Space + ":")
			}
			out.WriteString(t.Name.Local + ">")
			depth--
		case xml.CharData:
			if skipDepth > 0 || depth == 0 {
				continue
			}
			if inStyle > 0 {
				styleBuf.Write(t)
				continue
			}
			_ = xml.EscapeText(&out, t)
		default:
			// Comments, processing instructions and DOCTYPE directives
			// are dropped.
		}
	}
	if !sawRoot || depth != 0 {
		return nil, errNotSVG
	}
	return out.Bytes(), nil
}

func writeSVGStart(out *bytes.Buffer, t xml.StartElement, local string, xlinkPrefixes map[string]bool) {
	out.WriteByte('<')
	if t.Name.Space != "" {
		out.WriteString(t.Name.Space + ":")
	}
	out.WriteString(t.Name.Local)
	for _, a := range t.Attr {
		name, ok := safeSVGAttr(a, local, xlinkPrefixes)
		if !ok {
			continue
		}
		out.WriteByte(' ')
		out.WriteString(name)
		out.WriteString(`="`)
		_ = xml.EscapeText(out, []byte(a.Value))
		out.WriteByte('"')
	}
	out.WriteByte('>')
}

// safeSVGAttr decides whether an attribute survives and returns the name
// to write.
func safeSVGAttr(a xml.Attr, element string, xlinkPrefixes map[string]bool) (string, bool) {
	space, local := a.Name.Space, a.Name.Local
	lname := strings.ToLower(local)

	switch {
	case space == "" && lname == "xmlns":
		return "xmlns", a.Value == svgNS
	case space == "xmlns":
		if a.Value == svgNS || a.Value == xlinkNS {
			return "xmlns:" + local, true
		}
		return "", false
	case space == "xml":
		if lname == "space" || lname == "lang" {
			return "xml:" + local, true
		}
		return "", false
	case xlinkPrefixes[space]:
		if lname == "href" && svgHrefSafe(a.Value, element) {
			return space + ":" + local, true
		}
		if lname == "title" {
			return space + ":" + local, true
		}
		return "", false
	case space != "":
		// Editor namespaces (inkscape:, sodipodi:, …) and anything else.
		return "", false
	}

	if strings.HasPrefix(lname, "on") {
		return "", false
	}
	if lname == "href" {
		return local, svgHrefSafe(a.Value, element)
	}
	if !cssValueSafe(a.Value) {
		return "", false
	}
	return local, true
}

// svgHrefSafe allows fragment references everywhere and inline raster
// data only on <image>. External URLs and javascript: are refused.
func svgHrefSafe(v, element string) bool {
	v = strings.TrimSpace(v)
	if strings.HasPrefix(v, "#") {
		return true
	}
	if element == "image" {
		lv := strings.ToLower(v)
		for _, p := range []string{"data:image/png", "data:image/jpeg", "data:image/gif", "data:image/webp"} {
			if strings.HasPrefix(lv, p) {
				return true
			}
		}
	}
	return false
}

// cssValueSafe rejects CSS / attribute values that can run script or
// load external resources. url() is allowed only for in-document
// fragments and inline raster data.
func cssValueSafe(v string) bool {
	var b strings.Builder
	for _, r := range strings.ToLower(v) {
		// Drop whitespace and backslashes so "java\script:" or
		// "url ( x )" can't slip past the substring checks.
		if r == ' ' || r == '\t' || r == '\n' || r == '\r' || r == '\f' || r == '\\' || r == 0 {
			continue
		}
		b.WriteRune(r)
	}
	s := b.String()
	for _, bad := range []string{"javascript:", "vbscript:", "expression(", "@import", "behavior:", "-moz-binding", "data:text", "data:application", "data:image/svg"} {
		if strings.Contains(s, bad) {
			return false
		}
	}
	for i := strings.Index(s, "url("); i >= 0; {
		rest := strings.TrimLeft(s[i+4:], `"'`)
		if !strings.HasPrefix(rest, "#") && !strings.HasPrefix(rest, "data:image/") {
			return false
		}
		next := strings.Index(s[i+4:], "url(")
		if next < 0 {
			break
		}
		i = i + 4 + next
	}
	return true
}

// --- Serving headers ---

// sandboxCSP is attached to every SVG and every download-only response so
// the document can't run script even when opened directly on the site
// origin. Inline styles stay allowed so SVGs still render.
const sandboxCSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox"

// inlineSafeExts are the extensions served inline. Everything else is a
// download.
var inlineSafeExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".avif": true,
	".bmp": true, ".ico": true, ".svg": true,
	".mp4": true, ".webm": true, ".mov": true, ".m4v": true, ".mkv": true, ".ogv": true,
	".mp3": true, ".wav": true, ".ogg": true, ".oga": true, ".m4a": true, ".flac": true, ".aac": true,
	".pdf": true,
}

// applyMediaSafetyHeaders adds nosniff to every media response, the
// sandbox CSP to SVGs, and attachment + sandbox CSP to anything that
// isn't a raster image, SVG, video, audio or PDF.
func applyMediaSafetyHeaders(headers map[string]string, ext string) {
	headers["X-Content-Type-Options"] = "nosniff"
	ext = strings.ToLower(ext)
	if ext == ".svg" {
		headers["Content-Security-Policy"] = sandboxCSP
		return
	}
	if !inlineSafeExts[ext] {
		headers["Content-Disposition"] = "attachment"
		headers["Content-Security-Policy"] = sandboxCSP
	}
}

// validateUpload checks an uploaded file against the allow-list and its
// own bytes. It returns the (possibly sanitised) bytes and the MIME type
// to store, or an error response.
func validateUpload(data []byte, declared, filename string) ([]byte, string, *pb.PluginHTTPResponse) {
	if looksLikeSVGUpload(declared, filename) {
		clean, err := sanitizeSVG(data)
		if err != nil {
			return nil, "", jsonError(400, "INVALID_FILE_TYPE", "The file is not a valid SVG image")
		}
		return clean, "image/svg+xml", nil
	}

	sniffed := http.DetectContentType(data)
	mimeType := baseMime(declared)
	if mimeType == "" || mimeType == "application/octet-stream" {
		mimeType = baseMime(sniffed)
	}
	if mimeType == "image/svg+xml" {
		// Only reachable when the bytes were labelled as something else
		// but the declared type was empty; refuse rather than guess.
		return nil, "", jsonError(400, "INVALID_FILE_TYPE", "The file is not a valid SVG image")
	}
	if !isAllowedMimeType(mimeType) {
		return nil, "", jsonError(400, "INVALID_FILE_TYPE", fmt.Sprintf("File type %s is not allowed", mimeType))
	}
	if !sniffedMatchesDeclared(mimeType, sniffed) {
		return nil, "", jsonError(400, "INVALID_FILE_TYPE", fmt.Sprintf("File content does not match its declared type %s", mimeType))
	}
	return data, mimeType, nil
}
