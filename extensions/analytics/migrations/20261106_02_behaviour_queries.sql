-- Up
-- Read side of the behaviour tables. Each function returns one jsonb
-- document so the plugin can pass it straight to the admin UI.

CREATE OR REPLACE FUNCTION analytics_exit_stats(p_from text, p_to text, p_tz text, p_filters jsonb)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH v AS (
        SELECT * FROM analytics_visits x
        WHERE x.day >= p_from::date AND x.day <= p_to::date
          AND (p_filters->>'channel' IS NULL OR x.channel = p_filters->>'channel')
          AND (p_filters->>'device'  IS NULL OR x.device  = p_filters->>'device')
          AND (p_filters->>'country' IS NULL OR x.country = p_filters->>'country')
          AND (p_filters->>'entry_page' IS NULL OR x.entry_path = p_filters->>'entry_page')
    ),
    total AS (SELECT count(*)::bigint AS n FROM v)
    SELECT jsonb_build_object(
        'total', (SELECT n FROM total),
        'ambiguous', (SELECT count(*) FROM v WHERE flags LIKE '%exit_ambiguous%'),
        'reasons', coalesce((SELECT jsonb_agg(jsonb_build_object('reason', r.exit_reason, 'visits', r.n) ORDER BY r.n DESC)
                   FROM (SELECT exit_reason, count(*) AS n FROM v GROUP BY exit_reason) r), '[]'::jsonb),
        'by_day', coalesce((SELECT jsonb_agg(jsonb_build_object('day', d.day, 'reason', d.exit_reason, 'visits', d.n) ORDER BY d.day, d.exit_reason)
                   FROM (SELECT day, exit_reason, count(*) AS n FROM v GROUP BY day, exit_reason) d), '[]'::jsonb),
        'by_channel', coalesce((SELECT jsonb_agg(jsonb_build_object('value', c.channel, 'reason', c.exit_reason, 'visits', c.n) ORDER BY c.n DESC)
                   FROM (SELECT channel, exit_reason, count(*) AS n FROM v GROUP BY channel, exit_reason) c), '[]'::jsonb),
        'by_device', coalesce((SELECT jsonb_agg(jsonb_build_object('value', c.device, 'reason', c.exit_reason, 'visits', c.n) ORDER BY c.n DESC)
                   FROM (SELECT device, exit_reason, count(*) AS n FROM v GROUP BY device, exit_reason) c), '[]'::jsonb),
        'failing_pages', coalesce((SELECT jsonb_agg(row_to_json(f)::jsonb ORDER BY f.bad DESC, f.visits DESC)
                   FROM (SELECT entry_path AS path, count(*) AS visits,
                                count(*) FILTER (WHERE exit_reason IN ('quick_exit','hit_error')) AS bad,
                                round((count(*) FILTER (WHERE exit_reason IN ('quick_exit','hit_error')))::numeric / count(*), 4) AS bad_rate
                         FROM v WHERE pageviews = 1 GROUP BY entry_path HAVING count(*) >= 3
                         ORDER BY 3 DESC, 2 DESC LIMIT 20) f), '[]'::jsonb),
        'destinations', coalesce((SELECT jsonb_agg(row_to_json(d)::jsonb ORDER BY d.visits DESC)
                   FROM (SELECT outbound AS dest, exit_reason AS reason, count(*) AS visits FROM v
                         WHERE outbound <> '' AND exit_reason IN ('left_to_contact','left_to_partner')
                         GROUP BY outbound, exit_reason ORDER BY 3 DESC LIMIT 20) d), '[]'::jsonb),
        'median_exit_dwell_s', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY exit_dwell_s) FROM v WHERE exit_dwell_s > 0)
    );
$$;

CREATE OR REPLACE FUNCTION analytics_page_insights(p_path text, p_from text, p_to text, p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    pv AS (
        SELECT e.*, lead(e.path) OVER w AS next_path, lead(e.ts) OVER w AS next_ts
        FROM analytics_events e, rng
        WHERE e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed) AND e.ts >= rng.f AND e.ts < rng.t
        WINDOW w AS (PARTITION BY e.session_id ORDER BY e.ts)
    ),
    here AS (SELECT * FROM pv WHERE path = p_path),
    act AS (SELECT eid FROM here WHERE confirmed),
    inter AS (
        SELECT i.* FROM analytics_interactions i, rng WHERE i.path = p_path AND i.ts >= rng.f AND i.ts < rng.t
    ),
    vis AS (
        SELECT x.* FROM analytics_visits x WHERE x.day >= p_from::date AND x.day <= p_to::date
    )
    SELECT jsonb_build_object(
        'path', p_path,
        'views', (SELECT count(*) FROM here),
        'entrances', (SELECT count(*) FROM here WHERE entry),
        'activated_views', (SELECT count(*) FROM act),
        'exits', (SELECT count(*) FROM vis WHERE exit_path = p_path),
        'visits_including', (SELECT count(DISTINCT session_id) FROM here WHERE session_id IS NOT NULL),
        'quick_exits', (SELECT count(*) FROM vis WHERE exit_path = p_path AND exit_reason = 'quick_exit'),
        'conversions', (SELECT count(*) FROM vis WHERE converted AND paths ? p_path),
        'median_view_s', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM next_ts - ts))
                          FROM here WHERE next_ts IS NOT NULL AND next_ts - ts < interval '30 minutes'),
        'blocks', coalesce((SELECT jsonb_agg(row_to_json(b)::jsonb ORDER BY b.block_key)
            FROM (SELECT s.block_key,
                         coalesce(max(el.label), '') AS label,
                         count(DISTINCT s.eid) AS seen,
                         (SELECT count(*) FROM inter c WHERE c.kind = 'click' AND c.block_key = s.block_key) AS clicks
                  FROM inter s LEFT JOIN analytics_page_elements el
                       ON el.path = p_path AND el.kind = 'block' AND el.block_key = s.block_key
                  WHERE s.kind = 'section' GROUP BY s.block_key) b), '[]'::jsonb),
        'links', coalesce((SELECT jsonb_agg(row_to_json(l)::jsonb ORDER BY l.clicks DESC, l.block_key, l.href)
            FROM (SELECT el.block_key, el.label, el.href,
                         (SELECT count(*) FROM inter c WHERE c.kind = 'click' AND c.block_key = el.block_key AND c.dest = el.href) AS clicks
                  FROM analytics_page_elements el WHERE el.path = p_path AND el.kind = 'link') l), '[]'::jsonb),
        'stay', coalesce((SELECT jsonb_agg(jsonb_build_object('sec', d.sec, 'views', d.n) ORDER BY d.sec)
            FROM (SELECT value::int AS sec, count(DISTINCT eid) AS n FROM inter
                  WHERE kind = 'dwell' AND value ~ '^[0-9]{1,6}$' GROUP BY value::int) d), '[]'::jsonb),
        'came_from', coalesce((SELECT jsonb_agg(row_to_json(f)::jsonb ORDER BY f.n DESC)
            FROM (SELECT CASE WHEN prev_path = '' THEN '(entry / external)' ELSE prev_path END AS path, count(*) AS n
                  FROM here GROUP BY 1 ORDER BY 2 DESC LIMIT 10) f), '[]'::jsonb),
        'went_to', coalesce((SELECT jsonb_agg(row_to_json(f)::jsonb ORDER BY f.n DESC)
            FROM (SELECT coalesce(next_path, '(exit)') AS path, count(*) AS n
                  FROM here GROUP BY 1 ORDER BY 2 DESC LIMIT 10) f), '[]'::jsonb),
        'exit_reasons', coalesce((SELECT jsonb_agg(row_to_json(r)::jsonb ORDER BY r.n DESC)
            FROM (SELECT exit_reason AS reason, count(*) AS n FROM vis WHERE exit_path = p_path GROUP BY 1) r), '[]'::jsonb)
    );
$$;

CREATE OR REPLACE FUNCTION analytics_clicks_stats(p_from text, p_to text, p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    i AS (SELECT x.* FROM analytics_interactions x, rng WHERE x.ts >= rng.f AND x.ts < rng.t),
    seen AS (SELECT path, block_key, count(DISTINCT eid) AS n FROM i WHERE kind = 'section' GROUP BY path, block_key),
    clk AS (SELECT path, block_key, count(*) AS n,
                   count(*) FILTER (WHERE value IN ('x','c')) AS outbound FROM i WHERE kind = 'click' GROUP BY path, block_key)
    SELECT jsonb_build_object(
        'blocks', coalesce((SELECT jsonb_agg(row_to_json(b)::jsonb ORDER BY b.clicks DESC, b.seen DESC)
            FROM (SELECT coalesce(s.path, c.path) AS path, coalesce(s.block_key, c.block_key) AS block_key,
                         coalesce(el.label, '') AS label,
                         coalesce(s.n, 0) AS seen, coalesce(c.n, 0) AS clicks, coalesce(c.outbound, 0) AS outbound,
                         CASE WHEN coalesce(s.n, 0) > 0 THEN round(coalesce(c.n, 0)::numeric / s.n, 4) END AS ctr
                  FROM seen s FULL JOIN clk c ON c.path = s.path AND c.block_key = s.block_key
                  LEFT JOIN analytics_page_elements el ON el.path = coalesce(s.path, c.path) AND el.kind = 'block'
                       AND el.block_key = coalesce(s.block_key, c.block_key)
                  ORDER BY 5 DESC, 4 DESC LIMIT 100) b), '[]'::jsonb),
        'destinations', coalesce((SELECT jsonb_agg(row_to_json(d)::jsonb ORDER BY d.clicks DESC)
            FROM (SELECT dest, value AS class, count(*) AS clicks,
                         (array_agg(path ORDER BY path))[1] AS top_page
                  FROM i WHERE kind = 'click' AND value IN ('x','c') AND dest <> ''
                  GROUP BY dest, value ORDER BY 3 DESC LIMIT 30) d), '[]'::jsonb),
        'totals', jsonb_build_object(
            'sections_seen', (SELECT count(*) FROM i WHERE kind = 'section'),
            'clicks', (SELECT count(*) FROM i WHERE kind = 'click'),
            'outbound_clicks', (SELECT count(*) FROM i WHERE kind = 'click' AND value IN ('x','c')))
    );
$$;

-- Overview tiles: engaged visits, median view time, average reach, CTR.
CREATE OR REPLACE FUNCTION analytics_behaviour_summary(p_from text, p_to text, p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    v AS (SELECT * FROM analytics_visits WHERE day >= p_from::date AND day <= p_to::date),
    i AS (SELECT x.* FROM analytics_interactions x, rng WHERE x.ts >= rng.f AND x.ts < rng.t)
    SELECT jsonb_build_object(
        'visits', (SELECT count(*) FROM v),
        'engaged', (SELECT count(*) FROM v WHERE pageviews >= 2 OR converted OR exit_dwell_s >= 10 OR end_reached),
        'single_page_known', (SELECT count(*) FROM v WHERE exit_reason = 'single_page'),
        'median_exit_dwell_s', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY exit_dwell_s) FROM v WHERE exit_dwell_s > 0),
        'avg_reach', (SELECT round(avg(reach)::numeric, 2) FROM v WHERE reach > 0),
        'sections_seen', (SELECT count(*) FROM i WHERE kind = 'section'),
        'clicks', (SELECT count(*) FROM i WHERE kind = 'click'),
        'signals', (SELECT count(*) FROM i)
    );
$$;
