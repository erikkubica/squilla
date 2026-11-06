package cms

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestResolveNodeRefsWith(t *testing.T) {
	nodes := map[string]interface{}{
		"faq/rain":     map[string]interface{}{"id": 14, "node_type": "faq", "slug": "rain", "title": "Rain?"},
		"post/welcome": map[string]interface{}{"id": 3, "node_type": "post", "slug": "welcome", "title": "Welcome"},
	}
	lookup := func(ref string) interface{} { return nodes[ref] }
	in := `[{"block_type_slug":"x","default_values":{
		"faqs":[{"$ref":"faq/rain"},{"$ref":"faq/missing"}],
		"featured_post":{"$ref":"post/welcome"},
		"gone":{"$ref":"post/nope"},
		"link":{"$ref":"faq/rain","label":"kept as is"},
		"heading":"Hello"}}]`
	got := resolveNodeRefsWith([]byte(in), lookup)
	var g, w interface{}
	_ = json.Unmarshal(got, &g)
	_ = json.Unmarshal([]byte(`[{"block_type_slug":"x","default_values":{
		"faqs":[{"id":14,"node_type":"faq","slug":"rain","title":"Rain?"}],
		"featured_post":{"id":3,"node_type":"post","slug":"welcome","title":"Welcome"},
		"gone":null,
		"link":{"$ref":"faq/rain","label":"kept as is"},
		"heading":"Hello"}}]`), &w)
	if !reflect.DeepEqual(g, w) {
		t.Fatalf("got %s", got)
	}
	if out := resolveNodeRefsWith([]byte(`{"a":1}`), lookup); string(out) != `{"a":1}` {
		t.Fatalf("no-ref input changed: %s", out)
	}
}
