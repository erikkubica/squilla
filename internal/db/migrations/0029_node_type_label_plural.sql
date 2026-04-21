-- Add plural label for node types. Empty string means "fall back to label".
ALTER TABLE node_types
  ADD COLUMN IF NOT EXISTS label_plural VARCHAR(100) NOT NULL DEFAULT '';
