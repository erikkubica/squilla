-- 0046_admin_role_wildcard.sql
--
-- The system admin role gets "*":true, which grants every capability that
-- extensions register (view_analytics, manage_forms, ...). Roles are only
-- seeded on first boot, so sites installed before the wildcard existed have
-- an admin role without it, and every capability-gated extension menu stays
-- hidden from their administrators. An explicit "*" (even false) is kept.

UPDATE roles
SET capabilities = capabilities || '{"*": true}'::jsonb
WHERE slug = 'admin' AND is_system AND NOT (capabilities ? '*');
