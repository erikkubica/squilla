import { emitPanel, type TargetKind } from "./panelBus";

// The bits of a page that aren't blocks: its title, excerpt, cover image
// and the site-wide header / footer. The kernel marks blocks with comments
// but has no markers for these, so they're found on the page itself:
//
//   1. an explicit hook in the theme wins:
//        data-sq-edit="title" | "excerpt" | "featured_image"
//        data-sq-settings="<theme settings page slug>"
//   2. otherwise by content: the heading whose text is the page title, the
//      <img> whose file is the featured image, the page's top-level
//      <header> / <footer>.
//
// Themes work without any changes; the attributes just make it exact.

export interface PageTarget {
  kind: TargetKind;
  /** For "settings": a settings page slug, or a keyword to match one. */
  key?: string;
  el: HTMLElement;
  /** What the hover chip says. */
  action: string;
  /** Short caption on the outline. */
  caption: string;
}

export interface TargetSeed {
  title: string;
  excerpt: string;
  imageUrl: string;
}

const found = new Map<string, PageTarget>();

const norm = (s: string): string => s.replace(/\s+/g, " ").trim();
const inEditor = (el: Element): boolean => !!el.closest("[data-vedit-host]");
const topLevel = (el: Element): boolean => !el.closest("main, article, [data-vedit-host]");

function fileKey(url: string): string {
  try {
    const p = new URL(url, window.location.href).pathname;
    return decodeURIComponent(p.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]\d{2,4}x\d{2,4}$/, "");
  } catch {
    return "";
  }
}

function findByText(selector: string, text: string): HTMLElement | null {
  const want = norm(text);
  if (!want) return null;
  const root = document.querySelector("main") ?? document.body;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(selector))) {
    if (inEditor(el) || el.children.length > 0 && el.querySelector("img,svg,button")) continue;
    if (norm(el.textContent ?? "") === want) return el;
  }
  return null;
}

/** Find the targets once, when the editor loads the page. Elements are
 *  remembered, so later edits to their text don't lose them. */
export function resolveTargets(seed: TargetSeed): void {
  found.clear();
  const add = (t: PageTarget): void => {
    found.set(t.kind + ":" + (t.key ?? ""), t);
  };

  // Explicit hooks.
  document.querySelectorAll<HTMLElement>("[data-sq-edit]").forEach((el) => {
    if (inEditor(el)) return;
    const k = el.getAttribute("data-sq-edit");
    if (k === "title") add({ kind: "title", el, action: "Edit title", caption: "Title" });
    else if (k === "excerpt") add({ kind: "excerpt", el, action: "Edit excerpt", caption: "Excerpt" });
    else if (k === "featured_image") add({ kind: "featured_image", el, action: "Replace image", caption: "Featured image" });
  });
  document.querySelectorAll<HTMLElement>("[data-sq-settings]").forEach((el) => {
    if (inEditor(el)) return;
    const key = el.getAttribute("data-sq-settings") ?? "";
    if (key) add({ kind: "settings", key, el, action: "Edit in Layout", caption: "Site-wide" });
  });

  // By content.
  if (!found.has("title:")) {
    const el = findByText("h1", seed.title) ?? findByText("h1, h2", seed.title);
    if (el) add({ kind: "title", el, action: "Edit title", caption: "Title" });
  }
  if (!found.has("excerpt:") && seed.excerpt) {
    const el = findByText("p, div, span", seed.excerpt);
    if (el) add({ kind: "excerpt", el, action: "Edit excerpt", caption: "Excerpt" });
  }
  if (!found.has("featured_image:") && seed.imageUrl) {
    const want = fileKey(seed.imageUrl);
    const root = document.querySelector("main") ?? document.body;
    const img = want
      ? Array.from(root.querySelectorAll<HTMLImageElement>("img")).find((i) => !inEditor(i) && fileKey(i.currentSrc || i.src) === want)
      : undefined;
    if (img) add({ kind: "featured_image", el: img, action: "Replace image", caption: "Featured image" });
  }

  const hasSettings = (key: string): boolean => found.has("settings:" + key);
  if (!hasSettings("header")) {
    const el = Array.from(document.querySelectorAll<HTMLElement>("header, [role=banner]")).find(topLevel);
    if (el) add({ kind: "settings", key: "header", el, action: "Edit header", caption: "Header · every page" });
  }
  if (!hasSettings("footer")) {
    const el = Array.from(document.querySelectorAll<HTMLElement>("footer, [role=contentinfo]")).filter(topLevel).pop();
    if (el) add({ kind: "settings", key: "footer", el, action: "Edit footer", caption: "Footer · every page" });
  }
  if (!hasSettings("announcement")) {
    const el = Array.from(document.querySelectorAll<HTMLElement>('[class*="announcement" i]')).find((e) => !inEditor(e) && topLevel(e));
    if (el) add({ kind: "settings", key: "announcement", el, action: "Edit announcement", caption: "Announcement · every page" });
  }
}

export function getTargets(): PageTarget[] {
  return Array.from(found.values()).filter((t) => t.el.isConnected);
}

export function targetFor(kind: TargetKind): PageTarget | undefined {
  return getTargets().find((t) => t.kind === kind);
}

/** The most specific target containing a node (a title inside a header
 *  wins over the header). */
export function targetAt(node: Node): PageTarget | null {
  let best: PageTarget | null = null;
  for (const t of getTargets()) {
    if (!t.el.contains(node)) continue;
    if (!best || best.el.contains(t.el)) best = t;
  }
  return best;
}

/** Show an edit from the panel on the page right away. */
export function applyLive(kind: "title" | "excerpt" | "featured_image", value: string): void {
  const t = targetFor(kind);
  if (!t) return;
  if (kind === "featured_image") {
    const img = t.el as HTMLImageElement;
    if (!value || img.tagName !== "IMG") return;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.parentElement?.querySelectorAll("source").forEach((s) => s.remove());
    img.src = value;
    return;
  }
  if (t.el.dataset.veditEditing === "1") return;
  if ((t.el.textContent ?? "") !== value) t.el.textContent = value;
}

let activeEdit: { el: HTMLElement; revert: () => void } | null = null;

/** Escape while typing in place: put the old text back and stop. Returns
 *  false when nothing is being edited. */
export function cancelInlineEdit(): boolean {
  if (!activeEdit) return false;
  activeEdit.revert();
  return true;
}

/** Type straight into the page element. Plain text only; Enter or
 *  clicking away finishes, Escape puts the old text back. */
export function startInlineEdit(t: PageTarget): void {
  const el = t.el;
  if (el.dataset.veditEditing === "1") return;
  const original = el.textContent ?? "";
  el.dataset.veditEditing = "1";
  el.contentEditable = "plaintext-only";
  if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
  el.style.outline = "none";
  el.style.cursor = "text";
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);

  const field = t.kind === "title" ? "title" : "excerpt";
  const done = (): void => {
    el.removeEventListener("input", onInput);
    el.removeEventListener("keydown", onKey);
    el.removeEventListener("blur", done);
    el.removeAttribute("contenteditable");
    el.style.outline = "";
    el.style.cursor = "";
    delete el.dataset.veditEditing;
    if (activeEdit?.el === el) activeEdit = null;
  };
  const revert = (): void => {
    el.textContent = original;
    emitPanel({ type: "text", field, value: original });
    el.blur();
  };
  activeEdit = { el, revert };
  const onInput = (): void => emitPanel({ type: "text", field, value: (el.textContent ?? "").replace(/\s+/g, " ") });
  const onKey = (e: KeyboardEvent): void => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      el.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      revert();
    }
  };
  el.addEventListener("input", onInput);
  el.addEventListener("keydown", onKey);
  el.addEventListener("blur", done);
}
