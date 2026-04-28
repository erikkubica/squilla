package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the optimizer settings + image-size CRUD endpoints.

func (p *MediaManagerPlugin) handleGetOptimizerSettings(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	settings := make(map[string]string)
	for key, defaultVal := range optimizerSettingDefaults {
		val, err := p.host.GetSetting(ctx, key)
		if err != nil || val == "" {
			val = defaultVal
		}
		// Strip the prefix for cleaner JSON keys.
		shortKey := strings.TrimPrefix(key, "media:optimizer:")
		settings[shortKey] = val
	}
	return jsonResponse(200, map[string]any{"data": settings}), nil
}

// handleUpdateOptimizerSettings updates optimizer settings.
func (p *MediaManagerPlugin) handleUpdateOptimizerSettings(ctx context.Context, body []byte) (*pb.PluginHTTPResponse, error) {
	var input map[string]any
	if err := json.Unmarshal(body, &input); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	updated := make(map[string]string)
	for shortKey, rawValue := range input {
		fullKey := "media:optimizer:" + shortKey
		if _, ok := optimizerSettingDefaults[fullKey]; !ok {
			continue // Skip unknown settings.
		}
		value := fmt.Sprintf("%v", rawValue)
		if err := p.host.SetSetting(ctx, fullKey, value); err != nil {
			return jsonError(500, "SETTINGS_FAILED", fmt.Sprintf("Failed to save setting %s", shortKey)), nil
		}
		updated[shortKey] = value
	}

	return jsonResponse(200, map[string]any{"data": updated}), nil
}

// --- Image Size Management ---

// handleListSizes returns all registered image sizes with cache stats.
func (p *MediaManagerPlugin) handleListSizes(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	result, err := p.host.DataQuery(ctx, sizesTable, coreapi.DataStoreQuery{
		OrderBy: "name ASC",
		Limit:   100,
	})
	if err != nil {
		return jsonError(500, "LIST_FAILED", "Failed to list image sizes"), nil
	}

	// Enrich each size with cache stats.
	for i, row := range result.Rows {
		name, _ := row["name"].(string)
		if name == "" {
			continue
		}
		sizeDir := filepath.Join(p.cacheBaseDir(), name)
		fileCount, totalSize := dirStats(sizeDir)
		result.Rows[i]["cached_files"] = fileCount
		result.Rows[i]["cache_size"] = totalSize
	}

	// Also count _webp cache.
	webpDir := filepath.Join(p.cacheBaseDir(), "_webp")
	webpFiles, webpSize := dirStats(webpDir)

	return jsonResponse(200, map[string]any{
		"data": result.Rows,
		"meta": map[string]any{
			"total":      result.Total,
			"webp_files": webpFiles,
			"webp_size":  webpSize,
		},
	}), nil
}

// dirStats returns the file count and total size of all files in a directory (recursive).
func dirStats(dir string) (int, int64) {
	var count int
	var size int64
	filepath.Walk(dir, func(_ string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		count++
		size += info.Size()
		return nil
	})
	return count, size
}

// handleCreateSize registers a new image size.
func (p *MediaManagerPlugin) handleCreateSize(ctx context.Context, body []byte) (*pb.PluginHTTPResponse, error) {
	var input struct {
		Name    string `json:"name"`
		Width   int    `json:"width"`
		Height  int    `json:"height"`
		Mode    string `json:"mode"`
		Source  string `json:"source"`
		Quality int    `json:"quality"`
	}
	if err := json.Unmarshal(body, &input); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	if input.Name == "" || input.Width <= 0 || input.Height <= 0 {
		return jsonError(400, "VALIDATION_FAILED", "Name, width, and height are required"), nil
	}
	if input.Mode == "" {
		input.Mode = "fit"
	}
	if input.Mode != "crop" && input.Mode != "fit" && input.Mode != "width" {
		return jsonError(400, "INVALID_MODE", "Mode must be crop, fit, or width"), nil
	}
	if input.Source == "" {
		input.Source = "default"
	}

	record := map[string]any{
		"name":    input.Name,
		"width":   input.Width,
		"height":  input.Height,
		"mode":    input.Mode,
		"source":  input.Source,
		"quality": input.Quality,
	}

	created, err := p.host.DataCreate(ctx, sizesTable, record)
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			return jsonError(409, "DUPLICATE_NAME", fmt.Sprintf("Size %q already exists", input.Name)), nil
		}
		return jsonError(500, "CREATE_FAILED", "Failed to create image size"), nil
	}

	// Notify that sizes changed so core can refresh its in-memory registry.
	_ = p.host.Emit(ctx, "media:sizes_changed", map[string]any{"action": "created", "name": input.Name})

	return jsonResponse(201, map[string]any{"data": created}), nil
}

// handleDeleteSize deletes an image size by name.
func (p *MediaManagerPlugin) handleDeleteSize(ctx context.Context, name string) (*pb.PluginHTTPResponse, error) {
	// Find the size by name.
	result, err := p.host.DataQuery(ctx, sizesTable, coreapi.DataStoreQuery{
		Where: map[string]any{"name": name},
		Limit: 1,
	})
	if err != nil {
		return jsonError(500, "QUERY_FAILED", "Failed to query image sizes"), nil
	}
	if result.Total == 0 || len(result.Rows) == 0 {
		return jsonError(404, "NOT_FOUND", fmt.Sprintf("Size %q not found", name)), nil
	}

	// Extract the ID from the first row.
	row := result.Rows[0]
	var sizeID uint
	switch v := row["id"].(type) {
	case float64:
		sizeID = uint(v)
	case json.Number:
		n, _ := v.Int64()
		sizeID = uint(n)
	}
	if sizeID == 0 {
		return jsonError(500, "PARSE_FAILED", "Failed to parse size ID"), nil
	}

	if err := p.host.DataDelete(ctx, sizesTable, sizeID); err != nil {
		return jsonError(500, "DELETE_FAILED", "Failed to delete image size"), nil
	}

	// Clear cache for this size.
	sizeDir := filepath.Join(p.cacheBaseDir(), name)
	_ = os.RemoveAll(sizeDir)

	return jsonResponse(200, map[string]any{"data": map[string]any{"message": fmt.Sprintf("Size %q deleted", name)}}), nil
}

// --- Cache Management ---

// cacheBaseDir returns the base directory for the image cache.
