package mcp

import (
	"sync"

	"golang.org/x/time/rate"
)

// perTokenLimiter hands out a rate.Limiter per token ID (60 req/min, burst 10).
// AI agents fan out aggressively; without this, one runaway loop can starve the DB.
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
