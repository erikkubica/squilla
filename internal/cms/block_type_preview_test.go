package cms

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/models"
	"squilla/internal/rendering"
	"squilla/internal/testutil"
)

func previewApp(t *testing.T, caps string) (*fiber.App, *BlockTypeHandler) {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Theme{}, &models.BlockType{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	h := NewBlockTypeHandler(NewBlockTypeService(db, nil, nil), db)
	h.SetRenderer(rendering.NewTemplateRenderer(t.TempDir(), true))
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user", &models.User{ID: 1, Role: models.Role{Slug: "x", Capabilities: models.JSONB(caps)}})
		return c.Next()
	})
	h.RegisterRoutes(app)
	return app, h
}

func postPreview(t *testing.T, app *fiber.App, body map[string]any) (int, map[string]any) {
	t.Helper()
	b, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/block-types/preview", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 20000)
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := io.ReadAll(resp.Body)
	var out map[string]any
	_ = json.Unmarshal(raw, &out)
	return resp.StatusCode, out
}

func TestPreviewRawTemplateRequiresManageLayouts(t *testing.T) {
	app, _ := previewApp(t, `{"admin_access":true}`)
	status, _ := postPreview(t, app, map[string]any{"html_template": `{{ event "x" }}`})
	if status != fiber.StatusForbidden {
		t.Fatalf("author previewing raw template: status %d, want 403", status)
	}

	// Chrome-only and stored-block previews stay open to any admin user.
	status, out := postPreview(t, app, map[string]any{})
	if status != 200 {
		t.Fatalf("chrome-only preview: %d", status)
	}
	if _, ok := out["head"]; !ok {
		t.Errorf("chrome-only preview should return head: %v", out)
	}

	app2, _ := previewApp(t, `{"admin_access":true,"manage_layouts":true}`)
	status, out = postPreview(t, app2, map[string]any{"html_template": `<p>{{ .title }}</p>`, "test_data": map[string]any{"title": "hi"}})
	if status != 200 || out["html"] != "<p>hi</p>" {
		t.Fatalf("layout manager preview: %d %v", status, out)
	}
}

func TestPreviewStoredBlockTypeByID(t *testing.T) {
	app, h := previewApp(t, `{"admin_access":true}`)
	bt := models.BlockType{Slug: "hello", Label: "Hello", HTMLTemplate: `<h2>{{ safeHTML .heading }}</h2>`, Fields: models.JSONB("[]"), TestData: models.JSONB(`{"heading":"Hi<script>alert(1)</script>"}`)}
	if err := h.db.Create(&bt).Error; err != nil {
		t.Fatal(err)
	}
	status, out := postPreview(t, app, map[string]any{"block_type_id": bt.ID})
	if status != 200 {
		t.Fatalf("status %d %v", status, out)
	}
	html, _ := out["html"].(string)
	if !strings.Contains(html, "<h2>Hi") || strings.Contains(html, "<script") {
		t.Errorf("stored preview html = %q", html)
	}
}

func TestPreviewLimitsOutputAndSeq(t *testing.T) {
	app, _ := previewApp(t, `{"admin_access":true,"manage_layouts":true}`)
	// seq is capped, so this produces 10,000 x 10,000 = 1e8 iterations
	// worth of output and must hit the output cap rather than run away.
	status, out := postPreview(t, app, map[string]any{"html_template": `{{ range seq 1000000000 }}{{ range seq 10000 }}xxxxxxxxxx{{ end }}{{ end }}`})
	if status != 200 {
		t.Fatalf("status %d", status)
	}
	html, _ := out["html"].(string)
	if !strings.Contains(html, "limit") || len(html) > 10000 {
		t.Errorf("expected limit error, got %d bytes: %.200s", len(html), html)
	}
	if n := len(rendering.Seq(1e9)); n != rendering.MaxSeq {
		t.Errorf("seq cap %d", n)
	}
}
