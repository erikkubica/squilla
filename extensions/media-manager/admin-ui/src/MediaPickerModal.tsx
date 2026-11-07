import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  Search,
  Loader2,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File,
  Check,
} from "@squilla/icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@squilla/ui";
import { toast } from "sonner";

// ---------- Types ----------

export interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (files: MediaFile[]) => void;
  multiple?: boolean;
  mimeFilter?: string;
}

// ---------- API helpers ----------

async function fetchMedia(params: {
  page: number;
  per_page: number;
  mime_type?: string;
  search?: string;
}): Promise<{ data: MediaFile[]; meta: PaginationMeta }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("per_page", String(params.per_page));
  if (params.mime_type) qs.set("mime_type", params.mime_type);
  if (params.search) qs.set("search", params.search);
  qs.set("sort_by", "date_desc");

  const res = await fetch(`/admin/api/ext/media-manager/?${qs.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch media");
  const body = await res.json();
  return { data: body.data, meta: body.meta };
}

async function uploadMediaFile(file: globalThis.File): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/api/ext/media-manager/upload");
    xhr.withCredentials = true;
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).data);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        reject(new Error("Upload failed"));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

// ---------- Helpers ----------

function humanFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isImage(mime: string): boolean {
  return mime.startsWith("image/");
}

function imageSize(url: string, size: string, updatedAt?: string): string {
  if (!url.startsWith("/media/")) return url;
  let result = "/media/cache/" + size + "/" + url.slice(7);
  if (updatedAt) {
    result += "?v=" + new Date(updatedAt).getTime();
  }
  return result;
}

function FileIcon({ mime, className }: { mime: string; className?: string }) {
  if (isImage(mime)) return <ImageIcon className={className} />;
  if (mime.startsWith("video/")) return <Film className={className} />;
  if (mime.startsWith("audio/")) return <Music className={className} />;
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text"))
    return <FileText className={className} />;
  return <File className={className} />;
}

// ---------- Component ----------

const PER_PAGE = 36;

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "application", label: "Documents" },
];

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = false,
  mimeFilter,
}: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, per_page: PER_PAGE, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<number, MediaFile>>(new Map());
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mimeType, setMimeType] = useState(mimeFilter || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);
  const searchRef = useRef("");

  const load = useCallback(
    async (page: number, append = false) => {
      const id = ++reqId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const result = await fetchMedia({ page, per_page: PER_PAGE, mime_type: mimeType || undefined, search: searchRef.current || undefined });
        if (id !== reqId.current) return;
        setFiles((prev) => (append ? [...prev, ...result.data.filter((f) => !prev.some((p) => p.id === f.id))] : result.data));
        setMeta(result.meta);
      } catch {
        if (id === reqId.current) toast.error("Couldn't load the media library");
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [mimeType],
  );

  useEffect(() => {
    if (!open) return;
    setSelected(new Map());
    setSearch("");
    searchRef.current = "";
    void load(1);
  }, [open, load]);

  // Infinite scroll: fetch the next page when the sentinel comes into view.
  const hasMore = meta.page < meta.total_pages;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) void load(meta.page + 1, true);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore, meta.page, load, files.length]);

  function handleSearchChange(val: string) {
    setSearch(val);
    searchRef.current = val.trim();
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void load(1), 250);
  }

  function toggleSelect(file: MediaFile) {
    setSelected((prev) => {
      if (!multiple) return prev.has(file.id) ? new Map() : new Map([[file.id, file]]);
      const next = new Map(prev);
      if (next.has(file.id)) next.delete(file.id);
      else next.set(file.id, file);
      return next;
    });
  }

  function confirm(list: MediaFile[]) {
    if (list.length === 0) return;
    onSelect(list);
    onClose();
  }

  async function uploadFiles(list: globalThis.File[]) {
    if (!list.length) return;
    setUploading(list.length);
    const added: MediaFile[] = [];
    try {
      for (const f of list) {
        added.push(await uploadMediaFile(f));
        setUploading((n) => n - 1);
      }
      toast.success(list.length === 1 ? "Uploaded" : `Uploaded ${list.length} files`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (added.length) {
      // Show the new files first and select them, ready to confirm.
      setFiles((prev) => [...added.reverse(), ...prev.filter((p) => !added.some((a) => a.id === p.id))]);
      setSelected((prev) => {
        if (!multiple) return new Map([[added[0].id, added[0]]]);
        const next = new Map(prev);
        for (const f of added) next.set(f.id, f);
        return next;
      });
    }
  }

  const selectedList = Array.from(selected.values());
  const single = !multiple ? selectedList[0] : undefined;
  const noun = mimeFilter === "image" ? "image" : "file";

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent data-mm="picker" style={{ maxWidth: "min(1080px, calc(100% - 2rem))", width: "100%", height: "min(800px, 90vh)", padding: 0, gap: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DialogHeader style={{ padding: "20px 24px 0" }}>
          <DialogTitle>{multiple ? `Choose ${noun}s` : `Choose ${mimeFilter === "image" ? "an image" : "a file"}`}</DialogTitle>
          <DialogDescription>
            {multiple ? "Pick as many as you need, or drop new files anywhere in this window." : "Pick one from the library, or drop a new file anywhere in this window."}
          </DialogDescription>
        </DialogHeader>

        <div data-mm="picker-toolbar">
          <label data-mm="picker-search">
            <Search size={16} aria-hidden />
            <input autoFocus placeholder={`Search ${noun}s by name`} value={search} onChange={(e) => handleSearchChange(e.target.value)} />
            {loading && search ? <Loader2 size={15} data-mm="spin" aria-hidden /> : null}
          </label>
          {!mimeFilter || mimeFilter === "" ? (
            <div data-mm="seg" role="tablist" aria-label="File type">
              {TYPE_FILTERS.map((t) => (
                <button key={t.value || "all"} type="button" role="tab" aria-selected={mimeType === t.value} onClick={() => setMimeType(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" data-mm="btn" onClick={() => fileInputRef.current?.click()} disabled={uploading > 0}>
            {uploading > 0 ? <Loader2 size={15} data-mm="spin" /> : <Upload size={15} />}
            {uploading > 0 ? `Uploading ${uploading}…` : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={mimeFilter ? `${mimeFilter}/*` : undefined}
            style={{ display: "none" }}
            onChange={(e) => void uploadFiles(Array.from(e.target.files ?? []))}
          />
        </div>

        <div
          data-mm="picker-body"
          data-hot={dragging || undefined}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void uploadFiles(Array.from(e.dataTransfer.files));
          }}
        >
          {loading && files.length === 0 ? (
            <div data-mm="picker-grid" aria-busy>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} data-mm="pick-skeleton" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div data-mm="picker-empty">
              <span data-mm="picker-empty-icon">
                <ImageIcon size={22} />
              </span>
              <strong>{search ? `Nothing matches “${search}”` : "Nothing here yet"}</strong>
              <span>{search ? "Try another name, or upload it." : "Drop files here or use Upload."}</span>
            </div>
          ) : (
            <div data-mm="picker-grid" data-loading={loading || undefined}>
              {files.map((file) => {
                const order = multiple ? selectedList.findIndex((f) => f.id === file.id) : selected.has(file.id) ? 0 : -1;
                const isSelected = order >= 0;
                return (
                  <button
                    key={file.id}
                    type="button"
                    data-mm="pick"
                    data-selected={isSelected || undefined}
                    aria-pressed={isSelected}
                    title={file.original_name}
                    onClick={() => toggleSelect(file)}
                    onDoubleClick={() => !multiple && confirm([file])}
                  >
                    {isImage(file.mime_type) ? (
                      <img src={imageSize(file.url, "medium", file.updated_at)} alt={file.alt || file.original_name} loading="lazy" draggable={false} />
                    ) : (
                      <span data-mm="pick-file">
                        <FileIcon mime={file.mime_type} className="h-7 w-7" />
                        <span>{file.original_name}</span>
                      </span>
                    )}
                    <span data-mm="pick-check" aria-hidden>
                      {isSelected ? multiple ? order + 1 : <Check size={13} strokeWidth={3} /> : null}
                    </span>
                    <span data-mm="pick-caption">{file.original_name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {hasMore && <div ref={sentinelRef} data-mm="picker-more">{loadingMore ? <Loader2 size={18} data-mm="spin" /> : null}</div>}
          {dragging && (
            <div data-mm="picker-drop">
              <Upload size={22} />
              Drop to upload
            </div>
          )}
        </div>

        <div data-mm="picker-foot">
          <div data-mm="picker-summary">
            {single ? (
              <>
                {isImage(single.mime_type) ? (
                  <img src={imageSize(single.url, "thumbnail", single.updated_at)} alt="" />
                ) : (
                  <span data-mm="picker-summary-icon">
                    <FileIcon mime={single.mime_type} className="h-4 w-4" />
                  </span>
                )}
                <span style={{ minWidth: 0 }}>
                  <strong>{single.original_name}</strong>
                  <span>
                    {single.width && single.height ? `${single.width} × ${single.height} · ` : ""}
                    {humanFileSize(single.size)}
                  </span>
                </span>
              </>
            ) : selectedList.length > 0 ? (
              <>
                <strong>{selectedList.length} selected</strong>
                <button type="button" data-mm="ghost-btn" onClick={() => setSelected(new Map())}>
                  Clear
                </button>
              </>
            ) : (
              <span>
                {meta.total} {meta.total === 1 ? noun : `${noun}s`}
                {multiple ? " · click to select, in the order you want them" : " · double-click to pick right away"}
              </span>
            )}
          </div>
          <button type="button" data-mm="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" data-mm="btn" data-variant="primary" onClick={() => confirm(selectedList)} disabled={selectedList.length === 0}>
            {multiple && selectedList.length > 1 ? `Add ${selectedList.length} ${noun}s` : multiple ? `Add ${noun}` : `Use this ${noun}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
