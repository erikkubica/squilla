package scripting

import "testing"

// Scripts must declare http:observe to receive http.requests, matching
// the gRPC plugin gate in cms.subscriptionAllowed.
func TestEventsOn_HTTPObserveGate(t *testing.T) {
	e := &ScriptEngine{eventHandlers: make(map[string][]scriptHandler)}

	e.activeCapabilities = map[string]bool{"events:subscribe": true}
	e.EventsOn("http.requests", "h.tengo", 10)
	if len(e.eventHandlers["http.requests"]) != 0 {
		t.Fatal("http.requests handler registered without http:observe")
	}

	e.EventsOn("node.created", "h.tengo", 10)
	if len(e.eventHandlers["node.created"]) != 1 {
		t.Fatal("ungated event must still register")
	}

	e.activeCapabilities = map[string]bool{"http:observe": true}
	e.EventsOn("http.requests", "h.tengo", 10)
	if len(e.eventHandlers["http.requests"]) != 1 {
		t.Fatal("http:observe should allow http.requests")
	}
}
