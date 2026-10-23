-- Up
-- Core analytics functions: filters, per-day aggregation (raw + hybrid with
-- rollups), ingest, beacon confirm, rollup and purge. All CREATE OR REPLACE,
-- so re-applying the file is a no-op. Functions called through DataCall
-- (the analytics_* names without a double underscore) return only text,
-- bigint, double precision, boolean, timestamptz or jsonb columns.
-- Internal helpers use the analytics__ prefix and are not DataCall-able.

-- Every breakdown dimension, in rollup order.
CREATE OR REPLACE FUNCTION analytics__dimensions() RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
    SELECT ARRAY['page','entry_page','exit_page','source','channel','referrer',
                 'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
                 'country','language','device','browser','os','page_type',
                 'not_found','download','outbound','goal','viewport','color_scheme']::text[];
$$;

-- analytics__filter_sql turns {"dim": "value", ...} into " AND ..." SQL
-- fragments against alias e. Keys are whitelisted; values are quoted with
-- %L. Session-level filters (entry_page, goal) restrict to sessions that
-- matched within the same time window.
CREATE OR REPLACE FUNCTION analytics__filter_sql(p_filters jsonb, p_from_ts timestamptz, p_to_ts timestamptz)
RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE
    r     record;
    v_sql text := '';
BEGIN
    IF p_filters IS NULL OR jsonb_typeof(p_filters) <> 'object' THEN
        RETURN '';
    END IF;
    FOR r IN SELECT f.key, f.value FROM jsonb_each_text(p_filters) f ORDER BY f.key LOOP
        IF r.key = 'page' THEN
            v_sql := v_sql || format(' AND e.path = %L', r.value);
        ELSIF r.key IN ('source','channel','referrer','utm_source','utm_medium','utm_campaign',
                        'utm_content','utm_term','country','language','device','browser','os','page_type') THEN
            v_sql := v_sql || format(' AND e.%I = %L', r.key, coalesce(r.value, ''));
        ELSIF r.key = 'entry_page' THEN
            v_sql := v_sql || format(
                ' AND e.session_id IN (SELECT x.session_id FROM analytics_events x WHERE x.ts >= %L AND x.ts < %L'
                ' AND x.kind = ''pageview'' AND x.entry AND x.session_id IS NOT NULL AND x.path = %L)',
                p_from_ts, p_to_ts, r.value);
        ELSIF r.key = 'goal' THEN
            v_sql := v_sql || format(
                ' AND e.session_id IN (SELECT x.session_id FROM analytics_events x WHERE x.ts >= %L AND x.ts < %L'
                ' AND x.kind = ''goal'' AND x.session_id IS NOT NULL AND x.goal_id::text = %L)',
                p_from_ts, p_to_ts, r.value);
        ELSE
            RAISE EXCEPTION 'analytics: unknown filter "%"', r.key USING ERRCODE = '22023';
        END IF;
    END LOOP;
    RETURN v_sql;
END $$;

-- analytics__base_sql is the shared event scan: adds local day d and the
-- counted-pageview flag pv (prefetches count only once confirmed).
CREATE OR REPLACE FUNCTION analytics__base_sql(p_from_ts timestamptz, p_to_ts timestamptz, p_tz text, p_where text)
RETURNS text LANGUAGE sql STABLE AS $$
    SELECT format(
        'SELECT e.*, (e.ts AT TIME ZONE %L)::date AS d,'
        ' (e.kind = ''pageview'' AND (NOT e.is_prefetch OR e.confirmed)) AS pv'
        ' FROM analytics_events e WHERE e.ts >= %L AND e.ts < %L%s',
        p_tz, p_from_ts, p_to_ts, coalesce(p_where, ''));
$$;

-- Per-day totals from raw events. Visitors = distinct daily visitor ids
-- plus GPC (id-less) entries. Session metrics are attributed to the day the
-- session's first event falls on and only count sessions whose entry is in
-- range.
CREATE OR REPLACE FUNCTION analytics__raw_totals(p_from_ts timestamptz, p_to_ts timestamptz, p_tz text, p_where text)
RETURNS TABLE(day date, visitors bigint, pageviews bigint, visits bigint, conversions bigint,
              single_page_visits bigint, multi_page_visits bigint, median_visit_seconds double precision,
              converting_visits bigint)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY EXECUTE format($q$
        WITH base AS (%s),
        daily AS (
            SELECT b.d,
                   count(DISTINCT b.visitor_id) FILTER (WHERE b.pv)
                     + count(*) FILTER (WHERE b.pv AND b.visitor_id IS NULL AND b.entry) AS vis,
                   count(*) FILTER (WHERE b.pv) AS pvs,
                   count(*) FILTER (WHERE b.pv AND b.entry) AS vts,
                   count(*) FILTER (WHERE b.kind = 'goal') AS conv,
                   count(*) FILTER (WHERE b.kind = 'goal' AND b.session_id IS NULL) AS anon_conv
            FROM base b GROUP BY b.d
        ),
        sess AS (
            SELECT b.session_id, min(b.d) AS d,
                   count(*) FILTER (WHERE b.pv) AS n,
                   extract(epoch FROM max(b.ts) FILTER (WHERE b.pv) - min(b.ts) FILTER (WHERE b.pv))::double precision AS secs,
                   bool_or(b.kind = 'goal') AS conv,
                   bool_or(b.pv AND b.entry) AS has_entry
            FROM base b WHERE b.session_id IS NOT NULL GROUP BY b.session_id
        ),
        sd AS (
            SELECT s.d,
                   count(*) FILTER (WHERE s.has_entry AND s.n = 1) AS single,
                   count(*) FILTER (WHERE s.has_entry AND s.n > 1) AS multi,
                   percentile_cont(0.5) WITHIN GROUP (ORDER BY s.secs) FILTER (WHERE s.has_entry AND s.n > 1) AS med,
                   count(*) FILTER (WHERE s.has_entry AND s.conv) AS conv
            FROM sess s GROUP BY s.d
        )
        SELECT dl.d, dl.vis, dl.pvs, dl.vts, dl.conv,
               coalesce(sd.single, 0)::bigint, coalesce(sd.multi, 0)::bigint, sd.med::double precision,
               (coalesce(sd.conv, 0) + dl.anon_conv)::bigint
        FROM daily dl LEFT JOIN sd ON sd.d = dl.d
        ORDER BY dl.d
    $q$, analytics__base_sql(p_from_ts, p_to_ts, p_tz, p_where));
END $$;

-- Per-day rows for one dimension from raw events.
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
    IF p_dim IN ('page', 'page_type') THEN
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

-- analytics__rolled reports whether a local day is served from rollups:
-- it must be complete (before today in p_tz) and have a 'total' row.
CREATE OR REPLACE FUNCTION analytics__rolled(p_day date, p_tz text)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT p_day < (now() AT TIME ZONE p_tz)::date
       AND EXISTS (SELECT 1 FROM analytics_daily a WHERE a.dimension = 'total' AND a.day = p_day);
$$;

-- First day of [p_from, p_to] that is not served from rollups (NULL when
-- every day is). Raw events are scanned from there and only the days that
-- are not rolled up are kept.
CREATE OR REPLACE FUNCTION analytics__raw_from(p_from date, p_to date, p_tz text)
RETURNS date LANGUAGE sql STABLE AS $$
    SELECT min(g.d::date)
    FROM generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') g(d)
    WHERE NOT analytics__rolled(g.d::date, p_tz);
$$;

-- Hybrid per-day totals: filtered → raw only; unfiltered → rollups for
-- complete, rolled-up days and raw events for the rest.
CREATE OR REPLACE FUNCTION analytics__day_totals(p_from date, p_to date, p_tz text, p_filters jsonb)
RETURNS TABLE(day date, visitors bigint, pageviews bigint, visits bigint, conversions bigint,
              single_page_visits bigint, multi_page_visits bigint, median_visit_seconds double precision,
              converting_visits bigint)
LANGUAGE plpgsql STABLE AS $$
#variable_conflict use_column
DECLARE
    v_from_ts  timestamptz := p_from::timestamp AT TIME ZONE p_tz;
    v_to_ts    timestamptz := (p_to + 1)::timestamp AT TIME ZONE p_tz;
    v_where    text := analytics__filter_sql(p_filters, v_from_ts, v_to_ts);
    v_raw_from date;
BEGIN
    IF v_where <> '' THEN
        RETURN QUERY SELECT * FROM analytics__raw_totals(v_from_ts, v_to_ts, p_tz, v_where);
        RETURN;
    END IF;
    v_raw_from := analytics__raw_from(p_from, p_to, p_tz);
    RETURN QUERY
        SELECT a.day, a.visitors, a.pageviews, a.visits, a.conversions, a.single_page_visits,
               a.multi_page_visits, a.median_visit_seconds, a.converting_visits
        FROM analytics_daily a
        WHERE a.dimension = 'total' AND a.day >= p_from AND a.day <= p_to
          AND analytics__rolled(a.day, p_tz);
    IF v_raw_from IS NOT NULL THEN
        RETURN QUERY SELECT r.* FROM analytics__raw_totals(v_raw_from::timestamp AT TIME ZONE p_tz, v_to_ts, p_tz, '') r
                     WHERE NOT analytics__rolled(r.day, p_tz);
    END IF;
END $$;

-- Hybrid per-day rows for one dimension (same source rules as totals).
CREATE OR REPLACE FUNCTION analytics__day_dim(p_from date, p_to date, p_tz text, p_dim text, p_filters jsonb)
RETURNS TABLE(day date, value text, visitors bigint, pageviews bigint, visits bigint, conversions bigint)
LANGUAGE plpgsql STABLE AS $$
#variable_conflict use_column
DECLARE
    v_from_ts  timestamptz := p_from::timestamp AT TIME ZONE p_tz;
    v_to_ts    timestamptz := (p_to + 1)::timestamp AT TIME ZONE p_tz;
    v_where    text := analytics__filter_sql(p_filters, v_from_ts, v_to_ts);
    v_raw_from date;
BEGIN
    IF NOT (p_dim = ANY (analytics__dimensions())) THEN
        RAISE EXCEPTION 'analytics: unknown dimension "%"', p_dim USING ERRCODE = '22023';
    END IF;
    IF v_where <> '' THEN
        RETURN QUERY SELECT * FROM analytics__raw_dim(v_from_ts, v_to_ts, p_tz, p_dim, v_where);
        RETURN;
    END IF;
    v_raw_from := analytics__raw_from(p_from, p_to, p_tz);
    RETURN QUERY
        SELECT a.day, a.value, a.visitors, a.pageviews, a.visits, a.conversions
        FROM analytics_daily a
        WHERE a.dimension = p_dim AND a.day >= p_from AND a.day <= p_to
          AND analytics__rolled(a.day, p_tz);
    IF v_raw_from IS NOT NULL THEN
        RETURN QUERY SELECT r.* FROM analytics__raw_dim(v_raw_from::timestamp AT TIME ZONE p_tz, v_to_ts, p_tz, p_dim, '') r
                     WHERE NOT analytics__rolled(r.day, p_tz);
    END IF;
END $$;

-- analytics_ingest inserts a JSON array of events (see the plugin's Event
-- struct). Unknown kinds and rows without ts are skipped.
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
        target, goal_id, is_prefetch, confirmed, viewport, color_scheme, printed)
    SELECT x.ts, coalesce(x.eid, ''), x.kind, coalesce(x.host, ''), coalesce(x.path, ''),
        coalesce(x.page_type, ''), coalesce(x.node_id, 0), nullif(x.visitor_id, ''), nullif(x.session_id, ''),
        coalesce(x.entry, false), coalesce(x.referrer, ''), coalesce(x.source, ''), coalesce(nullif(x.channel, ''), 'direct'),
        coalesce(x.utm_source, ''), coalesce(x.utm_medium, ''), coalesce(x.utm_campaign, ''),
        coalesce(x.utm_content, ''), coalesce(x.utm_term, ''),
        coalesce(x.click_gclid, false), coalesce(x.click_msclkid, false), coalesce(x.click_fbclid, false),
        coalesce(x.click_ttclid, false), coalesce(x.country, ''), coalesce(x.language, ''), coalesce(x.device, ''),
        coalesce(x.browser, ''), coalesce(x.os, ''), coalesce(x.target, ''), nullif(x.goal_id, 0),
        coalesce(x.is_prefetch, false), coalesce(x.confirmed, false), coalesce(x.viewport, ''),
        coalesce(x.color_scheme, ''), coalesce(x.printed, false)
    FROM jsonb_to_recordset(v_events) AS x(ts timestamptz, eid text, kind text, host text, path text,
        page_type text, node_id bigint, visitor_id text, session_id text, entry boolean, referrer text,
        source text, channel text, utm_source text, utm_medium text, utm_campaign text, utm_content text,
        utm_term text, click_gclid boolean, click_msclkid boolean, click_fbclid boolean, click_ttclid boolean,
        country text, language text, device text, browser text, os text, target text, goal_id bigint,
        is_prefetch boolean, confirmed boolean, viewport text, color_scheme text, printed boolean)
    WHERE x.ts IS NOT NULL AND x.kind IN ('pageview','not_found','download','outbound','goal');
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_ingest_bots adds [{day, category, name, hits}] to the daily
-- bot counters (duplicates inside one batch are summed first).
CREATE OR REPLACE FUNCTION analytics_ingest_bots(p_rows jsonb)
RETURNS TABLE(upserted bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_rows jsonb := p_rows;
    v_n    bigint;
BEGIN
    IF jsonb_typeof(v_rows) = 'string' THEN
        v_rows := (v_rows #>> '{}')::jsonb;
    END IF;
    IF v_rows IS NULL OR jsonb_typeof(v_rows) <> 'array' THEN
        RETURN QUERY SELECT 0::bigint;
        RETURN;
    END IF;
    INSERT INTO analytics_bots_daily AS t (day, category, name, hits)
    SELECT x.day::date, x.category, coalesce(x.name, ''), sum(x.hits)::bigint
    FROM jsonb_to_recordset(v_rows) AS x(day text, category text, name text, hits bigint)
    WHERE x.day IS NOT NULL AND x.category IS NOT NULL AND coalesce(x.hits, 0) > 0
    GROUP BY 1, 2, 3
    ON CONFLICT (day, category, name) DO UPDATE SET hits = t.hits + EXCLUDED.hits;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_confirm applies a CSS-beacon confirmation to one stored event.
CREATE OR REPLACE FUNCTION analytics_confirm(p_eid text, p_since timestamptz, p_viewport text,
                                             p_color_scheme text, p_printed boolean)
RETURNS TABLE(updated bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_n bigint;
BEGIN
    UPDATE analytics_events e SET
        confirmed    = e.confirmed OR NOT coalesce(p_printed, false),
        viewport     = CASE WHEN coalesce(p_viewport, '') <> '' THEN p_viewport ELSE e.viewport END,
        color_scheme = CASE WHEN coalesce(p_color_scheme, '') <> '' THEN p_color_scheme ELSE e.color_scheme END,
        printed      = e.printed OR coalesce(p_printed, false)
    WHERE e.ts >= p_since AND e.eid = p_eid AND p_eid <> '';
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_rollup rebuilds every rollup row of one local day. Idempotent
-- (delete + insert in one transaction, serialised by an advisory lock).
CREATE OR REPLACE FUNCTION analytics_rollup(p_day text, p_tz text)
RETURNS TABLE(day text, row_count bigint) LANGUAGE plpgsql AS $$
#variable_conflict use_column
DECLARE
    v_day  date := p_day::date;
    v_from timestamptz := p_day::date::timestamp AT TIME ZONE p_tz;
    v_to   timestamptz := (p_day::date + 1)::timestamp AT TIME ZONE p_tz;
    v_dim  text;
    v_n    bigint;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('analytics_rollup'));
    DELETE FROM analytics_daily a WHERE a.day = v_day;
    INSERT INTO analytics_daily (day, dimension, value, visitors, pageviews, visits, conversions,
                                 single_page_visits, multi_page_visits, median_visit_seconds, converting_visits)
    SELECT v_day, 'total', '', coalesce(t.visitors, 0), coalesce(t.pageviews, 0), coalesce(t.visits, 0),
           coalesce(t.conversions, 0), coalesce(t.single_page_visits, 0), coalesce(t.multi_page_visits, 0),
           t.median_visit_seconds, coalesce(t.converting_visits, 0)
    FROM (SELECT 1) one
    LEFT JOIN analytics__raw_totals(v_from, v_to, p_tz, '') t ON t.day = v_day;
    FOREACH v_dim IN ARRAY analytics__dimensions() LOOP
        INSERT INTO analytics_daily (day, dimension, value, visitors, pageviews, visits, conversions)
        SELECT v_day, v_dim, r.value, r.visitors, r.pageviews, r.visits, r.conversions
        FROM analytics__raw_dim(v_from, v_to, p_tz, v_dim, '') r
        WHERE r.day = v_day;
    END LOOP;
    SELECT count(*) INTO v_n FROM analytics_daily a WHERE a.day = v_day;
    RETURN QUERY SELECT v_day::text, v_n;
END $$;

-- analytics_purge deletes raw events older than p_before. Rollups and bot
-- counters are kept.
CREATE OR REPLACE FUNCTION analytics_purge(p_before timestamptz)
RETURNS TABLE(deleted bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_n bigint;
BEGIN
    DELETE FROM analytics_events e WHERE e.ts < p_before;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- Down
-- DROP FUNCTION IF EXISTS analytics_purge(timestamptz), analytics_rollup(text, text), ...;
