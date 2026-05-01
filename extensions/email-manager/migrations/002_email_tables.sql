-- Email Manager Migration 002: Email tables (templates, rules, logs, layouts)
--
-- These tables were historically created by kernel migrations
-- 0009/0010/0020. Per the kernel/extensions hard rule (CLAUDE.md), email
-- is a feature owned by this extension — the manifest's
-- data_owned_tables array names every table below. CREATE TABLE IF NOT
-- EXISTS makes this migration a no-op on installs that ran the kernel
-- migrations before the extraction; fresh installs get the tables when
-- email-manager activates.
--
-- See docs/extension_api.md §10 "Migration Ownership Transfer" for the
-- full pattern.

-- ============================================================
-- Email Templates
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id               SERIAL PRIMARY KEY,
    slug             VARCHAR(100) NOT NULL,
    name             VARCHAR(150) NOT NULL,
    subject_template TEXT NOT NULL DEFAULT '',
    body_template    TEXT NOT NULL DEFAULT '',
    test_data        JSONB NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Translatable templates: kernel migration 0010 added language_id and
-- swapped slug-only uniqueness for the (slug, language_id) split. Repeat
-- the same idempotent shape so fresh installs that never saw 0010 land
-- in the right schema.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'email_templates' AND column_name = 'language_id'
    ) THEN
        ALTER TABLE email_templates ADD COLUMN language_id INT REFERENCES languages(id);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'email_templates' AND constraint_name = 'email_templates_slug_key'
    ) THEN
        ALTER TABLE email_templates DROP CONSTRAINT email_templates_slug_key;
    END IF;
END $$;
DROP INDEX IF EXISTS idx_email_templates_slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_slug_lang
    ON email_templates (slug, language_id) WHERE language_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_slug_universal
    ON email_templates (slug) WHERE language_id IS NULL;

-- ============================================================
-- Email Rules
-- ============================================================
CREATE TABLE IF NOT EXISTS email_rules (
    id              SERIAL PRIMARY KEY,
    action          VARCHAR(100) NOT NULL,
    node_type       VARCHAR(50),
    template_id     INT NOT NULL REFERENCES email_templates(id),
    recipient_type  VARCHAR(20) NOT NULL,
    recipient_value VARCHAR(500) NOT NULL DEFAULT '',
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Email Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id              SERIAL PRIMARY KEY,
    rule_id         INT REFERENCES email_rules(id) ON DELETE SET NULL,
    template_slug   VARCHAR(100) NOT NULL,
    action          VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject         TEXT NOT NULL,
    rendered_body   TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL,
    error_message   TEXT,
    provider        VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_status     ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_action     ON email_logs(action);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- ============================================================
-- Email Layouts
-- ============================================================
CREATE TABLE IF NOT EXISTS email_layouts (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    language_id   INT REFERENCES languages(id),
    body_template TEXT NOT NULL,
    is_default    BOOLEAN NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_layouts_lang
    ON email_layouts (language_id) WHERE language_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_layouts_universal
    ON email_layouts ((true)) WHERE language_id IS NULL;
