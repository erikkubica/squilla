package main

import (
	"context"
	"fmt"
	"hash/fnv"
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

// cacheFullWebPPath returns the full-size WebP copy of an original that the
// public /media/ route serves to browsers accepting WebP.
func (p *MediaManagerPlugin) cacheFullWebPPath(originalPath string) string {
	return filepath.Join(p.cacheBaseDir(), "_webp", originalPath+".webp")
}

// sizeCacheDir returns the cache directory of one size. ok is false for a
// name that would point outside the cache (empty, "..", or with a slash).
func (p *MediaManagerPlugin) sizeCacheDir(sizeName string) (dir string, ok bool) {
	if sizeName == "" || sizeName == "." || strings.Contains(sizeName, "..") || strings.ContainsAny(sizeName, `/\`) {
		return "", false
	}
	return filepath.Join(p.cacheBaseDir(), sizeName), true
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

// cacheLockStripes is the number of mutexes cache generation is spread
// over. A fixed array keeps memory bounded no matter how many distinct
// paths anonymous visitors request.
const cacheLockStripes = 256

// getPathMutex returns the mutex guarding generation of the given cache
// path. Paths hash onto a fixed set of stripes, so two paths may share a
// lock; that only serialises their generation.
func (p *MediaManagerPlugin) getPathMutex(path string) *sync.Mutex {
	h := fnv.New32a()
	_, _ = h.Write([]byte(path))
	return &p.cacheLocks[h.Sum32()%cacheLockStripes]
}

// failedConversions remembers originals whose resize / WebP conversion
// failed, so public requests don't re-run the decode on every hit. Keys
// are only added for originals that exist on disk, and the map is reset
// when it grows past maxFailedConversions.
const maxFailedConversions = 10_000

func (p *MediaManagerPlugin) conversionFailed(key string) bool {
	p.failedMu.Lock()
	defer p.failedMu.Unlock()
	_, ok := p.failed[key]
	return ok
}

func (p *MediaManagerPlugin) markConversionFailed(key string) {
	p.failedMu.Lock()
	defer p.failedMu.Unlock()
	if p.failed == nil || len(p.failed) >= maxFailedConversions {
		p.failed = make(map[string]struct{})
	}
	p.failed[key] = struct{}{}
}

// forgetConversionFailures drops negative-cache entries, e.g. after the
// cache is cleared or an original is replaced.
func (p *MediaManagerPlugin) forgetConversionFailures() {
	p.failedMu.Lock()
	p.failed = nil
	p.failedMu.Unlock()
}

// handleClearAllCache clears all cached image variants.
func (p *MediaManagerPlugin) handleClearAllCache(ctx context.Context) (*pb.PluginHTTPResponse, error) {
	p.forgetConversionFailures()
	if err := os.RemoveAll(p.cacheBaseDir()); err != nil {
		return jsonError(500, "CACHE_CLEAR_FAILED", "Failed to clear image cache"), nil
	}
	return jsonResponse(200, map[string]any{"data": map[string]any{"message": "Image cache cleared"}}), nil
}

// handleClearSizeCache clears cached images for a specific size.
func (p *MediaManagerPlugin) handleClearSizeCache(ctx context.Context, sizeName string) (*pb.PluginHTTPResponse, error) {
	dir, ok := p.sizeCacheDir(sizeName)
	if !ok {
		return jsonError(400, "INVALID_SIZE", "Invalid size name"), nil
	}
	if err := os.RemoveAll(dir); err != nil {
		return jsonError(500, "CACHE_CLEAR_FAILED", fmt.Sprintf("Failed to clear cache for size %q", sizeName)), nil
	}
	return jsonResponse(200, map[string]any{"data": map[string]any{"message": fmt.Sprintf("Cache cleared for size %q", sizeName)}}), nil
}

// clearCacheForOriginal deletes every cached copy of an original file. Call
// it whenever an original's bytes change or it's deleted: the public routes
// serve cached copies without looking at the original again.
func (p *MediaManagerPlugin) clearCacheForOriginal(ctx context.Context, originalPath string) {
	p.clearCacheForOriginals(ctx, []string{originalPath})
}

// clearCacheForOriginals is clearCacheForOriginal for several originals,
// looking up the registered sizes once.
func (p *MediaManagerPlugin) clearCacheForOriginals(ctx context.Context, originalPaths []string) {
	if len(originalPaths) == 0 {
		return
	}
	var sizeNames []string
	if result, err := p.host.DataQuery(ctx, sizesTable, coreapi.DataStoreQuery{Limit: 100}); err == nil && result != nil {
		for _, row := range result.Rows {
			if name, _ := row["name"].(string); name != "" {
				sizeNames = append(sizeNames, name)
			}
		}
	}
	// Without the size list the per-size copies can't be located, but the
	// full-size WebP copy still can.
	p.removeCachedCopies(originalPaths, sizeNames)
}

// removeCachedCopies deletes, for each original (a storage path such as
// "media/2026/03/photo.jpg"), its variant and WebP variant in every given
// size plus its full-size WebP copy.
func (p *MediaManagerPlugin) removeCachedCopies(originalPaths, sizeNames []string) {
	p.forgetConversionFailures()
	for _, originalPath := range originalPaths {
		relPath := strings.TrimPrefix(originalPath, "media/")
		if relPath == "" || strings.Contains(relPath, "..") {
			continue
		}
		for _, name := range sizeNames {
			if _, ok := p.sizeCacheDir(name); !ok {
				continue
			}
			_ = os.Remove(p.cachePath(name, relPath))
			_ = os.Remove(p.cacheWebPPath(name, relPath))
		}
		_ = os.Remove(p.cacheFullWebPPath(relPath))
	}
}

// --- Upload Normalization ---

// normalizeImage applies upload normalization to image bytes if enabled.
// It downscales oversized images and re-encodes with optimal compression.
// Returns the (possibly modified) image bytes and MIME type.
