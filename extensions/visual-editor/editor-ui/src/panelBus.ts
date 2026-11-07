// Messages between the on-page hover overlay (EditorRoot) and the side
// panel, which live in different React subtrees.

export type TargetKind = "title" | "excerpt" | "featured_image" | "settings";

export type PanelMessage =
  /** A page element was clicked: open its field in the panel. */
  | { type: "activate"; kind: TargetKind; key?: string }
  /** Inline typing on the page: mirror it into the panel's field. */
  | { type: "text"; field: "title" | "excerpt"; value: string }
  /** A block was clicked on the page (even one that is already selected). */
  | { type: "block"; index: number };

const listeners = new Set<(m: PanelMessage) => void>();

export function emitPanel(m: PanelMessage): void {
  listeners.forEach((fn) => fn(m));
}

export function onPanelMessage(fn: (m: PanelMessage) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
