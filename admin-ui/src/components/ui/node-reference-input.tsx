import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, Link2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchNodes, type NodeSearchResult, type NodeTypeField } from "@/api/client";

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

/** Best-effort thumbnail URL from a node's featured_image payload. */
function thumbURL(img: unknown): string {
  // theme-asset:<key> refs only resolve server-side at render time.
  if (typeof img === "string") return img.startsWith("theme-asset:") ? "" : img;
  if (img && typeof img === "object" && typeof (img as { url?: unknown }).url === "string") {
    return (img as { url: string }).url;
  }
  return "";
}

function allowedTypes(field: NodeTypeField): string[] {
  const f = field as NodeTypeField & { node_types?: string[]; node_type_filter?: string | string[] };
  if (Array.isArray(f.node_types) && f.node_types.length) return f.node_types;
  const filter = f.node_type_filter;
  if (Array.isArray(filter)) return filter.filter(Boolean);
  return filter ? [filter] : [];
}

function Thumb({ src, label, large }: { src: string; label: string; large?: boolean }) {
  const [broken, setBroken] = useState(false);
  return (
    <span data-slot="ref-thumb" data-size={large ? "lg" : undefined} aria-hidden>
      {src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : label.charAt(0).toUpperCase() || "?"}
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
                <Thumb src={thumbURL(live?.featured_image)} label={title} />
                <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
                  <span data-slot="ref-title">{title}</span>
                  <span data-slot="ref-meta">
                    {missing ? "Not found — it may have been deleted" : humanize(live?.node_type || item.node_type || "content")}
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
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(allowed[0] ?? "");
  const [results, setResults] = useState<NodeSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<RefItem[]>(initial);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      searchNodes({ q: search.trim() || undefined, node_type: activeType || undefined, limit: 50 })
        .then((r) => {
          if (cancelled) return;
          setResults(r);
          setError(null);
        })
        .catch((e) => !cancelled && setError((e as Error).message));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, activeType]);

  const toggle = (n: NodeSearchResult) => {
    if (!multiple) {
      onDone([toRef(n)]);
      return;
    }
    setPicked((cur) => (cur.some((p) => p.id === n.id) ? cur.filter((p) => p.id !== n.id) : [...cur, toRef(n)]));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="flex h-[min(600px,85vh)] flex-col gap-3 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Choose {typeLabel}</DialogTitle>
          <DialogDescription>
            {multiple ? "Pick as many as you need. The order you pick them in is the order they show." : "Pick one."}
          </DialogDescription>
        </DialogHeader>

        {allowed.length > 1 && (
          <div data-slot="ref-tabs" role="tablist">
            {allowed.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={t === activeType} data-active={t === activeType || undefined} onClick={() => setActiveType(t)}>
                {humanize(t)}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }} />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${typeLabel} by title…`}
            className="rounded-lg pl-9"
          />
        </div>

        {error && (
          <p className="rounded-md px-3 py-2 text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <ul data-slot="ref-results" className="-mx-1.5 min-h-[120px] flex-1 overflow-y-auto px-1.5">
          {results === null && <li data-slot="search-empty">Loading…</li>}
          {results?.length === 0 && <li data-slot="search-empty">{search ? `Nothing matches “${search}”.` : "Nothing here yet."}</li>}
          {results?.map((n) => {
            const on = picked.some((p) => p.id === n.id);
            return (
              <li key={n.id}>
                <button type="button" data-slot="ref-result" data-selected={on || undefined} aria-pressed={multiple ? on : undefined} onClick={() => toggle(n)}>
                  <Thumb src={thumbURL(n.featured_image)} label={n.title} large />
                  <span className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
                    <span data-slot="ref-title">{n.title}</span>
                    <span data-slot="ref-meta">
                      <span className="truncate" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                        {n.full_url || `/${n.slug}`}
                      </span>
                      <StatusPill status={n.status} />
                    </span>
                  </span>
                  {multiple && (
                    <span data-slot="ref-check" aria-hidden>
                      {on && <Check size={13} strokeWidth={3} />}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {multiple && (
          <DialogFooter className="items-center border-t pt-3 sm:justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
              {picked.length ? `${picked.length} selected` : "None selected"}
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
