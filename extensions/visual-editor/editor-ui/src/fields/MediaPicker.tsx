import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { listMedia, type MediaItem } from "../api";
import { Glyph, Modal, SearchInput } from "../ui";

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
  const [selected, setSelected] = useState<number[]>([]);
  const multi = mode === "gallery";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(() => {
      listMedia({ search, mime: mode === "file" ? undefined : "image", perPage: 80 })
        .then((res) => {
          if (cancelled) return;
          setItems(res);
          setError(null);
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

  const toggle = (item: MediaItem): void => {
    if (!multi) {
      onPick([item]);
      return;
    }
    setSelected((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
  };

  const title = mode === "gallery" ? "Add images" : mode === "image" ? "Choose an image" : "Choose a file";

  return (
    <Modal
      title={title}
      subtitle="From the media library"
      size="lg"
      onClose={onCancel}
      footer={
        multi ? (
          <>
            <span className="vedit-modal-count">{selected.length ? `${selected.length} selected` : "Click images to select them"}</span>
            <button type="button" className="vedit-btn" data-variant="secondary" onClick={onCancel}>Cancel</button>
            <button
              type="button"
              className="vedit-btn"
              data-variant="primary"
              disabled={selected.length === 0}
              onClick={() => onPick(selected.map((id) => items.find((m) => m.id === id)).filter((m): m is MediaItem => !!m))}
            >
              Add {selected.length || ""} {selected.length === 1 ? "image" : "images"}
            </button>
          </>
        ) : undefined
      }
    >
      <SearchInput value={search} onChange={setSearch} placeholder="Search by file name…" autoFocus />
      {error && <div className="vedit-alert" data-tone="danger">{error}</div>}
      {loading && items.length === 0 ? (
        <p className="vedit-empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="vedit-empty">{search ? `Nothing matches “${search}”.` : "The media library is empty."}</p>
      ) : (
        <div className="vedit-media-grid">
          {items.map((m) => {
            const isImage = (m.mime_type || "").startsWith("image/");
            const order = selected.indexOf(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className="vedit-media-tile"
                data-selected={order >= 0 || undefined}
                onClick={() => toggle(m)}
                title={m.original_name ?? m.url}
              >
                <span className="vedit-media-preview">
                  {isImage ? <img src={m.url} alt={m.alt_text ?? ""} loading="lazy" /> : <Glyph name="file" size={28} strokeWidth={1.5} />}
                  {multi && order >= 0 && <span className="vedit-media-check">{order + 1}</span>}
                </span>
                <span className="vedit-media-name">{m.original_name ?? `#${m.id}`}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function fileName(url: string): string {
  try {
    return decodeURIComponent(url.split("?")[0]!.split("/").pop() || url);
  } catch {
    return url;
  }
}

/** image field — stores {id, url, alt, width, height}. */
export function ImageField({ value, onChange, openSignal }: { value: unknown; onChange: (next: unknown) => void; openSignal?: number }): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  // The page's "Replace image" button opens the picker from outside.
  useEffect(() => {
    if (openSignal) setPicking(true);
  }, [openSignal]);
  const v = (typeof value === "object" && value !== null ? value : {}) as {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
    id?: number;
  };
  // A bare URL string (older content, theme-asset refs) still previews.
  const url = typeof value === "string" ? value : v.url;

  return (
    <>
      {url ? (
        <div className="vedit-image-card">
          <button type="button" className="vedit-image-thumb" onClick={() => setPicking(true)} title="Replace image">
            {url.startsWith("theme-asset:") ? <Glyph name="image" size={22} strokeWidth={1.6} /> : <img src={url} alt={v.alt ?? ""} />}
          </button>
          <div className="vedit-image-meta">
            <span className="vedit-image-name" title={url}>
              {fileName(url)}
              {v.width && v.height ? <span className="vedit-image-dims">{v.width}×{v.height}</span> : null}
            </span>
            {typeof value === "object" && value !== null && (
              <input type="text" className="vedit-input" data-size="sm" placeholder="Alt text — describe the image" value={v.alt ?? ""} onChange={(e) => onChange({ ...v, alt: e.target.value })} />
            )}
            <div className="vedit-inline-actions">
              <button type="button" className="vedit-btn" data-variant="secondary" data-size="sm" onClick={() => setPicking(true)}>Replace</button>
              <button type="button" className="vedit-btn" data-variant="ghost-danger" data-size="sm" onClick={() => onChange(null)}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="vedit-media-empty" onClick={() => setPicking(true)}>
          <Glyph name="image" size={18} strokeWidth={1.7} />
          Choose image
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
    </>
  );
}

/** file field — stores {id, url, name}. */
export function FileField({ value, onChange }: { value: unknown; onChange: (next: unknown) => void }): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const v = (typeof value === "object" && value !== null ? value : {}) as { url?: string; name?: string; id?: number };

  return (
    <>
      {v.url ? (
        <div className="vedit-file-card">
          <span className="vedit-file-icon"><Glyph name="file" size={18} strokeWidth={1.7} /></span>
          <a className="vedit-file-name" href={v.url} target="_blank" rel="noreferrer" title="Open file">{v.name || fileName(v.url)}</a>
          <button type="button" className="vedit-btn" data-variant="secondary" data-size="sm" onClick={() => setPicking(true)}>Replace</button>
          <button type="button" className="vedit-icon-btn" data-size="sm" data-tone="danger" onClick={() => onChange(null)} title="Remove file" aria-label="Remove file">
            <Glyph name="x" size={15} />
          </button>
        </div>
      ) : (
        <button type="button" className="vedit-media-empty" onClick={() => setPicking(true)}>
          <Glyph name="file" size={18} strokeWidth={1.7} />
          Choose file
        </button>
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
    </>
  );
}

/** gallery field — stores an array of image objects. */
export function GalleryField({ value, onChange }: { value: unknown; onChange: (next: unknown) => void }): React.JSX.Element {
  const [picking, setPicking] = useState(false);
  const items = useMemo<Array<Record<string, unknown>>>(
    () => (Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []),
    [value],
  );
  const move = (i: number, d: -1 | 1): void => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="vedit-gallery-field">
      {items.length > 0 && (
        <div className="vedit-gallery">
          {items.map((it, i) => {
            const url = typeof it.url === "string" ? it.url : "";
            return (
              <div key={`${url}-${i}`} className="vedit-gallery-tile">
                {url && <img src={url} alt={typeof it.alt === "string" ? it.alt : ""} />}
                <span className="vedit-gallery-actions">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" title="Move earlier"><Glyph name="arrow-up" size={12} style={{ transform: "rotate(-90deg)" }} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later" title="Move later"><Glyph name="arrow-down" size={12} style={{ transform: "rotate(-90deg)" }} /></button>
                  <button type="button" data-tone="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove image" title="Remove"><Glyph name="x" size={12} /></button>
                </span>
              </div>
            );
          })}
        </div>
      )}
      <button type="button" className="vedit-add-button" data-size="sm" onClick={() => setPicking(true)}>
        <Glyph name="plus" size={15} />
        {items.length ? "Add more images" : "Add images"}
      </button>
      {picking && (
        <MediaPicker
          mode="gallery"
          onPick={(picked) => {
            onChange([...items, ...picked.map((m) => ({ id: m.id, url: m.url, alt: m.alt_text ?? "", width: m.width, height: m.height }))]);
            setPicking(false);
          }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}
