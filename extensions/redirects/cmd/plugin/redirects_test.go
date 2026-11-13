package main

import (
	"context"
	"strings"
	"testing"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

func TestMatching(t *testing.T) {
	p, _ := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/old", Target: "/new", StatusCode: 301, KeepQuery: true, Enabled: true})
	mustAdd(t, p, Rule{Source: "/temp/", Target: "https://example.com/x", StatusCode: 302, Enabled: true})
	mustAdd(t, p, Rule{Source: "/?p=123", Target: "/hello-world", Enabled: true, KeepQuery: true})
	mustAdd(t, p, Rule{Source: "/blog/*", MatchType: matchPrefix, Target: "/news/*", Enabled: true, KeepQuery: true})
	mustAdd(t, p, Rule{Source: "/blog/2019", MatchType: matchPrefix, Target: "/archive", Enabled: true})
	mustAdd(t, p, Rule{Source: `/product/(\d+)/(.*)`, MatchType: matchRegex, Target: "/shop/$2-$1", StatusCode: 308, Enabled: true})
	mustAdd(t, p, Rule{Source: "/gone", StatusCode: 410, Enabled: true})
	mustAdd(t, p, Rule{Source: "/off", Target: "/x", Enabled: false})

	cases := []struct {
		url  string
		code int
		loc  string
	}{
		{"/old", 301, "/new"},
		{"/OLD/", 301, "/new"},
		{"/old?utm=a", 301, "/new?utm=a"},
		{"/temp", 302, "https://example.com/x"},
		{"/temp?a=1", 302, "https://example.com/x"}, // keep_query off
		{"/?p=123", 301, "/hello-world"},
		{"/?p=123&ref=x", 301, "/hello-world?ref=x"},
		{"/?p=124", 0, ""},
		{"/", 0, ""},
		{"/blog", 301, "/news/"},
		{"/blog/2024/post", 301, "/news/2024/post"},
		{"/blog/2019/old-post", 301, "/archive"}, // longest prefix wins
		{"/blogroll", 0, ""},
		{"/product/42/red-shoe", 308, "/shop/red-shoe-42"},
		{"/product/x/red-shoe", 0, ""},
		{"/gone", 410, ""},
		{"/off", 0, ""},
		{"/new", 0, ""},
		{"/caf%C3%A9", 0, ""},
	}
	for _, tc := range cases {
		code, loc := visit(t, p, tc.url)
		if code != tc.code || loc != tc.loc {
			t.Errorf("%s = %d %q, want %d %q", tc.url, code, loc, tc.code, tc.loc)
		}
	}
}

// Captures come from the visitor's URL: they must not be able to turn a
// same-site rule into an off-site redirect.
func TestNoOpenRedirectThroughCaptures(t *testing.T) {
	p, _ := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/go/(.*)", MatchType: matchRegex, Target: "/$1", StatusCode: 302, Enabled: true})
	mustAdd(t, p, Rule{Source: "/out", MatchType: matchPrefix, Target: "/*", StatusCode: 302, Enabled: true})
	mustAdd(t, p, Rule{Source: "/ext/(.*)", MatchType: matchRegex, Target: "https://good.example/$1", StatusCode: 302, Enabled: true})
	for _, u := range []string{"/go//evil.example/x", "/go/https://evil.example", `/go/\evil.example`, "/out//evil.example", "/ext/.evil.example/x", "/ext/@evil.example/x"} {
		_, loc := visit(t, p, u)
		sameSite := strings.HasPrefix(loc, "/") && !strings.HasPrefix(loc, "//") && !strings.HasPrefix(loc, `/\`)
		if loc != "" && !sameSite && !strings.HasPrefix(loc, "https://good.example/") {
			t.Errorf("%s redirected off-site to %q", u, loc)
		}
	}
}

func TestSelfRedirectIsSkipped(t *testing.T) {
	p, _ := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/a/(.*)", MatchType: matchRegex, Target: "/a/$1", Enabled: true})
	if code, _ := visit(t, p, "/a/b"); code != 0 {
		t.Fatalf("self-redirecting rule was served (%d)", code)
	}
}

func TestValidation(t *testing.T) {
	p, _ := newTestPlugin(t)
	bad := []Rule{
		{Source: "", Target: "/x"},
		{Source: "old", Target: "/x"},
		{Source: "/a", Target: "x"},
		{Source: "/a", Target: "//evil.example"},
		{Source: "/a", Target: "javascript:alert(1)"},
		{Source: "/a", Target: "/a/"},
		{Source: "/a", Target: "/b", StatusCode: 200},
		{Source: "/", MatchType: matchPrefix, Target: "/b"},
		{Source: "(", MatchType: matchRegex, Target: "/b"},
		{Source: "/a", MatchType: "glob", Target: "/b"},
	}
	for _, r := range bad {
		if code, _ := admin(t, p, "POST", "/rules", r); code != 400 {
			t.Errorf("%+v accepted (%d)", r, code)
		}
	}
	mustAdd(t, p, Rule{Source: "https://old.example/Path/?x=1#frag", Target: "/b", Enabled: true})
	if got := p.rules.Load().all[0].Source; got != "/Path?x=1" {
		t.Errorf("pasted URL stored as %q", got)
	}
	if code, body := admin(t, p, "POST", "/rules", Rule{Source: "/path?x=1", Target: "/c"}); code != 400 {
		t.Errorf("duplicate source accepted: %d %v", code, body)
	}
}

// A visitor asking for an admin API path on the public site must never
// reach the admin handlers: the request carries no user id.
func TestPublicRequestsNeverReachAdminAPI(t *testing.T) {
	p, h := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/old", Target: "/new", Enabled: true})
	for _, req := range []*pb.PluginHTTPRequest{
		{Method: "GET", Path: "/rules"},
		{Method: "GET", Path: "/export"},
		{Method: "DELETE", Path: "/rules/1"},
		{Method: "POST", Path: "/rules", Body: []byte(`{"source":"/x","target":"https://evil.example"}`)},
	} {
		resp, _ := p.HandleHTTPRequest(req)
		if resp.Headers[passthroughHeader] == "" {
			t.Errorf("%s %s was answered (%d) instead of declined", req.Method, req.Path, resp.StatusCode)
		}
	}
	if len(h.Tables[rulesTable]) != 1 {
		t.Fatalf("public request changed the rules: %v", h.Tables[rulesTable])
	}
}

func TestListEditBulkAndHits(t *testing.T) {
	p, h := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/a", Target: "/b", Enabled: true})
	mustAdd(t, p, Rule{Source: "/c", Target: "/d", Enabled: true})
	visit(t, p, "/a")
	visit(t, p, "/a")

	_, body := admin(t, p, "GET", "/rules?search=/a", nil)
	rows := body["rows"].([]any)
	if len(rows) != 1 || rows[0].(map[string]any)["hits"].(float64) != 2 {
		t.Fatalf("list = %v", body)
	}
	p.flushHits(context.Background())
	if got := num(h.Tables[rulesTable][1], "hits"); got != 2 {
		t.Fatalf("flushed hits = %d", got)
	}

	if code, _ := admin(t, p, "PUT", "/rules/1", Rule{Source: "/a", Target: "/z", StatusCode: 302, Enabled: true}); code != 200 {
		t.Fatal("update failed")
	}
	if code, loc := visit(t, p, "/a"); code != 302 || loc != "/z" {
		t.Fatalf("after edit: %d %q", code, loc)
	}
	admin(t, p, "POST", "/rules/bulk", map[string]any{"ids": []int{1, 2}, "action": "disable"})
	if code, _ := visit(t, p, "/c"); code != 0 {
		t.Fatal("disabled rule still served")
	}
	admin(t, p, "POST", "/rules/bulk", map[string]any{"ids": []int{1, 2}, "action": "delete"})
	if len(h.Tables[rulesTable]) != 0 {
		t.Fatal("bulk delete left rows")
	}
}

func TestImportExportAndTest(t *testing.T) {
	p, _ := newTestPlugin(t)
	mustAdd(t, p, Rule{Source: "/keep", Target: "/kept", Enabled: true})
	csv := "source,target,status_code,match_type\n/a,/b\n/b,/c,302\n/keep,/changed\nbad,/x\n/shop/*,/store/*,301,prefix\n"
	_, res := admin(t, p, "POST", "/import", map[string]any{"csv": csv})
	if res["created"].(float64) != 3 || res["skipped"].(float64) != 2 || len(res["errors"].([]any)) != 1 {
		t.Fatalf("import = %v", res)
	}
	_, res = admin(t, p, "POST", "/import", map[string]any{"csv": "/keep;/changed", "update_existing": true})
	if res["updated"].(float64) != 1 {
		t.Fatalf("update import = %v", res)
	}
	if _, loc := visit(t, p, "/keep"); loc != "/changed" {
		t.Fatalf("/keep -> %q", loc)
	}

	_, res = admin(t, p, "POST", "/test", map[string]any{"url": "https://site.example/a?x=1"})
	hops := res["hops"].([]any)
	if len(hops) != 2 || hops[1].(map[string]any)["location"] != "/c?x=1" || res["loop"] != false {
		t.Fatalf("test = %v", res)
	}
	mustAdd(t, p, Rule{Source: "/c", Target: "/a", Enabled: true})
	if _, res = admin(t, p, "POST", "/test", map[string]any{"url": "/a"}); res["loop"] != true {
		t.Fatalf("loop not detected: %v", res)
	}

	resp, _ := p.HandleHTTPRequest(&pb.PluginHTTPRequest{Method: "GET", Path: "/export", UserId: 1})
	if out := string(resp.Body); !strings.Contains(out, "/shop,/store/*,301,prefix,true,0,") {
		t.Fatalf("export:\n%s", out)
	}
}

func TestAutoRedirectOnURLChange(t *testing.T) {
	p, h := newTestPlugin(t)
	ctx := context.Background()
	h.Nodes[7] = &coreapi.Node{ID: 7, Status: "published", FullURL: "/about"}
	h.Nodes[8] = &coreapi.Node{ID: 8, Status: "draft", FullURL: "/draft"}
	p.seedNodeURLs(ctx)

	move := func(id uint, url string) {
		h.Nodes[id].FullURL = url
		p.handleNodeChanged(ctx, nodeEvent{NodeID: id, FullURL: url})
	}

	move(7, "/about") // plain save: nothing happens
	move(8, "/draft-2")
	if n := len(p.rules.Load().all); n != 0 {
		t.Fatalf("%d rules after no-op save and draft rename", n)
	}

	move(7, "/about-us")
	if code, loc := visit(t, p, "/about"); code != 301 || loc != "/about-us" {
		t.Fatalf("/about = %d %q", code, loc)
	}
	// Second rename: the first rule jumps straight to the final URL.
	move(7, "/company")
	if _, loc := visit(t, p, "/about"); loc != "/company" {
		t.Fatalf("chain not flattened: /about -> %q", loc)
	}
	if _, loc := visit(t, p, "/about-us"); loc != "/company" {
		t.Fatalf("/about-us -> %q", loc)
	}
	// Moving back must not leave a loop on the live URL.
	move(7, "/about")
	if code, _ := visit(t, p, "/about"); code != 0 {
		t.Fatal("live URL is still redirected after moving back")
	}
	if _, loc := visit(t, p, "/company"); loc != "/about" {
		t.Fatalf("/company -> %q", loc)
	}

	// Switched off: renames are tracked but create nothing.
	admin(t, p, "PUT", "/settings", map[string]any{"auto_create": false})
	before := len(p.rules.Load().all)
	move(7, "/about-3")
	if len(p.rules.Load().all) != before {
		t.Fatal("rule created while auto_create is off")
	}
}
