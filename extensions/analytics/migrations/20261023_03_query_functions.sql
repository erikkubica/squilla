-- Up
-- Read-side analytics functions behind the admin API. Dates are passed as
-- 'YYYY-MM-DD' text (inclusive, in p_tz); filters as a jsonb object of
-- {dimension: value}. Unfiltered ranges read rollups where available;
-- filtered ranges read raw events (see analytics__day_totals).

CREATE OR REPLACE FUNCTION analytics_summary(p_from text, p_to text, p_tz text, p_filters jsonb)
RETURNS TABLE(visitors bigint, pageviews bigint, visits bigint, conversions bigint, converting_visits bigint,
              single_page_visits bigint, multi_page_visits bigint, median_visit_seconds double precision)
LANGUAGE sql STABLE AS $$
    SELECT coalesce(sum(x.visitors), 0)::bigint,
           coalesce(sum(x.pageviews), 0)::bigint,
           coalesce(sum(x.visits), 0)::bigint,
           coalesce(sum(x.conversions), 0)::bigint,
           coalesce(sum(x.converting_visits), 0)::bigint,
           coalesce(sum(x.single_page_visits), 0)::bigint,
           coalesce(sum(x.multi_page_visits), 0)::bigint,
           -- Multi-day: daily medians weighted by multi-page visits.
           (sum(x.median_visit_seconds * x.multi_page_visits) FILTER (WHERE x.median_visit_seconds IS NOT NULL)
             / nullif(sum(x.multi_page_visits) FILTER (WHERE x.median_visit_seconds IS NOT NULL), 0))::double precision
    FROM analytics__day_totals(p_from::date, p_to::date, p_tz, p_filters) x;
$$;

CREATE OR REPLACE FUNCTION analytics_timeseries(p_from text, p_to text, p_tz text, p_interval text, p_filters jsonb)
RETURNS TABLE(t text, visitors bigint, pageviews bigint, visits bigint, conversions bigint)
LANGUAGE plpgsql STABLE AS $$
#variable_conflict use_column
DECLARE
    v_from    date := p_from::date;
    v_to      date := p_to::date;
    v_from_ts timestamptz := p_from::date::timestamp AT TIME ZONE p_tz;
    v_to_ts   timestamptz := (p_to::date + 1)::timestamp AT TIME ZONE p_tz;
BEGIN
    IF p_interval = 'hour' THEN
        RETURN QUERY EXECUTE format($q$
            WITH base AS (
                SELECT e.visitor_id, e.entry, e.kind, date_trunc('hour', e.ts AT TIME ZONE %1$L) AS h,
                       (e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed)) AS pv
                FROM analytics_events e WHERE e.ts >= %2$L AND e.ts < %3$L%4$s
            ),
            agg AS (
                SELECT b.h,
                       count(DISTINCT b.visitor_id) FILTER (WHERE b.pv)
                         + count(*) FILTER (WHERE b.pv AND b.visitor_id IS NULL AND b.entry) AS vis,
                       count(*) FILTER (WHERE b.pv) AS pvs,
                       count(*) FILTER (WHERE b.pv AND b.entry) AS vts,
                       count(*) FILTER (WHERE b.kind = 'goal') AS conv
                FROM base b GROUP BY b.h
            )
            SELECT to_char(g.h, 'YYYY-MM-DD"T"HH24:00'), coalesce(a.vis, 0)::bigint, coalesce(a.pvs, 0)::bigint,
                   coalesce(a.vts, 0)::bigint, coalesce(a.conv, 0)::bigint
            FROM generate_series(%5$L::timestamp, %6$L::timestamp, interval '1 hour') g(h)
            LEFT JOIN agg a ON a.h = g.h
            ORDER BY g.h
        $q$, p_tz, v_from_ts, v_to_ts, analytics__filter_sql(p_filters, v_from_ts, v_to_ts),
             v_from::timestamp, v_to::timestamp + interval '23 hours');
        RETURN;
    END IF;
    IF p_interval NOT IN ('day', 'week', 'month') THEN
        RAISE EXCEPTION 'analytics: unknown interval "%"', p_interval USING ERRCODE = '22023';
    END IF;
    RETURN QUERY
        WITH d AS (SELECT * FROM analytics__day_totals(v_from, v_to, p_tz, p_filters)),
        bk AS (
            SELECT DISTINCT CASE p_interval
                       WHEN 'week'  THEN date_trunc('week', g.d)::date
                       WHEN 'month' THEN date_trunc('month', g.d)::date
                       ELSE g.d::date END AS b
            FROM generate_series(v_from::timestamp, v_to::timestamp, interval '1 day') g(d)
        )
        SELECT to_char(bk.b, 'YYYY-MM-DD'),
               coalesce(sum(d.visitors), 0)::bigint, coalesce(sum(d.pageviews), 0)::bigint,
               coalesce(sum(d.visits), 0)::bigint, coalesce(sum(d.conversions), 0)::bigint
        FROM bk
        LEFT JOIN d ON (CASE p_interval
                           WHEN 'week'  THEN date_trunc('week', d.day::timestamp)::date
                           WHEN 'month' THEN date_trunc('month', d.day::timestamp)::date
                           ELSE d.day END) = bk.b
        GROUP BY bk.b
        ORDER BY bk.b;
END $$;

-- Breakdown by one whitelisted dimension. share is relative to the visitor
-- total (hits total for event dimensions: not_found, download, outbound,
-- goal). total_rows is repeated on every row.
CREATE OR REPLACE FUNCTION analytics_breakdown(p_from text, p_to text, p_tz text, p_dimension text, p_filters jsonb,
                                               p_sort text, p_limit bigint, p_offset bigint)
RETURNS TABLE(value text, visitors bigint, pageviews bigint, visits bigint, conversions bigint,
              share double precision, total_rows bigint)
LANGUAGE plpgsql STABLE AS $$
#variable_conflict use_column
DECLARE
    v_hits_share boolean := p_dimension IN ('not_found', 'download', 'outbound', 'goal');
BEGIN
    IF NOT (p_dimension = ANY (analytics__dimensions())) THEN
        RAISE EXCEPTION 'analytics: unknown dimension "%"', p_dimension USING ERRCODE = '22023';
    END IF;
    RETURN QUERY
        WITH r AS (
            SELECT x.value AS v, sum(x.visitors)::bigint AS vis, sum(x.pageviews)::bigint AS pvs,
                   sum(x.visits)::bigint AS vts, sum(x.conversions)::bigint AS conv
            FROM analytics__day_dim(p_from::date, p_to::date, p_tz, p_dimension, p_filters) x
            GROUP BY x.value
        ),
        tot AS (SELECT sum(r.vis)::double precision AS tv, sum(r.pvs)::double precision AS tp, count(*)::bigint AS n FROM r)
        SELECT r.v, r.vis, r.pvs, r.vts, r.conv,
               coalesce(CASE WHEN v_hits_share THEN r.pvs / nullif(tot.tp, 0)
                             ELSE r.vis / nullif(tot.tv, 0) END, 0)::double precision,
               tot.n
        FROM r CROSS JOIN tot
        ORDER BY CASE coalesce(p_sort, 'visitors')
                     WHEN 'pageviews'   THEN r.pvs
                     WHEN 'visits'      THEN r.vts
                     WHEN 'conversions' THEN r.conv
                     ELSE r.vis END DESC,
                 r.pvs DESC, r.v
        LIMIT greatest(coalesce(p_limit, 10), 0) OFFSET greatest(coalesce(p_offset, 0), 0);
END $$;

-- Realtime snapshot of the last 30 minutes as one jsonb document.
CREATE OR REPLACE FUNCTION analytics_realtime(p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH base AS (
        SELECT e.ts, e.path, e.source, e.country, e.device, e.kind, e.visitor_id, e.entry,
               (e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed)) AS pv
        FROM analytics_events e WHERE e.ts >= now() - interval '30 minutes'
    ),
    mins AS (
        SELECT m FROM generate_series(date_trunc('minute', now()) - interval '29 minutes',
                                      date_trunc('minute', now()), interval '1 minute') m
    )
    SELECT jsonb_build_object(
        'visitors_5m', (SELECT count(DISTINCT b.visitor_id) + count(*) FILTER (WHERE b.visitor_id IS NULL AND b.entry)
                        FROM base b WHERE b.pv AND b.ts >= now() - interval '5 minutes'),
        'visitors_30m', (SELECT count(DISTINCT b.visitor_id) + count(*) FILTER (WHERE b.visitor_id IS NULL AND b.entry)
                         FROM base b WHERE b.pv),
        'pageviews_30m', (SELECT count(*) FROM base b WHERE b.pv),
        'per_minute', (SELECT jsonb_agg(jsonb_build_object(
                                 't', mins.m,
                                 'pageviews', (SELECT count(*) FROM base b
                                               WHERE b.pv AND b.ts >= mins.m AND b.ts < mins.m + interval '1 minute'))
                             ORDER BY mins.m) FROM mins),
        'recent', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                             'ts', r.ts, 'path', r.path, 'source', r.source, 'country', r.country,
                             'device', r.device, 'kind', r.kind) ORDER BY r.ts DESC), '[]'::jsonb)
                   FROM (SELECT * FROM base b WHERE b.pv OR b.kind <> 'pageview' ORDER BY b.ts DESC LIMIT 20) r),
        'top_pages', (SELECT coalesce(jsonb_agg(jsonb_build_object('value', p.path, 'visitors', p.v)
                                                ORDER BY p.v DESC, p.path), '[]'::jsonb)
                      FROM (SELECT b.path, count(DISTINCT b.visitor_id) + count(*) FILTER (WHERE b.visitor_id IS NULL) AS v
                            FROM base b WHERE b.pv GROUP BY b.path ORDER BY 2 DESC, 1 LIMIT 10) p)
    );
$$;

-- Hour-of-week heatmap (dow 0 = Monday) over raw events; always 168 cells.
CREATE OR REPLACE FUNCTION analytics_heatmap(p_from text, p_to text, p_tz text, p_filters jsonb)
RETURNS TABLE(dow bigint, hour bigint, pageviews bigint, visitors bigint)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_from_ts timestamptz := p_from::date::timestamp AT TIME ZONE p_tz;
    v_to_ts   timestamptz := (p_to::date + 1)::timestamp AT TIME ZONE p_tz;
BEGIN
    RETURN QUERY EXECUTE format($q$
        WITH base AS (
            SELECT (e.ts AT TIME ZONE %1$L) AS lt, e.visitor_id, e.entry
            FROM analytics_events e
            WHERE e.ts >= %2$L AND e.ts < %3$L AND e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed)%4$s
        ),
        cell AS (
            SELECT b.lt::date AS d, extract(isodow FROM b.lt)::int - 1 AS dw, extract(hour FROM b.lt)::int AS hr,
                   count(*) AS pvs,
                   count(DISTINCT b.visitor_id) + count(*) FILTER (WHERE b.visitor_id IS NULL AND b.entry) AS vis
            FROM base b GROUP BY 1, 2, 3
        ),
        agg AS (SELECT c.dw, c.hr, sum(c.pvs) AS pvs, sum(c.vis) AS vis FROM cell c GROUP BY 1, 2)
        SELECT g.dw::bigint, h.hr::bigint, coalesce(a.pvs, 0)::bigint, coalesce(a.vis, 0)::bigint
        FROM generate_series(0, 6) g(dw) CROSS JOIN generate_series(0, 23) h(hr)
        LEFT JOIN agg a ON a.dw = g.dw AND a.hr = h.hr
        ORDER BY 1, 2
    $q$, p_tz, v_from_ts, v_to_ts, analytics__filter_sql(p_filters, v_from_ts, v_to_ts));
END $$;

-- Bot counters for a day range as one jsonb document.
CREATE OR REPLACE FUNCTION analytics_bots(p_from text, p_to text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH b AS (SELECT * FROM analytics_bots_daily x WHERE x.day >= p_from::date AND x.day <= p_to::date)
    SELECT jsonb_build_object(
        'totals', (SELECT coalesce(jsonb_agg(jsonb_build_object('category', s.category, 'hits', s.hits)
                                             ORDER BY s.hits DESC, s.category), '[]'::jsonb)
                   FROM (SELECT b.category, sum(b.hits)::bigint AS hits FROM b GROUP BY 1) s),
        'timeseries', (SELECT coalesce(jsonb_agg(jsonb_build_object('t', to_char(s.day, 'YYYY-MM-DD'),
                                                                     'category', s.category, 'hits', s.hits)
                                                 ORDER BY s.day, s.category), '[]'::jsonb)
                       FROM (SELECT b.day, b.category, sum(b.hits)::bigint AS hits FROM b GROUP BY 1, 2) s),
        'top', (SELECT coalesce(jsonb_agg(jsonb_build_object('category', s.category, 'name', s.name, 'hits', s.hits)
                                          ORDER BY s.hits DESC, s.name), '[]'::jsonb)
                FROM (SELECT b.category, b.name, sum(b.hits)::bigint AS hits FROM b GROUP BY 1, 2
                      ORDER BY 3 DESC, 2 LIMIT 100) s)
    );
$$;

-- Per-goal conversions. conversion_rate = visits that converted on the
-- goal / all visits in range.
CREATE OR REPLACE FUNCTION analytics_goal_stats(p_from text, p_to text, p_tz text, p_filters jsonb)
RETURNS TABLE(id bigint, name text, conversions bigint, visitors bigint, conversion_rate double precision)
LANGUAGE sql STABLE AS $$
    WITH g AS (
        SELECT x.value AS v, sum(x.pageviews)::bigint AS conv, sum(x.visitors)::bigint AS vis,
               sum(x.visits)::bigint AS vts
        FROM analytics__day_dim(p_from::date, p_to::date, p_tz, 'goal', p_filters) x GROUP BY x.value
    ),
    t AS (SELECT coalesce(sum(x.visits), 0)::double precision AS visits
          FROM analytics__day_totals(p_from::date, p_to::date, p_tz, p_filters) x)
    SELECT ag.id, ag.name, coalesce(g.conv, 0)::bigint, coalesce(g.vis, 0)::bigint,
           coalesce(g.vts / nullif(t.visits, 0), 0)::double precision
    FROM analytics_goals ag CROSS JOIN t LEFT JOIN g ON g.v = ag.id::text
    ORDER BY coalesce(g.conv, 0) DESC, ag.id;
$$;

-- Outbound clicks per tracked-link slug in a day range.
CREATE OR REPLACE FUNCTION analytics_link_clicks(p_from text, p_to text, p_tz text)
RETURNS TABLE(slug text, clicks bigint) LANGUAGE sql STABLE AS $$
    SELECT x.value, sum(x.pageviews)::bigint
    FROM analytics__day_dim(p_from::date, p_to::date, p_tz, 'outbound', '{}'::jsonb) x
    GROUP BY x.value;
$$;

-- Raw event export with privacy-safe columns only (no visitor/session ids).
CREATE OR REPLACE FUNCTION analytics_export_events(p_from text, p_to text, p_tz text, p_filters jsonb, p_limit bigint)
RETURNS TABLE(ts timestamptz, kind text, path text, page_type text, entry boolean, referrer text, source text,
              channel text, utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
              country text, language text, device text, browser text, os text, target text, goal_id bigint,
              confirmed boolean, viewport text, color_scheme text)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_from_ts timestamptz := p_from::date::timestamp AT TIME ZONE p_tz;
    v_to_ts   timestamptz := (p_to::date + 1)::timestamp AT TIME ZONE p_tz;
BEGIN
    RETURN QUERY EXECUTE format($q$
        SELECT e.ts, e.kind, e.path, e.page_type, e.entry, e.referrer, e.source, e.channel, e.utm_source,
               e.utm_medium, e.utm_campaign, e.utm_content, e.utm_term, e.country, e.language, e.device,
               e.browser, e.os, e.target, e.goal_id, e.confirmed, e.viewport, e.color_scheme
        FROM analytics_events e
        WHERE e.ts >= %1$L AND e.ts < %2$L AND (e.kind <> 'pageview' OR NOT e.is_prefetch OR e.confirmed)%3$s
        ORDER BY e.ts
        LIMIT %4$s
    $q$, v_from_ts, v_to_ts, analytics__filter_sql(p_filters, v_from_ts, v_to_ts),
         greatest(least(coalesce(p_limit, 100000), 1000000), 1));
END $$;

-- Ingest health for the settings/status page.
CREATE OR REPLACE FUNCTION analytics_status(p_tz text)
RETURNS TABLE(records_today bigint, pageviews_today bigint, bots_today bigint, last_event_at timestamptz)
LANGUAGE sql STABLE AS $$
    WITH ev AS (
        SELECT e.ts, e.kind, e.is_prefetch, e.confirmed FROM analytics_events e
        WHERE e.ts >= (now() AT TIME ZONE p_tz)::date::timestamp AT TIME ZONE p_tz
    )
    SELECT (SELECT count(*) FROM ev)::bigint,
           (SELECT count(*) FROM ev WHERE ev.kind = 'pageview' AND (NOT ev.is_prefetch OR ev.confirmed))::bigint,
           (SELECT coalesce(sum(b.hits), 0) FROM analytics_bots_daily b
             WHERE b.day = (now() AT TIME ZONE p_tz)::date)::bigint,
           (SELECT max(ev.ts) FROM ev);
$$;

-- Down
-- DROP FUNCTION IF EXISTS analytics_status(text), analytics_export_events(...), ...;
