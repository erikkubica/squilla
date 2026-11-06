import { useState } from "react";
import { HardDrive, Image as ImageIcon, Loader2, Plus, RefreshCw, Trash2 } from "@squilla/icons";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SectionHeader,
  Td,
  Th,
  Tr,
} from "@squilla/ui";
import { toast } from "sonner";
import { humanFileSize } from "../library/helpers";
import * as api from "./api";
import type { ImageSize, SizesData } from "./api";
import AddSizeDialog from "./AddSizeDialog";
import { describeSource, dimensions, MODES, SizeGlyph } from "./controls";

interface SizesCardProps {
  data: SizesData | null;
  /** Reload sizes and cache stats after a change. */
  onChanged: () => void;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Registered sizes with their cached copies, plus the whole cache. */
export default function SizesCard({ data, onChanged }: SizesCardProps) {
  const [adding, setAdding] = useState(false);
  // Bumped on every opening so the add form starts blank.
  const [addKey, setAddKey] = useState(0);
  const [toDelete, setToDelete] = useState<ImageSize | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Name of the size whose cache is being cleared, or "*" for all of it.
  const [clearing, setClearing] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const sizes = data?.sizes ?? [];
  const cachedFiles = sizes.reduce((n, s) => n + (s.cached_files ?? 0), 0) + (data?.webpFiles ?? 0);
  const cachedBytes = sizes.reduce((n, s) => n + (s.cache_size ?? 0), 0) + (data?.webpSize ?? 0);
  const deleteSource = toDelete ? describeSource(toDelete.source) : null;

  const clearSize = async (size: ImageSize) => {
    setClearing(size.name);
    try {
      await api.clearSizeCache(size.name);
      toast.success(`Cleared the cached “${size.name}” copies`);
      onChanged();
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't clear the cache"));
    } finally {
      setClearing(null);
    }
  };

  const clearAll = async () => {
    // The endpoint doesn't report what it freed, so count it beforehand.
    const freed = cachedBytes;
    setClearing("*");
    try {
      await api.clearAllCache();
      toast.success(`Cache cleared, ${humanFileSize(freed)} freed`);
      setConfirmClear(false);
      onChanged();
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't clear the cache"));
    } finally {
      setClearing(null);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteSize(toDelete.name);
      toast.success(`Deleted the “${toDelete.name}” size`);
      setToDelete(null);
      onChanged();
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't delete the size"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Image sizes"
        count={data ? sizes.length : undefined}
        icon={<ImageIcon className="h-4 w-4" />}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAddKey((k) => k + 1);
              setAdding(true);
            }}
          >
            <Plus />
            Add size
          </Button>
        }
      />
      <p data-mm="card-intro">
        Themes and blocks ask for these sizes by name. Each copy is made the first time a page needs it, then served
        from the cache.
      </p>

      {!data ? (
        <div data-mm="card-empty">
          <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading sizes" />
        </div>
      ) : sizes.length === 0 ? (
        <div data-mm="card-empty">
          <ImageIcon className="h-6 w-6" aria-hidden="true" />
          <p data-mm="empty-title">No image sizes yet</p>
          <p>Add one here, or activate a theme that declares its own.</p>
        </div>
      ) : (
        <div data-mm="table-wrap">
          <table data-mm="table">
            <thead>
              <tr>
                <Th style={{ paddingLeft: 18 }}>Name</Th>
                <Th className="mm-col-md">Size</Th>
                <Th className="mm-col-md">Mode</Th>
                <Th className="mm-col-lg">Source</Th>
                <Th className="mm-col-sm" align="right">
                  Cached
                </Th>
                <Th align="right" style={{ paddingRight: 14 }}>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => {
                const mode = MODES[size.mode];
                const source = describeSource(size.source);
                const dims = dimensions(size.width, size.height, size.mode);
                return (
                  <Tr key={size.name}>
                    <Td style={{ paddingLeft: 18 }}>
                      <div data-mm="size-name">{size.name}</div>
                      <div data-mm="size-sub" className="mm-narrow">
                        {dims} · {mode?.label ?? size.mode}
                      </div>
                    </Td>
                    <Td className="mm-col-md">
                      <span className="inline-flex items-center whitespace-nowrap tabular-nums" style={{ gap: 8 }}>
                        <SizeGlyph width={size.width} height={size.height} mode={size.mode} />
                        {dims}
                      </span>
                    </Td>
                    <Td className="mm-col-md">
                      <span data-mm="tag" title={mode?.hint}>
                        {mode?.label ?? size.mode}
                      </span>
                    </Td>
                    <Td className="mm-col-lg">
                      {source.label}
                      {source.owner && <span data-mm="muted"> · {source.owner}</span>}
                    </Td>
                    <Td className="mm-col-sm" align="right">
                      {size.cached_files ? (
                        <span className="whitespace-nowrap">
                          <span className="tabular-nums">{humanFileSize(size.cache_size ?? 0)}</span>
                          <span data-mm="muted"> · {plural(size.cached_files, "file")}</span>
                        </span>
                      ) : (
                        <span data-mm="muted">None yet</span>
                      )}
                    </Td>
                    <Td align="right" style={{ paddingRight: 14 }}>
                      <div className="inline-flex items-center" style={{ gap: 2 }}>
                        <button
                          type="button"
                          data-mm="ghost-btn"
                          title="Clear cached copies"
                          aria-label={`Clear the cached ${size.name} copies`}
                          disabled={!size.cached_files || clearing !== null}
                          onClick={() => clearSize(size)}
                        >
                          {clearing === size.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          data-mm="ghost-btn"
                          data-tone="danger"
                          data-quiet=""
                          title="Delete size"
                          aria-label={`Delete the ${size.name} size`}
                          onClick={() => setToDelete(size)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div data-mm="card-foot">
        <span data-mm="foot-icon" aria-hidden="true">
          <HardDrive className="h-4 w-4" />
        </span>
        <div className="min-w-0" style={{ flex: 1 }}>
          <div data-mm="foot-title">
            {cachedFiles > 0
              ? `${humanFileSize(cachedBytes)} cached in ${plural(cachedFiles, "file")}`
              : "The cache is empty"}
          </div>
          <div data-mm="foot-desc">
            {data?.webpSize
              ? `Includes ${humanFileSize(data.webpSize)} of full-size WebP copies.`
              : "Copies are made again whenever a page needs them."}
          </div>
        </div>
        <button
          type="button"
          data-mm="ghost-btn"
          data-tone="danger"
          disabled={cachedFiles === 0 || clearing !== null}
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 className="h-4 w-4" />
          Clear cache
        </button>
      </div>

      <AddSizeDialog
        key={addKey}
        open={adding}
        onOpenChange={setAdding}
        existing={sizes.map((s) => s.name)}
        onCreated={onChanged}
      />

      <Dialog open={toDelete !== null} onOpenChange={(open: boolean) => !open && !deleting && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete the “{toDelete?.name}” size?</DialogTitle>
            <DialogDescription>
              {!toDelete?.cached_files
                ? "It has no cached copies yet."
                : toDelete.cached_files === 1
                  ? "Its cached copy is deleted too."
                  : `Its ${toDelete.cached_files} cached copies are deleted too.`}
              {deleteSource?.owner &&
                ` The ${deleteSource.kind} “${deleteSource.owner}” declares this size, so it comes back the next time that ${deleteSource.kind} is activated.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              Delete size
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmClear}
        onOpenChange={(open: boolean) => !open && clearing !== "*" && setConfirmClear(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear the image cache?</DialogTitle>
            <DialogDescription>
              This deletes {plural(cachedFiles, "cached copy", "cached copies")} ({humanFileSize(cachedBytes)}). They're
              made again the next time a page asks for them, so the first visits are a little slower.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)} disabled={clearing === "*"}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAll} disabled={clearing === "*"}>
              {clearing === "*" && <Loader2 className="animate-spin" />}
              Clear cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
