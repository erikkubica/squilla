package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the per-size cache layout + the clear-cache endpoints.

func (p *MediaManagerPlugin) cacheBaseDir() string {
	return filepath.Join(p.storageDir, "cache", "images")
}

// cachePath returns the cache file path for a given size and original path.
func (p *MediaManagerPlugin) cachePath(sizeName, originalPath string) string {
	return filepath.Join(p.cacheBaseDir(), sizeName, originalPath)
}

// cacheWebPPath returns the WebP cache file path for a given size and original path.
func (p *MediaManagerPlugin) cacheWebPPath(sizeName, originalPath string) string {
	ext := filepath.Ext(originalPath)
	base := strings.TrimSuffix(originalPath, ext)
	return filepath.Join(p.cacheBaseDir(), sizeName, base+".webp")
}

// cacheExists checks whether a cached file exists at the given path.
func (p *MediaManagerPlugin) cacheExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// cacheWrite writes data to the cache path, creating directories as needed.
func (p *MediaManagerPlugin) cacheWrite(path string, data []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create cache dir: %w", err)
	}
	return os.WriteFile(path, data, 0644)
}

// getPathMutex returns a mutex for the given cache path, creating one if needed.
func (p *MediaManagerPlugin) getPathMutex(path string) *sync.Mutex {
	val, _ := p.cacheLocks.LoadOrStore(path, &sync.Mutex{})
	return val.(*sync.Mutex)
}

// handleClearAllCache clears all cached image variants.
func (p *MediaManagerPlugin) handleClearAllCache(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	if err := os.RemoveAll(p.cacheBaseDir()); err != nil {
		return jsonError(500, "CACHE_CLEAR_FAILED", "Failed to clear image cache"), nil
	}
	return jsonResponse(200, map[string]any{"data": map[string]any{"message": "Image cache cleared"}}), nil
}

// handleClearSizeCache clears cached images for a specific size.
func (p *MediaManagerPlugin) handleClearSizeCache(ctx context.Context, sizeName string) (*pb.PluginHTTPResponse, error) {
	dir := filepath.Join(p.cacheBaseDir(), sizeName)
	if err := os.RemoveAll(dir); err != nil {
		return jsonError(500, "CACHE_CLEAR_FAILED", fmt.Sprintf("Failed to clear cache for size %q", sizeName)), nil
	}
	return jsonResponse(200, map[string]any{"data": map[string]any{"message": fmt.Sprintf("Cache cleared for size %q", sizeName)}}), nil
}

// clearCacheForOriginal deletes all cached variants of an original file across all sizes.
func (p *MediaManagerPlugin) clearCacheForOriginal(ctx context.Context, originalPath string) {
	// Strip "media/" prefix if present to get the relative path.
	relPath := strings.TrimPrefix(originalPath, "media/")

	// Get all sizes to know which cache dirs to check.
	result, err := p.host.DataQuery(ctx, sizesTable, coreapi.DataStoreQuery{Limit: 100})
	if err != nil {
		return
	}
	for _, row := range result.Rows {
		name, _ := row["name"].(string)
		if name == "" {
			continue
		}
		_ = os.Remove(p.cachePath(name, relPath))
		_ = os.Remove(p.cacheWebPPath(name, relPath))
	}
}

// --- Upload Normalization ---

// normalizeImage applies upload normalization to image bytes if enabled.
// It downscales oversized images and re-encodes with optimal compression.
// Returns the (possibly modified) image bytes and MIME type.
