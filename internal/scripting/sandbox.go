package scripting

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"squilla/internal/cms"
	"squilla/internal/coreapi"

	"github.com/d5/tengo/v2"
)

// scriptTimeout bounds one script run (entry or handler). CoreAPI calls
// inherit it through the module context, and runWithDeadline returns on
// expiry even if a builtin is still blocked. A var only so tests can
// shorten it.
var scriptTimeout = 10 * time.Second

// Sandbox limits applied to every Tengo run.
const (
	// scriptMaxAllocs is Tengo's object-allocation counter — it counts
	// objects, not bytes, hence the string/bytes caps below.
	scriptMaxAllocs = 50000

	// maxTengoValueLen caps any single Tengo string or bytes value, so a
	// doubling loop fails long before it can exhaust memory.
	maxTengoValueLen = 4 << 20

	// maxRouteBodyLen caps the request body handed to script HTTP routes.
	maxRouteBodyLen = 1 << 20
)

func init() {
	tengo.MaxStringLen = maxTengoValueLen
	tengo.MaxBytesLen = maxTengoValueLen
}

// readScriptSource reads scriptsDir/rel, refusing anything larger than
// coreapi.MaxScriptSourceBytes. The file must resolve — after following
// symlinks — to a regular file inside the theme/extension root that owns
// scriptsDir, so a symlink shipped in a package can't pull in a script
// from elsewhere on the host.
func readScriptSource(scriptsDir, rel string) ([]byte, error) {
	path, err := cms.ConfinedFile(filepath.Dir(scriptsDir), filepath.Join(filepath.Base(scriptsDir), rel))
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if info.Size() > coreapi.MaxScriptSourceBytes {
		return nil, fmt.Errorf("%s is larger than %d bytes", filepath.Base(path), coreapi.MaxScriptSourceBytes)
	}
	return os.ReadFile(path)
}

// normalizeScriptPath strips a leading "./" and rejects any path that
// would resolve outside the scripts directory (absolute, "..", empty).
func normalizeScriptPath(scriptPath string) (string, error) {
	scriptPath = strings.TrimPrefix(scriptPath, "./")
	if scriptPath == "" || !filepath.IsLocal(scriptPath) {
		return "", fmt.Errorf("invalid script path %q: must be relative to the scripts directory", scriptPath)
	}
	return scriptPath, nil
}

// runWithDeadline compiles and runs script, returning when it finishes or
// when ctx is done — whichever comes first. Tengo's own RunContext aborts
// the VM on ctx.Done() but then waits for it, which never happens while a
// Go builtin is blocked; here the caller is released and the VM goroutine
// finishes on its own once the builtin returns (CoreAPI builtins get the
// same ctx, so they unblock promptly).
func runWithDeadline(ctx context.Context, script *tengo.Script) (*tengo.Compiled, error) {
	compiled, err := script.Compile()
	if err != nil {
		return nil, err
	}
	done := make(chan error, 1)
	go func() { done <- compiled.RunContext(ctx) }()
	select {
	case err := <-done:
		if err != nil {
			return nil, err
		}
		return compiled, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}
