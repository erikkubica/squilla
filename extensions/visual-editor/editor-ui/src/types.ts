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
