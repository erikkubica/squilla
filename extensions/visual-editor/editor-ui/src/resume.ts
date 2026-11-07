// Editor state that survives the editor's own page reloads (Discard),
// so the editor reopens on the same block instead of closing. Lives in
// sessionStorage for a short while and is consumed on read.

export interface ResumeState {
  /** Position of the block that was open, or null. */
  pos: number | null;
  /** Scroll offset of the panel's block list. */
  panelScroll: number;
  /** Short confirmation to show once the editor is back. */
  toast?: string;
}

const MAX_AGE_MS = 2 * 60 * 1000;
const key = (nodeId: number): string => `vedit-resume:${nodeId}`;

export function writeResume(nodeId: number, state: ResumeState): void {
  try {
    sessionStorage.setItem(key(nodeId), JSON.stringify({ ...state, at: Date.now() }));
  } catch {
    /* storage unavailable — the editor just opens closed */
  }
}

export function takeResume(nodeId: number): ResumeState | null {
  try {
    const raw = sessionStorage.getItem(key(nodeId));
    if (!raw) return null;
    sessionStorage.removeItem(key(nodeId));
    const s = JSON.parse(raw) as ResumeState & { at?: number };
    if (!s.at || Date.now() - s.at > MAX_AGE_MS) return null;
    return { pos: typeof s.pos === "number" ? s.pos : null, panelScroll: Number(s.panelScroll) || 0, toast: s.toast };
  } catch {
    return null;
  }
}
