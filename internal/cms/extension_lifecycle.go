package cms

import (
	"encoding/json"
	"log"
	"path/filepath"

	"squilla/internal/events"
)

// extensionAssetsPayload mirrors themeAssetsPayload but for extensions.
// The emitted event carries abs_path so media-manager (running out-of-process
// via gRPC) can read each file reliably regardless of CWD.
func extensionAssetsPayload(extPath string, defs []ThemeMediaAssetDef) []map[string]interface{} {
	out := make([]map[string]interface{}, 0, len(defs))
	for _, d := range defs {
		abs, err := confinedFile(extPath, filepath.Join("assets", d.Src))
		if err != nil {
			log.Printf("[extensions] asset %q skipped: %v", d.Src, err)
			continue
		}
		out = append(out, map[string]interface{}{
			"key":      d.Key,
			"src":      d.Src,
			"alt":      d.Alt,
			"width":    d.Width,
			"height":   d.Height,
			"abs_path": abs,
		})
	}
	return out
}

// PublishExtensionActivated emits extension.activated (sync) for the given
// extension. Payload includes the resolved assets array so subscribing
// extensions (e.g. media-manager) can import files into their own storage.
// Safe to call with nil eventBus (no-op).
func PublishExtensionActivated(eventBus *events.EventBus, slug, extPath string, manifestJSON json.RawMessage) {
	if eventBus == nil {
		return
	}
	var mf ExtensionManifest
	_ = json.Unmarshal(manifestJSON, &mf)
	eventBus.PublishSync("extension.activated", events.Payload{
		"slug":    slug,
		"path":    extPath,
		"version": mf.Version,
		"assets":  extensionAssetsPayload(extPath, mf.Assets),
	})
}

// PublishExtensionDeactivated emits extension.deactivated (sync) so
// subscribing extensions can clean up their extension-owned data. Safe to
// call with nil eventBus (no-op).
func PublishExtensionDeactivated(eventBus *events.EventBus, slug string) {
	if eventBus == nil {
		return
	}
	eventBus.PublishSync("extension.deactivated", events.Payload{
		"slug": slug,
	})
}
