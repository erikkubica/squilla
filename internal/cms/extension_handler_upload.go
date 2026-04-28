package cms

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"squilla/internal/api"

	"github.com/gofiber/fiber/v2"
)

// This file owns the extension upload/install path: zip parsing,
// manifest validation, file writing, and triggering a rescan. The
// only piece sized large enough to demand its own file.

func (h *ExtensionHandler) Upload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "NO_FILE", "No file uploaded")
	}
	if !strings.HasSuffix(file.Filename, ".zip") {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_FORMAT", "File must be a .zip archive")
	}

	// Read ZIP into memory
	f, err := file.Open()
	if err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "READ_FAILED", "Failed to read uploaded file")
	}
	defer f.Close()

	// Limit upload size to 50 MB to prevent memory exhaustion.
	const maxUploadSize = 50 * 1024 * 1024
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, io.LimitReader(f, maxUploadSize+1)); err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "READ_FAILED", "Failed to read uploaded file")
	}
	if buf.Len() > maxUploadSize {
		return api.Error(c, fiber.StatusBadRequest, "FILE_TOO_LARGE", "Upload exceeds maximum size of 50 MB")
	}

	// Open as ZIP
	reader, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ZIP", "Invalid ZIP archive")
	}

	// Find extension.json to determine slug
	var manifest struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Version     string `json:"version"`
		Author      string `json:"author"`
		Description string `json:"description"`
		Priority    int    `json:"priority"`
	}
	foundManifest := false
	manifestPrefix := "" // directory prefix inside ZIP

	for _, zf := range reader.File {
		name := zf.Name
		// Handle extension.json at root or inside a single directory
		base := filepath.Base(name)
		if base == "extension.json" && !zf.FileInfo().IsDir() {
			rc, err := zf.Open()
			if err != nil {
				continue
			}
			data, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				continue
			}
			if err := json.Unmarshal(data, &manifest); err != nil {
				return api.Error(c, fiber.StatusBadRequest, "INVALID_MANIFEST", "Invalid extension.json: "+err.Error())
			}
			foundManifest = true
			manifestPrefix = strings.TrimSuffix(name, "extension.json")
			break
		}
	}

	if !foundManifest || manifest.Slug == "" {
		return api.Error(c, fiber.StatusBadRequest, "NO_MANIFEST", "ZIP must contain extension.json with a slug field")
	}

	// Validate slug to prevent path traversal via crafted manifest.
	if !isValidSettingsKey(manifest.Slug) {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_SLUG", "Extension slug contains invalid characters")
	}

	// Extract to extensions/{slug}/
	destDir := filepath.Join(h.loader.extensionsDir, manifest.Slug)
	if err := os.RemoveAll(destDir); err != nil {
		log.Printf("WARN: failed to clean extension dir %s: %v", destDir, err)
	}

	for _, zf := range reader.File {
		name := zf.Name
		// Strip the manifest prefix (in case ZIP has a wrapper directory)
		if manifestPrefix != "" {
			if !strings.HasPrefix(name, manifestPrefix) {
				continue
			}
			name = strings.TrimPrefix(name, manifestPrefix)
		}
		if name == "" {
			continue
		}

		destPath := filepath.Join(destDir, name)
		// Prevent zip slip
		if !strings.HasPrefix(filepath.Clean(destPath), filepath.Clean(destDir)+string(os.PathSeparator)) {
			continue
		}

		if zf.FileInfo().IsDir() {
			os.MkdirAll(destPath, 0755)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return api.Error(c, fiber.StatusInternalServerError, "EXTRACT_FAILED", fmt.Sprintf("Failed to create directory: %v", err))
		}

		rc, err := zf.Open()
		if err != nil {
			continue
		}
		outFile, err := os.Create(destPath)
		if err != nil {
			rc.Close()
			continue
		}
		io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()
	}

	// Register in DB
	h.loader.ScanAndRegister()

	return api.Success(c, fiber.Map{"message": "Extension uploaded", "slug": manifest.Slug})
}
