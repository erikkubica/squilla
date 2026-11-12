package logging

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestRequestID_RejectsUnsafeClientValues(t *testing.T) {
	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(RequestIDFromFiber(c)) })

	cases := []struct {
		name string
		in   string
		keep bool
	}{
		{"uuid kept", "3f1c2a8e-5b8f-4c1e-9c1d-2a7b6f0e9d11", true},
		{"trace kept", "abc.DEF_123:xyz", true},
		{"too long", strings.Repeat("a", 129), false},
		{"quote", `abc"def`, false},
		{"space", "abc def", false},
		{"log injection", "abc def", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/", nil)
			req.Header.Set(RequestIDHeader, tc.in)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatal(err)
			}
			got := resp.Header.Get(RequestIDHeader)
			if tc.keep && got != tc.in {
				t.Fatalf("got %q, want client id preserved", got)
			}
			if !tc.keep && (got == tc.in || got == "") {
				t.Fatalf("got %q, want a freshly minted id", got)
			}
		})
	}
}
