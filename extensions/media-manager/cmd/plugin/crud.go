package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"io"
	"log"
	"math"
	"mime"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the admin-facing media CRUD handlers: list, get,
// upload, update, delete.

func (p *MediaManagerPlugin) handleList(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	params := req.GetQueryParams()
	page, _ := strconv.Atoi(paramOr(params, "page", "1"))
	perPage, _ := strconv.Atoi(paramOr(params, "per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	mimeType := params["mime_type"]
	search := params["search"]
	sortBy := params["sort_by"]

	orderBy := "created_at DESC"
	switch sortBy {
	case "name_asc":
		orderBy = "original_name ASC"
	case "name_desc":
		orderBy = "original_name DESC"
	case "size_asc":
		orderBy = "size ASC"
	case "size_desc":
		orderBy = "size DESC"
	case "date_asc":
		orderBy = "created_at ASC"
	case "date_desc":
		orderBy = "created_at DESC"
	}

	query := coreapi.DataStoreQuery{
		OrderBy: orderBy,
		Limit:   perPage,
		Offset:  (page - 1) * perPage,
	}

	where := make(map[string]any)
	if mimeType != "" {
		if strings.Contains(mimeType, "/") {
			where["mime_type"] = mimeType
		} else {
			query.Raw = "mime_type LIKE ?"
			query.Args = []any{mimeType + "/%"}
		}
	}
	if search != "" {
		if query.Raw != "" {
			query.Raw += " AND original_name ILIKE ?"
			query.Args = append(query.Args, "%"+search+"%")
		} else {
			query.Raw = "original_name ILIKE ?"
			query.Args = []any{"%" + search + "%"}
		}
	}
	if len(where) > 0 {
		query.Where = where
	}

	result, err := p.host.DataQuery(ctx, tableName, query)
	if err != nil {
		return jsonError(500, "LIST_FAILED", "Failed to list media files"), nil
	}

	totalPages := int(math.Ceil(float64(result.Total) / float64(perPage)))
	resp := map[string]any{
		"data": result.Rows,
		"meta": map[string]any{
			"total":       result.Total,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
		},
	}

	return jsonResponse(200, resp), nil
}

// handleGet handles GET /:id — returns a single media file.
func (p *MediaManagerPlugin) handleGet(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Media file not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch media file"), nil
	}

	return jsonResponse(200, map[string]any{"data": row}), nil
}

// handleUpload handles POST /upload — multipart file upload.
func (p *MediaManagerPlugin) handleUpload(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	contentType := ""
	for k, v := range req.GetHeaders() {
		if strings.EqualFold(k, "content-type") {
			contentType = v
			break
		}
	}

	if contentType == "" {
		return jsonError(400, "NO_CONTENT_TYPE", "Missing Content-Type header"), nil
	}

	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil || !strings.HasPrefix(mediaType, "multipart/") {
		return jsonError(400, "INVALID_CONTENT_TYPE", "Expected multipart form data"), nil
	}

	boundary := params["boundary"]
	if boundary == "" {
		return jsonError(400, "NO_BOUNDARY", "Missing multipart boundary"), nil
	}

	reader := multipart.NewReader(bytes.NewReader(req.GetBody()), boundary)

	var fileData []byte
	var originalName string
	var fileMimeType string

	// Maximum upload size: 50 MB.
	const maxUploadSize = 50 * 1024 * 1024

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return jsonError(400, "PARSE_FAILED", "Failed to parse multipart data"), nil
		}

		if part.FormName() == "file" {
			originalName = part.FileName()
			fileMimeType = part.Header.Get("Content-Type")
			fileData, err = io.ReadAll(io.LimitReader(part, maxUploadSize+1))
			if err != nil {
				return jsonError(500, "READ_FAILED", "Failed to read uploaded file"), nil
			}
			if len(fileData) > maxUploadSize {
				return jsonError(400, "FILE_TOO_LARGE", "File exceeds maximum upload size of 50 MB"), nil
			}
			break
		}
		part.Close()
	}

	if fileData == nil || originalName == "" {
		return jsonError(400, "NO_FILE", "No file uploaded"), nil
	}

	// Validate MIME type: detect from content and enforce allowlist.
	detectedType := http.DetectContentType(fileData)
	if fileMimeType == "" {
		fileMimeType = detectedType
	}
	if !isAllowedMimeType(fileMimeType) {
		return jsonError(400, "INVALID_FILE_TYPE", fmt.Sprintf("File type %s is not allowed", fileMimeType)), nil
	}

	// Generate unique filename with safe extension derived from MIME type.
	now := time.Now()
	dateDir := fmt.Sprintf("%04d/%02d", now.Year(), now.Month())
	ext := safeExtension(fileMimeType, originalName)
	storedName := fmt.Sprintf("%d%s", now.UnixNano(), ext)
	storagePath := fmt.Sprintf("media/%s/%s", dateDir, storedName)

	// Track original dimensions before any processing.
	var origW, origH int
	if strings.HasPrefix(fileMimeType, "image/") && fileMimeType != "image/svg+xml" {
		if img, _, err := image.Decode(bytes.NewReader(fileData)); err == nil {
			origW = img.Bounds().Dx()
			origH = img.Bounds().Dy()
		}
	}

	// Prepare optimization tracking fields.
	originalSize := len(fileData)
	isOptimized := false
	originalBackupPath := ""
	optimizationSavings := 0

	// Normalize image before storage if enabled — but save original first.
	if strings.HasPrefix(fileMimeType, "image/") && fileMimeType != "image/svg+xml" {
		normalizedData, normalizedMime := p.normalizeImage(ctx, fileData, fileMimeType)
		// Only swap in the normalized bytes if they're smaller or the
		// encoder changed mime type (e.g. format conversion). Otherwise
		// keep the original — but still mark as optimized so the file
		// isn't re-processed forever.
		changedMime := normalizedMime != fileMimeType
		smaller := len(normalizedData) < len(fileData)
		if changedMime || smaller {
			originalBackupPath = fmt.Sprintf("media/originals/%s/%s", dateDir, storedName)
			if _, storeErr := p.host.StoreFile(ctx, originalBackupPath, fileData); storeErr != nil {
				log.Printf("[upload] failed to store original backup: %v", storeErr)
				originalBackupPath = ""
			}
			if smaller {
				optimizationSavings = len(fileData) - len(normalizedData)
			}
			fileData = normalizedData
			fileMimeType = normalizedMime
		}
		isOptimized = true
	}

	// Store the file via CoreAPI.
	publicURL, err := p.host.StoreFile(ctx, storagePath, fileData)
	if err != nil {
		return jsonError(500, "STORE_FAILED", "Failed to store file"), nil
	}

	// Create the database record.
	record := map[string]any{
		"filename":             storedName,
		"original_name":        originalName,
		"mime_type":            fileMimeType,
		"size":                 len(fileData),
		"path":                 storagePath,
		"url":                  publicURL,
		"alt":                  "",
		"is_optimized":         isOptimized,
		"original_size":        originalSize,
		"original_path":        originalBackupPath,
		"original_width":       origW,
		"original_height":      origH,
		"optimization_savings": optimizationSavings,
	}

	created, err := p.host.DataCreate(ctx, tableName, record)
	if err != nil {
		// Try to clean up the stored file and backup.
		_ = p.host.DeleteFile(ctx, storagePath)
		if originalBackupPath != "" {
			_ = p.host.DeleteFile(ctx, originalBackupPath)
		}
		return jsonError(500, "CREATE_FAILED", "Failed to create media record"), nil
	}

	return jsonResponse(201, map[string]any{"data": created}), nil
}

// handleUpdate handles PUT /:id — update alt text.
func (p *MediaManagerPlugin) handleUpdate(ctx context.Context, id uint, body []byte) (*pb.PluginHTTPResponse, error) {
	// Verify exists.
	_, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Media file not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch media file"), nil
	}

	var input struct {
		Alt          *string `json:"alt"`
		OriginalName *string `json:"original_name"`
	}
	if err := json.Unmarshal(body, &input); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	updateData := map[string]any{
		"updated_at": time.Now().Format(time.RFC3339),
	}
	if input.Alt != nil {
		updateData["alt"] = *input.Alt
	}
	if input.OriginalName != nil && *input.OriginalName != "" {
		updateData["original_name"] = *input.OriginalName
	}

	if err := p.host.DataUpdate(ctx, tableName, id, updateData); err != nil {
		return jsonError(500, "UPDATE_FAILED", "Failed to update media file"), nil
	}

	// Fetch updated record.
	row, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		return jsonError(500, "FETCH_FAILED", "Failed to fetch updated media file"), nil
	}

	return jsonResponse(200, map[string]any{"data": row}), nil
}

// handleDelete handles DELETE /:id — delete a media file.
func (p *MediaManagerPlugin) handleDelete(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, tableName, id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Media file not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch media file"), nil
	}

	// Delete the file from storage.
	if path, ok := row["path"].(string); ok && path != "" {
		_ = p.host.DeleteFile(ctx, path)

		// Clear cached image variants for this file.
		p.clearCacheForOriginal(ctx, path)
	}

	// Delete the original backup if it exists.
	if origPath, ok := row["original_path"].(string); ok && origPath != "" {
		_ = p.host.DeleteFile(ctx, origPath)
	}

	// Delete the database record.
	if err := p.host.DataDelete(ctx, tableName, id); err != nil {
		return jsonError(500, "DELETE_FAILED", "Failed to delete media file"), nil
	}

	return jsonResponse(200, map[string]any{"data": map[string]any{"message": "Media file deleted"}}), nil
}

// --- Optimizer Settings ---

// optimizerSettingKeys lists all optimizer setting keys with their default values.
var optimizerSettingDefaults = map[string]string{
	"media:optimizer:jpeg_quality":            "80",
	"media:optimizer:webp_enabled":            "true",
	"media:optimizer:webp_quality":            "75",
	"media:optimizer:normalize_enabled":       "true",
	"media:optimizer:normalize_max_dimension": "5000",
	"media:optimizer:upload_quality":          "100",
}

// handleGetOptimizerSettings returns all optimizer settings.
