package main

import (
	"html"
	"strings"

	pb "squilla/pkg/plugin/proto"
)

// optOutCookie is the cookie that switches measurement off for a browser.
// It is declared in the manifest (observe_cookies / public_route_cookies),
// which is how the kernel lets it reach this plugin.
const optOutCookie = "analytics_optout"

const optOutMaxAge = "31536000" // one year

// cookieValue extracts one cookie from a Cookie header.
func cookieValue(header, name string) string {
	for _, part := range strings.Split(header, ";") {
		k, v, ok := strings.Cut(strings.TrimSpace(part), "=")
		if ok && k == name {
			return v
		}
	}
	return ""
}

// handleOptOut serves GET/POST <prefix>/optout: a plain, script-free page
// with one button that sets or clears the opt-out cookie.
func (p *AnalyticsPlugin) handleOptOut(req *pb.PluginHTTPRequest) *pb.PluginHTTPResponse {
	h := headerGetter(req.GetHeaders())
	optedOut := cookieValue(h("cookie"), optOutCookie) != ""
	page := p.config().BeaconPrefix + "/optout"
	if strings.EqualFold(req.GetMethod(), "POST") {
		if strings.EqualFold(h("sec-fetch-site"), "cross-site") {
			return &pb.PluginHTTPResponse{StatusCode: 403, Headers: map[string]string{"Content-Type": "text/plain; charset=utf-8"}, Body: []byte("Forbidden")}
		}
		cookie := optOutCookie + "=1; Path=/; Max-Age=" + optOutMaxAge + "; SameSite=Lax; HttpOnly; Secure"
		if strings.Contains(string(req.GetBody()), "action=optin") {
			cookie = optOutCookie + "=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure"
		}
		return &pb.PluginHTTPResponse{StatusCode: 303, Headers: map[string]string{
			"Location": page, "Set-Cookie": cookie, "Cache-Control": "no-store",
		}}
	}
	status, action, button := "Visit statistics are being measured on this site.", "optout", "Stop measuring my visits"
	if optedOut {
		status, action, button = "You opted out. Your visits are not measured on this site.", "optin", "Measure my visits again"
	}
	body := `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
		`<meta name="robots" content="noindex"><title>Statistics opt-out</title>` +
		`<style>body{font:16px/1.5 system-ui,sans-serif;max-width:34rem;margin:12vh auto;padding:0 1rem;color:#222}` +
		`button{font:inherit;padding:.6rem 1.1rem;border-radius:.5rem;border:1px solid #888;cursor:pointer}</style></head><body>` +
		`<h1>Statistics opt-out</h1><p>` + html.EscapeString(status) + `</p>` +
		`<p>This site counts visits without cookies and without storing your IP address. ` +
		`Choosing to stop measuring stores one small cookie in this browser so we remember your choice.</p>` +
		`<form method="post" action="` + html.EscapeString(page) + `"><input type="hidden" name="action" value="` + action + `">` +
		`<button type="submit">` + html.EscapeString(button) + `</button></form></body></html>`
	return &pb.PluginHTTPResponse{StatusCode: 200, Headers: map[string]string{
		"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex",
	}, Body: []byte(body)}
}
