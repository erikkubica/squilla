import * as React from "react";
import { useRef, useState } from "react";
import type { BlockField } from "../api";
import { Glyph, Switch } from "../ui";
import { FieldList, type FieldContext } from "./FieldInput";
import { emptyValues, summarize } from "./layout";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

// --- Object / group ----------------------------------------------------------

export function GroupField({
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
  const sub = field.fields ?? [];
  const v = asRecord(value);
  if (sub.length === 0) return <p className="vedit-muted-note">This group has no fields defined.</p>;
  return (
    <div className="vedit-subcard">
      <FieldList fields={sub} values={v} onFieldChange={(name, next) => onChange({ ...v, [name]: next })} ctx={ctx} path={path} />
    </div>
  );
}

// --- Array / repeater ----------------------------------------------------------

let rowKeyCounter = 0;
const nextRowKey = (): string => `r${++rowKeyCounter}`;

/**
 * Repeater rows in the admin's style: a numbered header with the row's
 * own summary, move/remove actions and a collapse toggle. Rows keep a
 * stable key across moves and removals so open state and rich-text
 * editors stay with their row.
 */
export function RepeaterField({
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
  const sub = field.fields ?? [];
  const rows: Record<string, unknown>[] = Array.isArray(value) ? (value as unknown[]).map(asRecord) : [];

  const keysRef = useRef<string[]>([]);
  if (keysRef.current.length !== rows.length) {
    // Value changed from outside (load, discard): realign keys.
    keysRef.current = rows.map((_, i) => keysRef.current[i] ?? nextRowKey());
  }
  const keys = keysRef.current;
  // A single row opens by default; longer lists start collapsed so the
  // panel stays scannable.
  const [open, setOpen] = useState<Set<string>>(() => (rows.length === 1 && keys[0] ? new Set([keys[0]]) : new Set()));

  if (sub.length === 0) return <p className="vedit-muted-note">This list has no item fields defined.</p>;

  const toggle = (key: string): void =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const add = (): void => {
    const key = nextRowKey();
    keysRef.current = [...keys, key];
    setOpen((prev) => new Set(prev).add(key));
    onChange([...rows, emptyValues(sub)]);
  };
  const remove = (i: number): void => {
    keysRef.current = keys.filter((_, j) => j !== i);
    onChange(rows.filter((_, j) => j !== i));
  };
  const move = (i: number, d: -1 | 1): void => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const nextRows = rows.slice();
    [nextRows[i], nextRows[j]] = [nextRows[j]!, nextRows[i]!];
    const nextKeys = keys.slice();
    [nextKeys[i], nextKeys[j]] = [nextKeys[j]!, nextKeys[i]!];
    keysRef.current = nextKeys;
    onChange(nextRows);
  };
  const update = (i: number, name: string, next: unknown): void => {
    onChange(rows.map((r, j) => (j === i ? { ...r, [name]: next } : r)));
  };

  const allClosed = keys.every((k) => !open.has(k));

  return (
    <div className="vedit-repeater">
      {rows.length > 1 && (
        <div className="vedit-repeater-tools">
          <button type="button" className="vedit-text-action" onClick={() => setOpen(allClosed ? new Set(keys) : new Set())}>
            <Glyph name={allClosed ? "expand-all" : "collapse-all"} size={14} />
            {allClosed ? "Expand all" : "Collapse all"}
          </button>
        </div>
      )}
      {rows.map((row, i) => {
        const key = keys[i]!;
        const isOpen = open.has(key);
        const summary = summarize(sub, row);
        return (
          <div key={key} className="vedit-row" data-state={isOpen ? "open" : "closed"}>
            <div className="vedit-row-header" onClick={() => toggle(key)}>
              <button
                type="button"
                className="vedit-row-toggle"
                aria-expanded={isOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(key);
                }}
              >
                <span className="vedit-index">{i + 1}</span>
                <span className="vedit-row-summary" data-empty={!summary || undefined}>{summary || "Empty item"}</span>
              </button>
              <span className="vedit-row-actions" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" aria-label={`Move item ${i + 1} up`}>
                  <Glyph name="arrow-up" size={14} />
                </button>
                <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Move down" aria-label={`Move item ${i + 1} down`}>
                  <Glyph name="arrow-down" size={14} />
                </button>
                <button type="button" className="vedit-icon-btn" data-size="sm" data-tone="danger" onClick={() => remove(i)} title="Remove item" aria-label={`Remove item ${i + 1}`}>
                  <Glyph name="trash" size={14} />
                </button>
                <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => toggle(key)} title={isOpen ? "Collapse" : "Expand"} aria-label={isOpen ? "Collapse item" : "Expand item"}>
                  <Glyph name="chevron-down" size={15} className="vedit-chevron" style={{ transform: isOpen ? "none" : "rotate(-90deg)" }} />
                </button>
              </span>
            </div>
            {isOpen && (
              <div className="vedit-row-body">
                <FieldList fields={sub} values={row} onFieldChange={(name, next) => update(i, name, next)} ctx={ctx} path={`${path}-${i}`} />
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="vedit-add-button" data-size="sm" onClick={add}>
        <Glyph name="plus" size={15} />
        Add {rows.length === 0 ? "item" : "another"}
      </button>
    </div>
  );
}

// --- Link ------------------------------------------------------------------------

/**
 * Link field, same shape as the admin's link input: {text, url, alt,
 * target}. Older editor saves also carried `label`; it is read as a
 * fallback and kept in sync when present.
 */
export function LinkField({ value, onChange, id }: { value: unknown; onChange: (next: unknown) => void; id: string }): React.JSX.Element {
  const link = asRecord(value);
  const text = typeof link.text === "string" ? link.text : typeof link.label === "string" ? link.label : "";
  const set = (patch: Record<string, unknown>): void => onChange({ ...link, ...patch });
  return (
    <div className="vedit-subcard vedit-link-field">
      <div className="vedit-fields">
        <div className="vedit-field" style={{ flex: "0 0 calc(50% - 7px)", maxWidth: "calc(50% - 7px)" }}>
          <label htmlFor={`${id}-text`} className="vedit-field-label" data-size="sm">Link text</label>
          <input
            id={`${id}-text`}
            type="text"
            className="vedit-input"
            placeholder="Click here"
            value={text}
            onChange={(e) => set(link.label !== undefined ? { text: e.target.value, label: e.target.value } : { text: e.target.value })}
          />
        </div>
        <div className="vedit-field" style={{ flex: "0 0 calc(50% - 7px)", maxWidth: "calc(50% - 7px)" }}>
          <label htmlFor={id} className="vedit-field-label" data-size="sm">URL</label>
          <input id={id} type="text" className="vedit-input" placeholder="https:// or /page" value={typeof link.url === "string" ? link.url : ""} onChange={(e) => set({ url: e.target.value })} />
        </div>
        <div className="vedit-field" style={{ flex: "0 0 calc(50% - 7px)", maxWidth: "calc(50% - 7px)" }}>
          <label htmlFor={`${id}-alt`} className="vedit-field-label" data-size="sm">Alt / title</label>
          <input id={`${id}-alt`} type="text" className="vedit-input" placeholder="Link description" value={typeof link.alt === "string" ? link.alt : ""} onChange={(e) => set({ alt: e.target.value })} />
        </div>
        <div className="vedit-field vedit-field-switch" style={{ flex: "0 0 calc(50% - 7px)", maxWidth: "calc(50% - 7px)" }}>
          <label className="vedit-switch-row">
            <Switch checked={link.target === "_blank"} onChange={(on) => set({ target: on ? "_blank" : "" })} label="Open in new tab" />
            <span>Open in new tab</span>
          </label>
        </div>
      </div>
    </div>
  );
}
