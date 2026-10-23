package main

import (
	"sync"
	"time"
)

// session is an in-memory visit. Sessions are never stored as rows; the
// session id is written on each event instead.
type session struct {
	ID        string
	Started   time.Time
	Last      time.Time
	Pageviews int
	Attr      attribution
	Country   string
}

type sessionStore struct {
	mu sync.Mutex
	m  map[string]*session
}

func newSessionStore() *sessionStore { return &sessionStore{m: map[string]*session{}} }

// pageview records a counted pageview for visitor at ts. It starts a new
// session (entry=true) when none exists or the previous one idled longer
// than timeout; attr is only used for new sessions.
func (s *sessionStore) pageview(visitor string, ts time.Time, timeout time.Duration, attr attribution, country string) (sess session, entry bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	cur, ok := s.m[visitor]
	if !ok || ts.Sub(cur.Last) > timeout {
		cur = &session{ID: randomHex(8), Started: ts, Last: ts, Pageviews: 1, Attr: attr, Country: country}
		s.m[visitor] = cur
		return *cur, true
	}
	if ts.After(cur.Last) {
		cur.Last = ts
	}
	cur.Pageviews++
	return *cur, false
}

// lookup returns the visitor's live session without modifying it.
func (s *sessionStore) lookup(visitor string, ts time.Time, timeout time.Duration) (session, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	cur, ok := s.m[visitor]
	if !ok || ts.Sub(cur.Last) > timeout {
		return session{}, false
	}
	return *cur, true
}

// sweep drops sessions idle for longer than timeout.
func (s *sessionStore) sweep(now time.Time, timeout time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for k, v := range s.m {
		if now.Sub(v.Last) > timeout {
			delete(s.m, k)
		}
	}
}

func (s *sessionStore) reset() {
	s.mu.Lock()
	s.m = map[string]*session{}
	s.mu.Unlock()
}

func (s *sessionStore) size() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.m)
}

// rateTracker flags visitors exceeding maxPageviewsPerMinute; flagged
// visitors are treated as bots for the rest of the (salt) day.
type rateTracker struct {
	mu      sync.Mutex
	minute  int64
	counts  map[string]int
	flagged map[string]bool
}

const maxPageviewsPerMinute = 60

func newRateTracker() *rateTracker {
	return &rateTracker{counts: map[string]int{}, flagged: map[string]bool{}}
}

// hit counts one pageview and reports whether the visitor is (now) flagged.
func (r *rateTracker) hit(visitor string, ts time.Time) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.flagged[visitor] {
		return true
	}
	minute := ts.Unix() / 60
	if minute != r.minute {
		r.minute = minute
		r.counts = map[string]int{}
	}
	r.counts[visitor]++
	if r.counts[visitor] > maxPageviewsPerMinute {
		r.flagged[visitor] = true
		return true
	}
	return false
}

func (r *rateTracker) isFlagged(visitor string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.flagged[visitor]
}

func (r *rateTracker) reset() {
	r.mu.Lock()
	r.counts, r.flagged = map[string]int{}, map[string]bool{}
	r.mu.Unlock()
}
