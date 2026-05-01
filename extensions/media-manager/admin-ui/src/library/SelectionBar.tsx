import { Zap, Download, Trash2, X, Loader2 } from "@squilla/icons";

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onOptimize?: () => void;
  onDownload?: () => void;
  optimizing?: boolean;
}

export default function SelectionBar({ count, onClear, onDelete, onOptimize, onDownload, optimizing }: SelectionBarProps) {
  return (
    <div className="rounded-xl border border-border bg-accent/60 px-3 py-2 flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-primary text-white grid place-items-center text-[11px] font-bold tabular-nums">
        {count}
      </div>
      <div className="text-[12.5px] text-foreground font-medium">selected</div>
      <div className="flex-1" />
      {onOptimize && (
        <button
          type="button"
          onClick={onOptimize}
          disabled={optimizing}
          className="h-8 px-2.5 rounded-md hover:bg-card/70 text-foreground text-[12px] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          Optimize
        </button>
      )}
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="h-8 px-2.5 rounded-md hover:bg-card/70 text-foreground text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="h-3 w-3" /> Download
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="h-8 px-2.5 rounded-md hover:bg-rose-100 text-rose-700 text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
      >
        <Trash2 className="h-3 w-3" /> Delete
      </button>
      <div className="w-px h-5 bg-accent mx-1" />
      <button
        type="button"
        onClick={onClear}
        className="h-8 w-8 grid place-items-center rounded-md hover:bg-card/70 text-foreground cursor-pointer"
        title="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
