package scripting

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"

	"squilla/internal/coreapi"
	"squilla/internal/events"
)

// recordingAPI is a CoreAPI stub that records Log and Emit calls and can
// block in GetSetting. Unimplemented methods panic via the nil embed.
type recordingAPI struct {
	coreapi.CoreAPI

	mu       sync.Mutex
	logs     []string
	emits    []map[string]any
	release  chan struct{} // GetSetting blocks until closed (ignores ctx)
	ctxBlock bool          // GetSetting blocks on ctx.Done() instead
	ctxErr   error
}

func (r *recordingAPI) Log(_ context.Context, level, msg string, fields map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.logs = append(r.logs, fmt.Sprintf("%s %s %v", level, msg, fields))
	return nil
}

func (r *recordingAPI) Emit(_ context.Context, action string, payload map[string]any) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.emits = append(r.emits, payload)
	return nil
}

func (r *recordingAPI) GetSetting(ctx context.Context, key string) (string, error) {
	if r.ctxBlock {
		<-ctx.Done()
		r.mu.Lock()
		r.ctxErr = ctx.Err()
		r.mu.Unlock()
		return "", ctx.Err()
	}
	<-r.release
	return "", nil
}

func (r *recordingAPI) logCount() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.logs)
}

// writeExt creates an extension dir with scripts/extension.tengo = entry
// and extra handler files (name → source, name without .tengo).
func writeExt(t *testing.T, entry string, handlers map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	sd := filepath.Join(dir, "scripts")
	if err := os.MkdirAll(sd, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sd, "extension.tengo"), []byte(entry), 0o644); err != nil {
		t.Fatal(err)
	}
	for name, src := range handlers {
		p := filepath.Join(sd, name+".tengo")
		_ = os.MkdirAll(filepath.Dir(p), 0o755)
		if err := os.WriteFile(p, []byte(src), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func capSet(caps ...string) map[string]bool {
	m := make(map[string]bool, len(caps))
	for _, c := range caps {
		m[c] = true
	}
	return m
}

// --- 1. stdlib allow-list -------------------------------------------------

func TestRunScript_OSImportRejected(t *testing.T) {
	dir := writeScript(t, "h", `os := import("os"); response = os.getenv("HOME")`)
	e := NewScriptEngine(nil, nil, nil)
	if _, err := e.runScript("h", "x", nil, dir, nil, nil); err == nil || !strings.Contains(err.Error(), "module 'os' not found") {
		t.Fatalf("import(\"os\") must fail to compile, got %v", err)
	}
}

// --- 2. registration capability gates --------------------------------------

func TestRegistrationGates(t *testing.T) {
	cases := []struct {
		name  string
		entry string
		need  []string
		count func(e *ScriptEngine) int
	}{
		{"events.on", `import("core/events").on("node.created", "h")`, []string{"events:subscribe"},
			func(e *ScriptEngine) int { return len(e.eventHandlers["node.created"]) }},
		{"events.subscribe", `import("core/events").subscribe("node.created", "h")`, []string{"events:subscribe"},
			func(e *ScriptEngine) int { return len(e.eventHandlers["node.created"]) }},
		{"filters.add", `import("core/filters").add("node.title", "h")`, []string{"filters:register"},
			func(e *ScriptEngine) int { return len(e.filterHandlers["node.title"]) }},
		{"routes.register", `import("core/routes").register("GET", "/x", "h")`, []string{"routes:register"},
			func(e *ScriptEngine) int { return len(e.httpRoutes) }},
		{"wellknown.register", `import("core/wellknown").register("security.txt", "h")`, []string{"routes:register"},
			func(e *ScriptEngine) int { return len(e.wellKnown) }},
		{"email.send", `import("core/events").on("email.send", "h")`, []string{"events:subscribe", "email:provide"},
			func(e *ScriptEngine) int { return len(e.eventHandlers["email.send"]) }},
		{"password reset", `import("core/events").on("user.password_reset_requested", "h")`, []string{"events:subscribe", "auth:observe"},
			func(e *ScriptEngine) int { return len(e.eventHandlers["user.password_reset_requested"]) }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			// Missing each required capability in turn → denied.
			for i := range tc.need {
				partial := append(append([]string{}, tc.need[:i]...), tc.need[i+1:]...)
				e := NewScriptEngine(nil, nil, nil)
				dir := writeExt(t, tc.entry, map[string]string{"h": ""})
				if err := e.LoadExtensionScripts(dir, "ext", capSet(partial...)); err != nil {
					t.Fatalf("load: %v", err)
				}
				if n := tc.count(e); n != 0 {
					t.Fatalf("registered without %q (caps %v)", tc.need[i], partial)
				}
			}
			e := NewScriptEngine(nil, nil, nil)
			dir := writeExt(t, tc.entry, map[string]string{"h": ""})
			if err := e.LoadExtensionScripts(dir, "ext", capSet(tc.need...)); err != nil {
				t.Fatalf("load: %v", err)
			}
			if n := tc.count(e); n != 1 {
				t.Fatalf("want 1 registration with %v, got %d", tc.need, n)
			}
		})
	}
}

// Every bundled extension that registers from Tengo must still be able to
// after gating: load each with its manifest capabilities and require at
// least one registration where its entry script makes them.
func TestBundledExtensionsKeepRegistrations(t *testing.T) {
	root, _ := filepath.Abs("../../extensions")
	for slug, want := range map[string]int{"resend-provider": 1, "sitemap-generator": 6, "hello-extension": 1} {
		t.Run(slug, func(t *testing.T) {
			raw, err := os.ReadFile(filepath.Join(root, slug, "extension.json"))
			if err != nil {
				t.Fatal(err)
			}
			var m struct {
				Capabilities []string `json:"capabilities"`
			}
			if err := json.Unmarshal(raw, &m); err != nil {
				t.Fatal(err)
			}
			e := NewScriptEngine(nil, &recordingAPI{}, nil)
			if err := e.LoadExtensionScripts(filepath.Join(root, slug), slug, capSet(m.Capabilities...)); err != nil {
				t.Fatal(err)
			}
			n := len(e.httpRoutes)
			for _, hs := range e.eventHandlers {
				n += len(hs)
			}
			if n != want {
				t.Fatalf("want %d registrations, got %d — manifest is missing a capability", want, n)
			}
		})
	}
	// Themes: default + hello-vietnam register events/filters with the
	// default theme capability set.
	for _, theme := range []string{"default", "hello-vietnam"} {
		t.Run("theme/"+theme, func(t *testing.T) {
			scope := &loadScope{slug: "theme", caps: defaultThemeCapabilities()}
			e := NewScriptEngine(nil, nil, nil)
			if err := e.eventsOn(scope, "node.published", "h", 10); err != nil {
				t.Fatal(err)
			}
			if err := e.filtersAdd(scope, "node.title", "h", 10); err != nil {
				t.Fatal(err)
			}
		})
	}
}

// --- 3. cyclic values -----------------------------------------------------

func TestRunScript_CyclicValuesDoNotCrash(t *testing.T) {
	api := &recordingAPI{}
	e := NewScriptEngine(nil, api, nil)
	caps := capSet("events:emit", "log:write")
	for _, src := range []string{
		`m := {}; m.self = m; response = m`,
		`a := []; a = append(a, 1); m := {list: a}; m.list[0] = m; response = m`,
		`events := import("core/events"); m := {}; m.self = m; events.emit("x", m)`,
		`log := import("core/log"); m := {}; m.self = m; log.info("x", m)`,
		`h := import("core/helpers"); m := {}; m.self = m; response = h.json_encode(m)`,
	} {
		dir := writeScript(t, "h", src)
		if _, err := e.runScript("h", "x", caps, dir, nil, nil); err != nil {
			t.Fatalf("%s: %v", src, err)
		}
	}
	if len(api.emits) != 1 || api.logCount() != 1 {
		t.Fatalf("want 1 emit and 1 log, got %d / %d", len(api.emits), api.logCount())
	}
}

// --- 4. timeout -----------------------------------------------------------

func TestRunScript_TimeoutBoundsBlockingBuiltins(t *testing.T) {
	old := scriptTimeout
	scriptTimeout = 200 * time.Millisecond
	defer func() { scriptTimeout = old }()

	dir := writeScript(t, "h", `s := import("core/settings"); s.get("k"); response = "done"`)

	// CoreAPI call honours ctx: it must receive the run deadline.
	api := &recordingAPI{ctxBlock: true}
	e := NewScriptEngine(nil, api, nil)
	start := time.Now()
	if _, err := e.runScript("h", "x", nil, dir, nil, nil); err == nil {
		t.Fatal("want timeout error")
	}
	if d := time.Since(start); d > 2*time.Second {
		t.Fatalf("ctx-aware builtin: run took %v", d)
	}
	api.mu.Lock()
	gotCtxErr := api.ctxErr
	api.mu.Unlock()
	if gotCtxErr == nil {
		t.Fatal("CoreAPI call did not see the script deadline")
	}

	// Builtin ignoring ctx entirely: the caller must still be released.
	api2 := &recordingAPI{release: make(chan struct{})}
	defer close(api2.release)
	e2 := NewScriptEngine(nil, api2, nil)
	start = time.Now()
	if _, err := e2.runScript("h", "x", nil, dir, nil, nil); err == nil {
		t.Fatal("want timeout error")
	}
	if d := time.Since(start); d > 2*time.Second {
		t.Fatalf("blocking builtin: run took %v", d)
	}
}

// --- 5. value size caps ---------------------------------------------------

func TestRunScript_StringDoublingErrors(t *testing.T) {
	dir := writeScript(t, "h", `s := "x"; for i := 0; i < 40; i++ { s = s + s }; response = len(s)`)
	e := NewScriptEngine(nil, nil, nil)
	_, err := e.runScript("h", "x", nil, dir, nil, nil)
	if err == nil || !strings.Contains(err.Error(), "string size limit") {
		t.Fatalf("want string size limit error, got %v", err)
	}
}

func TestRunScript_SourceSizeCap(t *testing.T) {
	big := "response = 1\n" + strings.Repeat("// pad\n", coreapi.MaxScriptSourceBytes/7+1)
	dir := writeScript(t, "h", big)
	e := NewScriptEngine(nil, nil, nil)
	if _, err := e.runScript("h", "x", nil, dir, nil, nil); err == nil {
		t.Fatal("oversized script must be refused")
	}
}

// --- 6. registration scope ------------------------------------------------

func TestRuntimeRegistrationRejected(t *testing.T) {
	dir := writeScript(t, "h", `
r := import("core/routes").register("GET", "/evil", "h")
f := import("core/filters").add("node.title", "h")
ev := import("core/events").on("node.created", "h")
w := import("core/wellknown").register("x", "h")
response = is_error(r) && is_error(f) && is_error(ev) && is_error(w)
`)
	e := NewScriptEngine(nil, nil, nil)
	got, err := e.runScript("h", "x", capSet("routes:register", "filters:register", "events:subscribe"), dir, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if got != true {
		t.Fatalf("runtime registration must return errors, got %v", got)
	}
	if len(e.httpRoutes)+len(e.filterHandlers)+len(e.eventHandlers)+len(e.wellKnown) != 0 {
		t.Fatal("runtime handler registered something")
	}
}

func TestConcurrentLoadsKeepOwnCapabilities(t *testing.T) {
	e := NewScriptEngine(events.New(), nil, nil)
	const n = 8
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		slug := fmt.Sprintf("ext-%d", i)
		dir := writeExt(t, `import("core/events").on("node.created", "h")`, map[string]string{"h": ""})
		caps := capSet("events:subscribe", "own:"+slug)
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := e.LoadExtensionScripts(dir, slug, caps); err != nil {
				t.Error(err)
			}
		}()
	}
	wg.Wait()
	e.mu.RLock()
	defer e.mu.RUnlock()
	hs := e.eventHandlers["node.created"]
	if len(hs) != n {
		t.Fatalf("want %d handlers, got %d", n, len(hs))
	}
	for _, h := range hs {
		if !h.capabilities["own:"+h.slug] || len(h.capabilities) != 2 {
			t.Fatalf("handler %s stamped with wrong caps %v", h.slug, h.capabilities)
		}
		if !strings.Contains(h.baseDir, string(filepath.Separator)) {
			t.Fatalf("handler %s has no baseDir", h.slug)
		}
	}
}

// --- 7. unload stops event handlers -----------------------------------------

func TestUnloadStopsEventHandlers(t *testing.T) {
	bus := events.New()
	api := &recordingAPI{}
	e := NewScriptEngine(bus, api, nil)
	dir := writeExt(t, `import("core/events").on("test.evt", "h")`,
		map[string]string{"h": `import("core/log").info("ran")`})
	if err := e.LoadExtensionScripts(dir, "ext", capSet("events:subscribe", "log:write")); err != nil {
		t.Fatal(err)
	}
	bus.PublishSync("test.evt", events.Payload{})
	if api.logCount() != 1 {
		t.Fatalf("handler should run while loaded, ran %d times", api.logCount())
	}
	e.UnloadExtensionScripts(dir, "ext")
	bus.PublishSync("test.evt", events.Payload{})
	if err := bus.PublishRequest("test.evt", events.Payload{}); err != nil {
		t.Fatalf("no request handler should remain, got %v", err)
	}
	if api.logCount() != 1 {
		t.Fatalf("handler ran after unload (%d runs)", api.logCount())
	}
	if bus.HasHandlers("test.evt") {
		t.Fatal("bus subscriptions not dropped on unload")
	}
}

// --- 8. script route request/response hardening ---------------------------

func newRouteApp(t *testing.T, src string) *fiber.App {
	t.Helper()
	dir := writeScript(t, "h", src)
	e := NewScriptEngine(nil, nil, nil)
	e.httpRoutes = []httpRoute{{method: "POST", path: "/r", scriptPath: "h", baseDir: dir, slug: "x"}}
	e.activeBaseDirs[dir] = true
	app := fiber.New()
	e.MountRoutes(app)
	return app
}

func TestScriptRoute_StripsCredentialsAndRefusesHeaders(t *testing.T) {
	app := newRouteApp(t, `
response = {
	status: 200,
	headers: {"Set-Cookie": "squilla_session=evil", "Transfer-Encoding": "chunked", "X-Ok": "yes", "X-Bad": "a\r\nSet-Cookie: x=y"},
	body: request.headers
}`)
	req := httptest.NewRequest("POST", "/api/theme/r", strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Cookie", "squilla_session=secret")
	req.Header.Set("Authorization", "Bearer secret")
	req.Header.Set("Proxy-Authorization", "Basic secret")
	req.Header.Set("X-CSRF-Token", "secret")
	req.Header.Set("X-Custom", "kept")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	if strings.Contains(string(body), "secret") {
		t.Fatalf("credentials leaked to script: %s", body)
	}
	if !strings.Contains(string(body), "kept") {
		t.Fatalf("ordinary headers must pass through: %s", body)
	}
	if resp.Header.Get("Set-Cookie") != "" || resp.Header.Get("X-Bad") != "" {
		t.Fatalf("refused header set: %v", resp.Header)
	}
	if resp.Header.Get("X-Ok") != "yes" {
		t.Fatalf("allowed header missing: %v", resp.Header)
	}
}

func TestScriptRoute_StatusClamp(t *testing.T) {
	app := newRouteApp(t, `response = {status: 1000, body: "x"}`)
	resp, err := app.Test(httptest.NewRequest("POST", "/api/theme/r", nil))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 500 {
		t.Fatalf("out-of-range status must become 500, got %d", resp.StatusCode)
	}
}

func TestScriptRoute_BodyCap(t *testing.T) {
	app := newRouteApp(t, `response = {status: 200, body: "ran"}`)
	req := httptest.NewRequest("POST", "/api/theme/r", strings.NewReader(strings.Repeat("a", maxRouteBodyLen+1)))
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != fiber.StatusRequestEntityTooLarge {
		t.Fatalf("want 413, got %d", resp.StatusCode)
	}
}

// --- 9. script path traversal ---------------------------------------------

func TestScriptPathTraversalRejected(t *testing.T) {
	e := NewScriptEngine(nil, nil, nil)
	scope := &loadScope{slug: "x", caps: capSet("events:subscribe", "routes:register")}
	for _, p := range []string{"../evil", "/etc/passwd", "a/../../evil", "./../evil"} {
		if err := e.eventsOn(scope, "node.created", p, 10); err == nil {
			t.Errorf("events.on accepted %q", p)
		}
		if err := e.httpRegister(scope, "GET", "/x", p); err == nil {
			t.Errorf("routes.register accepted %q", p)
		}
	}
	if len(e.eventHandlers["node.created"])+len(e.httpRoutes) != 0 {
		t.Fatal("traversal path registered")
	}

	parent := t.TempDir()
	scripts := filepath.Join(parent, "scripts")
	_ = os.MkdirAll(scripts, 0o755)
	_ = os.WriteFile(filepath.Join(parent, "evil.tengo"), []byte(`response = "escaped"`), 0o644)
	if _, err := e.runScript("../evil", "x", nil, scripts, nil, nil); err == nil {
		t.Fatal("runScript executed a script outside its scripts dir")
	}
}

// --- 11. theme capability defaults ----------------------------------------

func TestDefaultThemeCapabilities_ThemeSettingsRead(t *testing.T) {
	caps := defaultThemeCapabilities()
	if !caps["theme_settings:read"] {
		t.Fatal("themes must be able to use core/theme_settings")
	}
	for _, c := range []string{"email:provide", "auth:observe", "http:observe"} {
		if caps[c] {
			t.Fatalf("themes must not get sensitive capability %q by default", c)
		}
	}
}

// --- 7. path confinement ---------------------------------------------------

// A symlink inside an installed package's scripts/ dir must not pull in a
// script from outside the package root — neither a handler nor the entry.
func TestScriptSymlinkOutsideRootRejected(t *testing.T) {
	outside := t.TempDir()
	evil := filepath.Join(outside, "evil.tengo")
	if err := os.WriteFile(evil, []byte(`response = "outside"`), 0o644); err != nil {
		t.Fatal(err)
	}
	dir := writeExt(t, `x := 1`, map[string]string{"ok": `response = "inside"`})
	sd := filepath.Join(dir, "scripts")
	if err := os.Symlink(evil, filepath.Join(sd, "h.tengo")); err != nil {
		t.Skipf("symlinks unsupported: %v", err)
	}
	e := NewScriptEngine(nil, nil, nil)
	if got, err := e.runScript("ok", "x", nil, sd, nil, nil); err != nil || got != "inside" {
		t.Fatalf("in-root script: got %v, %v", got, err)
	}
	if got, err := e.runScript("h", "x", nil, sd, nil, nil); err == nil {
		t.Fatalf("symlinked handler outside the root was run, got %v", got)
	}

	ext := t.TempDir()
	if err := os.MkdirAll(filepath.Join(ext, "scripts"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(evil, filepath.Join(ext, "scripts", "extension.tengo")); err != nil {
		t.Fatal(err)
	}
	if err := NewScriptEngine(nil, nil, nil).LoadExtensionScripts(ext, "x"); err == nil {
		t.Fatal("symlinked extension.tengo outside the root was loaded")
	}
}
