import { Extension, Node, mergeAttributes } from "@tiptap/react";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

/**
 * Table + markup-preservation extensions for the visual-editor rich-text field.
 *
 * Content seeded by themes (e.g. cookie / privacy pages) carries
 * `<table class="…">` with thead/tbody and `<div class="…">` note boxes.
 * Without these extensions Tiptap flattens the table into paragraphs and
 * drops the classes, so a single save destroys the markup.
 */

/** Node types whose `class` attribute survives a parse → serialize cycle. */
const CLASS_TYPES = ["paragraph", "heading", "blockquote", "table", "tableRow", "tableHeader", "tableCell", "div"];

export const ClassAttribute = Extension.create({
  name: "classAttribute",
  addGlobalAttributes() {
    return [
      {
        types: CLASS_TYPES,
        attributes: {
          class: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute("class") || null,
            renderHTML: (attrs: Record<string, unknown>) => (attrs.class ? { class: attrs.class } : {}),
          },
        },
      },
    ];
  },
});

/**
 * Classed block `<div>` wrapper (e.g. `<div class="bv-note">`), keeps its
 * children as blocks. Unclassed divs (common in pasted HTML) are still
 * unwrapped as before.
 */
export const Div = Node.create({
  name: "div",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div[class]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * Table without Tiptap's serialized `<colgroup>` and inline min-width
 * style, so saved HTML stays as clean as what the theme authored.
 */
const CleanTable = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ["tbody", 0]];
  },
});

export const tableExtensions = [
  CleanTable.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  Div,
  ClassAttribute,
];

function isHeaderRow(row: Element): boolean {
  return row.tagName === "TR" && row.children.length > 0 && Array.from(row.children).every((c) => c.tagName === "TH");
}

/**
 * Post-process `editor.getHTML()` so tables keep their authored shape:
 * leading all-`<th>` rows go back into `<thead>`, default colspan/rowspan
 * and the single `<p>` Tiptap wraps around cell content are removed.
 * Re-parsing the result yields the same document, so it round-trips.
 */
export function normalizeEditorHTML(html: string): string {
  if (!html.includes("<table") || typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.body.querySelectorAll("table").forEach((table) => {
    const parts = Array.from(table.children);
    parts.filter((c) => c.tagName === "COLGROUP").forEach((c) => c.remove());

    const tbody = parts.find((c) => c.tagName === "TBODY");
    if (tbody && !parts.some((c) => c.tagName === "THEAD")) {
      const rows = Array.from(tbody.children);
      // Index of the first body row; -1 means header-only, which stays in tbody.
      const n = rows.findIndex((r) => !isHeaderRow(r));
      if (n > 0) {
        const thead = doc.createElement("thead");
        rows.slice(0, n).forEach((r) => thead.appendChild(r));
        table.insertBefore(thead, tbody);
      }
    }

    table.querySelectorAll("th, td").forEach((cell) => {
      if (cell.getAttribute("colspan") === "1") cell.removeAttribute("colspan");
      if (cell.getAttribute("rowspan") === "1") cell.removeAttribute("rowspan");
      const only = cell.firstElementChild;
      const hasLooseText = Array.from(cell.childNodes).some(
        (n) => n.nodeType === 3 && (n.textContent || "").trim() !== "",
      );
      if (cell.childElementCount === 1 && only?.tagName === "P" && only.attributes.length === 0 && !hasLooseText) {
        cell.replaceChildren(...Array.from(only.childNodes));
      }
    });
  });

  return doc.body.innerHTML;
}
