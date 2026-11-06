import { Zap, Copy, Download, Trash2, Check, AlertTriangle } from "@squilla/icons";
import {
  MediaFile,
  isImage,
  humanFileSize,
  imageSize,
  savedPercent,
  MediaImage,
  FileTypeIcon,
  getFileExtension,
} from "./helpers";
import SelectCheck from "./SelectCheck";

type Density = "compact" | "comfy" | "spacious";

interface GridCardProps {
  file: MediaFile;
  selected: boolean;
  copyState: number | null;
  onOpen: (f: MediaFile) => void;
  onToggle: (id: number, e: React.MouseEvent) => void;
  onCopy: (f: MediaFile) => void;
  onDownload: (f: MediaFile) => void;
  onDelete: (f: MediaFile) => void;
}

function GridCard({ file, selected, copyState, onOpen, onToggle, onCopy, onDownload, onDelete }: GridCardProps) {
  const img = isImage(file.mime_type);
  const optimizable = img && file.mime_type !== "image/svg+xml";
  const pct = savedPercent(file);

  // One flat card: solid backgrounds and no backdrop-blur on the overlays.
  // Blurred per-card overlays at ~30 cards made Chrome drop frames (tiles
  // vanished on first paint), so the overlays stay solid. Hover/selection
  // states live in index.css ([data-mm="card"]).
  return (
    <div
      data-mm="card"
      data-selected={selected || undefined}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${file.original_name}`}
      onClick={() => onOpen(file)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(file);
        }
      }}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 3", background: "var(--sub-bg)" }}>
        {img ? (
          <MediaImage
            src={imageSize(file.url, "medium", file.updated_at)}
            alt={file.alt || file.original_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2">
              <FileTypeIcon mime={file.mime_type} className="h-8 w-8 text-[var(--fg-subtle)]" />
              <span
                style={{
                  padding: "1px 8px",
                  borderRadius: 999,
                  background: "var(--card-bg)",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                }}
              >
                {getFileExtension(file.original_name)}
              </span>
            </div>
          </div>
        )}

        {/* Checkbox: on hover, while selected, and always on touch screens */}
        <div
          data-mm="reveal-check"
          className="absolute top-2 left-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(file.id, e);
          }}
        >
          <SelectCheck checked={selected} size={22} label={`Select ${file.original_name}`} />
        </div>

        {/* Facts on hover: dimensions and what optimization saved */}
        {(file.width && file.height) || optimizable ? (
          <div data-mm="reveal" className="absolute top-2 right-2 flex items-center gap-1">
            {optimizable &&
              (file.is_optimized ? (
                pct > 0 && (
                  <span data-mm="chip" title={`Optimized, saved ${humanFileSize(file.optimization_savings)}`}>
                    <Zap className="h-3 w-3" /> −{pct}%
                  </span>
                )
              ) : (
                <span data-mm="chip" title="Not optimized yet">
                  Original
                </span>
              ))}
            {file.width && file.height && (
              <span data-mm="chip">
                {file.width}×{file.height}
              </span>
            )}
          </div>
        ) : null}

        {/* Quick actions on hover */}
        <div
          data-mm="actions"
          className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" data-mm="overlay-btn" className="flex-1" onClick={() => onCopy(file)}>
            {copyState === file.id ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy URL
              </>
            )}
          </button>
          <button
            type="button"
            data-mm="overlay-btn"
            onClick={() => onDownload(file)}
            title="Download"
            aria-label={`Download ${file.original_name}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-mm="overlay-btn"
            data-tone="danger"
            onClick={() => onDelete(file)}
            title="Delete"
            aria-label={`Delete ${file.original_name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div style={{ padding: "9px 12px 11px", borderTop: "1px solid var(--divider)" }}>
        <p
          className="truncate"
          title={file.original_name}
          style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", lineHeight: 1.35, margin: 0 }}
        >
          {file.original_name}
        </p>
        <div
          className="flex items-center min-w-0"
          style={{ gap: 6, marginTop: 3, fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.35 }}
        >
          <span className="shrink-0 tabular-nums">{humanFileSize(file.size)}</span>
          {file.alt ? (
            <>
              <span aria-hidden style={{ color: "var(--fg-hint)" }}>·</span>
              <span className="truncate" title={file.alt}>
                {file.alt}
              </span>
            </>
          ) : img ? (
            <>
              <span aria-hidden style={{ color: "var(--fg-hint)" }}>·</span>
              <span
                className="flex items-center shrink-0"
                style={{ gap: 4, color: "var(--warning)", fontWeight: 500 }}
                title="Add alt text for screen readers and search engines"
              >
                <AlertTriangle className="h-3 w-3" /> No alt text
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface MediaGridProps {
  files: MediaFile[];
  selected: Set<number>;
  copyState: number | null;
  density: Density;
  onOpen: (f: MediaFile) => void;
  onToggle: (id: number, e: React.MouseEvent) => void;
  onCopy: (f: MediaFile) => void;
  onDownload: (f: MediaFile) => void;
  onDelete: (f: MediaFile) => void;
}

// Desktop column counts: spacious=4, comfy=5, compact=6.
// PER_PAGE_BY_DENSITY in MediaLibrary.tsx is sized so each density yields a
// full grid (multiple complete rows) at the lg breakpoint and up.
const COL_CLASSES: Record<Density, string> = {
  compact: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
  comfy: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  spacious: "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4",
};

export default function MediaGrid({
  files,
  selected,
  copyState,
  density,
  onOpen,
  onToggle,
  onCopy,
  onDownload,
  onDelete,
}: MediaGridProps) {
  return (
    <div className={`grid ${COL_CLASSES[density]} ${density === "compact" ? "gap-3" : "gap-4"}`}>
      {files.map((f) => (
        <GridCard
          key={f.id}
          file={f}
          selected={selected.has(f.id)}
          copyState={copyState}
          onOpen={onOpen}
          onToggle={onToggle}
          onCopy={onCopy}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export type { Density };
