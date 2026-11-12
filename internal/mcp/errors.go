package mcp

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/url"
	"os"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	"gorm.io/gorm"

	"squilla/internal/coreapi"
)

// toolError builds a structured MCP tool error. code becomes part of the
// text payload so clients can surface it programmatically; err is the root cause.
// Only use it for messages that are safe to show the caller — anything that
// may carry driver/filesystem/network detail goes through mapError.
func toolError(code string, err error) *mcp.CallToolResult {
	return mcp.NewToolResultError(fmt.Sprintf("%s: %s", code, err.Error()))
}

// mapError converts a tool error into an MCP result without logging.
// Kept for callers that only need the classification; dispatch uses
// publicError so internal errors are logged with a request id.
func mapError(err error) *mcp.CallToolResult {
	if err == nil {
		return nil
	}
	code, msg := publicError(nil, "", err)
	return mcp.NewToolResultError(code + ": " + msg)
}

// newRequestID returns a short random id that ties a generic error shown to
// the agent to the detailed server-side log line.
func newRequestID() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "unknown"
	}
	return hex.EncodeToString(b[:])
}

// internalMessage is the only text an agent sees for an internal failure.
func internalMessage(reqID string) string {
	return "internal error (request id " + reqID + "; details are in the server log)"
}

// publicError classifies err and returns (code, message) safe to return to
// an MCP client. Validation, not-found and permission messages pass through
// verbatim because agents need them to self-correct. Internal errors —
// coreapi internal errors, database driver errors, filesystem/network
// errors (which carry absolute paths, addresses and SQL) — are replaced by
// a generic message with a request id; the detail is logged server-side.
func publicError(logger *log.Logger, name string, err error) (code, msg string) {
	var apiErr *coreapi.APIError
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		return "not_found", "record not found"
	case errors.As(err, &apiErr) && errors.Is(apiErr.Code, coreapi.ErrNotFound):
		return "not_found", apiErr.Message
	case errors.As(err, &apiErr) && errors.Is(apiErr.Code, coreapi.ErrValidation):
		return "validation", apiErr.Message
	case errors.As(err, &apiErr) && errors.Is(apiErr.Code, coreapi.ErrCapabilityDenied):
		return "capability_denied", apiErr.Message
	case errors.As(err, &apiErr):
		// ErrInternal or an unknown code.
	case isLowLevelError(err):
	case strings.Contains(err.Error(), "capability denied"):
		return "capability_denied", err.Error()
	case strings.Contains(err.Error(), "not allowed"):
		return "forbidden", err.Error()
	default:
		// Tool-level errors built with fmt.Errorf/errors.New in this
		// package (missing args, invalid slug, scope guidance, upload
		// state machine sentinels) are meant for the agent.
		return "error", err.Error()
	}
	reqID := newRequestID()
	if logger == nil {
		logger = log.Default()
	}
	logger.Printf("tool=%s request_id=%s internal error: %v", name, reqID, err)
	return "internal", internalMessage(reqID)
}

// isLowLevelError reports whether err wraps something whose text must not
// reach an MCP client: filesystem paths, network addresses, SQL driver output.
func isLowLevelError(err error) bool {
	var pathErr *fs.PathError
	var linkErr *os.LinkError
	var sysErr *os.SyscallError
	var netErr *net.OpError
	var dnsErr *net.DNSError
	var urlErr *url.Error
	if errors.As(err, &pathErr) || errors.As(err, &linkErr) || errors.As(err, &sysErr) ||
		errors.As(err, &netErr) || errors.As(err, &dnsErr) || errors.As(err, &urlErr) {
		return true
	}
	m := strings.ToLower(err.Error())
	for _, marker := range []string{"sqlstate", "pq: ", "sql: ", "sqlite", "pgconn", "syntax error at or near"} {
		if strings.Contains(m, marker) {
			return true
		}
	}
	return false
}
