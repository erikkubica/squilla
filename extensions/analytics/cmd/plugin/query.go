package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

const dateLayout = "2006-01-02"

// filterDims are the f.<dim> filters accepted by every stats endpoint.
var filterDims = map[string]bool{
	"page": true, "entry_page": true, "source": true, "channel": true, "referrer": true,
	"utm_source": true, "utm_medium": true, "utm_campaign": true, "utm_content": true, "utm_term": true,
	"country": true, "language": true, "device": true, "browser": true, "os": true, "page_type": true, "goal": true,
}

// breakdownDims mirrors analytics__dimensions() in SQL.
var breakdownDims = []string{
	"page", "entry_page", "exit_page", "source", "channel", "referrer",
	"utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
	"country", "language", "device", "browser", "os", "page_type",
	"not_found", "download", "outbound", "goal", "viewport", "color_scheme",
}

func isBreakdownDim(d string) bool {
	for _, x := range breakdownDims {
		if x == d {
			return true
		}
	}
	return false
}

// statsQuery is the parsed common query: inclusive local-date range,
// optional comparison range and filters.
type statsQuery struct {
	From, To         time.Time // local midnight in loc
	PrevFrom, PrevTo time.Time // zero when compare is off
	Compare          string
	TZ               string
	loc              *time.Location
	Filters          map[string]string
}

func (q *statsQuery) from() string   { return q.From.Format(dateLayout) }
func (q *statsQuery) to() string     { return q.To.Format(dateLayout) }
func (q *statsQuery) hasPrev() bool  { return !q.PrevFrom.IsZero() }
func (q *statsQuery) days() int      { return int(q.To.Sub(q.From).Hours()/24+0.5) + 1 }
func (q *statsQuery) filterArg() any { return q.Filters }

// queryError is returned for invalid parameters (HTTP 400).
type queryError struct{ code, msg string }

func (e *queryError) Error() string { return e.msg }

// parseStatsQuery reads from/to/compare/f.* (default: last 30 days).
func parseStatsQuery(params map[string]string, cfg *Config, now time.Time) (*statsQuery, error) {
	loc := cfg.location()
	q := &statsQuery{TZ: cfg.Timezone, loc: loc, Filters: map[string]string{}}
	y, m, d := now.In(loc).Date()
	today := time.Date(y, m, d, 0, 0, 0, 0, loc)
	q.To, q.From = today, today.AddDate(0, 0, -29)
	if v := strings.TrimSpace(params["to"]); v != "" {
		t, err := time.ParseInLocation(dateLayout, v, loc)
		if err != nil {
			return nil, &queryError{"INVALID_DATE", "to must be YYYY-MM-DD"}
		}
		q.To = t
		if strings.TrimSpace(params["from"]) == "" {
			q.From = t.AddDate(0, 0, -29)
		}
	}
	if v := strings.TrimSpace(params["from"]); v != "" {
		t, err := time.ParseInLocation(dateLayout, v, loc)
		if err != nil {
			return nil, &queryError{"INVALID_DATE", "from must be YYYY-MM-DD"}
		}
		q.From = t
	}
	if q.From.After(q.To) {
		return nil, &queryError{"INVALID_RANGE", "from must not be after to"}
	}
	if q.days() > 3700 {
		return nil, &queryError{"INVALID_RANGE", "range is limited to 10 years"}
	}
	switch q.Compare = params["compare"]; q.Compare {
	case "":
	case "previous":
		n := q.days()
		q.PrevTo = q.From.AddDate(0, 0, -1)
		q.PrevFrom = q.PrevTo.AddDate(0, 0, -(n - 1))
	case "year":
		q.PrevFrom, q.PrevTo = q.From.AddDate(-1, 0, 0), q.To.AddDate(-1, 0, 0)
	default:
		return nil, &queryError{"INVALID_COMPARE", "compare must be previous or year"}
	}
	for k, v := range params {
		if !strings.HasPrefix(k, "f.") {
			continue
		}
		dim := strings.TrimPrefix(k, "f.")
		if !filterDims[dim] {
			return nil, &queryError{"INVALID_FILTER", fmt.Sprintf("unknown filter %q", dim)}
		}
		if len(v) > 512 {
			return nil, &queryError{"INVALID_FILTER", "filter value too long"}
		}
		if dim == "page" || dim == "entry_page" {
			v = normalizePath(v)
		}
		q.Filters[dim] = v
	}
	return q, nil
}

// prev returns a copy of q over the comparison range.
func (q *statsQuery) prev() *statsQuery {
	c := *q
	c.From, c.To = q.PrevFrom, q.PrevTo
	c.PrevFrom, c.PrevTo = time.Time{}, time.Time{}
	return &c
}

func intParam(params map[string]string, key string, def, min, max int) int {
	v, err := strconv.Atoi(strings.TrimSpace(params[key]))
	if err != nil {
		return def
	}
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}
