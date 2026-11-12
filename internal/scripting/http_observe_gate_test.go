package scripting

import "testing"

// Scripts must declare http:observe to receive http.requests, matching
// the gRPC plugin gate in cms.subscriptionAllowed.
func TestEventsOn_HTTPObserveGate(t *testing.T) {
	e := &ScriptEngine{eventHandlers: make(map[string][]scriptHandler)}

	scope := &loadScope{slug: "x", caps: map[string]bool{"events:subscribe": true}}
	_ = e.eventsOn(scope, "http.requests", "h", 10)
	if len(e.eventHandlers["http.requests"]) != 0 {
		t.Fatal("http.requests handler registered without http:observe")
	}

	_ = e.eventsOn(scope, "node.created", "h", 10)
	if len(e.eventHandlers["node.created"]) != 1 {
		t.Fatal("ungated event must still register")
	}

	scope = &loadScope{slug: "x", caps: map[string]bool{"events:subscribe": true, "http:observe": true}}
	_ = e.eventsOn(scope, "http.requests", "h", 10)
	if len(e.eventHandlers["http.requests"]) != 1 {
		t.Fatal("http:observe should allow http.requests")
	}
}
