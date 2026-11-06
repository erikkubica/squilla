import { useState, useRef, useEffect, useCallback } from "react";
import {
  UploadCloud,
  X,
  Folder,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from "@squilla/icons";
import { humanFileSize } from "./helpers";

type Status = "uploading" | "processing" | "done" | "error";

interface QueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: Status;
  error: string | null;
  file?: globalThis.File;
  /** Object URL for an image thumbnail; revoked when the row goes away. */
  preview?: string;
}

interface UploadModalProps {
  initialFiles?: globalThis.File[];
  onClose: () => void;
  onUploadFile: (file: globalThis.File, onProgress: (pct: number) => void) => Promise<void>;
  onComplete: (uploadedCount: number) => void;
}

export default function UploadModal({ initialFiles, onClose, onUploadFile, onComplete }: UploadModalProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragHot, setDragHot] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<Set<string>>(new Set());
  const previewsRef = useRef<Map<string, string>>(new Map());

  // Free thumbnail object URLs when the modal closes.
  useEffect(() => {
    const previews = previewsRef.current;
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const startUpload = useCallback(
    async (item: QueueItem) => {
      if (!item.file || activeRef.current.has(item.id)) return;
      activeRef.current.add(item.id);
      try {
        await onUploadFile(item.file, (pct) => updateItem(item.id, { progress: pct, status: "uploading" }));
        updateItem(item.id, { progress: 100, status: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateItem(item.id, { status: "error", error: msg, progress: 100 });
      } finally {
        activeRef.current.delete(item.id);
      }
    },
    [onUploadFile, updateItem]
  );

  const addFiles = useCallback(
    (fs: FileList | globalThis.File[]) => {
      const arr = Array.from(fs);
      const items: QueueItem[] = arr.map((f) => {
        const id = Math.random().toString(36).slice(2);
        let preview: string | undefined;
        if (f.type.startsWith("image/")) {
          preview = URL.createObjectURL(f);
          previewsRef.current.set(id, preview);
        }
        return { id, name: f.name, size: f.size, progress: 0, status: "uploading" as Status, error: null, file: f, preview };
      });
      setQueue((q) => [...items, ...q]);
      items.forEach(startUpload);
    },
    [startUpload]
  );

  // Kick off any seeded files
  useEffect(() => {
    if (initialFiles?.length) addFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry(id: string) {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    updateItem(id, { status: "uploading", progress: 0, error: null });
    if (item.file) startUpload({ ...item, status: "uploading", progress: 0, error: null });
  }
  function retryAll() {
    queue.filter((q) => q.status === "error").forEach((q) => retry(q.id));
  }
  function remove(id: string) {
    const preview = previewsRef.current.get(id);
    if (preview) {
      URL.revokeObjectURL(preview);
      previewsRef.current.delete(id);
    }
    setQueue((q) => q.filter((it) => it.id !== id));
  }

  const total = queue.length;
  const done = queue.filter((q) => q.status === "done").length;
  const errors = queue.filter((q) => q.status === "error").length;
  const uploading = queue.filter((q) => q.status === "uploading" || q.status === "processing").length;
  const overall = total
    ? Math.round(
        queue.reduce((s, q) => s + (q.status === "done" || q.status === "error" ? 100 : q.progress), 0) / total
      )
    : 0;

  function close() {
    onComplete(done);
    onClose();
  }

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const compact = total > 0;
  const finished = total > 0 && uploading === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onMouseDown={close}>
      <div className="absolute inset-0" style={{ background: "rgba(15, 23, 42, 0.42)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upload media"
        className="relative w-[640px] max-w-full max-h-[86vh] overflow-hidden flex flex-col"
        style={{ borderRadius: 14, background: "var(--card-bg)", boxShadow: "0 24px 64px -16px rgba(15, 23, 42, 0.45)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 56, gap: 10, padding: "0 10px 0 20px", borderBottom: "1px solid var(--border)" }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", letterSpacing: "-0.01em" }}>Upload media</div>
          {total > 0 && (
            <span
              className="tabular-nums"
              style={{ padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: "var(--hover-bg)", color: "var(--fg-muted)" }}
            >
              {done} of {total} uploaded
            </span>
          )}
          {errors > 0 && (
            <span
              className="tabular-nums"
              style={{ padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: "var(--danger-bg)", color: "var(--danger)" }}
            >
              {errors} failed
            </span>
          )}
          <div className="flex-1" />
          <button type="button" data-mm="ghost-btn" onClick={close} title="Close" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
          <label
            data-mm="dropzone"
            className="block"
            data-hot={dragHot || undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setDragHot(true);
            }}
            onDragLeave={() => setDragHot(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragHot(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {compact ? (
              <div className="flex items-center" style={{ gap: 14, padding: "14px 16px" }}>
                <span
                  className="grid place-items-center shrink-0"
                  style={{ width: 40, height: 40, borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--accent-strong)" }}
                >
                  <UploadCloud className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)" }}>Add more files</div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>Drop them here or browse</div>
                </div>
                <button
                  type="button"
                  data-mm="btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                    inputRef.current?.click();
                  }}
                >
                  <Folder className="h-3.5 w-3.5" /> Browse
                </button>
              </div>
            ) : (
              <div className="text-center" style={{ padding: "36px 24px" }}>
                <span
                  className="mx-auto grid place-items-center"
                  style={{ width: 52, height: 52, borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--accent-strong)", boxShadow: "var(--shadow-sm)" }}
                >
                  <UploadCloud className="h-6 w-6" />
                </span>
                <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>Drop files here</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "var(--fg-muted)" }}>
                  JPG, PNG, WebP, AVIF, SVG or MP4. Several at once is fine.
                </div>
                <button
                  type="button"
                  data-mm="btn"
                  data-variant="primary"
                  style={{ marginTop: 16 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                    inputRef.current?.click();
                  }}
                >
                  <Folder className="h-3.5 w-3.5" /> Browse files
                </button>
              </div>
            )}
          </label>

          {queue.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                  {total} {total === 1 ? "file" : "files"}
                </div>
                <div className="flex-1 overflow-hidden" style={{ height: 4, borderRadius: 999, background: "var(--hover-bg)" }}>
                  <div
                    style={{
                      width: overall + "%",
                      height: "100%",
                      borderRadius: 999,
                      background: errors > 0 && finished ? "var(--warning)" : finished ? "var(--success)" : "var(--accent)",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
                <div className="tabular-nums" style={{ fontSize: 12.5, color: "var(--fg-muted)", minWidth: 34, textAlign: "right" }}>
                  {overall}%
                </div>
                {errors > 0 && (
                  <button type="button" data-mm="ghost-btn" onClick={retryAll} style={{ height: 28 }}>
                    <RotateCw className="h-3.5 w-3.5" /> Retry failed
                  </button>
                )}
              </div>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center"
                    style={{
                      gap: 12,
                      padding: 10,
                      borderRadius: "var(--radius-lg)",
                      border: `1px solid ${item.status === "error" ? "color-mix(in srgb, var(--danger) 30%, transparent)" : "var(--border)"}`,
                      background: item.status === "error" ? "var(--danger-bg)" : "var(--card-bg)",
                    }}
                  >
                    <div
                      className="relative overflow-hidden grid place-items-center shrink-0"
                      style={{ width: 44, height: 44, borderRadius: 8, background: "var(--sub-bg)", border: "1px solid var(--border)" }}
                    >
                      {item.preview ? (
                        <img src={item.preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-[var(--fg-subtle)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline" style={{ gap: 8 }}>
                        <div className="truncate flex-1" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg)" }} title={item.name}>
                          {item.name}
                        </div>
                        <div className="tabular-nums shrink-0" style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                          {humanFileSize(item.size)}
                        </div>
                      </div>
                      {item.status === "uploading" && (
                        <div className="flex items-center" style={{ gap: 8, marginTop: 7 }}>
                          <div className="flex-1 overflow-hidden" style={{ height: 4, borderRadius: 999, background: "var(--hover-bg)" }}>
                            <div
                              style={{ width: item.progress + "%", height: "100%", borderRadius: 999, background: "var(--accent)", transition: "width 0.2s ease" }}
                            />
                          </div>
                          <span className="tabular-nums" style={{ fontSize: 12, color: "var(--fg-muted)", minWidth: 32, textAlign: "right" }}>
                            {Math.round(item.progress)}%
                          </span>
                        </div>
                      )}
                      {item.status === "processing" && (
                        <div className="flex items-center" style={{ gap: 6, marginTop: 4, fontSize: 12.5, color: "var(--fg-muted)" }}>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Optimizing…
                        </div>
                      )}
                      {item.status === "done" && (
                        <div className="flex items-center" style={{ gap: 6, marginTop: 4, fontSize: 12.5, color: "var(--success)", fontWeight: 500 }}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                        </div>
                      )}
                      {item.status === "error" && (
                        <div className="flex items-center" style={{ gap: 6, marginTop: 4, fontSize: 12.5, color: "var(--danger)" }}>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{item.error}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center shrink-0" style={{ gap: 2 }}>
                      {item.status === "error" && (
                        <button type="button" data-mm="ghost-btn" data-tone="danger" onClick={() => retry(item.id)} style={{ height: 30 }}>
                          <RotateCw className="h-3.5 w-3.5" /> Retry
                        </button>
                      )}
                      <button
                        type="button"
                        data-mm="ghost-btn"
                        onClick={() => remove(item.id)}
                        title="Remove from list"
                        aria-label={`Remove ${item.name} from list`}
                        style={{ height: 30, minWidth: 30, padding: 0 }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center shrink-0"
          style={{ gap: 8, padding: "12px 20px", borderTop: "1px solid var(--border)" }}
        >
          <div className="tabular-nums" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
            {uploading > 0
              ? `Uploading ${uploading} ${uploading === 1 ? "file" : "files"}…`
              : total === 0
              ? "No files yet"
              : errors > 0
              ? `${done} uploaded, ${errors} failed`
              : `${done} uploaded`}
          </div>
          <div className="flex-1" />
          <button type="button" data-mm="btn" data-variant={finished && done > 0 ? "primary" : undefined} onClick={close}>
            {finished && done > 0 ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
