import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { blockBoundingRect, findBlockForNode, indexBlockMarkers } from "./blockIndex";
import { requestInsertAt } from "./insertBus";
import { SidePanel } from "./SidePanel";
import type { BlockEntry, BootstrapConfig } from "./types";

interface EditorRootProps {
  config: BootstrapConfig;
}

export function EditorRoot({ config }: EditorRootProps): React.JSX.Element {
  const [active, setActive] = useState(false);
  const [entries, setEntries] = useState<BlockEntry[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Refs to the outline divs so we can move them via rAF without going
  // through React state. setTick-on-scroll caused visible lag because
  // each frame had to round-trip through React render.
  const hoverRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const guttersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) {
      setEntries([]);
      setHoverIndex(null);
      setSelectedIndex(null);
      return;
    }
    setEntries(indexBlockMarkers(document.body));
  }, [active]);

  // Imperative outline + insert-gutter positioning loop. While active,
  // each animation frame reads getBoundingClientRect for the hovered
  // and selected entries and writes the outline divs' transform/size
  // directly. No React render in this hot path → outline snaps to the
  // page during scroll instead of trailing it.
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let lastSig = "";
    const tick = () => {
      const hover = hoverIndex == null ? null : entries.find((e) => e.index === hoverIndex) ?? null;
      const selected =
        selectedIndex == null ? null : entries.find((e) => e.index === selectedIndex) ?? null;
      const hoverRect = hover ? blockBoundingRect(hover) : null;
      const selectedRect = selected ? blockBoundingRect(selected) : null;

      paintOutline(hoverRef.current, hoverRect, hover && hoverIndex !== selectedIndex ? hover.slug : null);
      paintOutline(selectedRef.current, selectedRect, selected ? selected.slug : null);

      // Insert gutters: cheap to recompute every frame against current rects.
      // We rebuild the children only when the count changes; otherwise we
      // just update positions to avoid touching the DOM tree.
      const sig = `${entries.length}`;
      if (sig !== lastSig && guttersRef.current) {
        rebuildGutters(guttersRef.current, entries.length);
        lastSig = sig;
      }
      paintGutters(guttersRef.current, entries);

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, entries, hoverIndex, selectedIndex]);

  useEffect(() => {
    if (!active) return;
    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if ((e.target as Element)?.closest?.("[data-vedit-host]")) return;
      const block = findBlockForNode(target, entries);
      setHoverIndex(block ? block.index : null);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if ((e.target as Element)?.closest?.("[data-vedit-host]")) return;
      const block = findBlockForNode(target, entries);
      if (block) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(block.index);
      }
    };
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, entries]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Stable callbacks for the side panel — using refs so the panel's
  // useEffect deps don't churn each render and bust debounced timers.
  const reindex = useMemo(
    () => () => setEntries(indexBlockMarkers(document.body)),
    [],
  );

  return (
    <>
      {!active && (
        <button
          type="button"
          className="vedit-toggle"
          data-active={false}
          onClick={() => setActive(true)}
          aria-pressed={false}
        >
          Edit page
        </button>
      )}

      {active && (
        <>
          <div className="vedit-overlay" aria-hidden="true">
            <div ref={hoverRef} className="vedit-outline" data-kind="hover" style={{ display: "none" }}>
              <span className="vedit-label" />
            </div>
            <div ref={selectedRef} className="vedit-outline" data-kind="selected" style={{ display: "none" }}>
              <span className="vedit-label" />
            </div>
            <div ref={guttersRef} className="vedit-gutters" />
          </div>

          <SidePanel
            config={config}
            domEntries={entries}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onClose={() => setActive(false)}
            onReindex={reindex}
            onSaved={() => window.location.reload()}
          />
        </>
      )}
    </>
  );
}

function paintOutline(node: HTMLDivElement | null, rect: ReturnType<typeof blockBoundingRect>, label: string | null): void {
  if (!node) return;
  if (!rect || !label) {
    node.style.display = "none";
    return;
  }
  node.style.display = "block";
  node.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
  node.style.width = `${rect.width}px`;
  node.style.height = `${rect.height}px`;
  const labelEl = node.firstElementChild as HTMLElement | null;
  if (labelEl && labelEl.textContent !== label) labelEl.textContent = label;
}

function rebuildGutters(container: HTMLDivElement, count: number): void {
  container.replaceChildren();
  const total = count === 0 ? 1 : count + 1;
  for (let i = 0; i < total; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vedit-insert-gutter";
    btn.textContent = "+";
    btn.setAttribute("aria-label", `Insert block at position ${i}`);
    btn.dataset.idx = String(i);
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      requestInsertAt(Number(btn.dataset.idx));
    });
    container.appendChild(btn);
  }
}

function paintGutters(container: HTMLDivElement | null, entries: BlockEntry[]): void {
  if (!container) return;
  const buttons = container.children;
  if (entries.length === 0) {
    const b = buttons[0] as HTMLElement | undefined;
    if (b) {
      b.style.display = "block";
      b.style.transform = `translate(calc(50% - 14px), 16px)`;
    }
    return;
  }
  const rects = entries.map((e) => blockBoundingRect(e));
  for (let i = 0; i <= entries.length; i++) {
    const btn = buttons[i] as HTMLElement | undefined;
    if (!btn) continue;
    const before = i === 0 ? null : rects[i - 1];
    const after = i === entries.length ? null : rects[i];
    let top: number;
    let left: number;
    if (before && after) {
      top = (before.top + before.height + after.top) / 2 - 14;
      left = (before.left + before.width / 2 + after.left + after.width / 2) / 2;
    } else if (before) {
      top = before.top + before.height + 4;
      left = before.left + before.width / 2;
    } else if (after) {
      top = after.top - 28;
      left = after.left + after.width / 2;
    } else {
      btn.style.display = "none";
      continue;
    }
    if (!Number.isFinite(top) || !Number.isFinite(left)) {
      btn.style.display = "none";
      continue;
    }
    btn.style.display = "block";
    btn.style.transform = `translate(${left - 14}px, ${top}px)`;
  }
}
