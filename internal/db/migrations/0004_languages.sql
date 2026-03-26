CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    slug VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL DEFAULT '',
    flag VARCHAR(10) NOT NULL DEFAULT '',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    hide_prefix BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add slug column if upgrading from earlier migration
ALTER TABLE languages ADD COLUMN IF NOT EXISTS slug VARCHAR(20);
UPDATE languages SET slug = code WHERE slug IS NULL OR slug = '';
ALTER TABLE languages ALTER COLUMN slug SET NOT NULL;
ALTER TABLE languages ADD COLUMN IF NOT EXISTS hide_prefix BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
    ALTER TABLE languages ADD CONSTRAINT languages_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Seed default languages
INSERT INTO languages (code, slug, name, native_name, flag, is_default, is_active, sort_order) VALUES
    ('en', 'en', 'English', 'English', '🇬🇧', TRUE, TRUE, 0),
    ('es', 'es', 'Spanish', 'Español', '🇪🇸', FALSE, TRUE, 1),
    ('fr', 'fr', 'French', 'Français', '🇫🇷', FALSE, TRUE, 2),
    ('de', 'de', 'German', 'Deutsch', '🇩🇪', FALSE, TRUE, 3),
    ('pt', 'pt', 'Portuguese', 'Português', '🇵🇹', FALSE, TRUE, 4)
ON CONFLICT (code) DO NOTHING;
