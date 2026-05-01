-- Email Manager Migration 003: Seed default templates, rules, layout.
--
-- Idempotent inserts — re-activating the extension on an install that
-- already has welcome/password-reset/etc. rows leaves them alone. These
-- rows historically came from kernel migrations 0009 + 0020 and from
-- internal/db/seed_content.go's seedEmailTemplates / seedEmailRules.
-- Both of those have been removed; the canonical seed lives here so the
-- extension owns its own initial data.

-- ---------- Default templates ----------
INSERT INTO email_templates (slug, name, subject_template, body_template, test_data)
SELECT 'welcome', 'Welcome Email', 'Welcome to {{.site.name}}',
    E'Hi {{.user.full_name}},\n\nWelcome to {{.site.name}}! Your account has been created.\n\nYou can log in at: {{.site.url}}/login',
    '{"user": {"full_name": "Jane Doe", "email": "jane@example.com"}, "site": {"name": "My Site", "url": "https://example.com"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = 'welcome');

INSERT INTO email_templates (slug, name, subject_template, body_template, test_data)
SELECT 'user-registered-admin', 'Admin: New User Registered', 'New user registered: {{.user.full_name}}',
    E'A new user has registered on {{.site.name}}.\n\nName: {{.user.full_name}}\nEmail: {{.user.email}}',
    '{"user": {"full_name": "Jane Doe", "email": "jane@example.com"}, "site": {"name": "My Site"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = 'user-registered-admin');

INSERT INTO email_templates (slug, name, subject_template, body_template, test_data)
SELECT 'password-reset', 'Password Reset', 'Reset your password',
    E'Hi {{.user.full_name}},\n\nYou requested a password reset for your account on {{.site.name}}.\n\nClick here to reset your password: {{.reset_url}}\n\nIf you didn''t request this, you can safely ignore this email.',
    '{"user": {"full_name": "Jane Doe"}, "site": {"name": "My Site"}, "reset_url": "https://example.com/reset?token=abc123"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = 'password-reset');

INSERT INTO email_templates (slug, name, subject_template, body_template, test_data)
SELECT 'node-published', 'Node Published', '{{.node.title}} has been published',
    E'Hi {{.user.full_name}},\n\n"{{.node.title}}" ({{.node.node_type}}) has been published on {{.site.name}}.\n\nView it at: {{.site.url}}{{.node.full_url}}',
    '{"user": {"full_name": "Jane Doe"}, "node": {"title": "Hello World", "node_type": "post", "full_url": "/hello-world"}, "site": {"name": "My Site", "url": "https://example.com"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = 'node-published');

INSERT INTO email_templates (slug, name, subject_template, body_template, test_data)
SELECT 'node-created-admin', 'Admin: New Node Created', 'New {{.node.node_type}} created: {{.node.title}}',
    E'A new {{.node.node_type}} has been created on {{.site.name}}.\n\nTitle: {{.node.title}}\nAuthor: {{.author.full_name}}\nURL: {{.site.url}}{{.node.full_url}}',
    '{"node": {"title": "Hello World", "node_type": "post", "full_url": "/hello-world"}, "author": {"full_name": "Jane Doe"}, "site": {"name": "My Site", "url": "https://example.com"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE slug = 'node-created-admin');

-- ---------- Default rules (linked to seeded templates) ----------
INSERT INTO email_rules (action, node_type, template_id, recipient_type, recipient_value, enabled)
SELECT 'user.registered', NULL, et.id, 'actor', '', true
FROM email_templates et WHERE et.slug = 'welcome'
AND NOT EXISTS (SELECT 1 FROM email_rules er WHERE er.action = 'user.registered' AND er.recipient_type = 'actor');

INSERT INTO email_rules (action, node_type, template_id, recipient_type, recipient_value, enabled)
SELECT 'user.registered', NULL, et.id, 'role', 'admin', true
FROM email_templates et WHERE et.slug = 'user-registered-admin'
AND NOT EXISTS (SELECT 1 FROM email_rules er WHERE er.action = 'user.registered' AND er.recipient_type = 'role');

INSERT INTO email_rules (action, node_type, template_id, recipient_type, recipient_value, enabled)
SELECT 'node.published', NULL, et.id, 'node_author', '', true
FROM email_templates et WHERE et.slug = 'node-published'
AND NOT EXISTS (SELECT 1 FROM email_rules er WHERE er.action = 'node.published' AND er.recipient_type = 'node_author');

INSERT INTO email_rules (action, node_type, template_id, recipient_type, recipient_value, enabled)
SELECT 'node.created', NULL, et.id, 'role', 'admin', true
FROM email_templates et WHERE et.slug = 'node-created-admin'
AND NOT EXISTS (SELECT 1 FROM email_rules er WHERE er.action = 'node.created' AND er.recipient_type = 'role');

-- ---------- Default universal layout ----------
INSERT INTO email_layouts (name, language_id, body_template, is_default)
SELECT 'Default Layout', NULL, '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=0" />
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#2563eb; padding:24px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600; letter-spacing:-0.02em;">{{.site.site_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff; padding:32px;">
              {{.email_body}}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e2e8f0;">
              <p style="margin:0; color:#94a3b8; font-size:13px;">&copy; {{.site.site_name}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', true
WHERE NOT EXISTS (
    SELECT 1 FROM email_layouts WHERE language_id IS NULL
);
