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
  const showOptimized = file.is_optimized && isImage(file.mime_type);
  const pct = savedPercent(file);
  const badgeHide = selected ? "opacity-0" : "opacity-100 group-hover:opacity-0";

  // Card chrome: solid bg, single ring border, transition only the box-shadow.
  // Previous implementation stacked `ring-1 + ring-2 + ring-offset + shadow-md
  // + transition-all` on every card AND `backdrop-blur-sm` on six per-card
  // overlays (orig/opt/dimensions/copy/download/delete). At ~30 cards that
  // hit ~180 GPU compositor layers on first paint, which Chrome handled by
  // dropping frames — the "entire UI desaturates and tiles vanish" flash.
  // Solid backgrounds (no /95 + backdrop-blur), one ring, and a targeted
  // box-shadow transition keep the look identical without the GPU storm.
  return (
    <div
      onClick={() => onOpen(file)}
      className={`group relative flex flex-col overflow-hidden rounded-xl cursor-pointer bg-card ${
        selected
          ? "ring-2 ring-indigo-500 shadow-md"
          : "ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md"
      }`}
      style={{ transition: "box-shadow 120ms ease" }}
    >
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "4 / 3" }}>
        {isImage(file.mime_type) ? (
          <MediaImage
            src={imageSize(file.url, "medium", file.updated_at)}
            alt={file.alt || file.original_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2">
              <FileTypeIcon mime={file.mime_type} className="h-8 w-8 text-muted-foreground" />
              <span className="rounded-md bg-border/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {getFileExtension(file.original_name)}
              </span>
            </div>
          </div>
        )}

        {/* Top-left: optimization badge (hides when checkbox slot needed) */}
        {showOptimized ? (
          <div
            className={`absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full pl-1 pr-1.5 py-0.5 text-white shadow-sm transition-opacity ${badgeHide}`}
            style={{ background: "rgb(16, 185, 129)" }}
            title={`Optimized — saved ${humanFileSize(file.optimization_savings)}`}
          >
            <Zap className="h-2.5 w-2.5" strokeWidth={2.5} />
            <span className="text-[9px] font-bold leading-none tabular-nums">−{pct || 1}%</span>
          </div>
        ) : isImage(file.mime_type) && file.mime_type !== "image/svg+xml" ? (
          <div
            className={`absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-white text-[9px] font-medium transition-opacity ${badgeHide}`}
            style={{ background: "rgba(15, 23, 42, 0.75)" }}
            title="Original — not optimized"
          >
            orig
          </div>
        ) : null}

        {/* Top-right: dimensions chip on hover */}
        {file.width && file.height && (
          <div
            className="absolute top-1.5 right-1.5 rounded-md px-1.5 py-0.5 text-white text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity tabular-nums"
            style={{ background: "rgba(15, 23, 42, 0.8)" }}
          >
            {file.width}×{file.height}
          </div>
        )}

        {/* Top-left checkbox — visible on hover or when selected */}
        <div
          className={`absolute top-1.5 left-1.5 z-10 transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(file.id, e);
          }}
        >
          <SelectCheck checked={selected} size={20} />
        </div>

        {/* Hover quick-actions — solid backgrounds, no backdrop-blur */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center gap-1 px-1.5 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onCopy(file)}
            className="flex-1 h-7 rounded-md bg-card hover:bg-muted text-foreground text-[10.5px] font-medium shadow-sm border border-border flex items-center justify-center gap-1 cursor-pointer"
            title="Copy URL"
          >
            {copyState === file.id ? (
              <>
                <Check className="h-3 w-3 text-emerald-700" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy URL
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onDownload(file)}
            className="h-7 w-7 grid place-items-center rounded-md bg-card hover:bg-muted text-foreground shadow-sm border border-border cursor-pointer"
            title="Download"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(file)}
            className="h-7 w-7 grid place-items-center rounded-md bg-card hover:bg-muted text-red-600 shadow-sm border border-border cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="px-2.5 py-2 border-t border-border">
        <p className="truncate text-[12px] font-medium text-foreground leading-tight">{file.original_name}</p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground tabular-nums font-mono shrink-0">{humanFileSize(file.size)}</p>
          {file.alt ? (
            <span className="text-[9.5px] text-muted-foreground truncate italic" title={file.alt}>
              “{file.alt}”
            </span>
          ) : isImage(file.mime_type) ? (
            <span className="text-[9.5px] text-amber-700 font-medium flex items-center gap-0.5 shrink-0">
              <AlertTriangle className="h-2.5 w-2.5" /> no alt
            </span>
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

const COL_CLASSES: Record<Density, string> = {
  compact: "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9",
  comfy: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7",
  spacious: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
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
    <div className={`grid ${COL_CLASSES[density]} gap-3`}>
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
