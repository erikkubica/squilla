import * as React from "react";
import { useEffect, useState } from "react";
import { listTerms, searchNodes, type NodeSummary, type TermSummary } from "../api";
import type { BlockField } from "../api";

// --- Reference (content node) ---

interface NodeRefProps {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
}

export function NodeRefField({ field, value, onChange }: NodeRefProps): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  // Value can be {id, title, slug, node_type, ...} or a bare id (legacy).
  const v = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  const display = v
    ? `${(v.title as string) ?? `#${v.id}`} · ${(v.node_type as string) ?? "?"}`
    : typeof value === "number"
      ? `#${value}`
      : null;

  const allowed = (field as unknown as { node_types?: string[] }).node_types ?? [];

  return (
    <div>
      {display ? (
        <div className="vedit-field-unsupported">
          <div className="vedit-field-unsupported-summary">→ {display}</div>
          <div className="vedit-actions-row">
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={() => setPicking(true)}>Change</button>
            <button type="button" className="vedit-btn" data-variant="danger" onClick={() => onChange(null)}>Clear</button>
          </div>
        </div>
      ) : (
        <button type="button" className="vedit-add-block" onClick={() => setPicking(true)}>+ Pick content</button>
      )}
      {picking && (
        <NodePickerModal
          allowedNodeTypes={allowed}
          onPick={(n) => {
            onChange({ id: n.id, title: n.title, slug: n.slug, node_type: n.node_type });
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
  onPick,
  onCancel,
}: {
  allowedNodeTypes: string[];
  onPick: (n: NodeSummary) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NodeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>(allowedNodeTypes[0] ?? "");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      searchNodes({ search, nodeType: activeType || undefined, limit: 30 })
        .then(setResults)
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

  return (
    <div className="vedit-modal-backdrop" onClick={onCancel}>
      <div className="vedit-modal" onClick={(e) => e.stopPropagation()}>
        <header className="vedit-modal-header">
          <span className="vedit-modal-title">Pick content</span>
          <button type="button" className="vedit-link" onClick={onCancel}>Cancel</button>
        </header>
        {allowedNodeTypes.length > 1 && (
          <div className="vedit-tabs">
            {allowedNodeTypes.map((t) => (
              <button
                key={t}
                type="button"
                className="vedit-tab"
                data-active={t === activeType}
                onClick={() => setActiveType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <input
          type="search"
          className="vedit-input"
          placeholder="Search by title or slug…"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {error && <div className="vedit-error">{error}</div>}
        <ul className="vedit-block-picker-list">
          {results.length === 0 && <li className="vedit-empty">No matches.</li>}
          {results.map((n) => (
            <li key={n.id}>
              <button type="button" className="vedit-block-picker-item" onClick={() => onPick(n)}>
                <strong>{n.title}</strong>
                <span className="vedit-block-meta">{n.node_type} · {n.slug}</span>
              </button>
            </li>
          ))}
        </ul>
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
