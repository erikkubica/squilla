package main

import (
	"context"
	"encoding/json"
	"strings"
	"time"
)

// Exit reasons, in classification order (first match wins). They are
// heuristics; the dashboard documents them.
const (
	exitConverted     = "converted"
	exitToContact     = "left_to_contact"
	exitToPartner     = "left_to_partner"
	exitHitError      = "hit_error"
	exitQuick         = "quick_exit"
	exitReadAndLeft   = "read_and_left"
	exitSkimmed       = "skimmed"
	exitBrowsed       = "browsed_and_left"
	exitSinglePage    = "single_page" // 1 page, no in-page signals to say more
	flagExitAmbiguous = "exit_ambiguous"
)

// sessionFacts is one analytics_session_facts row.
type sessionFacts struct {
	SessionID      string          `json:"session_id"`
	Day            string          `json:"day"`
	StartedAt      time.Time       `json:"started_at"`
	EndedAt        time.Time       `json:"ended_at"`
	Pages          int             `json:"pages"`
	EntryPath      string          `json:"entry_path"`
	ExitPath       string          `json:"exit_path"`
	Paths          json.RawMessage `json:"paths"`
	Channel        string          `json:"channel"`
	Source         string          `json:"source"`
	Device         string          `json:"device"`
	Country        string          `json:"country"`
	Converted      bool            `json:"converted"`
	S1             bool            `json:"s1"`
	ErrorAfterLast bool            `json:"error_after_last_view"`
	OutAfterLast   bool            `json:"out_after_last_view"`
	OutDest        string          `json:"out_dest"`
	SpecAfterLast  bool            `json:"spec_after_last_view"`
	DurationS      int             `json:"duration_s"`
	DwellS         int             `json:"dwell_s"`
	Reach          int             `json:"reach"`
	EndReached     bool            `json:"end_reached"`
	Clicks         int             `json:"clicks"`
	ClickDest      string          `json:"click_dest"`
	ClickClass     string          `json:"click_class"`
}

// visitRow is the analytics_upsert_visits payload.
type visitRow struct {
	SessionID  string          `json:"session_id"`
	Day        string          `json:"day"`
	StartedAt  time.Time       `json:"started_at"`
	EndedAt    time.Time       `json:"ended_at"`
	EntryPath  string          `json:"entry_path"`
	ExitPath   string          `json:"exit_path"`
	Paths      json.RawMessage `json:"paths"`
	Pageviews  int             `json:"pageviews"`
	DurationS  int             `json:"duration_s"`
	Channel    string          `json:"channel"`
	Source     string          `json:"source"`
	Device     string          `json:"device"`
	Country    string          `json:"country"`
	Converted  bool            `json:"converted"`
	Outbound   string          `json:"outbound"`
	ExitReason string          `json:"exit_reason"`
	ExitDwellS int             `json:"exit_dwell_s"`
	Reach      int             `json:"reach"`
	EndReached bool            `json:"end_reached"`
	Clicks     int             `json:"clicks"`
	Flags      string          `json:"flags"`
}

// contactHosts are destinations people leave to in order to talk to us.
var contactHosts = []string{"wa.me", "api.whatsapp.com", "whatsapp.com", "zalo.me", "m.me", "messenger.com", "t.me", "line.me"}

func isContactDest(dest string) bool {
	d := strings.ToLower(dest)
	for _, h := range contactHosts {
		if d == h || strings.HasPrefix(d, h+"/") {
			return true
		}
	}
	return strings.HasPrefix(d, "tel:") || strings.HasPrefix(d, "mailto:")
}

// classifyExit returns the exit reason and flags for one finished session.
func classifyExit(f sessionFacts) (reason string, flags []string) {
	if f.SpecAfterLast && !f.S1 {
		// The last page may have been shown from a prerender no request
		// revealed; the previous page is not necessarily where they left.
		flags = append(flags, flagExitAmbiguous)
	}
	leftOut := f.OutAfterLast || f.ClickClass == "x" || f.ClickClass == "c"
	dest := f.OutDest
	if dest == "" {
		dest = f.ClickDest
	}
	switch {
	case f.Converted:
		return exitConverted, flags
	case leftOut && (f.ClickClass == "c" || isContactDest(dest)):
		return exitToContact, flags
	case leftOut:
		return exitToPartner, flags
	case f.ErrorAfterLast:
		return exitHitError, flags
	case f.Pages >= 2:
		return exitBrowsed, flags
	case !f.S1:
		return exitSinglePage, flags
	case f.EndReached || f.DwellS >= 60:
		return exitReadAndLeft, flags
	case f.DwellS >= 10:
		return exitSkimmed, flags
	}
	return exitQuick, flags
}

func visitFromFacts(f sessionFacts) visitRow {
	reason, flags := classifyExit(f)
	out := f.OutDest
	if out == "" {
		out = f.ClickDest
	}
	return visitRow{
		SessionID: f.SessionID, Day: f.Day, StartedAt: f.StartedAt, EndedAt: f.EndedAt,
		EntryPath: f.EntryPath, ExitPath: f.ExitPath, Paths: f.Paths, Pageviews: f.Pages, DurationS: f.DurationS,
		Channel: f.Channel, Source: f.Source, Device: f.Device, Country: f.Country, Converted: f.Converted,
		Outbound: out, ExitReason: reason, ExitDwellS: f.DwellS, Reach: f.Reach, EndReached: f.EndReached,
		Clicks: f.Clicks, Flags: strings.Join(flags, ","),
	}
}

// finalizeVisits turns sessions idle for longer than the session timeout
// (plus a flush margin) into analytics_visits rows. It reads only durable
// rows, so it is idempotent and restart-safe.
func (p *AnalyticsPlugin) finalizeVisits(ctx context.Context) {
	cfg := p.config()
	cutoff := p.now().Add(-cfg.sessionTimeout() - time.Minute)
	for round := 0; round < 20; round++ {
		rows, err := p.host.DataCall(ctx, "analytics_session_facts", cutoff.UTC().Format(time.RFC3339Nano), cfg.Timezone, 500)
		if err != nil {
			p.logf(ctx, "error", "analytics: session facts failed: %v", err)
			return
		}
		if len(rows) == 0 {
			return
		}
		visits := make([]visitRow, 0, len(rows))
		for _, r := range rows {
			var f sessionFacts
			raw, _ := json.Marshal(r["facts"])
			if s, ok := r["facts"].(string); ok {
				raw = []byte(s)
			}
			if err := json.Unmarshal(raw, &f); err != nil || f.SessionID == "" {
				continue
			}
			visits = append(visits, visitFromFacts(f))
		}
		if len(visits) == 0 {
			return
		}
		if _, err := p.host.DataCall(ctx, "analytics_upsert_visits", visits); err != nil {
			p.logf(ctx, "error", "analytics: visit upsert failed: %v", err)
			return
		}
		if len(rows) < 500 {
			return
		}
	}
}
