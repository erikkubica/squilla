package coreapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/textproto"
	"net/url"
	"strconv"
	"time"

	"squilla/internal/cms"
	pb "squilla/pkg/plugin/proto"
)

// pluginMediaProvider speaks to whichever extension currently owns the
// "media-provider" tag. Operations are routed through the plugin's
// HandleHTTPRequest surface — the same path the admin UI uses — so a
// kernel-side caller (CoreAPI) and a browser caller traverse the same
// validation, normalisation, and optimisation pipeline. Without this
// shared codepath, MCP / Tengo uploads would silently bypass the
// extension's WebP conversion and original-backup logic.
//
// Lives in the coreapi package because cms.PluginManager doesn't import
// coreapi (the bridge can only flow one direction without creating a
// cycle). Having the bridge here keeps the dependency arrow pointed at
// kernel surfaces — extensions never import this code; only main.go
// wiring touches it.
type pluginMediaProvider struct {
	getPM func() *cms.PluginManager
}

func (p *pluginMediaProvider) pluginManager() *cms.PluginManager {
	if p.getPM == nil {
		return nil
	}
	return p.getPM()
}

// NewMediaProviderResolver hands CoreAPI a thunk that locates the
// current provider on every call. Resolving lazily (rather than capturing
// a single client at boot) lets operators activate a custom provider at
// runtime without bouncing the process — a feature the user explicitly
// asked for when choosing the "multi-provider, anyone can replace the
// official one" design.
//
// The plugin manager is supplied via a getter rather than the manager
// itself because wiring order in main.go puts CoreAPI construction
// before plugin manager construction — the plugin manager's host
// service registrar callback needs the guarded CoreAPI, which in turn
// wraps this resolver. The getter lets the closure capture a variable
// that's assigned later in the boot sequence; calls before assignment
// safely return "no provider".
func NewMediaProviderResolver(getPM func() *cms.PluginManager) MediaProviderResolver {
	provider := &pluginMediaProvider{getPM: getPM}
	return func() MediaProvider {
		pm := provider.pluginManager()
		if pm == nil || !pm.HasProvider("media-provider") {
			return nil
		}
		return provider
	}
}

func (p *pluginMediaProvider) Upload(ctx context.Context, req MediaUploadRequest) (*MediaFile, error) {
	pm := p.pluginManager()
	if pm == nil {
		return nil, NewInternal("media provider unavailable")
	}
	client := pm.GetProvider("media-provider")
	if client == nil {
		return nil, NewInternal("media provider deactivated mid-call")
	}

	body, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, NewInternal("read upload body: " + err.Error())
	}

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	hdr := make(textproto.MIMEHeader)
	hdr.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, req.Filename))
	if req.MimeType != "" {
		hdr.Set("Content-Type", req.MimeType)
	}
	part, err := mw.CreatePart(hdr)
	if err != nil {
		return nil, NewInternal("multipart create: " + err.Error())
	}
	if _, err := part.Write(body); err != nil {
		return nil, NewInternal("multipart write: " + err.Error())
	}
	if err := mw.Close(); err != nil {
		return nil, NewInternal("multipart close: " + err.Error())
	}

	resp, err := client.HandleHTTPRequest(&pb.PluginHTTPRequest{
		Method:      "POST",
		Path:        "/upload",
		Headers:     map[string]string{"Content-Type": mw.FormDataContentType()},
		Body:        buf.Bytes(),
		QueryParams: map[string]string{},
		PathParams:  map[string]string{"path": "upload"},
	})
	if err != nil {
		return nil, NewInternal("media provider upload: " + err.Error())
	}
	return parseMediaFileResponse(resp)
}

func (p *pluginMediaProvider) Get(ctx context.Context, id uint) (*MediaFile, error) {
	pm := p.pluginManager()
	if pm == nil {
		return nil, NewInternal("media provider unavailable")
	}
	client := pm.GetProvider("media-provider")
	if client == nil {
		return nil, NewInternal("media provider deactivated mid-call")
	}
	idStr := strconv.FormatUint(uint64(id), 10)
	resp, err := client.HandleHTTPRequest(&pb.PluginHTTPRequest{
		Method:      "GET",
		Path:        "/" + idStr,
		Headers:     map[string]string{},
		QueryParams: map[string]string{},
		PathParams:  map[string]string{"id": idStr},
	})
	if err != nil {
		return nil, NewInternal("media provider get: " + err.Error())
	}
	if resp.StatusCode == 404 {
		return nil, NewNotFound("media_file", id)
	}
	return parseMediaFileResponse(resp)
}

func (p *pluginMediaProvider) Query(ctx context.Context, query MediaQuery) ([]*MediaFile, error) {
	pm := p.pluginManager()
	if pm == nil {
		return nil, NewInternal("media provider unavailable")
	}
	client := pm.GetProvider("media-provider")
	if client == nil {
		return nil, NewInternal("media provider deactivated mid-call")
	}
	q := url.Values{}
	if query.MimeType != "" {
		q.Set("mime_type", query.MimeType)
	}
	if query.Search != "" {
		q.Set("search", query.Search)
	}
	if query.Limit > 0 {
		q.Set("per_page", strconv.Itoa(query.Limit))
	}
	if query.Offset > 0 {
		// Translate offset → page since the extension paginates.
		page := 1
		if query.Limit > 0 {
			page = query.Offset/query.Limit + 1
		}
		q.Set("page", strconv.Itoa(page))
	}

	resp, err := client.HandleHTTPRequest(&pb.PluginHTTPRequest{
		Method:      "GET",
		Path:        "/",
		Headers:     map[string]string{},
		QueryParams: queryValuesToMap(q),
		PathParams:  map[string]string{},
	})
	if err != nil {
		return nil, NewInternal("media provider query: " + err.Error())
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, NewInternal(fmt.Sprintf("media provider returned %d: %s", resp.StatusCode, string(resp.Body)))
	}
	var envelope struct {
		Data []map[string]any `json:"data"`
	}
	if err := json.Unmarshal(resp.Body, &envelope); err != nil {
		return nil, NewInternal("media provider response not JSON: " + err.Error())
	}
	out := make([]*MediaFile, 0, len(envelope.Data))
	for _, row := range envelope.Data {
		out = append(out, mediaFileFromRow(row))
	}
	return out, nil
}

func (p *pluginMediaProvider) Delete(ctx context.Context, id uint) error {
	pm := p.pluginManager()
	if pm == nil {
		return NewInternal("media provider unavailable")
	}
	client := pm.GetProvider("media-provider")
	if client == nil {
		return NewInternal("media provider deactivated mid-call")
	}
	idStr := strconv.FormatUint(uint64(id), 10)
	resp, err := client.HandleHTTPRequest(&pb.PluginHTTPRequest{
		Method:      "DELETE",
		Path:        "/" + idStr,
		Headers:     map[string]string{},
		QueryParams: map[string]string{},
		PathParams:  map[string]string{"id": idStr},
	})
	if err != nil {
		return NewInternal("media provider delete: " + err.Error())
	}
	if resp.StatusCode == 404 {
		return NewNotFound("media_file", id)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return NewInternal(fmt.Sprintf("media provider returned %d: %s", resp.StatusCode, string(resp.Body)))
	}
	return nil
}

// parseMediaFileResponse turns the extension's JSON envelope ({"data":
// {...}}) into a MediaFile DTO. The extension wraps single-row
// responses for admin-UI consistency; we unwrap here so kernel callers
// see the canonical shape.
func parseMediaFileResponse(resp *pb.PluginHTTPResponse) (*MediaFile, error) {
	if resp == nil {
		return nil, NewInternal("media provider returned nil response")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, NewInternal(fmt.Sprintf("media provider returned %d: %s", resp.StatusCode, string(resp.Body)))
	}
	var out map[string]any
	if err := json.Unmarshal(resp.Body, &out); err != nil {
		return nil, NewInternal("media provider response not JSON: " + err.Error())
	}
	row := out
	if data, ok := out["data"].(map[string]any); ok {
		row = data
	}
	return mediaFileFromRow(row), nil
}

func mediaFileFromRow(row map[string]any) *MediaFile {
	return &MediaFile{
		ID:        toUintAny(row["id"]),
		Filename:  toStringAny(row["original_name"]),
		MimeType:  toStringAny(row["mime_type"]),
		Size:      toInt64Any(row["size"]),
		URL:       toStringAny(row["url"]),
		CreatedAt: toTimeAny(row["created_at"]),
	}
}

func queryValuesToMap(q url.Values) map[string]string {
	out := make(map[string]string, len(q))
	for k, v := range q {
		if len(v) > 0 {
			out[k] = v[0]
		}
	}
	return out
}

func toUintAny(v any) uint {
	switch n := v.(type) {
	case float64:
		return uint(n)
	case int:
		return uint(n)
	case int64:
		return uint(n)
	case json.Number:
		i, _ := n.Int64()
		return uint(i)
	}
	return 0
}

func toStringAny(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func toInt64Any(v any) int64 {
	switch n := v.(type) {
	case float64:
		return int64(n)
	case int:
		return int64(n)
	case int64:
		return n
	case json.Number:
		i, _ := n.Int64()
		return i
	}
	return 0
}

func toTimeAny(v any) time.Time {
	if s, ok := v.(string); ok && s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			return t
		}
	}
	return time.Time{}
}
