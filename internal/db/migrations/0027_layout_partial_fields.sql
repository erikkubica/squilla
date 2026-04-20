-- Add field_schema to layout_blocks for partial field definitions
ALTER TABLE layout_blocks ADD COLUMN IF NOT EXISTS field_schema JSONB NOT NULL DEFAULT '[]';

-- Add layout_data to content_nodes for per-node partial field values
ALTER TABLE content_nodes ADD COLUMN IF NOT EXISTS layout_data JSONB NOT NULL DEFAULT '{}';
