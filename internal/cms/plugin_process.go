package cms

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	vibeplugin "squilla/pkg/plugin"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"
)

// pluginEnvAllowlist is the host environment a plugin process inherits.
// Everything else — DB_PASSWORD / DATABASE_URL, SESSION_SECRET,
// SQUILLA_SECRET_KEY, provider API keys — stays in the kernel. go-plugin
// adds its own handshake variables (magic cookie, protocol versions,
// mTLS client cert) on top. Bundled plugins read only GOMEMLIMIT
// (analytics) and STORAGE_DIR (media-manager) directly.
var pluginEnvAllowlist = []string{
	"PATH", "HOME", "USER", "TZ", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR",
	"SSL_CERT_FILE", "SSL_CERT_DIR",
	"GOMEMLIMIT", "GOGC", "GOMAXPROCS", "GODEBUG",
	"STORAGE_DIR",
}

// pluginEnvExtraVar names a comma-separated list of additional host
// variables an operator wants passed to plugin processes (e.g. a
// third-party plugin's HTTPS_PROXY).
const pluginEnvExtraVar = "SQUILLA_PLUGIN_ENV"

// pluginChildEnv builds the environment for a plugin process from the
// allow-list (plus SQUILLA_PLUGIN_ENV extras) — never os.Environ().
func pluginChildEnv() []string {
	names := append([]string(nil), pluginEnvAllowlist...)
	for _, n := range strings.Split(os.Getenv(pluginEnvExtraVar), ",") {
		if n = strings.TrimSpace(n); n != "" {
			names = append(names, n)
		}
	}
	seen := make(map[string]bool, len(names))
	env := make([]string, 0, len(names))
	for _, n := range names {
		if seen[n] {
			continue
		}
		seen[n] = true
		if v, ok := os.LookupEnv(n); ok {
			env = append(env, n+"="+v)
		}
	}
	return env
}

// pluginMaxGRPCMessageSize raises the default 4 MB call message-size limit
// so HandleHTTPRequest can carry multi-megabyte uploads (mp4, large images,
// zipped extension payloads). Mirrors the plugin side (pkg/plugin).
const pluginMaxGRPCMessageSize = 256 * 1024 * 1024

// spawnPluginProcess starts a plugin binary over gRPC and dispenses its
// ExtensionPlugin implementation.
//
//   - SkipHostEnv + an explicit allow-listed Env: the child does not
//     inherit the kernel's secrets.
//   - AutoMTLS: the host and plugin negotiate a one-off mutual-TLS cert
//     pair, so another local process can't connect to the plugin's
//     listener (or the host broker) and speak to it.
//
// A gRPC extension is still native code running as the app user; these
// settings narrow what it inherits, they are not a sandbox.
func spawnPluginProcess(binaryPath string) (*goplugin.Client, vibeplugin.ExtensionPlugin, error) {
	cmd := exec.Command(binaryPath)
	cmd.Env = pluginChildEnv()
	client := goplugin.NewClient(&goplugin.ClientConfig{
		HandshakeConfig: vibeplugin.Handshake,
		VersionedPlugins: map[int]goplugin.PluginSet{
			2: vibeplugin.PluginMap,
		},
		Cmd:              cmd,
		SkipHostEnv:      true,
		AutoMTLS:         true,
		AllowedProtocols: []goplugin.Protocol{goplugin.ProtocolGRPC},
		GRPCDialOptions: []grpc.DialOption{
			grpc.WithDefaultCallOptions(
				grpc.MaxCallRecvMsgSize(pluginMaxGRPCMessageSize),
				grpc.MaxCallSendMsgSize(pluginMaxGRPCMessageSize),
			),
		},
	})

	rpcClient, err := client.Client()
	if err != nil {
		client.Kill()
		return nil, nil, err
	}
	raw, err := rpcClient.Dispense("extension")
	if err != nil {
		client.Kill()
		return nil, nil, fmt.Errorf("dispense: %w", err)
	}
	impl, ok := raw.(vibeplugin.ExtensionPlugin)
	if !ok {
		client.Kill()
		return nil, nil, fmt.Errorf("plugin does not implement ExtensionPlugin")
	}
	return client, impl, nil
}
