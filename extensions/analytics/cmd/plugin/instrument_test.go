package main

import (
	"encoding/json"
	"regexp"
	"strings"
	"testing"
)

const fixturePage = `<!doctype html><html><head><title>x</title></head><body class="a">
<header><nav><a href="/en/about">About</a></nav></header>
<main>
<!--sqx:b:0:bv-hero--><section data-block="bv-hero"><a href="/en/experiences" class="b">See <b>tours</b></a><a href="https://wa.me/84969655521">WhatsApp</a></section><!--sqx:/b-->
<!--sqx:b:1:bv-faq--><section><details open><summary>q</summary>a</details><details><summary>r</summary>b</details></section><!--sqx:/b-->
<!--sqx:b:2:bv-hero--><div><form action="/forms/submit/x"><input name="a"></form></div><section><img src="/a.png"/></section><!--sqx:/b-->
</main>
<!--sqx:p:default-cta--><section><a href="mailto:hi@x.com?subject=a">Mail</a><a href="#top">skip</a></section><!--sqx:/p-->
<footer><a href="https://partner.example.net/a?b=1">Ext</a><a href="/go/wa">go</a><a href="https://www.example.com/en/x/">own</a></footer>
<script>var a = "<a href='/x'>";</script>
</body></html>`

var addedAttrs = regexp.MustCompile(` data-sq-b="\d+"| data-sq-o| ping="[^"]*"`)

func testOpts() instrumentOpts {
	return instrumentOpts{Prefix: "/_s", NodeID: 12, Host: "example.com", Clicks: true,
		Own: func(h string) bool { return normalizeHost(h) == "example.com" }}
}

func TestInstrumentOnlyInsertsAttributes(t *testing.T) {
	res := instrument(fixturePage, testOpts())
	if res == nil {
		t.Fatal("nil result")
	}
	if got := addedAttrs.ReplaceAllString(res.HTML, ""); got != fixturePage {
		t.Fatalf("output differs from input beyond inserted attributes:\n%s", got)
	}
	var keys []string
	for _, s := range res.Sections {
		keys = append(keys, s.Key)
	}
	want := "bv-hero.0,bv-faq.0,bv-hero.1,bv-hero.1,p:default-cta"
	if strings.Join(keys, ",") != want {
		t.Errorf("sections = %v, want %s", keys, want)
	}
	if !res.Sections[1].Details || !res.Sections[2].Form {
		t.Errorf("section facts wrong: %+v", res.Sections)
	}
	if strings.Count(res.HTML, "data-sq-o") != 1 {
		t.Error("only the <details open> gets data-sq-o")
	}
	got := map[string]string{}
	for _, l := range res.Links {
		got[l.Dest] = l.Block + "|" + l.Class + "|" + l.Label
	}
	for dest, w := range map[string]string{
		"/en/about":             "n|i|About",
		"/en/experiences":       "bv-hero.0|i|See tours",
		"wa.me/84969655521":     "bv-hero.0|c|WhatsApp",
		"mailto:hi@x.com":       "p:default-cta|c|Mail",
		"partner.example.net/a": "f|x|Ext",
		"/en/x":                 "f|i|own",
	} {
		if got[dest] != w {
			t.Errorf("link %s = %q, want %q (all: %v)", dest, got[dest], w, got)
		}
	}
	if len(res.Links) != 6 { // /go/wa is untracked, #top skipped
		t.Errorf("links = %d: %+v", len(res.Links), res.Links)
	}
	if strings.Contains(res.HTML, `ping="/_s/c?p=12&amp;k=n"><b>`) || !strings.Contains(res.HTML, `ping="/_s/c?p=12&amp;k=bv-hero.0"`) {
		t.Errorf("pings: %s", res.HTML)
	}
	if strings.Contains(res.HTML, `<a href="/go/wa" ping`) || strings.Contains(res.HTML, `href="#top" ping`) {
		t.Error("/go/ and # links must not get a ping")
	}
	if !strings.Contains(res.HTML, `<script>var a = "<a href='/x'>";</script>`) {
		t.Error("script content must be untouched")
	}
	if res2 := instrument(fixturePage, testOpts()); res2.Hash != res.Hash {
		t.Error("outline hash must be stable")
	}
}

func TestInstrumentLeavesExistingPingAndSkipsEmptyPages(t *testing.T) {
	r := instrument(`<main><!--sqx:b:0:x--><div><a href="/a" ping="/mine">a</a></div><!--sqx:/b--></main>`, testOpts())
	if r == nil || strings.Count(r.HTML, "ping=") != 1 || !strings.Contains(r.HTML, `ping="/mine"`) {
		t.Fatalf("existing ping overwritten: %+v", r)
	}
	if instrument(`<p>nothing here</p>`, testOpts()) != nil {
		t.Error("a page without sections or links must not be instrumented")
	}
}

func TestSignalsMarkupBudgetAndShape(t *testing.T) {
	cfg := defaultConfig()
	cfg.EnhancedMode = true
	res := instrument(fixturePage, testOpts())
	style, box := signalsMarkup(&cfg, 12, res.Sections)
	if len(style) > 3500 {
		t.Errorf("style is %d bytes", len(style))
	}
	for _, want := range []string{
		"@supports (animation-timeline:view()) and (timeline-scope:--a)", "timeline-scope:--s0,--s1,--s2,--s3,--s4",
		`[data-sq-b="1"]{view-timeline:--s1 block}`, "/_s/v?p=12&k=bv-faq.0", "/_s/t?p=12&s=10", "/_s/b?p=12&w=m&c=d",
		`html:has([data-sq-b="1"] details[open]:not([data-sq-o]))`, `html:has([data-sq-b="2"] form:focus-within)`,
		"/_s/e?p=12", "content-visibility",
	} {
		if !strings.Contains(style, want) {
			t.Errorf("style lacks %q", want)
		}
	}
	if strings.Contains(style, "<script") || strings.Contains(box, "<script") || strings.Contains(style, "visitor") {
		t.Error("no scripts or identifiers allowed")
	}
	if !strings.Contains(box, `class="sq-a"`) || !strings.Contains(box, `class="sq-g"`) || !strings.Contains(box, `class="sq-t t600"`) {
		t.Errorf("container = %s", box)
	}
	cfg.SignalSections, cfg.SignalDwell, cfg.SignalForms = false, false, false
	style2, box2 := signalsMarkup(&cfg, 12, res.Sections)
	if strings.Contains(style2, "view-timeline") || strings.Contains(box2, "sq-g") || strings.Contains(box2, "sq-t") {
		t.Errorf("sub-toggles ignored: %s %s", style2, box2)
	}
}

func TestHandleTransformGatesVisitors(t *testing.T) {
	p, _ := newTestPlugin(t)
	cfg := *p.config()
	cfg.EnhancedMode = true
	p.cfg.Store(&cfg)
	call := func(mut func(m map[string]any)) string {
		m := map[string]any{"html": fixturePage, "path": "/en/tours", "host": "example.com",
			"node": map[string]any{"id": 12, "is_404": false}, "user": map[string]any{"id": 0}, "gpc": false}
		if mut != nil {
			mut(m)
		}
		b, _ := jsonMarshal(m)
		r := p.handleTransform(b)
		if !r.Handled {
			return "inactive"
		}
		if len(r.Result) == 0 {
			return "unchanged"
		}
		return string(r.Result)
	}
	out := call(nil)
	if !strings.Contains(out, `<div class="sq-o"`) || !strings.Contains(out, "<style>.sq-o{") || strings.Index(out, "<style>") > strings.Index(out, "</head>") {
		t.Fatalf("markup missing or misplaced")
	}
	if !strings.HasSuffix(strings.TrimSpace(out[:strings.LastIndex(out, "</body>")]), "</div>") {
		t.Error("container must sit right before </body>")
	}
	for name, mut := range map[string]func(map[string]any){
		"logged in": func(m map[string]any) { m["user"] = map[string]any{"id": 4} },
		"gpc":       func(m map[string]any) { m["gpc"] = true },
		"opted out": func(m map[string]any) { m["cookies"] = map[string]string{optOutCookie: "1"} },
		"404":       func(m map[string]any) { m["node"] = map[string]any{"id": 12, "is_404": true} },
		"excluded":  func(m map[string]any) { m["path"] = "/admin/x" },
	} {
		if got := call(mut); got != "unchanged" {
			t.Errorf("%s: %.40s", name, got)
		}
	}
	cfg.EnhancedMode = false
	p.cfg.Store(&cfg)
	if got := call(nil); got != "inactive" {
		t.Errorf("signals off must answer inactive, got %.30s", got)
	}
}

func jsonMarshal(v any) ([]byte, error) { return json.Marshal(v) }
