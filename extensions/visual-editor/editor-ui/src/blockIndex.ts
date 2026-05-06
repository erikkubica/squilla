import type { BlockEntry, Rect } from "./types";

// Marker format mirrors internal/cms/public_handler_editor_markers.go:
//   <!--squilla:block:start:0:hero-->
//   <!--squilla:block:end:0-->
// The slug in the start marker may have HTML-escaped characters (the
// kernel runs template.HTMLEscapeString on it). We tolerate that by
// using a permissive regex; downstream readers don't care about exact
// slug fidelity since the source of truth for block.type lives in
// blocks_data on the server.

const START_RE = /^squilla:block:start:(\d+):(.*)$/;
const END_RE = /^squilla:block:end:(\d+)$/;

/**
 * Walk the document for editor markers and return a sorted list of
 * BlockEntry handles. Handles are computed once per "enter edit mode"
 * — if the page mutates its own DOM (e.g. theme JS hydrating after
 * load), the indexer can be re-run.
 */
export function indexBlockMarkers(root: Node = document.body): BlockEntry[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  const stack: { idx: number; slug: string; node: Comment }[] = [];
  const entries: BlockEntry[] = [];

  // Walk in document order. For non-nested kernel emission this is
  // equivalent to sorting by index, but it also handles editor-
  // synthesized markers (synthetic indexes >= 100000) which would
  // otherwise be sorted to the end of the array, breaking positional
  // alignment with the local blocks state.
  let n: Node | null = walker.nextNode();
  while (n) {
    const text = (n as Comment).data ?? "";
    const startMatch = text.match(START_RE);
    if (startMatch) {
      stack.push({ idx: Number(startMatch[1]), slug: startMatch[2] ?? "", node: n as Comment });
    } else {
      const endMatch = text.match(END_RE);
      if (endMatch) {
        const idx = Number(endMatch[1]);
        // Kernel emits flat (non-nested) pairs, so the matching start
        // is almost always at the top of the stack. We search the
        // stack to be tolerant of nesting if it ever happens.
        const sIdx = stack.findIndex((s) => s.idx === idx);
        if (sIdx >= 0) {
          const start = stack[sIdx]!;
          stack.splice(sIdx, 1);
          entries.push({ index: idx, slug: start.slug, startNode: start.node, endNode: n as Comment });
        }
      }
    }
    n = walker.nextNode();
  }
  return entries;
}

// Synthetic-index counter for blocks the editor inserts client-side.
// Kept well above any plausible kernel-emitted index so the two name-
// spaces never collide. Reset to baseline by reload when the kernel
// re-emits with fresh 0..N-1 numbering.
let syntheticCounter = 100000;

export function nextSyntheticIndex(): number {
  syntheticCounter += 1;
  return syntheticCounter;
}

/**
 * Create a fresh marker pair for a new block. Uses the same comment
 * format the kernel emits so indexBlockMarkers picks them up unchanged.
 */
export function createSyntheticMarkers(syntheticIdx: number, slug: string): { start: Comment; end: Comment } {
  return {
    start: document.createComment(`squilla:block:start:${syntheticIdx}:${slug}`),
    end: document.createComment(`squilla:block:end:${syntheticIdx}`),
  };
}

/**
 * Insert a new block (markers + rendered HTML) into the live DOM at the
 * given position relative to the existing entries. Parent is inferred
 * from the neighbouring entry's start/end node.
 */
export function insertBlockMarkers(
  entries: readonly BlockEntry[],
  position: number,
  start: Comment,
  end: Comment,
  html: string,
): void {
  const tmpl = document.createElement("template");
  tmpl.innerHTML = html;

  if (position < entries.length) {
    // Insert just before the entry currently at this position.
    const target = entries[position]!;
    const parent = target.startNode.parentNode;
    if (!parent) return;
    parent.insertBefore(start, target.startNode);
    parent.insertBefore(tmpl.content, target.startNode);
    parent.insertBefore(end, target.startNode);
    return;
  }

  if (entries.length > 0) {
    // Append after the last existing block's end marker.
    const last = entries[entries.length - 1]!;
    const parent = last.endNode.parentNode;
    if (!parent) return;
    const after = last.endNode.nextSibling;
    if (after) {
      parent.insertBefore(start, after);
      parent.insertBefore(tmpl.content, after);
      parent.insertBefore(end, after);
    } else {
      parent.appendChild(start);
      parent.appendChild(tmpl.content);
      parent.appendChild(end);
    }
    return;
  }

  // No existing blocks. Best-effort: append to body. The page is
  // unusual in this case (an editable node with zero blocks) and the
  // result will look wherever the theme places body-level content.
  document.body.appendChild(start);
  document.body.appendChild(tmpl.content);
  document.body.appendChild(end);
}

/**
 * Remove a block's start marker, end marker, and everything between
 * from the live DOM.
 */
export function removeBlockMarkers(entry: BlockEntry): void {
  let n: Node | null = entry.startNode;
  while (n) {
    const next: Node | null = n.nextSibling;
    n.parentNode?.removeChild(n);
    if (n === entry.endNode) break;
    n = next;
  }
}

/**
 * Compute a single bounding rect that covers every Element node
 * between the start and end comments of a block. Used to draw an
 * outline in the overlay.
 *
 * Comments themselves have no geometry, so we walk forward from the
 * start marker until we hit the end marker, collecting Element rects
 * along the way and unioning them.
 */
export function blockBoundingRect(entry: BlockEntry): Rect | null {
  const rects: DOMRect[] = [];
  let n: Node | null = entry.startNode.nextSibling;

  // The marker pair sits at sibling-level by construction (the kernel
  // appends them around each rendered block string), so a flat next-
  // sibling walk reaches the end marker. If a future renderer wraps
  // the marker pair inside a nested element, we'd need a tree walk
  // here — but that would break the simpler unwrap logic in
  // serializeBlocks too, so we'd see it loudly.
  while (n && n !== entry.endNode) {
    if (n.nodeType === Node.ELEMENT_NODE) {
      const r = (n as Element).getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        rects.push(r);
      }
    }
    n = n.nextSibling;
  }

  if (rects.length === 0) return null;

  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    if (r.top < top) top = r.top;
    if (r.left < left) left = r.left;
    if (r.right > right) right = r.right;
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return { top, left, width: right - left, height: bottom - top };
}

/**
 * Locate the BlockEntry whose comment range contains the given target
 * node. Used for hover/click → block resolution. Returns null when the
 * target is in chrome (theme nav, footer) or any region the renderer
 * didn't wrap in markers.
 */
export function findBlockForNode(target: Node, entries: readonly BlockEntry[]): BlockEntry | null {
  for (const entry of entries) {
    if (isBetweenSiblings(target, entry.startNode, entry.endNode)) {
      return entry;
    }
  }
  return null;
}

/**
 * Extract the inclusive range of nodes from start..end as a
 * DocumentFragment. The fragment can then be inserted before another
 * marker pair to optimistically reorder a block on the live page —
 * lets the admin see the new order immediately instead of waiting
 * for Save → reload.
 *
 * Caveats: theme CSS that depends on tree position (`:nth-child`,
 * sibling combinators) may render incorrectly until the page reloads.
 * That's a documented v1 trade-off; the alternative (no visual
 * feedback on drag) is worse.
 */
export function extractBlockRange(entry: BlockEntry): DocumentFragment {
  const frag = document.createDocumentFragment();
  let n: Node | null = entry.startNode;
  while (n) {
    const next: Node | null = n.nextSibling;
    frag.appendChild(n); // appendChild moves the node out of its parent
    if (n === entry.endNode) break;
    n = next;
  }
  return frag;
}

/**
 * Move the block at `from` so it lands at the position currently
 * occupied by the block at `to` (matching Array#splice semantics
 * after the removal). Operates directly on the live DOM. Marker
 * indexes embedded in the comments are NOT rewritten — the editor
 * tracks block identity by reference (start/end comment nodes), so
 * moving them around doesn't break selection.
 */
export function reorderBlocksInDOM(
  entries: readonly BlockEntry[],
  from: number,
  to: number,
): void {
  if (from === to) return;
  const src = entries[from];
  if (!src) return;

  // Capture parent BEFORE extracting the range — once the start
  // marker is appended to a DocumentFragment, its parentNode points
  // at the fragment, not the original container. Reading it after
  // the move would route the insertion back into the fragment and
  // the block would silently disappear from the page.
  const parent = src.startNode.parentNode;
  if (!parent) return;

  // Determine the insertion anchor BEFORE detaching anything: the
  // start marker of the block currently at the destination index in
  // the post-removal sequence.
  const remaining = entries.filter((_, i) => i !== from);
  const target = remaining[to] ?? null;

  const fragment = extractBlockRange(src);

  if (target && target.startNode.parentNode === parent) {
    parent.insertBefore(fragment, target.startNode);
  } else {
    // Moved past the last block: append at the end of the original
    // container (NOT the fragment — see capture-before-extract note
    // above).
    parent.appendChild(fragment);
  }
}

/**
 * Replace the rendered HTML between a block's start and end markers
 * with new HTML, preserving the markers themselves so the editor's
 * block index stays valid. Used by the live-preview pipeline: when
 * the admin types in a field, the new HTML from /preview lands here
 * and the page updates without a reload.
 */
export function replaceBlockRange(entry: BlockEntry, html: string): void {
  // Remove every node strictly between the markers.
  let n: Node | null = entry.startNode.nextSibling;
  while (n && n !== entry.endNode) {
    const next: Node | null = n.nextSibling;
    n.parentNode?.removeChild(n);
    n = next;
  }
  // Insert the new HTML by parsing it through a template element —
  // template parses HTML without executing scripts and yields a
  // DocumentFragment we can splice in front of the end marker.
  const tmpl = document.createElement("template");
  tmpl.innerHTML = html;
  entry.endNode.parentNode?.insertBefore(tmpl.content, entry.endNode);
}

function isBetweenSiblings(target: Node, start: Comment, end: Comment): boolean {
  // The marker pair sits at sibling-level. Walk up from `target` until
  // we hit a node whose parent matches the marker's parent, then check
  // sibling order. This handles deeply nested children of a block.
  let cur: Node | null = target;
  while (cur && cur.parentNode !== start.parentNode) {
    cur = cur.parentNode;
  }
  if (!cur) return false;

  // DOCUMENT_POSITION_FOLLOWING means b follows a in tree order.
  const afterStart = !!(start.compareDocumentPosition(cur) & Node.DOCUMENT_POSITION_FOLLOWING);
  const beforeEnd = !!(end.compareDocumentPosition(cur) & Node.DOCUMENT_POSITION_PRECEDING);
  return afterStart && beforeEnd;
}
