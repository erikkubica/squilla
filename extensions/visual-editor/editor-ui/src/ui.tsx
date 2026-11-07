import * as React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Shared chrome for the editor: Lucide-style glyphs (inlined so the
// bundle carries no icon font), the modal shell, a switch, and the
// Escape-key stack that lets modals close before the panel does.

const GLYPHS: Record<string, React.ReactNode> = {
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "arrow-up": (
    <>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </>
  ),
  "arrow-down": (
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </>
  ),
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  image: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </>
  ),
  file: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  square: <rect width="16" height="16" x="4" y="4" rx="2" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </>
  ),
  shapes: (
    <>
      <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </>
  ),
  "collapse-all": (
    <>
      <path d="m7 20 5-5 5 5" />
      <path d="m7 4 5 5 5-5" />
    </>
  ),
  "expand-all": (
    <>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </>
  ),
  blocks: (
    <>
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" />
    </>
  ),
  tag: (
    <>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
};

export type GlyphName = keyof typeof GLYPHS;

export function Glyph({
  name,
  size = 16,
  strokeWidth = 1.9,
  className,
  style,
}: {
  name: GlyphName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      {GLYPHS[name]}
    </svg>
  );
}

/** Inline SVG markup produced by the kernel from its embedded icon sets
 *  (GET /admin/api/icons). Never user input, so it is safe to inject. */
export function KernelSvg({ svg, className }: { svg: string; className?: string }): React.JSX.Element {
  return <span className={className ? `vedit-svg ${className}` : "vedit-svg"} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

// --- Escape stack ------------------------------------------------------------
//
// One capturing keydown listener on window. The newest entry handles
// Escape; "exclusive" entries (modals) also stop the event so the page
// and the panel underneath never see it.

type EscHandler = (e: KeyboardEvent) => void;
interface EscEntry {
  fn: EscHandler;
  exclusive: boolean;
}
const escStack: EscEntry[] = [];
let escBound = false;

function onEscapeKey(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  const top = escStack[escStack.length - 1];
  if (!top) return;
  if (top.exclusive) {
    e.preventDefault();
    e.stopPropagation();
  }
  top.fn(e);
}

export function pushEscape(fn: EscHandler, exclusive: boolean): () => void {
  const entry: EscEntry = { fn, exclusive };
  escStack.push(entry);
  if (!escBound) {
    window.addEventListener("keydown", onEscapeKey, true);
    escBound = true;
  }
  return () => {
    const i = escStack.indexOf(entry);
    if (i >= 0) escStack.splice(i, 1);
  };
}

/** True while any editor modal is open. */
export function modalOpen(): boolean {
  return escStack.some((e) => e.exclusive);
}

// --- Modal ---------------------------------------------------------------------

/** Where dialogs render: a layer at the top of the editor's shadow tree.
 *  Rendering them in place would trap them inside their card, because
 *  cards are size containers (container queries), and a size container
 *  is the containing block for position: fixed. */
let modalLayer: HTMLElement | null = null;
export function setModalLayer(el: HTMLElement): void {
  modalLayer = el;
}

export function Modal({
  title,
  subtitle,
  size = "md",
  onClose,
  footer,
  className,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  onClose: () => void;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => pushEscape(() => closeRef.current(), true), []);

  const dialog = (
    <div
      className="vedit-modal-backdrop"
      onMouseDown={(e) => {
        // Only a press that starts on the backdrop closes — a text
        // selection dragged out of the dialog must not.
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div className={className ? `vedit-modal ${className}` : "vedit-modal"} data-size={size} role="dialog" aria-modal="true" aria-label={title}>
        <header className="vedit-modal-header">
          <div className="vedit-modal-heading">
            <h2 className="vedit-modal-title">{title}</h2>
            {subtitle && <p className="vedit-modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="vedit-icon-btn" onClick={() => closeRef.current()} aria-label="Close" title="Close (Esc)">
            <Glyph name="x" size={17} />
          </button>
        </header>
        <div className="vedit-modal-body">{children}</div>
        {footer && <footer className="vedit-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
  return modalLayer ? createPortal(dialog, modalLayer) : dialog;
}

/** Search box with a leading magnifier, used at the top of pickers. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}): React.JSX.Element {
  return (
    <div className="vedit-search">
      <Glyph name="search" size={15} className="vedit-search-icon" />
      <input
        type="search"
        className="vedit-input"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
    </div>
  );
}

// --- Switch --------------------------------------------------------------------

export function Switch({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  label?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      className="vedit-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="vedit-switch-thumb" />
    </button>
  );
}

/** Strip tags and collapse whitespace — for one-line summaries. */
export function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** "bv-hero_banner" → "Bv hero banner" */
export function humanize(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
