-- Up
-- Site search: the term a visitor searched for on the site (?q=, ?s=, ...),
-- extracted on the server from the page view's query string. Terms that
-- look like an email address or a phone number are never stored.
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS search TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION analytics__dimensions() RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
    SELECT ARRAY['page','entry_page','exit_page','source','channel','referrer',
                 'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
                 'country','language','device','browser','os','page_type',
                 'not_found','download','outbound','goal','viewport','color_scheme','search']::text[];
$$;

CREATE OR REPLACE FUNCTION analytics__raw_dim(p_from_ts timestamptz, p_to_ts timestamptz, p_tz text, p_dim text, p_where text)
RETURNS TABLE(day date, value text, visitors bigint, pageviews bigint, visits bigint, conversions bigint)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_base   text := analytics__base_sql(p_from_ts, p_to_ts, p_tz, p_where);
    v_val    text;
    v_rf     text;
    v_hits   text := 'b.pv';
    v_join   text := '';
    v_having text := '';
    v_visits text;
BEGIN
    IF p_dim = 'exit_page' THEN
        RETURN QUERY EXECUTE format($q$
            WITH base AS (%s),
            s AS (SELECT DISTINCT ON (b.session_id) b.session_id, b.visitor_id, b.d, b.path
                  FROM base b WHERE b.pv AND b.session_id IS NOT NULL
                  ORDER BY b.session_id, b.ts DESC),
            c AS (SELECT DISTINCT b.session_id FROM base b WHERE b.kind = 'goal' AND b.session_id IS NOT NULL)
            SELECT s.d, s.path, count(DISTINCT s.visitor_id), count(*), count(*),
                   count(*) FILTER (WHERE c.session_id IS NOT NULL)
            FROM s LEFT JOIN c ON c.session_id = s.session_id
            GROUP BY s.d, s.path
        $q$, v_base);
        RETURN;
    END IF;

    IF p_dim = 'page' THEN
        v_val := 'b.path'; v_rf := '(b.pv OR b.kind = ''goal'')';
        v_having := ' HAVING count(*) FILTER (WHERE b.pv) > 0';
    ELSIF p_dim = 'page_type' THEN
        v_val := 'b.page_type'; v_rf := 'b.pv';
    ELSIF p_dim = 'entry_page' THEN
        v_val := 'en.entry_path'; v_rf := '(b.pv OR b.kind = ''goal'')';
        v_join := ' JOIN (SELECT DISTINCT ON (x.session_id) x.session_id AS sid, x.path AS entry_path'
                  ' FROM base x WHERE x.pv AND x.entry AND x.session_id IS NOT NULL'
                  ' ORDER BY x.session_id, x.ts) en ON en.sid = b.session_id';
    ELSIF p_dim IN ('source','channel','referrer','utm_source','utm_medium','utm_campaign',
                    'utm_content','utm_term','country','language','device','browser','os') THEN
        v_val := format('b.%I', p_dim); v_rf := '(b.pv OR b.kind = ''goal'')';
    ELSIF p_dim IN ('viewport','color_scheme') THEN
        v_val := format('b.%I', p_dim); v_rf := format('b.pv AND b.confirmed AND b.%I <> ''''', p_dim);
    ELSIF p_dim = 'search' THEN
        -- Page-level: every search counts, also several in one visit.
        v_val := 'b.search'; v_rf := 'b.pv AND b.search <> ''''';
        v_visits := 'count(DISTINCT b.session_id) + count(*) FILTER (WHERE b.session_id IS NULL)';
    ELSIF p_dim IN ('not_found','download') THEN
        v_val := 'b.path'; v_rf := format('b.kind = %L', p_dim); v_hits := 'true';
    ELSIF p_dim = 'outbound' THEN
        v_val := 'b.target'; v_rf := 'b.kind = ''outbound'''; v_hits := 'true';
    ELSIF p_dim = 'goal' THEN
        v_val := 'b.goal_id::text'; v_rf := 'b.kind = ''goal'' AND b.goal_id IS NOT NULL'; v_hits := 'true';
    ELSE
        RAISE EXCEPTION 'analytics: unknown dimension "%"', p_dim USING ERRCODE = '22023';
    END IF;

    -- Session-level dimensions (source, campaign, entry page, …) count a
    -- visit once, on its entry pageview. Page-level dimensions count every
    -- visit that viewed the page, so visits ≤ visitors never inverts.
    IF v_visits IS NOT NULL THEN
        NULL;
    ELSIF p_dim IN ('page', 'page_type') THEN
        v_visits := 'count(DISTINCT b.session_id) FILTER (WHERE b.pv) + count(*) FILTER (WHERE b.pv AND b.session_id IS NULL)';
    ELSIF v_hits = 'b.pv' THEN
        v_visits := 'count(*) FILTER (WHERE b.pv AND b.entry)';
    ELSE
        v_visits := 'count(DISTINCT b.session_id) + count(*) FILTER (WHERE b.session_id IS NULL)';
    END IF;

    RETURN QUERY EXECUTE format($q$
        WITH base AS (%1$s)
        SELECT b.d, coalesce(%2$s, ''),
               count(DISTINCT b.visitor_id) FILTER (WHERE %4$s)
                 + count(*) FILTER (WHERE %4$s AND b.visitor_id IS NULL AND (b.entry OR b.kind <> 'pageview')),
               count(*) FILTER (WHERE %4$s),
               %5$s,
               count(*) FILTER (WHERE b.kind = 'goal')
        FROM base b%3$s
        WHERE %6$s
        GROUP BY 1, 2%7$s
    $q$, v_base, v_val, v_join, v_hits, v_visits, v_rf, v_having);
END $$;

CREATE OR REPLACE FUNCTION analytics_ingest(p_events jsonb)
RETURNS TABLE(inserted bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_events jsonb := p_events;
    v_n      bigint;
BEGIN
    IF jsonb_typeof(v_events) = 'string' THEN
        v_events := (v_events #>> '{}')::jsonb;
    END IF;
    IF v_events IS NULL OR jsonb_typeof(v_events) <> 'array' THEN
        RETURN QUERY SELECT 0::bigint;
        RETURN;
    END IF;
    INSERT INTO analytics_events (ts, eid, kind, host, path, page_type, node_id, visitor_id, session_id, entry,
        referrer, source, channel, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        click_gclid, click_msclkid, click_fbclid, click_ttclid, country, language, device, browser, os,
        target, goal_id, is_prefetch, confirmed, viewport, color_scheme, printed,
        prev_path, server_ms, spec, cached, search)
    SELECT x.ts, coalesce(x.eid, ''), x.kind, coalesce(x.host, ''), coalesce(x.path, ''),
        coalesce(x.page_type, ''), coalesce(x.node_id, 0), nullif(x.visitor_id, ''), nullif(x.session_id, ''),
        coalesce(x.entry, false), coalesce(x.referrer, ''), coalesce(x.source, ''), coalesce(nullif(x.channel, ''), 'direct'),
        coalesce(x.utm_source, ''), coalesce(x.utm_medium, ''), coalesce(x.utm_campaign, ''),
        coalesce(x.utm_content, ''), coalesce(x.utm_term, ''),
        coalesce(x.click_gclid, false), coalesce(x.click_msclkid, false), coalesce(x.click_fbclid, false),
        coalesce(x.click_ttclid, false), coalesce(x.country, ''), coalesce(x.language, ''), coalesce(x.device, ''),
        coalesce(x.browser, ''), coalesce(x.os, ''), coalesce(x.target, ''), nullif(x.goal_id, 0),
        coalesce(x.is_prefetch, false), coalesce(x.confirmed, false), coalesce(x.viewport, ''),
        coalesce(x.color_scheme, ''), coalesce(x.printed, false),
        coalesce(x.prev_path, ''), coalesce(x.server_ms, 0), coalesce(x.spec, ''), coalesce(x.cached, false), coalesce(x.search, '')
    FROM jsonb_to_recordset(v_events) AS x(ts timestamptz, eid text, kind text, host text, path text,
        page_type text, node_id bigint, visitor_id text, session_id text, entry boolean, referrer text,
        source text, channel text, utm_source text, utm_medium text, utm_campaign text, utm_content text,
        utm_term text, click_gclid boolean, click_msclkid boolean, click_fbclid boolean, click_ttclid boolean,
        country text, language text, device text, browser text, os text, target text, goal_id bigint,
        is_prefetch boolean, confirmed boolean, viewport text, color_scheme text, printed boolean,
        prev_path text, server_ms integer, spec text, cached boolean, search text)
    WHERE x.ts IS NOT NULL AND x.kind IN ('pageview','not_found','download','outbound','goal','form_error');
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_search_stats(from, to, tz): searches, searchers, the share of
-- visits that searched, top terms, terms searched from each page, and what
-- people did next (left, refined, or went to a page).
CREATE OR REPLACE FUNCTION analytics_search_stats(p_from text, p_to text, p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    pv AS (
        SELECT e.ts, e.session_id, e.visitor_id, e.path, e.search, e.prev_path
        FROM analytics_events e, rng
        WHERE e.ts >= rng.f AND e.ts < rng.t AND e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed)
    ),
    s AS (
        SELECT p.*, lower(p.search) AS term,
               (SELECT n.path FROM pv n WHERE n.session_id = p.session_id AND n.ts > p.ts ORDER BY n.ts LIMIT 1) AS next_path,
               (SELECT n.search FROM pv n WHERE n.session_id = p.session_id AND n.ts > p.ts ORDER BY n.ts LIMIT 1) AS next_search
        FROM pv p WHERE p.search <> '' AND p.session_id IS NOT NULL
    )
    SELECT jsonb_build_object(
        'totals', jsonb_build_object(
            'searches', (SELECT count(*) FROM s),
            'searchers', (SELECT count(DISTINCT visitor_id) FROM s),
            'search_visits', (SELECT count(DISTINCT session_id) FROM s),
            'visits', (SELECT count(DISTINCT session_id) FROM pv WHERE session_id IS NOT NULL),
            'exits', (SELECT count(*) FROM s WHERE next_path IS NULL),
            'refinements', (SELECT count(*) FROM s WHERE next_search <> '')),
        'terms', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.searches DESC, x.term)
            FROM (SELECT term, count(*) AS searches, count(DISTINCT visitor_id) AS searchers,
                         count(*) FILTER (WHERE next_path IS NULL) AS exits,
                         count(*) FILTER (WHERE next_search <> '') AS refined,
                         (SELECT n FROM (SELECT next_path AS n, count(*) AS c FROM s s2
                                         WHERE s2.term = s.term AND s2.next_path IS NOT NULL AND s2.next_search = ''
                                         GROUP BY 1 ORDER BY 2 DESC LIMIT 1) z) AS top_next
                  FROM s GROUP BY term ORDER BY 2 DESC, 1 LIMIT 100) x), '[]'::jsonb),
        'from_pages', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.searches DESC)
            FROM (SELECT coalesce(nullif(prev_path, ''), '(start of visit)') AS path, count(*) AS searches
                  FROM s GROUP BY 1 ORDER BY 2 DESC LIMIT 20) x), '[]'::jsonb)
    );
$$;
