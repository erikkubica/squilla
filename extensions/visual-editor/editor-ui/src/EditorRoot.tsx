import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { blockBoundingRect, findBlockForNode, indexBlockMarkers } from "./blockIndex";
import { requestInsertAt } from "./insertBus";
import { emitPanel } from "./panelBus";
import { startInlineEdit, targetAt, type PageTarget } from "./pageTargets";
import { takeResume, type ResumeState } from "./resume";
import { SidePanel, adminBarHeight } from "./SidePanel";
import { getAdminBar, type AdminBarAPI, type BlockEntry, type BootstrapConfig, type Rect } from "./types";

interface EditorRootProps {
  config: BootstrapConfig;
}

export function EditorRoot({ config }: EditorRootProps): React.JSX.Element {
  // After the editor's own reload (Discard) it reopens where it was.
  const [resume] = useState<ResumeState | null>(() => takeResume(config.nodeId));

  // `active` flips on the first time the user opens the editor and stays
  // on for the lifetime of the page so SidePanel's in-memory edit state
  // survives a close. `hidden` is the visual toggle: clicking × hides
  // the panel + overlays so the user can see the full page, but state
  // is retained until refresh.
  const [active, setActive] = useState(() => resume !== null);
  const [hidden, setHidden] = useState(false);
  const live = active && !hidden;
  const [entries, setEntries] = useState<BlockEntry[]>([]);

  // Kernel admin bar: when present, the editor toggle is a "Customize"
  // item in the bar instead of the floating button (kept as fallback).
  const [adminBar, setAdminBar] = useState<AdminBarAPI | null>(() => getAdminBar());
  useEffect(() => {
    if (adminBar) return;
    const onReady = () => setAdminBar(getAdminBar());
    document.addEventListener("squilla:adminbar-ready", onReady);
    return () => document.removeEventListener("squilla:adminbar-ready", onReady);
  }, [adminBar]);

  const toggleRef = useRef<() => void>(() => {});
  toggleRef.current = () => {
    if (live) {
      setHidden(true);
    } else {
      setActive(true);
      setHidden(false);
    }
  };

  useEffect(() => {
    if (!adminBar) return;
    const handle = adminBar.add({
      id: "visual-editor",
      label: "Customize",
      title: "Edit this page's blocks in place",
      onClick: () => toggleRef.current(),
    });
    return () => handle?.remove();
  }, [adminBar]);

  useEffect(() => {
    adminBar?.update("visual-editor", { label: live ? "Close editor" : "Customize", active: live });
  }, [adminBar, live]);

  // The panel slides mostly out of view when the page is used (scrolling
  // it, or clicking on it without picking something to edit) so more of
  // the page is visible. Pointing at it or focusing it brings it back.
  const [peek, setPeek] = useState(false);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  /** Block type labels by slug, filled once the panel has loaded them. */
  const labelsRef = useRef<Map<string, string>>(new Map());

  // Refs to the outline divs so we can move them via rAF without going
  // through React state. setTick-on-scroll caused visible lag because
  // each frame had to round-trip through React render.
  const hoverRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const guttersRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const fieldActionRef = useRef<HTMLButtonElement | null>(null);
  /** The title / image / header the pointer is over (not a block). */
  const hoverTargetRef = useRef<PageTarget | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!live) {
      setHoverIndex(null);
      return;
    }
    setEntries(indexBlockMarkers(document.body));
  }, [live]);

  // Imperative outline + insert-gutter positioning loop. While active,
  // each animation frame reads getBoundingClientRect for the hovered
  // and selected entries and writes the outline divs' transform/size
  // directly. No React render in this hot path → outline snaps to the
  // page during scroll instead of trailing it.
  useEffect(() => {
    if (!live) return;
    let frame = 0;
    let lastCount = -1;
    const tick = () => {
      const barH = adminBarHeight();
      const hoverPos = hoverIndex == null ? -1 : entries.findIndex((e) => e.index === hoverIndex);
      const selectedPos = selectedIndex == null ? -1 : entries.findIndex((e) => e.index === selectedIndex);
      const hover = hoverPos >= 0 ? entries[hoverPos]! : null;
      const selected = selectedPos >= 0 ? entries[selectedPos]! : null;

      paintTarget(fieldRef.current, fieldActionRef.current, hoverTargetRef.current, barH, rootRef.current);
      paintOutline(hoverRef.current, hover && hoverPos !== selectedPos ? blockBoundingRect(hover) : null, hover ? caption(hoverPos, hover.slug, labelsRef.current) : "", barH);
      paintOutline(selectedRef.current, selected ? blockBoundingRect(selected) : null, selected ? caption(selectedPos, selected.slug, labelsRef.current) : "", barH);

      // Insert gutters: rebuilt only when the block count changes, then
      // just repositioned. Only the gaps around the hovered and selected
      // blocks show a "+", so the page isn't covered in buttons.
      if (entries.length !== lastCount && guttersRef.current) {
        rebuildGutters(guttersRef.current, entries.length);
        lastCount = entries.length;
      }
      const visible = new Set<number>();
      for (const p of [hoverPos, selectedPos]) {
        if (p >= 0) {
          visible.add(p);
          visible.add(p + 1);
        }
      }
      paintGutters(guttersRef.current, entries, visible, visibleArea(rootRef.current, barH));

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live, entries, hoverIndex, selectedIndex]);

  useEffect(() => {
    if (!live) return;
    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if ((e.target as Element)?.closest?.("[data-vedit-host]")) return;
      const field = targetAt(target);
      hoverTargetRef.current = field;
      if (field) {
        setHoverIndex(null);
        return;
      }
      const block = findBlockForNode(target, entries);
      setHoverIndex(block ? block.index : null);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if ((e.target as Element)?.closest?.("[data-vedit-host]")) return;
      const field = targetAt(target);
      if (field) {
        // Clicks inside a title being typed in place are just clicks.
        if (field.el.dataset.veditEditing === "1") return;
        e.preventDefault();
        e.stopPropagation();
        // Typing in place only hides the panel; the image and header /
        // footer toggle it like a block does.
        if (field.kind === "title" || field.kind === "excerpt") setPeek(true);
        else setPeek((p) => !p);
        activateTarget(field);
        return;
      }
      // Clicking something editable toggles the panel: open → tuck it away,
      // tucked away → bring it back with that block's card open. Clicking
      // empty page only tucks it away.
      const block = findBlockForNode(target, entries);
      setPeek((p) => (block ? !p : true));
      if (block) {
        // While editing, clicks on the page select blocks instead of
        // following links or opening lightboxes.
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(block.index);
      }
    };
    const onWheel = (e: Event) => {
      if ((e.target as Element)?.closest?.("[data-vedit-host]")) return;
      setPeek(true);
    };
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("wheel", onWheel, { capture: true, passive: true });
    document.addEventListener("touchmove", onWheel, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("touchmove", onWheel, true);
    };
  }, [live, entries]);

  const activateTarget = (t: PageTarget): void => {
    if (t.kind === "title" || t.kind === "excerpt") {
      startInlineEdit(t);
      return;
    }
    emitPanel({ type: "activate", kind: t.kind, key: t.key });
  };
  const activateRef = useRef(activateTarget);
  activateRef.current = activateTarget;

  const reindex = useMemo(() => () => setEntries(indexBlockMarkers(document.body)), []);
  const onBlockTypes = useMemo(
    () => (labels: Map<string, string>) => {
      labelsRef.current = labels;
    },
    [],
  );

  return (
    <>
      {!live && !adminBar && (
        <button
          type="button"
          className="vedit-toggle"
          onClick={() => {
            setActive(true);
            setHidden(false);
          }}
        >
          Edit page
        </button>
      )}

      {active && (
        <div ref={rootRef} style={hidden ? { display: "none" } : undefined}>
          <div className="vedit-overlay" aria-hidden="true">
            <div ref={hoverRef} className="vedit-outline" data-kind="hover" style={{ display: "none" }}>
              <span className="vedit-label" />
            </div>
            <div ref={selectedRef} className="vedit-outline" data-kind="selected" style={{ display: "none" }}>
              <span className="vedit-label" />
            </div>
            <div ref={fieldRef} className="vedit-outline" data-kind="field" style={{ display: "none" }}>
              <button
                ref={fieldActionRef}
                type="button"
                className="vedit-field-action"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // The chip is an explicit "edit this": show the panel.
                  setPeek(false);
                  if (hoverTargetRef.current) activateRef.current(hoverTargetRef.current);
                }}
              />
            </div>
            <div ref={guttersRef} className="vedit-gutters" />
          </div>

          <SidePanel
            config={config}
            domEntries={entries}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            hidden={hidden}
            onClose={() => setHidden(true)}
            onReindex={reindex}
            onBlockTypes={onBlockTypes}
            resume={resume}
            peek={peek}
            onWake={() => setPeek(false)}
          />
        </div>
      )}
    </>
  );
}

function caption(pos: number, slug: string, labels: Map<string, string>): string {
  return `${pos + 1} · ${labels.get(slug) ?? slug}`;
}

const LABEL_H = 22;

/**
 * Position an outline over a block. The caption sits above the block's
 * top edge; when that edge is under the admin bar or off-screen, the
 * caption moves inside the outline and sticks to the top of the visible
 * area so it never gets cut off.
 */
function paintOutline(node: HTMLDivElement | null, rect: Rect | null, label: string, barH: number): void {
  if (!node) return;
  if (!rect || !label || rect.top + rect.height < barH || rect.top > window.innerHeight) {
    node.style.display = "none";
    return;
  }
  node.style.display = "block";
  node.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  const labelEl = node.firstElementChild as HTMLElement | null;
  if (!labelEl) return;
  if (labelEl.textContent !== label) labelEl.textContent = label;
  const roomAbove = rect.top - barH >= LABEL_H;
  labelEl.dataset.inside = roomAbove ? "" : "true";
  // Inside: pin to the first visible pixel of the block.
  labelEl.style.top = roomAbove ? `${-LABEL_H}px` : `${Math.max(0, barH - rect.top)}px`;
  labelEl.style.left = `${Math.max(0, -rect.left) - (roomAbove ? 2 : 0)}px`;
}

/** Outline plus an action chip ("Replace image", "Edit title") on the
 *  page element under the pointer. The chip stays inside the visible area
 *  — below the admin bar, left of the panel. */
function paintTarget(
  outline: HTMLDivElement | null,
  action: HTMLButtonElement | null,
  t: PageTarget | null,
  barH: number,
  root: HTMLElement | null,
): void {
  if (!outline || !action) return;
  const r = t && t.el.isConnected ? t.el.getBoundingClientRect() : null;
  if (!t || !r || r.width < 8 || r.height < 8 || r.bottom < barH || r.top > window.innerHeight) {
    outline.style.display = "none";
    return;
  }
  const editing = t.el.dataset.veditEditing === "1";
  outline.style.display = "block";
  outline.dataset.editing = editing ? "true" : "";
  outline.style.transform = `translate(${r.left}px, ${r.top}px)`;
  outline.style.width = `${r.width}px`;
  outline.style.height = `${r.height}px`;
  if (action.dataset.k !== t.action + t.caption) {
    action.dataset.k = t.action + t.caption;
    action.textContent = "";
    const cap = document.createElement("span");
    cap.className = "vedit-field-caption";
    cap.textContent = t.caption;
    const label = document.createElement("span");
    label.textContent = t.action;
    action.append(label, cap);
  }
  action.style.display = editing ? "none" : "inline-flex";
  const panel = root?.querySelector<HTMLElement>(".vedit-panel");
  const right = Math.min(window.innerWidth, panel ? panel.getBoundingClientRect().left : window.innerWidth);
  const w = action.offsetWidth || 120;
  // Above the element when there's room (so it never covers the text),
  // else tucked inside its top edge.
  const above = r.top - barH >= 38;
  const left = Math.max(0, Math.min(Math.max(0, -r.left), r.width - w)) + (above ? 0 : 8);
  const maxLeft = Math.max(0, Math.min(r.right, right) - r.left - w);
  action.style.left = `${Math.min(left, maxLeft)}px`;
  action.style.top = above ? "-34px" : `${Math.min(Math.max(8, barH - r.top + 8), Math.max(8, r.height - 34))}px`;
}

function rebuildGutters(container: HTMLDivElement, count: number): void {
  container.replaceChildren();
  const total = count === 0 ? 1 : count + 1;
  for (let i = 0; i < total; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vedit-insert-gutter";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
    btn.title = "Add a block here";
    btn.setAttribute("aria-label", `Add a block at position ${i + 1}`);
    btn.dataset.idx = String(i);
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      requestInsertAt(Number(btn.dataset.idx));
    });
    container.appendChild(btn);
  }
}

const GUTTER = 28;

/** The part of the page the user can see: below the admin bar, left of the panel. */
interface Viewport {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function visibleArea(root: HTMLElement | null, barH: number): Viewport {
  const panel = root?.querySelector<HTMLElement>(".vedit-panel");
  const panelLeft = panel ? panel.getBoundingClientRect().left : window.innerWidth;
  return { top: barH, bottom: window.innerHeight, left: 0, right: Math.min(window.innerWidth, panelLeft) };
}

function paintGutters(container: HTMLDivElement | null, entries: BlockEntry[], visible: Set<number>, view: Viewport): void {
  if (!container) return;
  const buttons = container.children;
  if (entries.length === 0) {
    const b = buttons[0] as HTMLElement | undefined;
    if (b) {
      b.style.display = "grid";
      b.style.transform = `translate(${(view.left + view.right - GUTTER) / 2}px, ${view.top + 24}px)`;
    }
    return;
  }
  const rects = entries.map((e) => blockBoundingRect(e));
  for (let i = 0; i <= entries.length; i++) {
    const btn = buttons[i] as HTMLElement | undefined;
    if (!btn) continue;
    const before = i === 0 ? null : rects[i - 1];
    const after = i === entries.length ? null : rects[i];
    const pair = [before, after].filter((r): r is Rect => r != null);
    if (!visible.has(i) || pair.length === 0) {
      btn.style.display = "none";
      continue;
    }
    // Vertically: in the gap between the two blocks (or on the outer edge).
    const top =
      before && after
        ? (before.top + before.height + after.top) / 2 - GUTTER / 2
        : before
          ? before.top + before.height - GUTTER / 2
          : after!.top - GUTTER / 2;
    // Horizontally: centred on the part of the blocks that isn't under the panel.
    const left = Math.max(view.left, Math.min(...pair.map((r) => r.left)));
    const right = Math.min(view.right, Math.max(...pair.map((r) => r.left + r.width)));
    const onScreen = top >= view.top && top + GUTTER <= view.bottom && right - left >= GUTTER;
    if (!onScreen || !Number.isFinite(top) || !Number.isFinite(left + right)) {
      btn.style.display = "none";
      continue;
    }
    btn.style.display = "grid";
    btn.style.transform = `translate(${(left + right - GUTTER) / 2}px, ${top}px)`;
  }
}
