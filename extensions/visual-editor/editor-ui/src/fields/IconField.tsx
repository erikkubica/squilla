import * as React from "react";
import { useEffect, useState } from "react";
import { getIconProviders, lookupIcons, searchIcons, type IconItem, type IconProvider } from "../api";
import { Glyph, KernelSvg, Modal, SearchInput } from "../ui";

// Icons come from the kernel (GET /admin/api/icons), which serves the
// sets compiled into the binary — nothing from a CDN, and no icon data
// in this bundle.

const LEGACY_PROVIDER = "material";
const PER_PAGE = 96;

/** Bare legacy values ("restaurant") are Material Symbols names. */
export function normalizeIconValue(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return v.includes(":") ? v : `${LEGACY_PROVIDER}:${v}`;
}

const lookupCache = new Map<string, IconItem | null>();
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

/** Resolves stored icon values to SVG markup, batching unknown ones. */
export function useIconLookup(values: string[]): Map<string, IconItem | null> {
  const key = values.map(normalizeIconValue).filter(Boolean).sort().join(",");
  const [, bump] = useState(0);
  useEffect(() => {
    const missing = key ? key.split(",").filter((v) => !lookupCache.has(v)) : [];
    if (missing.length === 0) return;
    let cancelled = false;
    lookupIcons(missing)
      .then((found) => {
        const byValue = new Map(found.map((ic) => [ic.value, ic]));
        for (const v of missing) lookupCache.set(v, byValue.get(v) ?? null);
        if (!cancelled) bump((n) => n + 1);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key]);
  return lookupCache;
}

export function IconField({
  value,
  onChange,
  providers,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  providers?: string[];
  label: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const normalized = normalizeIconValue(value);
  const cache = useIconLookup(normalized ? [normalized] : []);
  const icon = normalized ? cache.get(normalized) : null;
  const unknown = normalized !== "" && cache.has(normalized) && icon === null;

  return (
    <div className="vedit-icon-field">
      <button type="button" className="vedit-icon-trigger" onClick={() => setOpen(true)} title="Choose an icon" aria-label={value ? `Change ${label} (${value})` : `Choose ${label}`}>
        {icon ? <KernelSvg svg={icon.svg} /> : <Glyph name="shapes" size={18} strokeWidth={1.7} />}
      </button>
      <span className="vedit-icon-name" data-unknown={unknown || undefined}>
        {value ? (unknown ? `${value} — not found` : (icon?.name ?? value)) : "No icon"}
        {icon && <span className="vedit-icon-provider">{icon.provider}</span>}
      </span>
      <button type="button" className="vedit-btn" data-variant="secondary" data-size="sm" onClick={() => setOpen(true)}>
        {value ? "Change" : "Choose"}
      </button>
      {value && (
        <button type="button" className="vedit-icon-btn" data-size="sm" onClick={() => onChange("")} aria-label="Clear icon" title="Clear">
          <Glyph name="x" size={15} />
        </button>
      )}
      {open && (
        <IconPicker
          current={normalized}
          allowed={providers}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function IconPicker({
  current,
  allowed,
  onPick,
  onClose,
}: {
  current: string;
  allowed?: string[];
  onPick: (value: string) => void;
  onClose: () => void;
}): React.JSX.Element {
  const [providers, setProviders] = useState<IconProvider[] | null>(null);
  const [provider, setProvider] = useState<string>(() => (current.includes(":") ? current.split(":")[0]! : ""));
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders()
      .then((all) => {
        const list = allowed && allowed.length ? all.filter((p) => allowed.includes(p.id)) : all;
        setProviders(list);
        setProvider((cur) => (list.some((p) => p.id === cur) ? cur : list[0]?.id ?? ""));
      })
      .catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      searchIcons(provider, query.trim(), page, PER_PAGE)
        .then((res) => {
          if (cancelled) return;
          for (const ic of res.icons) lookupCache.set(ic.value, ic);
          setIcons((prev) => (page === 1 ? res.icons : [...prev, ...res.icons]));
          setTotal(res.total);
          setError(null);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setError((e as Error).message);
          setLoading(false);
        });
    }, page === 1 ? 180 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [provider, query, page]);

  return (
    <Modal title="Choose an icon" size="md" onClose={onClose} className="vedit-icon-modal">
      {providers && providers.length > 1 && (
        <div className="vedit-tabs" role="tablist">
          {providers.map((p) => (
            <button key={p.id} type="button" role="tab" className="vedit-tab" aria-selected={p.id === provider} data-active={p.id === provider} onClick={() => { setProvider(p.id); setPage(1); }}>
              {p.label}
              <span className="vedit-tab-count">{p.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}
      <SearchInput value={query} onChange={(q) => { setQuery(q); setPage(1); }} placeholder="Search icons (e.g. map, food, phone)" autoFocus onEnter={() => icons[0] && onPick(icons[0].value)} />
      {error && <div className="vedit-alert" data-tone="danger">{error}</div>}
      <div className="vedit-icon-scroll">
        {icons.length === 0 ? (
          <p className="vedit-empty">{loading ? "Loading…" : query ? `No icons match “${query}”.` : "No icons."}</p>
        ) : (
          <div className="vedit-icon-grid">
            {icons.map((ic) => (
              <button key={ic.value} type="button" className="vedit-icon-cell" data-selected={ic.value === current || undefined} title={ic.name} aria-label={ic.name} onClick={() => onPick(ic.value)}>
                <KernelSvg svg={ic.svg} />
              </button>
            ))}
          </div>
        )}
        {icons.length > 0 && icons.length < total && (
          <button type="button" className="vedit-add-button" data-size="sm" disabled={loading} onClick={() => setPage((p) => p + 1)}>
            {loading ? "Loading…" : `Show more (${(total - icons.length).toLocaleString()} left)`}
          </button>
        )}
      </div>
    </Modal>
  );
}
