package main

import (
	"net/url"
	"strconv"
	"strings"
)

// dwellMarks are the seconds after activation at which a hidden element
// asks for its background image — a heartbeat the server timestamps.
var dwellMarks = []int{10, 30, 60, 180}

// How each beacon is triggered (measured in Chromium, Firefox and WebKit;
// see docs/browser-matrix.md):
//
//   - activation and dwell marks: SVG SMIL <set attributeName="href" begin="Ns">
//     on an <image>. The image is fetched only when the timer sets its href —
//     the one time trigger that is lazy in every engine and untouched by the
//     theme's prefers-reduced-motion animation reset. (WebKit fetches any CSS
//     background image named in @keyframes or inside content-visibility:hidden
//     at load, Firefox the latter, so those cannot delay a request.)
//   - section / end beacons: a scroll-driven animation (named view-timeline)
//     flips a registered custom property on the beacon's wrapper; a style
//     query then gives the child its background-image. A second, time-based
//     animation on the same wrapper keeps them silent for the first second.
//     Needs scroll timelines and style queries (Chromium, Safari 26); other
//     browsers simply send none.
//   - form / FAQ beacons: a :has() rule gives the child its background-image
//     once the state exists.
//   - viewport and colour scheme: plain @media rules choosing the image.
const signalsBaseCSS = `.sq-o{position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}` +
	`.sq-o i,.sq-o b,.sq-o svg{display:block;width:1px;height:1px}`

const signalsSectionCSS = `@property --sg{syntax:"<integer>";inherits:true;initial-value:0}` +
	`@property --so{syntax:"<integer>";inherits:true;initial-value:0}` +
	`@keyframes sqg{to{--sg:1}}@keyframes sqo{to{--so:1}}` +
	`.sq-o .sq-g{animation-name:sqg!important;animation-duration:1ms!important;animation-delay:1s!important;animation-fill-mode:forwards!important}` +
	`.sq-o .sw{animation-name:sqo!important;animation-duration:auto!important;animation-timing-function:linear!important;` +
	`animation-fill-mode:both!important;animation-range:entry 0% entry 60%!important}`

// signalsMarkup builds the <style> and the hidden container for one page.
// Everything is markup and CSS: no script, no identifiers in any URL —
// only the page id and a block key.
func signalsMarkup(cfg *Config, nodeID int64, secs []section) (style, container string) {
	pre := cfg.BeaconPrefix
	pid := strconv.FormatInt(nodeID, 10)
	u := func(path, rest string) string { return pre + path + "?p=" + pid + rest }
	cssURL := func(path, rest string) string { return "url(" + u(path, rest) + ")" }
	attrURL := func(path, rest string) string { return strings.ReplaceAll(u(path, rest), "&", "&amp;") }
	var css, svg, g, h strings.Builder
	css.WriteString(signalsBaseCSS)

	// Activation (and dwell marks): timers in SMIL.
	timer := func(path, rest string, after int) {
		svg.WriteString(`<image width="1" height="1"><set attributeName="href" to="` + attrURL(path, rest) + `" begin="` + strconv.Itoa(after) + `s"/></image>`)
	}
	timer("/b", "", 1)
	if cfg.SignalDwell {
		for _, d := range dwellMarks {
			timer("/t", "&s="+strconv.Itoa(d), d)
		}
	}

	// Viewport + colour scheme: media queries choose the image (no timing).
	m := func(w, c string) string { return cssURL("/m", "&w="+w+"&c="+c) }
	css.WriteString(`.sq-o .sq-m{background-image:` + m("l", "l") + `}`)
	css.WriteString(`@media (min-width:768px) and (max-width:1199px){.sq-o .sq-m{background-image:` + m("m", "l") + `}}`)
	css.WriteString(`@media (max-width:767px){.sq-o .sq-m{background-image:` + m("s", "l") + `}}`)
	css.WriteString(`@media (prefers-color-scheme:dark){.sq-o .sq-m{background-image:` + m("l", "d") + `}}`)
	css.WriteString(`@media (prefers-color-scheme:dark) and (min-width:768px) and (max-width:1199px){.sq-o .sq-m{background-image:` + m("m", "d") + `}}`)
	css.WriteString(`@media (prefers-color-scheme:dark) and (max-width:767px){.sq-o .sq-m{background-image:` + m("s", "d") + `}}`)
	css.WriteString(`@media print{.sq-o .sq-m{background-image:` + cssURL("/m", "&print=1") + `}}`)

	if cfg.SignalSections && len(secs) > 0 {
		var tl, anchors, rules strings.Builder
		names := make([]string, 0, len(secs))
		for _, s := range secs {
			k := strconv.Itoa(s.K)
			names = append(names, "--s"+k)
			anchors.WriteString(`[data-sq-b="` + k + `"]{view-timeline:--s` + k + ` block}`)
			rules.WriteString(`.sq-o .w` + k + `{animation-timeline:--s` + k + `!important}`)
			rules.WriteString(`@container style(--sg:1){@container style(--so:1){.sq-o .w` + k + ` .v{background-image:` + cssURL("/v", "&k="+url.QueryEscape(s.Key)) + `}}}`)
			g.WriteString(`<b class="sw w` + k + `"><i class="v"></i></b>`)
		}
		last := strconv.Itoa(secs[len(secs)-1].K)
		rules.WriteString(`.sq-o .we{animation-timeline:--s` + last + `!important}`)
		rules.WriteString(`@container style(--sg:1){@container style(--so:1){.sq-o .we .v{background-image:` + cssURL("/e", "") + `}}}`)
		g.WriteString(`<b class="sw we"><i class="v"></i></b>`)
		tl.WriteString("html{timeline-scope:" + strings.Join(names, ",") + "}")
		css.WriteString(`@supports (animation-timeline:view()) and (timeline-scope:--a){` + tl.String() + anchors.String() + signalsSectionCSS + rules.String() + `}`)
	}

	if cfg.SignalForms {
		var st strings.Builder
		for _, s := range secs {
			k := strconv.Itoa(s.K)
			sel := `[data-sq-b="` + k + `"]`
			if s.Form {
				st.WriteString(`html:has(` + sel + ` form:focus-within) .sq-o .f` + k + `{background-image:` + cssURL("/i", "&k="+url.QueryEscape(s.Key)+"&t=f") + `}`)
				h.WriteString(`<i class="f` + k + `"></i>`)
			}
			if s.Details {
				st.WriteString(`html:has(` + sel + ` details[open]:not([data-sq-o])) .sq-o .d` + k + `{background-image:` + cssURL("/i", "&k="+url.QueryEscape(s.Key)+"&t=d") + `}`)
				h.WriteString(`<i class="d` + k + `"></i>`)
			}
		}
		if st.Len() > 0 {
			css.WriteString(`@supports selector(:has(*)){` + st.String() + `}`)
		}
	}

	style = "<style>" + css.String() + "</style>"
	container = `<div class="sq-o" aria-hidden="true"><svg width="1" height="1">` + svg.String() + `</svg><i class="sq-m"></i>`
	if g.Len() > 0 {
		container += `<b class="sq-g">` + g.String() + `</b>`
	}
	container += h.String() + `</div>`
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
