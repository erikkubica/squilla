package coreapi

import (
	"bytes"
	"context"
	"log"
	"sort"
	"strings"
	"testing"

	"github.com/d5/tengo/v2"
	"github.com/d5/tengo/v2/stdlib"
)

// TestTengoStdlibAllowList pins the exact set of importable non-core/*
// modules. `os` (exec/read_file/getenv) must never be reachable.
func TestTengoStdlibAllowList(t *testing.T) {
	mods := BuildTengoModules(nil, CallerInfo{Type: "tengo"}, nil, "", nil, nil)

	candidates := map[string]bool{}
	for name := range stdlib.BuiltinModules {
		candidates[name] = true
	}
	for name := range stdlib.SourceModules {
		candidates[name] = true
	}
	var got []string
	for name := range candidates {
		if mods.Get(name) != nil {
			got = append(got, name)
		}
	}
	sort.Strings(got)
	want := []string{"base64", "fmt", "hex", "json", "math", "rand", "text", "times"}
	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("importable stdlib modules = %v, want %v", got, want)
	}

	for _, tc := range []struct{ mod, fn string }{
		{"fmt", "print"}, {"fmt", "printf"}, {"fmt", "println"}, {"times", "sleep"},
	} {
		if _, ok := mods.GetBuiltinModule(tc.mod).Attrs[tc.fn]; ok {
			t.Errorf("%s.%s must not be exposed", tc.mod, tc.fn)
		}
	}
	if _, ok := mods.GetBuiltinModule("fmt").Attrs["sprintf"]; !ok {
		t.Error("fmt.sprintf must stay available")
	}
	if _, ok := stdlib.BuiltinModules["fmt"]["print"]; !ok {
		t.Error("allow-list must not mutate the shared stdlib maps")
	}
}

func TestTengoImportOSFailsToCompile(t *testing.T) {
	s := tengo.NewScript([]byte(`os := import("os"); x := os.getenv("HOME")`))
	s.SetImports(BuildTengoModules(nil, CallerInfo{Type: "tengo"}, nil, "", nil, nil))
	if _, err := s.Compile(); err == nil {
		t.Fatal(`import("os") compiled`)
	}
}

// Registration modules without callbacks (handler scripts at runtime)
// return an error value instead of silently succeeding.
func TestRegistrationModulesClosedWithoutCallbacks(t *testing.T) {
	s := tengo.NewScript([]byte(`
r := import("core/routes").register("GET", "/x", "h")
f := import("core/filters").add("a", "h")
e := import("core/events").on("a", "h")
w := import("core/wellknown").register("a", "h")
out := is_error(r) && is_error(f) && is_error(e) && is_error(w)
`))
	s.SetImports(BuildTengoModules(nil, CallerInfo{Type: "tengo"}, nil, "", nil, nil))
	c, err := s.Run()
	if err != nil {
		t.Fatal(err)
	}
	if !c.Get("out").Bool() {
		t.Fatal("registration without callbacks must return errors")
	}
}

func TestTengoObjToGo_CycleBounded(t *testing.T) {
	m := &tengo.Map{Value: map[string]tengo.Object{}}
	m.Value["self"] = m
	arr := &tengo.Array{}
	arr.Value = []tengo.Object{arr}
	_ = tengoObjToGo(m)
	_ = tengoObjToGo(arr)

	items := &tengo.Array{}
	item := &tengo.Map{Value: map[string]tengo.Object{"label": &tengo.String{Value: "x"}, "children": items}}
	items.Value = []tengo.Object{item}
	_ = menuItemsFromTengo(items)

	fields := &tengo.Array{}
	field := &tengo.Map{Value: map[string]tengo.Object{"name": &tengo.String{Value: "f"}, "fields": fields}}
	fields.Value = []tengo.Object{field}
	_ = tengoToField(field.Value)
}

func TestLog_EscapesNewlines(t *testing.T) {
	var buf bytes.Buffer
	prevOut, prevFlags := log.Writer(), log.Flags()
	log.SetOutput(&buf)
	log.SetFlags(0)
	defer func() { log.SetOutput(prevOut); log.SetFlags(prevFlags) }()

	ctx := WithCaller(context.Background(), CallerInfo{Slug: "ext", Type: "tengo"})
	_ = (&coreImpl{}).Log(ctx, "info", "hello\n[ERROR] [internal] forged", map[string]any{"k": "v\r\n[ERROR] forged"})

	out := strings.TrimRight(buf.String(), "\n")
	if strings.Count(out, "\n") != 0 || strings.Contains(out, "\r") {
		t.Fatalf("log line split by caller input: %q", out)
	}
	if !strings.Contains(out, `hello\n[ERROR]`) {
		t.Fatalf("newline not escaped: %q", out)
	}
}
