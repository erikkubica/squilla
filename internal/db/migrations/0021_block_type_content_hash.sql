-- Add content_hash column to block_types for change detection.
-- Blocks are only updated on load when hash differs, preventing unnecessary writes.
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) NOT NULL DEFAULT '';
