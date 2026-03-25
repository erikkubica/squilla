-- Replace full_url UNIQUE constraint with partial unique index
-- that excludes soft-deleted rows, so deleted nodes don't block new ones.
ALTER TABLE content_nodes DROP CONSTRAINT IF EXISTS content_nodes_full_url_key;
DROP INDEX IF EXISTS content_nodes_full_url_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_full_url_active ON content_nodes(full_url) WHERE deleted_at IS NULL;
