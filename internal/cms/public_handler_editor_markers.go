package cms

import (
	"fmt"
	"html/template"

	"squilla/internal/auth"
	"squilla/internal/models"
)

// Editor markers wrap each rendered block in HTML comments so the
// visual-editor extension's client script can map DOM positions back to
// indexes in `blocks_data`. Comments don't affect layout, screen
// readers, or CSS — and they're only emitted when the requesting user
// has write access to this node type, so anonymous visitors get no
// markers and a slightly smaller payload.
//
// Format (kept short and parser-friendly — lowercase, single colon
// separator, no whitespace inside the comment):
//
//	<!--squilla:block:start:0:hero--> ...rendered HTML... <!--squilla:block:end:0-->
//
// The slug is included in the start marker so the client can short-circuit
// `blocks_data[i].type` lookups; the end marker carries only the index
// because that's what's needed to find the closing boundary.

const (
	editorMarkerStartFmt = "<!--squilla:block:start:%d:%s-->"
	editorMarkerEndFmt   = "<!--squilla:block:end:%d-->"
)

// userCanEditNodeType returns true when the user has node-write access
// for the given node type. Used to gate editor-marker emission on the
// public site so we never expose them to anonymous visitors.
func userCanEditNodeType(user *models.User, nodeType string) bool {
	if user == nil {
		return false
	}
	access := auth.GetNodeAccess(user, nodeType)
	return access.Access == "write"
}

// wrapBlocksWithEditorMarkers wraps each rendered block with start/end
// HTML comments when the user has write access for nodeType. When the
// user is anonymous or lacks write access, the input slice is returned
// unchanged — no allocations, no payload bloat.
//
// `blocks` and `rendered` must be the same length: rendered[i] is the
// HTML for blocks[i]. blocks[i]["type"] supplies the slug embedded in
// the start marker. If the slug is missing or non-string, "" is used.
func wrapBlocksWithEditorMarkers(
	rendered []string,
	blocks []map[string]interface{},
	user *models.User,
	nodeType string,
) []string {
	if !userCanEditNodeType(user, nodeType) {
		return rendered
	}
	if len(rendered) != len(blocks) {
		// Defensive: callers always pass matched slices (renderBlocksBatch
		// returns one entry per input block), but a future refactor could
		// drift. Skip wrapping rather than mis-pair markers — wrong
		// markers are worse than absent markers.
		return rendered
	}

	out := make([]string, len(rendered))
	for i, html := range rendered {
		slug, _ := blocks[i]["type"].(string)
		// HTMLEscape the slug because block_types.slug is operator-supplied
		// (custom blocks); a malicious slug like "x-->evil<!--" would
		// otherwise let an admin user smuggle markup that escapes the
		// comment. Markers are only emitted to admins, but defense in
		// depth.
		safeSlug := template.HTMLEscapeString(slug)
		out[i] = fmt.Sprintf(editorMarkerStartFmt, i, safeSlug) + html + fmt.Sprintf(editorMarkerEndFmt, i)
	}
	return out
}
