package mcp

import (
	"context"
	"encoding/base64"
	"fmt"
	"path"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
)

// mcpFilesDir is the only subdirectory of storage/ that core.files.* may
// touch. Without it, a content token could drop .html/.svg into the
// web-served storage/media tree (stored XSS on the admin origin) or delete
// any media file out from under the media library.
const mcpFilesDir = "mcp"

// mcpFileExtensions is the allow-list of file types core.files.store may
// write. Anything that a browser could execute or render as a document
// (html, svg, js, xml, xhtml, php, ...) is excluded by omission.
var mcpFileExtensions = map[string]bool{
	".txt": true, ".md": true, ".json": true, ".csv": true, ".log": true,
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true, ".avif": true, ".ico": true,
	".pdf": true, ".zip": true,
	".woff": true, ".woff2": true, ".ttf": true, ".otf": true,
	".mp3": true, ".wav": true, ".ogg": true, ".mp4": true, ".webm": true,
}

// confineMCPFilePath maps a caller path onto storage/mcp/... It accepts
// either "foo/bar.png" or "mcp/foo/bar.png", rejects absolute paths, any
// ".." segment, backslashes and NUL bytes, and returns the cleaned
// storage-relative path.
func confineMCPFilePath(p string) (string, error) {
	if p == "" {
		return "", fmt.Errorf("path is required")
	}
	if strings.ContainsAny(p, "\\\x00") {
		return "", fmt.Errorf("path must use forward slashes and contain no NUL bytes")
	}
	if strings.HasPrefix(p, "/") {
		return "", fmt.Errorf("path must be relative (it is stored under storage/%s/)", mcpFilesDir)
	}
	for _, seg := range strings.Split(p, "/") {
		if seg == ".." {
			return "", fmt.Errorf("path traversal not allowed")
		}
	}
	clean := path.Clean(p)
	if clean == "." || clean == mcpFilesDir {
		return "", fmt.Errorf("path must name a file")
	}
	if !strings.HasPrefix(clean, mcpFilesDir+"/") {
		clean = mcpFilesDir + "/" + clean
	}
	return clean, nil
}

func (s *Server) registerFilesTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.files.store",
		mcp.WithDescription("Store a scratch file under storage/mcp/ (the path is relative to that directory; a leading 'mcp/' is accepted). Allowed types: txt, md, json, csv, log, png, jpg, jpeg, gif, webp, avif, ico, pdf, zip, woff, woff2, ttf, otf, mp3, wav, ogg, mp4, webm — no html/svg/js/xml. Returns the stored path. Use core.media.upload for anything that needs a media-library record and public URL."),
		mcp.WithString("path", mcp.Required()),
		mcp.WithString("body_base64", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		rel, err := confineMCPFilePath(stringArg(args, "path"))
		if err != nil {
			return nil, err
		}
		ext := strings.ToLower(path.Ext(rel))
		if !mcpFileExtensions[ext] {
			return nil, fmt.Errorf("file type %q is not allowed for core.files.store", ext)
		}
		raw, err := base64.StdEncoding.DecodeString(stringArg(args, "body_base64"))
		if err != nil {
			return nil, fmt.Errorf("decode body_base64: invalid base64")
		}
		stored, err := api.StoreFile(ctx, rel, raw)
		return map[string]any{"path": stored}, err
	})

	s.addTool(mcp.NewTool("core.files.delete",
		mcp.WithDescription("Delete a file previously stored with core.files.store (path relative to storage/mcp/). Cannot delete media-library files — use core.media.delete."),
		mcp.WithString("path", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		rel, err := confineMCPFilePath(stringArg(args, "path"))
		if err != nil {
			return nil, err
		}
		err = api.DeleteFile(ctx, rel)
		return map[string]any{"ok": err == nil}, err
	})
}
