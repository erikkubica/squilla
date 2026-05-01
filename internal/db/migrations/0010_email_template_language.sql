-- Migration 0010: Add language_id to users for translatable emails.
--
-- The email_templates portion of this migration moved to
-- extensions/email-manager/migrations/002_email_tables.sql per the
-- kernel/extensions hard rule. users.language_id stays in the kernel
-- because users is a kernel-private table — extensions can't ALTER it
-- through the data-store gate.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'language_id'
    ) THEN
        ALTER TABLE users ADD COLUMN language_id INT REFERENCES languages(id);
    END IF;
END $$;
