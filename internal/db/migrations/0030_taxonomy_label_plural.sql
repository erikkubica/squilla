-- Add plural label for taxonomies. Empty string means "fall back to label".
ALTER TABLE taxonomies
  ADD COLUMN IF NOT EXISTS label_plural VARCHAR(255) NOT NULL DEFAULT '';
