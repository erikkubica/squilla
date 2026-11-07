import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  adminEditURL,
  blockRenderError,
  blockTypeFields,
  blockTypeLabel,
  getBlockTypes,
  getNode,
  renderBlocks,
  updateNodeBlocks,
  type BlockType,
  type BlocksDataEntry,
  type ContentNode,
} from "./api";
import { AddBlockDialog } from "./AddBlockDialog";
import { BlockCard, blockIconValue, type EditorBlock } from "./BlockCard";
import {
  blockBoundingRect,
  createSyntheticMarkers,
  insertBlockMarkers,
  nextSyntheticIndex,
  removeBlockMarkers,
  reorderBlocksInDOM,
  replaceBlockRange,
} from "./blockIndex";
import { useIconLookup } from "./fields/IconField";
import { emptyValues } from "./fields/layout";
import { onInsertRequest } from "./insertBus";
import { writeResume, type ResumeState } from "./resume";
import type { BlockEntry, BootstrapConfig } from "./types";
import { Glyph, humanize, modalOpen, pushEscape } from "./ui";

let cidCounter = 0;
function nextCid(): string {
  cidCounter += 1;
  return `vec-${cidCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

interface SidePanelProps {
  config: BootstrapConfig;
  domEntries: BlockEntry[];
  selectedIndex: number | null;
  onSelect: (i: number | null) => void;
  /** The panel stays mounted while hidden so unsaved edits survive. */
  hidden: boolean;
  onClose: () => void;
  onReindex: () => void;
  /** Block type labels by slug, for the on-page outline captions. */
  onBlockTypes: (labels: Map<string, string>) => void;
  resume: ResumeState | null;
}

type SaveState = { kind: "idle"; saved: boolean } | { kind: "saving" } | { kind: "error"; message: string };

const DEFAULT_WIDTH = 480;
const MIN_WIDTH = 380;
const WIDTH_KEY = "vedit-panel-width";

/** Height of the kernel's front-end admin bar, read from the CSS variable
 *  it sets on <html>. */
export function adminBarHeight(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--squilla-admin-bar-h");
  return parseFloat(v) || 0;
}

export function SidePanel({
  config,
  domEntries,
  selectedIndex,
  onSelect,
  hidden,
  onClose,
  onReindex,
  onBlockTypes,
  resume,
}: SidePanelProps): React.JSX.Element {
  const [node, setNode] = useState<ContentNode | null>(null);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle", saved: false });
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [renderErrors, setRenderErrors] = useState<Record<string, string>>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(resume?.toast ?? null);
  const [width, setWidth] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem(WIDTH_KEY));
      return Number.isFinite(stored) && stored >= MIN_WIDTH ? stored : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef(new Map<string, HTMLDivElement>());
  const leavingRef = useRef(false);
  /** cid → JSON of the fields last sent for rendering. */
  const renderedRef = useRef(new Map<string, string>());
  /** cid → sequence number of the newest render request for it. */
  const renderSeqRef = useRef(new Map<string, number>());
  const seqRef = useRef(0);

  // Stable refs so effects don't re-subscribe on every parent render.
  const domEntriesRef = useRef(domEntries);
  domEntriesRef.current = domEntries;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onBlockTypesRef = useRef(onBlockTypes);
  onBlockTypesRef.current = onBlockTypes;
  const resumeRef = useRef(resume);

  // --- Load --------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    Promise.all([getNode(config.nodeId), getBlockTypes()])
      .then(([n, types]) => {
        if (cancelled) return;
        const initial: EditorBlock[] = (n.blocks_data ?? []).map((b, i) => ({
          ...b,
          fields: b.fields ?? {},
          __loadedIndex: i,
          __cid: nextCid(),
          __isNew: false,
        }));
        // What the server rendered is what's on the page already.
        for (const b of initial) renderedRef.current.set(b.__cid, JSON.stringify(b.fields));
        setNode(n);
        setBlockTypes(types);
        setBlocks(initial);
        setSnapshot(takeSnapshot(initial));
        onBlockTypesRef.current(new Map(types.map((t) => [t.slug, blockTypeLabel(t)])));
        const pos = resumeRef.current?.pos;
        if (pos != null && initial[pos]) onSelectRef.current(initial[pos].__loadedIndex);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [config.nodeId]);

  // Restore the list's scroll offset once after a resume (and skip the
  // scroll-to-open-card that would otherwise follow).
  const skipRevealRef = useRef(false);
  const restoredRef = useRef(false);
  useLayoutEffect(() => {
    if (restoredRef.current || blocks.length === 0) return;
    restoredRef.current = true;
    const top = resumeRef.current?.panelScroll;
    if (top && scrollRef.current) {
      scrollRef.current.scrollTop = top;
      skipRevealRef.current = true;
    }
  }, [blocks.length]);

  const blockTypeBySlug = useMemo(() => new Map(blockTypes.map((bt) => [bt.slug, bt])), [blockTypes]);
  const iconValues = useMemo(
    () => blockTypes.map((bt) => blockIconValue(bt.icon)).filter((v): v is string => !!v),
    [blockTypes],
  );
  const icons = useIconLookup(iconValues);

  const selectedPos = useMemo<number | null>(() => {
    if (selectedIndex === null) return null;
    const i = blocks.findIndex((b) => b.__loadedIndex === selectedIndex);
    return i === -1 ? null : i;
  }, [selectedIndex, blocks]);
  const selectedCid = selectedPos === null ? null : blocks[selectedPos]?.__cid ?? null;

  const current = useMemo(() => JSON.stringify(stripLocal(blocks)), [blocks]);
  const dirty = snapshot !== null && current !== snapshot.json;
  const dirtyCount = useMemo(() => (dirty && snapshot ? countDirty(blocks, snapshot) : 0), [dirty, blocks, snapshot]);

  // Keep the open card in view when the selection comes from the page.
  useEffect(() => {
    if (!selectedCid || hidden) return;
    if (skipRevealRef.current) {
      skipRevealRef.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const el = cardEls.current.get(selectedCid);
      const sc = scrollRef.current;
      if (!el || !sc) return;
      const er = el.getBoundingClientRect();
      const sr = sc.getBoundingClientRect();
      if (er.top < sr.top + 4 || er.top > sr.bottom - 140) {
        sc.scrollTo({ top: sc.scrollTop + (er.top - sr.top) - 12, behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedCid, hidden]);

  // --- Live preview --------------------------------------------------------------
  // Any block whose fields differ from what was last rendered is sent to
  // the node's render endpoint (debounced while typing; immediately for
  // brand-new blocks) and its range on the page is swapped in place.
  useEffect(() => {
    if (!node) return;
    const pending = blocks.filter((b) => renderedRef.current.get(b.__cid) !== JSON.stringify(b.fields ?? {}));
    if (pending.length === 0) return;
    const fresh = pending.every((b) => !renderedRef.current.has(b.__cid));
    const timer = window.setTimeout(
      () => {
        const seq = ++seqRef.current;
        const batch = pending.map((b) => {
          renderedRef.current.set(b.__cid, JSON.stringify(b.fields ?? {}));
          renderSeqRef.current.set(b.__cid, seq);
          return { cid: b.__cid, index: b.__loadedIndex, slug: b.type, payload: { type: b.type, fields: b.fields ?? {} } };
        });
        renderBlocks(node.id, batch.map((p) => p.payload))
          .then((htmls) => {
            const errors: Record<string, string | null> = {};
            batch.forEach((p, i) => {
              if (renderSeqRef.current.get(p.cid) !== seq) return; // superseded
              const entry = domEntriesRef.current.find((e) => e.index === p.index);
              if (!entry) return;
              const html = htmls[i] ?? "";
              replaceBlockRange(entry, html);
              errors[p.cid] = blockRenderError(html);
              // Lets theme scripts re-initialise widgets inside the block.
              document.dispatchEvent(
                new CustomEvent("squilla:block-rendered", { detail: { index: p.index, slug: p.slug, start: entry.startNode, end: entry.endNode } }),
              );
            });
            setRenderErrors((prev) => {
              const next = { ...prev };
              for (const [cid, msg] of Object.entries(errors)) {
                if (msg) next[cid] = msg;
                else delete next[cid];
              }
              return next;
            });
            setPreviewError(null);
          })
          .catch((err: Error) => {
            batch.forEach((p) => {
              if (renderSeqRef.current.get(p.cid) === seq) renderedRef.current.delete(p.cid);
            });
            setPreviewError(err.message);
          });
      },
      fresh ? 0 : 250,
    );
    return () => window.clearTimeout(timer);
  }, [blocks, node]);

  // --- Editing ----------------------------------------------------------------------
  const updateField = (cid: string, name: string, value: unknown): void => {
    setBlocks((prev) => prev.map((b) => (b.__cid === cid ? { ...b, fields: { ...(b.fields ?? {}), [name]: value } } : b)));
  };

  /** Scroll the page so a block is in view (below the admin bar and any
   *  sticky header), unless it already is. */
  const revealOnPage = (loadedIndex: number): void => {
    const entry = domEntriesRef.current.find((e) => e.index === loadedIndex);
    const rect = entry ? blockBoundingRect(entry) : null;
    if (!rect) return;
    const top = adminBarHeight() + 72;
    if (rect.top >= top - 24 && rect.top < window.innerHeight * 0.5) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - top), behavior: "smooth" });
  };

  const toggleCard = (b: EditorBlock): void => {
    if (selectedIndex === b.__loadedIndex) {
      onSelect(null);
      return;
    }
    onSelect(b.__loadedIndex);
    revealOnPage(b.__loadedIndex);
  };

  const insertBlock = (position: number, slug: string, fields: Record<string, unknown>): void => {
    const cid = nextCid();
    const idx = nextSyntheticIndex();
    const { start, end } = createSyntheticMarkers(idx, slug);
    // Empty range for now; the preview effect renders it straight away.
    insertBlockMarkers(domEntriesRef.current, position, start, end, "");
    setBlocks((prev) => {
      const next = prev.slice();
      next.splice(position, 0, { type: slug, fields, __loadedIndex: idx, __cid: cid, __isNew: true });
      return next;
    });
    onReindex();
    onSelect(idx);
    window.setTimeout(() => revealOnPage(idx), 350);
  };

  const duplicateBlock = (i: number): void => {
    const b = blocks[i];
    if (!b) return;
    insertBlock(i + 1, b.type, JSON.parse(JSON.stringify(b.fields ?? {})) as Record<string, unknown>);
  };

  const deleteBlock = (i: number): void => {
    const b = blocks[i];
    if (!b) return;
    const entry = domEntriesRef.current.find((e) => e.index === b.__loadedIndex);
    if (entry) removeBlockMarkers(entry);
    renderedRef.current.delete(b.__cid);
    setBlocks((prev) => prev.filter((x) => x.__cid !== b.__cid));
    if (selectedIndex === b.__loadedIndex) onSelect(null);
    onReindex();
  };

  const moveBlock = (from: number, to: number): void => {
    if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return;
    // The page's block ranges are in the same order as `blocks`, so the
    // same move applies to both.
    reorderBlocksInDOM(domEntriesRef.current, from, to);
    setBlocks((prev) => arrayMove(prev, from, to));
    onReindex();
    const moved = blocks[from];
    if (moved && selectedIndex === moved.__loadedIndex) window.setTimeout(() => revealOnPage(moved.__loadedIndex), 60);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return;
    moveBlock(
      blocks.findIndex((b) => b.__cid === active.id),
      blocks.findIndex((b) => b.__cid === over.id),
    );
  };

  // Page "+" gutters ask for an insert at a position.
  useEffect(() => onInsertRequest((idx) => setInsertAt(idx)), []);

  // --- Save / discard -------------------------------------------------------------
  const handleSave = async (): Promise<void> => {
    if (!node || saveState.kind === "saving") return;
    setSaveState({ kind: "saving" });
    const sent = blocks;
    try {
      await updateNodeBlocks(node.id, stripLocal(sent));
      // The page already shows these blocks; just move the baseline.
      setSnapshot(takeSnapshot(sent));
      setBlocks((prev) => prev.map((b) => (b.__isNew ? { ...b, __isNew: false } : b)));
      setSaveState({ kind: "idle", saved: true });
      setToast("Changes saved");
    } catch (err) {
      setSaveState({ kind: "error", message: (err as Error).message });
    }
  };
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;

  const handleDiscard = (): void => {
    if (!dirty) return;
    if (!window.confirm(`Discard ${dirtyCount === 1 ? "this unsaved change" : `all ${dirtyCount} unsaved changes`}?`)) return;
    // Inserts, deletes and moves have already changed the live page; a
    // reload is the faithful revert. The editor reopens where it was.
    writeResume(config.nodeId, { pos: selectedPos, panelScroll: scrollRef.current?.scrollTop ?? 0, toast: "Changes discarded" });
    leavingRef.current = true;
    window.location.reload();
  };

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (leavingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // ⌘S / Ctrl+S saves while the panel is open.
  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent): void => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s")) return;
      e.preventDefault();
      if (modalOpen()) return;
      void saveRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hidden]);

  // Escape closes the panel — but first just leaves a text field the
  // cursor is in. Modals sit above this on the Escape stack.
  useEffect(() => {
    if (hidden) return;
    return pushEscape((e) => {
      const target = e.composedPath()[0] as HTMLElement | undefined;
      const root = target?.getRootNode?.();
      const inEditor = root instanceof ShadowRoot && root.host.hasAttribute("data-vedit-host");
      if (inEditor && target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        target.blur();
        return;
      }
      onCloseRef.current();
    }, false);
  }, [hidden]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // --- Resize ---------------------------------------------------------------------------
  const startResize = (e: React.PointerEvent): void => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    let latest = startW;
    const onMove = (ev: PointerEvent): void => {
      latest = Math.round(Math.max(MIN_WIDTH, Math.min(window.innerWidth * 0.7, startW + (startX - ev.clientX))));
      setWidth(latest);
    };
    const onUp = (): void => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      try {
        window.localStorage.setItem(WIDTH_KEY, String(latest));
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  // --- Render ------------------------------------------------------------------------------
  const ctx = { nodeId: config.nodeId, nodeType: config.nodeType };
  const placement = (pos: number): string => {
    if (blocks.length === 0) return "It will be the first block on this page.";
    if (pos >= blocks.length) return "It goes at the end of the page.";
    const before = blocks[pos];
    const label = before ? blockTypeLabel(blockTypeBySlug.get(before.type)) : "";
    return `It goes above block ${pos + 1}${label && label !== "(unnamed)" ? ` (${label})` : ""}.`;
  };

  let status: React.ReactNode;
  let statusTone: "muted" | "dirty" | "danger" = "muted";
  if (!node && !loadError) status = "Loading…";
  else if (saveState.kind === "saving") status = <><Glyph name="loader" size={14} className="vedit-spin" /> Saving…</>;
  else if (saveState.kind === "error") {
    status = `Couldn't save: ${saveState.message}`;
    statusTone = "danger";
  } else if (dirty) {
    status = `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`;
    statusTone = "dirty";
  } else status = saveState.saved ? <><Glyph name="check" size={14} /> All changes saved</> : "No changes";

  return (
    <aside className="vedit-panel" aria-label="Page editor" style={{ width }}>
      <div className="vedit-resize-handle" onPointerDown={startResize} title="Drag to resize" />
      <header className="vedit-panel-header">
        <div className="vedit-panel-heading">
          <span className="vedit-panel-eyebrow">
            {node ? `${humanize(node.node_type)} · ${node.language_code.toUpperCase()}` : "Editing"}
            {node?.status && node.status !== "published" && <span className="vedit-status-pill">{node.status}</span>}
          </span>
          <span className="vedit-panel-title">{node ? node.title : `#${config.nodeId}`}</span>
        </div>
        <a className="vedit-icon-btn" href={adminEditURL(config.nodeType, config.nodeId)} target="_blank" rel="noopener" title="Open in admin" aria-label="Open this page in the admin">
          <Glyph name="external" size={16} />
        </a>
        <button type="button" className="vedit-icon-btn" onClick={onClose} title="Close (Esc) — unsaved changes are kept" aria-label="Close editor">
          <Glyph name="x" size={18} />
        </button>
      </header>

      <div className="vedit-panel-body" ref={scrollRef}>
        {loadError && <div className="vedit-alert" data-tone="danger">Couldn't load this page: {loadError}</div>}
        {previewError && (
          <div className="vedit-alert" data-tone="warning">
            <Glyph name="alert" size={15} />
            <span>Live preview failed ({previewError}). Your edits are kept — save and reload to see them.</span>
          </div>
        )}

        {node && (
          <div className="vedit-section-head">
            <span className="vedit-section-title">Blocks</span>
            <span className="vedit-count">{blocks.length}</span>
          </div>
        )}

        {node && blocks.length === 0 && (
          <div className="vedit-empty-state">
            <span className="vedit-empty-icon"><Glyph name="blocks" size={20} /></span>
            <p className="vedit-empty-title">No blocks yet</p>
            <p className="vedit-empty-text">Add a block to start building this page.</p>
          </div>
        )}

        {blocks.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.__cid)} strategy={verticalListSortingStrategy}>
              <div className="vedit-block-list">
                {blocks.map((b, i) => (
                  <BlockCard
                    key={b.__cid}
                    block={b}
                    index={i}
                    total={blocks.length}
                    blockType={blockTypeBySlug.get(b.type)}
                    icons={icons}
                    open={b.__cid === selectedCid}
                    renderError={renderErrors[b.__cid]}
                    ctx={ctx}
                    onToggle={() => toggleCard(b)}
                    onMove={(d) => moveBlock(i, i + d)}
                    onDuplicate={() => duplicateBlock(i)}
                    onDelete={() => deleteBlock(i)}
                    onFieldChange={(name, value) => updateField(b.__cid, name, value)}
                    cardRef={(el) => {
                      if (el) cardEls.current.set(b.__cid, el);
                      else cardEls.current.delete(b.__cid);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {node && (
          <button type="button" className="vedit-add-button" onClick={() => setInsertAt(blocks.length)} disabled={blockTypes.length === 0}>
            <Glyph name="plus" size={16} />
            Add block
          </button>
        )}
      </div>

      {toast && (
        <div className="vedit-toast" role="status">
          <Glyph name="check" size={14} strokeWidth={2.4} />
          {toast}
        </div>
      )}

      <footer className="vedit-panel-footer">
        <span className="vedit-footer-status" data-tone={statusTone}>{status}</span>
        <button type="button" className="vedit-btn" data-variant="secondary" onClick={handleDiscard} disabled={!dirty || saveState.kind === "saving"}>
          Discard
        </button>
        <button type="button" className="vedit-btn" data-variant="primary" onClick={() => void handleSave()} disabled={!dirty || saveState.kind === "saving"} title="Save (⌘S)">
          {saveState.kind === "saving" ? "Saving…" : "Save"}
        </button>
      </footer>

      {insertAt !== null && (
        <AddBlockDialog
          blockTypes={blockTypes}
          icons={icons}
          placement={placement(insertAt)}
          onClose={() => setInsertAt(null)}
          onPick={(slug) => {
            const bt = blockTypeBySlug.get(slug);
            const at = Math.min(insertAt, blocks.length);
            setInsertAt(null);
            if (bt) insertBlock(at, slug, emptyValues(blockTypeFields(bt)));
          }}
        />
      )}
    </aside>
  );
}

/** Strip editor-local fields (anything starting with __) before sending
 *  to the API. */
function stripLocal(blocks: EditorBlock[]): BlocksDataEntry[] {
  return blocks.map(({ __loadedIndex: _li, __cid: _cid, __isNew: _new, ...rest }) => rest as BlocksDataEntry);
}

/** The saved state, by block identity, so changes can be counted the way
 *  an editor thinks of them. */
interface Snapshot {
  json: string;
  byCid: Map<string, string>;
  order: string[];
}

function takeSnapshot(blocks: EditorBlock[]): Snapshot {
  const plain = stripLocal(blocks);
  return {
    json: JSON.stringify(plain),
    byCid: new Map(blocks.map((b, i) => [b.__cid, JSON.stringify(plain[i])])),
    order: blocks.map((b) => b.__cid),
  };
}

/** One per added, removed or edited block, plus one if the remaining
 *  blocks were reordered. Inserting a block counts once, not once for
 *  every block it pushed down. */
function countDirty(current: EditorBlock[], saved: Snapshot): number {
  const plain = stripLocal(current);
  let n = 0;
  current.forEach((b, i) => {
    const was = saved.byCid.get(b.__cid);
    if (was === undefined || was !== JSON.stringify(plain[i])) n++;
  });
  const live = new Set(current.map((b) => b.__cid));
  const kept = saved.order.filter((cid) => live.has(cid));
  n += saved.order.length - kept.length;
  const nowOrder = current.map((b) => b.__cid).filter((cid) => saved.byCid.has(cid));
  if (nowOrder.some((cid, i) => cid !== kept[i])) n++;
  return n;
}
