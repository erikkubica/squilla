-- Add supports_blocks flag to node_types and layouts.
-- When FALSE, the admin node editor hides the block composition section.
-- Default TRUE for backwards compatibility.

ALTER TABLE node_types
    ADD COLUMN IF NOT EXISTS supports_blocks BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE layouts
    ADD COLUMN IF NOT EXISTS supports_blocks BOOLEAN NOT NULL DEFAULT TRUE;
