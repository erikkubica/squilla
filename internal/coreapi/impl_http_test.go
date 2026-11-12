package coreapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"strings"
	"testing"
)

// allowOnlyLoopback4 lets tests reach an httptest server on 127.0.0.1
// while every other address keeps the real policy.
func allowOnlyLoopback4(t *testing.T) {
	t.Helper()
	prev := fetchAddrAllowed
	fetchAddrAllowed = func(a netip.Addr) bool {
		return a.Unmap() == netip.MustParseAddr("127.0.0.1") || IsFetchAddrAllowed(a)
	}
	t.Cleanup(func() { fetchAddrAllowed = prev })
}

func TestIsFetchAddrAllowed(t *testing.T) {
	blocked := []string{
		"::", "0.0.0.0", "127.0.0.1", "::1", "10.1.2.3", "172.16.0.1", "192.168.1.1",
		"169.254.169.254", "100.64.0.1", "198.18.0.1", "198.19.255.255", "192.0.0.170",
		"224.0.0.1", "239.255.255.250", "255.255.255.255", "ff02::1", "fe80::1", "fd00::1",
		"64:ff9b::a9fe:a9fe", "64:ff9b::7f00:1", "::ffff:127.0.0.1", "::ffff:169.254.169.254",
		"2002:7f00:1::", "2001:db8::1",
	}
	for _, s := range blocked {
		if IsFetchAddrAllowed(netip.MustParseAddr(s)) {
			t.Errorf("%s should be blocked", s)
		}
	}
	for _, s := range []string{"93.184.216.34", "8.8.8.8", "2606:4700:4700::1111", "::ffff:8.8.8.8"} {
		if !IsFetchAddrAllowed(netip.MustParseAddr(s)) {
			t.Errorf("%s should be allowed", s)
		}
	}
}

func TestValidateFetchURLBlocksUnspecifiedIPv6(t *testing.T) {
	for _, u := range []string{"http://[::]/", "http://[::]:8080/x", "http://0.0.0.0/", "http://[64:ff9b::a9fe:a9fe]/"} {
		if err := validateFetchURL(u); err == nil {
			t.Errorf("%s was allowed", u)
		}
	}
}

// The pre-check is bypassed here on purpose: the dialer must refuse a
// private address on its own, because a rebinding resolver can answer
// differently at connect time than it did during validation.
func TestFetchTransportBlocksPrivateAddressAtDialTime(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("internal secret"))
	}))
	defer srv.Close()

	// "localhost" resolves to a loopback address only at dial time.
	target := strings.Replace(srv.URL, "127.0.0.1", "localhost", 1)
	client := &http.Client{Transport: NewSafeTransport()}
	resp, err := client.Get(target)
	if err == nil {
		resp.Body.Close()
		t.Fatal("dial to loopback succeeded")
	}
	if !strings.Contains(err.Error(), errBlockedFetchDestination.Error()) {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestFetchIgnoresProxyEnv(t *testing.T) {
	if NewSafeTransport().Proxy != nil {
		t.Fatal("safe transport must not use a proxy")
	}
}

func TestFetchBlocksRedirectToLoopbackOrMetadata(t *testing.T) {
	allowOnlyLoopback4(t)
	for _, loc := range []string{"http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://localhost6/"} {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, loc, http.StatusFound)
		}))
		_, err := (&coreImpl{}).Fetch(context.Background(), FetchRequest{URL: srv.URL, Timeout: 5})
		srv.Close()
		if err == nil {
			t.Errorf("redirect to %s was followed", loc)
		}
	}
}

func TestFetchReachesAllowedServer(t *testing.T) {
	allowOnlyLoopback4(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	}))
	defer srv.Close()
	resp, err := (&coreImpl{}).Fetch(context.Background(), FetchRequest{URL: srv.URL, Timeout: 5})
	if err != nil {
		t.Fatal(err)
	}
	if resp.Body != "ok" {
		t.Errorf("body = %q", resp.Body)
	}
}
