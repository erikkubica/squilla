CREATE TABLE IF NOT EXISTS node_types (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'file-text',
    description TEXT NOT NULL DEFAULT '',
    field_schema JSONB NOT NULL DEFAULT '[]',
    url_prefixes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add fields_data column to content_nodes for custom field values
ALTER TABLE content_nodes ADD COLUMN IF NOT EXISTS fields_data JSONB NOT NULL DEFAULT '{}';

-- Seed default node types
-- Add url_prefixes column if upgrading from earlier migration
ALTER TABLE node_types ADD COLUMN IF NOT EXISTS url_prefixes JSONB NOT NULL DEFAULT '{}';

INSERT INTO node_types (slug, label, icon, description, field_schema, url_prefixes) VALUES
    ('page', 'Page', 'file-text', 'Standard page', '[]', '{}'),
    ('post', 'Post', 'newspaper', 'Blog post', '[]', '{"en": "blog", "es": "blog", "fr": "blog", "de": "blog", "pt": "blog"}')
ON CONFLICT (slug) DO NOTHING;
