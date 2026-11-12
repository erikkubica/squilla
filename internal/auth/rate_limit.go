package auth

import (
	"sync"
	"time"

	"squilla/internal/api"
	"squilla/internal/httpobs"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/time/rate"
)

// PerIPLimiter throttles requests per source IP. Each IP gets its own
// rate.Limiter so a flood from one client can't starve everyone else.
// Process-local — fine for single-instance deploys; multi-instance
// deploys need a Redis-backed limiter (out of scope here).
type PerIPLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	limit    rate.Limit
	burst    int

	// lastSeen tracks when each IP was last active, so the cleanup loop
	// can drop entries for IPs that haven't hit the endpoint in a while.
	// Without this, the map grows linearly with unique attackers.
	lastSeen map[string]time.Time

	maxEntries int
}

// defaultMaxLimiterEntries bounds the per-IP map (IPv6 makes address
// rotation cheap).
const defaultMaxLimiterEntries = 100000

// NewPerIPLimiter constructs a limiter at reqPerInterval / interval rate,
// allowing a short burst. For example NewPerIPLimiter(5, time.Minute, 5)
// = 5 req/min sustained, up to 5 in a burst.
func NewPerIPLimiter(reqPerInterval int, interval time.Duration, burst int) *PerIPLimiter {
	return &PerIPLimiter{
		limiters: make(map[string]*rate.Limiter),
		lastSeen: make(map[string]time.Time),
		limit:    rate.Limit(float64(reqPerInterval) / interval.Seconds()),
		burst:    burst,

		maxEntries: defaultMaxLimiterEntries,
	}
}

// Allow returns true if the IP is under its budget; false if it should
// be throttled.
func (p *PerIPLimiter) Allow(ip string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	lim, ok := p.limiters[ip]
	if !ok {
		if len(p.limiters) >= p.maxEntries {
			p.makeRoomLocked()
		}
		lim = rate.NewLimiter(p.limit, p.burst)
		p.limiters[ip] = lim
	}
	p.lastSeen[ip] = time.Now()
	return lim.Allow()
}

// CleanIdle removes limiter entries for IPs that haven't been seen for
// the given duration. Call periodically (e.g. hourly) to bound memory.
func (p *PerIPLimiter) CleanIdle(maxAge time.Duration) {
	cutoff := time.Now().Add(-maxAge)
	p.mu.Lock()
	defer p.mu.Unlock()
	p.cleanBeforeLocked(cutoff)
}

func (p *PerIPLimiter) cleanBeforeLocked(cutoff time.Time) {
	for ip, ts := range p.lastSeen {
		if ts.Before(cutoff) {
			delete(p.limiters, ip)
			delete(p.lastSeen, ip)
		}
	}
}

// refillDuration is how long an idle limiter takes to refill its burst —
// dropping it after that is lossless (a fresh limiter is identical).
func (p *PerIPLimiter) refillDuration() time.Duration {
	if p.limit <= 0 {
		return time.Hour
	}
	return time.Duration(float64(p.burst) / float64(p.limit) * float64(time.Second))
}

// CleanRefilled drops entries idle long enough to have fully refilled.
func (p *PerIPLimiter) CleanRefilled() {
	p.CleanIdle(p.refillDuration())
}

// makeRoomLocked runs when the map is full: drop refilled entries, then
// the least recently seen ~10%.
func (p *PerIPLimiter) makeRoomLocked() {
	p.cleanBeforeLocked(time.Now().Add(-p.refillDuration()))
	if len(p.limiters) < p.maxEntries {
		return
	}
	target := p.maxEntries - p.maxEntries/10
	for len(p.limiters) > target {
		var oldestIP string
		var oldest time.Time
		n := 0
		for ip, ts := range p.lastSeen { // sample, not full scan
			if oldestIP == "" || ts.Before(oldest) {
				oldestIP, oldest = ip, ts
			}
			n++
			if n >= 64 {
				break
			}
		}
		delete(p.limiters, oldestIP)
		delete(p.lastSeen, oldestIP)
	}
}

// Len returns the number of tracked IPs (diagnostics/tests).
func (p *PerIPLimiter) Len() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return len(p.limiters)
}

// Middleware returns a Fiber handler that consults this limiter and
// rejects with 429 when the budget is exhausted. Keys on
// httpobs.ClientIP(c) — the forwarding header is honoured only when the
// TCP peer is in TRUSTED_PROXIES (X-Forwarded-For walked right-to-left);
// otherwise the peer address is used.
func (p *PerIPLimiter) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !p.Allow(httpobs.ClientIP(c)) {
			return api.Error(c, fiber.StatusTooManyRequests, "RATE_LIMITED", "Too many requests — please try again in a minute")
		}
		return c.Next()
	}
}
