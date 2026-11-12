package cms

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"
)

type fakeTransformer struct {
	vibeplugin.ExtensionPlugin
	calls int
	resp  *pb.EventResponse
	err   error
	last  string
}

func (f *fakeTransformer) HandleEventCtx(_ context.Context, _ string, payload []byte) (*pb.EventResponse, error) {
	f.calls++
	f.last = string(payload)
	return f.resp, f.err
}

func newTransformPM(plugins ...*runningPlugin) *PluginManager {
	pm := NewPluginManager(nil, nil, nil)
	pm.plugins["t"] = plugins
	return pm
}

func tp(prio int, f *fakeTransformer) *runningPlugin {
	return &runningPlugin{slug: "t", impl: f, priority: prio, transformer: true, stopped: make(chan struct{})}
}

func TestTransformChainOrderFailOpenAndSkip(t *testing.T) {
	hi := &fakeTransformer{resp: &pb.EventResponse{Handled: true, Result: []byte("<p>hi</p>")}}
	lo := &fakeTransformer{resp: &pb.EventResponse{Handled: true, Result: []byte("<p>hi lo</p>")}}
	pm := newTransformPM(tp(10, lo), tp(90, hi))
	out := pm.TransformHTML(TransformRequest{HTML: "<p>x</p>", Path: "/a", UserID: 3, Role: "editor"})
	if out != "<p>hi lo</p>" || hi.calls != 1 || lo.calls != 1 {
		t.Fatalf("out=%q hi=%d lo=%d", out, hi.calls, lo.calls)
	}
	if !strings.Contains(lo.last, `"html":"<p>hi</p>"`) || strings.Contains(lo.last, "\\u003c") {
		t.Errorf("second plugin must see the first one's output, unescaped: %s", lo.last)
	}
	if strings.Contains(hi.last, "email") || !strings.Contains(hi.last, `"role":"editor"`) {
		t.Errorf("payload %s", hi.last)
	}

	// Error, empty and oversized answers keep the previous HTML.
	for name, f := range map[string]*fakeTransformer{
		"error":      {err: errors.New("boom")},
		"empty":      {resp: &pb.EventResponse{Handled: true}},
		"plugin err": {resp: &pb.EventResponse{Handled: true, Error: "x", Result: []byte("bad")}},
		"oversized":  {resp: &pb.EventResponse{Handled: true, Result: []byte(strings.Repeat("a", 5000))}},
	} {
		if got := newTransformPM(tp(1, f)).TransformHTML(TransformRequest{HTML: "<p>x</p>"}); got != "<p>x</p>" {
			t.Errorf("%s: got %q", name, got)
		}
	}

	// "Inactive" pauses the plugin.
	idle := &fakeTransformer{resp: &pb.EventResponse{Handled: false}}
	pm = newTransformPM(tp(1, idle))
	if !pm.TransformActive() {
		t.Fatal("should be active before the first answer")
	}
	pm.TransformHTML(TransformRequest{HTML: "x"})
	pm.TransformHTML(TransformRequest{HTML: "x"})
	if idle.calls != 1 || pm.TransformActive() {
		t.Errorf("calls=%d active=%v", idle.calls, pm.TransformActive())
	}
	pm.plugins["t"][0].skipUntil.Store(time.Now().Add(-time.Second).UnixNano())
	if !pm.TransformActive() {
		t.Error("skip must expire")
	}
}

func TestTransformMarkers(t *testing.T) {
	blocks := []map[string]interface{}{{"type": "hero"}, {"type": "x-->evil"}}
	got := wrapBlocksWithTransformMarkers([]string{"<a>", "<b>"}, blocks)
	if got[0] != "<!--sqx:b:0:hero--><a><!--sqx:/b-->" || strings.Contains(got[1], "x-->evil") {
		t.Errorf("markers %v", got)
	}
	page := "<main>" + strings.Join(got, "") + "<!--sqx:p:default-cta--><i></i><!--sqx:/p--></main>"
	if s := stripTransformMarkers(page); s != "<main><a><b><i></i></main>" {
		t.Errorf("strip = %q", s)
	}
	if stripTransformMarkers("<p>a</p><!-- keep -->") != "<p>a</p><!-- keep -->" {
		t.Error("foreign comments must stay")
	}
}

func TestTransformSubscriptionNeedsCapability(t *testing.T) {
	sub := map[string]bool{subscribeCapability: true}
	both := map[string]bool{subscribeCapability: true, transformCapability: true}
	if ok, _ := subscriptionAllowed(transformEvent, sub); ok {
		t.Error("render.transform needs the render:transform capability")
	}
	if ok, _ := subscriptionAllowed(transformEvent, both); !ok {
		t.Error("render.transform needs the render:transform capability")
	}
	if !explicitOnlyEvent(transformEvent) {
		t.Error("render.transform must be explicit-only")
	}
}

func BenchmarkRenderTransformMarshal(b *testing.B) {
	html := strings.Repeat(`<section data-block="x"><a href="/a">link</a><p class="p">text "quoted"</p></section>`, 420) // ≈ 33 KB
	b.SetBytes(int64(len(html)))
	for i := 0; i < b.N; i++ {
		if _, err := marshalTransform(transformPayload{HTML: html, Path: "/", Node: map[string]any{"id": 1}}); err != nil {
			b.Fatal(err)
		}
	}
}
