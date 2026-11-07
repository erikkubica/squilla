import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Link2, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchNodes, type NodeSearchResult, type NodeTypeField } from "@/api/client";
import { thumbURL } from "@/lib/node-thumb";
import { type IconComponent } from "@/lib/lucide-icon";
import { typeMeta, useNodeTypes } from "@/lib/node-types";

// Reference ("node") field: the chosen content as a list of rows with a
// thumbnail, title, type and status, reorderable, plus a picker dialog
// that multi-selects with a running count. Same UI as the visual editor's
// reference field so editors meet one control in both places.

/** What a reference stores. The kernel hydrates references by `id` at
 *  render time, so the rest is only a label for the admin. */
interface RefItem {
  id: number;
  title?: string;
  slug?: string;
  node_type?: string;
  status?: string;
  language_code?: string;
  full_url?: string;
}

function toItems(value: unknown): RefItem[] {
  const raw = Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value];
  return raw
    .map((v) => (typeof v === "number" ? { id: v } : typeof v === "object" && v !== null ? (v as RefItem) : null))
    .filter((v): v is RefItem => v !== null && typeof v.id === "number");
}

function toRef(n: NodeSearchResult): RefItem {
  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    node_type: n.node_type,
    status: n.status,
    language_code: n.language_code,
    ...(n.full_url ? { full_url: n.full_url } : {}),
  };
}

function humanize(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function allowedTypes(field: NodeTypeField): string[] {
  const f = field as NodeTypeField & { node_types?: string[]; node_type_filter?: string | string[] };
  if (Array.isArray(f.node_types) && f.node_types.length) return f.node_types;
  const filter = f.node_type_filter;
  if (Array.isArray(filter)) return filter.filter(Boolean);
  return filter ? [filter] : [];
}

export function Thumb({ src, label, icon: Icon, large }: { src: string; label: string; icon?: IconComponent; large?: boolean }) {
  const [broken, setBroken] = useState(false);
  const showImg = !!src && !broken;
  return (
    <span data-slot="ref-thumb" data-size={large ? "lg" : undefined} data-empty={!showImg || undefined} aria-hidden>
      {showImg ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : Icon ? <Icon size={large ? 18 : 16} /> : label.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status || status === "published") return null;
  return <span data-slot="ref-status">{status}</span>;
}

export function NodeReferenceInput({
  field,
  value,
  onChange,
}: {
  field: NodeTypeField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const multiple = !!field.multiple;
  const allowed = allowedTypes(field);
  const items = toItems(value);
  const typeLabel = allowed.length === 1 ? humanize(allowed[0]).toLowerCase() : "content";
  const [picking, setPicking] = useState(false);
  const types = useNodeTypes();

  // Stored references only carry a label; look up current titles,
  // statuses and thumbnails so the list reads like the content itself.
  const [lookup, setLookup] = useState<Record<number, NodeSearchResult>>({});
  const [authoritative, setAuthoritative] = useState(false);
  const allowedKey = allowed.join(",");
  const hasItems = items.length > 0;
  useEffect(() => {
    if (!hasItems) return;
    let cancelled = false;
    const types = allowed.length ? allowed : [undefined];
    Promise.all(types.map((t) => searchNodes({ node_type: t, limit: 100 })))
      .then((lists) => {
        if (cancelled) return;
        const map: Record<number, NodeSearchResult> = {};
        for (const n of lists.flat()) map[n.id] = n;
        setLookup(map);
        // The search caps at 100 per type; beyond that a reference can be
        // valid yet absent here, so only flag missing ones below the cap.
        setAuthoritative(lists.every((l) => l.length < 100));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey, hasItems]);

  const commit = (next: RefItem[]) => onChange(multiple ? next : (next[0] ?? null));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="flex flex-col gap-2" data-slug={field.name}>
      {items.length > 0 && (
        <ul data-slot="ref-list">
          {items.map((item, i) => {
            const live = lookup[item.id];
            const title = live?.title || item.title || item.slug || `#${item.id}`;
            const missing = authoritative && !live;
            return (
              <li key={item.id} data-slot="ref-row" data-missing={missing || undefined}>
                <Thumb src={thumbURL(live?.featured_image)} label={title} icon={typeMeta(types, live?.node_type || item.node_type || "").Icon} />
                <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
                  <span data-slot="ref-title">{title}</span>
                  <span data-slot="ref-meta">
                    {missing ? "Not found — it may have been deleted" : typeMeta(types, live?.node_type || item.node_type || "content").label}
                    {!missing && <StatusPill status={live?.status ?? item.status} />}
                  </span>
                </span>
                <span data-slot="ref-actions">
                  {multiple && items.length > 1 && (
                    <>
                      <button type="button" data-slot="icon-button" data-size="sm" onClick={() => move(i, -1)} disabled={i === 0} title="Move up" aria-label={`Move ${title} up`}>
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" data-slot="icon-button" data-size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down" aria-label={`Move ${title} down`}>
                        <ArrowDown size={14} />
                      </button>
                    </>
                  )}
                  <button type="button" data-slot="icon-button" data-size="sm" data-tone="danger" onClick={() => commit(items.filter((_, j) => j !== i))} title="Remove" aria-label={`Remove ${title}`}>
                    <X size={15} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-between" style={{ gap: 8 }}>
        <button type="button" data-slot="add-button" data-size="sm" style={{ width: "auto", padding: "0 14px" }} onClick={() => setPicking(true)}>
          {items.length ? <Link2 size={15} /> : <Plus size={15} />}
          {multiple ? (items.length ? "Add or remove" : `Choose ${typeLabel}`) : items.length ? "Change" : `Choose ${typeLabel}`}
        </button>
        {multiple && items.length > 1 && (
          <button type="button" data-slot="text-action" onClick={() => commit([])}>
            Clear all
          </button>
        )}
      </div>
      {picking && (
        <NodePickerDialog
          allowed={allowed}
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

function NodePickerDialog({
  allowed,
  multiple,
  initial,
  typeLabel,
  onDone,
  onCancel,
}: {
  allowed: string[];
  multiple: boolean;
  initial: RefItem[];
  typeLabel: string;
  onDone: (items: RefItem[]) => void;
  onCancel: () => void;
}) {
  const types = useNodeTypes();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(allowed[0] ?? "");
  const [results, setResults] = useState<{ key: string; list: NodeSearchResult[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<RefItem[]>(initial);
  const q = search.trim();
  const key = `${activeType}|${q}`;

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () => {
        searchNodes({ q: q || undefined, node_type: activeType || undefined, limit: 50 })
          .then((list) => {
            if (cancelled) return;
            setResults({ key, list });
            setError(null);
          })
          .catch((e) => !cancelled && setError((e as Error).message));
      },
      q ? 180 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, activeType, key]);

  const toggle = (n: NodeSearchResult) => {
    if (!multiple) {
      onDone([toRef(n)]);
      return;
    }
    setPicked((cur) => (cur.some((p) => p.id === n.id) ? cur.filter((p) => p.id !== n.id) : [...cur, toRef(n)]));
  };
  const loading = results?.key !== key;
  const list = results?.list ?? [];

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="flex h-[min(620px,85vh)] flex-col gap-4 sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Choose {typeLabel}</DialogTitle>
          <DialogDescription>{multiple ? "Pick as many as you need. They show in the order you pick them." : "Click one to pick it."}</DialogDescription>
        </DialogHeader>

        {allowed.length > 1 && (
          <div data-slot="ref-tabs" role="tablist">
            {allowed.map((t) => {
              const meta = typeMeta(types, t);
              return (
                <button key={t} type="button" role="tab" aria-selected={t === activeType} data-active={t === activeType || undefined} onClick={() => setActiveType(t)}>
                  <meta.Icon size={14} />
                  {meta.plural}
                </button>
              );
            })}
          </div>
        )}

        <div data-slot="combo" className="min-h-0 flex-1">
          <div data-slot="combo-search">
            <Search size={16} aria-hidden />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${typeLabel} by title…`} autoComplete="off" spellCheck={false} />
            {loading && q ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
            {search && (
              <button type="button" data-slot="icon-button" data-size="sm" onClick={() => setSearch("")} aria-label="Clear" title="Clear">
                <X size={14} />
              </button>
            )}
          </div>
          <ul data-slot="combo-results" className="flex-1" style={{ maxHeight: "none" }}>
            {error && <li data-slot="combo-empty" style={{ color: "var(--danger)" }}>{error}</li>}
            {!error && results === null && <li data-slot="combo-empty">Loading…</li>}
            {!error && results !== null && !loading && list.length === 0 && <li data-slot="combo-empty">{q ? `Nothing matches “${q}”.` : "Nothing here yet."}</li>}
            {list.map((n) => {
              const order = picked.findIndex((p) => p.id === n.id);
              const on = order >= 0;
              return (
                <li key={n.id}>
                  <button type="button" data-slot="ref-result" data-selected={on || undefined} aria-pressed={multiple ? on : undefined} onClick={() => toggle(n)}>
                    <Thumb src={thumbURL(n.featured_image)} label={n.title} icon={typeMeta(types, n.node_type).Icon} />
                    <span data-slot="ref-result-title">{n.title}</span>
                    <StatusPill status={n.status} />
                    <span data-slot="ref-result-path">
                      <bdi>{n.full_url || `/${n.slug}`}</bdi>
                    </span>
                    {multiple && (
                      <span data-slot="ref-check" aria-hidden>
                        {on ? order + 1 : null}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {multiple && (
          <DialogFooter className="items-center border-t pt-4 sm:justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="flex items-center gap-3 text-sm" style={{ color: "var(--fg-subtle)" }}>
              {picked.length ? `${picked.length} selected` : "None selected"}
              {picked.length > 0 && (
                <button type="button" data-slot="text-action" onClick={() => setPicked([])}>
                  Clear
                </button>
              )}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={() => onDone(picked)}>
                Done
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NodeReferenceInput;
