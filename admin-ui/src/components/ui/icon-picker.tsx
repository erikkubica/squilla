import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Shapes, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getIconProviders,
  lookupIcons,
  searchIcons,
  type IconItem,
  type IconProvider,
} from "@/api/client";

// Icons are served by the kernel (GET /admin/api/icons) so the admin bundle
// carries no icon data. The SVG markup is generated server-side from the
// embedded icon sets — never from user input — so it is safe to inject.

const PER_PAGE = 120;
const LEGACY_PROVIDER = "material";

/** Normalises a stored value: bare legacy names are Material Symbols. */
function normalizeIconValue(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return v.includes(":") ? v : `${LEGACY_PROVIDER}:${v}`;
}

// Session caches — icon data only changes when the kernel is upgraded.
let providersPromise: Promise<IconProvider[]> | null = null;
function loadProviders(): Promise<IconProvider[]> {
  if (!providersPromise) {
    providersPromise = getIconProviders().catch((err) => {
      providersPromise = null;
      throw err;
    });
  }
  return providersPromise;
}
const lookupCache = new Map<string, IconItem | null>();
const searchCache = new Map<string, Promise<{ icons: IconItem[]; total: number }>>();

function cachedSearch(provider: string, q: string, page: number) {
  const key = `${provider}|${q}|${page}`;
  let p = searchCache.get(key);
  if (!p) {
    p = searchIcons({ provider, q, page, per_page: PER_PAGE }).then((r) => {
      r.icons.forEach((ic) => lookupCache.set(ic.value, ic));
      return { icons: r.icons, total: r.total };
    });
    p.catch(() => searchCache.delete(key));
    searchCache.set(key, p);
  }
  return p;
}

function useIconLookup(value: string): { icon: IconItem | null; loading: boolean } {
  const normalized = normalizeIconValue(value);
  const [result, setResult] = useState<{ value: string; icon: IconItem | null } | null>(null);

  useEffect(() => {
    if (!normalized || lookupCache.has(normalized)) return;
    let cancelled = false;
    const t = setTimeout(() => {
      lookupIcons([normalized])
        .then((res) => {
          const found = res.find((ic) => ic.value === normalized) ?? null;
          lookupCache.set(normalized, found);
          if (!cancelled) setResult({ value: normalized, icon: found });
        })
        .catch(() => {
          if (!cancelled) setResult({ value: normalized, icon: null });
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [normalized]);

  if (!normalized) return { icon: null, loading: false };
  if (lookupCache.has(normalized)) return { icon: lookupCache.get(normalized) ?? null, loading: false };
  if (result?.value === normalized) return { icon: result.icon, loading: false };
  return { icon: null, loading: true };
}

function SvgBox({ svg, className }: { svg: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex items-center justify-center [&>svg]:h-full [&>svg]:w-full", className)}
      // Kernel-generated SVG from the embedded icon sets, not user input.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Small read-only preview of an icon value (used by settings renderers). */
export function IconPreview({ value, className }: { value: string; className?: string }) {
  const { icon } = useIconLookup(value);
  if (!icon) return null;
  return <SvgBox svg={icon.svg} className={className ?? "h-5 w-5"} />;
}

/**
 * Icon field input. Stores "provider:name" (e.g. "lucide:map-pin").
 * `providers` restricts the sets offered; empty = every bundled set.
 */
export function IconFieldInput({
  value,
  onChange,
  providers,
  name,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  providers?: string[];
  name?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const normalized = normalizeIconValue(value);
  const { icon, loading } = useIconLookup(value);
  const [provName, iconName] = normalized ? [normalized.split(":")[0], normalized.slice(normalized.indexOf(":") + 1)] : ["", ""];
  const missing = !!normalized && !loading && !icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Pick an icon"
            aria-label={normalized ? `Change icon (${normalized})` : "Pick an icon"}
            className={cn(
              "flex h-10 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-card text-foreground shadow-2xs hover:bg-muted",
              missing ? "border-[var(--warning)]" : "border-border",
            )}
          >
            {icon ? (
              <SvgBox svg={icon.svg} className="h-6 w-6" />
            ) : loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Shapes className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[392px] p-0" align="start">
          {open && (
            <IconPickerPanel
              allowed={providers}
              initialProvider={provName || undefined}
              selected={normalized}
              onPick={(v) => {
                onChange(v);
                setOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 cursor-pointer flex-col items-start text-left"
      >
        {normalized ? (
          <>
            <span className="truncate font-mono text-sm text-foreground">{iconName}</span>
            <span className="text-[11px]" style={missing ? { color: "var(--warning)" } : undefined}>
              {missing ? `Unknown icon in ${provName}` : provName}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Choose an icon…</span>
        )}
      </button>
      {normalized && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear icon"
          title="Clear"
          className="ml-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function IconPickerPanel({
  allowed,
  initialProvider,
  selected,
  onPick,
}: {
  allowed?: string[];
  initialProvider?: string;
  selected: string;
  onPick: (value: string) => void;
}) {
  const [all, setAll] = useState<IconProvider[] | null>(null);
  const [error, setError] = useState(false);
  const [chosenProvider, setProvider] = useState<string>("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const available = useMemo(() => {
    if (!all) return [];
    const allow = (allowed ?? []).filter(Boolean);
    return allow.length ? all.filter((p) => allow.includes(p.id)) : all;
  }, [all, allowed]);

  useEffect(() => {
    let cancelled = false;
    loadProviders()
      .then((p) => !cancelled && setAll(p))
      .catch(() => !cancelled && setError(true));
    searchRef.current?.focus();
    return () => {
      cancelled = true;
    };
  }, []);

  const provider = available.some((p) => p.id === chosenProvider)
    ? chosenProvider
    : ((available.find((p) => p.id === initialProvider) ?? available[0])?.id ?? "");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // First page whenever the provider or query changes; "Load more" appends.
  const searchKey = `${provider}|${debounced}`;
  const keyRef = useRef(searchKey);
  useEffect(() => {
    keyRef.current = searchKey;
  }, [searchKey]);

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    const key = `${provider}|${debounced}`;
    cachedSearch(provider, debounced, 1)
      .then((r) => {
        if (cancelled) return;
        setIcons(r.icons);
        setTotal(r.total);
        setPage(1);
        setError(false);
        gridRef.current?.scrollTo({ top: 0 });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, debounced]);

  const loading = loadingMore || (!!provider && loadedKey !== searchKey);

  const loadMore = () => {
    const key = searchKey;
    const next = page + 1;
    setLoadingMore(true);
    cachedSearch(provider, debounced, next)
      .then((r) => {
        if (keyRef.current !== key) return;
        setIcons((prev) => [...prev, ...r.icons]);
        setPage(next);
      })
      .catch(() => {
        if (keyRef.current === key) setError(true);
      })
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className="flex flex-col">
      <div className="space-y-2 border-b border-border p-2">
        {available.length > 1 && (
          <div className="flex gap-1" role="tablist" aria-label="Icon sets">
            {available.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={provider === p.id}
                onClick={() => setProvider(p.id)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  provider === p.id ? "bg-muted text-foreground ring-1 ring-border" : "text-muted-foreground hover:bg-muted",
                )}
                title={`${p.label} ${p.version} — ${p.license}, ${p.count} icons`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons (e.g. map, food, arrow)"
            className="h-8 rounded-md pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{provider ? available.find((p) => p.id === provider)?.label : ""}</span>
        <span>{total ? `${total} icons` : ""}</span>
      </div>
      <div ref={gridRef} className="h-[288px] overflow-y-auto p-1.5">
        {error && icons.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Could not load icons.</p>
        ) : icons.length === 0 && loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : icons.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No icons found.</p>
        ) : (
          <>
            <div className="grid grid-cols-8 gap-0.5">
              {icons.map((ic) => (
                <button
                  key={ic.value}
                  type="button"
                  title={ic.name}
                  aria-label={ic.name}
                  onClick={() => onPick(ic.value)}
                  className={cn(
                    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                    selected === ic.value && "bg-muted ring-1 ring-foreground/40",
                  )}
                >
                  <SvgBox svg={ic.svg} className="h-6 w-6" />
                </button>
              ))}
            </div>
            {icons.length < total && (
              <div className="flex justify-center py-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={loadMore}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Load more ({total - icons.length} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Field-editor control for the icon field's `providers` option. */
export function IconProvidersOption({
  value,
  onChange,
  disabled,
  labelClassName,
}: {
  value?: string[];
  onChange: (providers: string[] | undefined) => void;
  disabled?: boolean;
  labelClassName?: string;
}) {
  const [all, setAll] = useState<IconProvider[]>([]);
  useEffect(() => {
    loadProviders().then(setAll).catch(() => setAll([]));
  }, []);
  const selected = value ?? [];
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id];
    onChange(next.length ? next : undefined);
  };
  return (
    <div className="space-y-1.5">
      <span className={labelClassName ?? "text-xs font-medium text-muted-foreground"}>Icon sets (none selected = all)</span>
      <div className="flex flex-wrap gap-1.5">
        {all.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(p.id)}
            aria-pressed={selected.includes(p.id)}
            className={cn(
              "cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              selected.includes(p.id) ? "border-foreground/40 bg-muted text-foreground" : "border-border text-muted-foreground hover:bg-muted",
            )}
            title={`${p.license}, ${p.count} icons`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default IconFieldInput;
