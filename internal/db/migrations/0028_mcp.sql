CREATE TABLE IF NOT EXISTS mcp_tokens (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    token_hash   VARCHAR(64) NOT NULL UNIQUE,
    token_prefix VARCHAR(16) NOT NULL,
    scope        VARCHAR(16) NOT NULL DEFAULT 'full',
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_used_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user_id ON mcp_tokens(user_id);

CREATE TABLE IF NOT EXISTS mcp_audit_log (
    id          BIGSERIAL PRIMARY KEY,
    token_id    INT REFERENCES mcp_tokens(id) ON DELETE SET NULL,
    tool        VARCHAR(100) NOT NULL,
    args_hash   VARCHAR(64),
    status      VARCHAR(16) NOT NULL,
    error_code  VARCHAR(64),
    duration_ms INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_token_created ON mcp_audit_log(token_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_tool_created ON mcp_audit_log(tool, created_at DESC);
