package auth

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestJSONOnlyMutations_FetchMetadataAndOrigin(t *testing.T) {
	SetAllowedOrigins("https://admin.example.com, https://allowed.example.com/")
	defer SetAllowedOrigins("")

	app := fiber.New()
	app.Use(JSONOnlyMutations())
	app.All("/admin/api/ext/media/upload", func(c *fiber.Ctx) error { return c.SendStatus(204) })

	cases := []struct {
		name   string
		cookie bool
		sfs    string
		origin string
		ct     string
		want   int
	}{
		{"same-origin fetch", true, "same-origin", "http://cms.example.com", "multipart/form-data; boundary=x", 204},
		{"sibling subdomain multipart", true, "same-site", "https://evil.example.com", "multipart/form-data; boundary=x", 403},
		{"cross-site json", true, "cross-site", "https://evil.test", "application/json", 403},
		{"configured CORS origin", true, "cross-site", "https://allowed.example.com", "application/json", 204},
		{"origin only, mismatched", true, "", "https://evil.example.com", "multipart/form-data; boundary=x", 403},
		{"origin only, same host", true, "", "http://cms.example.com", "application/json", 204},
		{"no browser headers (curl)", true, "", "", "application/json", 204},
		{"no cookie, cross-site", false, "cross-site", "https://evil.test", "application/json", 204},
		{"user-initiated navigation", true, "none", "", "application/json", 204},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/admin/api/ext/media/upload", nil)
			req.Host = "cms.example.com"
			req.Header.Set("Content-Type", tc.ct)
			if tc.cookie {
				req.Header.Set("Cookie", CookieName+"=abc")
			}
			if tc.sfs != "" {
				req.Header.Set("Sec-Fetch-Site", tc.sfs)
			}
			if tc.origin != "" {
				req.Header.Set("Origin", tc.origin)
			}
			resp, err := app.Test(req, 15000)
			if err != nil {
				t.Fatal(err)
			}
			if resp.StatusCode != tc.want {
				t.Fatalf("status = %d, want %d", resp.StatusCode, tc.want)
			}
		})
	}
}
