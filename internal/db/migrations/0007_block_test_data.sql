-- Add test_data column to block_types for storing preview test data
ALTER TABLE block_types ADD COLUMN IF NOT EXISTS test_data JSONB NOT NULL DEFAULT '{}';
