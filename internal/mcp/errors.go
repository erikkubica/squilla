package mcp

import (
	"errors"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	"gorm.io/gorm"
)

// toolError builds a structured MCP tool error. code becomes part of the
// text payload so clients can surface it programmatically; err is the root cause.
func toolError(code string, err error) *mcp.CallToolResult {
	return mcp.NewToolResultError(fmt.Sprintf("%s: %s", code, err.Error()))
}

func mapError(err error) *mcp.CallToolResult {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, gorm.ErrRecordNotFound):
		return toolError("not_found", err)
	case strings.Contains(err.Error(), "capability denied"):
		return toolError("capability_denied", err)
	case strings.Contains(err.Error(), "not allowed"):
		return toolError("forbidden", err)
	default:
		return toolError("internal", err)
	}
}
