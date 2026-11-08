package coreapi

import "testing"

// label_plural must survive the kernel → plugin gRPC hop; without it
// plugins (seo-extension's llms.txt headings) fall back to Label+"s" and
// print "Case studys".
func TestNodeTypeProtoRoundTrip_LabelPlural(t *testing.T) {
	in := &NodeType{Slug: "case_study", Label: "Case study", LabelPlural: "Case studies", Public: true}
	out := nodeTypeFromProto(nodeTypeToProto(in))
	if out.LabelPlural != "Case studies" || out.Label != "Case study" {
		t.Fatalf("round trip lost labels: %+v", out)
	}

	inp := NodeTypeInput{Slug: "case_study", Label: "Case study", LabelPlural: "Case studies"}
	if got := nodeTypeInputFromProto(nodeTypeInputToProto(inp)); got.LabelPlural != "Case studies" {
		t.Fatalf("input round trip lost label_plural: %+v", got)
	}
}
