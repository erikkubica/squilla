package httpobs

import (
	"fmt"
	"net"
	"strings"
	"sync/atomic"

	"github.com/gofiber/fiber/v2"
)

// ipConfig is the resolved trusted-proxy configuration. Swapped
// atomically so ClientIP stays lock-free on the request path.
type ipConfig struct {
	trusted []*net.IPNet
	header  string // canonical header name; "" disables proxy handling
	xff     bool   // header is X-Forwarded-For (walk right-to-left)
}

var clientIPConfig atomic.Pointer[ipConfig]

// ConfigureClientIP installs the trusted-proxy list (CIDRs or bare IPs)
// and the header trusted proxies use to carry the client address.
// Called once at boot from main.go with TRUSTED_PROXIES /
// CLIENT_IP_HEADER. Until it is called, ClientIP returns the peer
// address.
func ConfigureClientIP(trustedProxies []string, header string) error {
	cfg := &ipConfig{header: strings.TrimSpace(header)}
	cfg.xff = strings.EqualFold(cfg.header, fiber.HeaderXForwardedFor)
	for _, entry := range trustedProxies {
		n, err := parseNet(entry)
		if err != nil {
			return err
		}
		cfg.trusted = append(cfg.trusted, n)
	}
	clientIPConfig.Store(cfg)
	return nil
}

// ClientIPHeader returns the configured client-IP header ("" when proxy
// handling is disabled).
func ClientIPHeader() string {
	if cfg := clientIPConfig.Load(); cfg != nil {
		return cfg.header
	}
	return ""
}

// peerTrusted reports whether the TCP peer is a configured trusted
// proxy, i.e. whether proxy-supplied headers may be believed at all.
func peerTrusted(c *fiber.Ctx) bool {
	cfg := clientIPConfig.Load()
	return cfg != nil && cfg.header != "" && cfg.isTrusted(c.Context().RemoteIP())
}

func parseNet(entry string) (*net.IPNet, error) {
	entry = strings.TrimSpace(entry)
	if strings.Contains(entry, "/") {
		_, n, err := net.ParseCIDR(entry)
		if err != nil {
			return nil, fmt.Errorf("invalid trusted proxy %q: %w", entry, err)
		}
		return n, nil
	}
	ip := net.ParseIP(entry)
	if ip == nil {
		return nil, fmt.Errorf("invalid trusted proxy %q", entry)
	}
	bits := 128
	if ip4 := ip.To4(); ip4 != nil {
		ip, bits = ip4, 32
	}
	return &net.IPNet{IP: ip, Mask: net.CIDRMask(bits, bits)}, nil
}

func (cfg *ipConfig) isTrusted(ip net.IP) bool {
	for _, n := range cfg.trusted {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// ClientIP returns the best-known client address for the request.
//
// When the TCP peer is a trusted proxy and a client-IP header is
// configured, the header is consulted: X-Forwarded-For is walked
// right-to-left skipping trusted proxies (the leftmost entries are
// client-controlled and must never be believed blindly — that is what
// Fiber's c.IP() does); single-value headers such as CF-Connecting-IP
// are taken as-is when valid. Otherwise the peer address is returned.
//
// Use this instead of c.IP() for anything security-relevant (rate
// limits, session/audit IPs, forwarded headers to plugins).
func ClientIP(c *fiber.Ctx) string {
	peer := c.Context().RemoteIP()
	cfg := clientIPConfig.Load()
	if cfg == nil || cfg.header == "" || !cfg.isTrusted(peer) {
		return peer.String()
	}
	// A proxy may append its own header line instead of extending the
	// client's (HAProxy's "option forwardfor" does), so consider every
	// line: Peek/c.Get would return only the first, client-controlled one.
	lines := c.Request().Header.PeekAll(cfg.header)
	if len(lines) == 0 {
		return peer.String()
	}
	if !cfg.xff {
		// Single-value header: the last line is the one closest to us.
		if ip := parseHop(string(lines[len(lines)-1])); ip != nil {
			return ip.String()
		}
		return peer.String()
	}
	parts := make([]string, len(lines))
	for i, l := range lines {
		parts[i] = string(l)
	}
	return cfg.walkXFF(strings.Join(parts, ","), peer).String()
}

// walkXFF returns the rightmost hop that is not a trusted proxy. An
// unparseable hop stops the walk: everything left of it is untrusted
// garbage, so the last valid hop seen is the best answer. When every
// hop is trusted, the leftmost one is the client.
func (cfg *ipConfig) walkXFF(raw string, peer net.IP) net.IP {
	best := peer
	hops := strings.Split(raw, ",")
	for i := len(hops) - 1; i >= 0; i-- {
		ip := parseHop(hops[i])
		if ip == nil {
			return best
		}
		best = ip
		if !cfg.isTrusted(ip) {
			return ip
		}
	}
	return best
}

// parseHop parses one header entry, tolerating "ip:port" and "[v6]:port".
func parseHop(s string) net.IP {
	s = strings.TrimSpace(s)
	if ip := net.ParseIP(s); ip != nil {
		return ip
	}
	if host, _, err := net.SplitHostPort(s); err == nil {
		return net.ParseIP(host)
	}
	return nil
}
