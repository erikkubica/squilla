package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/netip"
	"strings"
	"sync"
	"time"
)

// saltKeeper holds the daily visitor-hash salt. The salt lives only in
// memory and is replaced at site-timezone midnight, so yesterday's hashes
// can never be recomputed — not even from a database backup.
type saltKeeper struct {
	mu        sync.Mutex
	salt      []byte
	day       string
	rotatesAt time.Time
	onRotate  []func()
}

func newSaltKeeper() *saltKeeper { return &saltKeeper{} }

// current returns the salt valid at now in loc, rotating it when the local
// day changed (or when none exists yet).
func (s *saltKeeper) current(now time.Time, loc *time.Location) []byte {
	local := now.In(loc)
	day := local.Format("2006-01-02")
	s.mu.Lock()
	if s.salt != nil && s.day == day {
		salt := s.salt
		s.mu.Unlock()
		return salt
	}
	rotated := s.salt != nil
	salt := make([]byte, 32)
	_, _ = rand.Read(salt)
	s.salt, s.day = salt, day
	y, m, d := local.Date()
	s.rotatesAt = time.Date(y, m, d+1, 0, 0, 0, 0, loc)
	hooks := append([]func(){}, s.onRotate...)
	s.mu.Unlock()
	if rotated {
		for _, f := range hooks {
			f()
		}
	}
	return salt
}

// nextRotation reports when the current salt expires (zero before first use).
func (s *saltKeeper) nextRotation() time.Time {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.rotatesAt
}

// reset drops the salt (e.g. after a time-zone change) so the next call
// generates a fresh one.
func (s *saltKeeper) reset() {
	s.mu.Lock()
	s.salt, s.day = nil, ""
	s.mu.Unlock()
}

// normalizeIP keeps IPv4 addresses as-is and reduces IPv6 addresses to
// their /64 prefix (privacy-extension addresses rotate within a /64).
func normalizeIP(ip string) string {
	ip = strings.TrimSpace(ip)
	addr, err := netip.ParseAddr(ip)
	if err != nil {
		return ip
	}
	addr = addr.Unmap()
	if addr.Is4() {
		return addr.String()
	}
	prefix, err := addr.Prefix(64)
	if err != nil {
		return addr.String()
	}
	return prefix.String()
}

// visitorHash = first 16 hex chars of sha256(salt ‖ host ‖ ip/64 ‖ ua ‖ lang).
func visitorHash(salt []byte, host, ip, ua, lang string) string {
	h := sha256.New()
	h.Write(salt)
	for _, part := range []string{normalizeHost(host), normalizeIP(ip), ua, lang} {
		h.Write([]byte{0})
		h.Write([]byte(part))
	}
	return hex.EncodeToString(h.Sum(nil))[:16]
}

// primaryLanguage extracts the primary subtag of the first Accept-Language
// entry ("en-GB,en;q=0.9" → "en"); "" when absent or "*".
func primaryLanguage(acceptLanguage string) string {
	first := acceptLanguage
	if i := strings.IndexByte(first, ','); i >= 0 {
		first = first[:i]
	}
	if i := strings.IndexByte(first, ';'); i >= 0 {
		first = first[:i]
	}
	first = strings.ToLower(strings.TrimSpace(first))
	if i := strings.IndexAny(first, "-_"); i >= 0 {
		first = first[:i]
	}
	if first == "*" || len(first) < 2 || len(first) > 3 {
		return ""
	}
	for _, r := range first {
		if r < 'a' || r > 'z' {
			return ""
		}
	}
	return first
}

// visitorID returns the visitor hash for c, or "" for GPC visitors when
// the respect_gpc setting is on.
func (p *AnalyticsPlugin) visitorID(c *client, now time.Time, cfg *Config) string {
	if c.GPC && cfg.RespectGPC {
		return ""
	}
	salt := p.salt.current(now, cfg.location())
	return visitorHash(salt, c.Host, c.IP, c.UA, c.Language)
}

// newClient derives the visitor context from request fields.
func (p *AnalyticsPlugin) newClient(host, ip, ua, acceptLanguage, gpc, country, chMobile, chPlatform string) *client {
	c := &client{
		Host: normalizeHost(host), IP: ip, UA: ua, AcceptLanguage: acceptLanguage,
		Language: primaryLanguage(acceptLanguage),
		GPC:      strings.TrimSpace(gpc) == "1",
		Country:  normalizeCountry(country),
	}
	c.Browser, c.OS, c.Device = parseUA(ua, chMobile, chPlatform)
	return c
}

// normalizeCountry accepts ISO 3166-1 alpha-2 codes; Cloudflare's XX
// (unknown) and T1 (Tor) become "".
func normalizeCountry(cc string) string {
	cc = strings.ToUpper(strings.TrimSpace(cc))
	if len(cc) != 2 || cc == "XX" || cc == "T1" {
		return ""
	}
	if cc[0] < 'A' || cc[0] > 'Z' || cc[1] < 'A' || cc[1] > 'Z' {
		return ""
	}
	return cc
}
