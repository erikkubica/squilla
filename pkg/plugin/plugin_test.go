package plugin

import (
	"context"
	"testing"
	"time"

	pb "squilla/pkg/plugin/proto"

	"google.golang.org/grpc"
)

// deadlineRecorder is a fake ExtensionPluginClient that records whether
// each call carried a deadline, and how far away it was.
type deadlineRecorder struct {
	pb.ExtensionPluginClient
	got map[string]time.Duration
}

func (d *deadlineRecorder) record(name string, ctx context.Context) {
	if dl, ok := ctx.Deadline(); ok {
		d.got[name] = time.Until(dl)
	} else {
		d.got[name] = -1
	}
}

func (d *deadlineRecorder) GetSubscriptions(ctx context.Context, _ *pb.Empty, _ ...grpc.CallOption) (*pb.SubscriptionList, error) {
	d.record("GetSubscriptions", ctx)
	return &pb.SubscriptionList{}, nil
}

func (d *deadlineRecorder) Shutdown(ctx context.Context, _ *pb.Empty, _ ...grpc.CallOption) (*pb.Empty, error) {
	d.record("Shutdown", ctx)
	return &pb.Empty{}, nil
}

func (d *deadlineRecorder) HandleHTTPRequest(ctx context.Context, _ *pb.PluginHTTPRequest, _ ...grpc.CallOption) (*pb.PluginHTTPResponse, error) {
	d.record("HandleHTTPRequest", ctx)
	return &pb.PluginHTTPResponse{}, nil
}

// TestGRPCClient_CallsHaveDeadlines guards against context.Background()
// RPCs: a hung plugin used to pin the caller (and the plugin manager's
// lock) forever.
func TestGRPCClient_CallsHaveDeadlines(t *testing.T) {
	rec := &deadlineRecorder{got: map[string]time.Duration{}}
	c := &GRPCClient{client: rec}
	_, _ = c.GetSubscriptions()
	_ = c.Shutdown()
	_, _ = c.HandleHTTPRequest(&pb.PluginHTTPRequest{})
	for name, max := range map[string]time.Duration{
		"GetSubscriptions":  lifecycleCallTimeout,
		"Shutdown":          lifecycleCallTimeout,
		"HandleHTTPRequest": HTTPCallTimeout,
	} {
		d, ok := rec.got[name]
		if !ok || d <= 0 || d > max {
			t.Fatalf("%s deadline = %v, want (0, %v]", name, d, max)
		}
	}

	// A caller-supplied deadline is kept, not extended.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	_, _ = c.HandleHTTPRequestCtx(ctx, &pb.PluginHTTPRequest{})
	if d := rec.got["HandleHTTPRequest"]; d <= 0 || d > time.Second {
		t.Fatalf("caller deadline not honoured: %v", d)
	}
}
