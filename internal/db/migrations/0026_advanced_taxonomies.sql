-- Add advanced columns to taxonomies table (idempotent)
ALTER TABLE taxonomies ADD COLUMN IF NOT EXISTS hierarchical BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE taxonomies ADD COLUMN IF NOT EXISTS show_ui BOOLEAN NOT NULL DEFAULT TRUE;

-- Add fields_data to taxonomy_terms to store custom field values
ALTER TABLE taxonomy_terms ADD COLUMN IF NOT EXISTS fields_data JSONB NOT NULL DEFAULT '{}';
