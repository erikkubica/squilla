package cms

import "testing"

func TestParseStructuredData(t *testing.T) {
	cases := []struct {
		in   string
		want int
		err  bool
	}{
		{"", 0, false},
		{"  \n ", 0, false},
		{`{"@type":"FAQPage"}`, 1, false},
		{`{}`, 0, false},
		{`[{"@type":"A"},{"@type":"B"},"x",{}]`, 2, false},
		{`{"@type":"FAQPage","mainEntity":[{"name":"a"},{"name":"b"},]}`, 1, false}, // trailing comma forgiven
		{`[{"@type":"A"},]`, 1, false},
		{`"just a string"`, 0, true},
		{`{"@type":`, 0, true},
	}
	for _, c := range cases {
		got, err := parseStructuredData([]byte(c.in))
		if (err != nil) != c.err {
			t.Errorf("%q: err = %v, want error %v", c.in, err, c.err)
			continue
		}
		if len(got) != c.want {
			t.Errorf("%q: got %d objects, want %d", c.in, len(got), c.want)
		}
	}
}

func TestStructuredPlainText(t *testing.T) {
	cases := map[string]string{
		"<p>Max <strong>6 guests</strong>. No flags.</p><p>Second&nbsp;para &amp; more</p>": "Max 6 guests. No flags. Second para & more",
		"line<br>break":   "line break",
		"  plain   text ": "plain text",
	}
	for in, want := range cases {
		if got := structuredPlainText(in); got != want {
			t.Errorf("structuredPlainText(%q) = %q, want %q", in, got, want)
		}
	}
	if structuredPlainText(nil) != "" {
		t.Error("nil should be empty")
	}
}
