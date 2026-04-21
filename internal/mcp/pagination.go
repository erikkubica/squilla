package mcp

const (
	defaultLimit = 25
	maxLimit     = 200
)

// clampLimit returns a sane limit for any *.query tool.
func clampLimit(in int) int {
	if in <= 0 {
		return defaultLimit
	}
	if in > maxLimit {
		return maxLimit
	}
	return in
}
