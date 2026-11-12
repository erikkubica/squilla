package auth

import (
	"reflect"

	"squilla/internal/models"
)

// canAssignRole reports whether actor may grant role to a user (create a
// user with it, move a user to it) or manage a user who currently holds
// it. The rule: the role's capabilities must be a subset of the actor's,
// so manage_users can never be used to mint or take over an account more
// privileged than the actor. Holders of the "*" wildcard or manage_roles
// pass outright — manage_roles can already edit any role's capabilities,
// so gating it here would add nothing.
func canAssignRole(actor *models.User, role models.Role) bool {
	if actor == nil {
		return false
	}
	actorCaps := ParseCapabilities(actor.Role.Capabilities)
	if b, ok := actorCaps["*"].(bool); ok && b {
		return true
	}
	if HasCapability(actor, "manage_roles") {
		return true
	}

	target := ParseCapabilities(role.Capabilities)
	for k, v := range target {
		switch k {
		case "default_node_access", "nodes":
			continue // compared below via effective access
		}
		switch tv := v.(type) {
		case bool:
			if tv && !HasCapability(actor, k) {
				return false
			}
		case nil:
		default:
			// Unknown non-boolean capability shapes must match exactly.
			if !reflect.DeepEqual(actorCaps[k], v) {
				return false
			}
		}
	}

	// Node access: the role's effective access to every node type either
	// side names explicitly, plus the default, must not exceed the actor's.
	targetUser := &models.User{Role: role}
	types := map[string]bool{"\x00default": true}
	for _, caps := range []map[string]interface{}{target, actorCaps} {
		if nodes, ok := caps["nodes"].(map[string]interface{}); ok {
			for t := range nodes {
				types[t] = true
			}
		}
	}
	for t := range types {
		if !nodeAccessWithin(GetNodeAccess(targetUser, t), GetNodeAccess(actor, t)) {
			return false
		}
	}
	return true
}

func accessRank(a string) int {
	switch a {
	case "write":
		return 2
	case "read":
		return 1
	default:
		return 0
	}
}

func scopeRank(s string) int {
	if s == "all" {
		return 1
	}
	return 0
}

// nodeAccessWithin reports whether want grants no more than have.
func nodeAccessWithin(want, have NodeAccess) bool {
	if accessRank(want.Access) == 0 {
		return true
	}
	if accessRank(want.Access) > accessRank(have.Access) {
		return false
	}
	return scopeRank(want.Scope) <= scopeRank(have.Scope)
}
