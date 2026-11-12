package coreapi

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strings"
	"syscall"
	"time"
)

const (
	defaultTimeout  = 30 * time.Second
	maxTimeout      = 120 * time.Second
	maxResponseBody = 10 * 1024 * 1024 // 10 MB
	maxRedirects    = 5
)

// blockedCIDRs are private/internal/special-purpose address ranges that
// the kernel must never speak to via Fetch — letting an extension's URL
// parameter route to localhost or a metadata service is the textbook
// SSRF foothold. They are enforced twice: in validateFetchURL (for a
// friendly error before connecting) and in the dialer's Control hook on
// the address actually being connected to, so DNS rebinding between the
// check and the connect — and redirects — can't slip through.
var blockedCIDRs = []string{
	"0.0.0.0/8",       // "this network"
	"10.0.0.0/8",      // RFC1918
	"100.64.0.0/10",   // CGNAT — often used for internal cluster networks
	"127.0.0.0/8",     // loopback
	"169.254.0.0/16",  // link-local (incl. EC2/GCP/Azure metadata services)
	"172.16.0.0/12",   // RFC1918
	"192.0.0.0/24",    // IETF protocol assignments
	"192.0.2.0/24",    // TEST-NET-1
	"192.88.99.0/24",  // 6to4 relay anycast
	"192.168.0.0/16",  // RFC1918
	"198.18.0.0/15",   // benchmarking
	"198.51.100.0/24", // TEST-NET-2
	"203.0.113.0/24",  // TEST-NET-3
	"224.0.0.0/4",     // multicast
	"240.0.0.0/4",     // reserved, incl. 255.255.255.255 broadcast
	"::/128",          // IPv6 unspecified
	"::1/128",         // IPv6 loopback
	"::ffff:0:0/96",   // IPv4-mapped (checked after unmapping too)
	"64:ff9b::/96",    // NAT64 — would reach any IPv4, incl. private ones
	"64:ff9b:1::/48",  // local-use NAT64
	"100::/64",        // discard-only
	"2001::/23",       // IETF protocol assignments (Teredo, ORCHID…)
	"2001:db8::/32",   // documentation
	"2002::/16",       // 6to4 — embeds an arbitrary IPv4
	"fc00::/7",        // IPv6 unique local
	"fe80::/10",       // IPv6 link-local
	"fec0::/10",       // deprecated site-local
	"ff00::/8",        // IPv6 multicast
}

// blockedPrefixes is parsed once at init so the hot path stays cheap.
var blockedPrefixes = func() []netip.Prefix {
	out := make([]netip.Prefix, 0, len(blockedCIDRs))
	for _, cidr := range blockedCIDRs {
		out = append(out, netip.MustParsePrefix(cidr))
	}
	return out
}()

// IsFetchAddrAllowed reports whether outbound HTTP from the kernel may
// connect to addr: it must be a global unicast address outside every
// private, loopback, link-local, unspecified and special-purpose range
// (IPv4-mapped IPv6 addresses are judged by their IPv4 form). Exported so
// other kernel code that makes outbound requests on behalf of
// extensions or MCP clients applies the same policy.
func IsFetchAddrAllowed(addr netip.Addr) bool {
	if !addr.IsValid() {
		return false
	}
	addr = addr.Unmap()
	if !addr.IsGlobalUnicast() || addr.IsPrivate() || addr.IsLoopback() ||
		addr.IsLinkLocalUnicast() || addr.IsUnspecified() || addr.IsMulticast() {
		return false
	}
	for _, p := range blockedPrefixes {
		if p.Contains(addr) {
			return false
		}
	}
	return true
}

// fetchAddrAllowed is the policy the Fetch dialer and pre-check apply.
// Tests replace it to reach httptest servers on 127.0.0.1; it is
// deliberately not configurable from the environment.
var fetchAddrAllowed = IsFetchAddrAllowed

var errBlockedFetchDestination = errors.New("destination address is not allowed")

// fetchDialControl is the net.Dialer Control hook: it runs after DNS
// resolution, on the exact IP being connected to.
func fetchDialControl(_, address string, _ syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return errBlockedFetchDestination
	}
	ip, err := netip.ParseAddr(host)
	if err != nil || !fetchAddrAllowed(ip) {
		return errBlockedFetchDestination
	}
	return nil
}

// NewSafeTransport returns an http.Transport that refuses to connect to
// any address IsFetchAddrAllowed rejects (checked at dial time, so it
// also covers redirects and DNS rebinding) and ignores HTTP(S)_PROXY —
// a proxy would make the dial check see only the proxy's address.
func NewSafeTransport() *http.Transport {
	dialer := &net.Dialer{
		Timeout:   10 * time.Second,
		KeepAlive: 30 * time.Second,
		Control:   fetchDialControl,
	}
	return &http.Transport{
		Proxy:                 nil,
		DialContext:           dialer.DialContext,
		ForceAttemptHTTP2:     true,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 60 * time.Second,
		MaxIdleConns:          16,
		IdleConnTimeout:       60 * time.Second,
	}
}

// fetchTransport is shared by every Fetch call so connections are reused.
var fetchTransport = NewSafeTransport()

// validateFetchURL parses the URL, enforces a scheme allowlist, and resolves
// the host against the blocked ranges to give a clear error before
// connecting. Called before the initial request and on every redirect.
// It is not the enforcement point — the dialer re-checks the address it
// actually connects to.
func validateFetchURL(rawURL string) error {
	u, err := url.Parse(rawURL)
	if err != nil {
		return NewValidation("invalid URL: " + err.Error())
	}
	scheme := strings.ToLower(u.Scheme)
	if scheme != "http" && scheme != "https" {
		return NewValidation(fmt.Sprintf("scheme %q not allowed (only http and https)", u.Scheme))
	}
	host := u.Hostname()
	if host == "" {
		return NewValidation("URL must include a host")
	}
	if ip, err := netip.ParseAddr(host); err == nil {
		if !fetchAddrAllowed(ip) {
			return NewValidation(fmt.Sprintf("destination %s is a blocked address", host))
		}
		return nil
	}
	// Resolve all IPs the host advertises — a mixed answer is refused
	// outright rather than hoping the dialer picks a public one.
	ips, err := net.LookupIP(host)
	if err != nil {
		return NewValidation("DNS lookup failed: " + err.Error())
	}
	for _, ip := range ips {
		addr, ok := netip.AddrFromSlice(ip)
		if !ok || !fetchAddrAllowed(addr) {
			return NewValidation(fmt.Sprintf("destination %s resolves to blocked address %s", host, ip.String()))
		}
	}
	return nil
}

func (c *coreImpl) Fetch(ctx context.Context, req FetchRequest) (*FetchResponse, error) {
	if req.URL == "" {
		return nil, NewValidation("URL is required")
	}

	if err := validateFetchURL(req.URL); err != nil {
		return nil, err
	}

	method := strings.ToUpper(strings.TrimSpace(req.Method))
	if method == "" {
		method = http.MethodGet
	}

	timeout := defaultTimeout
	if req.Timeout > 0 {
		timeout = time.Duration(req.Timeout) * time.Second
		if timeout > maxTimeout {
			timeout = maxTimeout
		}
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var bodyReader io.Reader
	if req.Body != "" {
		bodyReader = strings.NewReader(req.Body)
	}

	httpReq, err := http.NewRequestWithContext(ctx, method, req.URL, bodyReader)
	if err != nil {
		return nil, NewInternal("failed to create request: " + err.Error())
	}

	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}

	// Bounded-redirect client that re-validates the target on each hop.
	// http.DefaultClient.Do would follow up to 10 redirects through any
	// IP — including back to localhost — without giving us a chance to
	// re-check.
	client := &http.Client{
		Timeout:   timeout,
		Transport: fetchTransport,
		CheckRedirect: func(r *http.Request, via []*http.Request) error {
			if len(via) >= maxRedirects {
				return fmt.Errorf("too many redirects (>%d)", maxRedirects)
			}
			return validateFetchURL(r.URL.String())
		},
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		if errors.Is(err, errBlockedFetchDestination) {
			return nil, NewValidation("fetch refused: destination address is not allowed")
		}
		return nil, NewInternal("fetch failed: " + err.Error())
	}
	defer resp.Body.Close()

	limited := io.LimitReader(resp.Body, maxResponseBody)
	body, err := io.ReadAll(limited)
	if err != nil {
		return nil, NewInternal("failed to read response body: " + err.Error())
	}

	headers := make(map[string]string, len(resp.Header))
	for k := range resp.Header {
		headers[k] = resp.Header.Get(k)
	}

	return &FetchResponse{
		StatusCode: resp.StatusCode,
		Headers:    headers,
		Body:       string(body),
	}, nil
}
