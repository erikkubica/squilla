package rendering

import "testing"

func TestFloatMathFuncs(t *testing.T) {
	r := NewTemplateRenderer("", true)
	var out = map[string]float64{}
	addf := r.funcMap["addf"].(func(a, b interface{}) float64)
	div := r.funcMap["div"].(func(a, b interface{}) float64)
	round := r.funcMap["round"].(func(v interface{}, places int) float64)
	out["sum"] = addf(addf(0.0, float64(5)), 4)
	out["avg"] = round(div(out["sum"], 2), 1)
	out["zero"] = div(1, 0)
	if out["sum"] != 9 || out["avg"] != 4.5 || out["zero"] != 0 {
		t.Fatalf("got %v", out)
	}
	if round(div(14, 3), 1) != 4.7 {
		t.Fatalf("round(div(14,3),1) = %v", round(div(14, 3), 1))
	}
}
