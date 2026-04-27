package sanitize

import (
	"strings"
	"testing"
)

func TestRichText_StripsScriptTags(t *testing.T) {
	cases := []struct {
		desc    string
		in      string
		mustNot []string
	}{
		{"inline script", `<p>hi</p><script>alert(1)</script>`, []string{"<script", "alert(1)"}},
		{"event handler", `<a href="/" onclick="alert(1)">x</a>`, []string{"onclick", "alert(1)"}},
		{"javascript: url", `<a href="javascript:alert(1)">x</a>`, []string{"javascript:", "alert(1)"}},
		{"data: url with html", `<a href="data:text/html,<script>alert(1)</script>">x</a>`, []string{"<script", "alert(1)"}},
		{"iframe", `<iframe src="https://evil.example/"></iframe>`, []string{"<iframe", "evil.example"}},
		{"object", `<object data="https://evil.example/x.swf"></object>`, []string{"<object"}},
		{"embed", `<embed src="https://evil.example/x">`, []string{"<embed"}},
		{"form", `<form action="/x"><input name="x"/></form>`, []string{"<form", "<input"}},
		{"style with expression", `<p style="background: expression(alert(1))">x</p>`, []string{"expression"}},
		{"meta refresh", `<meta http-equiv="refresh" content="0;url=https://evil">`, []string{"<meta"}},
		{"svg with onload", `<svg onload="alert(1)"><circle r=10/></svg>`, []string{"onload", "alert(1)"}},
		{"img with onerror", `<img src="x" onerror="alert(1)">`, []string{"onerror", "alert(1)"}},
		{"base href", `<base href="https://evil.example/">`, []string{"<base"}},
	}
	for _, tc := range cases {
		t.Run(tc.desc, func(t *testing.T) {
			out := RichText(tc.in)
			lower := strings.ToLower(out)
			for _, banned := range tc.mustNot {
				if strings.Contains(lower, strings.ToLower(banned)) {
					t.Fatalf("output still contains %q\ninput:  %q\noutput: %q", banned, tc.in, out)
				}
			}
		})
	}
}

func TestRichText_KeepsSafeMarkup(t *testing.T) {
	cases := []struct {
		desc string
		in   string
		must []string
	}{
		{"basic prose", `<p>Hello <strong>world</strong></p>`, []string{"<p>", "<strong>", "Hello", "world"}},
		{"headings", `<h1>Title</h1><h2>Sub</h2><h3>Sub2</h3>`, []string{"<h1>", "<h2>", "<h3>"}},
		{"lists", `<ul><li>a</li><li>b</li></ul>`, []string{"<ul>", "<li>"}},
		{"ordered", `<ol><li>a</li></ol>`, []string{"<ol>", "<li>"}},
		// UGC policy auto-augments rel with nofollow on outbound links — accept that.
		{"link with rel/target", `<a href="https://example.com" target="_blank" rel="noopener">x</a>`, []string{"href=\"https://example.com\"", "target=\"_blank\"", "noopener"}},
		{"image with loading", `<img src="https://example.com/x.png" alt="x" loading="lazy">`, []string{"<img", "loading=\"lazy\"", "alt=\"x\""}},
		{"figure", `<figure><img src="/x.png" alt="x"><figcaption>cap</figcaption></figure>`, []string{"<figure>", "<figcaption>"}},
		{"blockquote", `<blockquote>quoted</blockquote>`, []string{"<blockquote>"}},
		{"code", `<pre><code>println("hi")</code></pre>`, []string{"<pre>", "<code>"}},
		{"class allowed", `<p class="prose-lg">x</p>`, []string{`class="prose-lg"`}},
		{"id allowed", `<h2 id="section">x</h2>`, []string{`id="section"`}},
	}
	for _, tc := range cases {
		t.Run(tc.desc, func(t *testing.T) {
			out := RichText(tc.in)
			for _, want := range tc.must {
				if !strings.Contains(out, want) {
					t.Fatalf("output missing %q\ninput:  %q\noutput: %q", want, tc.in, out)
				}
			}
		})
	}
}

func TestRichText_Empty(t *testing.T) {
	if got := RichText(""); got != "" {
		t.Fatalf("RichText(\"\") = %q, want \"\"", got)
	}
}

func TestRichText_PreservesText(t *testing.T) {
	// Plain text without markup should round-trip.
	in := "Hello, world!"
	if got := RichText(in); got != in {
		t.Fatalf("RichText(plain text) lost content: got %q want %q", got, in)
	}
}
