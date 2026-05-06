import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { listMedia, type MediaItem } from "../api";

interface PickerProps {
  /** "image" → only picks images, "file" → any, "gallery" → image multi-select. */
  mode: "image" | "file" | "gallery";
  onPick: (items: MediaItem[]) => void;
  onCancel: () => void;
}

export function MediaPicker({ mode, onPick, onCancel }: PickerProps): React.JSX.Element {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(() => {
      listMedia({ search, mime: mode === "image" || mode === "gallery" ? "image" : undefined, perPage: 80 })
        .then((res) => {
          if (cancelled) return;
          setItems(res);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError((err as Error).message);
          setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [search, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const multi = mode === "gallery";

  const toggle = (id: number): void => {
    if (!multi) {
      const item = items.find((m) => m.id === id);
      if (item) onPick([item]);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmMulti = (): void => {
    const picked = items.filter((m) => selected.has(m.id));
    if (picked.length > 0) onPick(picked);
  };

  return (
    <div className="vedit-modal-backdrop" onClick={onCancel}>
      <div className="vedit-modal vedit-media-modal" onClick={(e) => e.stopPropagation()}>
        <header className="vedit-modal-header">
          <span className="vedit-modal-title">
            {mode === "gallery" ? "Pick images" : mode === "image" ? "Pick image" : "Pick file"}
          </span>
          <button type="button" className="vedit-link" onClick={onCancel}>Cancel</button>
        </header>
        <input
          type="search"
          className="vedit-input"
          placeholder="Search media…"
          value={search}
          autoFocus
          onChange={(e) => setSearch(e.target.value)}
        />
        {error && <div className="vedit-error">{error}</div>}
        {loading && items.length === 0 && <p className="vedit-empty">Loading…</p>}
        {!loading && items.length === 0 && <p className="vedit-empty">No media found.</p>}
        <div className="vedit-media-grid">
          {items.map((m) => {
            const isImage = (m.mime_type || "").startsWith("image/");
            const checked = selected.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className="vedit-media-tile"
                data-selected={checked ? "true" : "false"}
                onClick={() => toggle(m.id)}
                title={m.original_name ?? m.url}
              >
                {isImage ? (
                  <img src={m.url} alt={m.alt_text ?? ""} loading="lazy" />
                ) : (
                  <span className="vedit-media-fileicon">📄</span>
                )}
                <span className="vedit-media-name">{m.original_name ?? `#${m.id}`}</span>
              </button>
            );
          })}
        </div>
        {multi && (
          <footer className="vedit-modal-footer">
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={onCancel}>Cancel</button>
            <button
              type="button"
              className="vedit-btn"
              data-variant="primary"
              onClick={confirmMulti}
              disabled={selected.size === 0}
            >
              Add {selected.size} item{selected.size === 1 ? "" : "s"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

interface ImageFieldProps {
  value: unknown;
  onChange: (next: unknown) => void;
}

/** image field — stores {url, alt, width, height, id?}. */
export function ImageField({ value, onChange }: ImageFieldProps): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const v = (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}) as {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
    id?: number;
  };

  return (
    <div className="vedit-image-field">
      {v.url ? (
        <div className="vedit-image-preview">
          <img src={v.url} alt={v.alt ?? ""} />
          <div className="vedit-image-meta">
            <input
              type="text"
              className="vedit-input"
              placeholder="Alt text"
              value={v.alt ?? ""}
              onChange={(e) => onChange({ ...v, alt: e.target.value })}
            />
            <div className="vedit-actions-row">
              <button type="button" className="vedit-btn" data-variant="secondary" onClick={() => setPicking(true)}>Replace</button>
              <button type="button" className="vedit-btn" data-variant="danger" onClick={() => onChange(null)}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="vedit-add-block" onClick={() => setPicking(true)}>
          + Pick image
        </button>
      )}
      {picking && (
        <MediaPicker
          mode="image"
          onPick={(items) => {
            const m = items[0];
            if (m) onChange({ id: m.id, url: m.url, alt: m.alt_text ?? "", width: m.width, height: m.height });
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}

interface FileFieldProps {
  value: unknown;
  onChange: (next: unknown) => void;
}

/** file field — stores {url, name, size?, mime?, id?}. */
export function FileField({ value, onChange }: FileFieldProps): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const v = (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}) as {
    url?: string;
    name?: string;
    id?: number;
  };

  return (
    <div>
      {v.url ? (
        <div className="vedit-field-unsupported">
          <div className="vedit-field-unsupported-summary">📄 {v.name ?? v.url}</div>
          <div className="vedit-actions-row">
            <a href={v.url} target="_blank" rel="noreferrer" className="vedit-link">Open ↗</a>
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={() => setPicking(true)}>Replace</button>
            <button type="button" className="vedit-btn" data-variant="danger" onClick={() => onChange(null)}>Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" className="vedit-add-block" onClick={() => setPicking(true)}>+ Pick file</button>
      )}
      {picking && (
        <MediaPicker
          mode="file"
          onPick={(items) => {
            const m = items[0];
            if (m) onChange({ id: m.id, url: m.url, name: m.original_name ?? "" });
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}

interface GalleryFieldProps {
  value: unknown;
  onChange: (next: unknown) => void;
}

/** gallery field — stores array of image objects. */
export function GalleryField({ value, onChange }: GalleryFieldProps): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const items = useMemo<Array<Record<string, unknown>>>(
    () => (Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []),
    [value],
  );

  const remove = (idx: number): void => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="vedit-gallery-grid">
        {items.map((it, i) => {
          const url = (it.url as string) ?? "";
          return (
            <div key={i} className="vedit-gallery-tile">
              {url && <img src={url} alt={(it.alt as string) ?? ""} />}
              <button type="button" className="vedit-gallery-remove" onClick={() => remove(i)} aria-label="Remove">×</button>
            </div>
          );
        })}
      </div>
      <button type="button" className="vedit-add-block" onClick={() => setPicking(true)}>+ Add images</button>
      {picking && (
        <MediaPicker
          mode="gallery"
          onPick={(picked) => {
            const additions = picked.map((m) => ({ id: m.id, url: m.url, alt: m.alt_text ?? "", width: m.width, height: m.height }));
            onChange([...items, ...additions]);
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}
