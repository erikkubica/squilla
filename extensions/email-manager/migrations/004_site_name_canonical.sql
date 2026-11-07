-- Email Manager Migration 004: canonical `.site.name` / `.site.url`.
--
-- The seeded default layout (003) used `{{.site.site_name}}`, while template
-- test data and the docs use `{{.site.name}}`, so previews rendered an empty
-- site name. The dispatcher exposes both spellings at send time
-- (loadSiteContext), so rewriting to the canonical keys is safe even for
-- rows an operator has edited. The aliases stay available at runtime.

UPDATE email_layouts
SET body_template = REPLACE(REPLACE(body_template,
        '{{.site.site_name}}', '{{.site.name}}'),
        '{{.site.site_url}}', '{{.site.url}}')
WHERE body_template LIKE '%{{.site.site_name}}%'
   OR body_template LIKE '%{{.site.site_url}}%';

UPDATE email_templates
SET subject_template = REPLACE(REPLACE(subject_template,
        '{{.site.site_name}}', '{{.site.name}}'),
        '{{.site.site_url}}', '{{.site.url}}'),
    body_template = REPLACE(REPLACE(body_template,
        '{{.site.site_name}}', '{{.site.name}}'),
        '{{.site.site_url}}', '{{.site.url}}')
WHERE subject_template LIKE '%{{.site.site_%'
   OR body_template LIKE '%{{.site.site_%';
