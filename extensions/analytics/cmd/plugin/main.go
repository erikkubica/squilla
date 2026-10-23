// Command plugin is the analytics extension: cookieless, server-side web
// analytics built from the kernel's http.requests observer stream. See
// extensions/analytics/README.md for what is measured and how.
package main

import (
	"context"
	"encoding/json"
	"sync"
	"sync/atomic"
	"time"
	// Embedded zone database: the Alpine runtime ships no tzdata, and the
	// site timezone setting must resolve zones like Asia/Ho_Chi_Minh.
	_ "time/tzdata"

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
	DataCall(ctx context.Context, fn string, args ...any) ([]map[string]any, error)
	DataQuery(ctx context.Context, table string, query coreapi.DataStoreQuery) (*coreapi.DataStoreResult, error)
	DataCreate(ctx context.Context, table string, data map[string]any) (map[string]any, error)
	DataUpdate(ctx context.Context, table string, id uint, data map[string]any) error
	DataDelete(ctx context.Context, table string, id uint) error
	Log(ctx context.Context, level, message string, fields map[string]any) error
}

// AnalyticsPlugin holds all in-memory state. Nothing that could identify a
// visitor (salt, IPs) is ever persisted.
type AnalyticsPlugin struct {
	host hostAPI
	now  func() time.Time

	cfg      atomic.Pointer[Config]
	salt     *saltKeeper
	sessions *sessionStore
	rate     *rateTracker
	beacons  *beaconTracker
	buf      *pipelineBuffer
	goals    atomic.Pointer[[]Goal]
	links    atomic.Pointer[map[string]Link]

	lastRecordAt atomic.Int64 // unix nanos of the newest observed record
	droppedTotal atomic.Uint64
	sawSecFetch  atomic.Bool // the site is reached over HTTPS by real browsers
	cfTrusted    atomic.Bool // the kernel forwards cf-ipcountry (Cloudflare mode)

	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// newAnalyticsPlugin wires a plugin around a host without starting workers.
func newAnalyticsPlugin(h hostAPI) *AnalyticsPlugin {
	p := &AnalyticsPlugin{}
	p.setup(h)
	return p
}

// setup (re)initialises every in-memory structure around host h.
func (p *AnalyticsPlugin) setup(h hostAPI) {
	p.host = h
	p.now = time.Now
	cfg := defaultConfig()
	p.cfg.Store(&cfg)
	p.salt = newSaltKeeper()
	p.sessions = newSessionStore()
	p.rate = newRateTracker()
	p.beacons = newBeaconTracker()
	// A new salt means new visitor ids: in-memory state keyed by the old
	// ids is useless and is dropped.
	p.salt.onRotate = []func(){p.sessions.reset, p.rate.reset, p.beacons.reset}
	p.buf = newPipelineBuffer()
	empty := []Goal{}
	p.goals.Store(&empty)
	noLinks := map[string]Link{}
	p.links.Store(&noLinks)
}

func (p *AnalyticsPlugin) config() *Config { return p.cfg.Load() }

func (p *AnalyticsPlugin) Initialize(hostConn *grpc.ClientConn) error {
	h := coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	p.setup(h)
	ctx, cancel := context.WithCancel(context.Background())
	p.cancel = cancel
	p.loadConfig(ctx)
	p.reloadGoals(ctx)
	p.reloadLinks(ctx)
	p.startWorkers(ctx)
	return nil
}

// Shutdown stops the workers and flushes buffered events within 3s.
func (p *AnalyticsPlugin) Shutdown() error {
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
	p.flush(ctx)
	return nil
}

func (p *AnalyticsPlugin) GetSubscriptions() ([]*pb.Subscription, error) {
	return []*pb.Subscription{
		{EventName: eventHTTPRequests, Priority: 0},
		{EventName: "render.head", Priority: 0},
		{EventName: "render.body_end", Priority: 0},
	}, nil
}

const eventHTTPRequests = "http.requests"

func (p *AnalyticsPlugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	switch action {
	case eventHTTPRequests:
		var batch batchPayload
		if err := json.Unmarshal(payload, &batch); err != nil {
			return &pb.EventResponse{Handled: false, Error: err.Error()}, nil
		}
		p.ingestBatch(batch)
		return &pb.EventResponse{Handled: true}, nil
	case "render.head", "render.body_end":
		html := p.renderHook(action, payload)
		if html == "" {
			return &pb.EventResponse{Handled: false}, nil
		}
		return &pb.EventResponse{Handled: true, Result: []byte(html)}, nil
	}
	return &pb.EventResponse{Handled: false}, nil
}

func (p *AnalyticsPlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	return p.routeRequest(ctx, req), nil
}

func main() {
	p := newAnalyticsPlugin(nil)
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		Plugins: map[string]goplugin.Plugin{
			"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: p},
		},
		GRPCServer: vibeplugin.NewGRPCServer,
	})
}
