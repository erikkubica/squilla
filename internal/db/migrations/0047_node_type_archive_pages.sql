-- 0047_node_type_archive_pages.sql
--
-- Explicit archive page per content type and language (WordPress's
-- page_for_posts, generalised). Map of language_code → content node id:
-- {"en": 12, "de": 34}. The node lists the type's items, and taxonomy-term
-- archives live under its URL (/<archive page>/<taxonomy>/<term>).
-- Unset languages fall back to the published node at the type's URL prefix,
-- so existing sites keep working without a data migration.

ALTER TABLE node_types ADD COLUMN IF NOT EXISTS archive_node_ids JSONB NOT NULL DEFAULT '{}';
