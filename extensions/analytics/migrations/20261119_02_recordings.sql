-- Session recordings (opt-in, needs JavaScript on the site): cursor,
-- scroll, clicks and form use per page view. No page text, no input values,
-- no keystrokes. Heatmaps are computed from these rows on request.

CREATE TABLE IF NOT EXISTS analytics_rec_views (
    pid         TEXT        PRIMARY KEY,           -- random id the browser made for this page view
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    visitor_id  TEXT,                              -- daily-salted hash, same as analytics_events
    session_id  TEXT,
    eid         TEXT        NOT NULL DEFAULT '',   -- the analytics_events pageview, once matched
    path        TEXT        NOT NULL DEFAULT '',
    url         TEXT        NOT NULL DEFAULT '',
    referrer    TEXT        NOT NULL DEFAULT '',
    vw          INTEGER     NOT NULL DEFAULT 0,    -- viewport
    vh          INTEGER     NOT NULL DEFAULT 0,
    dh          INTEGER     NOT NULL DEFAULT 0,    -- document height
    sw          INTEGER     NOT NULL DEFAULT 0,    -- screen
    sh          INTEGER     NOT NULL DEFAULT 0,
    device      TEXT        NOT NULL DEFAULT '',   -- desktop | tablet | mobile (from the viewport)
    browser     TEXT        NOT NULL DEFAULT '',
    os          TEXT        NOT NULL DEFAULT '',
    country     TEXT        NOT NULL DEFAULT '',
    language    TEXT        NOT NULL DEFAULT '',
    duration_ms INTEGER     NOT NULL DEFAULT 0,
    events      INTEGER     NOT NULL DEFAULT 0,
    clicks      INTEGER     NOT NULL DEFAULT 0,
    max_scroll  INTEGER     NOT NULL DEFAULT 0,    -- deepest bottom edge seen, px
    bytes       INTEGER     NOT NULL DEFAULT 0
);
-- Frustration signals and Core Web Vitals (ms; CLS × 1000), per page view.
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS rage   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS dead   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS errors INTEGER NOT NULL DEFAULT 0;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS lcp    INTEGER;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS cls    INTEGER;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS inp    INTEGER;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS ttfb   INTEGER;
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS fcp    INTEGER;
-- How the visit arrived (copied from its analytics_events page view once known).
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS source  TEXT NOT NULL DEFAULT '';
ALTER TABLE analytics_rec_views ADD COLUMN IF NOT EXISTS entry   BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS analytics_events_eid ON analytics_events (eid) WHERE eid <> '';
CREATE INDEX IF NOT EXISTS analytics_rec_views_unattributed ON analytics_rec_views (last_at) WHERE channel = '' AND eid <> '';
CREATE INDEX IF NOT EXISTS analytics_rec_views_started ON analytics_rec_views (started_at);
CREATE INDEX IF NOT EXISTS analytics_rec_views_path ON analytics_rec_views (path, started_at);
CREATE INDEX IF NOT EXISTS analytics_rec_views_session ON analytics_rec_views (session_id);

CREATE TABLE IF NOT EXISTS analytics_rec_chunks (
    pid  TEXT    NOT NULL REFERENCES analytics_rec_views (pid) ON DELETE CASCADE,
    seq  INTEGER NOT NULL,
    t    INTEGER NOT NULL DEFAULT 0,  -- ms since page load of the newest event
    data JSONB   NOT NULL,            -- [[t, type, ...], …]
    PRIMARY KEY (pid, seq)
);

-- Largest value of one web vital in a batch of events (NULL when absent).
CREATE OR REPLACE FUNCTION analytics_rec_vital(p_data jsonb, p_metric text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
    SELECT max(least(greatest((e->>3)::numeric, 0), 600000))::int FROM jsonb_array_elements(p_data) e
    WHERE e->>1 = 'w' AND e->>2 = p_metric AND jsonb_typeof(e->3) = 'number';
$$;

-- analytics_rec_ingest([{pid, seq, t, data, meta?: {...}, eid?, session_id?}])
-- Chunks of unknown views are dropped (the first chunk carries the meta).
CREATE OR REPLACE FUNCTION analytics_rec_ingest(p_rows jsonb)
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
    INSERT INTO analytics_rec_views (pid, started_at, last_at, visitor_id, session_id, eid, path, url, referrer,
        vw, vh, dh, sw, sh, device, browser, os, country, language)
    SELECT DISTINCT ON (x.pid) x.pid, coalesce(x.ts, now()), coalesce(x.ts, now()), nullif(m.visitor_id, ''), nullif(m.session_id, ''),
           coalesce(m.eid, ''), left(coalesce(m.path, ''), 500), left(coalesce(m.url, ''), 2048), left(coalesce(m.referrer, ''), 2048),
           coalesce(m.vw, 0), coalesce(m.vh, 0), coalesce(m.dh, 0), coalesce(m.sw, 0), coalesce(m.sh, 0),
           left(coalesce(m.device, ''), 16), left(coalesce(m.browser, ''), 32), left(coalesce(m.os, ''), 32),
           left(coalesce(m.country, ''), 2), left(coalesce(m.language, ''), 16)
    FROM jsonb_to_recordset(v_rows) AS x(pid text, ts timestamptz, meta jsonb)
    CROSS JOIN LATERAL jsonb_to_record(x.meta) AS m(visitor_id text, session_id text, eid text, path text, url text,
        referrer text, vw integer, vh integer, dh integer, sw integer, sh integer, device text, browser text, os text,
        country text, language text)
    WHERE x.meta IS NOT NULL AND jsonb_typeof(x.meta) = 'object' AND x.pid ~ '^[a-z0-9]{8,32}$'
    ORDER BY x.pid
    ON CONFLICT (pid) DO NOTHING;

    INSERT INTO analytics_rec_chunks (pid, seq, t, data)
    SELECT x.pid, x.seq, greatest(coalesce(x.t, 0), 0), x.data
    FROM jsonb_to_recordset(v_rows) AS x(pid text, seq integer, t integer, data jsonb)
    WHERE x.data IS NOT NULL AND jsonb_typeof(x.data) = 'array'
      AND EXISTS (SELECT 1 FROM analytics_rec_views v WHERE v.pid = x.pid)
    ON CONFLICT (pid, seq) DO NOTHING;
    GET DIAGNOSTICS v_n = ROW_COUNT;

    -- Per-view facts for the list: length, event and click counts, scroll depth.
    UPDATE analytics_rec_views v SET
        last_at     = greatest(v.last_at, a.ts),
        duration_ms = greatest(v.duration_ms, a.t),
        events      = v.events + a.n,
        clicks      = v.clicks + a.c,
        dh          = greatest(v.dh, a.dh),
        bytes       = v.bytes + a.bytes,
        rage        = v.rage + a.g,
        dead        = v.dead + a.k,
        errors      = v.errors + a.e,
        lcp         = greatest(v.lcp, a.lcp),
        cls         = greatest(v.cls, a.cls),
        inp         = greatest(v.inp, a.inp),
        ttfb        = coalesce(v.ttfb, a.ttfb),
        fcp         = coalesce(v.fcp, a.fcp),
        eid         = CASE WHEN v.eid = '' THEN coalesce(a.eid, '') ELSE v.eid END,
        session_id  = coalesce(v.session_id, a.session_id)
    FROM (
        SELECT x.pid, max(coalesce(x.ts, now())) AS ts, max(greatest(coalesce(x.t, 0), 0)) AS t,
               sum(jsonb_array_length(x.data))::int AS n,
               sum((SELECT count(*) FROM jsonb_array_elements(x.data) e WHERE e->>1 = 'c'))::int AS c,
               max((SELECT max(CASE WHEN e->>1 = 'd' AND jsonb_typeof(e->2) = 'number' THEN (e->>2)::numeric::int ELSE 0 END)
                    FROM jsonb_array_elements(x.data) e)) AS dh,
               sum(length(x.data::text))::int AS bytes,
               sum((SELECT count(*) FROM jsonb_array_elements(x.data) e WHERE e->>1 = 'g'))::int AS g,
               sum((SELECT count(*) FROM jsonb_array_elements(x.data) e WHERE e->>1 = 'k'))::int AS k,
               sum((SELECT count(*) FROM jsonb_array_elements(x.data) e WHERE e->>1 = 'e'))::int AS e,
               max(analytics_rec_vital(x.data, 'lcp')) AS lcp, max(analytics_rec_vital(x.data, 'cls')) AS cls,
               max(analytics_rec_vital(x.data, 'inp')) AS inp, max(analytics_rec_vital(x.data, 'ttfb')) AS ttfb,
               max(analytics_rec_vital(x.data, 'fcp')) AS fcp,
               max(nullif(x.eid, '')) AS eid, max(nullif(x.session_id, '')) AS session_id
        FROM jsonb_to_recordset(v_rows) AS x(pid text, ts timestamptz, t integer, data jsonb, eid text, session_id text)
        WHERE x.data IS NOT NULL AND jsonb_typeof(x.data) = 'array'
        GROUP BY x.pid
    ) a
    WHERE v.pid = a.pid;
    -- Arrival facts from the matched page view (it may land a few seconds later).
    -- Also catches recent views whose last batch came before the page view was written.
    UPDATE analytics_rec_views v SET channel = e.channel, source = e.source, entry = e.entry
    FROM analytics_events e
    WHERE v.channel = '' AND v.eid <> '' AND v.last_at > now() - interval '2 hours'
      AND e.eid = v.eid AND e.kind = 'pageview';
    -- Bottom edge = scroll position + viewport height.
    UPDATE analytics_rec_views v SET max_scroll = greatest(v.max_scroll, s.sy + v.vh)
    FROM (
        SELECT x.pid, max((SELECT max(CASE WHEN e->>1 = 's' AND jsonb_typeof(e->3) = 'number' THEN (e->>3)::numeric::int ELSE 0 END)
                           FROM jsonb_array_elements(x.data) e)) AS sy
        FROM jsonb_to_recordset(v_rows) AS x(pid text, data jsonb)
        WHERE x.data IS NOT NULL AND jsonb_typeof(x.data) = 'array'
        GROUP BY x.pid
    ) s
    WHERE v.pid = s.pid;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_rec_list(from, to, tz, filters, limit, offset). filters: {path, device,
-- min_ms, clicked, signal: rage|dead|error|slow, channel, country, entry, converted}.
DROP FUNCTION IF EXISTS analytics_rec_list(text, text, text, text, text, integer, boolean, integer, integer);
CREATE OR REPLACE FUNCTION analytics_rec_list(p_from text, p_to text, p_tz text, p_f jsonb, p_limit integer, p_offset integer)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    f AS (
        SELECT coalesce(x.path, '') AS path, coalesce(x.device, '') AS device, coalesce(x.min_ms, 0) AS min_ms,
               coalesce(x.clicked, false) AS clicked, coalesce(x.signal, '') AS signal, coalesce(x.channel, '') AS channel,
               coalesce(x.country, '') AS country, coalesce(x.entry, false) AS entry, coalesce(x.converted, false) AS converted
        FROM jsonb_to_record(CASE WHEN jsonb_typeof(p_f) = 'string' THEN (p_f #>> '{}')::jsonb ELSE coalesce(p_f, '{}') END)
             AS x(path text, device text, min_ms integer, clicked boolean, signal text, channel text, country text,
                  entry boolean, converted boolean)
    ),
    all_v AS (SELECT r.* FROM analytics_rec_views r, rng WHERE r.started_at >= rng.f AND r.started_at < rng.t),
    v AS (
        SELECT r.* FROM all_v r, f
        WHERE (f.path = '' OR r.path = f.path)
          AND (f.device = '' OR r.device = f.device)
          AND r.duration_ms >= greatest(f.min_ms, 0)
          AND (NOT f.clicked OR r.clicks > 0)
          AND (f.signal = '' OR (f.signal = 'rage' AND r.rage > 0) OR (f.signal = 'dead' AND r.dead > 0)
               OR (f.signal = 'error' AND r.errors > 0) OR (f.signal = 'slow' AND (r.lcp > 4000 OR r.inp > 500 OR r.cls > 250)))
          AND (f.channel = '' OR r.channel = f.channel)
          AND (f.country = '' OR r.country = f.country)
          AND (NOT f.entry OR r.entry)
          AND (NOT f.converted OR EXISTS (SELECT 1 FROM analytics_visits x WHERE x.session_id = r.session_id AND x.converted))
    )
    SELECT jsonb_build_object(
        'total', (SELECT count(*) FROM v),
        'rows', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.started_at DESC)
            FROM (SELECT pid, started_at, path, referrer, vw, vh, dh, device, browser, os, country, channel, source, entry,
                         duration_ms, events, clicks, max_scroll, rage, dead, errors, lcp, inp, cls,
                         session_id IS NOT NULL AS in_visit,
                         (SELECT count(*) FROM analytics_rec_views s WHERE s.session_id = v.session_id AND v.session_id IS NOT NULL) AS visit_pages,
                         (SELECT x.converted FROM analytics_visits x WHERE x.session_id = v.session_id LIMIT 1) AS converted,
                         (SELECT x.exit_reason FROM analytics_visits x WHERE x.session_id = v.session_id LIMIT 1) AS exit_reason
                  FROM v ORDER BY started_at DESC
                  LIMIT least(greatest(p_limit, 1), 200) OFFSET greatest(p_offset, 0)) x), '[]'::jsonb),
        'pages', coalesce((SELECT jsonb_agg(jsonb_build_object('path', g.path, 'n', g.n) ORDER BY g.n DESC)
            FROM (SELECT path, count(*) AS n FROM all_v GROUP BY path ORDER BY 2 DESC LIMIT 100) g), '[]'::jsonb),
        'channels', coalesce((SELECT jsonb_agg(g.channel ORDER BY g.n DESC)
            FROM (SELECT channel, count(*) AS n FROM all_v WHERE channel <> '' GROUP BY 1) g), '[]'::jsonb),
        'countries', coalesce((SELECT jsonb_agg(g.country ORDER BY g.n DESC)
            FROM (SELECT country, count(*) AS n FROM all_v WHERE country <> '' GROUP BY 1) g), '[]'::jsonb)
    );
$$;

-- analytics_rec_insights(from, to, tz): Clarity-style frustration signals and
-- Core Web Vitals (75th percentile, as Google reports them) over recordings.
CREATE OR REPLACE FUNCTION analytics_rec_insights(p_from text, p_to text, p_tz text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    v AS (SELECT r.* FROM analytics_rec_views r, rng WHERE r.started_at >= rng.f AND r.started_at < rng.t AND r.events > 0),
    -- Events of the newest views with a signal, for the "where" lists (bounded work).
    sig AS (SELECT pid, path FROM v WHERE rage > 0 OR dead > 0 OR errors > 0 ORDER BY started_at DESC LIMIT 2000),
    ev AS (
        SELECT s.path, e FROM sig s JOIN analytics_rec_chunks c ON c.pid = s.pid, jsonb_array_elements(c.data) e
        WHERE e->>1 IN ('g', 'k', 'e')
    )
    SELECT jsonb_build_object(
        'totals', jsonb_build_object(
            'recordings', (SELECT count(*) FROM v),
            'rage', (SELECT count(*) FROM v WHERE rage > 0),
            'dead', (SELECT count(*) FROM v WHERE dead > 0),
            'errors', (SELECT count(*) FROM v WHERE errors > 0),
            'quick_back', (SELECT count(*) FROM v WHERE duration_ms < 5000 AND session_id IS NOT NULL
                           AND EXISTS (SELECT 1 FROM analytics_rec_views n WHERE n.session_id = v.session_id
                                       AND n.started_at > v.started_at AND n.started_at < v.started_at + interval '10 seconds')),
            'excessive_scroll', (SELECT count(*) FROM v WHERE dh > 0 AND events > 0 AND clicks = 0 AND max_scroll >= dh * 0.95
                                 AND duration_ms < 15000),
            'slow', (SELECT count(*) FROM v WHERE lcp > 4000 OR inp > 500 OR cls > 250)),
        'elements', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.n DESC)
            FROM (SELECT CASE WHEN e->>1 = 'g' THEN 'rage' ELSE 'dead' END AS kind, path, e->>4 AS selector, count(*) AS n
                  FROM ev WHERE e->>1 IN ('g', 'k') GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 30) x), '[]'::jsonb),
        'errors', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.n DESC)
            FROM (SELECT e->>2 AS message, e->>3 AS file, count(*) AS n, count(DISTINCT path) AS pages,
                         (array_agg(path))[1] AS top_page
                  FROM ev WHERE e->>1 = 'e' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20) x), '[]'::jsonb),
        'vitals', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.views DESC)
            FROM (SELECT path, count(*) AS views,
                         percentile_cont(0.75) WITHIN GROUP (ORDER BY lcp) FILTER (WHERE lcp IS NOT NULL) AS lcp,
                         percentile_cont(0.75) WITHIN GROUP (ORDER BY inp) FILTER (WHERE inp IS NOT NULL) AS inp,
                         percentile_cont(0.75) WITHIN GROUP (ORDER BY cls) FILTER (WHERE cls IS NOT NULL) AS cls,
                         percentile_cont(0.75) WITHIN GROUP (ORDER BY ttfb) FILTER (WHERE ttfb IS NOT NULL) AS ttfb,
                         percentile_cont(0.75) WITHIN GROUP (ORDER BY fcp) FILTER (WHERE fcp IS NOT NULL) AS fcp
                  FROM v GROUP BY path ORDER BY 2 DESC LIMIT 30) x), '[]'::jsonb),
        'site_vitals', (SELECT jsonb_build_object(
                         'lcp', percentile_cont(0.75) WITHIN GROUP (ORDER BY lcp) FILTER (WHERE lcp IS NOT NULL),
                         'inp', percentile_cont(0.75) WITHIN GROUP (ORDER BY inp) FILTER (WHERE inp IS NOT NULL),
                         'cls', percentile_cont(0.75) WITHIN GROUP (ORDER BY cls) FILTER (WHERE cls IS NOT NULL),
                         'ttfb', percentile_cont(0.75) WITHIN GROUP (ORDER BY ttfb) FILTER (WHERE ttfb IS NOT NULL),
                         'by_device', coalesce((SELECT jsonb_object_agg(d.device, d.lcp) FROM (
                             SELECT device, percentile_cont(0.75) WITHIN GROUP (ORDER BY lcp) AS lcp FROM v
                             WHERE lcp IS NOT NULL AND device <> '' GROUP BY device) d), '{}'::jsonb))
                        FROM v)
    );
$$;

-- analytics_rec_get(pid): meta, every event in order, and the other pages of the same visit.
CREATE OR REPLACE FUNCTION analytics_rec_get(p_pid text)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    SELECT jsonb_build_object(
        'meta', (row_to_json(v)::jsonb - 'visitor_id' - 'eid') || jsonb_build_object(
            'exit_reason', (SELECT x.exit_reason FROM analytics_visits x WHERE x.session_id = v.session_id LIMIT 1),
            'converted', (SELECT x.converted FROM analytics_visits x WHERE x.session_id = v.session_id LIMIT 1)),
        'events', coalesce((SELECT jsonb_agg(e ORDER BY c.seq, o) FROM analytics_rec_chunks c,
                            jsonb_array_elements(c.data) WITH ORDINALITY AS a(e, o) WHERE c.pid = v.pid), '[]'::jsonb),
        'visit', coalesce((SELECT jsonb_agg(jsonb_build_object('pid', s.pid, 'path', s.path, 'started_at', s.started_at,
                                                             'duration_ms', s.duration_ms) ORDER BY s.started_at)
                           FROM analytics_rec_views s WHERE v.session_id IS NOT NULL AND s.session_id = v.session_id), '[]'::jsonb)
    )
    FROM analytics_rec_views v WHERE v.pid = p_pid;
$$;

CREATE OR REPLACE FUNCTION analytics_rec_delete(p_pids jsonb)
RETURNS TABLE(deleted bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_ids jsonb := p_pids;
    v_n   bigint;
BEGIN
    IF jsonb_typeof(v_ids) = 'string' THEN
        v_ids := (v_ids #>> '{}')::jsonb;
    END IF;
    IF v_ids IS NULL OR jsonb_typeof(v_ids) <> 'array' THEN
        RETURN QUERY SELECT 0::bigint;
        RETURN;
    END IF;
    DELETE FROM analytics_rec_views WHERE pid IN (SELECT jsonb_array_elements_text(v_ids));
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_rec_heat(path, device, from, to, tz, limit): the newest recordings
-- of one page with their events, for the heatmap (aggregated in the plugin).
CREATE OR REPLACE FUNCTION analytics_rec_heat(p_path text, p_device text, p_from text, p_to text, p_tz text, p_limit integer)
RETURNS TABLE(pid text, vw integer, vh integer, dh integer, data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    v AS (
        SELECT r.pid, r.vw, r.vh, r.dh FROM analytics_rec_views r, rng
        WHERE r.path = p_path AND (p_device = '' OR r.device = p_device)
          AND r.started_at >= rng.f AND r.started_at < rng.t AND r.events > 0
        ORDER BY r.started_at DESC LIMIT least(greatest(p_limit, 1), 1000)
    )
    SELECT v.pid, v.vw, v.vh, v.dh,
           coalesce((SELECT jsonb_agg(e ORDER BY c.seq, o) FROM analytics_rec_chunks c,
                     jsonb_array_elements(c.data) WITH ORDINALITY AS a(e, o) WHERE c.pid = v.pid), '[]'::jsonb)
    FROM v;
$$;

-- Devices with recordings of a page, for the heatmap switcher.
CREATE OR REPLACE FUNCTION analytics_rec_devices(p_path text, p_from text, p_to text, p_tz text)
RETURNS TABLE(device text, n bigint) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    )
    SELECT r.device, count(*) FROM analytics_rec_views r, rng
    WHERE r.path = p_path AND r.started_at >= rng.f AND r.started_at < rng.t AND r.events > 0
    GROUP BY r.device ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION analytics_purge_recordings(p_cutoff timestamptz)
RETURNS TABLE(deleted bigint) LANGUAGE plpgsql AS $$
DECLARE
    v_n bigint;
BEGIN
    DELETE FROM analytics_rec_views WHERE started_at < p_cutoff;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;

-- analytics_reset(scope): wipe collected data. Settings, goals and tracked
-- links are kept. scope: all | recordings | behaviour.
CREATE OR REPLACE FUNCTION analytics_reset(p_scope text)
RETURNS TABLE(reset text) LANGUAGE plpgsql AS $$
BEGIN
    IF p_scope = 'recordings' THEN
        TRUNCATE analytics_rec_chunks, analytics_rec_views;
    ELSIF p_scope = 'behaviour' THEN
        TRUNCATE analytics_interactions, analytics_visits, analytics_page_elements;
    ELSIF p_scope = 'all' THEN
        TRUNCATE analytics_rec_chunks, analytics_rec_views, analytics_interactions, analytics_visits,
                 analytics_page_elements, analytics_events, analytics_daily, analytics_bots_daily;
    ELSE
        RAISE EXCEPTION 'unknown reset scope %', p_scope;
    END IF;
    RETURN QUERY SELECT p_scope;
END $$;
