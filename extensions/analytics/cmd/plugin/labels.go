package main

import "strconv"

var channelLabels = map[string]string{
	chDirect: "Direct", chOrganicSearch: "Organic search", chPaidSearch: "Paid search",
	chOrganicSocial: "Organic social", chPaidSocial: "Paid social", chAI: "AI assistants",
	chEmail: "Email", chReferral: "Referral", chCampaign: "Other campaigns",
}

var viewportLabels = map[string]string{"s": "Small (< 768 px)", "m": "Medium (768–1199 px)", "l": "Large (≥ 1200 px)"}

// label returns a human-readable label for a breakdown value. The raw
// value stays in `value` for filtering.
func (p *AnalyticsPlugin) label(dim, value string) string {
	switch dim {
	case "channel":
		if l, ok := channelLabels[value]; ok {
			return l
		}
	case "source":
		if value == "" {
			return "Direct / none"
		}
	case "viewport":
		if l, ok := viewportLabels[value]; ok {
			return l
		}
	case "color_scheme":
		switch value {
		case "light":
			return "Light"
		case "dark":
			return "Dark"
		}
	case "goal":
		id, _ := strconv.ParseInt(value, 10, 64)
		for _, g := range *p.goals.Load() {
			if g.ID == id {
				return g.Name
			}
		}
		return "Deleted goal #" + value
	case "outbound":
		if l, ok := (*p.links.Load())[value]; ok {
			if l.Label != "" {
				return l.Label
			}
			return l.Destination
		}
	case "device":
		switch value {
		case "mobile":
			return "Mobile"
		case "tablet":
			return "Tablet"
		case "desktop":
			return "Desktop"
		}
	}
	if value == "" {
		return "(none)"
	}
	return value
}
