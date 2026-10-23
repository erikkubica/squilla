package main

import (
	"strings"
	"time"
)

// Record mirrors the kernel's http.requests record (internal/httpobs).
type Record struct {
	TS          time.Time         `json:"ts"`
	Method      string            `json:"method"`
	Host        string            `json:"host"`
	Path        string            `json:"path"`
	Query       string            `json:"query"`
	Status      int               `json:"status"`
	DurationMS  int64             `json:"duration_ms"`
	ContentType string            `json:"content_type"`
	Bytes       int64             `json:"bytes"`
	IP          string            `json:"ip"`
	UserAgent   string            `json:"user_agent"`
	Referer     string            `json:"referer"`
	Headers     map[string]string `json:"headers"`
	HasSession  bool              `json:"has_session"`
	UserID      int64             `json:"user_id"`
	NodeID      int64             `json:"node_id"`
	NodeType    string            `json:"node_type"`
	Language    string            `json:"language"`
	RequestID   string            `json:"request_id"`
}

// batchPayload is the http.requests event payload. Dropped counts records
// the kernel dropped since the previous batch.
type batchPayload struct {
	Records []Record `json:"records"`
	Dropped uint64   `json:"dropped"`
}

// header returns a lower-case-keyed allowlisted header.
func (r *Record) header(name string) string {
	if r.Headers == nil {
		return ""
	}
	return r.Headers[name]
}

// Event is one analytics_events row as sent to analytics_ingest.
type Event struct {
	TS           time.Time `json:"ts"`
	EID          string    `json:"eid"`
	Kind         string    `json:"kind"`
	Host         string    `json:"host"`
	Path         string    `json:"path"`
	PageType     string    `json:"page_type"`
	NodeID       int64     `json:"node_id"`
	VisitorID    string    `json:"visitor_id"`
	SessionID    string    `json:"session_id"`
	Entry        bool      `json:"entry"`
	Referrer     string    `json:"referrer"`
	Source       string    `json:"source"`
	Channel      string    `json:"channel"`
	UTMSource    string    `json:"utm_source"`
	UTMMedium    string    `json:"utm_medium"`
	UTMCampaign  string    `json:"utm_campaign"`
	UTMContent   string    `json:"utm_content"`
	UTMTerm      string    `json:"utm_term"`
	ClickGclid   bool      `json:"click_gclid"`
	ClickMsclkid bool      `json:"click_msclkid"`
	ClickFbclid  bool      `json:"click_fbclid"`
	ClickTtclid  bool      `json:"click_ttclid"`
	Country      string    `json:"country"`
	Language     string    `json:"language"`
	Device       string    `json:"device"`
	Browser      string    `json:"browser"`
	OS           string    `json:"os"`
	Target       string    `json:"target"`
	GoalID       int64     `json:"goal_id"`
	IsPrefetch   bool      `json:"is_prefetch"`
	Confirmed    bool      `json:"confirmed"`
	Viewport     string    `json:"viewport"`
	ColorScheme  string    `json:"color_scheme"`
	Printed      bool      `json:"printed"`
}

// Event kinds.
const (
	kindPageview = "pageview"
	kindNotFound = "not_found"
	kindDownload = "download"
	kindOutbound = "outbound"
	kindGoal     = "goal"
)

// attribution is the acquisition context of a visit. It is captured on
// the entry pageview and copied onto every event of the session.
type attribution struct {
	Referrer, Source, Channel                              string
	UTMSource, UTMMedium, UTMCampaign, UTMContent, UTMTerm string
	Gclid, Msclkid, Fbclid, Ttclid                         bool
}

func (a attribution) apply(e *Event) {
	e.Referrer, e.Source, e.Channel = a.Referrer, a.Source, a.Channel
	e.UTMSource, e.UTMMedium, e.UTMCampaign = a.UTMSource, a.UTMMedium, a.UTMCampaign
	e.UTMContent, e.UTMTerm = a.UTMContent, a.UTMTerm
	e.ClickGclid, e.ClickMsclkid, e.ClickFbclid, e.ClickTtclid = a.Gclid, a.Msclkid, a.Fbclid, a.Ttclid
}

// client is the per-request visitor context shared by the ingest pipeline
// and the public /go and /_s handlers.
type client struct {
	Host, IP, UA, AcceptLanguage string
	Language                     string // primary subtag, lower-case
	GPC                          bool
	Country                      string
	Browser, OS, Device          string
}

// normalizeHost lower-cases and strips a port and a leading "www.".
func normalizeHost(h string) string {
	h = strings.ToLower(strings.TrimSpace(h))
	if i := strings.LastIndexByte(h, ':'); i >= 0 && !strings.Contains(h[i:], "]") {
		h = h[:i]
	}
	return strings.TrimPrefix(h, "www.")
}
