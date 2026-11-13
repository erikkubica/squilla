// Command plugin is the redirects extension: admin-defined 301/302/307/308
// redirects (and 410 Gone) for any public URL. It sees public requests
// through a passthrough public route ("/*") mounted right before the page
// router, answers the ones a rule matches and declines the rest.
package main

import (
	"context"
	"encoding/json"
	"sync"
	"sync/atomic"
	"time"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"

	"squilla/internal/coreapi"
	vibeplugin "squilla/pkg/plugin"
	coreapipb "squilla/pkg/plugin/coreapipb"
	pb "squilla/pkg/plugin/proto"
)

// hostAPI is the slice of CoreAPI the plugin uses. Keeping it narrow lets
// tests use a small in-memory fake.
type hostAPI interface {
	DataGet(ctx context.Context, table string, id uint) (map[string]any, error)
	DataQuery(ctx context.Context, table string, query coreapi.DataStoreQuery) (*coreapi.DataStoreResult, error)
	DataCreate(ctx context.Context, table string, data map[string]any) (map[string]any, error)
	DataUpdate(ctx context.Context, table string, id uint, data map[string]any) error
	DataDelete(ctx context.Context, table string, id uint) error
	GetNode(ctx context.Context, id uint) (*coreapi.Node, error)
	QueryNodes(ctx context.Context, query coreapi.NodeQuery) (*coreapi.NodeList, error)
	Log(ctx context.Context, level, message string, fields map[string]any) error
}

// Plugin holds the in-memory rule set every public request is matched
// against. The database is only touched by admin edits, the hit flusher
// and node events — never on the request path.
type Plugin struct {
	host hostAPI
	now  func() time.Time

	rules atomic.Pointer[ruleSet]
	// writeMu serialises rule mutations (admin edits, imports, auto rules)
	// so two writers can't interleave a read-check-write on the same source.
	writeMu sync.Mutex

	autoCreate atomic.Bool
	hits       hitCounter
	nodeURLs   nodeURLTracker

	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func newPlugin(h hostAPI) *Plugin {
	p := &Plugin{host: h, now: time.Now}
	p.rules.Store(buildRuleSet(nil))
	p.autoCreate.Store(true)
	p.hits.pending = map[int64]*hitEntry{}
	p.nodeURLs.urls = map[uint]string{}
	return p
}

func (p *Plugin) Initialize(hostConn *grpc.ClientConn) error {
	p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	ctx, cancel := context.WithCancel(context.Background())
	p.cancel = cancel
	p.loadConfig(ctx)
	if err := p.reloadRules(ctx); err != nil {
		p.logf(ctx, "error", "loading redirect rules failed: %v", err)
	}
	p.startWorkers(ctx)
	return nil
}

// startWorkers runs the hit flusher, a slow safety reload (covers rows
// changed behind the plugin's back, e.g. a restored backup) and the
// one-off node URL seed.
func (p *Plugin) startWorkers(ctx context.Context) {
	p.wg.Add(2)
	go func() {
		defer p.wg.Done()
		flush := time.NewTicker(30 * time.Second)
		reload := time.NewTicker(5 * time.Minute)
		defer flush.Stop()
		defer reload.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-flush.C:
				p.flushHits(ctx)
			case <-reload.C:
				_ = p.reloadRules(ctx)
			}
		}
	}()
	go func() {
		defer p.wg.Done()
		p.seedNodeURLs(ctx)
	}()
}

// Shutdown stops the workers and writes buffered hit counts.
func (p *Plugin) Shutdown() error {
	if p.cancel != nil {
		p.cancel()
	}
	done := make(chan struct{})
	go func() { p.wg.Wait(); close(done) }()
	select {
	case <-done:
	case <-time.After(time.Second):
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	p.flushHits(ctx)
	return nil
}

func (p *Plugin) GetSubscriptions() ([]*pb.Subscription, error) {
	return []*pb.Subscription{
		{EventName: "node.created", Priority: 50},
		{EventName: "node.updated", Priority: 50},
		{EventName: "node.published", Priority: 50},
		{EventName: "node.deleted", Priority: 50},
	}, nil
}

func (p *Plugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	var ev nodeEvent
	if err := json.Unmarshal(payload, &ev); err != nil {
		return &pb.EventResponse{Handled: false, Error: err.Error()}, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	switch action {
	case "node.deleted":
		p.nodeURLs.forget(ev.NodeID)
	case "node.created", "node.updated", "node.published":
		p.handleNodeChanged(ctx, ev)
	default:
		return &pb.EventResponse{Handled: false}, nil
	}
	return &pb.EventResponse{Handled: true}, nil
}

func (p *Plugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	// Admin requests come through the authenticated proxy and always carry
	// the signed-in user's id; public requests carry 0. That — not the
	// path — decides which side a request is on, so a visitor asking for
	// /rules on the public site can never reach the admin API.
	if req.GetUserId() == 0 {
		return p.handlePublic(req), nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	return p.routeAdmin(ctx, req), nil
}

func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		Plugins: map[string]goplugin.Plugin{
			"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: newPlugin(nil)},
		},
		GRPCServer: vibeplugin.NewGRPCServer,
	})
}
