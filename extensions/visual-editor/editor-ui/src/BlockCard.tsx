import * as React from "react";
import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { blockTypeFields, blockTypeLabel, type BlockType, type BlocksDataEntry, type IconItem } from "./api";
import { FieldList, type FieldContext } from "./fields/FieldInput";
import { summarize } from "./fields/layout";
import { Glyph, KernelSvg } from "./ui";

/** Editor-local block. `__loadedIndex` is the marker index (kernel or
 *  synthetic) used to find the block's range in the live DOM; `__cid` is
 *  a stable client id; `__isNew` marks blocks added since the last save.
 *  All three are stripped before saving. */
export type EditorBlock = BlocksDataEntry & {
  __loadedIndex: number;
  __cid: string;
  __isNew: boolean;
};

/** The icon lookup value for a block type's `icon` ("users" →
 *  "lucide:users"), or null for emoji / the default square. */
export function blockIconValue(icon: string | undefined): string | null {
  const v = (icon ?? "").trim();
  if (!v || v === "square") return null;
  // PascalCase names ("PanelTop", as settings pages declare them) → "panel-top".
  if (/^[a-z0-9-]+$/i.test(v)) return `lucide:${v.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
  if (/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(v)) return v;
  return null;
}

/** Block type glyph: a kernel icon (lucide name in block.json), an emoji,
 *  or a neutral square — same rules as the admin's BlockTypeIcon. */
export function BlockIcon({ icon, icons }: { icon?: string; icons: Map<string, IconItem | null> }): React.JSX.Element {
  const value = blockIconValue(icon);
  const found = value ? icons.get(value) : null;
  const glyph = (icon ?? "").trim();
  const isEmoji = !!glyph && glyph !== "square" && !value;
  return (
    <span className="vedit-block-icon" aria-hidden="true">
      {found ? <KernelSvg svg={found.svg} /> : isEmoji ? <span className="vedit-block-emoji">{glyph}</span> : <Glyph name="square" size={15} strokeWidth={1.8} />}
    </span>
  );
}

export function BlockCard({
  block,
  index,
  total,
  blockType,
  icons,
  open,
  renderError,
  ctx,
  onToggle,
  onMove,
  onDuplicate,
  onDelete,
  onFieldChange,
  cardRef,
}: {
  block: EditorBlock;
  index: number;
  total: number;
  blockType: BlockType | undefined;
  icons: Map<string, IconItem | null>;
  open: boolean;
  renderError?: string;
  ctx: FieldContext;
  onToggle: () => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFieldChange: (name: string, value: unknown) => void;
  cardRef: (el: HTMLDivElement | null) => void;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.__cid });
  const schema = blockType ? blockTypeFields(blockType) : [];
  const label = blockType ? blockTypeLabel(blockType) : block.type;
  const summary = open ? "" : summarize(schema, block.fields);

  // Delete is two-step: the first click arms the button. It stays armed
  // while the pointer is on it, so it can't turn back into the trash icon
  // (and shift the duplicate button under the cursor) just before the
  // confirming click; otherwise it disarms after a few seconds.
  const [armed, setArmed] = useState(false);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!armed || held) return;
    const t = window.setTimeout(() => setArmed(false), 3500);
    return () => window.clearTimeout(t);
  }, [armed, held]);

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        cardRef(el);
      }}
      className="vedit-card"
      data-state={open ? "open" : "closed"}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="vedit-card-header" onClick={onToggle}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="vedit-grip"
          aria-label={`Drag to reorder ${label}`}
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <Glyph name="grip" size={15} />
        </button>
        <button
          type="button"
          className="vedit-card-toggle"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <span className="vedit-index">{index + 1}</span>
          <BlockIcon icon={blockType?.icon} icons={icons} />
          <span className="vedit-card-text">
            <span className="vedit-card-titlerow">
              <span className="vedit-card-title">{label}</span>
              {block.__isNew && <span className="vedit-badge" data-tone="accent">New</span>}
              {renderError && <span className="vedit-badge" data-tone="danger">Error</span>}
            </span>
            {summary && <span className="vedit-card-summary">{summary}</span>}
          </span>
        </button>
        <span className="vedit-card-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="vedit-icon-btn" data-optional onClick={() => onMove(-1)} disabled={index === 0} title="Move up" aria-label={`Move ${label} up`}>
            <Glyph name="arrow-up" size={15} />
          </button>
          <button type="button" className="vedit-icon-btn" data-optional onClick={() => onMove(1)} disabled={index === total - 1} title="Move down" aria-label={`Move ${label} down`}>
            <Glyph name="arrow-down" size={15} />
          </button>
          <button type="button" className="vedit-icon-btn" onClick={onDuplicate} title="Duplicate" aria-label={`Duplicate ${label}`}>
            <Glyph name="copy" size={15} />
          </button>
          {armed ? (
            <button
              type="button"
              className="vedit-confirm-delete"
              onClick={onDelete}
              onPointerEnter={() => setHeld(true)}
              onPointerLeave={() => setHeld(false)}
              autoFocus
              aria-label={`Confirm deleting ${label}`}
            >
              Delete?
            </button>
          ) : (
            <button
              type="button"
              className="vedit-icon-btn"
              data-tone="danger"
              onClick={() => {
                setHeld(false);
                setArmed(true);
              }}
              title="Delete block"
              aria-label={`Delete ${label}`}
            >
              <Glyph name="trash" size={15} />
            </button>
          )}
          <span className="vedit-card-divider" aria-hidden="true" />
          <button type="button" className="vedit-icon-btn" onClick={onToggle} title={open ? "Collapse" : "Edit"} aria-label={open ? `Collapse ${label}` : `Edit ${label}`}>
            <Glyph name="chevron-down" size={17} className="vedit-chevron" style={{ transform: open ? "none" : "rotate(-90deg)" }} />
          </button>
        </span>
      </div>

      {open && (
        <div className="vedit-card-body">
          {renderError && (
            <div className="vedit-alert" data-tone="danger">
              <Glyph name="alert" size={15} />
              <span>
                <strong>This block didn't render.</strong> {renderError}
              </span>
            </div>
          )}
          {!blockType ? (
            <p className="vedit-muted-note">
              “{block.type}” isn't a registered block type, so it can't be edited here. Its saved content is kept as is.
            </p>
          ) : (
            <>
              {blockType.description && (
                <p className="vedit-card-description">
                  <Glyph name="info" size={15} />
                  <span>{blockType.description}</span>
                </p>
              )}
              {schema.length === 0 ? (
                <p className="vedit-muted-note">This block has no settings.</p>
              ) : (
                <FieldList fields={schema} values={block.fields ?? {}} onFieldChange={onFieldChange} ctx={ctx} path={block.__cid} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
