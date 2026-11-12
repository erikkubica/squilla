// Command envplugin is a test-only Squilla plugin used by
// plugin_process_test.go. It reports its own environment and whether its
// broker call back into the host succeeded, so the test can verify the
// real go-plugin wiring (SkipHostEnv + AutoMTLS) end to end.
package main

import (
	"context"
	"encoding/json"
	"os"
	"time"

	vibeplugin "squilla/pkg/plugin"
	pb "squilla/pkg/plugin/proto"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type envPlugin struct{ hostOK bool }

func (p *envPlugin) GetSubscriptions() ([]*pb.Subscription, error) { return nil, nil }
func (p *envPlugin) HandleEvent(string, []byte) (*pb.EventResponse, error) {
	return &pb.EventResponse{}, nil
}
func (p *envPlugin) HandleHTTPRequest(*pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	body, _ := json.Marshal(map[string]any{"env": os.Environ(), "host_ok": p.hostOK})
	return &pb.PluginHTTPResponse{StatusCode: 200, Body: body}, nil
}
func (p *envPlugin) Shutdown() error { return nil }
func (p *envPlugin) Initialize(conn *grpc.ClientConn) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	resp, err := healthpb.NewHealthClient(conn).Check(ctx, &healthpb.HealthCheckRequest{})
	p.hostOK = err == nil && resp.GetStatus() == healthpb.HealthCheckResponse_SERVING
	return nil
}

func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		VersionedPlugins: map[int]goplugin.PluginSet{
			2: {"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &envPlugin{}}},
		},
		GRPCServer: vibeplugin.NewGRPCServer,
	})
}
