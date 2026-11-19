package main

import (
	"context"
	"encoding/json"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// brokenLinksEvent asks the analytics extension for the addresses that
// showed "page not found". It is a request/response event: no answer means
// analytics is not active, and the admin UI hides the feature.
const brokenLinksEvent = "analytics:broken_links"

const (
	// brokenPage is how many analytics rows one request asks for.
	brokenPage = 500
	// brokenScanMax bounds how far down the hit ranking the list reaches.
	// Addresses already fixed stay in analytics for the whole period, so the
	// scan pages past them instead of stopping at the first 500.
	brokenScanMax = 3000
	// brokenWant stops the scan once this many unfixed addresses are found.
	brokenWant = 300
)

// brokenLinkRow is one missing address as shown in the admin dialog.
type brokenLinkRow struct {
	Path       string      `json:"path"`
	Hits       int64       `json:"hits"`
	Visitors   int64       `json:"visitors"`
	Suggestion *suggestion `json:"suggestion,omitempty"`
}

// suggestion is a published page the missing address probably meant.
type suggestion struct {
	URL   string `json:"url"`
	Title string `json:"title"`
}

// analyticsReport is one answer to brokenLinksEvent.
type analyticsReport struct {
	Source           string `json:"source"`
	Error            string `json:"error"`
	From             string `json:"from"`
	To               string `json:"to"`
	Total            int64  `json:"total"`
	ConfirmAvailable bool   `json:"confirm_available"`
	Rows             []struct {
		Path     string `json:"path"`
		Hits     int64  `json:"hits"`
		Visitors int64  `json:"visitors"`
	} `json:"rows"`
}

// askAnalytics sends one brokenLinksEvent request. ok is false when nobody
// answered as analytics (not active).
func (p *Plugin) askAnalytics(ctx context.Context, payload map[string]any) (rep analyticsReport, ok bool, err error) {
	results, err := p.host.EmitCollect(ctx, brokenLinksEvent, payload)
	if err != nil {
		return rep, false, err
	}
	for _, raw := range results {
		var r analyticsReport
		// Any extension may subscribe to the event; only an answer that
		// identifies itself as analytics counts.
		if json.Unmarshal([]byte(raw), &r) != nil || r.Source != "analytics" {
			continue
		}
		if r.Error == "" && r.Rows == nil {
			continue
		}
		return r, true, nil
	}
	return rep, false, nil
}

// handleBrokenLinks lists 404 addresses reported by analytics that no rule
// covers yet and no published page serves, each with a likely target.
// count_only=1 skips the suggestions (the toolbar badge needs a number).
// Gated by view_analytics in the manifest: it shows analytics data.
func (p *Plugin) handleBrokenLinks(ctx context.Context, params map[string]string) *pb.PluginHTTPResponse {
	days, _ := strconv.Atoi(params["days"])
	if days < 1 || days > 365 {
		days = 30
	}
	verified := params["verified"] == "1" || params["verified"] == "true"
	countOnly := params["count_only"] == "1"

	rs := p.rules.Load()
	exactSources := map[string]Rule{}
	for _, r := range rs.all {
		if r.MatchType == matchExact {
			exactSources[strings.ToLower(r.Source)] = r
		}
	}
	pages := p.publishedPages(ctx)

	byKey := map[string]*brokenLinkRow{}
	order := []string{}
	covered, disabled, live := 0, 0, 0
	seenCovered := map[string]bool{}
	var head analyticsReport
	more := false
	for offset := 0; offset < brokenScanMax; offset += brokenPage {
		payload := map[string]any{"days": days, "limit": brokenPage, "offset": offset}
		if verified {
			payload["verified"] = true
		}
		rep, ok, err := p.askAnalytics(ctx, payload)
		if err != nil {
			return jsonError(502, "UPSTREAM", err.Error())
		}
		if !ok {
			if offset == 0 {
				return jsonResponse(200, map[string]any{"available": false, "rows": []brokenLinkRow{}})
			}
			break
		}
		if rep.Error != "" {
			return jsonResponse(200, map[string]any{"available": true, "error": rep.Error, "rows": []brokenLinkRow{}})
		}
		if offset == 0 {
			head = rep
		}
		for _, r := range rep.Rows {
			path, _ := splitSource(r.Path)
			if !strings.HasPrefix(path, "/") {
				continue
			}
			path = normalizePath(path)
			key := strings.ToLower(path)
			// Analytics keeps percent-encoded and decoded spellings apart;
			// they are one address here.
			if row, dup := byKey[key]; dup {
				row.Hits += r.Hits
				row.Visitors += r.Visitors
				continue
			}
			if seenCovered[key] {
				continue
			}
			if rule, has := exactSources[key]; has && !rule.Enabled {
				seenCovered[key] = true
				disabled++
				continue
			}
			if _, ok := rs.resolve(path, nil); ok || exactSources[key].ID != 0 {
				seenCovered[key] = true
				covered++
				continue
			}
			if pages.urls[key] {
				seenCovered[key] = true
				live++
				continue
			}
			byKey[key] = &brokenLinkRow{Path: path, Hits: r.Hits, Visitors: r.Visitors}
			order = append(order, key)
		}
		more = int64(offset+brokenPage) < rep.Total
		if !more || len(order) >= brokenWant || len(rep.Rows) == 0 {
			break
		}
	}

	rows := make([]brokenLinkRow, 0, len(order))
	for _, k := range order {
		row := byKey[k]
		if !countOnly && !pages.partial {
			row.Suggestion = pages.suggest(row.Path, rs)
		}
		rows = append(rows, *row)
	}
	sort.SliceStable(rows, func(i, j int) bool { return rows[i].Hits > rows[j].Hits })
	return jsonResponse(200, map[string]any{
		"available": true, "from": head.From, "to": head.To, "days": days,
		"rows": rows, "covered": covered, "disabled": disabled, "live": live,
		"truncated": more, "partial": pages.partial, "confirm_available": head.ConfirmAvailable,
	})
}

// pageIndex is a snapshot of published pages used to drop addresses that
// work again and to suggest targets.
type pageIndex struct {
	urls    map[string]bool // lower-cased full URL
	pages   []indexedPage
	partial bool // listing stopped early: some live pages may be missing
	built   time.Time
}

type indexedPage struct {
	url, title, slug, first string
	tokens                  map[string]bool
}

// pageCache holds the last pageIndex. Node events drop it; a TTL covers
// changes the plugin doesn't hear about.
type pageCache struct {
	mu  sync.Mutex
	idx *pageIndex
}

const pageIndexTTL = 10 * time.Minute

func (c *pageCache) invalidate() {
	c.mu.Lock()
	c.idx = nil
	c.mu.Unlock()
}

// publishedPages returns the cached index, rebuilding it when stale. The
// lock is held while building so concurrent requests share one listing.
func (p *Plugin) publishedPages(ctx context.Context) *pageIndex {
	c := &p.pages
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.idx != nil && p.now().Sub(c.idx.built) < pageIndexTTL {
		return c.idx
	}
	idx := p.buildPageIndex(ctx)
	if !idx.partial {
		c.idx = idx
	}
	return idx
}

const maxIndexedPages = 20000

func (p *Plugin) buildPageIndex(ctx context.Context) *pageIndex {
	idx := &pageIndex{urls: map[string]bool{}, built: p.now()}
	const page = 200
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	for offset := 0; ; offset += page {
		if offset >= maxIndexedPages {
			idx.partial = true
			break
		}
		list, err := p.host.QueryNodes(ctx, coreapi.NodeQuery{Status: "published", Limit: page, Offset: offset, OrderBy: "id ASC"})
		if err != nil || list == nil {
			p.logf(ctx, "warn", "listing pages for broken links failed: %v", err)
			idx.partial = true
			break
		}
		for _, n := range list.Nodes {
			if n == nil || n.FullURL == "" {
				continue
			}
			u := normalizePath(n.FullURL)
			idx.urls[strings.ToLower(u)] = true
			slug := strings.ToLower(n.Slug)
			if slug == "" {
				slug = lastSegment(u)
			}
			idx.pages = append(idx.pages, indexedPage{url: u, title: n.Title, slug: slug, first: firstSegment(u), tokens: tokenSet(slug)})
		}
		if len(list.Nodes) < page || (list.Total > 0 && int64(offset+page) >= list.Total) {
			break
		}
	}
	return idx
}

// suggest picks the published page whose slug best matches the missing
// address's last segment: an exact slug match wins, otherwise the largest
// word overlap (at least half of the words). A page under the same first
// segment (usually the language prefix or section) is preferred, then the
// shorter URL. Pages that themselves redirect are never suggested.
func (idx *pageIndex) suggest(path string, rs *ruleSet) *suggestion {
	seg := lastSegment(path)
	if seg == "" {
		return nil
	}
	want := tokenSet(seg)
	first := ""
	if strings.Count(strings.Trim(path, "/"), "/") > 0 {
		first = firstSegment(path)
	}
	var best *indexedPage
	bestScore := 0.0
	for i := range idx.pages {
		pg := &idx.pages[i]
		score := 0.0
		if pg.slug == seg {
			score = 2
		} else if len(want) > 0 && len(pg.tokens) > 0 {
			shared := 0
			for t := range want {
				if pg.tokens[t] {
					shared++
				}
			}
			score = float64(shared) / float64(max(len(want), len(pg.tokens)))
			if score < 0.5 {
				continue
			}
		}
		if score == 0 {
			continue
		}
		if first != "" && pg.first == first {
			score += 0.25
		}
		if score > bestScore || (score == bestScore && best != nil && len(pg.url) < len(best.url)) {
			if strings.EqualFold(pg.url, path) {
				continue
			}
			if _, redirects := rs.resolve(pg.url, nil); redirects {
				continue
			}
			best, bestScore = pg, score
		}
	}
	if best == nil {
		return nil
	}
	return &suggestion{URL: best.url, Title: best.title}
}

// firstSegment returns the first path segment, lower-cased.
func firstSegment(path string) string {
	path = strings.Trim(path, "/")
	if i := strings.IndexByte(path, '/'); i >= 0 {
		path = path[:i]
	}
	return strings.ToLower(path)
}

// lastSegment returns the final path segment, lower-cased, without a
// legacy file extension (/blog/My-Post.html → my-post).
func lastSegment(path string) string {
	path = strings.Trim(path, "/")
	if i := strings.LastIndexByte(path, '/'); i >= 0 {
		path = path[i+1:]
	}
	path = strings.ToLower(path)
	for _, ext := range []string{".html", ".htm", ".php", ".aspx", ".asp", ".jsp"} {
		path = strings.TrimSuffix(path, ext)
	}
	return path
}

// tokenSet splits a slug into words, skipping numbers-only and one-letter
// fragments that would match almost anything.
func tokenSet(slug string) map[string]bool {
	out := map[string]bool{}
	for _, t := range strings.FieldsFunc(slug, func(r rune) bool { return r == '-' || r == '_' || r == '.' || r == ' ' || r == '+' }) {
		if len(t) < 2 {
			continue
		}
		if _, err := strconv.Atoi(t); err == nil {
			continue
		}
		out[t] = true
	}
	return out
}

// batchError reports one rule of a batch create that was not saved.
type batchError struct {
	Index   int    `json:"index"`
	Source  string `json:"source"`
	Message string `json:"message"`
}

// handleBatchCreate creates several manual redirects at once (the broken
// links dialog sends one per selected address). Rules that fail validation
// or whose source already has a redirect are reported and skipped. Rules
// whose target itself redirects are created but reported as warnings, since
// visitors then take two hops.
func (p *Plugin) handleBatchCreate(ctx context.Context, body []byte) *pb.PluginHTTPResponse {
	var in struct {
		Rules []Rule `json:"rules"`
	}
	if err := json.Unmarshal(body, &in); err != nil || len(in.Rules) == 0 {
		return jsonError(400, "INVALID_JSON", "expected {rules: [...]}")
	}
	if len(in.Rules) > 500 {
		return validationError(map[string]string{"rules": "at most 500 at a time"})
	}
	p.writeMu.Lock()
	defer p.writeMu.Unlock()
	defer func() { _ = p.reloadRules(ctx) }()

	rs := p.rules.Load()
	existing := map[string]bool{}
	for _, r := range rs.all {
		existing[sourceKey(r)] = true
	}
	created := 0
	errs, warnings := []batchError{}, []batchError{}
	batchSources := map[string]bool{}
	var saved []Rule
	for i, raw := range in.Rules {
		rule := Rule{
			Source: raw.Source, MatchType: raw.MatchType, Target: raw.Target, StatusCode: raw.StatusCode,
			Note: raw.Note, Enabled: true, KeepQuery: true, Origin: originManual,
		}
		if fields := rule.normalize(); len(fields) > 0 {
			keys := make([]string, 0, len(fields))
			for k := range fields {
				keys = append(keys, k)
			}
			sort.Strings(keys)
			errs = append(errs, batchError{i, raw.Source, keys[0] + ": " + fields[keys[0]]})
			continue
		}
		key := sourceKey(rule)
		if existing[key] {
			errs = append(errs, batchError{i, rule.Source, "a redirect for this URL already exists"})
			continue
		}
		if err := p.createRule(ctx, &rule); err != nil {
			// Report what was saved so far instead of failing the whole call:
			// the rows above are in the database already.
			errs = append(errs, batchError{i, rule.Source, "could not save: " + err.Error()})
			break
		}
		existing[key] = true
		if rule.MatchType == matchExact {
			batchSources[strings.ToLower(rule.Source)] = true
		}
		saved = append(saved, rule)
		created++
	}
	// Chains: a target that is itself redirected (by an existing rule or one
	// from this batch).
	for _, r := range saved {
		if r.StatusCode == 410 || isAbsoluteURL(r.Target) {
			continue
		}
		tp, tq := splitSource(r.Target)
		q, _ := url.ParseQuery(tq)
		if _, hop := rs.resolve(tp, q); hop || batchSources[strings.ToLower(normalizePath(tp))] {
			warnings = append(warnings, batchError{-1, r.Source, "its target " + r.Target + " redirects again"})
		}
	}
	return jsonResponse(200, map[string]any{"created": created, "errors": errs, "warnings": warnings})
}
