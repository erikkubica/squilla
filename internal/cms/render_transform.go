package cms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"regexp"
	"sort"
	"strings"
	"time"

	"squilla/internal/models"
	pb "squilla/pkg/plugin/proto"

	"github.com/gofiber/fiber/v2"
)

// render.transform lets an extension rewrite the final HTML of a public
// page. It is generic: the kernel knows nothing about what a transformer
// does. An extension opts in by declaring the "render:transform"
// capability and subscribing to the event.
//
// Contract, per anonymous or signed-in public page render:
//   - the plugin gets {html, path, node, user, gpc, cookies, markers} as JSON
//     with a short deadline;
//   - Handled=true + Result = the new HTML (empty Result = unchanged);
//   - Handled=false = "I am inactive": the kernel stops calling that
//     plugin for transformSkip, so an idle transformer costs nothing;
//   - any error, timeout or empty/oversized result keeps the previous HTML
//     (fail-open).
//
// Block boundaries are marked with <!--sqx:b:<i>:<slug>--> … <!--sqx:/b-->
// around each page block and <!--sqx:p:<slug>--> … <!--sqx:/p--> around each
// layout block / partial, only while a transformer is active. The kernel
// strips every remaining marker before sending the page. Previews
// (RenderNodePreview) never run transformers.
const (
	transformEvent      = "render.transform"
	transformCapability = "render:transform"
	transformDeadline   = 50 * time.Millisecond
	transformSkip       = 30 * time.Second
	transformMaxGrowth  = 4 // result larger than 4x the input is rejected
)

// TransformRequest is what the kernel knows about the page being sent.
type TransformRequest struct {
	HTML     string
	Path     string
	Host     string
	NodeID   int
	NodeType string
	Language string
	Is404    bool
	UserID   int
	Role     string
	GPC      bool
	Cookies  map[string]string
}

// HTMLTransformer is implemented by PluginManager.
type HTMLTransformer interface {
	TransformActive() bool
	TransformCookieNames() []string
	TransformHTML(req TransformRequest) string
}

type transformPayload struct {
	HTML    string            `json:"html"`
	Path    string            `json:"path"`
	Host    string            `json:"host"`
	Node    map[string]any    `json:"node"`
	User    map[string]any    `json:"user"`
	GPC     bool              `json:"gpc"`
	Cookies map[string]string `json:"cookies,omitempty"`
}

type eventCtxCaller interface {
	HandleEventCtx(ctx context.Context, action string, payload []byte) (*pb.EventResponse, error)
}

// TransformActive reports whether any transformer is currently callable.
func (pm *PluginManager) TransformActive() bool {
	now := time.Now().UnixNano()
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	for _, rps := range pm.plugins {
		for _, rp := range rps {
			if rp.transformer && rp.skipUntil.Load() <= now {
				return true
			}
		}
	}
	return false
}

// TransformCookieNames returns the cookies declared via observe_cookies.
func (pm *PluginManager) TransformCookieNames() []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	var out []string
	for _, names := range pm.observeCookies {
		out = append(out, names...)
	}
	sort.Strings(out)
	return out
}

// TransformHTML runs the chain in priority order (higher first).
func (pm *PluginManager) TransformHTML(req TransformRequest) string {
	now := time.Now()
	pm.mu.RLock()
	var chain []*runningPlugin
	for _, rps := range pm.plugins {
		for _, rp := range rps {
			if rp.transformer && rp.skipUntil.Load() <= now.UnixNano() {
				chain = append(chain, rp)
			}
		}
	}
	pm.mu.RUnlock()
	sort.SliceStable(chain, func(i, j int) bool { return chain[i].priority > chain[j].priority })

	html := req.HTML
	for _, rp := range chain {
		caller, ok := rp.impl.(eventCtxCaller)
		if !ok {
			continue
		}
		select {
		case <-rp.stopped:
			continue
		default:
		}
		body, err := marshalTransform(transformPayload{
			HTML: html, Path: req.Path, Host: req.Host, GPC: req.GPC, Cookies: req.Cookies,
			Node: map[string]any{"id": req.NodeID, "type": req.NodeType, "language": req.Language, "is_404": req.Is404},
			User: map[string]any{"id": req.UserID, "role": req.Role},
		})
		if err != nil {
			continue
		}
		ctx, cancel := context.WithTimeout(context.Background(), transformDeadline)
		resp, err := caller.HandleEventCtx(ctx, transformEvent, body)
		cancel()
		if err != nil {
			log.Printf("[plugins] %s render.transform failed (page unchanged): %v", rp.slug, err)
			continue
		}
		if !resp.Handled {
			rp.skipUntil.Store(time.Now().Add(transformSkip).UnixNano())
			continue
		}
		if resp.Error != "" || len(resp.Result) == 0 || len(resp.Result) > transformMaxGrowth*len(html)+4096 {
			continue
		}
		html = string(resp.Result)
	}
	return html
}

func marshalTransform(p transformPayload) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(p); err != nil {
		return nil, err
	}
	return bytes.TrimRight(buf.Bytes(), "\n"), nil
}

var transformMarkerRe = regexp.MustCompile(`<!--sqx:[^>]*-->`)

func stripTransformMarkers(html string) string {
	if !strings.Contains(html, "<!--sqx:") {
		return html
	}
	return transformMarkerRe.ReplaceAllString(html, "")
}

// SetTransformer wires the render.transform chain (PluginManager).
func (h *PublicHandler) SetTransformer(t HTMLTransformer) { h.transformer = t }

func (h *PublicHandler) transformActive() bool {
	return h.transformer != nil && h.transformer.TransformActive()
}

// wrapBlocksWithTransformMarkers marks block boundaries for a transformer.
func wrapBlocksWithTransformMarkers(rendered []string, blocks []map[string]interface{}) []string {
	if len(rendered) != len(blocks) {
		return rendered
	}
	out := make([]string, len(rendered))
	for i, html := range rendered {
		slug, _ := blocks[i]["type"].(string)
		out[i] = fmt.Sprintf("<!--sqx:b:%d:%s-->", i, template.HTMLEscapeString(slug)) + html + "<!--sqx:/b-->"
	}
	return out
}

// finishPublicHTML runs the transform chain over a finished page and
// strips the kernel's markers. Cheap no-op when no transformer is active.
func (h *PublicHandler) finishPublicHTML(c *fiber.Ctx, html string, node *models.ContentNode, user *models.User, is404 bool) string {
	if !h.transformActive() {
		return stripTransformMarkers(html)
	}
	req := TransformRequest{HTML: html, Path: c.Path(), Host: c.Hostname(), Is404: is404, GPC: c.Get("Sec-GPC") == "1"}
	if node != nil {
		req.NodeID, req.NodeType, req.Language = node.ID, node.NodeType, node.LanguageCode
	}
	if user != nil {
		req.UserID, req.Role = user.ID, user.Role.Slug
	}
	for _, name := range h.transformer.TransformCookieNames() {
		if v := c.Cookies(name); v != "" {
			if req.Cookies == nil {
				req.Cookies = map[string]string{}
			}
			req.Cookies[name] = v
		}
	}
	return stripTransformMarkers(h.transformer.TransformHTML(req))
}
