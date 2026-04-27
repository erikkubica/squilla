package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

// This file owns normalizeImage — the boot-time pipeline that strips
// EXIF, re-encodes oversize photos, and produces a WebP companion.

func (p *MediaManagerPlugin) normalizeImage(ctx context.Context, data []byte, mimeType string) ([]byte, string) {
	log.Printf("[normalize] input: %d bytes, mime: %s", len(data), mimeType)

	// Check if normalization is enabled.
	enabled, err := p.host.GetSetting(ctx, "media:optimizer:normalize_enabled")
	if err == nil && enabled == "false" {
		log.Printf("[normalize] disabled, skipping")
		return data, mimeType
	}

	maxDimStr, _ := p.host.GetSetting(ctx, "media:optimizer:normalize_max_dimension")
	maxDim := 5000
	if maxDimStr != "" {
		if parsed, err := strconv.Atoi(maxDimStr); err == nil && parsed > 0 {
			maxDim = parsed
		}
	}

	// Write to temp file for CLI tools.
	tmpFile, tmpErr := os.CreateTemp("", "normalize-*")
	if tmpErr != nil {
		log.Printf("[normalize] failed to create temp file: %v", tmpErr)
		return data, mimeType
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)
	tmpFile.Write(data)
	tmpFile.Close()

	// Step 1: Downscale if needed using ImageMagick (much better quality than Go).
	img, format, decErr := image.Decode(bytes.NewReader(data))
	if decErr != nil {
		log.Printf("[normalize] decode failed: %v", decErr)
		return data, mimeType
	}
	bounds := img.Bounds()
	origW := bounds.Dx()
	origH := bounds.Dy()
	log.Printf("[normalize] decoded: %dx%d, format: %s, maxDim: %d", origW, origH, format, maxDim)

	if origW > maxDim || origH > maxDim {
		// Use ImageMagick to resize — much better quality than Go's resizer.
		resizeArg := fmt.Sprintf("%dx%d>", maxDim, maxDim)
		cmd := exec.Command("magick", tmpPath, "-resize", resizeArg, "-strip", tmpPath)
		if out, err := cmd.CombinedOutput(); err != nil {
			log.Printf("[normalize] magick resize failed: %v: %s", err, string(out))
			// Fallback: try without magick (older imagemagick uses "convert")
			cmd2 := exec.Command("convert", tmpPath, "-resize", resizeArg, "-strip", tmpPath)
			if out2, err2 := cmd2.CombinedOutput(); err2 != nil {
				log.Printf("[normalize] convert resize failed: %v: %s", err2, string(out2))
				return data, mimeType
			}
		}
		log.Printf("[normalize] resized to fit %dx%d", maxDim, maxDim)
	}

	// Step 2: Get upload quality setting.
	quality := 100 // default: lossless
	qualityStr, _ := p.host.GetSetting(ctx, "media:optimizer:upload_quality")
	if qualityStr != "" {
		if parsed, err := strconv.Atoi(qualityStr); err == nil && parsed > 0 && parsed <= 100 {
			quality = parsed
		}
	}
	log.Printf("[normalize] quality: %d", quality)

	// Step 3: Optimize using native CLI tools.
	switch {
	case mimeType == "image/jpeg" || format == "jpeg":
		if quality < 100 {
			// Lossy: jpegoptim with max quality cap.
			cmd := exec.Command("jpegoptim", "--strip-all", "--all-progressive",
				fmt.Sprintf("--max=%d", quality), tmpPath)
			if out, err := cmd.CombinedOutput(); err != nil {
				log.Printf("[normalize] jpegoptim lossy failed: %v: %s", err, string(out))
			} else {
				log.Printf("[normalize] jpegoptim (q%d): %s", quality, strings.TrimSpace(string(out)))
			}
		} else {
			// Lossless: optimize Huffman tables + strip metadata only.
			cmd := exec.Command("jpegoptim", "--strip-all", "--all-progressive", tmpPath)
			if out, err := cmd.CombinedOutput(); err != nil {
				log.Printf("[normalize] jpegoptim failed: %v: %s", err, string(out))
			} else {
				log.Printf("[normalize] jpegoptim (lossless): %s", strings.TrimSpace(string(out)))
			}
		}

	case mimeType == "image/png" || format == "png":
		if quality < 100 {
			// Lossy: use pngquant for lossy PNG compression, then optipng for final polish.
			pqQuality := fmt.Sprintf("%d-%d", quality-5, quality)
			if quality <= 5 {
				pqQuality = fmt.Sprintf("0-%d", quality)
			}
			cmd := exec.Command("pngquant", "--quality", pqQuality, "--force", "--output", tmpPath, tmpPath)
			if out, err := cmd.CombinedOutput(); err != nil {
				log.Printf("[normalize] pngquant failed (non-fatal): %v: %s", err, string(out))
			} else {
				log.Printf("[normalize] pngquant (q%d): done", quality)
			}
		}
		// Always run optipng for lossless final optimization.
		cmd := exec.Command("optipng", "-strip", "all", "-o2", tmpPath)
		if out, err := cmd.CombinedOutput(); err != nil {
			log.Printf("[normalize] optipng failed: %v: %s", err, string(out))
		} else {
			log.Printf("[normalize] optipng: %s", strings.TrimSpace(string(out)))
		}
	}

	// Read back optimized file.
	optimized, readErr := os.ReadFile(tmpPath)
	if readErr != nil {
		log.Printf("[normalize] failed to read optimized file: %v", readErr)
		return data, mimeType
	}

	log.Printf("[normalize] result: %d bytes (was %d, saved %d%%)",
		len(optimized), len(data), (len(data)-len(optimized))*100/len(data))
	return optimized, mimeType
}

// --- Restore / Re-optimize ---

// handleRestoreOriginal restores a single image to its pre-optimization original.
