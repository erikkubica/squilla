import * as React from "react";
import { useEffect, useState } from "react";
import { listTerms, nodeThumb, searchNodes, type NodeSummary, type TermSummary } from "../api";
import type { BlockField } from "../api";

// --- Reference (content node) ---

interface NodeRefProps {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
}

interface RefItem {
  id: number;
  title?: string;
  slug?: string;
  node_type?: string;
}

function toItems(value: unknown): RefItem[] {
  const raw = Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value];
  return raw
    .map((v) => (typeof v === "number" ? { id: v } : typeof v === "object" && v !== null ? (v as RefItem) : null))
    .filter((v): v is RefItem => v !== null && v.id !== undefined);
}

function humanize(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function Thumb({ src, label }: { src: string; label: string }): React.JSX.Element {
  const [broken, setBroken] = useState(false);
  return (
    <span className="vedit-ref-thumb" aria-hidden="true">
      {src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span>{label.charAt(0).toUpperCase() || "?"}</span>}
    </span>
  );
}

export function NodeRefField({ field, value, onChange }: NodeRefProps): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const schema = field as unknown as { node_types?: string[]; node_type_filter?: string | string[]; multiple?: boolean };
  const multiple = !!schema.multiple;
  const filter = schema.node_type_filter;
  const allowed = schema.node_types ?? (Array.isArray(filter) ? filter : filter ? [filter] : []);
  const items = toItems(value);

  // Stored references only carry id/title/slug; look up thumbnails and
  // current titles so the list reads like the content it points at.
  const [lookup, setLookup] = useState<Record<number, NodeSummary>>({});
  const allowedKey = allowed.join(",");
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const types = allowed.length ? allowed : [undefined];
    Promise.all(types.map((t) => searchNodes({ nodeType: t, limit: 100 })))
      .then((lists) => {
        if (cancelled) return;
        const map: Record<number, NodeSummary> = {};
        for (const n of lists.flat()) map[n.id] = n;
        setLookup(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey, items.length > 0]);

  const commit = (next: RefItem[]): void => {
    if (multiple) onChange(next);
    else onChange(next[0] ?? null);
  };
  const move = (i: number, d: -1 | 1): void => {
    const next = items.slice();
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    commit(next);
  };

  return (
    <div className="vedit-ref">
      {items.length > 0 && (
        <ul className="vedit-ref-list">
          {items.map((item, i) => {
            const live = lookup[item.id];
            const title = live?.title || item.title || item.slug || `#${item.id}`;
            const missing = Object.keys(lookup).length > 0 && !live;
            return (
              <li key={item.id} className="vedit-ref-row" data-missing={missing || undefined}>
                <Thumb src={nodeThumb(live?.featured_image)} label={title} />
                <span className="vedit-ref-text">
                  <span className="vedit-ref-title">{title}</span>
                  <span className="vedit-ref-meta">
                    {missing ? "Not found — it may have been deleted" : `${humanize(live?.node_type || item.node_type || "content")}${live?.status && live.status !== "published" ? ` · ${live.status}` : ""}`}
                  </span>
                </span>
                <span className="vedit-ref-actions">
                  {multiple && items.length > 1 && (
                    <>
                      <button type="button" className="vedit-ref-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${title} up`} title="Move up">↑</button>
                      <button type="button" className="vedit-ref-icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${title} down`} title="Move down">↓</button>
                    </>
                  )}
                  <button type="button" className="vedit-ref-icon" data-variant="danger" onClick={() => commit(items.filter((_, j) => j !== i))} aria-label={`Remove ${title}`} title="Remove">✕</button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="vedit-ref-footer">
        <button type="button" className="vedit-ref-add" onClick={() => setPicking(true)}>
          {multiple ? (items.length ? "+ Add or remove" : "+ Choose items") : items.length ? "Change" : "+ Choose item"}
        </button>
        {multiple && items.length > 0 && (
          <button type="button" className="vedit-link" onClick={() => commit([])}>Clear all</button>
        )}
      </div>
      {picking && (
        <NodePickerModal
          allowedNodeTypes={allowed}
          multiple={multiple}
          initial={items}
          onDone={(next) => {
            commit(next);
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function NodePickerModal({
  allowedNodeTypes,
  multiple,
  initial,
  onDone,
  onCancel,
}: {
  allowedNodeTypes: string[];
  multiple: boolean;
  initial: RefItem[];
  onDone: (items: RefItem[]) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NodeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>(allowedNodeTypes[0] ?? "");
  const [picked, setPicked] = useState<RefItem[]>(initial);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      searchNodes({ search, nodeType: activeType || undefined, limit: 50 })
        .then((r) => {
          setResults(r);
          setError(null);
        })
        .catch((e) => setError((e as Error).message));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [search, activeType]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const isPicked = (id: number): boolean => picked.some((p) => p.id === id);
  const toggle = (n: NodeSummary): void => {
    const item: RefItem = { id: n.id, title: n.title, slug: n.slug, node_type: n.node_type };
    if (!multiple) {
      onDone([item]);
      return;
    }
    setPicked((cur) => (cur.some((p) => p.id === n.id) ? cur.filter((p) => p.id !== n.id) : [...cur, item]));
  };
  const typeLabel = allowedNodeTypes.length === 1 ? humanize(allowedNodeTypes[0]!).toLowerCase() : "content";

  return (
    <div className="vedit-modal-backdrop" onClick={onCancel}>
      <div className="vedit-modal vedit-ref-modal" role="dialog" aria-modal="true" aria-label={`Choose ${typeLabel}`} onClick={(e) => e.stopPropagation()}>
        <header className="vedit-modal-header">
          <span className="vedit-modal-title">Choose {typeLabel}</span>
          <button type="button" className="vedit-link" onClick={onCancel}>Cancel</button>
        </header>
        {allowedNodeTypes.length > 1 && (
          <div className="vedit-tabs">
            {allowedNodeTypes.map((t) => (
              <button key={t} type="button" className="vedit-tab" data-active={t === activeType} onClick={() => setActiveType(t)}>
                {humanize(t)}
              </button>
            ))}
          </div>
        )}
        <input
          type="search"
          className="vedit-input"
          placeholder={`Search ${typeLabel} by title…`}
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {error && <div className="vedit-error">{error}</div>}
        <ul className="vedit-ref-results">
          {results === null && <li className="vedit-empty">Loading…</li>}
          {results?.length === 0 && <li className="vedit-empty">No matches.</li>}
          {results?.map((n) => {
            const on = isPicked(n.id);
            return (
              <li key={n.id}>
                <button type="button" className="vedit-ref-result" data-selected={on || undefined} aria-pressed={multiple ? on : undefined} onClick={() => toggle(n)}>
                  <Thumb src={nodeThumb(n.featured_image)} label={n.title} />
                  <span className="vedit-ref-text">
                    <span className="vedit-ref-title">{n.title}</span>
                    <span className="vedit-ref-meta">
                      {n.full_url || `/${n.slug}`}
                      {n.status && n.status !== "published" && <span className="vedit-ref-status">{n.status}</span>}
                    </span>
                  </span>
                  {multiple && <span className="vedit-ref-check" aria-hidden="true">{on ? "✓" : ""}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {multiple && (
          <footer className="vedit-modal-footer vedit-ref-modal-footer">
            <span className="vedit-ref-count">{picked.length ? `${picked.length} selected` : "None selected"}</span>
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={onCancel}>Cancel</button>
            <button type="button" className="vedit-btn" data-variant="primary" onClick={() => onDone(picked)}>Done</button>
          </footer>
        )}
      </div>
    </div>
  );
}

// --- Term (taxonomy) ---

interface TermProps {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  /** Falls back here if the field schema doesn't carry node_type. */
  defaultNodeType: string;
}

export function TermField({ field, value, onChange, defaultNodeType }: TermProps): React.JSX.Element {
  const taxonomy = (field as unknown as { taxonomy?: string }).taxonomy ?? "";
  const nodeType = (field as unknown as { node_type?: string }).node_type ?? defaultNodeType;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TermSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const v = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  const display = v ? (v.name as string) ?? (v.slug as string) ?? `#${v.id}` : null;

  useEffect(() => {
    if (!open || !taxonomy || !nodeType) return;
    listTerms(nodeType, taxonomy, { perPage: 200 })
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [open, taxonomy, nodeType]);

  if (!taxonomy) {
    return <p className="vedit-empty">Field schema is missing taxonomy.</p>;
  }

  return (
    <div>
      {display ? (
        <div className="vedit-field-unsupported">
          <div className="vedit-field-unsupported-summary">🏷 {display}</div>
          <div className="vedit-actions-row">
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={() => setOpen(true)}>Change</button>
            <button type="button" className="vedit-btn" data-variant="danger" onClick={() => onChange(null)}>Clear</button>
          </div>
        </div>
      ) : (
        <button type="button" className="vedit-add-block" onClick={() => setOpen(true)}>+ Pick term</button>
      )}
      {open && (
        <div className="vedit-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="vedit-modal" onClick={(e) => e.stopPropagation()}>
            <header className="vedit-modal-header">
              <span className="vedit-modal-title">Pick {taxonomy}</span>
              <button type="button" className="vedit-link" onClick={() => setOpen(false)}>Cancel</button>
            </header>
            {error && <div className="vedit-error">{error}</div>}
            <ul className="vedit-block-picker-list">
              {items.length === 0 && <li className="vedit-empty">No terms.</li>}
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="vedit-block-picker-item"
                    onClick={() => {
                      onChange({ id: t.id, slug: t.slug, name: t.name, taxonomy, node_type: nodeType });
                      setOpen(false);
                    }}
                  >
                    <strong>{t.name}</strong>
                    <span className="vedit-block-meta">{t.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
