import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CornerDownLeft, ExternalLink, FileText, Globe, Hash, Link2, Loader2, Mail, MapPin, MessageCircle, Pencil, Phone, Search, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Thumb } from "@/components/ui/node-reference-input";
import { thumbURL } from "@/lib/node-thumb";
import { searchNodes, type NodeSearchResult } from "@/api/client";
import { type IconComponent } from "@/lib/lucide-icon";
import { typeMeta, useNodeTypes, type TypeMeta } from "@/lib/node-types";
import { interpretURL, linkInfo, type LinkKind } from "@/lib/link-kind";

// Link field: a compact card that says where the link goes ("Page · About
// us", "Website · google.com") with edit / open / remove, and an editor
// dialog with one box that searches the site's pages or takes a URL, an
// email address or a phone number. Same control as the visual editor's
// link field. Stored shape is unchanged: {text, url, alt, target}.

interface LinkValue {
  text: string;
  url: string;
  alt: string;
  target: string;
}

const EMPTY: LinkValue = { text: "", url: "", alt: "", target: "" };

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function readLink(value: unknown): LinkValue {
  const r = asRecord(value);
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");
  return { text: str("text") || str("label"), url: str("url"), alt: str("alt"), target: str("target") };
}

const KIND_ICON: Record<LinkKind, LucideIcon> = {
  empty: Link2,
  page: FileText,
  anchor: Hash,
  email: Mail,
  phone: Phone,
  chat: MessageCircle,
  map: MapPin,
  external: Globe,
};

function humanize(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// --- Page titles for internal links ------------------------------------------
const pageCache = new Map<string, Promise<NodeSearchResult | null>>();

function normPath(p: string): string {
  const path = p.split(/[?#]/)[0] ?? "";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function findPage(path: string): Promise<NodeSearchResult | null> {
  const key = normPath(path);
  let hit = pageCache.get(key);
  if (!hit) {
    const segment = key.split("/").filter(Boolean).pop() ?? "";
    hit = searchNodes({ q: segment || undefined, limit: 50 })
      .then((list) => list.find((n) => n.full_url && normPath(n.full_url) === key) ?? null)
      .catch(() => null);
    pageCache.set(key, hit);
  }
  return hit;
}

function usePage(url: string): NodeSearchResult | null {
  const info = linkInfo(url);
  const path = info.kind === "page" ? info.detail : "";
  const [page, setPage] = useState<{ path: string; node: NodeSearchResult | null }>({ path: "", node: null });
  useEffect(() => {
    if (!path) return;
    let live = true;
    void findPage(path).then((node) => live && setPage({ path, node }));
    return () => {
      live = false;
    };
  }, [path]);
  return path && page.path === path ? page.node : null;
}

// --- Field --------------------------------------------------------------------
export function LinkFieldInput({ value, onChange, name, label }: { value: unknown; onChange: (val: unknown) => void; name?: string; label?: string }) {
  const link = readLink(value);
  const [editing, setEditing] = useState(false);
  const info = linkInfo(link.url);
  const page = usePage(link.url);
  const isSet = link.url !== "" || link.text !== "";

  const save = (next: LinkValue) => {
    const prev = asRecord(value);
    onChange({ ...prev, ...next, ...(prev.label !== undefined ? { label: next.text } : {}) });
    setEditing(false);
  };

  const dialog = editing && (
    <LinkDialog initial={link} title={label} onSave={save} onRemove={isSet ? () => save(EMPTY) : undefined} onCancel={() => setEditing(false)} />
  );

  if (!isSet) {
    return (
      <div data-slug={name}>
        <button type="button" data-slot="add-button" data-size="sm" style={{ width: "auto", padding: "0 14px" }} onClick={() => setEditing(true)}>
          <Link2 size={15} />
          Add link
        </button>
        {dialog}
      </div>
    );
  }

  const Icon = KIND_ICON[info.kind];
  const title = link.text || page?.title || info.detail || "Untitled link";
  return (
    <div data-slot="link-card" data-kind={info.kind} data-slug={name}>
      <button type="button" data-slot="link-main" onClick={() => setEditing(true)} title="Edit link">
        <span data-slot="link-icon" aria-hidden>
          <Icon size={16} />
        </span>
        <span data-slot="link-text">
          <span data-slot="link-title" data-placeholder={!link.text || undefined}>
            {title}
          </span>
          <span data-slot="link-meta">
            {info.kind === "empty" ? (
              <span data-slot="link-warn">
                <AlertTriangle size={12} /> No URL — the button won't go anywhere
              </span>
            ) : (
              <>
                <span data-slot="link-kind">{page ? humanize(page.node_type) : info.label}</span>
                <span data-slot="link-url">{page && link.text ? page.title : info.detail}</span>
              </>
            )}
            {link.target === "_blank" && (
              <span data-slot="link-badge">
                <ExternalLink size={10} strokeWidth={2.4} /> New tab
              </span>
            )}
          </span>
        </span>
      </button>
      <span data-slot="link-actions">
        <button type="button" data-slot="icon-button" data-size="sm" onClick={() => setEditing(true)} title="Edit link" aria-label="Edit link">
          <Pencil size={14} />
        </button>
        {info.kind !== "empty" && (
          <a data-slot="icon-button" data-size="sm" href={link.url} target="_blank" rel="noreferrer noopener" title="Open link in a new tab" aria-label="Open link in a new tab">
            <ExternalLink size={14} />
          </a>
        )}
        <button type="button" data-slot="icon-button" data-size="sm" data-tone="danger" onClick={() => save(EMPTY)} title="Remove link" aria-label="Remove link">
          <X size={15} />
        </button>
      </span>
      {dialog}
    </div>
  );
}

/** 0 = exact title, 1 = title starts with, 2 = a word starts with, 3 = anything else. */
function rank(n: NodeSearchResult, q: string): number {
  const t = n.title.toLowerCase();
  if (!q) return 3;
  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  if (t.split(/[\s\-–—:,&/]+/).some((w) => w.startsWith(q)) || n.slug.startsWith(q)) return 2;
  return 3;
}

interface Group {
  key: string;
  label: string;
  items: NodeSearchResult[];
}

/** Results grouped by content type: pages first, then by best match. */
function groupResults(list: NodeSearchResult[], q: string, types: Map<string, TypeMeta>): Group[] {
  const query = q.toLowerCase();
  const byType = new Map<string, NodeSearchResult[]>();
  for (const n of list) {
    if (!n.full_url) continue;
    const arr = byType.get(n.node_type) ?? [];
    arr.push(n);
    byType.set(n.node_type, arr);
  }
  const groups = [...byType.entries()].map(([slug, items]) => {
    items.sort((a, b) => rank(a, query) - rank(b, query) || a.title.localeCompare(b.title));
    return { key: slug, label: typeMeta(types, slug).plural, items, best: rank(items[0]!, query) };
  });
  groups.sort((a, b) => (a.key === "page" ? -1 : b.key === "page" ? 1 : a.best - b.best || a.label.localeCompare(b.label)));
  return groups;
}

// --- Dialog -------------------------------------------------------------------
interface Target {
  url: string;
  title: string;
  type?: string;
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
}) {
  const types = useNodeTypes();
  const [target, setTarget] = useState<Target | null>(initial.url ? { url: initial.url, title: "" } : null);
  const [query, setQuery] = useState("");
  const [text, setText] = useState(initial.text);
  const [alt, setAlt] = useState(initial.alt);
  const [newTab, setNewTab] = useState(initial.target === "_blank");
  const [showMore, setShowMore] = useState(initial.alt !== "");
  const [results, setResults] = useState<{ q: string; list: NodeSearchResult[] } | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const typed = query.trim();
  const asURL = interpretURL(typed);
  const wantsSearch = !target && asURL === null;

  useEffect(() => {
    if (!wantsSearch) return;
    let live = true;
    const t = setTimeout(
      () => {
        searchNodes(typed ? { q: typed, limit: 40 } : { node_type: "page", limit: 8 })
          .then((list) => live && setResults({ q: typed, list }))
          .catch(() => live && setResults({ q: typed, list: [] }));
      },
      typed ? 160 : 0,
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [typed, wantsSearch]);

  const groups = useMemo(() => (asURL || !results ? [] : groupResults(results.list, results.q, types)), [asURL, results, types]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const optionCount = asURL ? 1 : flat.length;
  const activeIndex = Math.min(active, Math.max(optionCount - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector("[data-active]")?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const pick = (t: Target, pageTitle?: string) => {
    setTarget(t);
    setQuery("");
    setError(null);
    if (!text.trim() && pageTitle) setText(pageTitle);
  };
  const pickNode = (n: NodeSearchResult) => pick({ url: n.full_url!, title: n.title, type: n.node_type, thumb: thumbURL(n.featured_image) }, n.title);
  const pickActive = () => {
    if (asURL) pick({ url: asURL, title: "" });
    else if (flat[activeIndex]) pickNode(flat[activeIndex]);
  };

  const change = () => {
    const info = target ? linkInfo(target.url) : null;
    setQuery(info && info.kind !== "page" && info.kind !== "anchor" ? target!.url : "");
    setTarget(null);
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = () => {
    const url = target ? target.url : typed === "" ? "" : asURL;
    if (url === null) {
      setError("Pick a page from the list, or type a full address like https://example.com.");
      inputRef.current?.focus();
      return;
    }
    onSave({ text: text.trim(), url, alt: alt.trim(), target: newTab ? "_blank" : "" });
  };

  const isNew = !initial.url && !initial.text;
  const loading = wantsSearch && results?.q !== typed;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="top-[12vh] flex max-h-[80vh] translate-y-0 flex-col gap-5 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add link" : "Edit link"}</DialogTitle>
          {title && <DialogDescription>{title}</DialogDescription>}
        </DialogHeader>

        <div className="-mx-1 flex min-h-0 flex-col gap-5 overflow-x-hidden overflow-y-auto px-1 pb-1">
          <div className="flex flex-col" style={{ gap: 6 }}>
            <Label htmlFor="link-field-url">Link to</Label>
            {target ? (
              <PickedTarget target={target} types={types} onChange={change} />
            ) : (
              <div data-slot="combo" data-error={error ? "" : undefined}>
                <div data-slot="combo-search">
                  <Search size={16} aria-hidden />
                  <input
                    ref={inputRef}
                    id="link-field-url"
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
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActive(Math.min(activeIndex + 1, optionCount - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActive(Math.max(activeIndex - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (optionCount) pickActive();
                        else submit();
                      } else if (e.key === "Escape" && initial.url && !query) {
                        e.preventDefault();
                        e.stopPropagation();
                        setTarget({ url: initial.url, title: "" });
                      }
                    }}
                    role="combobox"
                    aria-expanded
                    aria-controls="link-field-results"
                  />
                  {loading && typed ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
                  {query && (
                    <button type="button" data-slot="icon-button" data-size="sm" onClick={() => (setQuery(""), inputRef.current?.focus())} aria-label="Clear" title="Clear">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div data-slot="combo-results" id="link-field-results" role="listbox" ref={listRef}>
                  {asURL ? (
                    <ResultRow
                      active
                      Icon={KIND_ICON[linkInfo(asURL).kind]}
                      title={`Link to ${linkInfo(asURL).detail}`}
                      detail={linkInfo(asURL).label}
                      onPick={() => pick({ url: asURL, title: "" })}
                      onHover={() => setActive(0)}
                    />
                  ) : flat.length === 0 ? (
                    <div data-slot="combo-empty">
                      {loading ? "Searching…" : typed ? <>Nothing on the site matches “{typed}”. Paste a full address to link somewhere else.</> : "No pages yet."}
                    </div>
                  ) : (
                    groups.map((g) => (
                      <div key={g.key} role="group" aria-label={g.label}>
                        <div data-slot="combo-group">{typed ? g.label : "Pages"}</div>
                        {g.items.map((n) => {
                          const i = flat.indexOf(n);
                          return (
                            <ResultRow
                              key={n.id}
                              active={i === activeIndex}
                              Icon={typeMeta(types, n.node_type).Icon}
                              title={n.title}
                              detail={n.full_url!}
                              muted={n.status !== "published" ? n.status : undefined}
                              onPick={() => pickNode(n)}
                              onHover={() => setActive(i)}
                            />
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
                <div data-slot="combo-foot">
                  <span>
                    <kbd>↑</kbd>
                    <kbd>↓</kbd> to move
                  </span>
                  <span>
                    <kbd>↵</kbd> to pick
                  </span>
                  <span data-slot="combo-hint">Works with URLs, emails and phone numbers too</span>
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm" style={{ color: "var(--danger)" }}>
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col" style={{ gap: 6 }}>
            <Label htmlFor="link-field-text">Text</Label>
            <Input
              id="link-field-text"
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

          <div className="flex items-center justify-between" style={{ gap: 10 }}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Switch checked={newTab} onCheckedChange={setNewTab} />
              Open in a new tab
            </label>
            {!showMore && (
              <button type="button" data-slot="text-action" onClick={() => setShowMore(true)}>
                Add a tooltip
              </button>
            )}
          </div>
          {showMore && (
            <div className="flex flex-col" style={{ gap: 6 }}>
              <Label htmlFor="link-field-alt">
                Tooltip <span style={{ fontWeight: 400, color: "var(--fg-hint)" }}>optional</span>
              </Label>
              <Input id="link-field-alt" placeholder="Shown on hover and read by screen readers" value={alt} onChange={(e) => setAlt(e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter className="items-center border-t pt-4" style={{ borderColor: "var(--border)" }}>
          {onRemove && (
            <Button type="button" variant="ghost" className="sm:mr-auto" style={{ color: "var(--danger)" }} onClick={onRemove}>
              Remove link
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            {isNew ? "Add link" : "Save link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  active,
  Icon,
  title,
  detail,
  muted,
  onPick,
  onHover,
}: {
  active: boolean;
  Icon: LucideIcon | IconComponent;
  title: string;
  detail: string;
  muted?: string;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <button type="button" role="option" aria-selected={active} data-slot="link-result" data-active={active || undefined} onMouseMove={onHover} onClick={onPick}>
      <Icon size={16} aria-hidden />
      <span data-slot="link-result-title">{title}</span>
      {muted && <span data-slot="link-result-status">{muted}</span>}
      <span data-slot="link-result-path">
        <bdi>{detail}</bdi>
      </span>
      <CornerDownLeft size={14} data-slot="link-result-enter" aria-hidden />
    </button>
  );
}

function PickedTarget({ target, types, onChange }: { target: Target; types: Map<string, TypeMeta>; onChange: () => void }) {
  const info = linkInfo(target.url);
  const found = usePage(target.title ? "" : target.url);
  const nodeType = target.type ?? found?.node_type;
  const meta = nodeType ? typeMeta(types, nodeType) : null;
  const Icon = meta?.Icon ?? KIND_ICON[info.kind];
  const name = target.title || found?.title || info.detail;
  const thumb = target.thumb ?? (found ? thumbURL(found.featured_image) : "");
  return (
    <div data-slot="link-picked" data-kind={info.kind}>
      {thumb ? (
        <Thumb src={thumb} label={name} />
      ) : (
        <span data-slot="link-icon" aria-hidden>
          <Icon size={17} />
        </span>
      )}
      <span data-slot="link-text">
        <span data-slot="link-title">{name}</span>
        <span data-slot="link-meta">
          <span data-slot="link-kind">{meta?.label ?? info.label}</span>
          <span data-slot="link-url">{info.detail}</span>
        </span>
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onChange} autoFocus>
        Change
      </Button>
    </div>
  );
}
