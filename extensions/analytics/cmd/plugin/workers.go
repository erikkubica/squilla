package main

import (
	"context"
	"time"
)

const (
	rollupInterval   = 10 * time.Minute
	maintenanceEvery = time.Minute
)

// startWorkers launches the flush loop and the maintenance loop (rollups,
// purge, in-memory sweeps). Both stop when ctx is cancelled.
func (p *AnalyticsPlugin) startWorkers(ctx context.Context) {
	p.wg.Add(2)
	go func() {
		defer p.wg.Done()
		t := time.NewTicker(flushInterval)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
			case <-p.buf.wake:
			}
			fctx, cancel := context.WithTimeout(ctx, 30*time.Second)
			p.flush(fctx)
			cancel()
		}
	}()
	go func() {
		defer p.wg.Done()
		m := &maintenance{}
		p.runMaintenance(ctx, m, true)
		t := time.NewTicker(maintenanceEvery)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				p.runMaintenance(ctx, m, false)
			}
		}
	}()
}

// maintenance remembers when periodic jobs last ran.
type maintenance struct {
	lastRollup   time.Time
	lastDay      string
	lastPurgeDay string
	lastReload   time.Time
	lastFinalize time.Time
}

const finalizeInterval = 5 * time.Minute

func (p *AnalyticsPlugin) runMaintenance(ctx context.Context, m *maintenance, startup bool) {
	cfg := p.config()
	now := p.now()
	today := dayKey(now, cfg)
	loc := cfg.location()

	// Keep the salt fresh even when no traffic arrives around midnight, so
	// rotation hooks clear yesterday's sessions on time.
	p.salt.current(now, loc)
	p.sessions.sweep(now, cfg.sessionTimeout())
	p.beacons.sweep(now, cfg.sessionTimeout())

	local := now.In(loc)
	sinceMidnight := local.Sub(time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, loc))
	dayChanged := m.lastDay != "" && m.lastDay != today
	if startup || dayChanged || (sinceMidnight < time.Hour && now.Sub(m.lastRollup) >= rollupInterval) {
		// Persist everything buffered first, so yesterday's last events are
		// in the table; keep re-rolling it through the first hour of the new
		// day to pick up late-arriving records.
		p.flush(ctx)
		yesterday := local.AddDate(0, 0, -1).Format("2006-01-02")
		p.rollup(ctx, yesterday, cfg)
	}
	if startup || now.Sub(m.lastRollup) >= rollupInterval || m.lastDay != today {
		p.flush(ctx)
		p.rollup(ctx, today, cfg)
		m.lastRollup = now
	}
	m.lastDay = today

	if startup || now.Sub(m.lastFinalize) >= finalizeInterval {
		p.finalizeVisits(ctx)
		m.lastFinalize = now
	}
	if m.lastPurgeDay != today {
		cutoff := now.AddDate(0, 0, -cfg.RawRetentionDays)
		if rows, err := p.host.DataCall(ctx, "analytics_purge", cutoff.UTC().Format(time.RFC3339Nano)); err != nil {
			p.logf(ctx, "error", "analytics: purge failed: %v", err)
		} else {
			m.lastPurgeDay = today
			if _, err := p.host.DataCall(ctx, "analytics_purge_behaviour", cutoff.UTC().Format(time.RFC3339Nano),
				now.AddDate(-1, -1, 0).UTC().Format(time.RFC3339Nano)); err != nil {
				p.logf(ctx, "error", "analytics: behaviour purge failed: %v", err)
			}
			if len(rows) > 0 && num(rows[0], "deleted") > 0 {
				p.logf(ctx, "info", "analytics: purged %d raw events older than %d days", num(rows[0], "deleted"), cfg.RawRetentionDays)
			}
		}
	}
	if now.Sub(m.lastReload) >= 5*time.Minute {
		p.reloadGoals(ctx)
		p.reloadLinks(ctx)
		m.lastReload = now
	}
}

// rollup rebuilds one local day's rollup rows.
func (p *AnalyticsPlugin) rollup(ctx context.Context, day string, cfg *Config) {
	rctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	if _, err := p.host.DataCall(rctx, "analytics_rollup", day, cfg.Timezone); err != nil {
		p.logf(ctx, "error", "analytics: rollup %s failed: %v", day, err)
	}
}

// rebuildRollups re-aggregates every day still covered by raw events, e.g.
// after the site time zone changed. Runs in the background.
func (p *AnalyticsPlugin) rebuildRollups(cfg *Config) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		end := p.now().In(cfg.location())
		for d := 0; d <= cfg.RawRetentionDays; d++ {
			p.rollup(ctx, end.AddDate(0, 0, -d).Format("2006-01-02"), cfg)
			if ctx.Err() != nil {
				return
			}
		}
	}()
}
