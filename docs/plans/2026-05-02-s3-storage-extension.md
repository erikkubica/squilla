# S3-Compatible Storage Extension Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bundled `s3-storage` extension that routes media bytes through any S3-compatible backend (AWS S3, Cloudflare R2, Backblaze B2, MinIO, DigitalOcean Spaces, Wasabi) with auto-verified setup, resumable bidirectional migration, and disaster-recovery reconcile — without the kernel learning the word "S3".

**Architecture:** A new generic `CoreAPI.CallProvider(tag, method, path, body)` lets one plugin call another by `provides`-tag (mirroring the existing `pm.GetProvider` kernel pattern). Media-manager calls `host.CallProvider("storage-provider", ...)` for byte ops; on `ErrNoProvider` it falls back to local `host.StoreFile`/`os.ReadFile`. URL resolution at render time goes through the same provider tag (`/resolve-url`). s3-storage plugs in only when its connection probe passes; deactivating it cleanly degrades to local without orphaning data or rewriting `media_files.url`.

**Tech Stack:** Go 1.24, `github.com/minio/minio-go/v7` (S3 client), HashiCorp go-plugin (gRPC), GORM (PostgreSQL), Vite + React + shadcn/ui (admin UI), `github.com/testcontainers/testcontainers-go` (integration tests with MinIO), Playwright (E2E).

**Source design:** [`docs/plans/2026-05-02-s3-storage-extension-design.md`](2026-05-02-s3-storage-extension-design.md)

---

## Phase 0 — Foundation: `CoreAPI.CallProvider`

Generic kernel addition: any plugin can call any provider by `provides`-tag. This is the cross-extension RPC primitive that everything else in this plan rests on.

### Task 0.1: Add `ErrNoProvider` sentinel

**Files:**
- Modify: `internal/coreapi/api.go` (add `var ErrNoProvider = errors.New("no provider for tag")` near other sentinels)

**Step 1:** Search for existing error sentinels in `internal/coreapi/api.go` and `errors.go` to match the pattern.
**Step 2:** Add `ErrNoProvider`. Add `errors` to imports if needed.
**Step 3:** `go build ./...` — expected: clean build.
**Step 4:** Commit.

```bash
git add internal/coreapi/
git commit -m "feat(coreapi): add ErrNoProvider sentinel for CallProvider lookups"
```

---

### Task 0.2: Add `CallProvider` to `CoreAPI` interface

**Files:**
- Modify: `internal/coreapi/api.go`

**Step 1: Define request/response types and the method.**

```go
// ProviderRequest is the input shape for CallProvider — same fields as the
// HTTP request a plugin's HandleHTTPRequest already accepts, so dispatch is a
// trivial pass-through to the existing extension HTTP plumbing.
type ProviderRequest struct {
    Method      string
    Path        string
    Headers     map[string]string
    Body        []byte
    QueryParams map[string]string
}

// ProviderResponse mirrors HandleHTTPRequest's response shape for the same reason.
type ProviderResponse struct {
    StatusCode int
    Headers    map[string]string
    Body       []byte
}

// CallProvider dispatches an HTTP-style call to whichever active extension
// declares the given provides-tag, with the highest priority winning ties.
// Returns ErrNoProvider if no active extension provides the tag.
//
// This is the canonical cross-extension RPC primitive: callers reference
// extensions by what they DO (the tag) rather than by slug, so operators
// can hot-swap one provider for another without code changes.
CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error)
```

Add to the `CoreAPI` interface block.

**Step 2:** `go build ./...` — expected: failures in every CoreAPI implementer (`coreImpl`, `GRPCHostClient`, `capabilityGuard`, test stubs).

**Step 3:** Add stub implementations everywhere the build fails (return `NewInternal("not implemented")` or similar — real impls land in 0.3, 0.4, 0.7, 0.8). At minimum:
- `internal/coreapi/impl_call_provider.go` (new) — `coreImpl.CallProvider` returning `NewInternal("CallProvider not yet wired")`
- `internal/coreapi/grpc_client_meta.go` — `GRPCHostClient.CallProvider` stub
- `internal/coreapi/capability.go` — `capabilityGuard.CallProvider` passthrough
- `internal/coreapi/capability_test.go` — `stubCoreAPI.CallProvider` stub

**Step 4:** `go build ./...` — expected: clean.

**Step 5:** Commit.

```bash
git commit -m "feat(coreapi): add CallProvider interface method (stubs)"
```

---

### Task 0.3: Implement `coreImpl.CallProvider`

**Files:**
- Modify: `internal/coreapi/impl_call_provider.go`
- Modify: `internal/coreapi/impl.go` (or wherever `coreImpl` is declared) — add a `getPM func() *cms.PluginManager` field if one doesn't already exist; if it does, reuse it.
- Test: `internal/coreapi/impl_call_provider_test.go`

**Reference precedent:** `internal/coreapi/media_provider_plugin.go` already does exactly this dispatch (kernel-side). `CallProvider` is the same logic, just exposed through CoreAPI for plugins.

**Step 1: Write failing test** — `impl_call_provider_test.go`:

```go
package coreapi

import (
    "context"
    "errors"
    "testing"
)

func TestCallProvider_NoProvider_ReturnsErrNoProvider(t *testing.T) {
    c := &coreImpl{getPM: func() *cms.PluginManager { return nil }}
    _, err := c.CallProvider(context.Background(), "storage-provider", ProviderRequest{})
    if !errors.Is(err, ErrNoProvider) {
        t.Fatalf("got %v, want ErrNoProvider", err)
    }
}
```

**Step 2:** `go test ./internal/coreapi -run TestCallProvider_NoProvider_ReturnsErrNoProvider` — expected: FAIL.

**Step 3: Implement.** In `impl_call_provider.go`:

```go
func (c *coreImpl) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
    if tag == "" {
        return nil, NewValidation("tag is required")
    }
    pm := c.getPM()
    if pm == nil || !pm.HasProvider(tag) {
        return nil, ErrNoProvider
    }
    client := pm.GetProvider(tag)
    if client == nil {
        return nil, ErrNoProvider
    }
    pbReq := &pb.PluginHTTPRequest{
        Method:      req.Method,
        Path:        req.Path,
        Headers:     req.Headers,
        Body:        req.Body,
        QueryParams: req.QueryParams,
    }
    resp, err := client.HandleHTTPRequest(pbReq)
    if err != nil {
        return nil, NewInternal("call provider " + tag + ": " + err.Error())
    }
    return &ProviderResponse{
        StatusCode: int(resp.StatusCode),
        Headers:    resp.Headers,
        Body:       resp.Body,
    }, nil
}
```

**Step 4:** Run the test — expected: PASS. Add a second test that wires a fake `cms.PluginManager` returning a stub `GRPCClient` whose `HandleHTTPRequest` echoes the request, asserting the round-trip. Mirror the wiring in `media_provider_plugin_test.go` if one exists; otherwise consult `internal/cms/plugin_manager.go:381` (`GetProvider`).

**Step 5:** Commit.

```bash
git commit -m "feat(coreapi): implement coreImpl.CallProvider via provides-tag dispatch"
```

---

### Task 0.4: Add `providers:call` capability

**Files:**
- Modify: `internal/coreapi/capability.go` — add `CapProvidersCall = "providers:call"`; add the entry to the gating switch in `capabilityGuard.CallProvider`.
- Modify: `internal/coreapi/capability_test.go` — add a row to the table-driven gating test asserting `CallProvider` requires `providers:call`.

**Step 1:** Write test row first (TDD).
**Step 2:** Run — expected: FAIL.
**Step 3:** Implement gating: in `capabilityGuard.CallProvider`, call `g.require(CapProvidersCall)` then delegate to `g.inner.CallProvider`.
**Step 4:** Run — PASS.
**Step 5:** Commit.

```bash
git commit -m "feat(coreapi): gate CallProvider on providers:call capability"
```

---

### Task 0.5: Add `CallProvider` rpc to proto

**Files:**
- Modify: `proto/coreapi/squilla_coreapi.proto`
- Regenerate: `pkg/plugin/coreapipb/squilla_coreapi.pb.go`, `..._grpc.pb.go`

**Step 1:** Add to the proto file:

```protobuf
service SquillaHost {
  // ... existing rpcs ...
  rpc CallProvider(CallProviderRequest) returns (CallProviderResponse);
}

message CallProviderRequest {
  string tag = 1;
  string method = 2;
  string path = 3;
  map<string, string> headers = 4;
  bytes body = 5;
  map<string, string> query_params = 6;
}

message CallProviderResponse {
  int32 status_code = 1;
  map<string, string> headers = 2;
  bytes body = 3;
  // error_no_provider=true means "no extension declares this tag"; treat
  // identically to coreapi.ErrNoProvider client-side.
  bool error_no_provider = 4;
  // Generic transport error message; only set when error_no_provider=false
  // and the call could not complete.
  string error = 5;
}
```

**Step 2:** Regenerate. Inspect the existing build setup — there's likely a `Makefile` or a `buf.gen.yaml`. Run whatever target regenerates `pkg/plugin/coreapipb/`. If unsure, check `git log -- proto/coreapi/squilla_coreapi.proto` for the last regen command in commit messages.

**Step 3:** `go build ./...` — expected: clean.
**Step 4:** Commit.

```bash
git add proto/ pkg/plugin/coreapipb/
git commit -m "feat(proto): add CallProvider rpc to SquillaHost"
```

---

### Task 0.6: Wire gRPC server (kernel side)

**Files:**
- Modify: `internal/coreapi/grpc_server_*.go` (likely a new `grpc_server_call_provider.go`, mirror an existing handler like `grpc_server_data.go`)

**Step 1:** Write a server-side test (`internal/coreapi/grpc_server_call_provider_test.go`) that constructs the gRPC server, calls `CallProvider` with a tag that maps to a fake provider returning canned bytes, and asserts the response round-trips intact. Also a case for `ErrNoProvider` setting `error_no_provider=true`.

**Step 2:** Run — FAIL.

**Step 3:** Implement `func (s *hostServer) CallProvider(ctx, in *coreapipb.CallProviderRequest) (*coreapipb.CallProviderResponse, error)`. Translates the request to `coreapi.ProviderRequest`, calls `s.api.CallProvider`, maps `ErrNoProvider` to `error_no_provider=true`, all other errors to the `error` string.

**Step 4:** Run — PASS.
**Step 5:** Commit.

```bash
git commit -m "feat(coreapi): gRPC server-side CallProvider handler"
```

---

### Task 0.7: Wire gRPC client (plugin side)

**Files:**
- Modify: `internal/coreapi/grpc_client_meta.go` — replace the `not supported via gRPC` stub with a real impl.

**Step 1:** Write a test (`internal/coreapi/grpc_client_call_provider_test.go`) that boots the gRPC server from 0.6 (use `grpc.NewServer` + `bufconn`), wires the client, and asserts a round-trip. Include the `ErrNoProvider` mapping case.

**Step 2:** Run — FAIL.

**Step 3:** Implement:

```go
func (c *GRPCHostClient) CallProvider(ctx context.Context, tag string, req ProviderRequest) (*ProviderResponse, error) {
    resp, err := c.client.CallProvider(ctx, &coreapipb.CallProviderRequest{
        Tag: tag, Method: req.Method, Path: req.Path,
        Headers: req.Headers, Body: req.Body, QueryParams: req.QueryParams,
    })
    if err != nil { return nil, err }
    if resp.ErrorNoProvider { return nil, ErrNoProvider }
    if resp.Error != "" { return nil, NewInternal(resp.Error) }
    return &ProviderResponse{
        StatusCode: int(resp.StatusCode), Headers: resp.Headers, Body: resp.Body,
    }, nil
}
```

**Step 4:** Run — PASS.
**Step 5:** Commit.

```bash
git commit -m "feat(coreapi): gRPC client-side CallProvider with ErrNoProvider mapping"
```

---

### Task 0.8: Verify end-to-end CallProvider

**Step 1:** Add `internal/coreapi/call_provider_e2e_test.go` that boots a fake `*cms.PluginManager` registering a fake `GRPCClient` for tag `test-provider`, then calls through `CallProvider` end-to-end (kernel impl, no gRPC bridge needed for this kernel-internal e2e).
**Step 2:** Run — must pass.
**Step 3:** `go test ./... -count=1` — must pass.
**Step 4:** Commit.

```bash
git commit -m "test(coreapi): end-to-end CallProvider round-trip"
```

---

## Phase 1 — Media-manager publish-or-fallback helpers

Replace `host.StoreFile` / `os.ReadFile` / `host.DeleteFile` calls with helpers that delegate to a `storage-provider` extension when one is active and fall back to local otherwise.

### Task 1.1: Create `mediaStorage` helpers

**Files:**
- Create: `extensions/media-manager/cmd/plugin/storage.go`
- Test: `extensions/media-manager/cmd/plugin/storage_test.go`

**Step 1: Write test** — first failing test asserts that `mediaStorageStore` falls back to local when `host.CallProvider` returns `ErrNoProvider`:

```go
func TestMediaStorageStore_FallbackOnNoProvider(t *testing.T) {
    h := &fakeHost{
        callProviderErr: coreapi.ErrNoProvider,
        storeFileURL:    "/media/foo.jpg",
    }
    p := &MediaManagerPlugin{host: h}
    url, err := p.mediaStorageStore(context.Background(), "media/foo.jpg", []byte("x"))
    if err != nil || url != "/media/foo.jpg" {
        t.Fatalf("got url=%q err=%v", url, err)
    }
    if h.calls != []string{"CallProvider", "StoreFile"} {
        t.Fatalf("call order wrong: %v", h.calls)
    }
}
```

`fakeHost` is a minimal stub of the `coreapi.CoreAPI` surface used by media-manager — only `CallProvider`, `StoreFile`, `DeleteFile`, `Log` need to be implemented for these tests.

**Step 2:** Run — FAIL (helper doesn't exist).

**Step 3: Implement** in `storage.go`:

```go
package main

import (
    "context"
    "encoding/json"
    "errors"
    "fmt"

    "squilla/internal/coreapi"
)

// mediaStorageStore writes media bytes to whichever storage-provider
// extension is active+verified; falls back to local disk on ErrNoProvider.
// Returns the public-facing URL the renderer should use as the default
// when no URL-resolution filter rewrites it.
func (p *MediaManagerPlugin) mediaStorageStore(ctx context.Context, path string, data []byte) (string, error) {
    body, _ := json.Marshal(map[string]any{"path": path, "data": data})
    resp, err := p.host.CallProvider(ctx, "storage-provider", coreapi.ProviderRequest{
        Method: "POST", Path: "/store",
        Headers: map[string]string{"Content-Type": "application/json"},
        Body:    body,
    })
    if err == nil && resp.StatusCode == 200 {
        var out struct{ URL string `json:"url"` }
        if err := json.Unmarshal(resp.Body, &out); err == nil && out.URL != "" {
            return out.URL, nil
        }
    }
    if err != nil && !errors.Is(err, coreapi.ErrNoProvider) {
        return "", fmt.Errorf("storage-provider store: %w", err)
    }
    // ErrNoProvider OR provider responded but with unexpected shape — fall back.
    return p.host.StoreFile(ctx, path, data)
}

func (p *MediaManagerPlugin) mediaStorageRead(ctx context.Context, path string) ([]byte, error) {
    body, _ := json.Marshal(map[string]any{"path": path})
    resp, err := p.host.CallProvider(ctx, "storage-provider", coreapi.ProviderRequest{
        Method: "POST", Path: "/read",
        Headers: map[string]string{"Content-Type": "application/json"},
        Body:    body,
    })
    if err == nil && resp.StatusCode == 200 {
        return resp.Body, nil
    }
    if err != nil && !errors.Is(err, coreapi.ErrNoProvider) {
        return nil, fmt.Errorf("storage-provider read: %w", err)
    }
    return p.readLocal(path) // small helper that wraps os.ReadFile with the storageDir prefix
}

func (p *MediaManagerPlugin) mediaStorageDelete(ctx context.Context, path string) error {
    body, _ := json.Marshal(map[string]any{"path": path})
    resp, err := p.host.CallProvider(ctx, "storage-provider", coreapi.ProviderRequest{
        Method: "POST", Path: "/delete",
        Headers: map[string]string{"Content-Type": "application/json"},
        Body:    body,
    })
    if err == nil && (resp.StatusCode == 200 || resp.StatusCode == 204) {
        return nil
    }
    if err != nil && !errors.Is(err, coreapi.ErrNoProvider) {
        return fmt.Errorf("storage-provider delete: %w", err)
    }
    return p.host.DeleteFile(ctx, path)
}
```

**Step 4:** Add tests for `mediaStorageRead` (fallback to `os.ReadFile`) and `mediaStorageDelete` (fallback to `host.DeleteFile`), plus the success-path-via-provider case for each.

**Step 5:** Run — PASS.

**Step 6:** Commit.

```bash
git commit -m "feat(media-manager): mediaStorage helpers with provider-or-local fallback"
```

---

### Task 1.2: Migrate `crud.go` call sites

**Files:**
- Modify: `extensions/media-manager/cmd/plugin/crud.go` (lines 220, 234, 259, 261, 323, 331)

**Step 1:** Locate every `p.host.StoreFile(...)` / `p.host.DeleteFile(...)` call in `crud.go`.

**Step 2:** Replace `p.host.StoreFile(ctx, path, data)` with `p.mediaStorageStore(ctx, path, data)`. Replace `p.host.DeleteFile(ctx, path)` with `p.mediaStorageDelete(ctx, path)`.

**Step 3:** Run media-manager tests: `go test ./extensions/media-manager/...` — expected: PASS (helpers fall back to local because no provider is registered in unit tests, so behavior is unchanged).

**Step 4:** Commit.

```bash
git commit -m "refactor(media-manager): route crud.go storage calls through helpers"
```

---

### Task 1.3: Migrate `optimizer.go` call sites

Same as 1.2 but for `optimizer.go` lines 40, 46, 111, 124, 160. Replace `os.ReadFile(origFullPath)` with `p.mediaStorageRead(ctx, relPath)` (note: helper takes the LOGICAL path like `media/2025/12/foo.jpg`, not the absolute path — adjust the call site). Same for line 111.

Tests + commit.

```bash
git commit -m "refactor(media-manager): route optimizer.go storage calls through helpers"
```

---

### Task 1.4: Migrate `events.go` call sites

Lines 117 (`os.ReadFile`), 145, 168 (`StoreFile`), 210, 214, 225, 342, 345 (`DeleteFile`). Same swap pattern. Tests + commit.

```bash
git commit -m "refactor(media-manager): route events.go storage calls through helpers"
```

---

### Task 1.5: Migrate `helpers.go` (variant resize)

`handlePublicCacheRequest` reads originals from local disk (`os.ReadFile`) — swap to `p.mediaStorageRead`. **Cache writes stay local** — keep `p.cacheWrite(...)` calls untouched. This is critical: resized variants must remain on local disk for fast serving.

Tests + commit.

```bash
git commit -m "refactor(media-manager): variant resizer reads originals via helpers; cache stays local"
```

---

### Task 1.6: Add `providers:call` capability to media-manager manifest

**Files:**
- Modify: `extensions/media-manager/extension.json`

Add `"providers:call"` to the `capabilities` array. Run `go test ./extensions/media-manager/...` and `go test ./internal/...` — must pass.

```bash
git commit -m "feat(media-manager): declare providers:call capability"
```

---

## Phase 2 — Media URL resolution via provider

Render-time URL resolution. When the storage-provider is active and owns a media file, its CDN-aware URL is used; otherwise the local `/media/...` path stays.

### Task 2.1: Add `resolveMediaURL` helper to media-manager

**Files:**
- Create: `extensions/media-manager/cmd/plugin/render_url.go`
- Test: `extensions/media-manager/cmd/plugin/render_url_test.go`

**Step 1:** Write test asserting that when `host.CallProvider` returns a 200 with `{"url":"https://cdn.example.com/foo.jpg"}` for `POST /resolve-url {media_id}`, the helper returns that URL. When it returns `ErrNoProvider`, helper returns the default URL untouched.

**Step 2:** Run — FAIL.

**Step 3:** Implement:

```go
func (p *MediaManagerPlugin) resolveMediaURL(ctx context.Context, mediaID uint, defaultURL string) string {
    body, _ := json.Marshal(map[string]any{"media_id": mediaID, "default_url": defaultURL})
    resp, err := p.host.CallProvider(ctx, "storage-provider", coreapi.ProviderRequest{
        Method: "POST", Path: "/resolve-url",
        Headers: map[string]string{"Content-Type": "application/json"},
        Body:    body,
    })
    if err != nil || resp.StatusCode != 200 {
        return defaultURL
    }
    var out struct{ URL string `json:"url"` }
    if err := json.Unmarshal(resp.Body, &out); err != nil || out.URL == "" {
        return defaultURL
    }
    return out.URL
}
```

**Step 4:** Run — PASS.

**Step 5:** Commit.

```bash
git commit -m "feat(media-manager): resolveMediaURL helper for storage-provider URL rewrites"
```

---

### Task 2.2: Apply `resolveMediaURL` in API responses

**Files:** Find every place media-manager emits a media URL in API responses. Likely in `crud.go` (handleList, handleGet), `events.go`, and any place that builds a `MediaFile` JSON.

**Step 1:** Grep `extensions/media-manager` for `"/media/"` strings, `mediaFile.URL`, and JSON emission sites.

**Step 2:** Wherever a media URL is emitted in a response, wrap it in `p.resolveMediaURL(ctx, m.ID, m.URL)`.

**Step 3:** Run media-manager tests — must pass (no provider registered → URLs unchanged).

**Step 4:** Add a regression test that registers a fake provider returning a rewritten URL, and asserts the API response uses the rewritten URL.

**Step 5:** Commit.

```bash
git commit -m "feat(media-manager): apply resolveMediaURL to API response builders"
```

---

## Phase 3 — s3-storage scaffold

### Task 3.1: Manifest + directory layout

**Files:**
- Create: `extensions/s3-storage/extension.json`
- Create: `extensions/s3-storage/README.md` (one-line stub for now)
- Create: `extensions/s3-storage/migrations/` (empty dir, `.gitkeep`)
- Create: `extensions/s3-storage/cmd/plugin/` (empty dir)
- Create: `extensions/s3-storage/admin-ui/` (empty dir)
- Create: `extensions/s3-storage/scripts/` (empty dir)
- Create: `extensions/s3-storage/bin/.gitkeep`

Use the manifest from the design doc (`docs/plans/2026-05-02-s3-storage-extension-design.md`, "Manifest highlights"). Set `auto_activate: false`.

```bash
git commit -m "feat(s3-storage): bundle layout + manifest"
```

---

### Task 3.2: Migrations

**Files:**
- Create: `extensions/s3-storage/migrations/0001_init.sql`

Use the SQL from the design doc ("Database schema").

```bash
git commit -m "feat(s3-storage): initial migration for s3_file_locations and s3_migration_jobs"
```

---

### Task 3.3: Plugin entry skeleton

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/main.go`

Mirror `extensions/smtp-provider/cmd/plugin/main.go`'s structure (the `goplugin.Serve` block is identical). Define a struct:

```go
type S3StoragePlugin struct {
    host     *coreapi.GRPCHostClient
    settings atomic.Pointer[storageSettings]
    verified atomic.Bool
    client   atomic.Pointer[s3Client]   // type defined in client.go
    worker   *migrationWorker            // populated in Phase 10
}

func (p *S3StoragePlugin) GetSubscriptions() ([]*pb.Subscription, error) {
    return nil, nil // no event subscriptions; everything routes via HandleHTTPRequest
}
func (p *S3StoragePlugin) HandleEvent(string, []byte) (*pb.EventResponse, error) {
    return &pb.EventResponse{Handled: false}, nil
}
func (p *S3StoragePlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
    return &pb.PluginHTTPResponse{StatusCode: 404, Body: []byte(`{"error":"not implemented yet"}`)}, nil
}
func (p *S3StoragePlugin) Shutdown() error { return nil }
func (p *S3StoragePlugin) Initialize(hostConn *grpc.ClientConn) error {
    p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
    return nil
}

func main() {
    goplugin.Serve(&goplugin.ServeConfig{
        HandshakeConfig: vibeplugin.Handshake,
        VersionedPlugins: map[int]goplugin.PluginSet{
            2: {"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &S3StoragePlugin{}}},
        },
        GRPCServer: vibeplugin.NewGRPCServer,
    })
}
```

**Step:** `go build -o /tmp/s3-storage ./extensions/s3-storage/cmd/plugin/` — must succeed.

```bash
git commit -m "feat(s3-storage): plugin entry skeleton"
```

---

### Task 3.4: Build script

**Files:**
- Create: `extensions/s3-storage/scripts/build.sh`

Mirror `extensions/media-manager/scripts/build.sh`. Should compile the plugin to `bin/s3-storage` AND run the admin-ui Vite build to `admin-ui/dist/`.

```bash
chmod +x extensions/s3-storage/scripts/build.sh
git commit -m "feat(s3-storage): build script"
```

---

### Task 3.5: Add `minio-go` dependency

**Step:** `go get github.com/minio/minio-go/v7` then `go mod tidy`.
**Step:** `go build ./...` — clean.

```bash
git commit -m "deps: add minio-go/v7 for s3-storage extension"
```

---

## Phase 4 — S3 client wrapper

### Task 4.1: Define `s3Client` interface

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/client.go`
- Test: `extensions/s3-storage/cmd/plugin/client_test.go`

```go
// s3Client is the narrow surface s3-storage needs from any S3-compatible
// backend. Defined as an interface so tests can swap in a fake; production
// uses minioClient (a thin wrapper around minio-go).
type s3Client interface {
    PutObject(ctx context.Context, key string, body []byte, contentType string) (etag string, err error)
    GetObject(ctx context.Context, key string) ([]byte, error)
    StatObject(ctx context.Context, key string) (etag string, size int64, err error)
    RemoveObject(ctx context.Context, key string) error
    BucketExists(ctx context.Context) (bool, error)
    ListObjects(ctx context.Context, prefix string, fn func(key string, etag string, size int64, modified time.Time) error) error
}
```

### Task 4.2: Implement `minioClient`

**Step 1:** Test that `newMinioClient(settings)` constructs a client with the right endpoint, region, path-style toggle (use minio's `Options` struct in dry-run mode — don't actually connect).

**Step 2:** FAIL.

**Step 3:** Implement using `minio-go/v7`:

```go
type minioClient struct {
    c      *minio.Client
    bucket string
}

func newMinioClient(s storageSettings) (*minioClient, error) {
    creds := credentials.NewStaticV4(s.AccessKeyID, s.SecretAccessKey, "")
    endpoint, secure := normalizeEndpoint(s.Endpoint) // strips https://, returns secure=true if it was https
    if endpoint == "" { endpoint = "s3.amazonaws.com" }
    cli, err := minio.New(endpoint, &minio.Options{
        Creds:        creds,
        Secure:       secure,
        Region:       s.Region,
        BucketLookup: lookupType(s.PathStyle),
    })
    if err != nil { return nil, err }
    return &minioClient{c: cli, bucket: s.Bucket}, nil
}

func lookupType(pathStyle bool) minio.BucketLookupType {
    if pathStyle { return minio.BucketLookupPath }
    return minio.BucketLookupAuto
}
```

Implement each interface method. Tests use a fake or run against a MinIO container in Phase 14.

**Step 4:** PASS.

**Step 5:** Commit.

```bash
git commit -m "feat(s3-storage): s3Client interface + minio-go implementation"
```

---

## Phase 5 — Connection probe

### Task 5.1: 5-step probe

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/verify.go`
- Test: `extensions/s3-storage/cmd/plugin/verify_test.go`

**Step 1:** Write tests using a fake `s3Client` that fails one step at a time. Each test asserts that the probe stops at the correct step and reports the expected IAM action name.

```go
func TestProbe_StopsAtListBucketWithIAMHint(t *testing.T) {
    fc := &fakeS3{bucketExistsErr: errors.New("AccessDenied")}
    res := probe(context.Background(), fc, "https://cdn.example.com")
    if res.FailedStep != "list" {
        t.Fatalf("step=%q, want list", res.FailedStep)
    }
    if !strings.Contains(res.Hint, "s3:ListBucket") {
        t.Fatalf("hint=%q does not mention required IAM action", res.Hint)
    }
}
```

**Step 2:** FAIL.

**Step 3:** Implement:

```go
type probeResult struct {
    OK         bool
    FailedStep string  // "auth"|"list"|"put"|"get"|"delete"|"public-fetch"|""
    Error      string
    Hint       string  // human + IAM action name
    Steps      []probeStep
}

type probeStep struct {
    Name string `json:"name"`
    OK   bool   `json:"ok"`
    Err  string `json:"err,omitempty"`
}

func probe(ctx context.Context, c s3Client, publicURLPrefix string) probeResult {
    var steps []probeStep
    record := func(name string, err error) probeResult {
        ok := err == nil
        steps = append(steps, probeStep{Name: name, OK: ok, Err: errString(err)})
        if ok { return probeResult{} }
        return probeResult{
            FailedStep: name, Error: err.Error(), Hint: hintFor(name, err), Steps: steps,
        }
    }
    if exists, err := c.BucketExists(ctx); err != nil {
        return record("list", err)
    } else if !exists {
        return record("list", errors.New("bucket does not exist"))
    }
    record("list", nil)

    const probeKey = ".squilla-healthcheck"
    if _, err := c.PutObject(ctx, probeKey, []byte("ok"), "text/plain"); err != nil {
        return record("put", err)
    }
    record("put", nil)

    if _, err := c.GetObject(ctx, probeKey); err != nil {
        return record("get", err)
    }
    record("get", nil)

    if err := c.RemoveObject(ctx, probeKey); err != nil {
        return record("delete", err)
    }
    record("delete", nil)

    if publicURLPrefix != "" {
        if err := publicFetchProbe(ctx, publicURLPrefix, probeKey); err != nil {
            // Note: probeKey was deleted — we re-PUT-then-GET-then-DELETE inside
            // publicFetchProbe to avoid a TOCTOU between probe steps.
            return record("public-fetch", err)
        }
        record("public-fetch", nil)
    }
    return probeResult{OK: true, Steps: steps}
}

func hintFor(step string, err error) string {
    table := map[string]string{
        "auth":         "Bad credentials. Check access_key_id and secret_access_key.",
        "list":         "Missing s3:ListBucket. Add it to the IAM policy on this bucket.",
        "put":          "Missing s3:PutObject. Add it to the IAM policy on this bucket.",
        "get":          "Missing s3:GetObject. Add it to the IAM policy on this bucket.",
        "delete":       "Missing s3:DeleteObject. Add it to the IAM policy on this bucket.",
        "public-fetch": "Object stored fine but not publicly readable. Check bucket policy / public access settings.",
    }
    if h, ok := table[step]; ok { return h }
    return err.Error()
}
```

**Step 4:** Add table-driven tests for every step.

**Step 5:** Commit.

```bash
git commit -m "feat(s3-storage): connection probe with per-step IAM hints"
```

---

## Phase 6 — URL composition

### Task 6.1: `composeExternalURL`

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/url.go`
- Test: `extensions/s3-storage/cmd/plugin/url_test.go`

**Step 1:** Table-driven test:

```go
func TestComposeExternalURL(t *testing.T) {
    cases := []struct {
        name, prefix, endpoint, region, bucket, key, want string
        pathStyle bool
    }{
        {"aws-default-virtual-host", "", "", "us-east-1", "media", "2025/foo.jpg", "https://media.s3.amazonaws.com/2025/foo.jpg", false},
        {"aws-eu-virtual-host", "", "", "eu-central-1", "media", "2025/foo.jpg", "https://media.s3.eu-central-1.amazonaws.com/2025/foo.jpg", false},
        {"with-cdn-prefix", "https://cdn.example.com", "", "us-east-1", "media", "2025/foo.jpg", "https://cdn.example.com/2025/foo.jpg", false},
        {"r2-style", "", "https://abc.r2.cloudflarestorage.com", "auto", "media", "2025/foo.jpg", "https://abc.r2.cloudflarestorage.com/media/2025/foo.jpg", true},
        {"minio-path-style", "", "http://minio:9000", "us-east-1", "media", "2025/foo.jpg", "http://minio:9000/media/2025/foo.jpg", true},
        {"trailing-slash-prefix", "https://cdn.example.com/", "", "us-east-1", "media", "2025/foo.jpg", "https://cdn.example.com/2025/foo.jpg", false},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            got := composeExternalURL(tc.prefix, tc.endpoint, tc.region, tc.bucket, tc.key, tc.pathStyle)
            if got != tc.want { t.Errorf("got %q, want %q", got, tc.want) }
        })
    }
}
```

**Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS. **Step 5:** Commit.

```bash
git commit -m "feat(s3-storage): URL composition for AWS / R2 / MinIO / CDN-prefixed"
```

---

## Phase 7 — Settings persistence

### Task 7.1: Settings load + save

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/settings.go`
- Test: `extensions/s3-storage/cmd/plugin/settings_test.go`

Settings live in core's `settings` table under prefix `ext.s3-storage.*`. Use `host.GetSettings(prefix)` and `host.SetSetting`. Implement:

```go
type storageSettings struct {
    Endpoint, Region, Bucket, AccessKeyID, SecretAccessKey, PublicURLPrefix string
    PathStyle      bool
    KeepLocalDays  int
}

func (p *S3StoragePlugin) loadSettings(ctx context.Context) (*storageSettings, error) { ... }
func (p *S3StoragePlugin) saveSettings(ctx context.Context, s *storageSettings) error { ... }
```

Tests use a fake host that records `SetSetting` calls. Commit.

```bash
git commit -m "feat(s3-storage): settings load/save with sensitive-field redaction"
```

---

## Phase 8 — `HandleHTTPRequest` router

### Task 8.1: Basic router scaffolding

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/handler.go`

Replace the stub `HandleHTTPRequest` in main.go with a dispatch:

```go
func (p *S3StoragePlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
    switch req.Method + " " + req.Path {
    case "POST /test-connection":   return p.handleTestConnection(req)
    case "GET /status":             return p.handleStatus(req)
    case "POST /store":             return p.handleStore(req)
    case "POST /read":              return p.handleRead(req)
    case "POST /delete":            return p.handleDelete(req)
    case "POST /resolve-url":       return p.handleResolveURL(req)
    case "POST /migration/start":   return p.handleMigrationStart(req)
    case "GET /migration/progress": return p.handleMigrationProgress(req)
    case "POST /migration/cancel":  return p.handleMigrationCancel(req)
    case "POST /migration/retry-failed": return p.handleMigrationRetryFailed(req)
    case "POST /reconcile-from-bucket":  return p.handleReconcile(req)
    case "PUT /settings":           return p.handleSaveSettings(req)
    case "GET /settings":           return p.handleGetSettings(req)
    }
    return jsonResponse(404, map[string]string{"error": "not found"}), nil
}
```

Stub each handler to return 501 — the next phases fill them in. Commit.

```bash
git commit -m "feat(s3-storage): HandleHTTPRequest router skeleton"
```

---

## Phase 9 — Storage operation handlers (TDD each)

### Task 9.1: `handleStore`

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/store_handler.go`
- Test: `extensions/s3-storage/cmd/plugin/store_handler_test.go`

**Behavior:**
1. Reject (503) if `verified=false`.
2. Decode `{path, data}` from JSON body.
3. Compute storage key via `keyFor(path)` (typically strip leading `media/`).
4. Call `client.PutObject`.
5. INSERT into `s3_file_locations` (use `host.DataCreate`).
6. Compose external URL via `composeExternalURL`.
7. Return `{url, etag}`.

Tests cover: not-verified-503, happy path, PutObject error, DataCreate error, conflicting key (already exists → upsert vs error decision: upsert with new etag).

```bash
git commit -m "feat(s3-storage): handleStore with verified gating + s3_file_locations row"
```

### Task 9.2: `handleRead`

Decode `{path}`, look up key from `s3_file_locations` by matching `media_files.url = "/media/" + path` (or by storing the logical path in `s3_file_locations` directly — preferred), call `GetObject`, return bytes in body with `Content-Type: application/octet-stream`. 404 if no row exists.

```bash
git commit -m "feat(s3-storage): handleRead returns object bytes via GetObject"
```

### Task 9.3: `handleDelete`

Decode `{path}`, lookup key, `RemoveObject`, `DataDelete` the row. Idempotent — return 200 even if row was already gone.

```bash
git commit -m "feat(s3-storage): handleDelete cascades to S3 + s3_file_locations row"
```

### Task 9.4: `handleResolveURL`

Decode `{media_id, default_url}`. SELECT `external_url FROM s3_file_locations WHERE media_id=?`. Return that URL if found, else `{url: default_url}`. Returns the default URL even if `verified=false` (filter must keep working for already-migrated files even when probe goes red).

```bash
git commit -m "feat(s3-storage): handleResolveURL for render-time URL rewrites"
```

---

## Phase 10 — Verification & test-connection

### Task 10.1: `handleTestConnection`

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/verify_handler.go`

Build a client from current settings, run the probe, set `p.verified.Store(probeResult.OK)`, persist `verified` to settings (so it survives plugin restart). Return the per-step JSON.

If `OK=true` and `keep_local_days` setting just changed, kick off a background grace-deletion sweep of expired rows (Phase 11.6).

```bash
git commit -m "feat(s3-storage): test-connection runs probe and flips verified"
```

### Task 10.2: `handleSaveSettings`

Validate inputs (non-empty bucket / creds; bucket policy unchanged check). Persist via `host.SetSetting`. Trigger an auto-verify (call `handleTestConnection` internally). Return the test result.

If user changed `bucket` while `s3_file_locations` is non-empty, reject with 409 and message `"Bucket change blocked: 2,154 files reference the previous bucket. Migrate back to local first."` Tests for this.

```bash
git commit -m "feat(s3-storage): save settings with auto-verify and bucket-change guard"
```

### Task 10.3: Settings round-trip on plugin start

In `Initialize`, after wiring `p.host`, load settings and re-run probe. Subscribe behavior (events & filter) is already covered by `verified.Load()` checks inside the handlers — no separate subscribe call needed because dispatch is via `provides`-tag.

```bash
git commit -m "feat(s3-storage): re-verify on plugin start"
```

---

## Phase 11 — Migration worker

### Task 11.1: Job table helpers

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/migration_db.go`
- Test: `..._test.go`

Helpers wrapping `host.DataExec` / `DataQuery`:
- `enqueueForward(ctx)` → INSERT one row per local-only `media_files` row, ON CONFLICT DO NOTHING
- `enqueueBackward(ctx)` → INSERT one row per `s3_file_locations` row
- `claimNext(ctx, direction)` → `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1`
- `markDone`, `markFailed`, `markSkipped`, `resetStaleInProgress`

Tests use a sqlite or in-memory fake; integration tests in Phase 14 hit real Postgres.

```bash
git commit -m "feat(s3-storage): job table helpers (enqueue/claim/mark)"
```

### Task 11.2: Forward worker

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/migration_forward.go`

For each claimed `upload` job:
1. SELECT `media_files` row (id, url).
2. Resolve local path = `storage/<url-stripped-leading-slash>`.
3. Read bytes via `os.ReadFile`. On `ErrNotExist` → mark `skipped` + reason.
4. Compute key from URL path. PutObject. Capture etag.
5. StatObject. If etag mismatch on second attempt → mark `failed` with `"etag mismatch"`.
6. INSERT `s3_file_locations(media_id, storage_key, external_url, etag, uploaded_at=now())`.
7. If `keep_local_days == 0` → `os.Remove(localPath)`. Else schedule grace deletion.
8. Mark `done`.

Variants: walk `media_image_sizes` for the same media_id and migrate each variant too.

Tests: forward of a single file (mocked client), retry on ETag mismatch, skip on missing local, grace-deletion respect.

```bash
git commit -m "feat(s3-storage): forward migration worker (local → S3)"
```

### Task 11.3: Backward worker

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/migration_backward.go`

Mirror of forward, opposite direction:
1. GET object from S3.
2. WriteFile locally; verify size.
3. RemoveObject from S3.
4. DELETE `s3_file_locations` row.

Tests + commit.

```bash
git commit -m "feat(s3-storage): backward migration worker (S3 → local)"
```

### Task 11.4: Worker loop with concurrency

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/migration_worker.go`

Spawns N goroutines (default 16), each loops `claimNext → process → mark`. Stops when no pending jobs. `cancel` flag short-circuits the loop.

Resume logic: on plugin start, call `resetStaleInProgress(threshold=5 min)` to flip stuck `in_progress` rows back to `pending`.

```bash
git commit -m "feat(s3-storage): migration worker loop with resume + cancel"
```

### Task 11.5: Migration HTTP endpoints

Wire `handleMigrationStart` (POST body `{direction}`), `handleMigrationCancel`, `handleMigrationRetryFailed` to the worker.

```bash
git commit -m "feat(s3-storage): migration start/cancel/retry endpoints"
```

### Task 11.6: Grace-deletion sweep

A separate goroutine started in `Initialize` that polls every 1h: `SELECT FROM s3_file_locations WHERE uploaded_at < NOW() - INTERVAL keep_local_days DAY`, deletes the matching local files, updates a `local_deleted_at` column. Tests for time-based logic with injected clock.

```bash
git commit -m "feat(s3-storage): keep_local_days grace-period sweep"
```

---

## Phase 12 — Reconcile from bucket

### Task 12.1: `handleReconcile`

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/reconcile.go`

Walk `client.ListObjects(prefix="")`. For each key:
- Compute logical path = `"/media/" + key` (or bucket-prefix-stripped variant).
- `SELECT id FROM media_files WHERE url = ?`.
- If found AND no `s3_file_locations` row → INSERT one with key/etag/uploaded_at from object metadata.
- Track unmatched keys; return summary in response.

Tests + commit.

```bash
git commit -m "feat(s3-storage): reconcile-from-bucket repopulates s3_file_locations"
```

---

## Phase 13 — Status + SSE progress

### Task 13.1: `handleStatus`

Compose:
```json
{
  "verified": true,
  "drift": {"local_only": 47, "in_s3": 2154},
  "last_sync": "...",
  "bucket": "squilla-prod",
  "endpoint": "...",
  "active_job": {"direction": "upload", "in_progress": 12, "done": 35, "failed": 0}
}
```

Counts via `DataQuery`. Tests + commit.

```bash
git commit -m "feat(s3-storage): /status endpoint for dashboard"
```

### Task 13.2: `handleMigrationProgress` (SSE)

Stream `event: progress\ndata: {...}\n\n` every 1s while a job is active. End with `event: done`. Use `req.Headers["Accept"] == "text/event-stream"` to gate. The plugin's `HandleHTTPRequest` returns once — for SSE we need to return a long-running response. Check `pkg/plugin/plugin.go` for the response size cap; if SSE isn't possible through gRPC's streaming-response cap, fall back to long-polling: each call returns the current snapshot + a `next_after` cursor; client polls every 1s.

**Decision:** start with **long-polling** (simpler, works through every transport). SSE is a Phase 18 nice-to-have if needed.

```bash
git commit -m "feat(s3-storage): migration progress polling endpoint"
```

---

## Phase 14 — Integration tests with MinIO (testcontainers)

### Task 14.1: testcontainers setup

**Files:**
- Create: `extensions/s3-storage/cmd/plugin/integration_test.go`
- Modify: `go.mod` (`go get github.com/testcontainers/testcontainers-go`)

Build helper `setupMinIO(t)` returning a fresh container per test. Skip if `S3_INTEGRATION` env var is unset.

```bash
git commit -m "test(s3-storage): testcontainers MinIO harness"
```

### Tasks 14.2–14.10: One test per scenario

Each is a separate task: implement, run with `S3_INTEGRATION=1 go test`, commit. Scenarios listed in design doc §"Integration tests with MinIO".

```bash
# (one commit per test scenario)
```

---

## Phase 15 — Admin UI

### Task 15.1: Vite scaffold

Mirror `extensions/smtp-provider/admin-ui/`:
- `vite.config.ts` building to `dist/index.js` as ES module
- `tsconfig.json`
- `package.json` with `react`, `@squilla/ui`, `@squilla/api` (use `external: ["react", "@squilla/ui", ...]` so they resolve via the SPA's import map)
- `src/index.tsx` exporting `Dashboard` and `SettingsForm` components

```bash
git commit -m "feat(s3-storage): admin-ui scaffold"
```

### Task 15.2: `SettingsForm.tsx`

Form with all fields from `settings_schema`, sensitive masking on `secret_access_key`, "Save & test connection" button that POSTs to `/admin/api/ext/s3-storage/settings` and renders the per-step probe result inline.

Vitest test in `SettingsForm.test.tsx`: required validation, sensitive masking, test-then-save flow.

```bash
git commit -m "feat(s3-storage): settings form with inline connection test"
```

### Task 15.3: `Dashboard.tsx`

Status card with drift counters, last sync, bucket info. Buttons: Migrate to S3 / Migrate back to local / Reconcile from bucket / Re-test connection. Disabled-when-no-drift, banner-when-not-verified.

```bash
git commit -m "feat(s3-storage): dashboard with drift counters and action buttons"
```

### Task 15.4: `MigrationProgress.tsx`

Polling component that updates `{total, done, failed, in_progress}` every 1s, with per-row error inspection on click.

```bash
git commit -m "feat(s3-storage): migration progress UI with retry-failed"
```

### Task 15.5: UI tests (Vitest + RTL)

Tests for each component per design doc §"Admin UI".

```bash
git commit -m "test(s3-storage): admin-ui component tests"
```

---

## Phase 16 — E2E with Playwright

### Task 16.1: docker-compose.test.yml with MinIO

**Files:**
- Modify or create: `docker-compose.test.yml`

Add a `minio` service. Wire env vars for s3-storage settings to point at it.

### Task 16.2: Playwright happy-path

**Files:**
- Create: `tests/e2e/s3-storage.spec.ts`

Scenario from design doc §"Playwright E2E".

```bash
git commit -m "test(s3-storage): Playwright happy-path E2E against MinIO"
```

---

## Phase 17 — Documentation

### Task 17.1: `extensions/s3-storage/README.md`

Operator-facing guide:
- AWS S3 setup (bucket policy, IAM)
- Cloudflare R2 walkthrough
- Backblaze B2 walkthrough
- Self-hosted MinIO via Coolify (compose snippet)
- Migration runbook
- Disaster recovery (reconcile)

### Task 17.2: Update `extensions/README.md`

Document the new `storage-provider` `provides`-tag in §"Reserved provides tags".

### Task 17.3: Update `docs/architecture.md`

Add `s3-storage` to the bundled-extensions list. Note the `CallProvider` CoreAPI addition.

### Task 17.4: Update `CLAUDE.md`

Add a brief "S3-compatible storage" line under Tech Stack and a sentence in the kernel + extensions section.

```bash
git commit -m "docs: s3-storage operator guide + architecture refs"
```

---

## Phase 18 — Verify the full stack

### Task 18.1: Full test suite

```bash
go test ./... -count=1
S3_INTEGRATION=1 go test ./extensions/s3-storage/... -count=1
cd admin-ui && bun test
npx playwright test tests/e2e/s3-storage.spec.ts
```

All must pass. Commit any final fixes.

### Task 18.2: Manual smoke

```bash
docker compose up minio
./extensions/s3-storage/scripts/build.sh
./squilla server   # in another terminal
```

In the admin UI:
1. Activate `s3-storage`
2. Settings → enter MinIO creds → save → 5 green checkmarks
3. Upload a media file via media library
4. Verify it lands in MinIO (use `mc ls minio/<bucket>` from the MinIO container)
5. Click "Migrate to S3" → wait for done → verify older files now also in MinIO
6. Deactivate → upload another file → verify it's local
7. Reactivate → verify drift counter shows `1`
8. Migrate-back → verify all files return locally
9. Reconcile-from-bucket → verify it correctly identifies an empty/uploaded state

```bash
git commit -m "chore: final manual smoke + tweaks"
```

---

## Out of scope (explicit, not in this plan)

- Signed URLs / private buckets
- Multi-bucket / multi-provider routing
- Server-side encryption configuration
- Lifecycle rules
- Phantom-row audit (forward / backward / reconcile cover the realistic failure modes; audit lands later if production ever surfaces phantom rows)
- Storage-provider consumers other than media-manager (backups, exports) — `provides:["storage-provider"]` is declared so they can plug in later

---

## Verification checklist (after Phase 18)

- [ ] `go test ./... -count=1 -race` passes
- [ ] `S3_INTEGRATION=1 go test ./extensions/s3-storage/...` passes against real MinIO
- [ ] Admin-UI Vitest passes
- [ ] Playwright E2E passes
- [ ] Hard rule: deactivating s3-storage cleanly degrades — manual test
- [ ] Hard rule: deleting s3-storage with data preserved → reinstall → tables intact
- [ ] Hard rule: kernel has zero S3-specific code (`grep -ri "s3\|minio" internal/` → only references in CallProvider docs)
- [ ] Coverage targets: unit ≥ 90%, every error-handling row in design doc has at least one assertion
- [ ] Manifest `auto_activate: false` (operator must opt in)
- [ ] No production file exceeds 300 lines (refactor if needed; test files exempt)
