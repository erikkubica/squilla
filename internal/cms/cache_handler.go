package cms

import (
	"github.com/gofiber/fiber/v2"

	"vibecms/internal/api"
)

// CacheHandler provides admin API endpoints for cache management.
type CacheHandler struct {
	publicHandler *PublicHandler
}

// NewCacheHandler creates a new CacheHandler.
func NewCacheHandler(ph *PublicHandler) *CacheHandler {
	return &CacheHandler{publicHandler: ph}
}

// RegisterRoutes registers cache management routes.
func (h *CacheHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/cache/clear", h.ClearAll)
	router.Get("/cache/stats", h.Stats)
}

// ClearAll handles POST /cache/clear — clears all template and data caches.
func (h *CacheHandler) ClearAll(c *fiber.Ctx) error {
	h.publicHandler.ClearCache()
	return api.Success(c, fiber.Map{"message": "All caches cleared"})
}

// Stats handles GET /cache/stats — returns cache statistics.
func (h *CacheHandler) Stats(c *fiber.Ctx) error {
	stats := h.publicHandler.CacheStats()
	return api.Success(c, stats)
}
