-- Migration 0009: Roles + System Actions
--
-- This file historically also created email_templates / email_rules /
-- email_logs and seeded their default rows. Per the kernel/extensions
-- hard rule (CLAUDE.md), email is a feature owned by the email-manager
-- extension. Those sections moved to:
--     extensions/email-manager/migrations/002_email_tables.sql
--     extensions/email-manager/migrations/003_email_seed_data.sql
--
-- Existing installs already ran the original version of this file —
-- their schema_migrations row still references the filename so this
-- truncated body never re-runs against them. Fresh installs apply only
-- the kernel concerns below; email tables land via the extension's
-- migrations on activation.

-- ============================================================
-- 1. Roles table
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(50) UNIQUE NOT NULL,
    name         VARCHAR(100) NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    is_system    BOOLEAN NOT NULL DEFAULT false,
    capabilities JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default roles. manage_email and email_subscriptions are deliberately
-- absent — those are extension concerns and are added by the email-manager
-- extension on activation (see extensions/email-manager/scripts/extension.tengo).
INSERT INTO roles (slug, name, description, is_system, capabilities) VALUES
(
    'admin', 'Admin', 'Full access to all features', true,
    '{
        "admin_access": true,
        "manage_users": true,
        "manage_roles": true,
        "manage_settings": true,
        "manage_menus": true,
        "manage_layouts": true,
        "default_node_access": { "access": "write", "scope": "all" }
    }'::jsonb
),
(
    'editor', 'Editor', 'Can edit all content and manage menus', true,
    '{
        "admin_access": true,
        "manage_users": false,
        "manage_roles": false,
        "manage_settings": false,
        "manage_menus": true,
        "manage_layouts": false,
        "default_node_access": { "access": "write", "scope": "all" }
    }'::jsonb
),
(
    'author', 'Author', 'Can create and edit own content', true,
    '{
        "admin_access": true,
        "manage_users": false,
        "manage_roles": false,
        "manage_settings": false,
        "manage_menus": false,
        "manage_layouts": false,
        "default_node_access": { "access": "write", "scope": "own" }
    }'::jsonb
),
(
    'member', 'Member', 'Front-end member with read access', true,
    '{
        "admin_access": false,
        "manage_users": false,
        "manage_roles": false,
        "manage_settings": false,
        "manage_menus": false,
        "manage_layouts": false,
        "default_node_access": { "access": "read", "scope": "all" }
    }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. Migrate users.role varchar -> users.role_id FK
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role_id'
    ) THEN
        ALTER TABLE users ADD COLUMN role_id INT REFERENCES roles(id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'admin')
        WHERE role = 'admin' AND role_id IS NULL;

        UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'editor')
        WHERE role IS NOT NULL AND role != 'admin' AND role_id IS NULL;
    END IF;

    UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'editor')
    WHERE role_id IS NULL;

    ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users DROP COLUMN role;
    END IF;
END $$;

-- ============================================================
-- 3. Add author_id to content_nodes
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_nodes' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE content_nodes ADD COLUMN author_id INT REFERENCES users(id);
    END IF;
END $$;

-- ============================================================
-- 4. System Actions table
-- ============================================================
CREATE TABLE IF NOT EXISTS system_actions (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    label           VARCHAR(150) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    payload_schema  JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_actions (slug, label, category, description, payload_schema) VALUES
('user.registered', 'User Registered', 'user', 'Fired when a new user registers or is created', '["user.*"]'::jsonb),
('user.updated', 'User Updated', 'user', 'Fired when a user profile is updated', '["user.*"]'::jsonb),
('user.deleted', 'User Deleted', 'user', 'Fired when a user is deleted', '["user.*"]'::jsonb),
('user.login', 'User Login', 'user', 'Fired when a user logs in', '["user.*", "ip_address", "user_agent"]'::jsonb),
('node.created', 'Node Created', 'node', 'Fired when a content node is created', '["node.*", "node_type", "author.*"]'::jsonb),
('node.updated', 'Node Updated', 'node', 'Fired when a content node is updated', '["node.*", "node_type", "author.*", "editor.*"]'::jsonb),
('node.published', 'Node Published', 'node', 'Fired when a content node is published', '["node.*", "node_type", "author.*"]'::jsonb),
('node.unpublished', 'Node Unpublished', 'node', 'Fired when a content node is unpublished', '["node.*", "node_type", "author.*"]'::jsonb),
('node.deleted', 'Node Deleted', 'node', 'Fired when a content node is deleted', '["node.*", "node_type", "author.*"]'::jsonb),
('layout.created', 'Layout Created', 'layout', 'Fired when a layout is created', '["layout.*", "editor.*"]'::jsonb),
('layout.updated', 'Layout Updated', 'layout', 'Fired when a layout is updated', '["layout.*", "editor.*"]'::jsonb),
('layout.deleted', 'Layout Deleted', 'layout', 'Fired when a layout is deleted', '["layout.*", "editor.*"]'::jsonb),
('layout_block.created', 'Layout Block Created', 'layout_block', 'Fired when a layout block is created', '["layout_block.*", "editor.*"]'::jsonb),
('layout_block.updated', 'Layout Block Updated', 'layout_block', 'Fired when a layout block is updated', '["layout_block.*", "editor.*"]'::jsonb),
('layout_block.deleted', 'Layout Block Deleted', 'layout_block', 'Fired when a layout block is deleted', '["layout_block.*", "editor.*"]'::jsonb),
('block_type.created', 'Block Type Created', 'block_type', 'Fired when a block type is created', '["block_type.*", "editor.*"]'::jsonb),
('block_type.updated', 'Block Type Updated', 'block_type', 'Fired when a block type is updated', '["block_type.*", "editor.*"]'::jsonb),
('block_type.deleted', 'Block Type Deleted', 'block_type', 'Fired when a block type is deleted', '["block_type.*", "editor.*"]'::jsonb),
('menu.created', 'Menu Created', 'menu', 'Fired when a menu is created', '["menu.*", "editor.*"]'::jsonb),
('menu.updated', 'Menu Updated', 'menu', 'Fired when a menu is updated', '["menu.*", "editor.*"]'::jsonb),
('menu.deleted', 'Menu Deleted', 'menu', 'Fired when a menu is deleted', '["menu.*", "editor.*"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;
