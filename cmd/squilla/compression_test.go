package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
)

func newTestAppWithCompression() *fiber.App {
	app := fiber.New()
	app.Use(compress.New(compress.Config{
		Level: compress.LevelDefault,
		Next: func(c *fiber.Ctx) bool {
			return strings.HasPrefix(c.Path(), "/mcp") ||
				c.Path() == "/admin/api/events" ||
				strings.Contains(c.Get("Accept"), "text/event-stream")
		},
	}))

	// Sample payload large enough to trigger compression (> raw threshold)
	largeBody := strings.Repeat("Squilla high performance Go CMS with Brotli compression. ", 50)

	app.Get("/page", func(c *fiber.Ctx) error {
		return c.SendString(largeBody)
	})
	app.Get("/mcp/sse", func(c *fiber.Ctx) error {
		return c.SendString(largeBody)
	})
	app.Get("/admin/api/events", func(c *fiber.Ctx) error {
		return c.SendString(largeBody)
	})
	app.Get("/stream", func(c *fiber.Ctx) error {
		return c.SendString(largeBody)
	})

	return app
}

func TestCompression_Brotli(t *testing.T) {
	app := newTestAppWithCompression()

	req := httptest.NewRequest(http.MethodGet, "/page", nil)
	req.Header.Set("Accept-Encoding", "br, gzip, deflate")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test failed: %v", err)
	}
	defer resp.Body.Close()

	encoding := resp.Header.Get("Content-Encoding")
	if encoding != "br" {
		t.Errorf("expected Content-Encoding 'br', got %q", encoding)
	}
}

func TestCompression_Gzip(t *testing.T) {
	app := newTestAppWithCompression()

	req := httptest.NewRequest(http.MethodGet, "/page", nil)
	req.Header.Set("Accept-Encoding", "gzip")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test failed: %v", err)
	}
	defer resp.Body.Close()

	encoding := resp.Header.Get("Content-Encoding")
	if encoding != "gzip" {
		t.Errorf("expected Content-Encoding 'gzip', got %q", encoding)
	}
}

func TestCompression_BypassesStreamingRoutes(t *testing.T) {
	app := newTestAppWithCompression()

	cases := []struct {
		name       string
		path       string
		acceptHdr  string
	}{
		{
			name:      "MCP route bypassed",
			path:      "/mcp/sse",
			acceptHdr: "br, gzip",
		},
		{
			name:      "Admin events route bypassed",
			path:      "/admin/api/events",
			acceptHdr: "br, gzip",
		},
		{
			name:      "Accept text/event-stream bypassed",
			path:      "/stream",
			acceptHdr: "text/event-stream",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			req.Header.Set("Accept-Encoding", "br, gzip")
			if tc.acceptHdr != "" {
				req.Header.Set("Accept", tc.acceptHdr)
			}

			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("app.Test failed: %v", err)
			}
			defer resp.Body.Close()

			encoding := resp.Header.Get("Content-Encoding")
			if encoding != "" {
				t.Errorf("expected uncompressed response (empty Content-Encoding), got %q", encoding)
			}

			body, _ := io.ReadAll(resp.Body)
			if !strings.HasPrefix(string(body), "Squilla high performance") {
				t.Errorf("expected raw plain text body on streaming route, got unexpected content")
			}
		})
	}
}
