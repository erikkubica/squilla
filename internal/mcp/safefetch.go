package mcp

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

	"squilla/internal/coreapi"
)

// importFetchTimeout bounds a whole core.media.import_url download.
const importFetchTimeout = 60 * time.Second

// importMaxRedirects mirrors coreapi.Fetch's redirect budget.
const importMaxRedirects = 5

var errBlockedDestination = errors.New("destination address is not allowed")

// importAddrAllowed reports whether the importer may connect to addr. It
// is the kernel's outbound-HTTP policy (coreapi.IsFetchAddrAllowed), held
// in a package variable only so tests can point the importer at an
// httptest server on loopback.
var importAddrAllowed = coreapi.IsFetchAddrAllowed

// newImportClient returns an HTTP client for core.media.import_url built
// on coreapi.NewSafeTransport (no proxy, private / link-local / special
// ranges refused at dial time — so DNS rebinding and redirects are
// covered) with the importer's own whole-request timeout and redirect cap.
// The dialer is re-created here only so the check consults
// importAddrAllowed (the test hook); the policy itself is coreapi's.
func newImportClient() *http.Client {
	dialer := &net.Dialer{
		Timeout: 10 * time.Second,
		Control: func(network, address string, _ syscall.RawConn) error {
			host, _, err := net.SplitHostPort(address)
			if err != nil {
				return errBlockedDestination
			}
			ip, err := netip.ParseAddr(host)
			if err != nil || !importAddrAllowed(ip) {
				return errBlockedDestination
			}
			return nil
		},
	}
	transport := coreapi.NewSafeTransport()
	transport.DialContext = dialer.DialContext
	return &http.Client{
		Timeout:   importFetchTimeout,
		Transport: transport,
		CheckRedirect: func(r *http.Request, via []*http.Request) error {
			if len(via) >= importMaxRedirects {
				return fmt.Errorf("too many redirects (>%d)", importMaxRedirects)
			}
			return checkImportURL(r.URL)
		},
	}
}

// checkImportURL enforces the scheme allow-list and requires a host.
func checkImportURL(u *url.URL) error {
	switch strings.ToLower(u.Scheme) {
	case "http", "https":
	default:
		return fmt.Errorf("scheme %q not allowed (only http and https)", u.Scheme)
	}
	if u.Hostname() == "" {
		return fmt.Errorf("URL must include a host")
	}
	return nil
}

// fetchForImport downloads src with the SSRF-safe client and reads at most
// maxBytes. Returns the body and the response Content-Type.
func fetchForImport(ctx context.Context, src string, maxBytes int64) ([]byte, string, error) {
	u, err := url.Parse(src)
	if err != nil {
		return nil, "", fmt.Errorf("invalid url")
	}
	if err := checkImportURL(u); err != nil {
		return nil, "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, "", fmt.Errorf("invalid url")
	}
	req.Header.Set("User-Agent", "Squilla-MCP/1.0")
	resp, err := newImportClient().Do(req)
	if err != nil {
		if errors.Is(err, errBlockedDestination) {
			return nil, "", fmt.Errorf("fetch refused: %s resolves to a private, loopback or link-local address", u.Hostname())
		}
		// Do not echo the transport error (it carries resolved addresses
		// and ports — a port-scan oracle).
		return nil, "", fmt.Errorf("fetch failed for host %s", u.Hostname())
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, "", fmt.Errorf("fetch returned status %d", resp.StatusCode)
	}
	if resp.ContentLength > maxBytes {
		return nil, "", fmt.Errorf("remote file is %d bytes; limit is %d", resp.ContentLength, maxBytes)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxBytes+1))
	if err != nil {
		return nil, "", fmt.Errorf("read body from %s failed", u.Hostname())
	}
	if int64(len(body)) > maxBytes {
		return nil, "", fmt.Errorf("remote file exceeds the %d byte limit", maxBytes)
	}
	return body, resp.Header.Get("Content-Type"), nil
}
