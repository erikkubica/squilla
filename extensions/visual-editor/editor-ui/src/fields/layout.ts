import type { CSSProperties } from "react";
import type { BlockField } from "../api";
import { humanize, plainText } from "../ui";

/** Column gap between fields in a row, in px (matches .vedit-fields). */
export const FIELD_GAP = 14;

/** A field's share of the row in percent; 100 unless the schema says so.
 *  Mirrors getFieldWidth in the admin node editor. */
/** What a field is called in the editor: its title, else its label, else
 *  its name made readable ("hero_image" → "Hero image"). */
export function fieldTitle(field: BlockField): string {
  return field.title || field.label || humanize(field.name);
}

export function fieldWidth(field: BlockField): number {
  const w = field.width;
  if (typeof w === "number" && w > 0 && w <= 100) return Math.round(w);
  return 100;
}

/** Flex basis for a field of `width` percent in a wrapping row with `gap`
 *  px between items: full-width fields reach the right edge, and fields
 *  whose widths add up to 100 fill one row exactly. Same maths as
 *  fieldFlex in the admin node editor. */
export function fieldFlex(width: number, gap = FIELD_GAP): CSSProperties {
  const basis = `calc(${width}% - ${(gap * (100 - width)) / 100}px)`;
  return { flex: `0 0 ${basis}`, maxWidth: basis };
}

const SUMMARY_TYPES = new Set(["text", "string", "textarea", "text-multiline", "richtext", "wysiwyg"]);
const SUMMARY_PRIORITY = ["heading", "title", "headline", "name", "label", "question", "eyebrow", "text"];

/** One line of a block's or row's own content (its heading, title, …) so a
 *  stack of collapsed items of the same type can still be told apart. */
export function summarize(schema: BlockField[], values: Record<string, unknown> | undefined): string {
  if (!values) return "";
  const rank = (name: string): number => {
    const i = SUMMARY_PRIORITY.findIndex((key) => name.toLowerCase().includes(key));
    return i === -1 ? SUMMARY_PRIORITY.length : i;
  };
  const candidates = schema
    .filter((f) => SUMMARY_TYPES.has((f.type || "").toLowerCase()))
    .sort((a, b) => rank(a.name) - rank(b.name));
  for (const f of candidates) {
    const v = values[f.name];
    if (typeof v !== "string") continue;
    const text = plainText(v);
    if (text) return text.length > 140 ? `${text.slice(0, 140)}…` : text;
  }
  // Fall back to a link's text or a chosen item's title.
  for (const f of schema) {
    const v = values[f.name];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      const t = o.text ?? o.label ?? o.title;
      if (typeof t === "string" && t.trim()) return t.trim();
    }
  }
  return "";
}

/** Empty value for a new item / block, by field type. */
export function emptyValue(field: BlockField): unknown {
  if (field.initialValue !== undefined) return field.initialValue;
  const t = (field.type || "").toLowerCase();
  if (t === "boolean" || t === "toggle") return false;
  if (t === "number" || t === "integer" || t === "range") return null;
  if (t === "object" || t === "group") return {};
  if (t === "array" || t === "repeater" || t === "gallery" || t === "checkbox") return [];
  if (t === "reference" || t === "node") return field.multiple ? [] : null;
  if (t === "image" || t === "file" || t === "media" || t === "link" || t === "term") return null;
  return "";
}

export function emptyValues(schema: BlockField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of schema) out[f.name] = emptyValue(f);
  return out;
}
