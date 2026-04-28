package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the bulk re-optimize and restore endpoints. Each
// runs as a goroutine guarded by p.bulkJob so the admin UI can poll
// /optimizer/progress for status.

func (p *MediaManagerPlugin) handleRestoreOriginal(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Media file not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch media file"), nil
	}

	origPath, _ := row["original_path"].(string)
	if origPath == "" {
		return jsonError(400, "NO_ORIGINAL", "No original backup exists for this file"), nil
	}
	currentPath, _ := row["path"].(string)

	// Read the original file from disk.
	origFullPath := filepath.Join(p.storageDir, origPath)
	origData, err := os.ReadFile(origFullPath)
	if err != nil {
		return jsonError(404, "ORIGINAL_MISSING", "Original backup file not found on disk"), nil
	}

	// Overwrite the current file with the original.
	if _, err := p.host.StoreFile(ctx, currentPath, origData); err != nil {
		return jsonError(500, "RESTORE_FAILED", "Failed to write restored file"), nil
	}

	// Get original dimensions.
	var newW, newH int
	if img, _, decErr := image.Decode(bytes.NewReader(origData)); decErr == nil {
		newW = img.Bounds().Dx()
		newH = img.Bounds().Dy()
	}

	// Update the database record.
	updateData := map[string]any{
		"size":                 len(origData),
		"is_optimized":         false,
		"optimization_savings": 0,
		"updated_at":           time.Now().Format(time.RFC3339),
	}
	if newW > 0 {
		updateData["width"] = newW
	}
	if newH > 0 {
		updateData["height"] = newH
	}
	if err := p.host.DataUpdate(ctx, tableName, id, updateData); err != nil {
		return jsonError(500, "UPDATE_FAILED", "Failed to update media record"), nil
	}

	// Clear cached variants since the source image changed.
	p.clearCacheForOriginal(ctx, currentPath)

	// Fetch and return the updated record.
	updated, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		return jsonError(500, "FETCH_FAILED", "Failed to fetch updated record"), nil
	}
	return jsonResponse(200, map[string]any{"data": updated}), nil
}

// handleReoptimize re-optimizes a single image with current settings.
// It reads from the original backup (if available) and re-applies normalization.
func (p *MediaManagerPlugin) handleReoptimize(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Media file not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch media file"), nil
	}

	currentPath, _ := row["path"].(string)
	mimeType, _ := row["mime_type"].(string)

	if !strings.HasPrefix(mimeType, "image/") || mimeType == "image/svg+xml" {
		return jsonError(400, "NOT_IMAGE", "Only images can be re-optimized"), nil
	}

	// Determine the source: use original backup if available, else current file.
	sourcePath := currentPath
	origPath, _ := row["original_path"].(string)
	if origPath != "" {
		sourcePath = origPath
	}

	sourceFullPath := filepath.Join(p.storageDir, sourcePath)
	sourceData, err := os.ReadFile(sourceFullPath)
	if err != nil {
		return jsonError(404, "SOURCE_MISSING", "Source image file not found"), nil
	}

	originalSize := len(sourceData)

	// If no original backup exists yet, create one before optimizing.
	if origPath == "" {
		now := time.Now()
		filename, _ := row["filename"].(string)
		dateDir := fmt.Sprintf("%04d/%02d", now.Year(), now.Month())
		origPath = fmt.Sprintf("media/originals/%s/%s", dateDir, filename)
		if _, storeErr := p.host.StoreFile(ctx, origPath, sourceData); storeErr != nil {
			log.Printf("[reoptimize] failed to create original backup: %v", storeErr)
			origPath = ""
		}
	}

	// Get original dimensions.
	var origW, origH int
	if img, _, decErr := image.Decode(bytes.NewReader(sourceData)); decErr == nil {
		origW = img.Bounds().Dx()
		origH = img.Bounds().Dy()
	}

	// Apply normalization with current settings.
	optimized, optimizedMime := p.normalizeImage(ctx, sourceData, mimeType)

	// Only keep the new bytes when they're actually smaller — if the
	// encoder produced a larger file (can happen on already-compressed
	// inputs), fall back to the source and record zero savings. The
	// image is still marked is_optimized=true so it stops showing up as
	// "needs optimization" — we did process it, the result just wasn't
	// an improvement.
	finalBytes := optimized
	finalMime := optimizedMime
	if len(optimized) >= len(sourceData) && optimizedMime == mimeType {
		finalBytes = sourceData
		finalMime = mimeType
	}

	savings := len(sourceData) - len(finalBytes)
	if savings < 0 {
		savings = 0
	}

	// Write the final file (either the optimized bytes or the original
	// source when optimization didn't help).
	if _, err := p.host.StoreFile(ctx, currentPath, finalBytes); err != nil {
		return jsonError(500, "STORE_FAILED", "Failed to store re-optimized file"), nil
	}

	// Get new dimensions.
	var newW, newH int
	if img, _, decErr := image.Decode(bytes.NewReader(finalBytes)); decErr == nil {
		newW = img.Bounds().Dx()
		newH = img.Bounds().Dy()
	}

	// Update record. is_optimized is always true after a successful
	// run — see the size-guard above for why we do this even when the
	// encoder couldn't beat the original.
	updateData := map[string]any{
		"size":                 len(finalBytes),
		"mime_type":            finalMime,
		"is_optimized":         true,
		"original_size":        originalSize,
		"original_path":        origPath,
		"optimization_savings": savings,
		"updated_at":           time.Now().Format(time.RFC3339),
	}
	if origW > 0 {
		updateData["original_width"] = origW
		updateData["original_height"] = origH
	}
	if newW > 0 {
		updateData["width"] = newW
		updateData["height"] = newH
	}
	if err := p.host.DataUpdate(ctx, tableName, id, updateData); err != nil {
		return jsonError(500, "UPDATE_FAILED", "Failed to update media record"), nil
	}

	// Clear cached variants since the source changed.
	p.clearCacheForOriginal(ctx, currentPath)

	updated, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		return jsonError(500, "FETCH_FAILED", "Failed to fetch updated record"), nil
	}
	return jsonResponse(200, map[string]any{"data": updated}), nil
}

// handleReoptimizeAll kicks off async (re-)optimization of images. When
// pendingOnly is true, only images where is_optimized is not true are
// processed — useful for catching up on new uploads after a settings
// change without re-encoding previously optimized files.
func (p *MediaManagerPlugin) handleReoptimizeAll(ctx context.Context, pendingOnly bool) (*pb.PluginHTTPResponse, error) {
	if p.reoptimizeProgress.Running {
		return jsonResponse(409, map[string]any{
			"error": map[string]any{"code": "ALREADY_RUNNING", "message": "Re-optimization is already in progress"},
			"data":  p.reoptimizeProgress.snapshot(),
		}), nil
	}

	rawWhere := "mime_type LIKE ?"
	args := []any{"image/%"}
	if pendingOnly {
		rawWhere += " AND (is_optimized IS NULL OR is_optimized = false)"
	}
	result, err := p.host.DataQuery(ctx, tableName, coreapi.DataStoreQuery{
		Raw:   rawWhere,
		Args:  args,
		Limit: 10000,
	})
	if err != nil {
		return jsonError(500, "QUERY_FAILED", "Failed to query media files"), nil
	}

	// Filter to processable images and collect IDs.
	var fileIDs []uint
	for _, row := range result.Rows {
		mimeType, _ := row["mime_type"].(string)
		if mimeType == "image/svg+xml" {
			continue
		}
		var fileID uint
		switch v := row["id"].(type) {
		case float64:
			fileID = uint(v)
		case json.Number:
			n, _ := v.Int64()
			fileID = uint(n)
		}
		if fileID > 0 {
			fileIDs = append(fileIDs, fileID)
		}
	}

	p.reoptimizeProgress.reset(len(fileIDs))

	// Run in background goroutine.
	go func() {
		bgCtx := context.Background()
		for _, fid := range fileIDs {
			resp, err := p.handleReoptimize(bgCtx, fid)
			if err != nil || resp.StatusCode != 200 {
				p.reoptimizeProgress.advance(0, true)
				continue
			}
			var savings int64
			var respBody map[string]any
			if json.Unmarshal(resp.Body, &respBody) == nil {
				if data, ok := respBody["data"].(map[string]any); ok {
					savings = int64(intFromRow(data, "optimization_savings"))
				}
			}
			p.reoptimizeProgress.advance(savings, false)
		}
		p.reoptimizeProgress.finish()
	}()

	return jsonResponse(202, map[string]any{"data": p.reoptimizeProgress.snapshot()}), nil
}

// handleRestoreAll kicks off async restore of all optimized images.
func (p *MediaManagerPlugin) handleRestoreAll(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	if p.restoreProgress.Running {
		return jsonResponse(409, map[string]any{
			"error": map[string]any{"code": "ALREADY_RUNNING", "message": "Restore is already in progress"},
			"data":  p.restoreProgress.snapshot(),
		}), nil
	}

	result, err := p.host.DataQuery(ctx, tableName, coreapi.DataStoreQuery{
		Raw:   "is_optimized = ? AND original_path != ?",
		Args:  []any{true, ""},
		Limit: 10000,
	})
	if err != nil {
		return jsonError(500, "QUERY_FAILED", "Failed to query media files"), nil
	}

	var fileIDs []uint
	for _, row := range result.Rows {
		var fileID uint
		switch v := row["id"].(type) {
		case float64:
			fileID = uint(v)
		case json.Number:
			n, _ := v.Int64()
			fileID = uint(n)
		}
		if fileID > 0 {
			fileIDs = append(fileIDs, fileID)
		}
	}

	p.restoreProgress.reset(len(fileIDs))

	go func() {
		bgCtx := context.Background()
		for _, fid := range fileIDs {
			resp, err := p.handleRestoreOriginal(bgCtx, fid)
			if err != nil || resp.StatusCode != 200 {
				p.restoreProgress.advance(0, true)
				continue
			}
			p.restoreProgress.advance(0, false)
		}
		p.restoreProgress.finish()
	}()

	return jsonResponse(202, map[string]any{"data": p.restoreProgress.snapshot()}), nil
}

// handleOptimizerStats returns aggregate optimization statistics.
func (p *MediaManagerPlugin) handleOptimizerStats(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	// Count all images.
	allResult, err := p.host.DataQuery(ctx, tableName, coreapi.DataStoreQuery{
		Raw:   "mime_type LIKE ? AND mime_type != ?",
		Args:  []any{"image/%", "image/svg+xml"},
		Limit: 10000,
	})
	if err != nil {
		return jsonError(500, "QUERY_FAILED", "Failed to query images"), nil
	}

	totalImages := len(allResult.Rows)
	optimizedCount := 0
	unoptimizedCount := 0
	totalOriginalSize := int64(0)
	totalCurrentSize := int64(0)
	totalSavings := int64(0)
	withBackup := 0

	for _, row := range allResult.Rows {
		isOpt := false
		if v, ok := row["is_optimized"].(bool); ok {
			isOpt = v
		}
		if isOpt {
			optimizedCount++
		} else {
			unoptimizedCount++
		}

		origSize := int64(intFromRow(row, "original_size"))
		currentSize := int64(intFromRow(row, "size"))
		savings := int64(intFromRow(row, "optimization_savings"))

		if origSize > 0 {
			totalOriginalSize += origSize
		} else {
			totalOriginalSize += currentSize
		}
		totalCurrentSize += currentSize
		totalSavings += savings

		origPath, _ := row["original_path"].(string)
		if origPath != "" {
			withBackup++
		}
	}

	return jsonResponse(200, map[string]any{
		"data": map[string]any{
			"total_images":        totalImages,
			"optimized_count":     optimizedCount,
			"unoptimized_count":   unoptimizedCount,
			"with_backup":         withBackup,
			"total_original_size": totalOriginalSize,
			"total_current_size":  totalCurrentSize,
			"total_savings":       totalSavings,
		},
	}), nil
}

// --- Helpers ---
