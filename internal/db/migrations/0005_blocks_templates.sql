CREATE TABLE IF NOT EXISTS block_types (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'square',
    description TEXT NOT NULL DEFAULT '',
    field_schema JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    block_config JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (Pre-2026-05-06 this migration also seeded "hero/text/image/cta/gallery/
-- video" block_types with an old field schema. Themes now own those slugs
-- via their block.json/view.html files; the seeded rows blocked theme
-- upserts because they were tagged source='custom'. The legacy seed has
-- been removed; migration 0045 purges any rows already inserted by an
-- earlier run of this file.)
