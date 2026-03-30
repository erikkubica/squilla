-- Add cache_output toggle to block_types.
-- When false, the rendered HTML output of this block type is never cached.
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS cache_output BOOLEAN NOT NULL DEFAULT true;
