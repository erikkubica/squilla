package rendering

import (
	"reflect"
	"testing"
)

func TestTextParagraphs(t *testing.T) {
	got := textParagraphs("One\r\n\r\n  Two\nstill two \n\n\n\nThree ")
	want := []string{"One", "Two\nstill two", "Three"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %q, want %q", got, want)
	}
	if textParagraphs("   ") != nil {
		t.Fatal("blank text should give no paragraphs")
	}
}

func TestTextInitials(t *testing.T) {
	cases := map[string]string{
		"Tessa Stein":  "TS",
		"Liam & Chloe": "LC",
		"David K.":     "DK",
		"Singapore":    "S",
		"  ":           "",
		"ánh dương":    "ÁD",
	}
	for in, want := range cases {
		if got := textInitials(in); got != want {
			t.Errorf("textInitials(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestToInt(t *testing.T) {
	for in, want := range map[interface{}]int{5: 5, 4.0: 4, "3": 3, "x": 0, int64(2): 2} {
		if got := toInt(in); got != want {
			t.Errorf("toInt(%v) = %d, want %d", in, got, want)
		}
	}
}
