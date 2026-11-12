package cms

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"squilla/internal/events"
	pb "squilla/pkg/plugin/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func TestPluginChildEnv_AllowListOnly(t *testing.T) {
	t.Setenv("DB_PASSWORD", "hunter2")
	t.Setenv("SQUILLA_SECRET_KEY", "k")
	t.Setenv("SESSION_SECRET", "s")
	t.Setenv("TZ", "UTC")
	t.Setenv("MY_PROXY", "http://proxy")
	t.Setenv(pluginEnvExtraVar, "MY_PROXY")
	env := strings.Join(pluginChildEnv(), "\n")
	for _, secret := range []string{"DB_PASSWORD", "SQUILLA_SECRET_KEY", "SESSION_SECRET"} {
		if strings.Contains(env, secret+"=") {
			t.Fatalf("plugin env leaks %s:\n%s", secret, env)
		}
	}
	if !strings.Contains(env, "TZ=UTC") || !strings.Contains(env, "MY_PROXY=http://proxy") {
		t.Fatalf("allow-listed / operator-extra vars missing:\n%s", env)
	}
}

// TestSpawnPluginProcess_RealPlugin builds a tiny plugin and starts it
// through StartPlugins: it must not see the host's secrets, and its
// broker call back into the host must work with AutoMTLS on.
func TestSpawnPluginProcess_RealPlugin(t *testing.T) {
	if testing.Short() {
		t.Skip("builds a plugin binary")
	}
	if _, err := exec.LookPath("go"); err != nil {
		t.Skip("go toolchain not available")
	}
	extDir := t.TempDir()
	bin := filepath.Join(extDir, "bin", "envplugin")
	build := exec.Command("go", "build", "-o", bin, "./testdata/envplugin")
	if out, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build test plugin: %v\n%s", err, out)
	}

	t.Setenv("DB_PASSWORD", "hunter2")
	t.Setenv("SQUILLA_SECRET_KEY", "k")

	registrar := HostServerRegistrar(func(string, map[string]bool, map[string]bool, map[string]bool) func(*grpc.Server) {
		return func(s *grpc.Server) { healthpb.RegisterHealthServer(s, health.NewServer()) }
	})
	pm := NewPluginManager(events.New(), registrar, nil)
	defer pm.StopAll()
	manifest := json.RawMessage(`{"plugins":[{"binary":"bin/envplugin"}]}`)
	if err := pm.StartPlugins(extDir, "envtest", manifest, map[string]bool{}, nil); err != nil {
		t.Fatal(err)
	}
	client := pm.GetClient("envtest")
	if client == nil {
		t.Fatal("plugin did not start (AutoMTLS / SkipHostEnv handshake failed?)")
	}
	resp, err := client.HandleHTTPRequest(&pb.PluginHTTPRequest{Method: "GET", Path: "/"})
	if err != nil {
		t.Fatal(err)
	}
	var got struct {
		Env    []string `json:"env"`
		HostOK bool     `json:"host_ok"`
	}
	if err := json.Unmarshal(resp.Body, &got); err != nil {
		t.Fatal(err)
	}
	env := strings.Join(got.Env, "\n")
	if strings.Contains(env, "DB_PASSWORD=") || strings.Contains(env, "SQUILLA_SECRET_KEY=") {
		t.Fatalf("plugin inherited host secrets:\n%s", env)
	}
	if !strings.Contains(env, "PLUGIN_CLIENT_CERT=") {
		t.Fatal("AutoMTLS not negotiated (no PLUGIN_CLIENT_CERT in child env)")
	}
	if !got.HostOK {
		t.Fatal("plugin could not call back into the host over the mTLS broker")
	}
	if os.Getenv("DB_PASSWORD") != "hunter2" {
		t.Fatal("host env must be untouched")
	}
}
