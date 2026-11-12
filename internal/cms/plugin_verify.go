package cms

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"gorm.io/gorm"

	"squilla/internal/models"
)

// pluginPinSettingKey is the site_settings key holding the trusted
// SHA-256 for a plugin binary. Format:
//
//	plugin.<slug>.<binary>.sha256 = <hex digest>
//
// where <binary> is the basename of the binary path declared in the
// extension manifest. Storing pins in site_settings keeps them under
// the kernel's audit trail (capability gates, settings handler) and
// out of the on-disk manifest — an attacker who can rewrite the bin/
// directory typically can't also rewrite settings rows.
func pluginPinSettingKey(slug, binary string) string {
	// Use just the basename so pins survive an extension being moved to
	// a new path (e.g. when reinstalling from a different upload).
	binBase := binary
	if i := strings.LastIndex(binBase, "/"); i >= 0 {
		binBase = binBase[i+1:]
	}
	return fmt.Sprintf("plugin.%s.%s.sha256", slug, binBase)
}

// hashFile returns the lowercase hex SHA-256 of the file at path.
func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", fmt.Errorf("open: %w", err)
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", fmt.Errorf("read: %w", err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// ErrPluginHashMismatch indicates that a plugin binary's SHA-256 did
// not match the operator's pinned value. The kernel refuses to start
// such a plugin.
var ErrPluginHashMismatch = errors.New("plugin binary SHA-256 mismatch")

// requirePinsEnv opts an install into strict pin enforcement: when set to
// a true value, a plugin binary without an operator-pinned SHA-256 is
// refused instead of loaded. Off by default so existing installs (and
// first boot) keep working.
const requirePinsEnv = "SQUILLA_REQUIRE_PLUGIN_PINS"

// ErrPluginUnpinned is returned in strict mode for a binary with no pin.
var ErrPluginUnpinned = errors.New("plugin binary has no pinned SHA-256 (" + requirePinsEnv + " is set)")

func requirePluginPins() bool {
	v, _ := strconv.ParseBool(strings.TrimSpace(os.Getenv(requirePinsEnv)))
	return v
}

// verifyPluginBinary computes the SHA-256 of the binary at path and
// compares it against an operator-pinned hash in site_settings:
//
//   - When a pin exists: a mismatch returns ErrPluginHashMismatch and
//     the kernel refuses to spawn the plugin. This is the protection
//     against a swapped bin/ directory.
//   - When no pin exists: the actual digest is logged so the operator
//     can pin it, and the plugin loads — unless SQUILLA_REQUIRE_PLUGIN_PINS
//     is true, in which case it is refused (ErrPluginUnpinned).
//   - When the pin lookup itself fails, the plugin is refused (fail
//     closed): a DB error must not silently downgrade a pinned binary to
//     "unpinned, load anyway".
//
// This is integrity pinning of a known binary, not signature
// verification: whoever can write the pin setting decides what runs.
func verifyPluginBinary(db *gorm.DB, slug, binary, path string) error {
	if db == nil {
		// No DB context — skip pin verification (used in tests and
		// during early bootstrap before the DB is wired). Strict mode
		// still refuses, since nothing can be verified.
		if requirePluginPins() {
			return fmt.Errorf("%w: %s/%s (no settings store)", ErrPluginUnpinned, slug, binary)
		}
		return nil
	}
	digest, err := hashFile(path)
	if err != nil {
		return err
	}

	key := pluginPinSettingKey(slug, binary)
	var rows []models.SiteSetting
	if dbErr := db.Where("\"key\" = ?", key).Limit(1).Find(&rows).Error; dbErr != nil {
		return fmt.Errorf("pin lookup failed for %s/%s: %w", slug, binary, dbErr)
	}

	if len(rows) == 0 || rows[0].Value == nil || strings.TrimSpace(*rows[0].Value) == "" {
		if requirePluginPins() {
			return fmt.Errorf("%w: %s/%s sha256=%s — set %s to load it", ErrPluginUnpinned, slug, binary, digest, key)
		}
		// Unpinned — log digest so an operator can pin it.
		log.Printf("[plugins] %s/%s unpinned (sha256=%s) — set %s in settings to enforce",
			slug, binary, digest, key)
		return nil
	}

	pinned := strings.ToLower(strings.TrimSpace(*rows[0].Value))
	if subtle.ConstantTimeCompare([]byte(pinned), []byte(digest)) != 1 {
		return fmt.Errorf("%w: %s/%s expected=%s actual=%s",
			ErrPluginHashMismatch, slug, binary, pinned, digest)
	}
	return nil
}

// HashPluginBinary is exported so the `squilla verify-plugin` CLI
// helper can print the digest of a binary the operator wants to pin.
func HashPluginBinary(path string) (string, error) {
	return hashFile(path)
}

// PluginPinSettingKey is exported so the same CLI helper can tell the
// operator which setting key to write to.
func PluginPinSettingKey(slug, binary string) string {
	return pluginPinSettingKey(slug, binary)
}
