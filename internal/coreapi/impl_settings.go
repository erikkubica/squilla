package coreapi

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm/clause"

	"squilla/internal/events"
	"squilla/internal/models"
	"squilla/internal/secrets"
)

// defaultLocale returns the code of the language flagged is_default=true.
// Used as the read-fallback row when a per-locale value is missing and as
// the implicit write target when the caller didn't specify a locale.
//
// Returns "" when no default language exists (fresh install before language
// seeding); callers treat that the same way they used to treat the legacy
// shared sentinel.
func (c *coreImpl) defaultLocale(ctx context.Context) string {
	var code string
	err := c.db.WithContext(ctx).
		Table("languages").
		Select("code").
		Where("is_default = ?", true).
		Limit(1).
		Scan(&code).Error
	if err != nil {
		return ""
	}
	return code
}

// readSettingForLocale fetches the raw stored value for (key, locale) with
// fallback to (key, default_locale). Returns ("", nil) for absent rows so
// "setting not configured" stays an expected path instead of an error.
func (c *coreImpl) readSettingForLocale(ctx context.Context, key, locale string) (string, error) {
	def := c.defaultLocale(ctx)
	if locale == "" {
		locale = def
	}
	if locale != "" {
		v, ok, err := c.readSettingExact(ctx, key, locale)
		if err != nil {
			return "", err
		}
		if ok {
			return v, nil
		}
	}
	if def != "" && def != locale {
		v, _, err := c.readSettingExact(ctx, key, def)
		return v, err
	}
	return "", nil
}

// readSettingExact looks up the row at exactly (key, locale) without falling
// back. Returns ("", false, nil) when missing.
func (c *coreImpl) readSettingExact(ctx context.Context, key, locale string) (string, bool, error) {
	var rows []models.SiteSetting
	err := c.db.WithContext(ctx).
		Where("\"key\" = ? AND language_code = ?", key, locale).
		Limit(1).Find(&rows).Error
	if err != nil {
		return "", false, fmt.Errorf("coreapi readSetting: %w", err)
	}
	if len(rows) == 0 {
		return "", false, nil
	}
	if rows[0].Value == nil {
		return "", true, nil
	}
	return *rows[0].Value, true, nil
}

// decryptIfSecret transparently decrypts when the key is secret-shaped
// and the stored value is wrapped in the encryption envelope. Plaintext
// values pass through, so legacy rows from before encryption was
// configured still work.
func (c *coreImpl) decryptIfSecret(key, raw string) (string, error) {
	if raw == "" || c.secrets == nil || !secrets.IsSecretKey(key) {
		return raw, nil
	}
	return c.secrets.Decrypt(raw)
}

// GetSetting returns the value for a site setting key resolved at the
// default language. Locale-aware callers should use GetSettingLoc.
func (c *coreImpl) GetSetting(ctx context.Context, key string) (string, error) {
	return c.GetSettingLoc(ctx, key, "")
}

// GetSettingLoc returns the value for (key, locale), falling back to the
// default-language row when no per-locale row exists. Pass "" to read at the
// default language directly.
func (c *coreImpl) GetSettingLoc(ctx context.Context, key, locale string) (string, error) {
	raw, err := c.readSettingForLocale(ctx, key, locale)
	if err != nil {
		return "", err
	}
	return c.decryptIfSecret(key, raw)
}

// SetSetting upserts a site setting at the default language.
// Locale-aware callers should use SetSettingLoc.
func (c *coreImpl) SetSetting(ctx context.Context, key, value string) error {
	return c.SetSettingLoc(ctx, key, "", value)
}

// SetSettingLoc upserts a site setting for the given (key, locale). Pass
// "" for locale to write at the default language.
func (c *coreImpl) SetSettingLoc(ctx context.Context, key, locale, value string) error {
	if locale == "" {
		locale = c.defaultLocale(ctx)
	}
	stored := value
	if c.secrets != nil && secrets.IsSecretKey(key) {
		enc, err := c.secrets.MaybeEncrypt(value)
		if err != nil {
			return fmt.Errorf("coreapi SetSetting encrypt: %w", err)
		}
		stored = enc
	}

	// Upsert atomically — find-then-create has a race window when multiple
	// goroutines (e.g. sitemap rebuild + admin save) hit the same key.
	row := models.SiteSetting{Key: key, LanguageCode: locale, Value: &stored}
	res := c.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}, {Name: "language_code"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&row)
	if res.Error != nil {
		return fmt.Errorf("coreapi SetSetting upsert: %w", res.Error)
	}
	c.publishSettingUpdated(key, locale)
	return nil
}

// publishSettingUpdated fires `setting.updated` so subscribers (notably the
// public handler's site-settings cache) can invalidate. Without this,
// scripts that mutate settings — including kernel pointers like
// `homepage_node_id` — leave the in-process cache stale until the next
// theme.activate or process restart.
func (c *coreImpl) publishSettingUpdated(key, locale string) {
	if c.eventBus == nil {
		return
	}
	c.eventBus.Publish("setting.updated", events.Payload{
		"key":           key,
		"language_code": locale,
	})
}

// GetSettings returns settings matching an optional prefix at the default
// language. Locale-aware callers should use GetSettingsLoc.
func (c *coreImpl) GetSettings(ctx context.Context, prefix string) (map[string]string, error) {
	return c.GetSettingsLoc(ctx, prefix, "")
}

// GetSettingsGlobal returns the language_code="" rows under the given
// prefix — the "applies to every language" sentinel used by
// non-translatable theme/site settings. Distinct from GetSettingsLoc(_,
// "") which rewrites empty locale to the default-language row and then
// falls back through it. Callers needing the global row specifically
// (theme render path, etc.) reach for this.
func (c *coreImpl) GetSettingsGlobal(ctx context.Context, prefix string) (map[string]string, error) {
	q := c.db.WithContext(ctx).Model(&models.SiteSetting{}).Where("language_code = ?", "")
	if prefix != "" {
		q = q.Where("\"key\" LIKE ?", prefix+"%")
	}
	var rows []models.SiteSetting
	if err := q.Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("coreapi GetSettingsGlobal: %w", err)
	}
	out := make(map[string]string, len(rows))
	for _, r := range rows {
		v := ""
		if r.Value != nil {
			v = *r.Value
		}
		key := r.Key
		if prefix != "" {
			key = key[len(prefix):]
		}
		out[key] = v
	}
	return out, nil
}

// GetSettingsLoc returns settings matching an optional prefix, with per-key
// fallback semantics: each key returns its (key, locale) value if present,
// otherwise the default-language row, otherwise the global
// (language_code="") row used by non-translatable settings. The
// result map is keyed by trimmed key, same shape as GetSettings.
func (c *coreImpl) GetSettingsLoc(ctx context.Context, prefix, locale string) (map[string]string, error) {
	def := c.defaultLocale(ctx)
	if locale == "" {
		locale = def
	}

	var settings []models.SiteSetting

	query := c.db.WithContext(ctx).Model(&models.SiteSetting{})
	if prefix != "" {
		query = query.Where("\"key\" LIKE ?", prefix+"%")
	}
	// Non-translatable settings live in language_code='' rows (the
	// "every language" sentinel), so they are always part of the lookup.
	// Precedence per key: requested locale > default locale > global.
	langs := []string{""}
	if locale != "" {
		langs = append(langs, locale)
	}
	if def != "" && def != locale {
		langs = append(langs, def)
	}
	query = query.Where("language_code IN ?", langs)

	if err := query.Find(&settings).Error; err != nil {
		return nil, fmt.Errorf("coreapi GetSettings: %w", err)
	}

	rank := func(lc string) int {
		switch {
		case lc == locale && lc != "":
			return 2
		case lc == def && lc != "":
			return 1
		default:
			return 0
		}
	}
	type row struct {
		val  string
		rank int
	}
	chosen := make(map[string]row, len(settings))
	for _, s := range settings {
		v := ""
		if s.Value != nil {
			v = *s.Value
		}
		r := rank(s.LanguageCode)
		if existing, ok := chosen[s.Key]; !ok || r > existing.rank {
			chosen[s.Key] = row{val: v, rank: r}
		}
	}

	result := make(map[string]string, len(chosen))
	for fullKey, r := range chosen {
		k := fullKey
		if prefix != "" {
			k = strings.TrimPrefix(k, prefix)
		}
		decrypted, err := c.decryptIfSecret(fullKey, r.val)
		if err != nil {
			return nil, fmt.Errorf("coreapi GetSettings decrypt %q: %w", fullKey, err)
		}
		result[k] = decrypted
	}
	return result, nil
}
