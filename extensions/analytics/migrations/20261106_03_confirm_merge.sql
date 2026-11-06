-- analytics_confirm_batch: merge the results for one view before applying them.
-- A flush often carries several for the same view (its activation and its
-- viewport facts arrive together when they waited for the view's record), and
-- UPDATE … FROM applies only one source row to each target row: the others
-- were silently lost, leaving activated views unconfirmed or without their
-- viewport.
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
    WITH x AS (
        SELECT r.eid,
               min(r.since) AS since,
               bool_or(NOT (coalesce(r.printed, false) OR coalesce(r.meta, false))) AS confirms,
               (array_agg(r.viewport ORDER BY j.n DESC) FILTER (WHERE coalesce(r.viewport, '') <> ''))[1] AS viewport,
               (array_agg(r.color_scheme ORDER BY j.n DESC) FILTER (WHERE coalesce(r.color_scheme, '') <> ''))[1] AS color_scheme,
               bool_or(coalesce(r.printed, false)) AS printed
        FROM jsonb_array_elements(v_rows) WITH ORDINALITY AS j(v, n)
        CROSS JOIN LATERAL jsonb_to_record(j.v) AS r(eid text, since timestamptz, viewport text,
                                                     color_scheme text, printed boolean, meta boolean)
        WHERE coalesce(r.eid, '') <> ''
        GROUP BY r.eid
    )
    UPDATE analytics_events e SET
        confirmed    = e.confirmed OR x.confirms,
        viewport     = coalesce(x.viewport, e.viewport),
        color_scheme = coalesce(x.color_scheme, e.color_scheme),
        printed      = e.printed OR x.printed
    FROM x
    WHERE e.eid = x.eid AND e.ts >= x.since;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN QUERY SELECT v_n;
END $$;
