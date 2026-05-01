import { useEffect, useState, useCallback, useRef } from "react";
import {
  Image as ImageIcon,
  LayoutGrid,
  List,
} from "@squilla/icons";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@squilla/ui";
import { toast } from "sonner";

// All shared listing primitives + react-router hooks come from the SPA shell
// via the import-map shim. We type them locally because @squilla/ui doesn't
// ship .d.ts to extensions — runtime resolution is via __SQUILLA_SHARED__.
const SHARED = (window as unknown as {
  __SQUILLA_SHARED__: {
    ReactRouterDOM: {
      useSearchParams: () => [
        URLSearchParams,
        (
          next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
          opts?: { replace?: boolean }
        ) => void
      ];
    };
    ui: {
      ListPageShell: React.ComponentType<{ children: React.ReactNode }>;
      ListHeader: React.ComponentType<{
        title?: string;
        description?: React.ReactNode;
        tabs?: { value: string; label: string; count?: number }[];
        activeTab?: string;
        onTabChange?: (v: string) => void;
        newLabel?: string;
        onNew?: () => void;
        extra?: React.ReactNode;
      }>;
      ListToolbar: React.ComponentType<{ children: React.ReactNode }>;
      ListSearch: React.ComponentType<{
        value: string;
        onChange: (v: string) => void;
        placeholder?: string;
      }>;
      ListCard: React.ComponentType<{ children: React.ReactNode }>;
      ListFooter: React.ComponentType<{
        page: number;
        totalPages: number;
        total: number;
        perPage: number;
        onPage: (p: number) => void;
        onPerPage?: (n: number) => void;
        label?: string;
      }>;
      EmptyState: React.ComponentType<{
        icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        title: string;
        description?: string;
        action?: React.ReactNode;
      }>;
      LoadingRow: React.ComponentType<unknown>;
      Select: React.ComponentType<{ value: string; onValueChange: (v: string) => void; children: React.ReactNode }>;
      SelectTrigger: React.ComponentType<{ className?: string; children: React.ReactNode; size?: "sm" | "default" }>;
      SelectValue: React.ComponentType<{ placeholder?: string }>;
      SelectContent: React.ComponentType<{ children: React.ReactNode }>;
      SelectItem: React.ComponentType<{ value: string; children: React.ReactNode }>;
    };
  };
}).__SQUILLA_SHARED__;
const { useSearchParams } = SHARED.ReactRouterDOM;
const {
  ListPageShell,
  ListHeader,
  ListToolbar,
  ListSearch,
  ListCard,
  ListFooter,
  EmptyState,
  LoadingRow,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} = SHARED.ui;

import {
  MediaFile,
  PaginationMeta,
  copyToClipboard,
  humanFileSize,
} from "./library/helpers";
import MediaGrid, { Density } from "./library/MediaGrid";
import MediaListView from "./library/MediaListView";
import MediaDrawer from "./library/MediaDrawer";
import UploadModal from "./library/UploadModal";
import SelectionBar from "./library/SelectionBar";
import DragOverlay from "./library/DragOverlay";

// ---------- API ----------

async function fetchMedia(params: {
  page: number;
  per_page: number;
  mime_type?: string;
  search?: string;
  sort_by?: string;
}): Promise<{ data: MediaFile[]; meta: PaginationMeta }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("per_page", String(params.per_page));
  if (params.mime_type) qs.set("mime_type", params.mime_type);
  if (params.search) qs.set("search", params.search);
  if (params.sort_by) qs.set("sort_by", params.sort_by);
  const res = await fetch(`/admin/api/ext/media-manager/?${qs.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch media");
  const body = await res.json();
  return { data: body.data, meta: body.meta };
}

function uploadMediaFile(file: globalThis.File, onProgress?: (pct: number) => void): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/api/ext/media-manager/upload");
    xhr.withCredentials = true;
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).data);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else reject(new Error("Upload failed"));
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

async function updateMedia(id: number, data: { alt?: string; original_name?: string }): Promise<MediaFile> {
  const res = await fetch(`/admin/api/ext/media-manager/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return (await res.json()).data;
}

async function deleteMedia(id: number): Promise<void> {
  const res = await fetch(`/admin/api/ext/media-manager/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Failed to delete");
}

async function restoreOriginal(id: number): Promise<MediaFile> {
  const res = await fetch(`/admin/api/ext/media-manager/${id}/restore`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Failed to restore");
  }
  return (await res.json()).data;
}

async function reoptimizeImage(id: number): Promise<MediaFile> {
  const res = await fetch(`/admin/api/ext/media-manager/${id}/reoptimize`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Failed to re-optimize");
  }
  return (await res.json()).data;
}

// ---------- Constants ----------

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "application", label: "Documents" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "size_desc", label: "Largest first" },
  { value: "size_asc", label: "Smallest first" },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfy", label: "Comfy" },
  { value: "spacious", label: "Spacious" },
];

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ---------- Main ----------

export default function MediaLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = PER_PAGE_OPTIONS.includes(Number(searchParams.get("per_page")))
    ? Number(searchParams.get("per_page"))
    : 25;
  const search = searchParams.get("q") || "";
  const mimeFilter = searchParams.get("kind") || searchParams.get("type") || "all";
  const sortBy = searchParams.get("sort") || "date_desc";
  const viewMode: "grid" | "list" = searchParams.get("view") === "list" ? "list" : "grid";
  const density: Density = (["compact", "comfy", "spacious"] as Density[]).includes(
    searchParams.get("density") as Density
  )
    ? (searchParams.get("density") as Density)
    : "comfy";

  const updateParams = useCallback(
    (patch: Record<string, string | number | null>, opts: { replace?: boolean; resetPage?: boolean } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === "" || v === undefined) next.delete(k);
            else next.set(k, String(v));
          }
          if (opts.resetPage) next.delete("page");
          return next;
        },
        { replace: opts.replace }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback((p: number | ((prev: number) => number)) => {
    const next = typeof p === "function" ? p(page) : p;
    updateParams({ page: next === 1 ? null : next });
  }, [page, updateParams]);
  const setPerPage = (n: number) => updateParams({ per_page: n === 25 ? null : n }, { resetPage: true });
  const setSearch = (s: string) => updateParams({ q: s || null }, { replace: true, resetPage: true });
  const setMimeFilter = (v: string) => updateParams({ kind: v === "all" ? null : v, type: null }, { resetPage: true });
  const setSortBy = (v: string) => updateParams({ sort: v === "date_desc" ? null : v }, { resetPage: true });
  const setViewMode = (v: "grid" | "list") => updateParams({ view: v === "grid" ? null : v });
  const setDensity = (d: Density) => updateParams({ density: d === "comfy" ? null : d });

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState(search);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const [editing, setEditing] = useState<MediaFile | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [reoptimizing, setReoptimizing] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const lastSelectedRef = useRef<number | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitial, setUploadInitial] = useState<globalThis.File[] | undefined>(undefined);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const [copyState, setCopyState] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMedia({
        page,
        per_page: perPage,
        mime_type: mimeFilter === "all" ? undefined : mimeFilter,
        search: searchDebounce || undefined,
        sort_by: sortBy,
      });
      setFiles(res.data || []);
      setMeta(res.meta);
    } catch {
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, mimeFilter, searchDebounce, sortBy]);

  // Clear bulk selection when filters/page/sort change.
  useEffect(() => {
    setSelected(new Set());
  }, [searchDebounce, mimeFilter, sortBy, perPage, page]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Per-tab counts. Search-aware so tab numbers reflect the current search.
  // Cheap parallel fetches (per_page=1, only meta.total is read).
  const fetchTabCounts = useCallback(async () => {
    const types: string[] = TYPE_TABS.map((t) => t.value);
    const results = await Promise.all(
      types.map(async (t) => {
        try {
          const res = await fetchMedia({
            page: 1,
            per_page: 1,
            mime_type: t === "all" ? undefined : t,
            search: searchDebounce || undefined,
          });
          return [t, res.meta.total] as const;
        } catch {
          return [t, 0] as const;
        }
      })
    );
    setTabCounts(Object.fromEntries(results));
  }, [searchDebounce]);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  // Global drag-drop
  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current++;
        setDragging(true);
      }
    };
    const onLeave = () => {
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      const fs = e.dataTransfer?.files;
      if (fs && fs.length) {
        setUploadInitial(Array.from(fs));
        setUploadOpen(true);
      }
    };
    const onOver = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragover", onOver);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragover", onOver);
    };
  }, []);

  // Selection helpers
  function toggle(id: number, e?: React.MouseEvent) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (e?.shiftKey && lastSelectedRef.current != null) {
        const a = files.findIndex((f) => f.id === lastSelectedRef.current);
        const b = files.findIndex((f) => f.id === id);
        if (a >= 0 && b >= 0) {
          const [s, end] = a < b ? [a, b] : [b, a];
          for (let i = s; i <= end; i++) n.add(files[i].id);
          lastSelectedRef.current = id;
          return n;
        }
      }
      if (n.has(id)) n.delete(id);
      else n.add(id);
      lastSelectedRef.current = id;
      return n;
    });
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === files.length ? new Set() : new Set(files.map((f) => f.id))));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  // Actions
  function handleCopy(f: MediaFile) {
    const url = window.location.origin + f.url;
    copyToClipboard(url).then(() => {
      setCopyState(f.id);
      toast.success("URL copied");
      setTimeout(() => setCopyState(null), 1500);
    });
  }
  function handleDownload(f: MediaFile) {
    window.open(f.url, "_blank");
  }
  function requestDelete(f: MediaFile) {
    setDeleteTarget(f);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedia(deleteTarget.id);
      toast.success("File deleted");
      if (editing?.id === deleteTarget.id) setEditing(null);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(deleteTarget.id);
        return n;
      });
      setDeleteTarget(null);
      await Promise.all([fetchFiles(), fetchTabCounts()]);
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    setDeleting(true);
    let n = 0;
    for (const id of selected) {
      try {
        await deleteMedia(id);
        n++;
      } catch {
        /* continue */
      }
    }
    setDeleting(false);
    setBulkDeleteOpen(false);
    if (editing && selected.has(editing.id)) setEditing(null);
    clearSelection();
    toast.success(`${n} file${n !== 1 ? "s" : ""} deleted`);
    await Promise.all([fetchFiles(), fetchTabCounts()]);
  }

  async function handleSave(patch: { alt?: string; original_name?: string }) {
    if (!editing) return;
    if (Object.keys(patch).length === 0) {
      setEditing(null);
      return;
    }
    setSavingDetail(true);
    try {
      const updated = await updateMedia(editing.id, patch);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditing(updated);
      toast.success("Saved changes");
    } catch {
      toast.error("Failed to update file");
    } finally {
      setSavingDetail(false);
    }
  }

  async function handleRestore() {
    if (!editing) return;
    setRestoring(true);
    try {
      const updated = await restoreOriginal(editing.id);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditing(updated);
      toast.success("Original restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setRestoring(false);
    }
  }

  async function handleReoptimize() {
    if (!editing) return;
    setReoptimizing(true);
    try {
      const updated = await reoptimizeImage(editing.id);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditing(updated);
      toast.success(
        updated.optimization_savings > 0
          ? `Re-optimized — saved ${humanFileSize(updated.optimization_savings)}`
          : "Re-optimized (no size reduction)"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to re-optimize");
    } finally {
      setReoptimizing(false);
    }
  }

  function openUpload() {
    setUploadInitial(undefined);
    setUploadOpen(true);
  }

  async function handleUploadSingle(file: globalThis.File, onProgress: (pct: number) => void) {
    await uploadMediaFile(file, onProgress);
  }

  async function onUploadComplete(uploaded: number) {
    setUploadOpen(false);
    setUploadInitial(undefined);
    if (uploaded > 0) {
      toast.success(`Added ${uploaded} file${uploaded !== 1 ? "s" : ""}`);
      await Promise.all([fetchFiles(), fetchTabCounts()]);
    }
  }

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.per_page)) : 1;

  const tabs = [
    { value: "all", label: "All", count: tabCounts.all },
    { value: "image", label: "Images", count: tabCounts.image },
    { value: "video", label: "Videos", count: tabCounts.video },
    { value: "audio", label: "Audio", count: tabCounts.audio },
    { value: "application", label: "Documents", count: tabCounts.application },
  ];

  const isEmpty = !loading && files.length === 0;

  return (
    <ListPageShell>
      <ListHeader
        title="Media Library"
        tabs={tabs}
        activeTab={mimeFilter}
        onTabChange={setMimeFilter}
        newLabel="Upload"
        onNew={openUpload}
      />

      <ListToolbar>
        <ListSearch value={search} onChange={setSearch} placeholder="Search media files…" />

        {/* View toggle: grid vs list */}
        <div
          className="flex items-center shrink-0"
          style={{
            gap: 2,
            height: 30,
            padding: 2,
            borderRadius: "var(--radius-md)",
            background: "var(--sub-bg)",
            border: "1px solid var(--border-input)",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title="Grid view"
            className="grid place-items-center cursor-pointer"
            style={{
              height: 24,
              width: 28,
              borderRadius: 4,
              border: "none",
              background: viewMode === "grid" ? "var(--card-bg)" : "transparent",
              color: viewMode === "grid" ? "var(--fg)" : "var(--fg-subtle)",
              boxShadow: viewMode === "grid" ? "0 1px 2px rgba(20,18,15,0.06)" : "none",
              transition: "background 80ms",
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            title="List view"
            className="grid place-items-center cursor-pointer"
            style={{
              height: 24,
              width: 28,
              borderRadius: 4,
              border: "none",
              background: viewMode === "list" ? "var(--card-bg)" : "transparent",
              color: viewMode === "list" ? "var(--fg)" : "var(--fg-subtle)",
              boxShadow: viewMode === "list" ? "0 1px 2px rgba(20,18,15,0.06)" : "none",
              transition: "background 80ms",
            }}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Density — only meaningful in grid view */}
        {viewMode === "grid" && (
          <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DENSITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex-1" />

        {files.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="cursor-pointer"
            style={{
              height: 30,
              padding: "0 10px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--fg-muted)",
              background: "transparent",
              border: "none",
              borderRadius: "var(--radius-md)",
            }}
          >
            {selected.size === files.length ? "Deselect all" : "Select all"}
          </button>
        )}
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : isEmpty ? (
          <EmptyState
            icon={ImageIcon}
            title="No media files yet"
            description={
              searchDebounce || mimeFilter !== "all"
                ? "Try clearing filters, or upload new media."
                : "Click Upload to add your first file."
            }
            action={
              !searchDebounce && mimeFilter === "all" ? (
                <Button onClick={openUpload}>Upload File</Button>
              ) : undefined
            }
          />
        ) : viewMode === "grid" ? (
          <div style={{ padding: 14 }}>
            <MediaGrid
              files={files}
              selected={selected}
              copyState={copyState}
              density={density}
              onOpen={setEditing}
              onToggle={toggle}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onDelete={requestDelete}
            />
          </div>
        ) : (
          <MediaListView
            files={files}
            selected={selected}
            sortBy={sortBy}
            onSort={setSortBy}
            onOpen={setEditing}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onDelete={requestDelete}
          />
        )}

        {meta && !loading && !isEmpty && (
          <ListFooter
            page={page}
            totalPages={totalPages}
            total={meta.total}
            perPage={perPage}
            onPage={setPage}
            onPerPage={setPerPage}
            label="files"
          />
        )}
      </ListCard>

      {/* Selection bar — fixed-position floating bar */}
      {selected.size > 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
          style={{ bottom: 24 }}
        >
          <div className="pointer-events-auto" style={{ minWidth: 320 }}>
            <SelectionBar
              count={selected.size}
              onClear={clearSelection}
              onDelete={() => setBulkDeleteOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Drawer */}
      {editing && (
        <MediaDrawer
          file={editing}
          copyState={copyState}
          saving={savingDetail}
          restoring={restoring}
          reoptimizing={reoptimizing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDelete={requestDelete}
          onRestore={handleRestore}
          onReoptimize={handleReoptimize}
        />
      )}

      {/* Upload modal */}
      {uploadOpen && (
        <UploadModal
          initialFiles={uploadInitial}
          onClose={() => {
            setUploadOpen(false);
            setUploadInitial(undefined);
          }}
          onUploadFile={handleUploadSingle}
          onComplete={onUploadComplete}
        />
      )}

      {/* Global drag overlay */}
      <DragOverlay active={dragging && !uploadOpen} />

      {/* Delete dialogs */}
      <Dialog open={!!deleteTarget} onOpenChange={(o: boolean) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.original_name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={(o: boolean) => !o && setBulkDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selected.size} selected file{selected.size !== 1 ? "s" : ""}? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? "Deleting…" : `Delete ${selected.size} files`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageShell>
  );
}
