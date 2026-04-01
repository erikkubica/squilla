ALTER TABLE node_types ADD COLUMN taxonomies JSONB NOT NULL DEFAULT '[]';
ALTER TABLE content_nodes ADD COLUMN featured_image JSONB NOT NULL DEFAULT '{}';
ALTER TABLE content_nodes ADD COLUMN excerpt TEXT NOT NULL DEFAULT '';
ALTER TABLE content_nodes ADD COLUMN taxonomies JSONB NOT NULL DEFAULT '{}';

-- Seed taxonomies for core types
UPDATE node_types SET taxonomies = '[{"slug": "category", "label": "Category", "multiple": true}]' WHERE slug IN ('page', 'post');
