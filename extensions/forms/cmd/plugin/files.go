package main

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"
)

type uploadedFile struct {
	FieldName string
	FileName  string
	MimeType  string
	Size      int64
	Body      []byte
}

// validateFile checks file against the field's allowed_types and max_size.
// Returns an error message string suitable for the validation fields map.
func validateFile(field map[string]any, f uploadedFile) string {
	// max_size in MB
	maxMB := 5.0
	if v, ok := field["max_size"]; ok {
		switch n := v.(type) {
		case float64:
			maxMB = n
		case int:
			maxMB = float64(n)
		}
	}
	if float64(f.Size) > maxMB*1024*1024 {
		return fmt.Sprintf("File exceeds %.1fMB limit", maxMB)
	}

	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(f.FileName)), ".")
	// Active-content types are refused even when a form's allowed_types
	// lists them: a stored HTML/SVG/script file is a stored-XSS vector
	// wherever it ends up being served or opened.
	if blockedFileExtensions[ext] {
		return "File type not allowed"
	}
	allowed, _ := field["allowed_types"].(string)
	if allowed != "" {
		ok := false
		for _, a := range strings.Split(allowed, ",") {
			if strings.TrimPrefix(strings.TrimSpace(strings.ToLower(a)), ".") == ext {
				ok = true
				break
			}
		}
		if !ok {
			return "File type not allowed (expected: " + allowed + ")"
		}
		return ""
	}
	// No allowed_types configured: fall back to common document, image,
	// audio and video formats instead of accepting anything.
	if !defaultAllowedFileExtensions[ext] {
		return "File type not allowed"
	}
	return ""
}

// defaultAllowedFileExtensions applies when a file field has no
// allowed_types.
var defaultAllowedFileExtensions = map[string]bool{
	"pdf": true, "txt": true, "csv": true, "rtf": true,
	"doc": true, "docx": true, "xls": true, "xlsx": true, "ppt": true, "pptx": true,
	"odt": true, "ods": true, "odp": true,
	"jpg": true, "jpeg": true, "png": true, "gif": true, "webp": true, "heic": true, "heif": true, "avif": true,
	"mp3": true, "wav": true, "m4a": true, "ogg": true,
	"mp4": true, "mov": true, "webm": true,
	"zip": true,
}

// blockedFileExtensions are never accepted from anonymous submitters.
var blockedFileExtensions = map[string]bool{
	"html": true, "htm": true, "xhtml": true, "xht": true, "shtml": true, "mht": true, "mhtml": true,
	"svg": true, "svgz": true, "xml": true, "xsl": true, "xslt": true,
	"js": true, "mjs": true, "cjs": true, "php": true, "phtml": true, "swf": true,
	"exe": true, "dll": true, "bat": true, "cmd": true, "com": true, "scr": true, "msi": true, "sh": true, "ps1": true, "vbs": true, "jar": true,
}

// maxFilesPerField bounds a multiple-file field without max_files.
const maxFilesPerField = 10

// storeFile writes via host.StoreFile and returns the file metadata to embed
// in the submission JSON.
func (p *FormsPlugin) storeFile(ctx context.Context, formID uint, f uploadedFile) (map[string]any, error) {
	safeName := sanitizeFilename(f.FileName)
	storagePath := fmt.Sprintf("forms/submissions/%d/%d_%s", formID, time.Now().UnixNano(), safeName)
	url, err := p.host.StoreFile(ctx, storagePath, f.Body)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"name":      f.FileName,
		"url":       url,
		"size":      f.Size,
		"mime_type": f.MimeType,
	}, nil
}

// sanitizeFilename strips path separators and unsafe chars.
func sanitizeFilename(s string) string {
	s = filepath.Base(s)
	s = strings.Map(func(r rune) rune {
		if r == '/' || r == '\\' || r == 0 {
			return '_'
		}
		return r
	}, s)
	if len(s) > 200 {
		s = s[:200]
	}
	return s
}
