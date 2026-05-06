import * as React from "react";
import type { BlockField } from "../api";
import { ArrayField, LinkField, ObjectField } from "./Composite";
import { FileField, GalleryField, ImageField } from "./MediaPicker";
import { NodeRefField, TermField } from "./RefPicker";
import { RichText } from "./RichText";

interface Props {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  nodeId: number;
  nodeType: string;
  path: string;
}

/**
 * Dispatch table for field types. Wraps every input in a label + help
 * row so all field components only render their own control.
 */
export function FieldInput({ field, value, onChange, nodeId, nodeType, path }: Props): React.JSX.Element {
  const id = `vedit-${path}`;
  const label = field.title || field.name;
  const t = (field.type || "").toLowerCase();

  // Composite types render their own header (collapsible).
  if (t === "object" || t === "group") {
    return <ObjectField field={field} value={value} onChange={onChange} nodeId={nodeId} nodeType={nodeType} path={path} />;
  }
  if (t === "array" || t === "repeater") {
    return (
      <div className="vedit-field">
        <label className="vedit-field-label">
          {label}
          {field.required && <span className="vedit-required">*</span>}
        </label>
        {field.description && <p className="vedit-field-description">{field.description}</p>}
        <ArrayField field={field} value={value} onChange={onChange} nodeId={nodeId} nodeType={nodeType} path={path} />
      </div>
    );
  }

  return (
    <div className="vedit-field">
      <label htmlFor={id} className="vedit-field-label">
        {label}
        {field.required && <span className="vedit-required">*</span>}
      </label>
      {field.description && <p className="vedit-field-description">{field.description}</p>}
      <Control id={id} field={field} value={value} onChange={onChange} nodeId={nodeId} nodeType={nodeType} />
    </div>
  );
}

function Control({
  id,
  field,
  value,
  onChange,
  nodeId,
  nodeType,
}: {
  id: string;
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  nodeId: number;
  nodeType: string;
}): React.JSX.Element {
  const t = (field.type || "").toLowerCase();
  void nodeId;

  switch (t) {
    case "string":
    case "url":
    case "email":
    case "color":
    case "date": {
      const inputType = t === "url" ? "url" : t === "email" ? "email" : t === "color" ? "color" : t === "date" ? "date" : "text";
      return (
        <input
          id={id}
          type={inputType}
          className="vedit-input"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    case "text":
    case "textarea":
    case "text-multiline":
      return (
        <textarea
          id={id}
          className="vedit-input vedit-textarea"
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "richtext":
    case "wysiwyg":
      return <RichText value={typeof value === "string" ? value : ""} onChange={onChange} />;
    case "number":
    case "integer": {
      const num = typeof value === "number" ? value : null;
      return (
        <input
          id={id}
          type="number"
          className="vedit-input"
          value={num ?? ""}
          step={t === "integer" ? 1 : "any"}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    }
    case "range": {
      const opts = (field as unknown as { min?: number; max?: number; step?: number });
      const min = opts.min ?? 0;
      const max = opts.max ?? 100;
      const step = opts.step ?? 1;
      const num = typeof value === "number" ? value : min;
      return (
        <div className="vedit-range">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={num}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="vedit-range-value">{num}</span>
        </div>
      );
    }
    case "boolean":
    case "toggle":
      return (
        <label className="vedit-toggle-row">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{value === true ? "On" : "Off"}</span>
        </label>
      );
    case "select": {
      const options = normalizeOptions(field.options);
      return (
        <select
          id={id}
          className="vedit-input"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— select —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    case "radio": {
      const options = normalizeOptions(field.options);
      return (
        <div className="vedit-radio-group" role="radiogroup">
          {options.map((o) => (
            <label key={o.value} className="vedit-radio-row">
              <input
                type="radio"
                name={id}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    case "checkbox": {
      const options = normalizeOptions(field.options);
      const arr: string[] = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (val: string): void => {
        if (arr.includes(val)) onChange(arr.filter((x) => x !== val));
        else onChange([...arr, val]);
      };
      return (
        <div className="vedit-checkbox-group">
          {options.map((o) => (
            <label key={o.value} className="vedit-toggle-row">
              <input type="checkbox" checked={arr.includes(o.value)} onChange={() => toggle(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    case "image":
      return <ImageField value={value} onChange={onChange} />;
    case "gallery":
      return <GalleryField value={value} onChange={onChange} />;
    case "file":
      return <FileField value={value} onChange={onChange} />;
    case "link":
      return <LinkField value={value} onChange={onChange} id={id} />;
    case "reference":
      return <NodeRefField field={field} value={value} onChange={onChange} />;
    case "term":
      return <TermField field={field} value={value} onChange={onChange} defaultNodeType={nodeType} />;
    default:
      return (
        <textarea
          id={id}
          className="vedit-input vedit-textarea"
          rows={3}
          placeholder={`Unsupported field type: ${field.type}. JSON-edit at your own risk.`}
          value={value === undefined ? "" : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // Don't update until the JSON is valid.
            }
          }}
        />
      );
  }
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
  return options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label },
  );
}
