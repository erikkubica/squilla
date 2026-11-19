-- Click report v2: link-level clicks with the link text, sections named by
-- their heading and listed in page order, click rates per view (never above
-- 100%), and the links people see but never click.

ALTER TABLE analytics_page_elements ADD COLUMN IF NOT EXISTS pos INTEGER NOT NULL DEFAULT 0;

-- analytics_upsert_outline(path, outline_hash, [{kind, block_key, label, href, pos}])
CREATE OR REPLACE FUNCTION analytics_upsert_outline(p_path text, p_outline text, p_rows jsonb)
RETURNS TABLE(changed boolean) LANGUAGE plpgsql AS $$
DECLARE
    v_rows jsonb := p_rows;
BEGIN
    IF jsonb_typeof(v_rows) = 'string' THEN
        v_rows := (v_rows #>> '{}')::jsonb;
    END IF;
    IF v_rows IS NULL OR jsonb_typeof(v_rows) <> 'array' THEN
        RETURN QUERY SELECT false;
        RETURN;
    END IF;
    IF EXISTS (SELECT 1 FROM analytics_page_elements WHERE path = p_path AND outline = p_outline) THEN
        UPDATE analytics_page_elements SET last_seen = now() WHERE path = p_path AND outline = p_outline;
        RETURN QUERY SELECT false;
        RETURN;
    END IF;
    INSERT INTO analytics_page_elements (path, kind, block_key, label, href, outline, pos)
    SELECT DISTINCT ON (x.kind, left(coalesce(x.block_key, ''), 80), left(coalesce(x.href, ''), 300))
           p_path, x.kind, left(coalesce(x.block_key, ''), 80), left(coalesce(x.label, ''), 200),
           left(coalesce(x.href, ''), 300), p_outline, greatest(coalesce(x.pos, 0), 0)
    FROM jsonb_to_recordset(v_rows) AS x(kind text, block_key text, label text, href text, pos integer)
    WHERE x.kind IN ('block', 'link')
    -- The first occurrence on the page wins, but a labelled copy beats an
    -- empty one (an icon link before the text link to the same place).
    ORDER BY x.kind, left(coalesce(x.block_key, ''), 80), left(coalesce(x.href, ''), 300),
             (coalesce(x.label, '') = ''), coalesce(x.pos, 0)
    ON CONFLICT (path, kind, block_key, href)
    DO UPDATE SET label = EXCLUDED.label, outline = EXCLUDED.outline, pos = EXCLUDED.pos, last_seen = now();
    DELETE FROM analytics_page_elements WHERE path = p_path AND outline <> p_outline
        AND last_seen < now() - interval '30 days';
    RETURN QUERY SELECT true;
END $$;

-- Navigation zones (header, menu, footer, outside any block): their links are
-- expected to go unclicked on most views, so they never count as "ignored".
CREATE OR REPLACE FUNCTION analytics_is_nav_zone(p_key text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
    SELECT p_key IN ('h', 'n', 'f', 'x', '')
        OR p_key ~ '^p\..*(header|footer|nav|menu|topbar|top-bar|announcement|breadcrumb)';
$$;

CREATE OR REPLACE FUNCTION analytics_clicks_stats(p_from text, p_to text, p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    i AS (SELECT x.* FROM analytics_interactions x, rng WHERE x.ts >= rng.f AND x.ts < rng.t),
    c AS (SELECT * FROM i WHERE kind = 'click'),
    -- Views measured on each page: any in-page signal proves a real browser.
    pv AS (SELECT path, count(DISTINCT eid) AS views FROM i WHERE eid <> '' GROUP BY path),
    blk AS (SELECT path, block_key, label, pos FROM analytics_page_elements WHERE kind = 'block'),
    lnk AS (SELECT path, block_key, href, label, pos FROM analytics_page_elements WHERE kind = 'link'),
    seen AS (SELECT path, block_key, count(DISTINCT eid) AS n FROM i WHERE kind = 'section' GROUP BY path, block_key),
    clk AS (SELECT path, block_key, count(*) AS clicks, count(DISTINCT eid) AS views FROM c GROUP BY path, block_key),
    lclk AS (SELECT path, block_key, dest, value AS class, count(*) AS clicks, count(DISTINCT eid) AS views
             FROM c GROUP BY path, block_key, dest, value)
    SELECT jsonb_build_object(
        'totals', jsonb_build_object(
            'views', (SELECT count(DISTINCT eid) FROM i WHERE eid <> ''),
            'clicking_views', (SELECT count(DISTINCT eid) FROM c WHERE eid <> ''),
            'sections_seen', (SELECT count(*) FROM i WHERE kind = 'section'),
            'clicks', (SELECT count(*) FROM c),
            'nav_clicks', (SELECT count(*) FROM c WHERE analytics_is_nav_zone(block_key)),
            'contact_clicks', (SELECT count(*) FROM c WHERE value = 'c'),
            'outbound_clicks', (SELECT count(*) FROM c WHERE value = 'x')),
        'links', coalesce((SELECT jsonb_agg(row_to_json(l)::jsonb ORDER BY l.clicks DESC, l.views DESC)
            FROM (SELECT lc.path, lc.block_key, coalesce(b.label, '') AS section, coalesce(b.pos, 999) AS section_pos,
                         analytics_is_nav_zone(lc.block_key) AS nav,
                         coalesce(e.label, '') AS text, lc.dest, lc.class, lc.clicks, lc.views,
                         coalesce(pv.views, 0) AS page_views
                  FROM lclk lc
                  LEFT JOIN lnk e ON e.path = lc.path AND e.block_key = lc.block_key AND e.href = lc.dest
                  LEFT JOIN blk b ON b.path = lc.path AND b.block_key = lc.block_key
                  LEFT JOIN pv ON pv.path = lc.path
                  ORDER BY lc.clicks DESC, lc.views DESC LIMIT 150) l), '[]'::jsonb),
        'sections', coalesce((SELECT jsonb_agg(row_to_json(s)::jsonb ORDER BY s.path, s.pos, s.block_key)
            FROM (SELECT coalesce(s.path, k.path) AS path, coalesce(s.block_key, k.block_key) AS block_key,
                         coalesce(b.label, '') AS label, coalesce(b.pos, 999) AS pos,
                         analytics_is_nav_zone(coalesce(s.block_key, k.block_key)) AS nav,
                         coalesce(s.n, 0) AS seen, coalesce(k.views, 0) AS clicked, coalesce(k.clicks, 0) AS clicks,
                         (SELECT count(*) FROM lnk e WHERE e.path = coalesce(s.path, k.path)
                              AND e.block_key = coalesce(s.block_key, k.block_key)) AS links
                  FROM seen s FULL JOIN clk k ON k.path = s.path AND k.block_key = s.block_key
                  LEFT JOIN blk b ON b.path = coalesce(s.path, k.path) AND b.block_key = coalesce(s.block_key, k.block_key)
                  ORDER BY coalesce(s.n, 0) + coalesce(k.views, 0) DESC LIMIT 300) s), '[]'::jsonb),
        -- Links in sections people saw at least 5 times that nobody clicked.
        'ignored', coalesce((SELECT jsonb_agg(row_to_json(g)::jsonb ORDER BY g.seen DESC, g.path, g.pos)
            FROM (SELECT e.path, e.block_key, coalesce(b.label, '') AS section, e.label AS text, e.href AS dest,
                         e.pos, s.n AS seen
                  FROM lnk e
                  JOIN seen s ON s.path = e.path AND s.block_key = e.block_key AND s.n >= 5
                  LEFT JOIN blk b ON b.path = e.path AND b.block_key = e.block_key
                  WHERE NOT analytics_is_nav_zone(e.block_key)
                    AND NOT EXISTS (SELECT 1 FROM c WHERE c.path = e.path AND c.block_key = e.block_key AND c.dest = e.href)
                  ORDER BY s.n DESC LIMIT 40) g), '[]'::jsonb),
        'pages', coalesce((SELECT jsonb_agg(row_to_json(p)::jsonb ORDER BY p.views DESC)
            FROM (SELECT pv.path, pv.views,
                         (SELECT count(DISTINCT eid) FROM c WHERE c.path = pv.path AND eid <> '') AS clicking_views,
                         (SELECT count(*) FROM c WHERE c.path = pv.path) AS clicks
                  FROM pv ORDER BY pv.views DESC LIMIT 40) p), '[]'::jsonb),
        'destinations', coalesce((SELECT jsonb_agg(row_to_json(d)::jsonb ORDER BY d.clicks DESC)
            FROM (SELECT c.dest, c.value AS class, count(*) AS clicks, count(DISTINCT c.eid) AS views,
                         mode() WITHIN GROUP (ORDER BY c.path) AS top_page
                  FROM c WHERE c.value IN ('x','c') AND c.dest <> ''
                  GROUP BY c.dest, c.value ORDER BY 3 DESC LIMIT 30) d), '[]'::jsonb)
    );
$$;

-- Page report: sections and links in page order.
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
        'blocks', coalesce((SELECT jsonb_agg(row_to_json(b)::jsonb ORDER BY b.pos, b.block_key)
            FROM (SELECT s.block_key,
                         coalesce(max(el.label), '') AS label,
                         coalesce(min(el.pos), 999) AS pos,
                         count(DISTINCT s.eid) AS seen,
                         (SELECT count(*) FROM inter c WHERE c.kind = 'click' AND c.block_key = s.block_key) AS clicks,
                         (SELECT count(DISTINCT c.eid) FROM inter c WHERE c.kind = 'click' AND c.block_key = s.block_key) AS clicked
                  FROM inter s LEFT JOIN analytics_page_elements el
                       ON el.path = p_path AND el.kind = 'block' AND el.block_key = s.block_key
                  WHERE s.kind = 'section' GROUP BY s.block_key) b), '[]'::jsonb),
        'links', coalesce((SELECT jsonb_agg(row_to_json(l)::jsonb ORDER BY l.clicks DESC, l.pos, l.href)
            FROM (SELECT el.block_key, el.label, el.href, el.pos,
                         coalesce(bl.label, '') AS section,
                         analytics_is_nav_zone(el.block_key) AS nav,
                         (SELECT count(*) FROM inter c WHERE c.kind = 'click' AND c.block_key = el.block_key AND c.dest = el.href) AS clicks
                  FROM analytics_page_elements el
                  LEFT JOIN analytics_page_elements bl ON bl.path = p_path AND bl.kind = 'block' AND bl.block_key = el.block_key
                  WHERE el.path = p_path AND el.kind = 'link') l), '[]'::jsonb),
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
