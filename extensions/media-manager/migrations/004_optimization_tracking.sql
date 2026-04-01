-- Track image optimization status and preserve originals for restore/re-optimization.
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS is_optimized BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_size BIGINT NOT NULL DEFAULT 0;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_path TEXT NOT NULL DEFAULT '';
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_width INT;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_height INT;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS optimization_savings BIGINT NOT NULL DEFAULT 0;
