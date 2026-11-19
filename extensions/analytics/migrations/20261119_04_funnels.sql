-- Up
-- Funnels: ordered steps (pages or goals) a visit should pass through.
-- Steps are stored as a JSON text array: [{"kind":"page","value":"/tours*","label":"Tours"}, ...].
CREATE TABLE IF NOT EXISTS analytics_funnels (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    steps      TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- analytics__funnel_walk walks one visit's events ([ms, 'p'|'g', path|goal_id], in
-- order) through the steps (each with kind and, for pages, a LIKE pattern):
-- how many steps it reached in order, when, and the page it opened right
-- after its last reached step ('' when the visit ended there).
CREATE OR REPLACE FUNCTION analytics__funnel_walk(p_ev jsonb, p_steps jsonb)
RETURNS TABLE(reached integer, times jsonb, next_path text) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    n      integer := jsonb_array_length(p_steps);
    k      integer := 0;
    last_i integer := -1;
    t      jsonb := '[]'::jsonb;
    e      jsonb;
    s      jsonb;
    i      integer;
BEGIN
    FOR i IN 0 .. jsonb_array_length(p_ev) - 1 LOOP
        EXIT WHEN k >= n;
        e := p_ev -> i;
        s := p_steps -> k;
        IF (s->>'kind' = 'page' AND e->>1 = 'p' AND lower(e->>2) LIKE (s->>'like'))
           OR (s->>'kind' = 'goal' AND e->>1 = 'g' AND e->>2 = s->>'value') THEN
            t := t || jsonb_build_array(e -> 0);
            k := k + 1;
            last_i := i;
        END IF;
    END LOOP;
    next_path := '';
    IF k > 0 AND k < n THEN
        FOR i IN last_i + 1 .. jsonb_array_length(p_ev) - 1 LOOP
            e := p_ev -> i;
            IF e->>1 = 'p' AND e->>2 <> (p_ev -> last_i ->> 2) THEN
                next_path := e->>2;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    reached := k;
    times := t;
    RETURN NEXT;
END $$;

-- analytics_funnel_stats(from, to, tz, steps): per step the visits that
-- reached it, the median time from the first step, and where the visits
-- that stopped there went next; plus completion per device.
CREATE OR REPLACE FUNCTION analytics_funnel_stats(p_from text, p_to text, p_tz text, p_steps jsonb)
RETURNS TABLE(data jsonb) LANGUAGE sql STABLE AS $$
    WITH rng AS (
        SELECT p_from::date::timestamp AT TIME ZONE p_tz AS f, (p_to::date + 1)::timestamp AT TIME ZONE p_tz AS t
    ),
    st AS (SELECT CASE WHEN jsonb_typeof(p_steps) = 'string' THEN (p_steps #>> '{}')::jsonb ELSE p_steps END AS s),
    ev AS (
        SELECT e.session_id, min(e.device) AS device,
               jsonb_agg(jsonb_build_array((extract(epoch FROM e.ts) * 1000)::bigint,
                                           CASE WHEN e.kind = 'goal' THEN 'g' ELSE 'p' END,
                                           CASE WHEN e.kind = 'goal' THEN e.goal_id::text ELSE e.path END) ORDER BY e.ts) AS evs
        FROM analytics_events e, rng
        WHERE e.ts >= rng.f AND e.ts < rng.t AND e.session_id IS NOT NULL
          AND ((e.kind = 'pageview' AND (NOT e.is_prefetch OR e.confirmed)) OR (e.kind = 'goal' AND e.goal_id IS NOT NULL))
        GROUP BY e.session_id
    ),
    w AS (SELECT ev.session_id, ev.device, f.reached, f.times, f.next_path
          FROM ev, st, LATERAL analytics__funnel_walk(ev.evs, st.s) f),
    steps AS (SELECT (x.ord - 1)::integer AS i FROM st, jsonb_array_elements(st.s) WITH ORDINALITY AS x(v, ord)),
    n AS (SELECT jsonb_array_length(s) AS n FROM st)
    SELECT jsonb_build_object(
        'visits', (SELECT count(*) FROM w),
        'steps', coalesce((SELECT jsonb_agg(jsonb_build_object(
            'reached', (SELECT count(*) FROM w WHERE w.reached > s.i),
            'median_ms', CASE WHEN s.i = 0 THEN NULL ELSE (SELECT percentile_cont(0.5) WITHIN GROUP (
                ORDER BY (w.times ->> s.i)::bigint - (w.times ->> 0)::bigint) FROM w WHERE w.reached > s.i) END,
            'next', coalesce((SELECT jsonb_agg(jsonb_build_object('path', x.p, 'n', x.c) ORDER BY x.c DESC, x.p)
                FROM (SELECT w.next_path AS p, count(*) AS c FROM w, n WHERE w.reached = s.i + 1 AND s.i + 1 < n.n
                      GROUP BY 1 ORDER BY 2 DESC LIMIT 6) x), '[]'::jsonb)
            ) ORDER BY s.i) FROM steps s), '[]'::jsonb),
        'devices', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.started DESC)
            FROM (SELECT coalesce(nullif(w.device, ''), 'unknown') AS device, count(*) FILTER (WHERE w.reached >= 1) AS started,
                         count(*) FILTER (WHERE w.reached >= n.n) AS completed
                  FROM w, n GROUP BY 1 HAVING count(*) FILTER (WHERE w.reached >= 1) > 0) x), '[]'::jsonb)
    );
$$;
