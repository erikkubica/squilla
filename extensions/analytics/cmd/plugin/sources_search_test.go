package main

import "testing"

func TestSearchTerm(t *testing.T) {
	cases := map[string]string{
		"":                             "",
		"q=Hello%20%20World":           "hello world",
		"s=tours&utm_source=x":         "tours",
		"page=2":                       "",
		"q=iphone+15+2023":             "iphone 15 2023",
		"q=me%40example.com":           "",
		"q=call+%2B421+905+123+456":    "",
		"search=4111-1111-1111-1111":   "",
		"q=" + string(make([]byte, 0)): "",
		"query=10115+berlin":           "10115 berlin",
		"q=%20%20&s=fallback":          "fallback",
	}
	for in, want := range cases {
		if got := searchTerm(in); got != want {
			t.Errorf("searchTerm(%q) = %q, want %q", in, got, want)
		}
	}
	long := "q="
	for i := 0; i < 50; i++ {
		long += "ab"
	}
	if got := searchTerm(long); len([]rune(got)) != 80 {
		t.Errorf("long term not clipped: %d", len(got))
	}
}
