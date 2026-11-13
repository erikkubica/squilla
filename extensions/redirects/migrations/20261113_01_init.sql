-- Up
-- Redirects extension storage. Every statement is idempotent so the file can
-- be re-applied safely (activation re-runs, restored backups).

-- One row per redirect rule.
--   match_type  exact  : source is a path, optionally with ?query constraints
--               prefix : source is a path prefix ("/blog" covers /blog/**)
--               regex  : source is an RE2 expression matched against the path
--   status_code 301/302/307/308 redirect to target; 410 answers Gone (no target)
--   origin      manual : created by an editor (or an import)
--               auto   : created when a published node's URL changed
CREATE TABLE IF NOT EXISTS redirects_rules (
    id          BIGSERIAL PRIMARY KEY,
    source      TEXT        NOT NULL,
    match_type  TEXT        NOT NULL DEFAULT 'exact',
    target      TEXT        NOT NULL DEFAULT '',
    status_code INTEGER     NOT NULL DEFAULT 301,
    enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
    keep_query  BOOLEAN     NOT NULL DEFAULT TRUE,
    note        TEXT        NOT NULL DEFAULT '',
    origin      TEXT        NOT NULL DEFAULT 'manual',
    node_id     BIGINT      NOT NULL DEFAULT 0,
    hits        BIGINT      NOT NULL DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_redirects_rules_source ON redirects_rules (match_type, source);

-- Extension-level switches (key/value).
CREATE TABLE IF NOT EXISTS redirects_config (
    id    BIGSERIAL PRIMARY KEY,
    key   TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL DEFAULT ''
);
