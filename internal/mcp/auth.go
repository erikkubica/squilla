package mcp

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// authMiddleware validates the Authorization bearer token and stores the
// matching McpToken on Fiber's UserContext. The Fiber→http adaptor forwards
// UserContext as the http.Request's context, where our HTTPContextFunc picks
// it up.
func (s *Server) authMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		raw := extractBearer(c.Get("Authorization"))
		if raw == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing Authorization: Bearer <token>",
			})
		}
		tok, err := s.deps.TokenSvc.Validate(raw)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or expired token",
			})
		}

		// Propagate via UserContext so it survives the Fiber→http adaptor boundary.
		ctx := context.WithValue(c.UserContext(), ctxKeyToken, tok)
		c.SetUserContext(ctx)
		return c.Next()
	}
}

func extractBearer(h string) string {
	if h == "" {
		return ""
	}
	const prefix = "Bearer "
	if strings.HasPrefix(h, prefix) {
		return strings.TrimSpace(h[len(prefix):])
	}
	return ""
}
