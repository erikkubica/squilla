package coreapi

import (
	"encoding/json"

	"github.com/d5/tengo/v2"
)

// This file collects the small, type-conversion helpers used by every
// Tengo module: extracting Go types out of Tengo objects, wrapping Go
// values back into Tengo, and the symmetric helper that round-trips
// arbitrary Go data via JSON. Splitting them out keeps tengo_adapter.go
// focused on the module dispatch and the per-domain module builders
// readable on their own.

// tengoToBool extracts a bool from a Tengo object.
func tengoToBool(obj tengo.Object) bool {
	if b, ok := obj.(*tengo.Bool); ok {
		return !b.IsFalsy()
	}
	return false
}

// boolToTengo wraps a Go bool as a Tengo bool object.
func boolToTengo(b bool) tengo.Object {
	if b {
		return tengo.TrueValue
	}
	return tengo.FalseValue
}

// wrapError wraps a Go error into a Tengo Error object.
func wrapError(err error) tengo.Object {
	return &tengo.Error{Value: &tengo.String{Value: err.Error()}}
}

// tengoMapToGoMap converts a Tengo map (map[string]tengo.Object) to map[string]any.
func tengoMapToGoMap(m map[string]tengo.Object) map[string]any {
	result := make(map[string]any, len(m))
	for k, v := range m {
		result[k] = tengoObjToGo(v)
	}
	return result
}

// tengoObjToGo converts a Tengo object to a Go value.
func tengoObjToGo(obj tengo.Object) any {
	if obj == nil {
		return nil
	}
	switch v := obj.(type) {
	case *tengo.String:
		return v.Value
	case *tengo.Int:
		return v.Value
	case *tengo.Float:
		return v.Value
	case *tengo.Bool:
		return !v.IsFalsy()
	case *tengo.Map:
		return tengoMapToGoMap(v.Value)
	case *tengo.ImmutableMap:
		return tengoMapToGoMap(v.Value)
	case *tengo.Array:
		arr := make([]any, len(v.Value))
		for i, item := range v.Value {
			arr[i] = tengoObjToGo(item)
		}
		return arr
	case *tengo.ImmutableArray:
		arr := make([]any, len(v.Value))
		for i, item := range v.Value {
			arr[i] = tengoObjToGo(item)
		}
		return arr
	case *tengo.Undefined:
		return nil
	default:
		return obj.String()
	}
}

// goToTengoObj converts a Go value to a Tengo object by marshalling to JSON
// and then converting. This handles arbitrary Go types.
func goToTengoObj(v any) tengo.Object {
	if v == nil {
		return tengo.UndefinedValue
	}
	b, err := json.Marshal(v)
	if err != nil {
		return tengo.UndefinedValue
	}
	var raw any
	if err := json.Unmarshal(b, &raw); err != nil {
		return tengo.UndefinedValue
	}
	return rawToTengo(raw)
}

// rawToTengo recursively converts JSON-unmarshalled types to Tengo objects.
func rawToTengo(v any) tengo.Object {
	if v == nil {
		return tengo.UndefinedValue
	}
	switch val := v.(type) {
	case string:
		return &tengo.String{Value: val}
	case float64:
		// Check if this is actually an integer
		if val == float64(int64(val)) {
			return &tengo.Int{Value: int64(val)}
		}
		return &tengo.Float{Value: val}
	case bool:
		if val {
			return tengo.TrueValue
		}
		return tengo.FalseValue
	case map[string]any:
		m := make(map[string]tengo.Object, len(val))
		for k, item := range val {
			m[k] = rawToTengo(item)
		}
		return &tengo.ImmutableMap{Value: m}
	case []any:
		arr := make([]tengo.Object, len(val))
		for i, item := range val {
			arr[i] = rawToTengo(item)
		}
		return &tengo.ImmutableArray{Value: arr}
	default:
		return tengo.UndefinedValue
	}
}

// tengoToString extracts a string from a Tengo object.
func tengoToString(obj tengo.Object) string {
	if s, ok := obj.(*tengo.String); ok {
		return s.Value
	}
	return ""
}

// tengoToInt extracts an int from a Tengo object.
func tengoToInt(obj tengo.Object) int {
	switch v := obj.(type) {
	case *tengo.Int:
		return int(v.Value)
	case *tengo.Float:
		return int(v.Value)
	default:
		return 0
	}
}

// getTengoMap extracts the underlying map from a Tengo Map or ImmutableMap.
func getTengoMap(obj tengo.Object) map[string]tengo.Object {
	switch v := obj.(type) {
	case *tengo.Map:
		return v.Value
	case *tengo.ImmutableMap:
		return v.Value
	default:
		return nil
	}
}
