// Shared types for the editor module. Kept tiny and dependency-free
// so any file (including the worker entry in main.tsx) can import them
// without pulling in React.

export interface BootstrapConfig {
  nodeId: number;
  nodeType: string;
  languageCode: string;
  fullURL: string;
}

export interface BlockEntry {
  /** Index into the node's blocks_data array. Stable across the editor session. */
  index: number;
  /** Block type slug (e.g. "hero"). Pulled from the start marker. */
  slug: string;
  /** Comment node that opens this block in the live DOM. */
  startNode: Comment;
  /** Comment node that closes this block in the live DOM. */
  endNode: Comment;
}

/** Single rectangle in viewport coordinates (CSS pixels). */
export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Kernel front-end admin bar API (internal/cms/admin_bar.go). Present as
 * `window.Squilla.adminBar` with `ready === true` once the bar has
 * rendered; absent (or a queue stub) when the bar is not shown.
 */
export interface AdminBarItem {
  id: string;
  label: string;
  href?: string;
  title?: string;
  active?: boolean;
  position?: "left" | "right";
  onClick?: (e: MouseEvent, handle: AdminBarHandle) => void;
}

export interface AdminBarHandle {
  id: string;
  element: HTMLElement;
  update(patch: Partial<AdminBarItem>): void;
  remove(): void;
}

export interface AdminBarAPI {
  ready: true;
  add(item: AdminBarItem): AdminBarHandle | null;
  update(id: string, patch: Partial<AdminBarItem>): AdminBarHandle | null;
  remove(id: string): void;
  get(id: string): AdminBarHandle | null;
}

/** The live admin bar, or null when the page has none. */
export function getAdminBar(): AdminBarAPI | null {
  const bar = (window as unknown as { Squilla?: { adminBar?: Partial<AdminBarAPI> } }).Squilla?.adminBar;
  return bar && bar.ready === true ? (bar as AdminBarAPI) : null;
}
