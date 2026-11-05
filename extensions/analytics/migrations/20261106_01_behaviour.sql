-- Up
-- Behaviour analytics: interactions (in-page signals), finalized visits,
-- page outlines and the functions that read them. Idempotent like the
-- other migrations. No visitor ids are stored in any new table.

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS prev_path TEXT    NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS server_ms INTEGER NOT NULL DEFAULT 0;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS spec      TEXT    NOT NULL DEFAULT '';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS cached    BOOLEAN NOT NULL DEFAULT FALSE;

-- One row per in-page signal or click. kind: dwell | section | end | click |
-- form | toggle. value: dwell seconds, click class (i internal, x external,
-- c contact), form/toggle name. dest: host+path, never a query string.
CREATE TABLE IF NOT EXISTS analytics_interactions (
    ts         TIMESTAMPTZ NOT NULL,
    eid        TEXT        NOT NULL DEFAULT '',
    session_id TEXT,
    path       TEXT        NOT NULL DEFAULT '',
    kind       TEXT        NOT NULL,
    block_key  TEXT        NOT NULL DEFAULT '',
    value      TEXT        NOT NULL DEFAULT '',
    dest       TEXT        NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS analytics_interactions_ts_brin ON analytics_interactions USING brin (ts);

-- One row per finished session (written by the finalizer).
CREATE TABLE IF NOT EXISTS analytics_visits (
    session_id   TEXT PRIMARY KEY,
    day          DATE        NOT NULL,
    started_at   TIMESTAMPTZ NOT NULL,
    ended_at     TIMESTAMPTZ NOT NULL,
    entry_path   TEXT        NOT NULL DEFAULT '',
    exit_path    TEXT        NOT NULL DEFAULT '',
    paths        JSONB       NOT NULL DEFAULT '[]',
    pageviews    INTEGER     NOT NULL DEFAULT 0,
    duration_s   INTEGER     NOT NULL DEFAULT 0,
    channel      TEXT        NOT NULL DEFAULT '',
    source       TEXT        NOT NULL DEFAULT '',
    device       TEXT        NOT NULL DEFAULT '',
    country      TEXT        NOT NULL DEFAULT '',
    converted    BOOLEAN     NOT NULL DEFAULT FALSE,
    outbound     TEXT        NOT NULL DEFAULT '',
    exit_reason  TEXT        NOT NULL DEFAULT '',
    exit_dwell_s INTEGER     NOT NULL DEFAULT 0,
    reach        INTEGER     NOT NULL DEFAULT 0,
    end_reached  BOOLEAN     NOT NULL DEFAULT FALSE,
    clicks       INTEGER     NOT NULL DEFAULT 0,
    flags        TEXT        NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS analytics_visits_day ON analytics_visits (day);

-- Page outline: blocks and links as last rendered, for labels and for
-- denominators (links nobody clicks).
CREATE TABLE IF NOT EXISTS analytics_page_elements (
    path       TEXT        NOT NULL,
    kind       TEXT        NOT NULL,           -- block | link
    block_key  TEXT        NOT NULL DEFAULT '',
    label      TEXT        NOT NULL DEFAULT '',
    href       TEXT        NOT NULL DEFAULT '',
    outline    TEXT        NOT NULL DEFAULT '',
    first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (path, kind, block_key, href)
);

-- ingest: now also stores prev_path, server_ms, spec, cached and form_error rows.
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
        prev_path, server_ms, spec, cached)
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
        coalesce(x.prev_path, ''), coalesce(x.server_ms, 0), coalesce(x.spec, ''), coalesce(x.cached, false)
    FROM jsonb_to_recordset(v_events) AS x(ts timestamptz, eid text, kind text, host text, path text,
        page_type text, node_id bigint, visitor_id text, session_id text, entry boolean, referrer text,
        source text, channel text, utm_source text, utm_medium text, utm_campaign text, utm_content text,
        utm_term text, click_gclid boolean, click_msclkid boolean, click_fbclid boolean, click_ttclid boolean,
        country text, language text, device text, browser text, os text, target text, goal_id bigint,
        is_prefetch boolean, confirmed boolean, viewport text, color_scheme text, printed boolean,
        prev_path text, server_ms integer, spec text, cached boolean)
    WHERE x.ts IS NOT NULL AND x.kind IN ('pageview','not_found','download','outbound','goal','form_error');
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_confirm_batch([{eid, since, viewport, color_scheme, printed}])
-- confirms many beacon/activation results with one call.
CREATE OR REPLACE FUNCTION analytics_confirm_batch(p_rows jsonb)
RETURNS TABLE(updated bigint) LANGUAGE plpgsql AS $$
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
    UPDATE analytics_events e SET
        confirmed    = e.confirmed OR NOT coalesce(x.printed, false),
        viewport     = CASE WHEN coalesce(x.viewport, '') <> '' THEN x.viewport ELSE e.viewport END,
        color_scheme = CASE WHEN coalesce(x.color_scheme, '') <> '' THEN x.color_scheme ELSE e.color_scheme END,
        printed      = e.printed OR coalesce(x.printed, false)
    FROM jsonb_to_recordset(v_rows) AS x(eid text, since timestamptz, viewport text, color_scheme text, printed boolean)
    WHERE e.eid = x.eid AND x.eid <> '' AND e.ts >= x.since;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

CREATE OR REPLACE FUNCTION analytics_ingest_interactions(p_rows jsonb)
RETURNS TABLE(inserted bigint) LANGUAGE plpgsql AS $$
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
    INSERT INTO analytics_interactions (ts, eid, session_id, path, kind, block_key, value, dest)
    SELECT x.ts, coalesce(x.eid, ''), nullif(x.session_id, ''), coalesce(x.path, ''), x.kind,
           left(coalesce(x.block_key, ''), 80), left(coalesce(x.value, ''), 80), left(coalesce(x.dest, ''), 200)
    FROM jsonb_to_recordset(v_rows) AS x(ts timestamptz, eid text, session_id text, path text, kind text,
                                         block_key text, value text, dest text)
    WHERE x.ts IS NOT NULL AND x.kind IN ('dwell','section','end','click','form','toggle');
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_upsert_outline(path, outline_hash, [{kind, block_key, label, href}]):
-- replaces nothing when the hash is unchanged.
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
    INSERT INTO analytics_page_elements (path, kind, block_key, label, href, outline)
    SELECT p_path, x.kind, left(coalesce(x.block_key, ''), 80), left(coalesce(x.label, ''), 200),
           left(coalesce(x.href, ''), 300), p_outline
    FROM jsonb_to_recordset(v_rows) AS x(kind text, block_key text, label text, href text)
    WHERE x.kind IN ('block', 'link')
    ON CONFLICT (path, kind, block_key, href)
    DO UPDATE SET label = EXCLUDED.label, outline = EXCLUDED.outline, last_seen = now();
    -- Drop elements of older outlines that are gone from the page.
    DELETE FROM analytics_page_elements WHERE path = p_path AND outline <> p_outline
        AND last_seen < now() - interval '30 days';
    RETURN QUERY SELECT true;
END $$;

-- analytics_session_facts: facts for sessions idle since p_cutoff that have
-- no analytics_visits row yet. One jsonb per session.
CREATE OR REPLACE FUNCTION analytics_session_facts(p_cutoff timestamptz, p_tz text, p_limit integer)
RETURNS TABLE(facts jsonb) LANGUAGE sql STABLE AS $$
    WITH idle AS (
        SELECT e.session_id, max(e.ts) AS last_ts
        FROM analytics_events e
        WHERE e.session_id IS NOT NULL AND e.ts >= p_cutoff - interval '3 days'
        GROUP BY e.session_id HAVING max(e.ts) < p_cutoff
    ),
    todo AS (
        SELECT i.session_id FROM idle i
        WHERE NOT EXISTS (SELECT 1 FROM analytics_visits v WHERE v.session_id = i.session_id)
        ORDER BY i.last_ts LIMIT greatest(p_limit, 1)
    ),
    ev AS (
        SELECT e.*, (e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed)) AS pv
        FROM analytics_events e JOIN todo t ON t.session_id = e.session_id
        WHERE e.ts >= p_cutoff - interval '3 days'
    ),
    agg AS (
        SELECT e.session_id,
               min(e.ts) FILTER (WHERE e.pv)                                         AS first_ts,
               max(e.ts) FILTER (WHERE e.pv)                                         AS last_pv_ts,
               count(*) FILTER (WHERE e.pv)                                          AS pages,
               (array_agg(e.path ORDER BY e.ts) FILTER (WHERE e.pv))[1]              AS entry_path,
               (array_agg(e.path ORDER BY e.ts DESC) FILTER (WHERE e.pv))[1]         AS exit_path,
               (array_agg(e.eid ORDER BY e.ts DESC) FILTER (WHERE e.pv))[1]          AS last_eid,
               (array_agg(e.channel ORDER BY e.ts))[1]                               AS channel,
               (array_agg(e.source ORDER BY e.ts))[1]                                AS source,
               (array_agg(e.device ORDER BY e.ts))[1]                                AS device,
               (array_agg(e.country ORDER BY e.ts))[1]                               AS country,
               bool_or(e.kind = 'goal')                                              AS converted,
               max(e.ts) FILTER (WHERE e.kind IN ('not_found','form_error'))         AS last_error_ts,
               max(e.ts) FILTER (WHERE e.kind = 'outbound')                          AS last_out_ts,
               (array_agg(e.target ORDER BY e.ts DESC) FILTER (WHERE e.kind = 'outbound'))[1] AS last_out_dest,
               max(e.ts) FILTER (WHERE e.is_prefetch AND NOT e.confirmed)            AS last_spec_ts,
               bool_or(e.pv AND e.viewport <> '')                                    AS s1,
               (array_agg(e.path ORDER BY e.ts) FILTER (WHERE e.pv))                 AS all_paths
        FROM ev e GROUP BY e.session_id
    )
    SELECT jsonb_build_object(
        'session_id', a.session_id,
        'day', (a.first_ts AT TIME ZONE p_tz)::date,
        'started_at', a.first_ts, 'ended_at', a.last_pv_ts,
        'pages', a.pages, 'entry_path', a.entry_path, 'exit_path', a.exit_path,
        'paths', to_jsonb(a.all_paths[1:6]),
        'channel', a.channel, 'source', a.source, 'device', a.device, 'country', a.country,
        'converted', a.converted, 's1', coalesce(a.s1, false),
        'error_after_last_view', coalesce(a.last_error_ts >= a.last_pv_ts, false),
        'out_after_last_view', coalesce(a.last_out_ts >= a.last_pv_ts, false), 'out_dest', coalesce(a.last_out_dest, ''),
        'spec_after_last_view', coalesce(a.last_spec_ts > a.last_pv_ts, false),
        'duration_s', coalesce(extract(epoch FROM a.last_pv_ts - a.first_ts)::int, 0),
        'dwell_s', coalesce((SELECT max(i.value::int) FROM analytics_interactions i
                              WHERE i.eid = a.last_eid AND i.kind = 'dwell' AND i.value ~ '^[0-9]{1,6}$'
                                AND i.ts >= a.first_ts - interval '1 minute'), 0),
        'reach', (SELECT count(DISTINCT i.block_key) FROM analytics_interactions i
                    WHERE i.eid = a.last_eid AND i.kind = 'section' AND i.ts >= a.first_ts - interval '1 minute'),
        'end_reached', EXISTS (SELECT 1 FROM analytics_interactions i
                    WHERE i.eid = a.last_eid AND i.kind = 'end' AND i.ts >= a.first_ts - interval '1 minute'),
        'clicks', (SELECT count(*) FROM analytics_interactions i
                    WHERE i.session_id = a.session_id AND i.kind = 'click' AND i.ts >= a.first_ts - interval '1 minute'),
        'click_dest', coalesce((SELECT i.dest FROM analytics_interactions i
                    WHERE i.session_id = a.session_id AND i.kind = 'click' AND i.value IN ('x','c') AND i.ts >= a.last_pv_ts
                    ORDER BY i.ts DESC LIMIT 1), ''),
        'click_class', coalesce((SELECT i.value FROM analytics_interactions i
                    WHERE i.session_id = a.session_id AND i.kind = 'click' AND i.value IN ('x','c') AND i.ts >= a.last_pv_ts
                    ORDER BY i.ts DESC LIMIT 1), '')
    )
    FROM agg a WHERE a.pages > 0;
$$;

-- analytics_upsert_visits([{...visit columns...}]): finalizer write-back.
CREATE OR REPLACE FUNCTION analytics_upsert_visits(p_rows jsonb)
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
    INSERT INTO analytics_visits (session_id, day, started_at, ended_at, entry_path, exit_path, paths, pageviews,
        duration_s, channel, source, device, country, converted, outbound, exit_reason, exit_dwell_s, reach,
        end_reached, clicks, flags)
    SELECT x.session_id, x.day, x.started_at, x.ended_at, coalesce(x.entry_path, ''), coalesce(x.exit_path, ''),
           coalesce(x.paths, '[]'::jsonb), coalesce(x.pageviews, 0), coalesce(x.duration_s, 0),
           coalesce(x.channel, ''), coalesce(x.source, ''), coalesce(x.device, ''), coalesce(x.country, ''),
           coalesce(x.converted, false), left(coalesce(x.outbound, ''), 200), coalesce(x.exit_reason, ''),
           coalesce(x.exit_dwell_s, 0), coalesce(x.reach, 0), coalesce(x.end_reached, false),
           coalesce(x.clicks, 0), coalesce(x.flags, '')
    FROM jsonb_to_recordset(v_rows) AS x(session_id text, day date, started_at timestamptz, ended_at timestamptz,
        entry_path text, exit_path text, paths jsonb, pageviews integer, duration_s integer, channel text,
        source text, device text, country text, converted boolean, outbound text, exit_reason text,
        exit_dwell_s integer, reach integer, end_reached boolean, clicks integer, flags text)
    WHERE x.session_id IS NOT NULL AND x.day IS NOT NULL
    ON CONFLICT (session_id) DO NOTHING;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- Retention for the behaviour tables. Visits are anonymous (random session
-- id, no visitor id) and kept longer than raw events.
CREATE OR REPLACE FUNCTION analytics_purge_behaviour(p_raw_cutoff timestamptz, p_visit_cutoff timestamptz)
RETURNS TABLE(deleted bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_a bigint;
    v_b bigint;
BEGIN
    DELETE FROM analytics_interactions WHERE ts < p_raw_cutoff;
    GET DIAGNOSTICS v_a = ROW_COUNT;
    DELETE FROM analytics_visits WHERE ended_at < p_visit_cutoff;
    GET DIAGNOSTICS v_b = ROW_COUNT;
    RETURN QUERY SELECT v_a + v_b;
END $$;
