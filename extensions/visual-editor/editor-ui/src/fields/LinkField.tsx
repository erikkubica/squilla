import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { nodeThumb, searchNodes, type NodeSummary } from "../api";
import { Glyph, humanize, Modal, Switch, type GlyphName } from "../ui";
import { TypeIcon, typeMeta, useNodeTypes, type TypeMeta } from "./nodeTypes";
import { interpretURL, linkInfo, type LinkKind } from "./linkKind";
import { Thumb } from "./RefPicker";

// Link field: a compact card showing where the link goes ("Page · About
// us", "Website · google.com") with edit / open / remove, and an editor
// dialog with one box that searches the site's pages or takes a URL,
// email address, phone number or #section. Stored shape is unchanged:
// {text, url, alt, target: "_blank" | ""}.

interface LinkValue {
  text: string;
  url: string;
  alt: string;
  target: string;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function readLink(value: unknown): LinkValue {
  const r = asRecord(value);
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");
  return {
    text: str("text") || str("label"),
    url: str("url"),
    alt: str("alt"),
    target: str("target"),
  };
}

const KIND_GLYPH: Record<LinkKind, GlyphName> = {
  empty: "link",
  page: "file",
  anchor: "hash",
  email: "mail",
  phone: "phone",
  chat: "message",
  map: "map-pin",
  external: "globe",
};

// --- Page titles for internal links ---------------------------------------------
const pageCache = new Map<string, Promise<NodeSummary | null>>();

function normPath(p: string): string {
  const path = p.split(/[?#]/)[0] ?? "";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** The page a site path belongs to, if any. Searches by the last path
 *  segment and keeps the exact full_url match. */
function findPage(path: string): Promise<NodeSummary | null> {
  const key = normPath(path);
  let hit = pageCache.get(key);
  if (!hit) {
    const segment = key.split("/").filter(Boolean).pop() ?? "";
    hit = searchNodes({ search: segment || undefined, limit: 50 })
      .then((list) => list.find((n) => n.full_url && normPath(n.full_url) === key) ?? null)
      .catch(() => null);
    pageCache.set(key, hit);
  }
  return hit;
}

function usePage(url: string, kind: LinkKind): NodeSummary | null {
  const [page, setPage] = useState<NodeSummary | null>(null);
  const path = kind === "page" ? linkInfo(url).detail : "";
  useEffect(() => {
    if (!path) {
      setPage(null);
      return;
    }
    let live = true;
    void findPage(path).then((p) => live && setPage(p));
    return () => {
      live = false;
    };
  }, [path]);
  return page;
}

// --- Field ---------------------------------------------------------------------------
export function LinkField({
  value,
  onChange,
  id,
  label,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
  id: string;
  label?: string;
}): React.JSX.Element {
  const link = readLink(value);
  const [editing, setEditing] = useState(false);
  const info = linkInfo(link.url);
  const page = usePage(link.url, info.kind);
  const isSet = link.url !== "" || link.text !== "";

  const save = (next: LinkValue): void => {
    const prev = asRecord(value);
    // Keep any extra keys a theme stores, and `label` in step with text.
    onChange({
      ...prev,
      ...next,
      ...(prev.label !== undefined ? { label: next.text } : {}),
    });
  };

  if (!isSet) {
    return (
      <>
        <button type="button" id={id} className="vedit-add-button vedit-link-add" data-size="sm" onClick={() => setEditing(true)}>
          <Glyph name="link" size={15} />
          Add link
        </button>
        {editing && <LinkDialog initial={link} title={label} onSave={(v) => (save(v), setEditing(false))} onCancel={() => setEditing(false)} />}
      </>
    );
  }

  const title = link.text || page?.title || info.detail || "Untitled link";
  return (
    <>
      <div className="vedit-link-card" data-kind={info.kind}>
        <button type="button" id={id} className="vedit-link-main" onClick={() => setEditing(true)} title="Edit link">
          <span className="vedit-link-icon" aria-hidden="true">
            <Glyph name={KIND_GLYPH[info.kind]} size={16} />
          </span>
          <span className="vedit-link-text">
            <span className="vedit-link-title" data-placeholder={!link.text || undefined}>
              {title}
            </span>
            <span className="vedit-link-meta">
              {info.kind === "empty" ? (
                <span className="vedit-link-warn">
                  <Glyph name="alert" size={13} /> No URL — the button won't go anywhere
                </span>
              ) : (
                <>
                  <span className="vedit-link-kind">{page ? humanize(page.node_type) : info.label}</span>
                  <span className="vedit-link-url">{page && link.text ? page.title : info.detail}</span>
                </>
              )}
              {link.target === "_blank" && (
                <span className="vedit-link-badge">
                  <Glyph name="external" size={11} strokeWidth={2.2} /> New tab
                </span>
              )}
            </span>
          </span>
        </button>
        <span className="vedit-link-actions">
          <button type="button" className="vedit-icon-btn" onClick={() => setEditing(true)} title="Edit link" aria-label="Edit link">
            <Glyph name="pencil" size={15} />
          </button>
          {info.kind !== "empty" && (
            <a
              className="vedit-icon-btn"
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              title="Open link in a new tab"
              aria-label="Open link in a new tab"
            >
              <Glyph name="external" size={15} />
            </a>
          )}
          <button
            type="button"
            className="vedit-icon-btn"
            data-tone="danger"
            onClick={() => save({ text: "", url: "", alt: "", target: "" })}
            title="Remove link"
            aria-label="Remove link"
          >
            <Glyph name="x" size={15} />
          </button>
        </span>
      </div>
      {editing && (
        <LinkDialog
          initial={link}
          title={label}
          onSave={(v) => (save(v), setEditing(false))}
          onRemove={() => (save({ text: "", url: "", alt: "", target: "" }), setEditing(false))}
          onCancel={() => setEditing(false)}
        />
      )}
    </>
  );
}

// --- Dialog -------------------------------------------------------------------------
interface Section {
  url: string;
  title: string;
}

/** Elements with an id on the page being edited, as #section targets. */
function pageSections(): Section[] {
  const out: Section[] = [];
  const seen = new Set<string>();
  document.querySelectorAll<HTMLElement>("body [id]").forEach((el) => {
    if (out.length >= 40 || el.closest("[data-vedit-host]") || seen.has(el.id)) return;
    if (!/^(SECTION|ARTICLE|HEADER|FOOTER|DIV|H[1-6]|ASIDE|FORM|UL|OL)$/.test(el.tagName)) return;
    if (/^(__|squilla|vedit)/i.test(el.id) || /^(root|app|main|main-content|content|page|wrapper)$/i.test(el.id)) return;
    // Page wrappers hold the real sections; list those instead.
    if (el.querySelector("section[id], article[id]") || el.getBoundingClientRect().height < 24) return;
    const heading = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector("h1, h2, h3, h4");
    const text = (heading?.textContent ?? "").replace(/\s+/g, " ").trim();
    seen.add(el.id);
    out.push({ url: `#${el.id}`, title: text ? text.slice(0, 80) : `#${el.id}` });
  });
  return out;
}

/** 0 = exact title, 1 = title starts with, 2 = a word starts with, 3 = anything else. */
function rank(title: string, slug: string, q: string): number {
  const t = title.toLowerCase();
  if (!q) return 3;
  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  if (t.split(/[\s\-–—:,&/]+/).some((w) => w.startsWith(q)) || slug.startsWith(q)) return 2;
  return 3;
}

/** One pickable row. */
interface Option {
  key: string;
  url: string;
  title: string;
  detail: string;
  /** For the icon: a link kind, or a content type slug for pages. */
  kind: LinkKind;
  nodeType?: string;
  thumb?: string;
  status?: string;
}

interface Group {
  key: string;
  label: string;
  items: Option[];
}

interface Target {
  url: string;
  title: string;
  nodeType?: string;
  thumb?: string;
}

function LinkDialog({
  initial,
  title,
  onSave,
  onRemove,
  onCancel,
}: {
  initial: LinkValue;
  title?: string;
  onSave: (v: LinkValue) => void;
  onRemove?: () => void;
  onCancel: () => void;
}): React.JSX.Element {
  const types = useNodeTypes();
  const [target, setTarget] = useState<Target | null>(initial.url ? { url: initial.url, title: "" } : null);
  const [query, setQuery] = useState("");
  const [text, setText] = useState(initial.text);
  const [alt, setAlt] = useState(initial.alt);
  const [newTab, setNewTab] = useState(initial.target === "_blank");
  const [showMore, setShowMore] = useState(initial.alt !== "");
  const [results, setResults] = useState<{ q: string; list: NodeSummary[] } | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(pageSections, []);

  const typed = query.trim();
  const isHash = typed.startsWith("#");
  const asURL = isHash ? null : interpretURL(typed);
  const wantsSearch = !target && asURL === null && !isHash;

  useEffect(() => {
    if (!wantsSearch) return;
    let live = true;
    const t = window.setTimeout(
      () => {
        searchNodes(typed ? { search: typed, limit: 40 } : { nodeType: "page", limit: 6 })
          .then((list) => live && setResults({ q: typed, list }))
          .catch(() => live && setResults({ q: typed, list: [] }));
      },
      typed ? 160 : 0,
    );
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [typed, wantsSearch]);

  const groups: Group[] = useMemo(() => {
    if (target) return [];
    if (asURL) {
      const info = linkInfo(asURL);
      return [{ key: "url", label: "", items: [{ key: `url:${asURL}`, url: asURL, title: `Link to ${info.detail}`, detail: info.label, kind: info.kind }] }];
    }
    const out: Group[] = [];
    const needle = typed.replace(/^#/, "").toLowerCase();
    const secs = sections
      .filter((s) => !needle || s.url.toLowerCase().includes(needle) || s.title.toLowerCase().includes(needle))
      .slice(0, typed ? 12 : 5)
      .map<Option>((s) => ({ key: s.url, url: s.url, title: s.title, detail: s.url, kind: "anchor" }));
    if (isHash && typed.length > 1 && !sections.some((s) => s.url === typed)) {
      secs.push({ key: `url:${typed}`, url: typed, title: `Link to ${typed}`, detail: "Section", kind: "anchor" });
    }
    if (secs.length) out.push({ key: "sections", label: "On this page", items: secs });
    if (isHash || !results) return out;
    const q = results.q.toLowerCase();
    const byType = new Map<string, NodeSummary[]>();
    for (const n of results.list) {
      if (!n.full_url) continue;
      byType.set(n.node_type, [...(byType.get(n.node_type) ?? []), n]);
    }
    const typed_groups = [...byType.entries()].map(([slug, list]) => {
      list.sort((a, b) => rank(a.title, a.slug, q) - rank(b.title, b.slug, q) || a.title.localeCompare(b.title));
      return { slug, list, best: rank(list[0]!.title, list[0]!.slug, q) };
    });
    typed_groups.sort((a, b) => (a.slug === "page" ? -1 : b.slug === "page" ? 1 : a.best - b.best || a.slug.localeCompare(b.slug)));
    for (const g of typed_groups) {
      out.push({
        key: g.slug,
        label: q ? typeMeta(types, g.slug).plural : "Pages",
        items: g.list.map((n) => ({
          key: `n:${n.id}`,
          url: n.full_url!,
          title: n.title,
          detail: n.full_url!,
          kind: "page",
          nodeType: n.node_type,
          thumb: nodeThumb(n.featured_image),
          status: n.status && n.status !== "published" ? n.status : undefined,
        })),
      });
    }
    return out;
  }, [target, asURL, isHash, typed, sections, results, types]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector("[data-active]")?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const pick = (o: Option): void => {
    setTarget({ url: o.url, title: o.kind === "page" || (o.kind === "anchor" && !o.key.startsWith("url:")) ? o.title : "", nodeType: o.nodeType, thumb: o.thumb });
    setQuery("");
    setError(null);
    if (!text.trim() && (o.kind === "page" || (o.kind === "anchor" && !o.key.startsWith("url:")))) setText(o.title);
  };

  const change = (): void => {
    const info = target ? linkInfo(target.url) : null;
    setQuery(info && info.kind !== "page" && info.kind !== "anchor" ? target!.url : "");
    setTarget(null);
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = (): void => {
    const url = target ? target.url : typed === "" ? "" : isHash ? typed : asURL;
    if (url === null) {
      setError("Pick a page from the list, or type a full address like https://example.com.");
      inputRef.current?.focus();
      return;
    }
    onSave({ text: text.trim(), url, alt: alt.trim(), target: newTab ? "_blank" : "" });
  };

  const onQueryKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = flat[activeIndex];
      if (o) pick(o);
      else submit();
    }
  };

  const isNew = !initial.url && !initial.text;
  const loading = wantsSearch && results?.q !== typed;

  return (
    <Modal
      title={isNew ? "Add link" : "Edit link"}
      subtitle={title}
      size="md"
      className="vedit-link-modal"
      onClose={onCancel}
      footer={
        <>
          {onRemove && (
            <button type="button" className="vedit-btn" data-variant="ghost-danger" onClick={onRemove} style={{ marginRight: "auto" }}>
              Remove link
            </button>
          )}
          <button type="button" className="vedit-btn" data-variant="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="vedit-btn" data-variant="primary" onClick={submit}>
            {isNew ? "Add link" : "Save link"}
          </button>
        </>
      }
    >
      <div className="vedit-link-form">
        <div className="vedit-field">
          <label className="vedit-field-label" htmlFor="vedit-link-url">
            Link to
          </label>
          {target ? (
            <PickedTarget target={target} types={types} onChange={change} />
          ) : (
            <div className="vedit-combo" data-error={error ? "" : undefined}>
              <div className="vedit-combo-search">
                <Glyph name="search" size={16} />
                <input
                  ref={inputRef}
                  id="vedit-link-url"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search pages, or paste a URL, email or phone"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError(null);
                    setActive(0);
                  }}
                  onKeyDown={onQueryKey}
                  role="combobox"
                  aria-expanded
                  aria-controls="vedit-link-results"
                />
                {loading && typed ? <Glyph name="loader" size={15} className="vedit-spin" /> : null}
                {query && (
                  <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => (setQuery(""), inputRef.current?.focus())} aria-label="Clear" title="Clear">
                    <Glyph name="x" size={14} />
                  </button>
                )}
              </div>
              <div className="vedit-combo-results" id="vedit-link-results" role="listbox" ref={listRef}>
                {flat.length === 0 ? (
                  <div className="vedit-combo-empty">
                    {loading ? "Searching…" : typed ? <>Nothing on the site matches “{typed}”. Paste a full address to link somewhere else.</> : "No pages yet."}
                  </div>
                ) : (
                  groups.map((g) => (
                    <div key={g.key} role="group" aria-label={g.label || undefined}>
                      {g.label && <div className="vedit-combo-group">{g.label}</div>}
                      {g.items.map((o) => {
                        const i = flat.indexOf(o);
                        return (
                          <button
                            key={o.key}
                            type="button"
                            role="option"
                            aria-selected={i === activeIndex}
                            className="vedit-link-result"
                            data-active={i === activeIndex || undefined}
                            onMouseMove={() => setActive(i)}
                            onClick={() => pick(o)}
                          >
                            {o.nodeType ? <TypeIcon types={types} slug={o.nodeType} /> : <Glyph name={KIND_GLYPH[o.kind]} size={16} />}
                            <span className="vedit-link-result-title">{o.title}</span>
                            {o.status && <span className="vedit-link-result-status">{o.status}</span>}
                            <span className="vedit-link-result-path">
                              <bdi>{o.detail}</bdi>
                            </span>
                            <Glyph name="corner-down-left" size={14} className="vedit-link-result-enter" />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              <div className="vedit-combo-foot">
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> to move
                </span>
                <span>
                  <kbd>↵</kbd> to pick
                </span>
                <span className="vedit-combo-hint">Works with URLs, emails and #sections too</span>
              </div>
            </div>
          )}
          {error && <p className="vedit-field-error">{error}</p>}
        </div>

        <div className="vedit-field">
          <label className="vedit-field-label" htmlFor="vedit-link-text">
            Text
          </label>
          <input
            id="vedit-link-text"
            className="vedit-input"
            placeholder={target?.title || "What the button or link says"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <div className="vedit-link-options">
          <label className="vedit-switch-row">
            <Switch checked={newTab} onChange={setNewTab} label="Open in a new tab" />
            <span>Open in a new tab</span>
          </label>
          {!showMore && (
            <button type="button" className="vedit-text-action" onClick={() => setShowMore(true)}>
              Add a tooltip
            </button>
          )}
        </div>
        {showMore && (
          <div className="vedit-field">
            <label className="vedit-field-label" htmlFor="vedit-link-alt">
              Tooltip <span className="vedit-optional">optional</span>
            </label>
            <input id="vedit-link-alt" className="vedit-input" placeholder="Shown on hover and read by screen readers" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
        )}
      </div>
    </Modal>
  );
}

function PickedTarget({ target, types, onChange }: { target: Target; types: Map<string, TypeMeta>; onChange: () => void }): React.JSX.Element {
  const info = linkInfo(target.url);
  const found = usePage(target.title ? "" : target.url, info.kind);
  const nodeType = target.nodeType ?? found?.node_type;
  const section = info.kind === "anchor" && !target.title ? pageSections().find((s) => s.url === target.url) : undefined;
  const name = target.title || found?.title || section?.title || info.detail;
  const thumb = target.thumb ?? (found ? nodeThumb(found.featured_image) : "");
  return (
    <div className="vedit-link-picked" data-kind={info.kind}>
      {thumb ? (
        <Thumb src={thumb} label={name} />
      ) : (
        <span className="vedit-link-icon" aria-hidden="true">
          {nodeType ? <TypeIcon types={types} slug={nodeType} size={17} /> : <Glyph name={KIND_GLYPH[info.kind]} size={17} />}
        </span>
      )}
      <span className="vedit-link-text">
        <span className="vedit-link-title">{name}</span>
        <span className="vedit-link-meta">
          <span className="vedit-link-kind">{nodeType ? typeMeta(types, nodeType).label : info.label}</span>
          <span className="vedit-link-url">{info.detail}</span>
        </span>
      </span>
      <button type="button" className="vedit-btn" data-variant="secondary" data-size="sm" onClick={onChange} autoFocus>
        Change
      </button>
    </div>
  );
}
