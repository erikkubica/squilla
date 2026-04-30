package mcp

import (
	"os"
	"strconv"
	"sync"

	"golang.org/x/time/rate"
)

// envIntDefault reads a positive integer from the given env var or returns
// the default. Used to make hot-path knobs (rate limit, burst) operator-tunable
// without a code change. Non-positive / unparseable values fall back to the
// default — fail-safe rather than fail-open.
func envIntDefault(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return def
}

// perTokenLimiter hands out a rate.Limiter per token ID. Defaults to
// 600 req/min, burst 60 — generous enough that AI agents can fan out
// aggressively without tripping the limiter on bursty workloads (image
// import loops, bulk seeds). Override via SQUILLA_MCP_RPM /
// SQUILLA_MCP_BURST. The DB is not the bottleneck on a healthy node;
// limiting to single-digit RPS just slows authoring without protecting
// anything.
type perTokenLimiter struct {
	mu       sync.Mutex
	limiters map[int]*rate.Limiter
	rps      rate.Limit
	burst    int
}

func newPerTokenLimiter(reqPerMinute int, burst int) *perTokenLimiter {
	return &perTokenLimiter{
		limiters: make(map[int]*rate.Limiter),
		rps:      rate.Limit(float64(reqPerMinute) / 60.0),
		burst:    burst,
	}
}

func (p *perTokenLimiter) allow(tokenID int) bool {
	p.mu.Lock()
	lim, ok := p.limiters[tokenID]
	if !ok {
		lim = rate.NewLimiter(p.rps, p.burst)
		p.limiters[tokenID] = lim
	}
	p.mu.Unlock()
	return lim.Allow()
}
