package main

import (
	"errors"
	"fmt"
	"log"
	"path"
	"path/filepath"
	"runtime/debug"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/utils"

	"squilla/internal/api"
	"squilla/internal/auth"
	"squilla/internal/logging"
)

// adminCSP is sent as Content-Security-Policy-Report-Only on the admin
// shell HTML. It is report-only because it has not been verified against
// a real browser session: index.html carries an inline import map,
// extension micro-frontends load from /admin and /extensions, and the
// block/form preview iframes (srcdoc, which inherits this policy) load
// cdn.tailwindcss.com plus arbitrary theme <head> assets. Promote it to
// an enforcing Content-Security-Policy once a browser run shows no
// violations for the shell + bundled extensions.
const adminCSP = "default-src 'self'; " +
	"script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
	"style-src 'self' 'unsafe-inline' https:; " +
	"img-src 'self' data: blob: https:; " +
	"font-src 'self' data: https:; " +
	"connect-src 'self'; " +
	"frame-src 'self' blob: data:; " +
	"object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"

// securityHeaders sets baseline response headers on every response.
// X-Frame-Options is SAMEORIGIN (not DENY) because the admin visual
// editor and preview frame same-origin pages (/admin/api/nodes/:id/preview,
// srcdoc previews). No CSP is set on the public site: themes rely on
// inline scripts and third-party embeds.
func securityHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("X-Frame-Options", "SAMEORIGIN")
		if auth.IsSecureRequest(c) {
			c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		p := c.Path()
		if (p == "/admin" || strings.HasPrefix(p, "/admin/")) && !strings.HasPrefix(p, "/admin/api") {
			c.Set("Content-Security-Policy-Report-Only", adminCSP)
		}
		return c.Next()
	}
}

// isAPIPath reports whether a request expects the JSON error envelope.
func isAPIPath(p string) bool {
	return strings.HasPrefix(p, "/admin/api") || strings.HasPrefix(p, "/api/") ||
		p == "/api" || strings.HasPrefix(p, "/mcp") || p == "/me" || strings.HasPrefix(p, "/me/") ||
		strings.HasPrefix(p, "/auth/")
}

// errorHandler replaces Fiber's default, which writes err.Error() — panic
// text, SQL errors, file paths — straight to the client. *fiber.Error
// keeps its status and message (those are deliberate, e.g. 404 / 405 /
// 413); everything else is logged with the request id and answered with a
// generic message: the standard api.Error envelope on API paths, a plain
// HTML page elsewhere.
func errorHandler(c *fiber.Ctx, err error) error {
	status := fiber.StatusInternalServerError
	msg := "An unexpected error occurred"
	code := "INTERNAL_ERROR"
	var fe *fiber.Error
	if errors.As(err, &fe) {
		status = fe.Code
		msg = fe.Message
		code = strings.ToUpper(strings.ReplaceAll(fiberStatusText(status), " ", "_"))
	} else {
		logging.FromFiber(c).Error("unhandled_error", "method", c.Method(), "path", c.Path(), "error", err.Error())
	}
	if isAPIPath(c.Path()) {
		return api.Error(c, status, code, msg)
	}
	c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
	return c.Status(status).SendString(fmt.Sprintf(
		"<!doctype html><html><head><meta charset=\"utf-8\"><title>%d</title></head><body><h1>%d</h1><p>%s</p></body></html>",
		status, status, htmlEscape(msg)))
}

func fiberStatusText(code int) string {
	if t := utils.StatusMessage(code); t != "" {
		return t
	}
	return "Error"
}

func htmlEscape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", `"`, "&quot;", "'", "&#39;")
	return r.Replace(s)
}

// recoverMiddleware turns panics into errors for errorHandler and logs the
// stack trace with the request id (the default recover config drops it).
func recoverMiddleware() fiber.Handler {
	return recover.New(recover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c *fiber.Ctx, e interface{}) {
			log.Printf("panic request_id=%s %s %s: %v\n%s",
				logging.RequestIDFromFiber(c), c.Method(), c.Path(), e, debug.Stack())
		},
	})
}

// inlineSafeMediaExts are served inline by the /media fallback; anything
// else (html, svg, xml, js, unknown) is forced to download so an uploaded
// file can't execute script in the site origin.
var inlineSafeMediaExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".avif": true,
	".bmp": true, ".ico": true,
	".mp4": true, ".webm": true, ".ogg": true, ".ogv": true, ".mov": true, ".m4v": true,
	".mp3": true, ".wav": true, ".m4a": true, ".aac": true, ".flac": true, ".oga": true,
	".pdf": true,
}

// mediaFallbackHeaders guards the app.Static("/media") fallback used when
// the media-manager extension is not active.
// It mirrors media-manager's public_serve.go: originals/ (pre-optimisation
// uploads) is never public, SVGs and forced downloads get the sandbox CSP.
func mediaFallbackHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		rel := strings.ToLower(strings.TrimPrefix(path.Clean("/"+c.Path()), "/media"))
		if rel == "/originals" || strings.HasPrefix(rel, "/originals/") {
			return c.SendStatus(fiber.StatusNotFound)
		}
		c.Set("X-Content-Type-Options", "nosniff")
		// SVG is not in inlineSafeMediaExts, so it lands here too: the
		// fallback is stricter than the plugin and downloads it.
		if !inlineSafeMediaExts[strings.ToLower(filepath.Ext(c.Path()))] {
			c.Set("Content-Disposition", "attachment")
			c.Set("Content-Security-Policy", mediaSandboxCSP)
		}
		return c.Next()
	}
}

// mediaSandboxCSP keeps an SVG or downloaded file from running script or
// loading anything if a browser renders it anyway; inline styles stay
// allowed so SVGs still render. Same value as media-manager's sandboxCSP.
const mediaSandboxCSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
