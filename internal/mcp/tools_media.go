package mcp

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"mime"
	"net/http"
	"path"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"

	"vibecms/internal/coreapi"
)

func (s *Server) registerMediaTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.media.get",
		mcp.WithDescription("Fetch a single media file record by ID."),
		mcp.WithNumber("id", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetMedia(ctx, uintArg(args, "id"))
	})

	s.addTool(mcp.NewTool("core.media.query",
		mcp.WithDescription("Search media by mime_type or filename substring."),
		mcp.WithString("mime_type"),
		mcp.WithString("search"),
		mcp.WithNumber("limit"),
		mcp.WithNumber("offset"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.QueryMedia(ctx, coreapi.MediaQuery{
			MimeType: stringArg(args, "mime_type"),
			Search:   stringArg(args, "search"),
			Limit:    clampLimit(intArg(args, "limit")),
			Offset:   intArg(args, "offset"),
		})
	})

	s.addTool(mcp.NewTool("core.media.upload",
		mcp.WithDescription("Upload a media file (image, video, doc) and register it in the media library. Returns {id, url, slug, ...} — reference by slug in theme-portable content.\n\nUse when: attaching an image/file to a node, hero, gallery, etc.\nDO NOT use when: storing arbitrary files with no URL/DB record — use core.files.store. Importing a theme-packaged asset — theme activation handles that automatically.\n\nBody must be base64-encoded. Max size limits apply per storage backend."),
		mcp.WithString("filename", mcp.Required()),
		mcp.WithString("mime_type", mcp.Required()),
		mcp.WithString("body_base64", mcp.Required(), mcp.Description("base64-encoded file body")),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		raw, err := base64.StdEncoding.DecodeString(stringArg(args, "body_base64"))
		if err != nil {
			return nil, fmt.Errorf("decode body_base64: %w", err)
		}
		return api.UploadMedia(ctx, coreapi.MediaUploadRequest{
			Filename: stringArg(args, "filename"),
			MimeType: stringArg(args, "mime_type"),
			Body:     bytes.NewReader(raw),
		})
	})

	s.addTool(mcp.NewTool("core.media.import_url",
		mcp.WithDescription("Download a file from a public URL and store it in the media library. Returns the stored MediaFile — use its id and url when populating image/file/gallery fields so you reference real assets instead of guessing paths. Filename and mime_type are inferred from the response when not provided."),
		mcp.WithString("url", mcp.Required(), mcp.Description("Absolute http(s) URL of the asset to import")),
		mcp.WithString("filename", mcp.Description("Override filename; defaults to URL basename")),
		mcp.WithString("mime_type", mcp.Description("Override mime; defaults to response Content-Type")),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		src := stringArg(args, "url")
		if src == "" {
			return nil, fmt.Errorf("url is required")
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, src, nil)
		if err != nil {
			return nil, fmt.Errorf("build request: %w", err)
		}
		req.Header.Set("User-Agent", "VibeCMS-MCP/1.0")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("fetch: %w", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return nil, fmt.Errorf("fetch returned status %d", resp.StatusCode)
		}
		buf := new(bytes.Buffer)
		if _, err := buf.ReadFrom(resp.Body); err != nil {
			return nil, fmt.Errorf("read body: %w", err)
		}

		filename := stringArg(args, "filename")
		if filename == "" {
			if idx := strings.Index(src, "?"); idx >= 0 {
				filename = path.Base(src[:idx])
			} else {
				filename = path.Base(src)
			}
			if filename == "" || filename == "." || filename == "/" {
				filename = "import"
			}
		}

		mimeType := stringArg(args, "mime_type")
		if mimeType == "" {
			ct := resp.Header.Get("Content-Type")
			if ct != "" {
				if parsed, _, perr := mime.ParseMediaType(ct); perr == nil {
					mimeType = parsed
				} else {
					mimeType = ct
				}
			}
		}
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		return api.UploadMedia(ctx, coreapi.MediaUploadRequest{
			Filename: filename,
			MimeType: mimeType,
			Body:     bytes.NewReader(buf.Bytes()),
		})
	})

	s.addTool(mcp.NewTool("core.media.delete",
		mcp.WithDescription("Delete a media file by ID. Does not affect nodes referencing it — they will show broken images."),
		mcp.WithNumber("id", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.DeleteMedia(ctx, uintArg(args, "id"))
		return map[string]any{"ok": err == nil}, err
	})
}
