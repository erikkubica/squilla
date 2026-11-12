package auth

import (
	"context"
	"time"
)

// IdleCleaner is implemented by every handler that owns in-memory rate
// limiters or lockout trackers.
type IdleCleaner interface {
	CleanIdle()
}

// StartJanitor prunes idle limiter / lockout entries on every cleaner at
// the given interval until ctx is cancelled. Without it those maps only
// ever grow — an unauthenticated memory-exhaustion vector.
func StartJanitor(ctx context.Context, interval time.Duration, cleaners ...IdleCleaner) {
	if interval <= 0 {
		interval = 5 * time.Minute
	}
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				for _, c := range cleaners {
					if c != nil {
						c.CleanIdle()
					}
				}
			}
		}
	}()
}
