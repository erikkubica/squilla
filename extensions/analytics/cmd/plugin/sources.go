package main

import (
	"net/url"
	"regexp"
	"strings"
)

// matchSource returns the known source (name, kind) for a referrer host.
func matchSource(host string) (name, kind string, ok bool) {
	host = normalizeHost(host)
	if host == "" {
		return "", "", false
	}
	labels := strings.Split(host, ".")
	for _, r := range sourceRules {
		switch {
		case r.exact != "" && host == r.exact:
			return r.name, r.kind, true
		case r.suffix != "" && (host == r.suffix || strings.HasSuffix(host, "."+r.suffix)):
			return r.name, r.kind, true
		case r.label != "" && hasBrandLabel(labels, r.label):
			return r.name, r.kind, true
		}
	}
	return "", "", false
}

// hasBrandLabel reports whether label appears followed only by a short
// public suffix (google.com, google.co.uk, google.com.vn) so unrelated
// hosts such as booking.example.com don't match "booking".
func hasBrandLabel(labels []string, label string) bool {
	for i, l := range labels {
		if l != label {
			continue
		}
		rest := labels[i+1:]
		if len(rest) == 0 || len(rest) > 2 {
			continue
		}
		short := true
		for _, r := range rest {
			if len(r) > 3 {
				short = false
			}
		}
		if short {
			return true
		}
	}
	return false
}

// referrerHost extracts the referrer host (www-stripped). Android app
// referrers (android-app://com.whatsapp/) yield the package name. Own hosts
// return "" (internal navigation).
func referrerHost(referer, requestHost string, ownHosts []string) string {
	referer = strings.TrimSpace(referer)
	if referer == "" {
		return ""
	}
	u, err := url.Parse(referer)
	if err != nil {
		return ""
	}
	host := u.Hostname()
	if u.Scheme == "android-app" {
		host = u.Host
	} else if u.Scheme != "http" && u.Scheme != "https" {
		return ""
	}
	host = normalizeHost(host)
	if host == "" || host == normalizeHost(requestHost) {
		return ""
	}
	for _, own := range ownHosts {
		if host == own || strings.HasSuffix(host, "."+own) {
			return ""
		}
	}
	return host
}

// campaign holds allowlisted query parameters. Click ids are kept only as
// booleans; their values are never read beyond presence.
type campaign struct {
	Source, Medium, Name, Content, Term string
	Gclid, Msclkid, Fbclid, Ttclid      bool
}

func (c campaign) hasUTM() bool {
	return c.Source != "" || c.Medium != "" || c.Name != "" || c.Content != "" || c.Term != ""
}

// parseCampaign extracts UTM-style parameters and click-id presence from a
// raw query string. Everything else in the query is discarded.
func parseCampaign(rawQuery string) campaign {
	var c campaign
	if rawQuery == "" {
		return c
	}
	q, _ := url.ParseQuery(rawQuery)
	get := func(keys ...string) string {
		for _, k := range keys {
			if v := strings.TrimSpace(q.Get(k)); v != "" {
				if len(v) > 100 {
					v = v[:100]
				}
				return v
			}
		}
		return ""
	}
	c.Source = strings.ToLower(get("utm_source", "ref", "source", "via"))
	c.Medium = strings.ToLower(get("utm_medium"))
	c.Name = get("utm_campaign")
	c.Content = get("utm_content")
	c.Term = get("utm_term")
	has := func(k string) bool { return q.Has(k) }
	c.Gclid = has("gclid") || has("gbraid") || has("wbraid")
	c.Msclkid = has("msclkid")
	c.Fbclid = has("fbclid")
	c.Ttclid = has("ttclid")
	return c
}

var (
	rePaidMedium   = regexp.MustCompile(`^(.*cp.*|ppc|retargeting|paid.*|display|banner|cpm|ads?)$`)
	reSocialMedium = regexp.MustCompile(`^(social|social-network|social-media|sm|social network|social media|organic_social)$`)
	reEmailMedium  = regexp.MustCompile(`^(e-?mail|e_mail|newsletter)$`)
)

// classifyAcquisition derives source, channel and attribution for a visit.
func classifyAcquisition(refHost, ua string, c campaign) attribution {
	a := attribution{
		Referrer: refHost, UTMSource: c.Source, UTMMedium: c.Medium, UTMCampaign: c.Name,
		UTMContent: c.Content, UTMTerm: c.Term,
		Gclid: c.Gclid, Msclkid: c.Msclkid, Fbclid: c.Fbclid, Ttclid: c.Ttclid,
	}
	var name, kind string
	if c.Source != "" {
		host := c.Source
		if alias, ok := sourceAliases[c.Source]; ok {
			host = alias
		}
		if n, k, ok := matchSource(host); ok {
			name, kind = n, k
		} else {
			name = c.Source
		}
	}
	if name == "" && refHost != "" {
		if n, k, ok := matchSource(refHost); ok {
			name, kind = n, k
		} else {
			name = refHost
		}
	}
	if name == "" {
		l := strings.ToLower(ua)
		for _, r := range inAppRules {
			if strings.Contains(l, r.token) {
				name, kind, _ = matchSource(r.host)
				break
			}
		}
	}
	a.Source = name
	a.Channel = channelFor(kind, name, refHost, c)
	return a
}

func channelFor(kind, name, refHost string, c campaign) string {
	switch {
	case c.Gclid || c.Msclkid:
		return chPaidSearch
	case c.Ttclid:
		return chPaidSocial
	case c.Medium != "" && rePaidMedium.MatchString(c.Medium):
		switch kind {
		case srcSocial:
			return chPaidSocial
		case srcSearch:
			return chPaidSearch
		}
		return chCampaign
	case reEmailMedium.MatchString(c.Medium) || kind == srcEmail:
		return chEmail
	case kind == srcAI:
		return chAI
	case kind == srcSearch || c.Medium == "organic":
		return chOrganicSearch
	case kind == srcSocial || c.Fbclid || reSocialMedium.MatchString(c.Medium):
		return chOrganicSocial
	case c.hasUTM():
		return chCampaign
	case refHost != "" || name != "":
		return chReferral
	}
	return chDirect
}
