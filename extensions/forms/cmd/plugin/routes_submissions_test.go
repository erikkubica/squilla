package main

import "testing"

// The manifest gates /submissions and /submissions/** with manage_forms.
// The router must not serve the list on any other spelling: a prefix
// match ("/submissionsX") would hand submissions to an admin user whose
// role lacks that capability.
func TestSubmissionsRouteIsExactMatch(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)
	seedFormAndSubmissions(h)

	ok, err := p.HandleHTTPRequest(makeReqWithQuery("GET", "/submissions", nil))
	if err != nil || ok.StatusCode != 200 {
		t.Fatalf("GET /submissions = %v, %v", ok, err)
	}
	for _, path := range []string{"/submissionsX", "/submissions-all", "/submissions.json", "/submissionsX/1"} {
		resp, err := p.HandleHTTPRequest(makeReqWithQuery("GET", path, nil))
		if err != nil {
			t.Fatalf("%s: %v", path, err)
		}
		if resp.StatusCode != 404 {
			t.Errorf("GET %s = %d, want 404 (body %.80s)", path, resp.StatusCode, resp.Body)
		}
	}
}
