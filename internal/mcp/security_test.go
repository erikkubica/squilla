package mcp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"squilla/internal/coreapi"
	"squilla/internal/models"
	"squilla/internal/testutil"
	"squilla/internal/uploads"
)

// ---------------------------------------------------------------------------
// harness

// fakeAPI implements only the CoreAPI methods the tests exercise; any other
// call panics on the nil embedded interface (and is caught by dispatch).
type fakeAPI struct {
	coreapi.CoreAPI
	settings   map[string]string
	storedPath string
	deleted    string
}

func (f *fakeAPI) GetSetting(_ context.Context, key string) (string, error) {
	return f.settings[key], nil
}

func (f *fakeAPI) GetSettings(_ context.Context, prefix string) (map[string]string, error) {
	out := map[string]string{}
	for k, v := range f.settings {
		if strings.HasPrefix(k, prefix) {
			out[k] = v
		}
	}
	return out, nil
}

func (f *fakeAPI) StoreFile(_ context.Context, path string, _ []byte) (string, error) {
	f.storedPath = path
	return "/" + path, nil
}

func (f *fakeAPI) DeleteFile(_ context.Context, path string) error {
	f.deleted = path
	return nil
}

func (f *fakeAPI) GetNode(_ context.Context, id uint) (*coreapi.Node, error) {
	return &coreapi.Node{ID: id, Title: "n"}, nil
}

func newTestServer(t *testing.T, api coreapi.CoreAPI) (*Server, *gorm.DB) {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.McpAuditLog{}); err != nil {
		t.Fatal(err)
	}
	return New(Deps{DB: db, CoreAPI: api}), db
}

// rpc sends one JSON-RPC request through the real MCP server and returns
// the decoded response.
func rpc(t *testing.T, s *Server, tok *models.McpToken, method string, params any) map[string]any {
	t.Helper()
	ctx := context.Background()
	if tok != nil {
		ctx = withToken(ctx, tok)
	}
	ctx = withServer(ctx, s)
	msg, _ := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	resp := s.mcp.HandleMessage(ctx, msg)
	b, _ := json.Marshal(resp)
	var out map[string]any
	_ = json.Unmarshal(b, &out)
	return out
}

// callTool returns (text, isError).
func callTool(t *testing.T, s *Server, tok *models.McpToken, name string, args map[string]any) (string, bool) {
	t.Helper()
	out := rpc(t, s, tok, "tools/call", map[string]any{"name": name, "arguments": args})
	res, _ := out["result"].(map[string]any)
	if res == nil {
		t.Fatalf("no result for %s: %v", name, out)
	}
	isErr, _ := res["isError"].(bool)
	content, _ := res["content"].([]any)
	var text string
	if len(content) > 0 {
		c0, _ := content[0].(map[string]any)
		text, _ = c0["text"].(string)
	}
	return text, isErr
}

func tokenWithScope(scope string) *models.McpToken {
	return &models.McpToken{ID: 1, UserID: 1, Scope: scope}
}

// ---------------------------------------------------------------------------
// 1. token minting + owner re-validation

func seedRole(t *testing.T, db *gorm.DB, slug, caps string) models.Role {
	t.Helper()
	r := models.Role{Slug: slug, Name: slug, Capabilities: models.JSONB(caps)}
	if err := db.Create(&r).Error; err != nil {
		t.Fatal(err)
	}
	return r
}

func seedUser(t *testing.T, db *gorm.DB, email string, role models.Role) models.User {
	t.Helper()
	u := models.User{Email: email, PasswordHash: "x", RoleID: role.ID}
	if err := db.Create(&u).Error; err != nil {
		t.Fatal(err)
	}
	u.Role = role
	return u
}

func tokenDB(t *testing.T) *gorm.DB {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.Role{}, &models.User{}, &models.McpToken{}); err != nil {
		t.Fatal(err)
	}
	return db
}

const (
	adminCaps  = `{"*":true,"admin_access":true,"manage_settings":true}`
	authorCaps = `{"admin_access":true,"manage_settings":false}`
)

func postToken(t *testing.T, h *TokenHandler, user *models.User, body string) (int, string) {
	t.Helper()
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error { c.Locals("user", user); return c.Next() })
	app.Post("/mcp-tokens", h.Create)
	req := httptest.NewRequest(http.MethodPost, "/mcp-tokens", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	var buf bytes.Buffer
	_, _ = buf.ReadFrom(resp.Body)
	return resp.StatusCode, buf.String()
}

func TestTokenMint_AuthorCannotMintFull(t *testing.T) {
	db := tokenDB(t)
	author := seedUser(t, db, "a@x", seedRole(t, db, "author", authorCaps))
	h := NewTokenHandler(NewTokenService(db))

	if code, body := postToken(t, h, &author, `{"name":"t","scope":"full"}`); code != http.StatusForbidden {
		t.Fatalf("explicit full by author: status %d body %s, want 403", code, body)
	}
	if code, body := postToken(t, h, &author, `{"name":"t"}`); code != http.StatusBadRequest || !strings.Contains(body, "SCOPE_REQUIRED") {
		t.Fatalf("omitted scope by author: status %d body %s, want 400 SCOPE_REQUIRED", code, body)
	}
	var n int64
	db.Model(&models.McpToken{}).Count(&n)
	if n != 0 {
		t.Fatalf("refused requests created %d tokens", n)
	}
	if code, body := postToken(t, h, &author, `{"name":"t","scope":"content"}`); code != http.StatusOK {
		t.Fatalf("content by author: status %d body %s, want 200", code, body)
	}
}

func TestTokenMint_AdminDefaultsToFull(t *testing.T) {
	db := tokenDB(t)
	admin := seedUser(t, db, "root@x", seedRole(t, db, "admin", adminCaps))
	h := NewTokenHandler(NewTokenService(db))
	code, body := postToken(t, h, &admin, `{"name":"t"}`)
	if code != http.StatusOK || !strings.Contains(body, `"scope":"full"`) {
		t.Fatalf("admin omitted scope: status %d body %s, want 200 full", code, body)
	}
}

func TestTokenValidate_RejectsAfterOwnerDemotion(t *testing.T) {
	db := tokenDB(t)
	role := seedRole(t, db, "admin", adminCaps)
	admin := seedUser(t, db, "root@x", role)
	svc := NewTokenService(db)

	fullRaw, _, err := svc.CreateToken(admin.ID, "full", ScopeFull, nil)
	if err != nil {
		t.Fatal(err)
	}
	contentRaw, _, err := svc.CreateToken(admin.ID, "content", ScopeContent, nil)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Validate(fullRaw); err != nil {
		t.Fatalf("Validate before demotion: %v", err)
	}

	// Lose manage_settings: full token dies, content token survives.
	db.Model(&models.Role{}).Where("id = ?", role.ID).Update("capabilities", models.JSONB(authorCaps))
	if _, err := svc.Validate(fullRaw); !errors.Is(err, ErrOwnerNotPermitted) {
		t.Fatalf("full token after losing manage_settings: err = %v, want ErrOwnerNotPermitted", err)
	}
	if _, err := svc.Validate(contentRaw); err != nil {
		t.Fatalf("content token after losing manage_settings: %v", err)
	}

	// Lose admin_access: every token dies.
	db.Model(&models.Role{}).Where("id = ?", role.ID).Update("capabilities", models.JSONB(`{"admin_access":false}`))
	if _, err := svc.Validate(contentRaw); !errors.Is(err, ErrOwnerNotPermitted) {
		t.Fatalf("content token after losing admin_access: err = %v, want ErrOwnerNotPermitted", err)
	}

	// Deleted owner.
	db.Where("id = ?", admin.ID).Delete(&models.User{})
	if _, err := svc.Validate(contentRaw); !errors.Is(err, ErrOwnerNotPermitted) {
		t.Fatalf("token of deleted owner: err = %v, want ErrOwnerNotPermitted", err)
	}
}

func TestTokenValidate_DoesNotWriteLastUsed(t *testing.T) {
	db := tokenDB(t)
	admin := seedUser(t, db, "root@x", seedRole(t, db, "admin", adminCaps))
	svc := NewTokenService(db)
	raw, row, _ := svc.CreateToken(admin.ID, "t", ScopeRead, nil)
	tok, err := svc.Validate(raw)
	if err != nil {
		t.Fatal(err)
	}
	var reread models.McpToken
	db.First(&reread, row.ID)
	if reread.LastUsedAt != nil {
		t.Fatal("Validate wrote last_used_at; only Touch should")
	}
	svc.Touch(tok)
	db.First(&reread, row.ID)
	if reread.LastUsedAt == nil {
		t.Fatal("Touch did not write last_used_at")
	}
}

// ---------------------------------------------------------------------------
// 2a / 4. generic data tools

func TestGuardDataTable_ScopedTokensUseAllowList(t *testing.T) {
	content := withToken(context.Background(), tokenWithScope(ScopeContent))
	for _, tab := range []string{"extensions", "themes", "layouts", "block_types", "templates", "email_rules", "forms", "redirects", "system_actions", "pending_uploads"} {
		if err := guardDataTable(content, tab); err == nil {
			t.Errorf("scope=content allowed on %q", tab)
		}
	}
	read := withToken(context.Background(), tokenWithScope(ScopeRead))
	for _, tab := range []string{"email_logs", "form_submissions", "users", "mcp_tokens"} {
		if err := guardDataTable(read, tab); err == nil {
			t.Errorf("scope=read allowed on %q", tab)
		}
	}
	full := withToken(context.Background(), tokenWithScope(ScopeFull))
	for _, tab := range []string{"extensions", "email_logs", "users"} {
		if err := guardDataTable(full, tab); err != nil {
			t.Errorf("scope=full denied on %q: %v", tab, err)
		}
	}
}

func TestDataQueryTool_RawRequiresFullScope(t *testing.T) {
	s := &Server{}
	for _, scope := range []string{ScopeRead, ScopeContent} {
		ctx := withToken(context.Background(), tokenWithScope(scope))
		if err := s.checkRawWhere(ctx, "1=1", false); err == nil {
			t.Errorf("raw allowed for scope=%s", scope)
		}
		if err := s.checkRawWhere(ctx, "", true); err == nil {
			t.Errorf("args allowed for scope=%s", scope)
		}
	}
	full := withToken(context.Background(), tokenWithScope(ScopeFull))
	if err := s.checkRawWhere(full, "id = ? OR (SELECT 1) = 1", false); err == nil {
		t.Error("sub-select raw allowed for scope=full without SQUILLA_MCP_ALLOW_RAW_SQL")
	}
	if err := s.checkRawWhere(full, "status = ? AND created_at < ?", false); err != nil {
		t.Errorf("plain raw rejected for scope=full: %v", err)
	}
	s.allowRawSQL = true
	if err := s.checkRawWhere(full, "id IN (SELECT 1)", false); err != nil {
		t.Errorf("raw SQL opt-in should skip the fragment grammar: %v", err)
	}
}

func TestDataQueryTool_ReadScopeRawRejectedEndToEnd(t *testing.T) {
	s, _ := newTestServer(t, &fakeAPI{})
	text, isErr := callTool(t, s, tokenWithScope(ScopeRead), "core.data.query", map[string]any{
		"table": "content_nodes", "raw": "1=1",
	})
	if !isErr {
		t.Fatalf("expected error, got %s", text)
	}
}

// ---------------------------------------------------------------------------
// 5. settings redaction

func TestSettingsRedactedForScopedTokens(t *testing.T) {
	api := &fakeAPI{settings: map[string]string{
		"site.name":                 "Squilla",
		"smtp_password":             "hunter2",
		"plugin.resend.credentials": "re_live",
		"plugin.analytics.endpoint": "https://x",
		"stripe_api_key":            "sk_live",
	}}
	s, _ := newTestServer(t, api)

	text, isErr := callTool(t, s, tokenWithScope(ScopeRead), "core.settings.list", map[string]any{})
	if isErr {
		t.Fatalf("list: %s", text)
	}
	for _, leak := range []string{"hunter2", "re_live", "sk_live", "plugin."} {
		if strings.Contains(text, leak) {
			t.Errorf("scope=read settings.list leaked %q: %s", leak, text)
		}
	}
	if !strings.Contains(text, "Squilla") {
		t.Errorf("non-secret setting missing: %s", text)
	}

	text, _ = callTool(t, s, tokenWithScope(ScopeContent), "core.settings.get", map[string]any{"key": "smtp_password"})
	if strings.Contains(text, "hunter2") || !strings.Contains(text, `"redacted":true`) {
		t.Errorf("scope=content settings.get not redacted: %s", text)
	}

	text, _ = callTool(t, s, tokenWithScope(ScopeFull), "core.settings.get", map[string]any{"key": "smtp_password"})
	if !strings.Contains(text, "hunter2") {
		t.Errorf("scope=full should see secrets: %s", text)
	}
}

// ---------------------------------------------------------------------------
// 6. import_url SSRF + size cap

func TestImportFetch_BlocksPrivateDestinations(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("internal"))
	}))
	defer srv.Close()

	for _, u := range []string{
		srv.URL, // 127.0.0.1
		"http://169.254.169.254/latest/meta-data/",
		"http://[::1]:1/",
		"http://10.0.0.1:1/",
		"file:///etc/passwd",
		"gopher://127.0.0.1/",
	} {
		if _, _, err := fetchForImport(context.Background(), u, 1<<20); err == nil {
			t.Errorf("fetchForImport(%q) succeeded, want refusal", u)
		}
	}

	// Redirect from an allowed host to a blocked one is refused too.
	redirector := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "http://169.254.169.254/", http.StatusFound)
	}))
	defer redirector.Close()
	allowLoopbackForTest(t)
	if _, _, err := fetchForImport(context.Background(), redirector.URL, 1<<20); err == nil {
		t.Error("redirect to link-local was followed")
	}
}

// allowLoopbackForTest lets the importer reach httptest servers while
// still refusing link-local/RFC1918.
func allowLoopbackForTest(t *testing.T) {
	orig := importAddrAllowed
	importAddrAllowed = func(a netip.Addr) bool { return a.Unmap().IsLoopback() || orig(a) }
	t.Cleanup(func() { importAddrAllowed = orig })
}

func TestImportFetch_EnforcesSizeCap(t *testing.T) {
	allowLoopbackForTest(t)
	big := bytes.Repeat([]byte("a"), 4096)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/chunked" {
			w.Header().Set("Content-Type", "image/png")
			w.(http.Flusher).Flush() // no Content-Length
		}
		_, _ = w.Write(big)
	}))
	defer srv.Close()

	for _, p := range []string{"/", "/chunked"} {
		if _, _, err := fetchForImport(context.Background(), srv.URL+p, 1024); err == nil {
			t.Errorf("%s: body over the cap was accepted", p)
		}
	}
	body, _, err := fetchForImport(context.Background(), srv.URL+"/", 8192)
	if err != nil || len(body) != len(big) {
		t.Fatalf("under the cap: len=%d err=%v", len(body), err)
	}
}

// ---------------------------------------------------------------------------
// 7. files confinement

func TestFilesTool_ConfinedToMCPDir(t *testing.T) {
	api := &fakeAPI{}
	s, _ := newTestServer(t, api)
	tok := tokenWithScope(ScopeContent)
	b64 := "aGk=" // "hi"

	for _, p := range []string{"media/evil.html", "x.svg", "a/b.js", "x.xml", "x.php", "../media/x.png", "/etc/x.txt", "mcp/../media/x.png", "a\\..\\b.txt"} {
		if text, isErr := callTool(t, s, tok, "core.files.store", map[string]any{"path": p, "body_base64": b64}); !isErr {
			t.Errorf("store(%q) accepted: %s", p, text)
		}
	}

	if text, isErr := callTool(t, s, tok, "core.files.store", map[string]any{"path": "notes/a.txt", "body_base64": b64}); isErr {
		t.Fatalf("store(notes/a.txt): %s", text)
	}
	if api.storedPath != "mcp/notes/a.txt" {
		t.Fatalf("stored at %q, want mcp/notes/a.txt", api.storedPath)
	}

	if _, isErr := callTool(t, s, tok, "core.files.delete", map[string]any{"path": "media/2024/photo.jpg"}); isErr {
		t.Fatal("delete of a relative path should be confined, not refused")
	}
	if api.deleted != "mcp/media/2024/photo.jpg" {
		t.Fatalf("delete reached %q, want it confined under mcp/", api.deleted)
	}
	if _, isErr := callTool(t, s, tok, "core.files.delete", map[string]any{"path": "../media/photo.jpg"}); !isErr {
		t.Fatal("delete with traversal accepted")
	}
}

// ---------------------------------------------------------------------------
// 8. resources go through the gate

func TestResources_GatedAndRateLimited(t *testing.T) {
	s, _ := newTestServer(t, &fakeAPI{})
	read := func(tok *models.McpToken) map[string]any {
		return rpc(t, s, tok, "resources/read", map[string]any{"uri": "squilla://nodes/1"})
	}
	if out := read(nil); out["error"] == nil {
		t.Fatalf("resource read without token succeeded: %v", out)
	}
	s.limiter = newPerTokenLimiter(60, 1)
	tok := tokenWithScope(ScopeRead)
	if out := read(tok); out["error"] != nil {
		t.Fatalf("first read failed: %v", out)
	}
	out := read(tok)
	errObj, _ := out["error"].(map[string]any)
	if errObj == nil || !strings.Contains(fmt.Sprint(errObj["message"]), "rate_limited") {
		t.Fatalf("second read should be rate limited, got %v", out)
	}
}

// ---------------------------------------------------------------------------
// 9. error mapping, rate-limit message, checklist, filter class

func TestPublicError_HidesInternalDetail(t *testing.T) {
	internal := []error{
		coreapi.NewInternal("data query: pq: relation \"users\" does not exist"),
		fmt.Errorf("open temp file: %w", &fs.PathError{Op: "open", Path: "/srv/squilla/data/x", Err: os.ErrNotExist}),
		errors.New("ERROR: syntax error at or near \"x\" (SQLSTATE 42601)"),
	}
	for _, e := range internal {
		code, msg := publicError(nil, "t", e)
		if code != "internal" || strings.Contains(msg, "/srv") || strings.Contains(msg, "SQLSTATE") || strings.Contains(msg, "pq:") {
			t.Errorf("publicError(%v) = %s: %s", e, code, msg)
		}
		if !strings.Contains(msg, "request id") {
			t.Errorf("internal message lacks request id: %s", msg)
		}
	}
	keep := map[error]string{
		coreapi.NewValidation("invalid order_by clause"): "invalid order_by clause",
		coreapi.NewNotFound("node", 5):                   "node 5 not found",
		coreapi.NewCapabilityDenied("data:x"):            "data:x",
		errors.New("url is required"):                    "url is required",
		uploads.ErrWrongUser:                             uploads.ErrWrongUser.Error(),
	}
	for e, want := range keep {
		if _, msg := publicError(nil, "t", e); !strings.Contains(msg, want) {
			t.Errorf("publicError(%v) = %q, want it to keep %q", e, msg, want)
		}
	}
}

func TestDispatch_PanicIsGeneric(t *testing.T) {
	s, _ := newTestServer(t, &fakeAPI{})
	// core.media.get calls an unimplemented fakeAPI method → nil-interface panic.
	text, isErr := callTool(t, s, tokenWithScope(ScopeRead), "core.media.get", map[string]any{"id": 1})
	if !isErr || !strings.Contains(text, "request id") || strings.Contains(text, "nil pointer") {
		t.Fatalf("panic not sanitized: %q", text)
	}
}

func TestRateLimitMessageMatchesConfig(t *testing.T) {
	s, _ := newTestServer(t, &fakeAPI{})
	s.limiter = newPerTokenLimiter(600, 1)
	tok := tokenWithScope(ScopeRead)
	callTool(t, s, tok, "core.settings.get", map[string]any{"key": "site.name"})
	text, _ := callTool(t, s, tok, "core.settings.get", map[string]any{"key": "site.name"})
	if !strings.Contains(text, "600 req/min") || !strings.Contains(text, "burst 1") {
		t.Fatalf("rate limit message %q does not describe the configured limiter", text)
	}
}

func TestThemeChecklist_RejectsBadSlug(t *testing.T) {
	s, _ := newTestServer(t, &fakeAPI{})
	for _, slug := range []string{"../../etc", "a/b", "Theme", "x y"} {
		text, isErr := callTool(t, s, tokenWithScope(ScopeRead), "core.theme.checklist", map[string]any{"slug": slug})
		if !isErr || !strings.Contains(text, "invalid theme slug") {
			t.Errorf("slug %q: %s", slug, text)
		}
	}
}

func TestThemeChecklist_ReportsRelativePaths(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "abs", "themes", "demo")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	out := runThemeChecklist("demo", dir)
	b, _ := json.Marshal(out)
	if strings.Contains(string(b), dir) {
		t.Fatalf("checklist leaked absolute path: %s", b)
	}
	if out["theme_dir"] != "themes/demo" {
		t.Fatalf("theme_dir = %v", out["theme_dir"])
	}
}

func TestToolClasses(t *testing.T) {
	s, _ := newTestServer(t, &fakeAPI{})
	want := map[string]string{"core.filter.apply": "content"}
	for _, e := range s.toolCatalog {
		if c, ok := want[e.Name]; ok && e.Class != c {
			t.Errorf("%s class = %s, want %s", e.Name, e.Class, c)
		}
	}
}

// ---------------------------------------------------------------------------
// 3. finalize is bound to the issuing user

func TestFinalizeRow_RequiresIssuingUser(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	store, err := uploads.NewStore(db, filepath.Join(t.TempDir(), "pending"))
	if err != nil {
		t.Fatal(err)
	}
	row, err := store.Issue(uploads.IssueOptions{Kind: uploads.KindMedia, UserID: 1, MaxBytes: 100})
	if err != nil {
		t.Fatal(err)
	}
	raw := row.Token
	if err := os.WriteFile(store.TempPathFor(raw), []byte("hi"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := store.MarkUploaded(raw, 2, "", store.TempPathFor(raw)); err != nil {
		t.Fatal(err)
	}
	s := &Server{deps: Deps{UploadStore: store}}
	other := withToken(context.Background(), &models.McpToken{ID: 9, UserID: 2, Scope: ScopeContent})
	if _, _, err := s.finalizeRow(other, raw, "", uploads.KindMedia); !errors.Is(err, uploads.ErrWrongUser) {
		t.Fatalf("finalize by other user: err = %v, want ErrWrongUser", err)
	}
	owner := withToken(context.Background(), &models.McpToken{ID: 1, UserID: 1, Scope: ScopeContent})
	_, f, err := s.finalizeRow(owner, raw, "", uploads.KindMedia)
	if err != nil {
		t.Fatalf("finalize by owner: %v", err)
	}
	f.Close()
}

// The importer applies the kernel's full outbound policy, including the
// special-purpose ranges the old local copy missed (NAT64, 6to4,
// benchmarking, TEST-NETs).
func TestImportFetch_UsesKernelFetchPolicy(t *testing.T) {
	for _, a := range []string{"198.18.0.1", "192.0.2.10", "64:ff9b::a00:1", "2002:7f00:1::1", "240.0.0.1"} {
		if importAddrAllowed(netip.MustParseAddr(a)) {
			t.Errorf("importAddrAllowed(%s) = true, want refused", a)
		}
	}
	if !importAddrAllowed(netip.MustParseAddr("93.184.216.34")) {
		t.Error("public address must be allowed")
	}
}
