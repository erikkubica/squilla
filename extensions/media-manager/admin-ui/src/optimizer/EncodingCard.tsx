import { Loader2, Settings } from "@squilla/icons";
import { Button, Card, SectionHeader } from "@squilla/ui";
import { MAX_DIMENSION, type OptimizerSettings } from "./api";
import { NumberControl, RangeControl, SettingRow, SwitchRow } from "./controls";

interface EncodingCardProps {
  value: OptimizerSettings;
  onChange: (patch: Partial<OptimizerSettings>) => void;
  dirty: boolean;
  saving: boolean;
  maxDimensionError: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

/** Upload normalization and the encoding of resized copies, in two groups.
 *  Rows that depend on a switch dim while it's off. */
export default function EncodingCard({
  value,
  onChange,
  dirty,
  saving,
  maxDimensionError,
  onSave,
  onDiscard,
}: EncodingCardProps) {
  const uploadsOff = !value.normalize_enabled;
  const webpOff = !value.webp_enabled;

  return (
    <Card>
      <SectionHeader
        title="Upload & encoding"
        icon={<Settings className="h-4 w-4" />}
        actions={
          <div className="flex items-center" style={{ gap: 6 }}>
            {dirty && (
              <Button size="sm" variant="ghost" onClick={onDiscard} disabled={saving}>
                Discard
              </Button>
            )}
            <Button size="sm" onClick={onSave} disabled={!dirty || saving || Boolean(maxDimensionError)}>
              {saving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        }
      />

      <section data-mm="group" aria-labelledby="opt-group-uploads">
        <h3 id="opt-group-uploads" data-mm="group-title">
          New uploads
        </h3>
        <SwitchRow
          id="opt-normalize"
          title="Optimize new uploads"
          description="Scale down oversized images, strip camera metadata and compress each file as it's uploaded."
          checked={value.normalize_enabled}
          onChange={(normalize_enabled) => onChange({ normalize_enabled })}
        />
        <SettingRow
          id="opt-max-dimension"
          title="Maximum size"
          description="Longest side, in pixels. Larger images are scaled down to fit."
          disabled={uploadsOff}
        >
          <NumberControl
            id="opt-max-dimension"
            value={value.normalize_max_dimension}
            unit="px"
            min={MAX_DIMENSION.min}
            max={MAX_DIMENSION.max}
            disabled={uploadsOff}
            invalid={Boolean(maxDimensionError)}
            describedBy="opt-max-dimension-desc"
            onChange={(normalize_max_dimension) => onChange({ normalize_max_dimension })}
          />
          {maxDimensionError && (
            <p data-mm="field-error" role="alert">
              {maxDimensionError}
            </p>
          )}
        </SettingRow>
        <SettingRow
          id="opt-upload-quality"
          title="Upload quality"
          description="At 100 nothing is recompressed; files only lose their metadata. Lower values shrink JPEG and PNG files."
          disabled={uploadsOff}
        >
          <RangeControl
            id="opt-upload-quality"
            min={50}
            max={100}
            value={value.upload_quality}
            disabled={uploadsOff}
            onChange={(upload_quality) => onChange({ upload_quality })}
          />
        </SettingRow>
      </section>

      <section data-mm="group" aria-labelledby="opt-group-copies">
        <h3 id="opt-group-copies" data-mm="group-title">
          Resized copies
        </h3>
        <SettingRow
          id="opt-jpeg-quality"
          title="JPEG quality"
          description="For thumbnails and the other image sizes below."
        >
          <RangeControl
            id="opt-jpeg-quality"
            min={30}
            max={100}
            value={value.jpeg_quality}
            onChange={(jpeg_quality) => onChange({ jpeg_quality })}
          />
        </SettingRow>
        <SwitchRow
          id="opt-webp"
          title="Serve WebP"
          description="Browsers that support WebP get a smaller copy of each image."
          checked={value.webp_enabled}
          onChange={(webp_enabled) => onChange({ webp_enabled })}
        />
        <SettingRow
          id="opt-webp-quality"
          title="WebP quality"
          description="Quality of those WebP copies."
          disabled={webpOff}
        >
          <RangeControl
            id="opt-webp-quality"
            min={30}
            max={100}
            value={value.webp_quality}
            disabled={webpOff}
            onChange={(webp_quality) => onChange({ webp_quality })}
          />
        </SettingRow>
      </section>
    </Card>
  );
}
