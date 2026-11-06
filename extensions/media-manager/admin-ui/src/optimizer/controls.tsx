import type { CSSProperties, ReactNode } from "react";
import { Switch } from "@squilla/ui";
import { Crop, MoveHorizontal, Shrink } from "@squilla/icons";

/** Resize modes, worded for editors (see resizeCrop/resizeFit/resizeWidth). */
export const MODES: Record<string, { label: string; hint: string; icon: typeof Crop }> = {
  crop: { label: "Crop", hint: "Fills the exact size and trims what doesn't fit.", icon: Crop },
  fit: { label: "Fit", hint: "Fits inside the size and keeps the whole image.", icon: Shrink },
  width: { label: "Width", hint: "Matches the width; the height follows the image.", icon: MoveHorizontal },
};

/** Where a size comes from: "default" (built in), "custom" (added here),
 *  or "theme:<name>" / "extension:<slug>" from a manifest. */
export function describeSource(source: string): { label: string; owner?: string; kind?: "theme" | "extension" } {
  if (!source || source === "default") return { label: "Built-in" };
  if (source === "custom") return { label: "Custom" };
  const [kind, owner] = source.split(":");
  if (kind === "theme") return { label: "Theme", owner, kind: "theme" };
  if (kind === "extension") return { label: "Extension", owner, kind: "extension" };
  return { label: source };
}

export function dimensions(width: number, height: number, mode: string): string {
  return mode === "width" ? `${width} × auto` : `${width} × ${height}`;
}

/** One setting: title and description on the left, its control on the right.
 *  Rows stack on narrow screens; switch rows keep the switch beside the text. */
export function SettingRow({
  id,
  title,
  description,
  disabled,
  kind,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  disabled?: boolean;
  kind?: "switch";
  children: ReactNode;
}) {
  return (
    <div data-mm="row" data-kind={kind} data-disabled={disabled || undefined}>
      <div data-mm="row-text">
        <label htmlFor={id} data-mm="row-title">
          {title}
        </label>
        {description && (
          <p id={`${id}-desc`} data-mm="row-desc">
            {description}
          </p>
        )}
      </div>
      <div data-mm="row-control">{children}</div>
    </div>
  );
}

export function SwitchRow({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingRow id={id} title={title} description={description} kind="switch">
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-desc`} />
    </SettingRow>
  );
}

/** Slider with a filled track and its value beside it. */
export function RangeControl({
  id,
  value,
  min,
  max,
  onChange,
  disabled,
  format,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  format?: (value: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div data-mm="range-wrap">
      <input
        id={id}
        type="range"
        data-mm="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-describedby={`${id}-desc`}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
      <output htmlFor={id} data-mm="range-value">
        {format ? format(value) : value}
      </output>
    </div>
  );
}

/** Number input with a unit addon. Empty while typing reads as 0 so the field
 *  can be cleared; the owner validates the range. */
export function NumberControl({
  id,
  value,
  onChange,
  unit,
  disabled,
  invalid,
  min,
  max,
  placeholder,
  describedBy,
  width = 168,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  disabled?: boolean;
  invalid?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  describedBy?: string;
  width?: number | string;
}) {
  return (
    <div
      data-mm="control"
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      style={{ width, maxWidth: "100%" }}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ? String(value) : ""}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10) || 0)}
      />
      <span data-mm="control-addon">{unit}</span>
    </div>
  );
}

/** Solid swatch in the size's proportions, shown beside its dimensions.
 *  "width" sizes fade out at the bottom: their height follows the image. */
export function SizeGlyph({ width, height, mode }: { width: number; height: number; mode: string }) {
  const box = 14;
  const auto = mode === "width" || !height || !width;
  const ratio = auto ? 0.75 : height / width;
  let w = box;
  let h = box * ratio;
  if (h > box) {
    h = box;
    w = box / ratio;
  }
  return (
    <span data-mm="glyph" data-auto={auto || undefined} aria-hidden="true">
      <span style={{ width: Math.max(4, Math.round(w)), height: Math.max(4, Math.round(h)) }} />
    </span>
  );
}
