package cms

import (
	"strconv"
	"time"

	"vibecms/internal/api"
	"vibecms/internal/auth"
	"vibecms/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// MediaHandler provides HTTP handlers for media file management.
type MediaHandler struct {
	db *gorm.DB
}

// NewMediaHandler creates a new MediaHandler.
func NewMediaHandler(db *gorm.DB) *MediaHandler {
	return &MediaHandler{db: db}
}

// RegisterRoutes registers all admin API media routes on the provided router group.
func (h *MediaHandler) RegisterRoutes(router fiber.Router) {
	g := router.Group("/media", auth.CapabilityRequired("manage_content"))
	g.Get("/", h.List)
	g.Get("/:id", h.Get)
	g.Post("/upload", h.Upload)
	g.Put("/:id", h.Update)
	g.Delete("/:id", h.Delete)
}

// List handles GET /media — returns paginated media files.
func (h *MediaHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	mimeType := c.Query("mime_type")
	search := c.Query("search")

	query := h.db.Model(&models.MediaFile{})
	if mimeType != "" {
		query = query.Where("mime_type LIKE ?", mimeType+"%")
	}
	if search != "" {
		query = query.Where("original_name ILIKE ?", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var files []models.MediaFile
	offset := (page - 1) * perPage
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&files).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "LIST_FAILED", "Failed to list media files")
	}

	return api.Paginated(c, files, total, page, perPage)
}

// Get handles GET /media/:id — returns a single media file.
func (h *MediaHandler) Get(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid media file ID")
	}

	var file models.MediaFile
	if err := h.db.First(&file, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Media file not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch media file")
	}

	return api.Success(c, file)
}

// Upload handles POST /media/upload — multipart file upload.
func (h *MediaHandler) Upload(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "NO_FILE", "No file uploaded")
	}

	// Detect MIME type from the uploaded file header.
	mimeType := fileHeader.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	// Generate a unique stored filename.
	storedName := generateStoredFilename(fileHeader.Filename)
	storagePath := "uploads/" + storedName

	// Save to local storage.
	if err := c.SaveFile(fileHeader, "storage/"+storagePath); err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "SAVE_FAILED", "Failed to save uploaded file")
	}

	mediaFile := models.MediaFile{
		Filename:     storedName,
		OriginalName: fileHeader.Filename,
		MimeType:     mimeType,
		Size:         fileHeader.Size,
		Path:         storagePath,
		URL:          "/storage/" + storagePath,
	}

	if err := h.db.Create(&mediaFile).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "CREATE_FAILED", "Failed to create media record")
	}

	return api.Created(c, mediaFile)
}

// Update handles PUT /media/:id — update metadata (alt text).
func (h *MediaHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid media file ID")
	}

	var file models.MediaFile
	if err := h.db.First(&file, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Media file not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch media file")
	}

	var body struct {
		Alt string `json:"alt"`
	}
	if err := c.BodyParser(&body); err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	file.Alt = body.Alt
	if err := h.db.Save(&file).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "UPDATE_FAILED", "Failed to update media file")
	}

	return api.Success(c, file)
}

// Delete handles DELETE /media/:id — delete a media file.
func (h *MediaHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return api.Error(c, fiber.StatusBadRequest, "INVALID_ID", "Invalid media file ID")
	}

	var file models.MediaFile
	if err := h.db.First(&file, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return api.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Media file not found")
		}
		return api.Error(c, fiber.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch media file")
	}

	if err := h.db.Delete(&file).Error; err != nil {
		return api.Error(c, fiber.StatusInternalServerError, "DELETE_FAILED", "Failed to delete media file")
	}

	return api.Success(c, fiber.Map{"message": "Media file deleted"})
}

// generateStoredFilename creates a unique filename for storage.
func generateStoredFilename(original string) string {
	ext := ""
	for i := len(original) - 1; i >= 0; i-- {
		if original[i] == '.' {
			ext = original[i:]
			break
		}
	}

	// Use timestamp + random suffix for uniqueness.
	return strconv.FormatInt(timeNowUnixNano(), 36) + ext
}

// timeNowUnixNano returns the current time in nanoseconds (extracted for testability).
var timeNowUnixNano = func() int64 {
	return time.Now().UnixNano()
}
