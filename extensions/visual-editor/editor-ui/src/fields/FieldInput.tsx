import * as React from "react";
import type { BlockField } from "../api";
import { Switch } from "../ui";
import { GroupField, LinkField, RepeaterField } from "./Composite";
import { EmojiField } from "./EmojiField";
import { FormSelectorField } from "./FormSelector";
import { IconField } from "./IconField";
import { fieldFlex, fieldTitle, fieldWidth } from "./layout";
import { FileField, GalleryField, ImageField } from "./MediaPicker";
import { NodeRefField, TermField } from "./RefPicker";
import { RichText } from "./RichText";

export interface FieldContext {
  nodeId: number;
  nodeType: string;
}

/**
 * A schema's fields laid out like the admin page builder: each field
 * takes its `width` share of a wrapping row (full width by default), and
 * narrow panes stack everything (see the container query on
 * .vedit-fields in styles.css).
 */
export function FieldList({
  fields,
  values,
  onFieldChange,
  ctx,
  path,
}: {
  fields: BlockField[];
  values: Record<string, unknown>;
  onFieldChange: (name: string, value: unknown) => void;
  ctx: FieldContext;
  path: string;
}): React.JSX.Element {
  return (
    <div className="vedit-fields">
      {fields.map((f) => (
        <div key={f.name} className="vedit-field" style={fieldFlex(fieldWidth(f))} data-full={fieldWidth(f) === 100 || undefined}>
          <FieldInput field={f} value={values[f.name]} onChange={(v) => onFieldChange(f.name, v)} ctx={ctx} path={`${path}.${f.name}`} />
        </div>
      ))}
    </div>
  );
}

/** Label + help + control for one field. */
export function FieldInput({
  field,
  value,
  onChange,
  ctx,
  path,
}: {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  ctx: FieldContext;
  path: string;
}): React.JSX.Element {
  const id = `vedit-${path.replace(/[^\w-]+/g, "-")}`;
  const label = fieldTitle(field);
  const help = field.hint || field.description;
  const t = (field.type || "").toLowerCase();
  // Controls that are groups of inputs get a non-<label> caption so a
  // click on it doesn't jump focus into the first sub-input.
  const grouped = ["object", "group", "array", "repeater", "link", "radio", "checkbox", "gallery"].includes(t);

  return (
    <>
      {grouped ? (
        <span className="vedit-field-label">
          {label}
          {field.required && <span className="vedit-required" aria-hidden="true">*</span>}
        </span>
      ) : (
        <label htmlFor={id} className="vedit-field-label">
          {label}
          {field.required && <span className="vedit-required" aria-hidden="true">*</span>}
        </label>
      )}
      {help && <p className="vedit-field-hint">{help}</p>}
      <Control id={id} field={field} value={value} onChange={onChange} ctx={ctx} path={path} />
    </>
  );
}

function Control({
  id,
  field,
  value,
  onChange,
  ctx,
  path,
}: {
  id: string;
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  ctx: FieldContext;
  path: string;
}): React.JSX.Element {
  const t = (field.type || "").toLowerCase();
  const str = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  const placeholder = field.placeholder || "";

  switch (t) {
    case "string":
    case "text":
    case "url":
    case "email":
      return (
        <Adorned prepend={field.prepend} append={field.append}>
          <input
            id={id}
            type={t === "url" ? "url" : t === "email" ? "email" : "text"}
            className="vedit-input"
            value={str}
            placeholder={placeholder || (t === "url" ? "https://" : t === "email" ? "name@example.com" : "")}
            maxLength={field.max_length || undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        </Adorned>
      );
    case "textarea":
    case "text-multiline":
      return (
        <textarea
          id={id}
          className="vedit-input vedit-textarea"
          rows={field.rows || 4}
          value={str}
          placeholder={placeholder}
          maxLength={field.max_length || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "richtext":
    case "wysiwyg":
      return <RichText value={str} onChange={onChange} />;
    case "number":
    case "integer": {
      const num = typeof value === "number" ? value : typeof value === "string" && value !== "" ? Number(value) : null;
      return (
        <Adorned prepend={field.prepend} append={field.append}>
          <input
            id={id}
            type="number"
            className="vedit-input"
            value={num ?? ""}
            min={field.min}
            max={field.max}
            step={field.step ?? (t === "integer" ? 1 : "any")}
            placeholder={placeholder || "0"}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
        </Adorned>
      );
    }
    case "range": {
      const min = field.min ?? 0;
      const max = field.max ?? 100;
      const num = typeof value === "number" ? value : typeof value === "string" && value !== "" ? Number(value) : min;
      return (
        <div className="vedit-range">
          <input id={id} type="range" min={min} max={max} step={field.step ?? 1} value={num} onChange={(e) => onChange(Number(e.target.value))} />
          <span className="vedit-range-value">{num}</span>
        </div>
      );
    }
    case "boolean":
    case "toggle":
      return (
        <div className="vedit-switch-row">
          <Switch id={id} checked={value === true} onChange={onChange} label={fieldTitle(field)} />
          <span>{value === true ? "Yes" : "No"}</span>
        </div>
      );
    case "select": {
      const options = normalizeOptions(field.options);
      const known = options.some((o) => o.value === str);
      return (
        <select id={id} className="vedit-input vedit-select" value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder || `Select ${fieldTitle(field).toLowerCase()}`}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          {str && !known && <option value={str}>{str} (not in list)</option>}
        </select>
      );
    }
    case "radio": {
      const options = normalizeOptions(field.options);
      return (
        <div className="vedit-choice-list" role="radiogroup" aria-label={fieldTitle(field)}>
          {options.map((o) => (
            <label key={o.value} className="vedit-choice">
              <input type="radio" name={id} value={o.value} checked={str === o.value} onChange={() => onChange(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    case "checkbox": {
      const options = normalizeOptions(field.options);
      const arr: string[] = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="vedit-choice-list">
          {options.map((o) => (
            <label key={o.value} className="vedit-choice">
              <input
                type="checkbox"
                checked={arr.includes(o.value)}
                onChange={() => onChange(arr.includes(o.value) ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    case "color":
      return (
        <div className="vedit-color">
          <input
            type="color"
            className="vedit-color-picker"
            value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${fieldTitle(field)} picker`}
          />
          <input id={id} type="text" className="vedit-input vedit-mono" value={str} placeholder="#000000" onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "date":
      return <input id={id} type="date" className="vedit-input" value={str} onChange={(e) => onChange(e.target.value)} />;
    case "emoji":
      return <EmojiField id={id} value={str} onChange={onChange} placeholder={placeholder} />;
    case "icon":
      return <IconField value={str} onChange={onChange} providers={Array.isArray(field.providers) ? field.providers : undefined} label={fieldTitle(field)} />;
    case "image":
    case "media":
      return <ImageField value={value} onChange={onChange} />;
    case "gallery":
      return <GalleryField value={value} onChange={onChange} />;
    case "file":
      return <FileField value={value} onChange={onChange} />;
    case "link":
      return <LinkField value={value} onChange={onChange} id={id} />;
    case "reference":
    case "node":
      return <NodeRefField field={field} value={value} onChange={onChange} />;
    case "term":
      return <TermField field={field} value={value} onChange={onChange} defaultNodeType={ctx.nodeType} />;
    case "form_selector":
      return <FormSelectorField value={value} onChange={onChange} id={id} />;
    case "object":
    case "group":
      return <GroupField field={field} value={value} onChange={onChange} ctx={ctx} path={path} />;
    case "array":
    case "repeater":
      return <RepeaterField field={field} value={value} onChange={onChange} ctx={ctx} path={path} />;
    default:
      return <JSONField id={id} type={field.type} value={value} onChange={onChange} />;
  }
}

/** Text input with optional prefix/suffix adornments (field.prepend/append). */
function Adorned({ prepend, append, children }: { prepend?: string; append?: string; children: React.ReactNode }): React.JSX.Element {
  if (!prepend && !append) return <>{children}</>;
  return (
    <div className="vedit-input-group">
      {prepend && <span className="vedit-addon">{prepend}</span>}
      {children}
      {append && <span className="vedit-addon">{append}</span>}
    </div>
  );
}

/** Fallback for field types the editor has no control for: raw JSON,
 *  applied only once it parses. */
function JSONField({ id, type, value, onChange }: { id: string; type: string; value: unknown; onChange: (next: unknown) => void }): React.JSX.Element {
  const [draft, setDraft] = React.useState(() => (value === undefined ? "" : JSON.stringify(value, null, 2)));
  const [invalid, setInvalid] = React.useState(false);
  return (
    <>
      <textarea
        id={id}
        className="vedit-input vedit-textarea vedit-mono"
        rows={4}
        value={draft}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          try {
            onChange(e.target.value.trim() === "" ? null : JSON.parse(e.target.value));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
      />
      <p className="vedit-field-hint">
        {invalid ? "Not valid JSON yet — changes apply once it parses." : `“${type}” fields are edited as JSON here. Use the admin for a full editor.`}
      </p>
    </>
  );
}

/**
 * Normalize a field's options array into {value, label} pairs. Canonical
 * schemas store plain strings (`["heads-up", "note"]`); legacy object
 * shape is tolerated for backward compatibility with older blocks.
 */
function normalizeOptions(
  options: Array<string | { value: string; label: string }> | undefined,
): Array<{ value: string; label: string }> {
  if (!options) return [];
  return options.map((o) => (typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label }));
}
