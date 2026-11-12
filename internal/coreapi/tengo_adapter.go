package coreapi

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/d5/tengo/v2"
	"github.com/d5/tengo/v2/stdlib"

	"squilla/internal/cms"
)

// ScriptCallbacks allows the ScriptEngine to communicate back to the CMS.
// A callback returns an error when the registration is refused (missing
// capability, invalid script path, registration outside the load phase);
// the module hands it back to the script as an error value.
//
// A nil *ScriptCallbacks (or a nil field) means registration is closed:
// handler scripts that run at request/event time get nil so they can't
// add routes, filters or event handlers under someone else's scope.
type ScriptCallbacks struct {
	OnRoute     func(method, path, scriptPath string) error
	OnFilter    func(name, scriptPath string, priority int) error
	OnEvent     func(action, scriptPath string, priority int) error
	OnWellKnown func(path, scriptPath string) error
}

// errRegistrationClosed is returned by the registration modules when the
// script runs without callbacks (any run other than the entry-script load).
var errRegistrationClosed = fmt.Errorf("registration is only allowed while theme.tengo / extension.tengo loads")

// MaxScriptSourceBytes caps the size of any .tengo file the engine compiles
// (entry scripts, handler scripts and importable source modules).
const MaxScriptSourceBytes = 1 << 20

// allowedStdlibModules is the explicit allow-list of Tengo stdlib modules
// scripts may import. `os` (exec, file I/O, env) is never exposed; `fmt`
// loses the stdout printers and `times` loses sleep (it would pin a
// request goroutine past the script deadline).
func allowedStdlibModules() map[string]map[string]tengo.Object {
	return map[string]map[string]tengo.Object{
		"math":   stdlib.BuiltinModules["math"],
		"text":   stdlib.BuiltinModules["text"],
		"rand":   stdlib.BuiltinModules["rand"],
		"json":   stdlib.BuiltinModules["json"],
		"base64": stdlib.BuiltinModules["base64"],
		"hex":    stdlib.BuiltinModules["hex"],
		"fmt":    withoutKeys(stdlib.BuiltinModules["fmt"], "print", "printf", "println"),
		"times":  withoutKeys(stdlib.BuiltinModules["times"], "sleep"),
	}
}

func withoutKeys(mod map[string]tengo.Object, drop ...string) map[string]tengo.Object {
	out := make(map[string]tengo.Object, len(mod))
	for k, v := range mod {
		out[k] = v
	}
	for _, k := range drop {
		delete(out, k)
	}
	return out
}

// BuildTengoModules creates a new ModuleMap and registers all Squilla modules.
// CoreAPI calls made by the script use context.Background(); the script
// engine uses BuildTengoModulesContext so calls inherit the run deadline.
func BuildTengoModules(api CoreAPI, caller CallerInfo, renderCtx interface{}, scriptsDir string, cb *ScriptCallbacks, tsRegistry *cms.ThemeSettingsRegistry) *tengo.ModuleMap {
	return BuildTengoModulesContext(context.Background(), api, caller, renderCtx, scriptsDir, cb, tsRegistry)
}

// BuildTengoModulesContext is BuildTengoModules with a parent context:
// every CoreAPI call the script makes runs under WithCaller(parent, caller),
// so cancelling parent (the script timeout) unblocks them.
func BuildTengoModulesContext(parent context.Context, api CoreAPI, caller CallerInfo, renderCtx interface{}, scriptsDir string, cb *ScriptCallbacks, tsRegistry *cms.ThemeSettingsRegistry) *tengo.ModuleMap {
	modules := tengo.NewModuleMap()
	registerModules(parent, modules, api, caller, renderCtx, scriptsDir, cb, tsRegistry)
	return modules
}

// RegisterModules adds all Squilla core modules to the Tengo module map.
func RegisterModules(modules *tengo.ModuleMap, api CoreAPI, caller CallerInfo, renderCtx interface{}, scriptsDir string, cb *ScriptCallbacks, tsRegistry *cms.ThemeSettingsRegistry) {
	registerModules(context.Background(), modules, api, caller, renderCtx, scriptsDir, cb, tsRegistry)
}

func registerModules(parent context.Context, modules *tengo.ModuleMap, api CoreAPI, caller CallerInfo, renderCtx interface{}, scriptsDir string, cb *ScriptCallbacks, tsRegistry *cms.ThemeSettingsRegistry) {
	if parent == nil {
		parent = context.Background()
	}
	// Use WithCaller to associate the script caller with the context
	ctx := WithCaller(parent, caller)

	// Standard library (explicit allow-list — see allowedStdlibModules)
	for name, mod := range allowedStdlibModules() {
		modules.AddBuiltinModule(name, mod)
	}

	// Squilla Core modules
	modules.AddBuiltinModule("core/nodes", nodesModule(api, ctx))
	modules.AddBuiltinModule("core/menus", menusModule(api, ctx))
	modules.AddBuiltinModule("core/routes", routesModule(cb))
	modules.AddBuiltinModule("core/filters", filtersModule(cb))
	modules.AddBuiltinModule("core/http", httpFetchModule(api, ctx))
	modules.AddBuiltinModule("core/log", logModule(api, ctx, caller))
	modules.AddBuiltinModule("core/nodetypes", nodeTypesModule(api, ctx))
	modules.AddBuiltinModule("core/taxonomies", taxonomiesModule(api, ctx))
	modules.AddBuiltinModule("core/terms", termsModule(api, ctx))
	modules.AddBuiltinModule("core/helpers", helpersModule())
	modules.AddBuiltinModule("core/events", eventsModule(api, ctx, cb))
	modules.AddBuiltinModule("core/settings", settingsModule(api, ctx))
	modules.AddBuiltinModule("core/theme_settings", themeSettingsModule(api, ctx, tsRegistry))
	modules.AddBuiltinModule("core/wellknown", wellKnownModule(cb))
	modules.AddBuiltinModule("core/assets", assetsModule(scriptsDir))

	if renderCtx != nil {
		modules.AddBuiltinModule("core/routing", routingModule(api, ctx, renderCtx))
	} else {
		modules.AddBuiltinModule("core/routing", routingModulePlaceholder())
	}

	// Load any source modules from the scripts directory
	loadSourceModules(modules, scriptsDir)
}

// ---------------------------------------------------------------------------
// Source module loader
// ---------------------------------------------------------------------------

// loadSourceModules recursively scans the scripts directory and adds all .tengo
// files as source modules with "./" prefix paths.
func loadSourceModules(modules *tengo.ModuleMap, scriptsDir string) {
	if scriptsDir == "" {
		return
	}

	filepath.Walk(scriptsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".tengo") {
			return nil
		}

		// Skip entry scripts
		base := filepath.Base(path)
		if (base == "theme.tengo" || base == "extension.tengo") && filepath.Dir(path) == scriptsDir {
			return nil
		}

		relPath, err := filepath.Rel(scriptsDir, path)
		if err != nil {
			return nil
		}

		moduleName := "./" + strings.TrimSuffix(relPath, ".tengo")
		moduleName = strings.ReplaceAll(moduleName, string(filepath.Separator), "/")

		// Walk reports a symlink's own info; resolve it and require a
		// regular file inside the theme/extension root, so a symlinked
		// module can't import a file from outside the package.
		real, err := cms.ConfinedFile(filepath.Dir(scriptsDir), filepath.Join(filepath.Base(scriptsDir), relPath))
		if err != nil {
			log.Printf("[script] WARNING: skipping module %s: %v", path, err)
			return nil
		}
		if st, err := os.Stat(real); err != nil || st.Size() > MaxScriptSourceBytes {
			log.Printf("[script] WARNING: skipping module %s: larger than %d bytes", path, MaxScriptSourceBytes)
			return nil
		}
		src, err := os.ReadFile(real)
		if err != nil {
			return nil
		}

		modules.AddSourceModule(moduleName, src)
		return nil
	})
}
