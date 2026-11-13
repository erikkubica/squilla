-- "verified" filter: keep only visits that an in-page signal confirmed.
--
-- Scrapers that copy a full browser header set pass every request-shape check
-- and are counted as people. They fetch the HTML and nothing else, so no
-- signal ever comes back for them, while a real browser reports its activation
-- about a second after the page loads. {"verified": "1"} restricts every
-- filtered report to sessions with at least one confirmed pageview in the
-- window. It needs enhanced_mode: without signals nothing is ever confirmed.
-- Visits without a session id (Global Privacy Control) receive no signals and
-- are therefore left out as well.
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
        ELSIF r.key = 'verified' THEN
            IF r.value = '1' THEN
                v_sql := v_sql || format(
                    ' AND e.session_id IN (SELECT x.session_id FROM analytics_events x WHERE x.ts >= %L AND x.ts < %L'
                    ' AND x.kind = ''pageview'' AND x.confirmed AND x.session_id IS NOT NULL)',
                    p_from_ts, p_to_ts);
            END IF;
        ELSE
            RAISE EXCEPTION 'analytics: unknown filter "%"', r.key USING ERRCODE = '22023';
        END IF;
    END LOOP;
    RETURN v_sql;
END $$;
