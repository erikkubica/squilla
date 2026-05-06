-- Add html_template and source columns to block_types.
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS html_template TEXT NOT NULL DEFAULT '';
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'custom';

-- (Pre-2026-05-06 this migration also seeded HTML templates for the
-- legacy hero/text/image/cta/gallery/video block slugs. Themes now own
-- those slugs via view.html, and the legacy templates used a different
-- field schema (.title/.cta_text/.button_url/raw .images) that didn't
-- match the modern blocks — rendering broken markup like an empty <h1>
-- and a Go-fmt'd images array. Migration 0045 purges any leftover
-- legacy rows so the theme can register fresh templates.)
