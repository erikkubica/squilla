package main

import (
	"net/url"
	"strconv"
	"strings"
)

// dwellMarks are the seconds after activation at which a hidden element
// asks for its background image — a heartbeat the server timestamps.
var dwellMarks = []int{10, 30, 60, 180, 600}

const signalsBaseCSS = `.sq-o{position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}` +
	`.sq-o i{display:block;width:1px;height:1px}` +
	`.sq-o .sq-g{content-visibility:hidden;animation:sqg 1ms 1s forwards!important}` +
	`@keyframes sqg{to{content-visibility:visible}}` +
	`@keyframes sqt{to{background-image:var(--u)}}` +
	`.sq-o .sq-t{animation-name:sqt!important;animation-duration:1ms!important;animation-fill-mode:forwards!important;animation-timeline:auto!important}`

const signalsSectionCSS = `@keyframes sqv{0%,49.9%{background-image:none}50%,100%{background-image:var(--u)}}` +
	`.sq-o .sq-v{animation-name:sqv!important;animation-duration:auto!important;animation-timing-function:linear!important;` +
	`animation-fill-mode:both!important;animation-delay:0s!important;animation-range:entry 0% entry 60%!important}`

// signalsMarkup builds the <style> and the hidden container for one page.
// Everything is CSS: the browser fetches a background image when an
// animation or :has() state reaches it. No script, no identifiers in any
// URL — only the page id and a block key.
func signalsMarkup(cfg *Config, nodeID int64, secs []section) (style, container string) {
	pre := cfg.BeaconPrefix
	pid := strconv.FormatInt(nodeID, 10)
	u := func(path, rest string) string {
		return "url(" + pre + path + "?p=" + pid + rest + ")"
	}
	var css, a, g strings.Builder
	css.WriteString(signalsBaseCSS)

	// Activation: viewport + colour scheme, 1 s after the page is shown.
	act := func(w, c string) string { return u("/b", "&w="+w+"&c="+c) }
	css.WriteString(`.sq-o .sq-a{animation-name:sqt!important;animation-duration:1ms!important;animation-delay:1s!important;animation-fill-mode:forwards!important;animation-timeline:auto!important;--u:` + act("l", "l") + `}`)
	css.WriteString(`@media (min-width:768px) and (max-width:1199px){.sq-o .sq-a{--u:` + act("m", "l") + `}}`)
	css.WriteString(`@media (max-width:767px){.sq-o .sq-a{--u:` + act("s", "l") + `}}`)
	css.WriteString(`@media (prefers-color-scheme:dark){.sq-o .sq-a{--u:` + act("l", "d") + `}}`)
	css.WriteString(`@media (prefers-color-scheme:dark) and (min-width:768px) and (max-width:1199px){.sq-o .sq-a{--u:` + act("m", "d") + `}}`)
	css.WriteString(`@media (prefers-color-scheme:dark) and (max-width:767px){.sq-o .sq-a{--u:` + act("s", "d") + `}}`)
	css.WriteString(`@media print{.sq-o .sq-a{animation:none!important;background-image:` + u("/b", "&print=1") + `}}`)
	a.WriteString(`<i class="sq-a"></i>`)

	if cfg.SignalDwell {
		for _, s := range dwellMarks {
			n := strconv.Itoa(s)
			css.WriteString(`.sq-o .t` + n + `{--u:` + u("/t", "&s="+n) + `;animation-delay:` + n + `s!important}`)
			a.WriteString(`<i class="sq-t t` + n + `"></i>`)
		}
	}

	if cfg.SignalSections && len(secs) > 0 {
		var tl, anchors, rules strings.Builder
		names := make([]string, 0, len(secs))
		for _, s := range secs {
			k := strconv.Itoa(s.K)
			names = append(names, "--s"+k)
			anchors.WriteString(`[data-sq-b="` + k + `"]{view-timeline:--s` + k + ` block}`)
			rules.WriteString(`.sq-o .v` + k + `{--u:` + u("/v", "&k="+url.QueryEscape(s.Key)) + `;animation-timeline:--s` + k + `!important}`)
			g.WriteString(`<i class="sq-v v` + k + `"></i>`)
		}
		last := strconv.Itoa(secs[len(secs)-1].K)
		rules.WriteString(`.sq-o .ve{--u:` + u("/e", "") + `;animation-timeline:--s` + last + `!important}`)
		g.WriteString(`<i class="sq-v ve"></i>`)
		tl.WriteString("html{timeline-scope:" + strings.Join(names, ",") + "}")
		css.WriteString(`@supports (animation-timeline:view()) and (timeline-scope:--a){` + tl.String() + anchors.String() + signalsSectionCSS + rules.String() + `}`)
	}

	if cfg.SignalForms {
		var st strings.Builder
		for _, s := range secs {
			k := strconv.Itoa(s.K)
			sel := `[data-sq-b="` + k + `"]`
			if s.Form {
				st.WriteString(`html:has(` + sel + ` form:focus-within) .sq-o .f` + k + `{background-image:` + u("/i", "&k="+url.QueryEscape(s.Key)+"&t=f") + `}`)
				g.WriteString(`<i class="f` + k + `"></i>`)
			}
			if s.Details {
				st.WriteString(`html:has(` + sel + ` details[open]:not([data-sq-o])) .sq-o .d` + k + `{background-image:` + u("/i", "&k="+url.QueryEscape(s.Key)+"&t=d") + `}`)
				g.WriteString(`<i class="d` + k + `"></i>`)
			}
		}
		if st.Len() > 0 {
			css.WriteString(`@supports selector(:has(*)){` + st.String() + `}`)
		}
	}

	style = "<style>" + css.String() + "</style>"
	container = `<div class="sq-o" aria-hidden="true">` + a.String()
	if g.Len() > 0 {
		container += `<div class="sq-g">` + g.String() + `</div>`
	}
	container += `</div>`
	return style, container
}

// injectBefore inserts s before the last (or first, with first=true)
// case-insensitive occurrence of tag, else appends it.
func injectBefore(doc, tag, s string, first bool) string {
	lower := strings.ToLower(doc)
	var i int
	if first {
		i = strings.Index(lower, tag)
	} else {
		i = strings.LastIndex(lower, tag)
	}
	if i < 0 {
		return doc + s
	}
	return doc[:i] + s + doc[i:]
}
