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

-- Seed some default block types
INSERT INTO block_types (slug, label, icon, description, field_schema) VALUES
    ('hero', 'Hero Section', 'layout-template', 'A large hero banner with title, subtitle, and optional CTA', '[{"key":"title","label":"Title","type":"text","required":true},{"key":"subtitle","label":"Subtitle","type":"textarea"},{"key":"cta_text","label":"Button Text","type":"text"},{"key":"cta_url","label":"Button URL","type":"text"},{"key":"background_image","label":"Background Image","type":"image"}]'),
    ('text', 'Text Block', 'type', 'Rich text content block', '[{"key":"content","label":"Content","type":"textarea","required":true}]'),
    ('image', 'Image Block', 'image', 'Single image with caption', '[{"key":"url","label":"Image URL","type":"image","required":true},{"key":"alt","label":"Alt Text","type":"text"},{"key":"caption","label":"Caption","type":"text"}]'),
    ('cta', 'Call to Action', 'mouse-pointer-click', 'Call to action button section', '[{"key":"heading","label":"Heading","type":"text","required":true},{"key":"description","label":"Description","type":"textarea"},{"key":"button_text","label":"Button Text","type":"text","required":true},{"key":"button_url","label":"Button URL","type":"text","required":true}]'),
    ('gallery', 'Image Gallery', 'images', 'Grid of images', '[{"key":"images","label":"Image URLs (one per line)","type":"textarea","required":true},{"key":"columns","label":"Columns","type":"number"}]'),
    ('video', 'Video Embed', 'play', 'Embedded video player', '[{"key":"url","label":"Video URL","type":"text","required":true},{"key":"title","label":"Title","type":"text"}]')
ON CONFLICT (slug) DO NOTHING;
