-- 0031_slug_refs.sql
-- Slug-based portable references for UI entities (media, layouts, layout_blocks,
-- block_types). Adds the missing slug column to media_files, adds a slug-based
-- layout reference to content_nodes so layouts survive theme cycles even if the
-- id FK is dropped, and drops the ON DELETE SET NULL cascade that used to wipe
-- layout_id on every theme deactivate/reactivate.

-- ── media_files.slug ─────────────────────────────────────────────────────────
-- Nullable first so we can backfill without breaking existing rows.
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill: slugify original_name (fall back to filename).
UPDATE media_files
SET slug = regexp_replace(
    lower(regexp_replace(coalesce(original_name, filename), '\.[^.]+$', '')),
    '[^a-z0-9]+', '-', 'g'
)
WHERE slug IS NULL;

-- De-duplicate by appending -<id> to collisions.
UPDATE media_files m
SET slug = m.slug || '-' || m.id
FROM (
    SELECT slug
    FROM media_files
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING count(*) > 1
) dup
WHERE m.slug = dup.slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_files_slug ON media_files(slug);

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
