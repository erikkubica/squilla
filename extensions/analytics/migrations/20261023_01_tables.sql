-- Up
-- Analytics extension storage. Every statement is idempotent so the file can
-- be re-applied safely (activation re-runs, restored backups).

-- Raw events: one row per counted human request (pageview, not_found,
-- download, outbound, goal). Visitor/session ids are daily-salted hashes /
-- random ids; never IPs or user agents. Only a BRIN index on ts — every
-- query is a time-range scan and BRIN keeps writes cheap.
CREATE TABLE IF NOT EXISTS analytics_events (
    ts            TIMESTAMPTZ NOT NULL,
    eid           TEXT        NOT NULL DEFAULT '',
    kind          TEXT        NOT NULL,
    host          TEXT        NOT NULL DEFAULT '',
    path          TEXT        NOT NULL DEFAULT '',
    page_type     TEXT        NOT NULL DEFAULT '',
    node_id       BIGINT      NOT NULL DEFAULT 0,
    visitor_id    TEXT,
    session_id    TEXT,
    entry         BOOLEAN     NOT NULL DEFAULT FALSE,
    referrer      TEXT        NOT NULL DEFAULT '',
    source        TEXT        NOT NULL DEFAULT '',
    channel       TEXT        NOT NULL DEFAULT 'direct',
    utm_source    TEXT        NOT NULL DEFAULT '',
    utm_medium    TEXT        NOT NULL DEFAULT '',
    utm_campaign  TEXT        NOT NULL DEFAULT '',
    utm_content   TEXT        NOT NULL DEFAULT '',
    utm_term      TEXT        NOT NULL DEFAULT '',
    click_gclid   BOOLEAN     NOT NULL DEFAULT FALSE,
    click_msclkid BOOLEAN     NOT NULL DEFAULT FALSE,
    click_fbclid  BOOLEAN     NOT NULL DEFAULT FALSE,
    click_ttclid  BOOLEAN     NOT NULL DEFAULT FALSE,
    country       TEXT        NOT NULL DEFAULT '',
    language      TEXT        NOT NULL DEFAULT '',
    device        TEXT        NOT NULL DEFAULT '',
    browser       TEXT        NOT NULL DEFAULT '',
    os            TEXT        NOT NULL DEFAULT '',
    target        TEXT        NOT NULL DEFAULT '',
    goal_id       BIGINT,
    is_prefetch   BOOLEAN     NOT NULL DEFAULT FALSE,
    confirmed     BOOLEAN     NOT NULL DEFAULT FALSE,
    viewport      TEXT        NOT NULL DEFAULT '',
    color_scheme  TEXT        NOT NULL DEFAULT '',
    printed       BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS analytics_events_ts_brin ON analytics_events USING brin (ts);

-- Additive daily rollups. dimension = 'total' (value '') carries the
-- session-level extras; every other dimension carries the four additive
-- metrics. Rebuilt idempotently per day by analytics_rollup().
CREATE TABLE IF NOT EXISTS analytics_daily (
    day                  DATE   NOT NULL,
    dimension            TEXT   NOT NULL,
    value                TEXT   NOT NULL DEFAULT '',
    visitors             BIGINT NOT NULL DEFAULT 0,
    pageviews            BIGINT NOT NULL DEFAULT 0,
    visits               BIGINT NOT NULL DEFAULT 0,
    conversions          BIGINT NOT NULL DEFAULT 0,
    single_page_visits   BIGINT NOT NULL DEFAULT 0,
    multi_page_visits    BIGINT NOT NULL DEFAULT 0,
    median_visit_seconds DOUBLE PRECISION,
    converting_visits    BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, dimension, value)
);

-- Bots are never stored as raw rows — only daily hit counts per
-- category/name.
CREATE TABLE IF NOT EXISTS analytics_bots_daily (
    day      DATE   NOT NULL,
    category TEXT   NOT NULL,
    name     TEXT   NOT NULL,
    hits     BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, category, name)
);

CREATE TABLE IF NOT EXISTS analytics_goals (
    id           BIGSERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    kind         TEXT NOT NULL,
    path_pattern TEXT NOT NULL DEFAULT '',
    method       TEXT NOT NULL DEFAULT '',
    link_slug    TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_links (
    id          BIGSERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    label       TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_config (
    id         BIGSERIAL PRIMARY KEY,
    key        TEXT NOT NULL UNIQUE,
    value      JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down
-- DROP TABLE IF EXISTS analytics_events, analytics_daily, analytics_bots_daily,
--   analytics_goals, analytics_links, analytics_config;
