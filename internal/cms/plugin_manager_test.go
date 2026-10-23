package cms

import (
	"testing"

	"squilla/internal/events"
	pb "squilla/pkg/plugin/proto"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"
)

func TestSubscriptionAllowed_HTTPObserveGate(t *testing.T) {
	if subscriptionAllowed("http.requests", map[string]bool{"data:read": true}) {
		t.Fatal("http.requests must require http:observe")
	}
	if !subscriptionAllowed("http.requests", map[string]bool{"http:observe": true}) {
		t.Fatal("http:observe should allow http.requests")
	}
	if !subscriptionAllowed("node.created", nil) {
		t.Fatal("ungated events must stay open")
	}
	if !subscriptionAllowed("*", nil) {
		t.Fatal("wildcard stays open (it never receives explicit-only events)")
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
