package main

import (
	"context"
	"strings"
	"sync"

	"squilla/internal/coreapi"
)

// nodeEvent is the part of node.* payloads the plugin reads.
type nodeEvent struct {
	NodeID  uint   `json:"node_id"`
	FullURL string `json:"full_url"`
}

// nodeURLTracker remembers each node's last known URL. Node events carry
// only the new URL, so the previous one has to come from here.
type nodeURLTracker struct {
	mu   sync.Mutex
	urls map[uint]string
}

// swap stores url for id and returns the previous value.
func (t *nodeURLTracker) swap(id uint, url string) (prev string, known bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	prev, known = t.urls[id]
	t.urls[id] = url
	return prev, known
}

func (t *nodeURLTracker) setIfUnknown(id uint, url string) {
	t.mu.Lock()
	if _, ok := t.urls[id]; !ok {
		t.urls[id] = url
	}
	t.mu.Unlock()
}

func (t *nodeURLTracker) forget(id uint) {
	t.mu.Lock()
	delete(t.urls, id)
	t.mu.Unlock()
}

// seedNodeURLs records the current URL of every node at startup so the
// first rename after a restart still knows what the old URL was.
func (p *Plugin) seedNodeURLs(ctx context.Context) {
	const page = 200
	for offset := 0; offset < 100000; offset += page {
		if ctx.Err() != nil {
			return
		}
		list, err := p.host.QueryNodes(ctx, coreapi.NodeQuery{Limit: page, Offset: offset, OrderBy: "id ASC"})
		if err != nil || list == nil {
			if err != nil && ctx.Err() == nil {
				p.logf(ctx, "warn", "seeding node URLs failed, automatic redirects start with the next edit of each page: %v", err)
			}
			return
		}
		for _, n := range list.Nodes {
			if n != nil && n.FullURL != "" {
				p.nodeURLs.setIfUnknown(n.ID, n.FullURL)
			}
		}
		if len(list.Nodes) < page {
			return
		}
	}
}

// handleNodeChanged creates a 301 from a published node's previous URL to
// its new one.
func (p *Plugin) handleNodeChanged(ctx context.Context, ev nodeEvent) {
	if ev.NodeID == 0 {
		return
	}
	newURL := ev.FullURL
	var node *coreapi.Node
	if newURL == "" {
		n, err := p.host.GetNode(ctx, ev.NodeID)
		if err != nil || n == nil {
			return
		}
		node, newURL = n, n.FullURL
	}
	if newURL == "" {
		return
	}
	prev, known := p.nodeURLs.swap(ev.NodeID, newURL)
	if !known || prev == "" || sameURL(prev, newURL) || !p.autoCreate.Load() {
		return
	}
	if node == nil {
		n, err := p.host.GetNode(ctx, ev.NodeID)
		if err != nil || n == nil {
			return
		}
		node = n
	}
	// Drafts were never public: nobody can have linked the old URL.
	if node.Status != "published" {
		return
	}
	if err := p.addAutoRedirect(ctx, prev, newURL, int64(ev.NodeID)); err != nil {
		p.logf(ctx, "error", "automatic redirect %s -> %s failed: %v", prev, newURL, err)
	}
}

func sameURL(a, b string) bool {
	return strings.EqualFold(normalizePath(a), normalizePath(b))
}

// isPlainExact reports whether r is an exact rule for precisely path.
func isPlainExact(r Rule, path string) bool {
	return r.MatchType == matchExact && !strings.Contains(r.Source, "?") && sameURL(r.Source, path)
}

// addAutoRedirect records oldURL -> newURL and keeps earlier automatic
// rules coherent: nothing may redirect away from the URL the page now
// lives at, and rules that pointed at the old URL jump straight to the new
// one instead of chaining.
func (p *Plugin) addAutoRedirect(ctx context.Context, oldURL, newURL string, nodeID int64) error {
	p.writeMu.Lock()
	defer p.writeMu.Unlock()
	defer func() { _ = p.reloadRules(ctx) }()

	haveOld := false
	for _, r := range p.rules.Load().all {
		switch {
		case isPlainExact(r, newURL):
			if r.Origin == originAuto {
				// Page moved back (A -> B -> A): the old rule would loop.
				if err := p.host.DataDelete(ctx, rulesTable, uint(r.ID)); err != nil {
					return err
				}
			} else {
				p.logf(ctx, "warn", "redirect #%d (%s) now shadows the page that moved to that URL", r.ID, r.Source)
			}
		case isPlainExact(r, oldURL):
			haveOld = true
			// An editor's own rule for that URL wins; ours is retargeted.
			if r.Origin == originAuto {
				if err := p.updateRule(ctx, r.ID, map[string]any{"target": newURL, "node_id": nodeID, "enabled": true}); err != nil {
					return err
				}
			}
		case r.Origin == originAuto && !isAbsoluteURL(r.Target) && sameURL(targetPath(r.Target), oldURL):
			if err := p.updateRule(ctx, r.ID, map[string]any{"target": newURL}); err != nil {
				return err
			}
		}
	}
	if haveOld {
		return nil
	}
	rule := Rule{
		Source: oldURL, MatchType: matchExact, Target: newURL, StatusCode: 301, Enabled: true, KeepQuery: true,
		Origin: originAuto, NodeID: nodeID, Note: "Page URL changed",
	}
	if errs := rule.normalize(); len(errs) > 0 {
		return nil // e.g. an unusable URL; nothing sensible to redirect
	}
	return p.createRule(ctx, &rule)
}
