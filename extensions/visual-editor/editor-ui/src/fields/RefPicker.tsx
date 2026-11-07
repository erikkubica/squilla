import * as React from "react";
import { useEffect, useState } from "react";
import { listTerms, nodeThumb, searchNodes, type BlockField, type NodeSummary, type TermSummary } from "../api";
import { Glyph, Modal, SearchInput, humanize } from "../ui";

// --- Reference (content node) ---

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

function Thumb({ src, label, size }: { src: string; label: string; size?: "lg" }): React.JSX.Element {
  const [broken, setBroken] = useState(false);
  return (
    <span className="vedit-ref-thumb" data-size={size} aria-hidden="true">
      {src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span>{label.charAt(0).toUpperCase() || "?"}</span>}
    </span>
  );
}

function StatusPill({ status }: { status?: string }): React.JSX.Element | null {
  if (!status || status === "published") return null;
  return <span className="vedit-status-pill">{status}</span>;
}

export function NodeRefField({ field, value, onChange }: { field: BlockField; value: unknown; onChange: (next: unknown) => void }): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const schema = field as unknown as { node_types?: string[]; node_type_filter?: string | string[]; multiple?: boolean };
  const multiple = !!schema.multiple;
  const filter = schema.node_type_filter;
  const allowed = schema.node_types ?? (Array.isArray(filter) ? filter : filter ? [filter] : []);
  const items = toItems(value);

  // Stored references only carry id/title/slug; look up thumbnails and
  // current titles so the list reads like the content it points at.
  const [lookup, setLookup] = useState<Record<number, NodeSummary>>({});
  const [looked, setLooked] = useState(false);
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
        // The search caps at 100 per type; past that a reference can be
        // real yet absent from the lookup, so don't flag anything.
        setLooked(lists.every((l) => l.length < 100));
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
  const typeLabel = allowed.length === 1 ? humanize(allowed[0]!).toLowerCase() : "content";

  return (
    <div className="vedit-ref">
      {items.length > 0 && (
        <ul className="vedit-ref-list">
          {items.map((item, i) => {
            const live = lookup[item.id];
            const title = live?.title || item.title || item.slug || `#${item.id}`;
            const missing = looked && !live;
            return (
              <li key={item.id} className="vedit-ref-row" data-missing={missing || undefined}>
                <Thumb src={nodeThumb(live?.featured_image)} label={title} />
                <span className="vedit-ref-text">
                  <span className="vedit-ref-title">{title}</span>
                  <span className="vedit-ref-meta">
                    {missing ? "Not found — it may have been deleted" : humanize(live?.node_type || item.node_type || "content")}
                    {!missing && <StatusPill status={live?.status} />}
                  </span>
                </span>
                <span className="vedit-ref-actions">
                  {multiple && items.length > 1 && (
                    <>
                      <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${title} up`} title="Move up">
                        <Glyph name="arrow-up" size={14} />
                      </button>
                      <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${title} down`} title="Move down">
                        <Glyph name="arrow-down" size={14} />
                      </button>
                    </>
                  )}
                  <button type="button" className="vedit-icon-btn" data-size="sm" data-tone="danger" onClick={() => commit(items.filter((_, j) => j !== i))} aria-label={`Remove ${title}`} title="Remove">
                    <Glyph name="x" size={15} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="vedit-ref-footer">
        <button type="button" className="vedit-add-button" data-size="sm" data-fit onClick={() => setPicking(true)}>
          <Glyph name={items.length ? "link" : "plus"} size={15} />
          {multiple ? (items.length ? "Add or remove" : `Choose ${typeLabel}`) : items.length ? "Change" : `Choose ${typeLabel}`}
        </button>
        {multiple && items.length > 1 && (
          <button type="button" className="vedit-text-action" onClick={() => commit([])}>Clear all</button>
        )}
      </div>
      {picking && (
        <NodePickerModal
          allowedNodeTypes={allowed}
          multiple={multiple}
          initial={items}
          typeLabel={typeLabel}
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
  typeLabel,
  onDone,
  onCancel,
}: {
  allowedNodeTypes: string[];
  multiple: boolean;
  initial: RefItem[];
  typeLabel: string;
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

  const toggle = (n: NodeSummary): void => {
    const item: RefItem = { id: n.id, title: n.title, slug: n.slug, node_type: n.node_type };
    if (!multiple) {
      onDone([item]);
      return;
    }
    setPicked((cur) => (cur.some((p) => p.id === n.id) ? cur.filter((p) => p.id !== n.id) : [...cur, item]));
  };

  return (
    <Modal
      title={`Choose ${typeLabel}`}
      subtitle={multiple ? "Pick as many as you need. The order you pick them in is the order they show." : undefined}
      size="md"
      className="vedit-ref-modal"
      onClose={onCancel}
      footer={
        multiple ? (
          <>
            <span className="vedit-modal-count">{picked.length ? `${picked.length} selected` : "None selected"}</span>
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={onCancel}>Cancel</button>
            <button type="button" className="vedit-btn" data-variant="primary" onClick={() => onDone(picked)}>Done</button>
          </>
        ) : undefined
      }
    >
      {allowedNodeTypes.length > 1 && (
        <div className="vedit-tabs" role="tablist">
          {allowedNodeTypes.map((t) => (
            <button key={t} type="button" role="tab" className="vedit-tab" aria-selected={t === activeType} data-active={t === activeType} onClick={() => setActiveType(t)}>
              {humanize(t)}
            </button>
          ))}
        </div>
      )}
      <SearchInput value={search} onChange={setSearch} placeholder={`Search ${typeLabel} by title…`} autoFocus />
      {error && <div className="vedit-alert" data-tone="danger">{error}</div>}
      <ul className="vedit-ref-results">
        {results === null && <li className="vedit-empty">Loading…</li>}
        {results?.length === 0 && <li className="vedit-empty">{search ? `Nothing matches “${search}”.` : "Nothing here yet."}</li>}
        {results?.map((n) => {
          const order = picked.findIndex((p) => p.id === n.id);
          const on = order >= 0;
          return (
            <li key={n.id}>
              <button type="button" className="vedit-ref-result" data-selected={on || undefined} aria-pressed={multiple ? on : undefined} onClick={() => toggle(n)}>
                <Thumb src={nodeThumb(n.featured_image)} label={n.title} size="lg" />
                <span className="vedit-ref-text">
                  <span className="vedit-ref-title">{n.title}</span>
                  <span className="vedit-ref-meta">
                    <span className="vedit-ref-url">{n.full_url || `/${n.slug}`}</span>
                    <StatusPill status={n.status} />
                  </span>
                </span>
                {multiple && (
                  <span className="vedit-ref-check" aria-hidden="true">
                    {on ? <Glyph name="check" size={13} strokeWidth={3} /> : null}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

// --- Term (taxonomy) ---

export function TermField({
  field,
  value,
  onChange,
  defaultNodeType,
}: {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
  /** Falls back here if the field schema doesn't carry node_type. */
  defaultNodeType: string;
}): React.JSX.Element {
  const schema = field as unknown as { taxonomy?: string; node_type?: string; term_node_type?: string };
  const taxonomy = schema.taxonomy ?? "";
  const nodeType = schema.term_node_type ?? schema.node_type ?? defaultNodeType;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TermSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const v = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  const display = v ? ((v.name as string) ?? (v.slug as string) ?? `#${v.id}`) : null;

  useEffect(() => {
    if (!open || !taxonomy || !nodeType) return;
    listTerms(nodeType, taxonomy, { perPage: 200 })
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [open, taxonomy, nodeType]);

  if (!taxonomy) return <p className="vedit-muted-note">This field has no taxonomy configured.</p>;

  const q = search.trim().toLowerCase();
  const shown = (items ?? []).filter((t) => !q || t.name.toLowerCase().includes(q) || t.slug.includes(q));

  return (
    <>
      {display ? (
        <div className="vedit-chip-row">
          <span className="vedit-chip">
            <Glyph name="tag" size={13} />
            {display}
          </span>
          <button type="button" className="vedit-btn" data-variant="secondary" data-size="sm" onClick={() => setOpen(true)}>Change</button>
          <button type="button" className="vedit-icon-btn" data-size="sm" data-tone="danger" onClick={() => onChange(null)} title="Clear" aria-label="Clear term">
            <Glyph name="x" size={15} />
          </button>
        </div>
      ) : (
        <button type="button" className="vedit-media-empty" onClick={() => setOpen(true)}>
          <Glyph name="tag" size={17} strokeWidth={1.7} />
          Choose {humanize(taxonomy).toLowerCase()}
        </button>
      )}
      {open && (
        <Modal title={`Choose ${humanize(taxonomy).toLowerCase()}`} size="sm" onClose={() => setOpen(false)}>
          <SearchInput value={search} onChange={setSearch} placeholder="Filter…" autoFocus />
          {error && <div className="vedit-alert" data-tone="danger">{error}</div>}
          <ul className="vedit-option-list">
            {items === null && !error && <li className="vedit-empty">Loading…</li>}
            {items !== null && shown.length === 0 && <li className="vedit-empty">No terms.</li>}
            {shown.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="vedit-option"
                  data-selected={v?.id === t.id || undefined}
                  onClick={() => {
                    onChange({ id: t.id, slug: t.slug, name: t.name, taxonomy, node_type: nodeType });
                    setOpen(false);
                  }}
                >
                  <span className="vedit-option-label">{t.name}</span>
                  <span className="vedit-option-meta">{t.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}
