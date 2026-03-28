-- Activate built-in extensions on fresh installs
UPDATE extensions SET is_active = true WHERE slug IN ('media-manager', 'email-manager', 'sitemap-generator') AND is_active = false;
