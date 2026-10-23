package httpobs

import (
	"errors"
	"fmt"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"squilla/internal/events"
	"squilla/internal/logging"
	"squilla/internal/models"

	"github.com/gofiber/fiber/v2"
)

type collector struct {
	mu      sync.Mutex
	records []Record
	dropped uint64
}

func (c *collector) handler(_ string, p events.Payload) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.records = append(c.records, p["records"].([]Record)...)
	c.dropped += p["dropped"].(uint64)
}

func newTestApp(o *Observer) *fiber.App {
	app := fiber.New()
	app.Use(logging.RequestID())
	app.Use(o.Middleware())
	app.Get("/page/:slug", func(c *fiber.Ctx) error {
		c.Locals("squilla.node_id", 42)
		c.Locals("squilla.node_type", "experience")
		c.Locals("squilla.language", "en")
		c.Locals("user", &models.User{ID: 7})
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendString("<html>" + c.Params("slug") + "</html>")
	})
	app.Get("/teapot", func(c *fiber.Ctx) error { return fiber.ErrTeapot })
	app.Get("/boom", func(c *fiber.Ctx) error { return errors.New("boom") })
	app.Get("/sse", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/event-stream")
		return c.SendString("data: x\n\n")
	})
	return app
}

func do(t *testing.T, app *fiber.App, path string, hdrs map[string]string) {
	t.Helper()
	req := httptest.NewRequest("GET", path, nil)
	for k, v := range hdrs {
		req.Header.Set(k, v)
	}
	if _, err := app.Test(req, -1); err != nil {
		t.Fatal(err)
	}
}

func TestObserver_NoSubscriberRecordsNothing(t *testing.T) {
	bus := events.New()
	o := New(bus, Options{FlushInterval: time.Hour})
	app := newTestApp(o)
	do(t, app, "/page/a", nil)
	if n := len(o.ch); n != 0 {
		t.Fatalf("queued %d records without subscribers", n)
	}
	o.Close()
}

func TestObserver_RecordShape(t *testing.T) {
	bus := events.New()
	col := &collector{}
	bus.Subscribe(Event, col.handler)
	var wildcard int
	bus.SubscribeAll(func(string, events.Payload) { wildcard++ })

	o := New(bus, Options{FlushInterval: time.Hour, SessionCookie: "squilla_session"})
	app := newTestApp(o)
	longUA := strings.Repeat("u", 600)
	for i := 0; i < 3; i++ {
		do(t, app, fmt.Sprintf("/page/p%d?utm_source=ig&x=%d", i, i), map[string]string{
			"User-Agent":      longUA,
			"Referer":         "https://www.google.com/",
			"Accept-Language": "en-GB,en;q=0.9",
			"Sec-Fetch-Mode":  "navigate",
			"Cf-Ipcountry":    "VN", // must be dropped: CF is not the IP source
			"X-Secret":        "nope",
			"Cookie":          "squilla_session=abc",
		})
	}
	do(t, app, "/teapot", nil)
	do(t, app, "/boom", nil)
	do(t, app, "/sse", nil)
	o.Close()

	if wildcard != 0 {
		t.Fatalf("wildcard listener received %d http.requests events", wildcard)
	}
	if len(col.records) != 5 {
		t.Fatalf("got %d records, want 5 (SSE skipped)", len(col.records))
	}
	for i := 0; i < 3; i++ {
		r := col.records[i]
		if r.Path != fmt.Sprintf("/page/p%d", i) || r.Query != fmt.Sprintf("utm_source=ig&x=%d", i) {
			t.Fatalf("record %d path/query corrupted: %q ? %q", i, r.Path, r.Query)
		}
		if r.Method != "GET" || r.Status != 200 || r.Bytes != int64(len(fmt.Sprintf("<html>p%d</html>", i))) {
			t.Fatalf("record %d: method=%s status=%d bytes=%d", i, r.Method, r.Status, r.Bytes)
		}
		if !strings.HasPrefix(r.ContentType, "text/html") {
			t.Fatalf("content type %q", r.ContentType)
		}
		if len(r.UserAgent) != maxUserAgent || r.Referer != "https://www.google.com/" {
			t.Fatalf("ua len %d referer %q", len(r.UserAgent), r.Referer)
		}
		if r.Headers["accept-language"] != "en-GB,en;q=0.9" || r.Headers["sec-fetch-mode"] != "navigate" {
			t.Fatalf("allowlisted headers missing: %v", r.Headers)
		}
		if _, ok := r.Headers["x-secret"]; ok {
			t.Fatal("non-allowlisted header copied")
		}
		if _, ok := r.Headers["cf-ipcountry"]; ok {
			t.Fatal("cf-ipcountry copied although CF is not the client-IP source")
		}
		if !r.HasSession || r.UserID != 7 || r.NodeID != 42 || r.NodeType != "experience" || r.Language != "en" {
			t.Fatalf("locals not captured: %+v", r)
		}
		if r.RequestID == "" || r.IP != "0.0.0.0" || r.TS.IsZero() {
			t.Fatalf("request id / ip / ts missing: %+v", r)
		}
	}
	if col.records[3].Status != fiber.StatusTeapot {
		t.Fatalf("fiber.Error status = %d, want 418", col.records[3].Status)
	}
	if col.records[4].Status != 500 {
		t.Fatalf("plain error status = %d, want 500", col.records[4].Status)
	}
}

func TestObserver_CFCountryWhenCloudflareIsSource(t *testing.T) {
	if err := ConfigureClientIP([]string{"0.0.0.0"}, "CF-Connecting-IP"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { clientIPConfig.Store(nil) })

	bus := events.New()
	col := &collector{}
	bus.Subscribe(Event, col.handler)
	o := New(bus, Options{FlushInterval: time.Hour})
	do(t, newTestApp(o), "/page/a", map[string]string{"CF-Connecting-IP": "203.0.113.9", "CF-IPCountry": "VN"})
	o.Close()

	if len(col.records) != 1 || col.records[0].Headers["cf-ipcountry"] != "VN" || col.records[0].IP != "203.0.113.9" {
		t.Fatalf("unexpected record %+v", col.records)
	}
}

// A client connecting directly (peer not a trusted proxy) must not be
// able to forge its country even when Cloudflare is the IP source.
func TestObserver_CFCountryIgnoredFromUntrustedPeer(t *testing.T) {
	if err := ConfigureClientIP([]string{"10.0.0.0/8"}, "CF-Connecting-IP"); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { clientIPConfig.Store(nil) })

	bus := events.New()
	col := &collector{}
	bus.Subscribe(Event, col.handler)
	o := New(bus, Options{FlushInterval: time.Hour})
	do(t, newTestApp(o), "/page/a", map[string]string{"CF-Connecting-IP": "203.0.113.9", "CF-IPCountry": "VN"})
	o.Close()

	if len(col.records) != 1 {
		t.Fatalf("got %d records", len(col.records))
	}
	if _, ok := col.records[0].Headers["cf-ipcountry"]; ok || col.records[0].IP != "0.0.0.0" {
		t.Fatalf("forged CF headers believed from untrusted peer: %+v", col.records[0])
	}
}

// TestObserver_DropsWhenFull blocks the subscriber on the first batch so
// the 1-slot queue fills, then checks the drop counter is reported.
func TestObserver_DropsWhenFull(t *testing.T) {
	bus := events.New()
	col := &collector{}
	entered := make(chan struct{})
	release := make(chan struct{})
	var once sync.Once
	bus.Subscribe(Event, func(a string, p events.Payload) {
		once.Do(func() { close(entered); <-release })
		col.handler(a, p)
	})

	o := New(bus, Options{BufferSize: 1, BatchSize: 1, FlushInterval: time.Hour})
	app := newTestApp(o)
	do(t, app, "/page/a", nil) // taken by flusher, publish blocks
	<-entered
	do(t, app, "/page/b", nil) // fills the queue
	do(t, app, "/page/c", nil) // dropped
	do(t, app, "/page/d", nil) // dropped
	close(release)
	o.Close()

	if len(col.records) != 2 || col.dropped != 2 {
		t.Fatalf("records=%d dropped=%d, want 2/2", len(col.records), col.dropped)
	}
}

func TestObserver_FlushesOnInterval(t *testing.T) {
	bus := events.New()
	got := make(chan int, 4)
	bus.Subscribe(Event, func(_ string, p events.Payload) { got <- len(p["records"].([]Record)) })
	o := New(bus, Options{FlushInterval: 20 * time.Millisecond})
	defer o.Close()
	do(t, newTestApp(o), "/page/a", nil)
	select {
	case n := <-got:
		if n != 1 {
			t.Fatalf("batch size %d", n)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("interval flush never happened")
	}
}

func TestObserver_CloseIsIdempotentAndStopsObserving(t *testing.T) {
	bus := events.New()
	col := &collector{}
	bus.Subscribe(Event, col.handler)
	o := New(bus, Options{FlushInterval: time.Hour})
	app := newTestApp(o)
	o.Close()
	o.Close()
	do(t, app, "/page/a", nil)
	if len(o.ch) != 0 || len(col.records) != 0 {
		t.Fatal("observer recorded after Close")
	}
}
