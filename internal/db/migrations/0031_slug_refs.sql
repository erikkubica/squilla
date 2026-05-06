-- 0031_slug_refs.sql
-- Slug-based portable references for UI entities (media, layouts, layout_blocks,
-- block_types). Adds the missing slug column to media_files, adds a slug-based
-- layout reference to content_nodes so layouts survive theme cycles even if the
-- id FK is dropped, and drops the ON DELETE SET NULL cascade that used to wipe
-- layout_id on every theme deactivate/reactivate.

-- media_files.slug is handled by media-manager extension migration 007_media_files_slug.sql
-- (moved out of core because media_files is an extension-owned table)

-- ── content_nodes.layout_slug ────────────────────────────────────────────────
ALTER TABLE content_nodes ADD COLUMN IF NOT EXISTS layout_slug TEXT;

-- Backfill from current layout_id join.
UPDATE content_nodes c
SET layout_slug = l.slug
FROM layouts l
WHERE c.layout_id = l.id
  AND c.layout_slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_nodes_layout_slug ON content_nodes(layout_slug);

-- ── Drop cascade FK on content_nodes.layout_id ────────────────────────────────
-- Keep the column as a hint/cache but the authoritative reference is now slug.
-- Without the FK cascade, deleting a layout no longer nulls every node using it.
ALTER TABLE content_nodes DROP CONSTRAINT IF EXISTS content_nodes_layout_id_fkey;
