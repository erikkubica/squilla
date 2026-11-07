// Package icons serves the SVG icon sets bundled with the Squilla kernel.
//
// Icon field values are strings of the form "provider:name", e.g.
// "lucide:map-pin" or "material:restaurant". A bare name without a provider
// prefix ("restaurant") is a legacy value from plain text fields and is read
// as a Material Symbols name.
//
// The icon data lives in data/<provider>.json.gz, embedded in the binary and
// decompressed lazily on first use. Regenerate it with the script in
// generate/ (see generate/generate.mjs for the exact steps):
//
//	cd internal/icons/generate && npm ci && npm run generate
//
// To update a set, bump the pinned version in generate/package.json, run
// `npm install` there, then `npm run generate` and commit data/*.json.gz
// together with generate/package-lock.json.
package icons

import (
	"bytes"
	"compress/gzip"
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"sort"
	"strings"
	"sync"
)

//go:embed data/*.json.gz
var dataFS embed.FS

// DefaultProvider is the provider assumed for values without a prefix.
// Existing themes store Material Symbols ligature names in text fields.
const DefaultProvider = "material"

// providerOrder fixes the order providers are listed in (admin tabs, docs).
var providerOrder = []string{"lucide", "material"}

// ProviderInfo describes an icon set for the admin picker and docs.
type ProviderInfo struct {
	ID      string `json:"id"`
	Label   string `json:"label"`
	License string `json:"license"`
	Version string `json:"version"`
	Count   int    `json:"count"`
	ViewBox string `json:"view_box"`
}

// Icon is one renderable icon.
type Icon struct {
	Provider string   `json:"provider"`
	Name     string   `json:"name"`
	Value    string   `json:"value"`
	SVG      string   `json:"svg"`
	Tags     []string `json:"tags,omitempty"`
}

type provider struct {
	ID      string
	Label   string
	License string
	Version string
	ViewBox string
	Attrs   map[string]string
	Icons   map[string]entry

	names    []string // sorted
	attrHTML string   // pre-rendered shared attributes
}

// entry is one icon in a data file: ["<inner svg markup>", ["tag", ...]].
type entry struct {
	inner string
	tags  []string
}

func (e *entry) UnmarshalJSON(b []byte) error {
	var parts []json.RawMessage
	if err := json.Unmarshal(b, &parts); err != nil {
		return err
	}
	if len(parts) > 0 {
		if err := json.Unmarshal(parts[0], &e.inner); err != nil {
			return err
		}
	}
	if len(parts) > 1 {
		if err := json.Unmarshal(parts[1], &e.tags); err != nil {
			return err
		}
	}
	return nil
}

type providerFile struct {
	ID      string            `json:"id"`
	Label   string            `json:"label"`
	License string            `json:"license"`
	Version string            `json:"version"`
	ViewBox string            `json:"viewBox"`
	Attrs   map[string]string `json:"attrs"`
	Icons   map[string]entry  `json:"icons"`
}

var (
	loadMu    sync.Mutex
	providers = map[string]*provider{}
	loadErrs  = map[string]error{}
)

// HasProvider reports whether id is a bundled provider.
func HasProvider(id string) bool {
	for _, p := range providerOrder {
		if p == id {
			return true
		}
	}
	return false
}

// ProviderIDs returns the bundled provider IDs in display order.
func ProviderIDs() []string {
	return append([]string(nil), providerOrder...)
}

func load(id string) (*provider, error) {
	if !HasProvider(id) {
		return nil, fmt.Errorf("icons: unknown provider %q", id)
	}
	loadMu.Lock()
	defer loadMu.Unlock()
	if p, ok := providers[id]; ok {
		return p, nil
	}
	if err, ok := loadErrs[id]; ok {
		return nil, err
	}
	p, err := decode(id)
	if err != nil {
		loadErrs[id] = err
		return nil, err
	}
	providers[id] = p
	return p, nil
}

func decode(id string) (*provider, error) {
	raw, err := dataFS.ReadFile("data/" + id + ".json.gz")
	if err != nil {
		return nil, fmt.Errorf("icons: read %s: %w", id, err)
	}
	zr, err := gzip.NewReader(bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("icons: gunzip %s: %w", id, err)
	}
	defer zr.Close()
	body, err := io.ReadAll(zr)
	if err != nil {
		return nil, fmt.Errorf("icons: gunzip %s: %w", id, err)
	}
	var f providerFile
	if err := json.Unmarshal(body, &f); err != nil {
		return nil, fmt.Errorf("icons: decode %s: %w", id, err)
	}
	p := &provider{
		ID: f.ID, Label: f.Label, License: f.License, Version: f.Version,
		ViewBox: f.ViewBox, Attrs: f.Attrs, Icons: f.Icons,
	}
	p.names = make([]string, 0, len(p.Icons))
	for n := range p.Icons {
		p.names = append(p.names, n)
	}
	sort.Strings(p.names)
	keys := make([]string, 0, len(p.Attrs))
	for k := range p.Attrs {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var b strings.Builder
	for _, k := range keys {
		fmt.Fprintf(&b, ` %s="%s"`, k, template.HTMLEscapeString(p.Attrs[k]))
	}
	p.attrHTML = b.String()
	return p, nil
}

// Providers returns metadata for every bundled provider.
func Providers() []ProviderInfo {
	out := make([]ProviderInfo, 0, len(providerOrder))
	for _, id := range providerOrder {
		p, err := load(id)
		if err != nil {
			continue
		}
		out = append(out, ProviderInfo{
			ID: p.ID, Label: p.Label, License: p.License, Version: p.Version,
			Count: len(p.names), ViewBox: p.ViewBox,
		})
	}
	return out
}

// Parse splits a field value into provider and name. A value without a
// "provider:" prefix is treated as a legacy Material Symbols name.
// Whitespace is trimmed; the result is not checked for existence.
func Parse(value string) (providerID, name string) {
	v := strings.TrimSpace(value)
	if v == "" {
		return "", ""
	}
	if i := strings.IndexByte(v, ':'); i >= 0 {
		return v[:i], v[i+1:]
	}
	return DefaultProvider, v
}

// Lookup returns the icon for a field value ("lucide:map-pin", or a bare
// legacy Material name).
func Lookup(value string) (Icon, bool) {
	pid, name := Parse(value)
	if pid == "" || name == "" {
		return Icon{}, false
	}
	p, err := load(pid)
	if err != nil {
		return Icon{}, false
	}
	e, ok := p.Icons[name]
	if !ok {
		return Icon{}, false
	}
	return p.icon(name, e), true
}

func (p *provider) icon(name string, e entry) Icon {
	return Icon{
		Provider: p.ID, Name: name, Value: p.ID + ":" + name,
		SVG: p.svg(e.inner, ""), Tags: e.tags,
	}
}

func (p *provider) svg(inner, class string) string {
	var b strings.Builder
	b.Grow(len(inner) + 160)
	b.WriteString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="`)
	b.WriteString(template.HTMLEscapeString(p.ViewBox))
	b.WriteString(`"`)
	b.WriteString(p.attrHTML)
	if class != "" {
		b.WriteString(` class="`)
		b.WriteString(template.HTMLEscapeString(class))
		b.WriteString(`"`)
	}
	b.WriteString(` aria-hidden="true" focusable="false">`)
	b.WriteString(inner)
	b.WriteString(`</svg>`)
	return b.String()
}

// Render returns the inline <svg> for a field value, or "" when the value is
// empty or does not name a bundled icon. class is HTML-escaped into the
// class attribute. The inner markup comes from the embedded, generated data
// files, so the result is safe to emit unescaped.
func Render(value, class string) template.HTML {
	pid, name := Parse(value)
	if pid == "" || name == "" {
		return ""
	}
	p, err := load(pid)
	if err != nil {
		return ""
	}
	e, ok := p.Icons[name]
	if !ok || e.inner == "" {
		return ""
	}
	return template.HTML(p.svg(e.inner, strings.TrimSpace(class))) //nolint:gosec // generated, trusted markup
}

// TemplateFunc is the `icon` template helper:
//
//	{{ icon .fields.my_icon }}
//	{{ icon "lucide:map-pin" "w-5 h-5 text-sky-600" }}
//
// The value may be any string-like type (string, template.HTML, fmt.Stringer);
// nil and unknown values render nothing. Extra class arguments are joined
// with spaces.
func TemplateFunc(value any, classes ...string) template.HTML {
	return Render(toString(value), strings.Join(classes, " "))
}

func toString(v any) string {
	switch s := v.(type) {
	case nil:
		return ""
	case string:
		return s
	case template.HTML:
		return string(s)
	case fmt.Stringer:
		return s.String()
	case map[string]any:
		// Tolerate {"value": "lucide:x"} shapes from hand-written data.
		if inner, ok := s["value"].(string); ok {
			return inner
		}
		return ""
	default:
		return ""
	}
}

// Validate checks that value names an existing icon. allowed restricts the
// providers a field accepts (nil/empty = all bundled providers). Empty
// values are valid (a cleared field).
func Validate(value string, allowed []string) error {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	pid, name := Parse(value)
	if !HasProvider(pid) {
		return fmt.Errorf("unknown icon provider %q (available: %s)", pid, strings.Join(providerOrder, ", "))
	}
	if len(allowed) > 0 {
		ok := false
		for _, a := range allowed {
			if a == pid {
				ok = true
				break
			}
		}
		if !ok {
			return fmt.Errorf("icon provider %q is not allowed for this field (allowed: %s)", pid, strings.Join(allowed, ", "))
		}
	}
	p, err := load(pid)
	if err != nil {
		return err
	}
	if _, ok := p.Icons[name]; !ok {
		return fmt.Errorf("icon %q does not exist in %s", name, p.Label)
	}
	return nil
}

// SearchResult is one page of icons for the admin picker.
type SearchResult struct {
	Provider string `json:"provider"`
	Query    string `json:"query"`
	Page     int    `json:"page"`
	PerPage  int    `json:"per_page"`
	Total    int    `json:"total"`
	Icons    []Icon `json:"icons"`
}

// Search returns icons of one provider whose name or tags contain every
// whitespace-separated term in q (case-insensitive). Name matches rank
// before tag-only matches; exact and prefix name matches rank first.
// page is 1-based.
func Search(providerID, q string, page, perPage int) (SearchResult, error) {
	p, err := load(providerID)
	if err != nil {
		return SearchResult{}, err
	}
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 500 {
		perPage = 120
	}
	q = strings.ToLower(strings.TrimSpace(q))
	terms := strings.Fields(strings.NewReplacer("-", " ", "_", " ").Replace(q))

	type hit struct {
		name string
		rank int
	}
	var hits []hit
	for _, name := range p.names {
		if len(terms) == 0 {
			hits = append(hits, hit{name, 0})
			continue
		}
		words := strings.NewReplacer("-", " ", "_", " ").Replace(name)
		rank := 0
		matched := true
		tags := p.Icons[name].tags
		for _, t := range terms {
			if strings.Contains(words, t) {
				continue
			}
			found := false
			for _, tag := range tags {
				if strings.Contains(strings.ToLower(tag), t) {
					found = true
					break
				}
			}
			if !found {
				matched = false
				break
			}
			rank = 2 // tag-only match for at least one term
		}
		if !matched {
			continue
		}
		if rank == 0 {
			switch {
			case words == strings.Join(terms, " "):
				rank = -2
			case strings.HasPrefix(words, terms[0]):
				rank = -1
			}
		}
		hits = append(hits, hit{name, rank})
	}
	sort.SliceStable(hits, func(i, j int) bool { return hits[i].rank < hits[j].rank })

	res := SearchResult{Provider: p.ID, Query: q, Page: page, PerPage: perPage, Total: len(hits), Icons: []Icon{}}
	start := (page - 1) * perPage
	if start >= len(hits) {
		return res, nil
	}
	end := start + perPage
	if end > len(hits) {
		end = len(hits)
	}
	for _, h := range hits[start:end] {
		ic := p.icon(h.name, p.Icons[h.name])
		ic.Tags = nil // keep the payload small; tags are only used for matching
		res.Icons = append(res.Icons, ic)
	}
	return res, nil
}
