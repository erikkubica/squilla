import * as React from "react";
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockField } from "../api";
import { FieldInput } from "./FieldInput";

// --- Object / group ---

interface ObjectProps {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  nodeId: number;
  nodeType: string;
  path: string;
}

export function ObjectField({ field, value, onChange, nodeId, nodeType, path }: ObjectProps): React.JSX.Element {
  const fields = field.fields ?? [];
  const [open, setOpen] = useState(true);
  const v = (typeof value === "object" && value !== null && !Array.isArray(value))
    ? (value as Record<string, unknown>)
    : {};

  if (fields.length === 0) {
    return <p className="vedit-empty">Object field has no nested schema.</p>;
  }

  return (
    <div className="vedit-object">
      <button type="button" className="vedit-collapsible-head" onClick={() => setOpen((o) => !o)}>
        <span className="vedit-collapsible-caret" data-open={open}>▸</span>
        <span>{field.title || field.name}</span>
      </button>
      {open && (
        <div className="vedit-object-body">
          {fields.map((sub) => (
            <FieldInput
              key={sub.name}
              field={sub}
              value={v[sub.name]}
              onChange={(next) => onChange({ ...v, [sub.name]: next })}
              nodeId={nodeId}
              nodeType={nodeType}
              path={`${path}.${sub.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Array / repeater ---

interface ArrayProps {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  nodeId: number;
  nodeType: string;
  path: string;
}

export function ArrayField({ field, value, onChange, nodeId, nodeType, path }: ArrayProps): React.JSX.Element {
  const itemSchema = field.fields ?? [];
  const items: unknown[] = Array.isArray(value) ? (value as unknown[]) : [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = items.map((_, i) => `${path}-${i}`);

  const addItem = (): void => {
    const empty: Record<string, unknown> = {};
    for (const f of itemSchema) {
      if (f.initialValue !== undefined) empty[f.name] = f.initialValue;
      else empty[f.name] = defaultFor(f.type);
    }
    onChange([...items, empty]);
  };

  const removeAt = (idx: number): void => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleDragEnd = (e: DragEndEvent): void => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove([...items], from, to));
  };

  const updateItem = (idx: number, next: unknown): void => {
    const copy = [...items];
    copy[idx] = next;
    onChange(copy);
  };

  if (itemSchema.length === 0) {
    return <p className="vedit-empty">Array field has no item schema.</p>;
  }

  return (
    <div className="vedit-array">
      {items.length === 0 && <p className="vedit-empty">No items yet.</p>}
      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="vedit-array-list">
              {items.map((it, i) => (
                <SortableItem
                  key={ids[i]}
                  id={ids[i]!}
                  index={i}
                  itemSchema={itemSchema}
                  value={it}
                  onChange={(next) => updateItem(i, next)}
                  onRemove={() => removeAt(i)}
                  nodeId={nodeId}
                  nodeType={nodeType}
                  path={`${path}[${i}]`}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <button type="button" className="vedit-add-block" onClick={addItem}>+ Add item</button>
    </div>
  );
}

function SortableItem({
  id,
  index,
  itemSchema,
  value,
  onChange,
  onRemove,
  nodeId,
  nodeType,
  path,
}: {
  id: string;
  index: number;
  itemSchema: BlockField[];
  value: unknown;
  onChange: (next: unknown) => void;
  onRemove: () => void;
  nodeId: number;
  nodeType: string;
  path: string;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [open, setOpen] = useState(true);
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const v = (typeof value === "object" && value !== null && !Array.isArray(value))
    ? (value as Record<string, unknown>)
    : {};

  const summary = itemSchema[0] ? (v[itemSchema[0].name] as unknown) : null;
  const summaryText = typeof summary === "string" && summary ? summary : `Item ${index + 1}`;

  return (
    <li ref={setNodeRef} style={style} className="vedit-array-item">
      <div className="vedit-array-item-head">
        <button type="button" className="vedit-drag-handle" aria-label="Drag" {...attributes} {...listeners}>⋮⋮</button>
        <button type="button" className="vedit-array-item-toggle" onClick={() => setOpen((o) => !o)}>
          <span className="vedit-collapsible-caret" data-open={open}>▸</span>
          <span className="vedit-array-item-summary">{summaryText.length > 50 ? summaryText.slice(0, 50) + "…" : summaryText}</span>
        </button>
        <button type="button" className="vedit-icon-btn" onClick={onRemove} aria-label="Remove" title="Remove item">×</button>
      </div>
      {open && (
        <div className="vedit-array-item-body">
          {itemSchema.map((sub) => (
            <FieldInput
              key={sub.name}
              field={sub}
              value={v[sub.name]}
              onChange={(next) => onChange({ ...v, [sub.name]: next })}
              nodeId={nodeId}
              nodeType={nodeType}
              path={`${path}.${sub.name}`}
            />
          ))}
        </div>
      )}
    </li>
  );
}

// --- Link ---

interface LinkProps {
  value: unknown;
  onChange: (next: unknown) => void;
  id: string;
}

export function LinkField({ value, onChange, id }: LinkProps): React.JSX.Element {
  const v = typeof value === "object" && value !== null
    ? (value as { url?: string; label?: string; target?: string; rel?: string })
    : {};
  return (
    <div className="vedit-link-field">
      <input
        id={id}
        type="text"
        className="vedit-input"
        placeholder="Label"
        value={v.label ?? ""}
        onChange={(e) => onChange({ ...v, label: e.target.value })}
      />
      <input
        type="url"
        className="vedit-input"
        placeholder="https://…"
        value={v.url ?? ""}
        onChange={(e) => onChange({ ...v, url: e.target.value })}
      />
      <div className="vedit-grid-2">
        <select
          className="vedit-input"
          value={v.target ?? "_self"}
          onChange={(e) => onChange({ ...v, target: e.target.value })}
        >
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </select>
        <input
          type="text"
          className="vedit-input"
          placeholder="rel (e.g. noopener)"
          value={v.rel ?? ""}
          onChange={(e) => onChange({ ...v, rel: e.target.value })}
        />
      </div>
    </div>
  );
}

function defaultFor(type: string | undefined): unknown {
  const t = (type || "").toLowerCase();
  if (t === "toggle" || t === "boolean" || t === "checkbox") return false;
  if (t === "number" || t === "integer" || t === "range") return null;
  if (t === "object") return {};
  if (t === "array" || t === "gallery" || t === "checkbox") return [];
  return "";
}
