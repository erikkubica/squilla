package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
)

const testDefaultLimit = 2 << 20

func newBodyLimitApp(t *testing.T) (*fiber.App, *bool) {
	t.Helper()
	p := defaultBodyLimitPolicy()
	p.defaultMax = testDefaultLimit
	cfg := fiber.Config{ErrorHandler: errorHandler, DisableStartupMessage: true}
	p.applyTo(&cfg)
	app := fiber.New(cfg)
	app.Server().HeaderReceived = p.headerReceived
	app.Use(bodyLimitMiddleware(p))

	normalCalled := false
	app.Post("/admin/api/nodes", func(c *fiber.Ctx) error {
		normalCalled = true
		var v map[string]any
		if err := c.BodyParser(&v); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "bad json")
		}
		return c.JSON(fiber.Map{"keys": len(v)})
	})
	// Presigned upload: a net/http handler counting streamed bytes.
	app.All("/api/uploads/:token", streamingHTTPHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n, err := io.Copy(io.Discard, r.Body)
		if err != nil {
			w.WriteHeader(http.StatusRequestEntityTooLarge)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"size":%d,"path":%q}`, n, r.URL.Path)
	}), presignedUploadTransportCap))
	// Theme zip upload: multipart via FormFile.
	app.Post("/admin/api/themes/upload", func(c *fiber.Ctx) error {
		fh, err := c.FormFile("file")
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"size": fh.Size})
	})
	return app, &normalCalled
}

// TestBodyLimit_UploadRouteStreamsPastDefault: a PUT larger than the
// default limit to the presigned-upload route succeeds and reaches the
// handler as a stream.
func TestBodyLimit_UploadRouteStreamsPastDefault(t *testing.T) {
	app, _ := newBodyLimitApp(t)
	body := bytes.Repeat([]byte("x"), 6<<20)
	req := httptest.NewRequest("PUT", "/api/uploads/tok123", bytes.NewReader(body))
	resp, err := app.Test(req, 10000)
	if err != nil {
		t.Fatal(err)
	}
	out, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 || !strings.Contains(string(out), fmt.Sprintf(`"size":%d`, len(body))) {
		t.Fatalf("status=%d body=%s", resp.StatusCode, out)
	}
	if !strings.Contains(string(out), `"path":"/api/uploads/tok123"`) {
		t.Fatalf("path not forwarded: %s", out)
	}
}

func TestBodyLimit_MultipartUploadPastDefault(t *testing.T) {
	app, _ := newBodyLimitApp(t)
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, _ := mw.CreateFormFile("file", "theme.zip")
	fw.Write(bytes.Repeat([]byte("z"), 5<<20))
	mw.Close()
	req := httptest.NewRequest("POST", "/admin/api/themes/upload", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	resp, err := app.Test(req, 10000)
	if err != nil {
		t.Fatal(err)
	}
	out, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 || !strings.Contains(string(out), fmt.Sprintf(`"size":%d`, 5<<20)) {
		t.Fatalf("status=%d body=%s", resp.StatusCode, out)
	}
}

func TestBodyLimit_SmallJSONStillParses(t *testing.T) {
	app, _ := newBodyLimitApp(t)
	// > 8 KB so it arrives as a stream, < 2 MB so it is allowed.
	payload := `{"a":"` + strings.Repeat("y", 100<<10) + `","b":1}`
	req := httptest.NewRequest("POST", "/admin/api/nodes", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, 5000)
	if err != nil {
		t.Fatal(err)
	}
	out, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 || !strings.Contains(string(out), `"keys":2`) {
		t.Fatalf("status=%d body=%s", resp.StatusCode, out)
	}
}

// TestBodyLimit_OversizedRejectedWithoutBuffering talks raw TCP: it
// announces a 100 MB body, sends only 16 KB (fasthttp prefetches at most
// 8 KB of a streamed body), and must still get a 413 immediately — proof
// the server decided from the header without buffering the body. The
// handler never runs and the connection closes.
func TestBodyLimit_OversizedRejectedWithoutBuffering(t *testing.T) {
	app, called := newBodyLimitApp(t)
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go app.Listener(ln)
	defer app.Shutdown()

	conn, err := net.Dial("tcp", ln.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	fmt.Fprintf(conn, "POST /admin/api/nodes HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: %d\r\n\r\n", 100<<20)
	conn.Write(bytes.Repeat([]byte("a"), 16<<10))

	conn.SetReadDeadline(time.Now().Add(3 * time.Second))
	resp, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		t.Fatalf("no early response (body was being buffered?): %v", err)
	}
	if resp.StatusCode != fiber.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want 413", resp.StatusCode)
	}
	if !resp.Close {
		t.Fatal("connection must be closed after rejecting an unread body")
	}
	if *called {
		t.Fatal("handler ran for an oversized body")
	}
}

// rawChunked sends a chunked POST over a real socket (app.Test can't
// express Transfer-Encoding: chunked) and returns the response.
func rawChunked(t *testing.T, addr, path string, body []byte) *http.Response {
	t.Helper()
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	fmt.Fprintf(conn, "POST %s HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n", path)
	go func() {
		for len(body) > 0 {
			n := 64 << 10
			if n > len(body) {
				n = len(body)
			}
			if _, err := fmt.Fprintf(conn, "%x\r\n%s\r\n", n, body[:n]); err != nil {
				return
			}
			body = body[n:]
		}
		fmt.Fprint(conn, "0\r\n\r\n")
	}()
	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	resp, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		t.Fatalf("read response: %v", err)
	}
	return resp
}

func TestBodyLimit_ChunkedBodies(t *testing.T) {
	app, called := newBodyLimitApp(t)
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go app.Listener(ln)
	defer app.Shutdown()
	addr := ln.Addr().String()

	big := append([]byte(`{"a":"`), bytes.Repeat([]byte("q"), 3<<20)...)
	if resp := rawChunked(t, addr, "/admin/api/nodes", big); resp.StatusCode != 413 || !resp.Close {
		t.Fatalf("chunked over default limit: status=%d close=%v", resp.StatusCode, resp.Close)
	}
	if *called {
		t.Fatal("handler ran for oversized chunked body")
	}
	if resp := rawChunked(t, addr, "/admin/api/themes/upload", []byte("x")); resp.StatusCode != 411 {
		t.Fatalf("chunked to upload route: status=%d, want 411", resp.StatusCode)
	}
	// Presigned uploads accept chunked bodies and stream them.
	up := rawChunked(t, addr, "/api/uploads/tok", bytes.Repeat([]byte("u"), 3<<20))
	upOut, _ := io.ReadAll(up.Body)
	if up.StatusCode != 200 || !strings.Contains(string(upOut), fmt.Sprintf(`"size":%d`, 3<<20)) {
		t.Fatalf("chunked presigned upload: status=%d body=%s", up.StatusCode, upOut)
	}
	resp := rawChunked(t, addr, "/admin/api/nodes", []byte(`{"a":1}`))
	out, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 || !strings.Contains(string(out), `"keys":1`) {
		t.Fatalf("small chunked body: status=%d body=%s", resp.StatusCode, out)
	}
}

func TestCappedReader(t *testing.T) {
	r := &cappedReader{r: strings.NewReader("hello world"), remaining: 5}
	b, err := io.ReadAll(r)
	if err != errUploadTooLarge || string(b) != "hello" {
		t.Fatalf("got %q, %v", b, err)
	}
	r = &cappedReader{r: strings.NewReader("hello"), remaining: 5}
	b, err = io.ReadAll(r)
	if err != nil || string(b) != "hello" || !r.eof {
		t.Fatalf("exact fit: %q %v eof=%v", b, err, r.eof)
	}
}
