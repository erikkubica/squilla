package main

import (
	"context"
	"time"

	"squilla/internal/coreapi"
)

const (
	rulesTable  = "redirects_rules"
	configTable = "redirects_config"

	// maxRules bounds the in-memory index. Far above any real site; an
	// install that needs more wants pattern rules, not more rows.
	maxRules = 50000

	configAutoCreate = "auto_create"
)

// reloadRules rebuilds the matching index from the database.
func (p *Plugin) reloadRules(ctx context.Context) error {
	res, err := p.host.DataQuery(ctx, rulesTable, coreapi.DataStoreQuery{OrderBy: "id DESC", Limit: maxRules})
	if err != nil {
		return err
	}
	rules := make([]Rule, 0, len(res.Rows))
	for _, r := range res.Rows {
		rules = append(rules, ruleFromRow(r))
	}
	p.rules.Store(buildRuleSet(rules))
	return nil
}

func (p *Plugin) findRule(id int64) (Rule, bool) {
	for _, r := range p.rules.Load().all {
		if r.ID == id {
			return r, true
		}
	}
	return Rule{}, false
}

// createRule and updateRule write one row; callers hold writeMu and reload.
func (p *Plugin) createRule(ctx context.Context, r *Rule) error {
	_, err := p.host.DataCreate(ctx, rulesTable, r.row())
	return err
}

func (p *Plugin) updateRule(ctx context.Context, id int64, cols map[string]any) error {
	cols["updated_at"] = p.now().UTC().Format(time.RFC3339)
	return p.host.DataUpdate(ctx, rulesTable, uint(id), cols)
}

func (p *Plugin) loadConfig(ctx context.Context) {
	res, err := p.host.DataQuery(ctx, configTable, coreapi.DataStoreQuery{Where: map[string]any{"key": configAutoCreate}, Limit: 1})
	if err != nil || res == nil || len(res.Rows) == 0 {
		return // default: on
	}
	p.autoCreate.Store(str(res.Rows[0], "value") != "false")
}

func (p *Plugin) saveAutoCreate(ctx context.Context, on bool) error {
	value := "true"
	if !on {
		value = "false"
	}
	res, err := p.host.DataQuery(ctx, configTable, coreapi.DataStoreQuery{Where: map[string]any{"key": configAutoCreate}, Limit: 1})
	if err != nil {
		return err
	}
	if len(res.Rows) > 0 {
		err = p.host.DataUpdate(ctx, configTable, uint(num(res.Rows[0], "id")), map[string]any{"value": value})
	} else {
		_, err = p.host.DataCreate(ctx, configTable, map[string]any{"key": configAutoCreate, "value": value})
	}
	if err == nil {
		p.autoCreate.Store(on)
	}
	return err
}
