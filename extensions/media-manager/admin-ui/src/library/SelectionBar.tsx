import { Zap, Download, Trash2, X, Loader2 } from "@squilla/icons";

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onOptimize?: () => void;
  onDownload?: () => void;
  optimizing?: boolean;
}

/** Floating bulk-action toolbar: solid and dark so it reads over photos. */
export default function SelectionBar({ count, onClear, onDelete, onOptimize, onDownload, optimizing }: SelectionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Selected files"
      className="flex items-center"
      style={{
        gap: 2,
        padding: "6px 6px 6px 16px",
        borderRadius: 12,
        background: "#111827",
        color: "#fff",
        boxShadow: "0 16px 36px -10px rgba(15, 23, 42, 0.5), 0 2px 6px rgba(15, 23, 42, 0.2)",
      }}
    >
      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
        {count} selected
      </span>
      <span aria-hidden style={{ width: 1, height: 20, margin: "0 8px 0 12px", background: "rgba(255, 255, 255, 0.16)" }} />
      {onOptimize && (
        <button type="button" data-mm="bar-btn" onClick={onOptimize} disabled={optimizing}>
          {optimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Optimize
        </button>
      )}
      {onDownload && (
        <button type="button" data-mm="bar-btn" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      )}
      <button type="button" data-mm="bar-btn" data-tone="danger" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
      <button type="button" data-mm="bar-btn" onClick={onClear} title="Clear selection" aria-label="Clear selection">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
