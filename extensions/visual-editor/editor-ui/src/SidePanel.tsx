import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createSyntheticMarkers,
  insertBlockMarkers,
  nextSyntheticIndex,
  removeBlockMarkers,
  replaceBlockRange,
  reorderBlocksInDOM,
} from "./blockIndex";
import { FieldInput } from "./fields/FieldInput";
import { onInsertRequest } from "./insertBus";
import {
  type BlockField,
  type BlockType,
  type BlocksDataEntry,
  type ContentNode,
  blockTypeFields,
  blockTypeLabel,
  getBlockType,
  getBlockTypes,
  getNode,
  previewBlock,
  updateNodeBlocks,
} from "./api";

/** Editor-local block. `__loadedIndex` is the marker index (kernel or
 *  synthetic) used to look up the corresponding DOM entry. `__cid` is a
 *  stable per-block client id used for selection tracking that survives
 *  drags. `__isNew` flags blocks added in this session so we can
 *  distinguish "unsaved" from "loaded from server". All three are
 *  stripped before save. */
type EditorBlock = BlocksDataEntry & {
  __loadedIndex: number;
  __cid: string;
  __isNew: boolean;
};

let cidCounter = 0;
function nextCid(): string {
  cidCounter += 1;
  return `vec-${cidCounter}-${Math.random().toString(36).slice(2, 8)}`;
}
import type { BlockEntry, BootstrapConfig } from "./types";

interface SidePanelProps {
  config: BootstrapConfig;
  domEntries: BlockEntry[];
  selectedIndex: number | null;
  onSelect: (i: number | null) => void;
  onClose: () => void;
  onSaved: () => void;
  onReindex?: () => void;
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string };

const DEFAULT_WIDTH = 540;
const MIN_WIDTH = 360;

export function SidePanel({
  config,
  domEntries,
  selectedIndex,
  onSelect,
  onClose,
  onSaved,
  onReindex,
}: SidePanelProps): React.JSX.Element {
  const [node, setNode] = useState<ContentNode | null>(null);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [snapshot, setSnapshot] = useState<string>("");
  /** Cache of full block-type records (with html_template) lazy-fetched
   *  for live preview. The list endpoint strips html_template, so the
   *  shallow blockTypes array can't drive previewBlock alone. */
  const [tplCache, setTplCache] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [pendingInsertAt, setPendingInsertAt] = useState<number | null>(null);
  const [width, setWidth] = useState(() => {
    const stored = Number(window.localStorage.getItem("vedit-panel-width"));
    return Number.isFinite(stored) && stored >= MIN_WIDTH ? stored : DEFAULT_WIDTH;
  });

  // Stable refs so the live-preview effect doesn't tear down its timer
  // each parent render.
  const onReindexRef = useRef(onReindex);
  onReindexRef.current = onReindex;
  const domEntriesRef = useRef(domEntries);
  domEntriesRef.current = domEntries;

  useEffect(() => {
    let cancelled = false;
    Promise.all([getNode(config.nodeId), getBlockTypes()])
      .then(([n, types]) => {
        if (cancelled) return;
        const initial = (n.blocks_data ?? []).map(
          (b, i) => ({ ...b, __loadedIndex: i, __cid: nextCid(), __isNew: false } as EditorBlock),
        );
        setNode(n);
        setBlockTypes(types);
        setBlocks(initial);
        setSnapshot(JSON.stringify(stripLocal(initial)));
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [config.nodeId]);

  const blockTypeBySlug = useMemo(() => {
    const m = new Map<string, BlockType>();
    for (const bt of blockTypes) m.set(bt.slug, bt);
    return m;
  }, [blockTypes]);

  /** Resolve the currently-selected block's local position by mapping
   *  the parent-supplied marker index (kernel or synthetic) to a slot
   *  in the local blocks array. This single mapping drives both
   *  click-on-page and click-on-sidebar selection: every block has a
   *  unique loadedIndex (kernel for loaded, synthetic for inserts), so
   *  no separate cid-based selection state is needed. */
  const selectedPos = useMemo<number | null>(() => {
    if (selectedIndex === null) return null;
    const i = blocks.findIndex((b) => b.__loadedIndex === selectedIndex);
    return i === -1 ? null : i;
  }, [selectedIndex, blocks]);

  /** Pick a block by its position in the side-panel list. Mirrors to
   *  the parent's selectedIndex (= loadedIndex) and scrolls the live
   *  DOM range into view. */
  const selectByPos = (pos: number | null): void => {
    if (pos === null) {
      onSelect(null);
      return;
    }
    const block = blocks[pos];
    if (!block) return;
    onSelect(block.__loadedIndex);

    // Scroll the corresponding block on the page into view so the user
    // sees what they're editing. We pick the first non-marker sibling
    // — the start comment itself has no geometry.
    const entry = domEntriesRef.current.find((e) => e.index === block.__loadedIndex);
    if (entry) {
      let n: Node | null = entry.startNode.nextSibling;
      while (n && n !== entry.endNode) {
        if (n.nodeType === Node.ELEMENT_NODE) {
          (n as Element).scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
        n = n.nextSibling;
      }
    }
  };

  const dirty = JSON.stringify(stripLocal(blocks)) !== snapshot;

  const updateField = (index: number, fieldName: string, value: unknown): void => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === index ? { ...b, fields: { ...(b.fields ?? {}), [fieldName]: value } } : b,
      ),
    );
  };

  const deleteBlock = (index: number): void => {
    const block = blocks[index];
    if (!block) return;
    const entry = domEntriesRef.current.find((e) => e.index === block.__loadedIndex);
    if (entry) removeBlockMarkers(entry);
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    onSelect(null);
    onReindexRef.current?.();
  };

  const duplicateBlock = (index: number): void => {
    const target = blocks[index];
    if (!target) return;
    const clonedFields = JSON.parse(JSON.stringify(target.fields ?? {})) as Record<string, unknown>;
    void insertAt(index + 1, target.type, clonedFields);
  };

  useEffect(() => onInsertRequest((idx) => setPendingInsertAt(idx)), []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Lazy-load full block-type record (with html_template) on selection.
  // The list endpoint strips html_template; we fetch the single record
  // by id once and cache the template by slug for subsequent previews.
  useEffect(() => {
    if (selectedPos === null) return;
    const block = blocks[selectedPos];
    if (!block) return;
    if (tplCache[block.type] !== undefined) return;
    const bt = blockTypeBySlug.get(block.type);
    if (!bt) return;
    let cancelled = false;
    getBlockType(bt.id)
      .then((full) => {
        if (cancelled) return;
        setTplCache((prev) => ({ ...prev, [block.type]: full.html_template ?? "" }));
      })
      .catch(() => {
        if (cancelled) return;
        setTplCache((prev) => ({ ...prev, [block.type]: "" }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPos, blocks, blockTypeBySlug, tplCache]);

  // Live preview: debounce 250ms then re-render the block server-side
  // and swap its DOM range. Only fires for blocks that exist in the
  // page (loadedIndex !== null) — newly-inserted blocks live only in
  // state until Save, since synthesizing canonical comment markers on
  // the fly would conflict with kernel-issued indexes.
  useEffect(() => {
    if (selectedPos === null) return;
    const block = blocks[selectedPos];
    if (!block) return;
    const tpl = tplCache[block.type];
    if (!tpl) return;
    const entry = domEntriesRef.current.find((e) => e.index === block.__loadedIndex);
    if (!entry) return;

    const handle = window.setTimeout(() => {
      previewBlock(tpl, block.fields ?? {})
        .then((html) => replaceBlockRange(entry, html))
        .catch(() => {
          /* swallow — non-fatal, save+reload still works */
        });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [selectedPos, blocks, tplCache]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const isSaveCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s";
      if (!isSaveCombo) return;
      if (!dirty || saveState.kind === "saving") return;
      e.preventDefault();
      void handleSave();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dirty, saveState.kind]);

  /**
   * Insert a block at the given position with the supplied field values.
   * Updates state, materializes the block in the DOM (marker pair +
   * rendered HTML so the admin sees it on the page), and selects it.
   * Used for both "+ Add block" and Duplicate.
   */
  const insertAt = async (
    position: number,
    slug: string,
    fields: Record<string, unknown>,
  ): Promise<void> => {
    const bt = blockTypeBySlug.get(slug);
    if (!bt) return;
    const cid = nextCid();
    const syntheticIdx = nextSyntheticIndex();

    // Optimistic state update so the side-panel list updates immediately.
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(position, 0, {
        type: slug,
        fields,
        __loadedIndex: syntheticIdx,
        __cid: cid,
        __isNew: true,
      });
      return next;
    });
    // Select the new block via its synthetic index — the same lookup
    // path used for loaded blocks, so clicking other blocks afterwards
    // correctly switches selection.
    onSelect(syntheticIdx);

    // Lazy-fetch the html_template if we don't have it yet — list
    // endpoint strips it for payload size, so insertion can happen
    // before the user has selected this block-type even once.
    let tpl = tplCache[slug];
    if (tpl === undefined) {
      try {
        const full = await getBlockType(bt.id);
        tpl = full.html_template ?? "";
        setTplCache((prev) => ({ ...prev, [slug]: tpl ?? "" }));
      } catch {
        tpl = "";
      }
    }

    let html = "";
    if (tpl) {
      try {
        html = await previewBlock(tpl, fields);
      } catch {
        /* swallow — we still insert empty markers so a save works */
      }
    }

    const { start, end } = createSyntheticMarkers(syntheticIdx, slug);
    insertBlockMarkers(domEntriesRef.current, position, start, end, html);
    onReindexRef.current?.();
  };

  const insertBlock = (index: number, slug: string): void => {
    const bt = blockTypeBySlug.get(slug);
    if (!bt) return;
    const fields = defaultFieldsFromSchema(blockTypeFields(bt));
    void insertAt(index, slug, fields);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dndIds = useMemo(() => blocks.map((_, i) => `block-${i}`), [blocks]);

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = dndIds.indexOf(String(active.id));
    const newIndex = dndIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    // Every block in state now has a corresponding DOM entry (loaded
    // entries with kernel indexes, inserts with synthetic ones), so
    // we can move the DOM range unconditionally and keep visual order
    // matching the side-panel list.
    reorderBlocksInDOM(domEntriesRef.current, oldIndex, newIndex);
    onReindexRef.current?.();

    setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
    // Selection follows the block by cid automatically (selectedPos
    // recomputes) — no manual fix-ups needed.
  };

  const handleSave = async (): Promise<void> => {
    if (!node) return;
    setSaveState({ kind: "saving" });
    try {
      await updateNodeBlocks(node.id, stripLocal(blocks));
      setSaveState({ kind: "idle" });
      onSaved();
    } catch (err) {
      setSaveState({ kind: "error", message: (err as Error).message });
    }
  };

  const handleDiscard = (): void => {
    if (!snapshot) return;
    // Inserted/deleted blocks have already mutated the live DOM; the
    // simplest faithful revert is a full page reload, which re-renders
    // the canonical theme output from the server.
    window.location.reload();
  };

  // Closing the panel only hides it — neither saves nor discards. The
  // parent keeps SidePanel mounted across hide/show, so unsaved edits
  // (both block list mutations and field values) survive until the user
  // explicitly saves, discards, or refreshes the page.
  const requestClose = (): void => {
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Resize handle: drag to set drawer width. Persists to localStorage.
  const startResize = (e: React.PointerEvent): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev: PointerEvent): void => {
      const delta = startX - ev.clientX;
      const next = Math.max(MIN_WIDTH, Math.min(window.innerWidth * 0.7, startW + delta));
      setWidth(next);
    };
    const onUp = (): void => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      window.localStorage.setItem("vedit-panel-width", String(Math.round(width)));
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const selected = selectedPos == null ? null : blocks[selectedPos] ?? null;
  const selectedType = selected ? blockTypeBySlug.get(selected.type) : undefined;
  const dirtyCount = countDirty(blocks, snapshot);

  return (
    <aside className="vedit-panel" aria-label="Visual editor" style={{ width }}>
      <div className="vedit-resize-handle" onPointerDown={startResize} aria-label="Resize panel" />
      <header className="vedit-panel-header">
        <div className="vedit-panel-title-block">
          <span className="vedit-panel-title">{node ? node.title : `Editing #${config.nodeId}`}</span>
          {node && <span className="vedit-panel-subtitle">{node.node_type} · {node.language_code}</span>}
        </div>
        <button type="button" className="vedit-icon-btn" onClick={requestClose} aria-label="Close" title="Close">×</button>
      </header>

      <div className="vedit-panel-body">
        {loadError && <div className="vedit-error">Failed to load page: {loadError}</div>}

        <PanelSection title="Blocks">
          {blocks.length === 0 ? (
            <p className="vedit-empty">No blocks on this page yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={dndIds} strategy={verticalListSortingStrategy}>
                <ul className="vedit-block-list">
                  {blocks.map((b, i) => {
                    const known = blockTypeBySlug.get(b.type);
                    const stale = b.__isNew;
                    const label = known ? blockTypeLabel(known) : b.type;
                    return (
                      <SortableBlockItem
                        key={b.__cid}
                        id={dndIds[i]!}
                        label={label}
                        index={i}
                        selected={i === selectedPos}
                        stale={stale}
                        onSelect={() => selectByPos(i)}
                        onDuplicate={() => duplicateBlock(i)}
                        onDelete={() => {
                          if (window.confirm(`Delete this ${label} block?`)) deleteBlock(i);
                        }}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          )}
          <button
            type="button"
            className="vedit-add-block"
            onClick={() => setPendingInsertAt(blocks.length)}
            disabled={blockTypes.length === 0}
          >
            + Add block
          </button>
        </PanelSection>

        {pendingInsertAt !== null && (
          <BlockTypeDialog
            blockTypes={blockTypes}
            atIndex={pendingInsertAt}
            onCancel={() => setPendingInsertAt(null)}
            onPick={(slug) => {
              insertBlock(pendingInsertAt, slug);
              setPendingInsertAt(null);
            }}
          />
        )}

        {selected && selectedPos !== null && (
          <section className="vedit-fields-section">
            <h3 className="vedit-fields-title">
              {selectedType ? blockTypeLabel(selectedType) : selected.type}
              <span className="vedit-fields-subtitle">block #{selectedPos}</span>
            </h3>
            {selected.__isNew && (
              <div className="vedit-info">
                Unsaved block — Save to keep this on the page.
              </div>
            )}
            <BlockForm
              block={selected}
              schema={selectedType ? blockTypeFields(selectedType) : []}
              nodeId={config.nodeId}
              nodeType={config.nodeType}
              onFieldChange={(fieldName, value) => updateField(selectedPos, fieldName, value)}
            />
          </section>
        )}
      </div>

      <footer className="vedit-panel-footer">
        <span className="vedit-footer-status">
          {saveState.kind === "saving" && "Saving…"}
          {saveState.kind === "error" && <span className="vedit-error-text">Save failed: {saveState.message}</span>}
          {saveState.kind === "idle" && dirty && `${dirtyCount} pending change${dirtyCount === 1 ? "" : "s"}`}
          {saveState.kind === "idle" && !dirty && "No changes"}
        </span>
        <button type="button" className="vedit-btn" data-variant="secondary" onClick={handleDiscard} disabled={!dirty || saveState.kind === "saving"}>Discard</button>
        <button type="button" className="vedit-btn" data-variant="primary" onClick={handleSave} disabled={!dirty || saveState.kind === "saving"}>Save</button>
      </footer>
    </aside>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="vedit-section">
      <h3 className="vedit-section-title">{title}</h3>
      <div className="vedit-section-body">{children}</div>
    </section>
  );
}

function SortableBlockItem({
  id,
  label,
  index,
  selected,
  stale,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  id: string;
  label: string;
  index: number;
  selected: boolean;
  stale: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li ref={setNodeRef} style={style}>
      <div className="vedit-block-row" data-selected={selected}>
        <button type="button" className="vedit-drag-handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
          <DragGrip />
        </button>
        <button
          type="button"
          className="vedit-block-item"
          aria-current={selected}
          onClick={onSelect}
          title={stale ? "Added in this session — Save to keep on the page" : undefined}
        >
          <span className="vedit-block-item-label">
            <strong>{label}</strong>
            <span className="vedit-block-meta">#{index}</span>
          </span>
          {stale && <span className="vedit-stale-badge">unsaved</span>}
        </button>
        <div className="vedit-row-actions">
          <button
            type="button"
            className="vedit-row-icon"
            aria-label="Duplicate"
            title="Duplicate"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          >
            <DuplicateIcon />
          </button>
          <button
            type="button"
            className="vedit-row-icon"
            data-variant="danger"
            aria-label="Delete"
            title="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </li>
  );
}

function DragGrip(): React.JSX.Element {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
      <circle cx="2" cy="3" r="1.2" fill="currentColor" />
      <circle cx="2" cy="7" r="1.2" fill="currentColor" />
      <circle cx="2" cy="11" r="1.2" fill="currentColor" />
      <circle cx="8" cy="3" r="1.2" fill="currentColor" />
      <circle cx="8" cy="7" r="1.2" fill="currentColor" />
      <circle cx="8" cy="11" r="1.2" fill="currentColor" />
    </svg>
  );
}

function DuplicateIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 4h10M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4M5 4l.5 9.5A1 1 0 0 0 6.5 14.5h3a1 1 0 0 0 1-1L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BlockTypeDialog({
  blockTypes,
  atIndex,
  onCancel,
  onPick,
}: {
  blockTypes: BlockType[];
  atIndex: number;
  onCancel: () => void;
  onPick: (slug: string) => void;
}): React.JSX.Element {
  const [filter, setFilter] = useState("");
  const sorted = useMemo(
    () => [...blockTypes].sort((a, b) => blockTypeLabel(a).localeCompare(blockTypeLabel(b))),
    [blockTypes],
  );
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (bt) => blockTypeLabel(bt).toLowerCase().includes(q) || bt.slug.toLowerCase().includes(q),
    );
  }, [sorted, filter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="vedit-modal-backdrop" onClick={onCancel}>
      <div className="vedit-modal" onClick={(e) => e.stopPropagation()}>
        <header className="vedit-modal-header">
          <span className="vedit-modal-title">Insert block at position {atIndex}</span>
          <button type="button" className="vedit-link" onClick={onCancel}>Cancel</button>
        </header>
        <input
          type="text"
          className="vedit-input"
          placeholder="Search block types…"
          autoFocus
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <ul className="vedit-block-picker-list">
          {filtered.length === 0 && <li className="vedit-empty">No matches.</li>}
          {filtered.map((bt) => (
            <li key={bt.slug}>
              <button type="button" className="vedit-block-picker-item" onClick={() => onPick(bt.slug)}>
                <strong>{blockTypeLabel(bt)}</strong>
                <span className="vedit-block-meta">{bt.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function defaultFieldsFromSchema(schema: BlockField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of schema) {
    if (f.initialValue !== undefined) {
      out[f.name] = f.initialValue;
      continue;
    }
    const t = (f.type || "").toLowerCase();
    if (t === "boolean" || t === "toggle") out[f.name] = false;
    else if (t === "number" || t === "integer" || t === "range") out[f.name] = null;
    else if (t === "object" || t === "group") out[f.name] = {};
    else if (t === "array" || t === "repeater" || t === "gallery" || t === "checkbox") out[f.name] = [];
    else if (t === "string" || t === "text" || t === "textarea" || t === "url" || t === "email" || t === "richtext" || t === "wysiwyg") out[f.name] = "";
    else out[f.name] = null;
  }
  return out;
}

function BlockForm({
  block,
  schema,
  nodeId,
  nodeType,
  onFieldChange,
}: {
  block: BlocksDataEntry;
  schema: BlockField[];
  nodeId: number;
  nodeType: string;
  onFieldChange: (fieldName: string, value: unknown) => void;
}): React.JSX.Element {
  if (schema.length === 0) {
    return (
      <p className="vedit-empty">
        No field schema registered for &quot;{block.type}&quot;. Use the admin editor for raw JSON edits.
      </p>
    );
  }
  const fields = (block.fields ?? {}) as Record<string, unknown>;
  return (
    <div className="vedit-form">
      {schema.map((f) => (
        <FieldInput
          key={f.name}
          field={f}
          value={fields[f.name]}
          onChange={(v) => onFieldChange(f.name, v)}
          nodeId={nodeId}
          nodeType={nodeType}
          path={f.name}
        />
      ))}
    </div>
  );
}

/** Strip editor-local fields (anything starting with __) before sending
 *  to the API. The kernel rejects unknown JSON fields silently but we
 *  keep the wire payload clean. */
function stripLocal(blocks: EditorBlock[]): BlocksDataEntry[] {
  return blocks.map(({ __loadedIndex: _li, __cid: _cid, __isNew: _new, ...rest }) => rest as BlocksDataEntry);
}

function countDirty(current: EditorBlock[], snapshotJSON: string): number {
  if (!snapshotJSON) return 0;
  let prev: BlocksDataEntry[] = [];
  try {
    prev = JSON.parse(snapshotJSON) as BlocksDataEntry[];
  } catch {
    return 0;
  }
  const cur = stripLocal(current);
  const max = Math.max(cur.length, prev.length);
  let diff = 0;
  for (let i = 0; i < max; i++) {
    if (JSON.stringify(cur[i]) !== JSON.stringify(prev[i])) diff++;
  }
  return diff;
}
