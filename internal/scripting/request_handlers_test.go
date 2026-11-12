package scripting

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"squilla/internal/coreapi"
	"strings"
	"testing"

	"squilla/internal/events"
)

// writeScript writes a handler script into its own extension scripts dir.
func writeScript(t *testing.T, name, src string) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, name+".tengo"), []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}

const selectiveProvider = `
if event.payload.settings.provider == "%s" {
    response = "error: sent-by-%s"
}
`

// Tengo providers (resend-provider) must be reachable through PublishRequest,
// which CoreAPI.SendEmail uses; before this they were only plain Subscribe
// listeners and every Tengo-provider email was silently dropped.
func TestTengoHandlers_AnswerPublishRequest(t *testing.T) {
	bus := events.New()
	e := NewScriptEngine(bus, nil, nil)
	for _, slug := range []string{"prov-a", "prov-b"} {
		src := strings.ReplaceAll(selectiveProvider, "%s", slug)
		dir := writeScript(t, "send", src)
		e.eventHandlers["email.send"] = append(e.eventHandlers["email.send"],
			scriptHandler{scriptPath: "send", baseDir: dir, slug: slug})
		e.activeBaseDirs[dir] = true
	}
	e.subscribeEventHandlers()

	if !bus.HasRequestHandlers("email.send") {
		t.Fatal("Tengo handlers not registered as request handlers")
	}
	err := bus.PublishRequest("email.send", events.Payload{"settings": map[string]string{"provider": "prov-b"}})
	if err == nil || err.Error() != "prov-b: sent-by-prov-b" {
		t.Fatalf("want only prov-b to answer, got %v", err)
	}
	err = bus.PublishRequest("email.send", events.Payload{"settings": map[string]string{"provider": "other"}})
	if !errors.Is(err, events.ErrNotHandled) {
		t.Fatalf("want ErrNotHandled when no Tengo provider is selected, got %v", err)
	}
}

// The real resend-provider handler declines sends addressed to another
// provider without touching the network.
func TestResendHandler_DeclinesOtherProvider(t *testing.T) {
	dir, err := filepath.Abs("../../extensions/resend-provider/scripts")
	if err != nil {
		t.Fatal(err)
	}
	bus := events.New()
	e := NewScriptEngine(bus, nil, nil)
	e.eventHandlers["email.send"] = []scriptHandler{{scriptPath: "handlers/send_email", baseDir: dir, slug: "resend-provider"}}
	e.activeBaseDirs[dir] = true
	e.subscribeEventHandlers()

	err = bus.PublishRequest("email.send", events.Payload{
		"to":       []string{"a@example.com"},
		"subject":  "hi",
		"settings": map[string]string{"provider": "smtp-provider"},
	})
	if !errors.Is(err, events.ErrNotHandled) {
		t.Fatalf("want ErrNotHandled, got %v", err)
	}
}

func TestScriptRequestResult(t *testing.T) {
	if !errors.Is(scriptRequestResult("x", nil), events.ErrNotHandled) {
		t.Error("nil response must be not-handled")
	}
	if err := scriptRequestResult("x", "ok"); err != nil {
		t.Errorf("ok must succeed, got %v", err)
	}
	if err := scriptRequestResult("x", "error: boom"); err == nil || err.Error() != "x: boom" {
		t.Errorf("want x: boom, got %v", err)
	}
}

// fetchOnlyAPI is a CoreAPI whose only working method is Fetch.
type fetchOnlyAPI struct {
	coreapi.CoreAPI
	reqs   []coreapi.FetchRequest
	status int
}

func (f *fetchOnlyAPI) Fetch(_ context.Context, req coreapi.FetchRequest) (*coreapi.FetchResponse, error) {
	f.reqs = append(f.reqs, req)
	return &coreapi.FetchResponse{StatusCode: f.status, Body: `{"message":"bad key"}`}, nil
}

// When selected, the real resend-provider handler posts once to Resend
// and reports a non-2xx answer as the send's error.
func TestResendHandler_SelectedSendsOnce(t *testing.T) {
	dir, err := filepath.Abs("../../extensions/resend-provider/scripts")
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		status  int
		wantErr bool
	}{{200, false}, {401, true}} {
		api := &fetchOnlyAPI{status: tc.status}
		bus := events.New()
		e := NewScriptEngine(bus, api, nil)
		e.eventHandlers["email.send"] = []scriptHandler{{scriptPath: "handlers/send_email", baseDir: dir, slug: "resend-provider",
			capabilities: map[string]bool{"http:fetch": true}}}
		e.activeBaseDirs[dir] = true
		e.subscribeEventHandlers()

		err = bus.PublishRequest("email.send", events.Payload{
			"to":       []string{"a@example.com"},
			"cc":       []string{"c@example.com"},
			"bcc":      []string(nil),
			"subject":  "hi",
			"html":     "<p>x</p>",
			"reply_to": "guest@example.com",
			"settings": map[string]string{"provider": "resend-provider", "api_key": "k", "from_email": "s@example.com"},
		})
		if (err != nil) != tc.wantErr {
			t.Fatalf("status %d: unexpected err %v", tc.status, err)
		}
		if len(api.reqs) != 1 || api.reqs[0].URL != "https://api.resend.com/emails" {
			t.Fatalf("status %d: want one POST to Resend, got %+v", tc.status, api.reqs)
		}
		// SendEmail passes []string; Resend needs real JSON arrays (a null
		// "to" was rejected on production with a 422).
		for _, want := range []string{`"to":["a@example.com"]`, `"cc":["c@example.com"]`, `"reply_to":"guest@example.com"`} {
			if !strings.Contains(api.reqs[0].Body, want) {
				t.Errorf("missing %s in body: %s", want, api.reqs[0].Body)
			}
		}
		if strings.Contains(api.reqs[0].Body, `"bcc"`) {
			t.Errorf("empty bcc must be omitted: %s", api.reqs[0].Body)
		}
	}
}
