package cms

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"

	"vibecms/internal/models"
	pb "vibecms/pkg/plugin/proto"
)

// PublicExtensionProxy registers public (no auth) routes declared by extensions
// and proxies them to the corresponding gRPC plugin's HandleHTTPRequest.
type PublicExtensionProxy struct {
	pluginMgr *PluginManager
}

// NewPublicExtensionProxy creates a new PublicExtensionProxy.
func NewPublicExtensionProxy(pm *PluginManager) *PublicExtensionProxy {
	return &PublicExtensionProxy{pluginMgr: pm}
}

// RegisterPublicRoutes reads the manifest for each active extension, and for
// every entry in public_routes registers the declared Fiber route that proxies
// to the extension plugin — without any auth middleware.
func (pp *PublicExtensionProxy) RegisterPublicRoutes(app *fiber.App, activeExts []models.Extension) {
	for _, ext := range activeExts {
		var manifest ExtensionManifest
		if err := json.Unmarshal([]byte(ext.Manifest), &manifest); err != nil {
			continue
		}
		if len(manifest.PublicRoutes) == 0 {
			continue
		}

		slug := ext.Slug
		for _, route := range manifest.PublicRoutes {
			method := strings.ToUpper(route.Method)
			path := route.Path
			log.Printf("[public-proxy] %s %s -> extension %s", method, path, slug)

			handler := pp.makeHandler(slug, path)

			switch method {
			case "GET":
				app.Get(path, handler)
			case "POST":
				app.Post(path, handler)
			case "PUT":
				app.Put(path, handler)
			case "DELETE":
				app.Delete(path, handler)
			case "PATCH":
				app.Patch(path, handler)
			default:
				app.All(path, handler)
			}
		}
	}
}

// makeHandler returns a Fiber handler that proxies a public request to the
// given extension slug's gRPC plugin.
func (pp *PublicExtensionProxy) makeHandler(slug, routePath string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		client := pp.pluginMgr.GetClient(slug)
		if client == nil {
			return c.SendStatus(fiber.StatusServiceUnavailable)
		}

		// Build headers map (strip sensitive headers).
		headers := make(map[string]string)
		c.Request().Header.VisitAll(func(key, value []byte) {
			k := string(key)
			kLower := strings.ToLower(k)
			if kLower == "cookie" || kLower == "authorization" {
				return
			}
			headers[k] = string(value)
		})

		// Build query params.
		queryParams := make(map[string]string)
		c.Request().URI().QueryArgs().VisitAll(func(key, value []byte) {
			queryParams[string(key)] = string(value)
		})

		// Path params.
		pathParams := make(map[string]string)
		wildcard := c.Params("*")
		if wildcard != "" {
			pathParams["path"] = wildcard
		}

		// Use the full request path as-is for the plugin.
		req := &pb.PluginHTTPRequest{
			Method:      c.Method(),
			Path:        c.Path(),
			Headers:     headers,
			Body:        c.Body(),
			QueryParams: queryParams,
			PathParams:  pathParams,
			UserId:      0, // no auth on public routes
		}

		resp, err := client.HandleHTTPRequest(req)
		if err != nil {
			log.Printf("[public-proxy] gRPC error from %s: %v", slug, err)
			return c.SendStatus(fiber.StatusBadGateway)
		}

		for k, v := range resp.Headers {
			c.Set(k, v)
		}

		return c.Status(int(resp.StatusCode)).Send(resp.Body)
	}
}
