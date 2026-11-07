// Whole-page preview of unsaved edits (custom fields, site layout settings).
//
// The kernel renders the page with the editor's unsaved state laid over it
// (POST /admin/api/nodes/:id/preview; nothing is written). We then patch the
// live page with what changed, rather than swapping it wholesale, so scroll
// position, theme widgets, the block outlines and whatever is being typed in
// all survive.
//
// "What changed" is a three-way comparison: the previous preview, the new
// preview, and the live page. Only differences between the two previews are
// applied, so state a theme's own JavaScript added to the live page (an open
// menu, a "scrolled" class, a hydrated slider) is left alone.

export interface PreviewBody {
  title?: string;
  excerpt?: string;
  featured_image?: unknown;
  fields_data?: Record<string, unknown>;
  blocks_data?: unknown;
  /** Unsaved theme settings: page slug → field name → value. */
  theme_settings?: Record<string, Record<string, unknown>>;
}

async function fetchHTML(nodeId: number, body?: PreviewBody): Promise<string> {
  const res = await fetch(`/admin/api/nodes/${nodeId}/preview`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json", Accept: "text/html" } : { Accept: "text/html" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const msg = new DOMParser().parseFromString(text, "text/html").body.textContent?.trim().slice(0, 160);
    throw new Error(msg || `${res.status} ${res.statusText}`);
  }
  return text;
}

const parse = (html: string): Document => new DOMParser().parseFromString(html, "text/html");

/** The last preview applied to the page; the baseline for the next one. */
let previous: Document | null = null;

/** Render the page with `body` applied and update the live page to match.
 *  The first call also renders the saved page once, as the baseline. */
export async function previewInPlace(nodeId: number, body: PreviewBody): Promise<void> {
  const [baseHTML, nextHTML] = await Promise.all([previous ? Promise.resolve("") : fetchHTML(nodeId), fetchHTML(nodeId, body)]);
  const next = parse(nextHTML);
  const base = previous ?? parse(baseHTML);
  patchChildren(document.body, base.body, next.body);
  if (base.title !== next.title) document.title = next.title;
  previous = next;
}

// --- Patching ---------------------------------------------------------------

/** Nodes that belong to the editor, the kernel's admin bar or the theme's
 *  scripts, not to the page content. */
function isForeign(el: Element): boolean {
  return el.hasAttribute("data-vedit-host") || ["SQUILLA-ADMIN-BAR", "SCRIPT", "NOSCRIPT", "TEMPLATE", "STYLE", "LINK"].includes(el.tagName);
}
const content = (el: Element): Element[] => Array.from(el.children).filter((c) => !isForeign(c));
const ignoredAttr = (name: string): boolean => name === "contenteditable" || name.startsWith("data-vedit");
const hasDirectText = (el: Element): boolean => Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "");

function patchChildren(live: Element, prev: Element, next: Element): void {
  const L = content(live);
  const P = content(prev);
  const N = content(next);
  let lastLive: Element | null = null;
  for (let i = 0; i < Math.max(P.length, N.length); i++) {
    const l = L[i];
    const p = P[i];
    const n = N[i];
    if (!n) {
      // Gone from the page. Only remove what is verifiably the same element.
      if (p && l && l.tagName === p.tagName) l.remove();
      continue;
    }
    if (!p) {
      const added = document.importNode(n, true) as Element;
      if (lastLive) lastLive.after(added);
      else live.prepend(added);
      lastLive = added;
      continue;
    }
    if (p.isEqualNode(n)) {
      lastLive = l ?? lastLive;
      continue;
    }
    // The live page no longer lines up with the preview here (a script
    // rearranged it): leave it rather than edit the wrong element.
    if (!l || l.tagName !== p.tagName) continue;
    if (p.tagName !== n.tagName) {
      const swapped = document.importNode(n, true) as Element;
      l.replaceWith(swapped);
      lastLive = swapped;
      continue;
    }
    patchElement(l, p, n);
    lastLive = l;
  }
}

function patchElement(live: Element, prev: Element, next: Element): void {
  for (const a of Array.from(next.attributes)) {
    if (ignoredAttr(a.name) || prev.getAttribute(a.name) === a.value) continue;
    if (a.name === "class") patchClasses(live, prev, next);
    else live.setAttribute(a.name, a.value);
  }
  for (const a of Array.from(prev.attributes)) {
    if (ignoredAttr(a.name) || next.hasAttribute(a.name)) continue;
    live.removeAttribute(a.name);
  }
  // Leaf elements, and text mixed with inline markup, are replaced whole.
  const leaf = (prev.children.length === 0 && next.children.length === 0) || hasDirectText(prev) || hasDirectText(next);
  if (leaf) {
    if (prev.innerHTML !== next.innerHTML && (live as HTMLElement).dataset?.veditEditing !== "1") live.innerHTML = next.innerHTML;
    return;
  }
  patchChildren(live, prev, next);
}

/** Apply only the class changes between two previews, keeping classes a
 *  theme script added to the live element. */
function patchClasses(live: Element, prev: Element, next: Element): void {
  const was = new Set(prev.classList);
  const now = new Set(next.classList);
  was.forEach((c) => {
    if (!now.has(c)) live.classList.remove(c);
  });
  now.forEach((c) => {
    if (!was.has(c)) live.classList.add(c);
  });
}
