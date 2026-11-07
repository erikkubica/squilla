import React, { useState } from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  AtSign,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Copy,
  EyeOff,
  Hash,
  Link2,
  List,
  Paperclip,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Type,
} from "@squilla/icons";
import { typeLabelMap } from "./types";
import FieldEditor from "./FieldEditor";

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  text: Type,
  email: AtSign,
  tel: Phone,
  url: Link2,
  number: Hash,
  range: SlidersHorizontal,
  textarea: AlignLeft,
  select: List,
  checkbox: CheckSquare,
  radio: CircleDot,
  date: Calendar,
  file: Paperclip,
  hidden: EyeOff,
  gdpr_consent: ShieldCheck,
};

interface FieldRowProps {
  field: any;
  index: number;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onReorder: (from: number, to: number) => void;
  onDuplicate: () => void;
  updateField: (updates: Record<string, any>) => void;
  allFields?: any[];
}

/** One form field, drawn exactly like a page-builder block card. */
export default function FieldRow({
  field,
  index,
  isEditing,
  isFirst,
  isLast,
  onToggleEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  onReorder,
  onDuplicate,
  updateField,
  allFields = [],
}: FieldRowProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = TYPE_ICONS[field.type] || Type;
  const conditional = !!(field.display_when && (field.display_when.all?.length || field.display_when.any?.length));
  const typeLabel = typeLabelMap[field.type] || field.type;

  return (
    <div
      data-slot="block-card"
      data-state={isEditing ? "open" : "closed"}
      draggable={!isEditing}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(index));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (!isNaN(from) && from !== index) onReorder(from, index);
      }}
      onDragEnd={() => setIsDragOver(false)}
      style={isDragOver ? { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-weak)" } : undefined}
    >
      <div data-slot="block-card-header" onClick={onToggleEdit}>
        <button
          type="button"
          className="flex flex-1 items-center min-w-0 text-left"
          style={{ gap: 10, background: "transparent", border: 0, padding: 0 }}
          aria-expanded={isEditing}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdit();
          }}
        >
          <span data-slot="item-index">{index + 1}</span>
          <span data-slot="block-icon" aria-hidden="true">
            <Icon size={15} />
          </span>
          <span className="flex flex-col min-w-0" style={{ gap: 1 }}>
            <span className="flex items-center min-w-0" style={{ gap: 8 }}>
              <span data-slot="block-card-title">
                {field.label || "Untitled field"}
                {field.required && <span className="fm-req" aria-hidden="true"> *</span>}
              </span>
              {field.required && (
                <span className="fm-tag shrink-0" data-tone="danger">
                  Required
                </span>
              )}
              {conditional && (
                <span className="fm-tag shrink-0" data-tone="warn">
                  Conditional
                </span>
              )}
            </span>
            <span data-slot="block-card-meta" className="truncate" style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
              {typeLabel}
              {field.id ? (
                <>
                  {" · "}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{field.id}</span>
                </>
              ) : null}
            </span>
          </span>
        </button>
        <div data-slot="block-card-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" data-slot="icon-button" onClick={onMoveUp} disabled={isFirst} title="Move up" aria-label="Move field up">
            <ArrowUp size={15} />
          </button>
          <button type="button" data-slot="icon-button" onClick={onMoveDown} disabled={isLast} title="Move down" aria-label="Move field down">
            <ArrowDown size={15} />
          </button>
          <button type="button" data-slot="icon-button" data-narrow-hide onClick={onDuplicate} title="Duplicate field" aria-label="Duplicate field">
            <Copy size={15} />
          </button>
          <button type="button" data-slot="icon-button" data-tone="danger" onClick={onRemove} title="Remove field" aria-label="Remove field">
            <Trash2 size={15} />
          </button>
          <span data-slot="block-card-divider" aria-hidden />
          <button
            type="button"
            data-slot="icon-button"
            onClick={onToggleEdit}
            title={isEditing ? "Collapse" : "Expand"}
            aria-label={isEditing ? "Collapse field" : "Expand field"}
          >
            <ChevronDown size={17} className="transition-transform" style={{ transform: isEditing ? "none" : "rotate(-90deg)" }} />
          </button>
        </div>
      </div>

      {isEditing && (
        <div data-slot="block-card-body">
          <FieldEditor field={field} updateField={updateField} allFields={allFields} />
        </div>
      )}
    </div>
  );
}
