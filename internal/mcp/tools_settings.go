package mcp

import (
	"context"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/secrets"
)

// settingHiddenFromScope reports whether key must be withheld from a token
// of the given scope. GetSetting/GetSettings return decrypted values, so
// credential-like keys (secrets.IsSecretKey) and extension-owned plugin.*
// keys (provider API keys, SMTP passwords stored under arbitrary names) are
// only visible to scope=full.
func settingHiddenFromScope(scope, key string) bool {
	if scope == ScopeFull {
		return false
	}
	return secrets.IsSecretKey(key) || strings.HasPrefix(strings.ToLower(key), "plugin.")
}

func tokenScope(ctx context.Context) string {
	if tok := tokenFromCtx(ctx); tok != nil {
		return tok.Scope
	}
	return ""
}

func (s *Server) registerSettingsTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.settings.get",
		mcp.WithDescription("Get one site setting by key (e.g. 'site.name', 'active_theme'). Secret-like keys (*_password, *_secret, *_key, *_token, ...) and plugin.* keys are redacted unless the token has scope=full."),
		mcp.WithString("key", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		key := stringArg(args, "key")
		if settingHiddenFromScope(tokenScope(ctx), key) {
			return map[string]any{"key": key, "value": "", "redacted": true}, nil
		}
		v, err := api.GetSetting(ctx, key)
		return map[string]any{"key": key, "value": v}, err
	})

	s.addTool(mcp.NewTool("core.settings.list",
		mcp.WithDescription("List settings, optionally filtered by key prefix. Secret-like keys and plugin.* keys are omitted unless the token has scope=full."),
		mcp.WithString("prefix"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		all, err := api.GetSettings(ctx, stringArg(args, "prefix"))
		if err != nil {
			return nil, err
		}
		scope := tokenScope(ctx)
		for k := range all {
			if settingHiddenFromScope(scope, k) {
				delete(all, k)
			}
		}
		return all, nil
	})

	s.addTool(mcp.NewTool("core.settings.set",
		mcp.WithDescription("Set a site setting. Requires 'full' scope — settings can alter CMS-wide behavior."),
		mcp.WithString("key", mcp.Required()),
		mcp.WithString("value", mcp.Required()),
	), "full", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.SetSetting(ctx, stringArg(args, "key"), stringArg(args, "value"))
		return map[string]any{"ok": err == nil}, err
	})
}
