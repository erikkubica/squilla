-- Migration 007: slug column on media_files for portable references.
-- Moved from core migration 0031_slug_refs.sql — media_files is extension-owned.

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
