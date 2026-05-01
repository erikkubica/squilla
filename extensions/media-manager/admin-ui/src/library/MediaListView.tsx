import { Copy, Download, Trash2, AlertTriangle, ChevronUp, ChevronDown } from "@squilla/icons";
import {
  MediaFile,
  isImage,
  humanFileSize,
  imageSize,
  fmtDate,
  MediaImage,
  FileTypeIcon,
} from "./helpers";
import SelectCheck from "./SelectCheck";

interface MediaListViewProps {
  files: MediaFile[];
  selected: Set<number>;
  sortBy: string;
  onSort: (v: string) => void;
  onOpen: (f: MediaFile) => void;
  onToggle: (id: number, e: React.MouseEvent) => void;
  onToggleAll: () => void;
  onCopy: (f: MediaFile) => void;
  onDownload: (f: MediaFile) => void;
  onDelete: (f: MediaFile) => void;
}

const COLS = "grid grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_90px_110px_110px_100px] gap-3 px-3 py-2 items-center";

interface SortableHeaderProps {
  label: string;
  field: "name" | "size" | "date";
  sortBy: string;
  onSort: (v: string) => void;
  className?: string;
}

function SortableHeader({ label, field, sortBy, onSort, className = "" }: SortableHeaderProps) {
  const ascKey = `${field}_asc`;
  const descKey = `${field}_desc`;
  const active = sortBy === ascKey || sortBy === descKey;
  const dir: "asc" | "desc" | null = sortBy === ascKey ? "asc" : sortBy === descKey ? "desc" : null;
  // Default click order per field: name → asc, size/date → desc.
  const defaultDir: "asc" | "desc" = field === "name" ? "asc" : "desc";
  function next() {
    if (!active) onSort(field === "name" ? ascKey : descKey);
    else onSort(dir === defaultDir ? (defaultDir === "asc" ? descKey : ascKey) : (defaultDir === "asc" ? ascKey : descKey));
  }
  return (
    <button
      type="button"
      onClick={next}
      className={`flex items-center gap-1 cursor-pointer hover:text-foreground ${active ? "text-foreground" : ""} ${className}`}
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40" />
      )}
    </button>
  );
}

export default function MediaListView({
  files,
  selected,
  sortBy,
  onSort,
  onOpen,
  onToggle,
  onToggleAll,
  onCopy,
  onDownload,
  onDelete,
}: MediaListViewProps) {
  const allSelected = files.length > 0 && files.every((f) => selected.has(f.id));
  return (
    <div className="rounded border border-border bg-card overflow-hidden">
      <div className={`${COLS} text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted`}>
        <div className="flex items-center">
          <SelectCheck checked={allSelected} onClick={(e) => { e.stopPropagation(); onToggleAll(); }} size={16} />
        </div>
        <SortableHeader label="File" field="name" sortBy={sortBy} onSort={onSort} />
        <div>Alt text</div>
        <SortableHeader label="Size" field="size" sortBy={sortBy} onSort={onSort} className="tabular-nums" />
        <div>Dimensions</div>
        <SortableHeader label="Uploaded" field="date" sortBy={sortBy} onSort={onSort} />
        <div className="text-right pr-1">Actions</div>
      </div>
      <div className="divide-y divide-border">
        {files.map((f) => (
          <div
            key={f.id}
            onClick={() => onOpen(f)}
            className={`${COLS} text-[12.5px] cursor-pointer transition-colors ${
              selected.has(f.id) ? "bg-accent/60" : "hover:bg-muted"
            }`}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <SelectCheck checked={selected.has(f.id)} onClick={(e) => onToggle(f.id, e)} size={16} />
            </div>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-border bg-muted grid place-items-center">
                {isImage(f.mime_type) ? (
                  <MediaImage
                    src={imageSize(f.url, "thumbnail", f.updated_at)}
                    alt={f.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileTypeIcon mime={f.mime_type} className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{f.original_name}</div>
                <div className="text-[10.5px] text-muted-foreground font-mono truncate">{f.url}</div>
              </div>
            </div>
            <div className="truncate text-muted-foreground">
              {f.alt || (
                <span className="text-amber-700 italic flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> missing
                </span>
              )}
            </div>
            <div className="tabular-nums font-mono text-[11.5px] text-muted-foreground">{humanFileSize(f.size)}</div>
            <div className="tabular-nums font-mono text-[11.5px] text-muted-foreground">
              {f.width && f.height ? `${f.width}×${f.height}` : "—"}
            </div>
            <div className="text-muted-foreground">{fmtDate(f.created_at)}</div>
            <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onCopy(f)}
                className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                title="Copy URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDownload(f)}
                className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(f)}
                className="w-7 h-7 grid place-items-center rounded-md text-red-400 hover:text-foreground hover:bg-muted cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
