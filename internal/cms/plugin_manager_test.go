package cms

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"squilla/internal/events"
	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"
)

func allowed(event string, caps ...string) bool {
	m := map[string]bool{}
	for _, c := range caps {
		m[c] = true
	}
	ok, _ := subscriptionAllowed(event, m)
	return ok
}

func TestSubscriptionAllowed_HTTPObserveGate(t *testing.T) {
	if allowed("http.requests", "events:subscribe", "data:read") {
		t.Fatal("http.requests must require http:observe")
	}
	if !allowed("http.requests", "events:subscribe", "http:observe") {
		t.Fatal("http:observe should allow http.requests")
	}
	if !allowed("node.created", "events:subscribe") {
		t.Fatal("ordinary events need only events:subscribe")
	}
}

// TestSubscriptionAllowed_RequiresEventsCapabilities guards the
// subscription gate: a zero-capability plugin used to be able to
// subscribe to "*" and receive password-reset tokens and every mail.
func TestSubscriptionAllowed_RequiresEventsCapabilities(t *testing.T) {
	if allowed("node.created") {
		t.Fatal("any subscription requires events:subscribe")
	}
	if allowed("*", "events:subscribe") {
		t.Fatal("wildcard requires events:subscribe_all")
	}
	if !allowed("*", "events:subscribe", "events:subscribe_all") {
		t.Fatal("events:subscribe + events:subscribe_all allows the wildcard")
	}
	if allowed("email.send", "events:subscribe") || !allowed("email.send", "events:subscribe", "email:provide") {
		t.Fatal("email.send requires email:provide")
	}
	if allowed("user.password_reset_requested", "events:subscribe") ||
		!allowed("user.password_reset_requested", "events:subscribe", "auth:observe") {
		t.Fatal("user.password_reset_requested requires auth:observe")
	}
}

// TestWildcard_SensitiveEventsFilteredAtDelivery drives the real bus: a
// wildcard subscriber without email:provide / auth:observe must not be
// handed those events, but still receives ordinary ones.
func TestWildcard_SensitiveEventsFilteredAtDelivery(t *testing.T) {
	for _, tc := range []struct {
		caps []string
		want map[string]bool
	}{
		{[]string{"events:subscribe", "events:subscribe_all"},
			map[string]bool{"node.created": true}},
		{[]string{"events:subscribe", "events:subscribe_all", "auth:observe"},
			map[string]bool{"node.created": true, "user.password_reset_requested": true}},
	} {
		bus := events.New()
		pm := NewPluginManager(bus, nil, nil)
		rec := &recordingPlugin{}
		rp := &runningPlugin{slug: "spy", binary: "bin/spy", impl: rec, stopped: make(chan struct{})}
		caps := map[string]bool{}
		for _, c := range tc.caps {
			caps[c] = true
		}
		pm.subscribePlugin(rp, []*pb.Subscription{{EventName: "*"}}, caps)
		for _, ev := range []string{"node.created", "user.password_reset_requested", "email.send"} {
			bus.PublishSync(ev, events.Payload{"reset_token": "secret"})
		}
		got := rec.seen()
		if len(got) != len(tc.want) {
			t.Fatalf("caps %v: delivered %v, want %v", tc.caps, got, tc.want)
		}
		for _, a := range got {
			if !tc.want[a] {
				t.Fatalf("caps %v: %q must not be delivered", tc.caps, a)
			}
		}
	}
}

type recordingPlugin struct {
	noopPlugin
	mu      sync.Mutex
	actions []string
}

func (r *recordingPlugin) HandleEvent(action string, _ []byte) (*pb.EventResponse, error) {
	r.mu.Lock()
	r.actions = append(r.actions, action)
	r.mu.Unlock()
	return &pb.EventResponse{}, nil
}

func (r *recordingPlugin) seen() []string {
	r.mu.Lock()
	defer r.mu.Unlock()
	return append([]string(nil), r.actions...)
}

// hungPlugin never returns from Shutdown.
type hungPlugin struct {
	noopPlugin
	block chan struct{}
}

func (h hungPlugin) Shutdown() error { <-h.block; return nil }

// TestStopPlugins_HungShutdownStillKilled: a plugin whose Shutdown RPC
// hangs must not block StopPlugins (or hold the manager lock).
func TestStopPlugins_HungShutdownStillKilled(t *testing.T) {
	old := pluginShutdownTimeout
	pluginShutdownTimeout = 50 * time.Millisecond
	defer func() { pluginShutdownTimeout = old }()

	pm := NewPluginManager(events.New(), nil, nil)
	block := make(chan struct{})
	defer close(block)
	pm.plugins["hung"] = []*runningPlugin{{
		slug: "hung", binary: "bin/hung", client: &goplugin.Client{},
		impl: hungPlugin{block: block}, stopped: make(chan struct{}),
	}}
	pm.observeCookies["hung"] = []string{"hung_x"}

	done := make(chan struct{})
	go func() { pm.StopPlugins("hung"); close(done) }()
	// The map entry is gone (and the lock free) while Shutdown hangs.
	deadline := time.After(2 * time.Second)
	for pm.GetClient("hung") != nil || pm.RunningCount() != 0 {
		select {
		case <-deadline:
			t.Fatal("entry not removed")
		default:
			time.Sleep(time.Millisecond)
		}
	}
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("StopPlugins blocked on a hung Shutdown")
	}
	if _, ok := pm.observeCookies["hung"]; ok {
		t.Fatal("observe_cookies entry must be removed on stop")
	}
}

// TestStartPlugins_DoesNotBlockGetClient: while one extension's plugin is
// spawning (slow handshake), lookups for other extensions must not wait.
func TestStartPlugins_DoesNotBlockGetClient(t *testing.T) {
	pm := NewPluginManager(events.New(), nil, nil)
	release := make(chan struct{})
	entered := make(chan struct{})
	pm.spawn = func(string) (*goplugin.Client, vibeplugin.ExtensionPlugin, error) {
		close(entered)
		<-release
		return nil, nil, errors.New("not started")
	}
	extDir := t.TempDir()
	writeFiles(t, extDir, map[string]string{"bin/slow": "#!/bin/sh\n"})
	go func() {
		_ = pm.StartPlugins(extDir, "slow", json.RawMessage(`{"plugins":[{"binary":"bin/slow"}]}`), nil, nil)
	}()
	<-entered
	done := make(chan struct{})
	go func() { pm.GetClient("other"); pm.RunningCount(); close(done) }()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("GetClient blocked while a plugin was spawning")
	}
	close(release)
}

// TestStartPlugins_BinaryOutsideExtensionDirRejected: plugins[].binary
// must resolve inside the extension directory.
func TestStartPlugins_BinaryOutsideExtensionDirRejected(t *testing.T) {
	root := t.TempDir()
	extDir := filepath.Join(root, "ext")
	writeFiles(t, root, map[string]string{"outside/evil": "x", "ext/bin/real": "x"})
	if err := os.Symlink(filepath.Join(root, "outside", "evil"), filepath.Join(extDir, "bin", "link")); err != nil {
		t.Fatal(err)
	}
	var spawned []string
	pm := NewPluginManager(events.New(), nil, nil)
	pm.spawn = func(p string) (*goplugin.Client, vibeplugin.ExtensionPlugin, error) {
		spawned = append(spawned, p)
		return nil, nil, errors.New("stop here")
	}
	manifest := `{"plugins":[{"binary":"../outside/evil"},{"binary":"bin/link"},{"binary":"bin/real"}]}`
	_ = pm.StartPlugins(extDir, "x", json.RawMessage(manifest), nil, nil)
	if len(spawned) != 1 || filepath.Base(spawned[0]) != "real" {
		t.Fatalf("only bin/real may be spawned, got %v", spawned)
	}
}

type noopPlugin struct{}

func (noopPlugin) GetSubscriptions() ([]*pb.Subscription, error) { return nil, nil }
func (noopPlugin) HandleEvent(string, []byte) (*pb.EventResponse, error) {
	return &pb.EventResponse{}, nil
}
func (noopPlugin) HandleHTTPRequest(*pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	return nil, nil
}
func (noopPlugin) Shutdown() error                   { return nil }
func (noopPlugin) Initialize(*grpc.ClientConn) error { return nil }

// TestStopPlugins_Unsubscribes guards the stale-subscription fix: a
// stopped plugin's bus handlers must be removed, not merely short-
// circuited by the stopped channel.
func TestStopPlugins_Unsubscribes(t *testing.T) {
	bus := events.New()
	pm := NewPluginManager(bus, nil, nil)
	rp := &runningPlugin{
		slug:    "demo",
		binary:  "bin/demo",
		client:  &goplugin.Client{},
		impl:    noopPlugin{},
		stopped: make(chan struct{}),
	}
	rp.unsubs = append(rp.unsubs,
		bus.Subscribe("http.requests", func(string, events.Payload) {}),
		bus.SubscribeAll(func(string, events.Payload) {}),
	)
	pm.plugins["demo"] = []*runningPlugin{rp}

	if !bus.HasExplicitHandlers("http.requests") {
		t.Fatal("precondition: handler registered")
	}
	pm.StopPlugins("demo")
	if bus.HasHandlers("http.requests") {
		t.Fatal("handlers survived plugin stop")
	}
}

func TestExplicitOnlyEvent(t *testing.T) {
	if !explicitOnlyEvent("http.requests") {
		t.Fatal("http.requests must not get Result/Err dispatch (forgeable via PublishCollect/PublishRequest)")
	}
	if explicitOnlyEvent("email.send") || explicitOnlyEvent("forms:render") {
		t.Fatal("ordinary events keep Result/Err dispatch")
	}
}

func TestOwnedFunctionSet_RequiresSlugPrefix(t *testing.T) {
	got := ownedFunctionSet("my-ext", []string{"my_ext_stats", "query_to_xml", "other_ext_fn", "my_extstats"})
	if !got["my_ext_stats"] || len(got) != 1 {
		t.Fatalf("expected only my_ext_stats, got %v", got)
	}
}
