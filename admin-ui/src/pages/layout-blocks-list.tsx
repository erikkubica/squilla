import { useEffect, useState, useCallback } from "react";
import { Component, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getLayoutBlocksPaginated,
  deleteLayoutBlock,
  detachLayoutBlock,
  getLanguages,
  type LayoutBlock,
  type Language,
  type PaginationMeta,
} from "@/api/client";
import {
  ListPageShell,
  ListHeader,
  ListToolbar,
  ListCard,
  ListTable,
  ListFooter,
  Th,
  Tr,
  Td,
  TitleCell,
  RowActions,
  Chip,
  EmptyState,
  LoadingRow,
} from "@/components/ui/list-page";

export default function LayoutBlocksListPage() {
  const [layoutBlocks, setLayoutBlocks] = useState<LayoutBlock[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<LayoutBlock | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [detachingId, setDetachingId] = useState<number | null>(null);

  const fetchLayoutBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const params: { language_id?: number; page: number; per_page: number } = { page, per_page: 25 };
      if (languageFilter && languageFilter !== "all") {
        params.language_id = Number(languageFilter);
      }
      const res = await getLayoutBlocksPaginated(params);
      setLayoutBlocks(res.data);
      setMeta(res.meta);
    } catch {
      toast.error("Failed to load layout blocks");
    } finally {
      setLoading(false);
    }
  }, [languageFilter, page]);

  const fetchLanguages = useCallback(async () => {
    try {
      const data = await getLanguages(true);
      setLanguages(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    setPage(1);
  }, [languageFilter]);

  useEffect(() => {
    fetchLayoutBlocks();
  }, [fetchLayoutBlocks]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLayoutBlock(deleteTarget.id);
      toast.success("Layout block deleted successfully");
      setDeleteTarget(null);
      fetchLayoutBlocks();
    } catch {
      toast.error("Failed to delete layout block");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDetach(lb: LayoutBlock) {
    setDetachingId(lb.id);
    try {
      await detachLayoutBlock(lb.id);
      toast.success(`"${lb.name}" detached from ${lb.source}`);
      fetchLayoutBlocks();
    } catch {
      toast.error("Failed to detach layout block");
    } finally {
      setDetachingId(null);
    }
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Layout Blocks"
        count={meta?.total ?? layoutBlocks.length}
        newLabel="New Layout Block"
        newHref="/admin/layout-blocks/new"
      />

      <ListToolbar>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="h-[30px] w-[200px] text-[13px] bg-white border-slate-300 rounded">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={String(lang.id)}>
                {lang.flag} {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : layoutBlocks.length === 0 ? (
          <EmptyState
            icon={Component}
            title="No layout blocks found"
            description="Create your first layout block to get started"
          />
        ) : (
          <>
            <ListTable>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th width={200}>Slug</Th>
                  <Th width={140}>Language</Th>
                  <Th width={160}>Source</Th>
                  <Th width={140} align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {layoutBlocks.map((lb) => {
                  const isCustom = lb.source === "custom";
                  return (
                    <Tr key={lb.id}>
                      <Td>
                        <TitleCell to={`/admin/layout-blocks/${lb.id}`} title={lb.name} />
                      </Td>
                      <Td className="font-mono text-[12px] text-slate-500">{lb.slug}</Td>
                      <Td className="text-slate-600">
                        {lb.language_id != null
                          ? (languages.find(l => l.id === lb.language_id)?.name || String(lb.language_id))
                          : "All"}
                      </Td>
                      <Td>
                        {lb.source === "theme" ? (
                          <Chip>{lb.theme_name || "Theme"}</Chip>
                        ) : lb.source === "extension" ? (
                          <Chip>Extension</Chip>
                        ) : (
                          <Chip>Custom</Chip>
                        )}
                      </Td>
                      <Td align="right" className="whitespace-nowrap">
                        <RowActions
                          editTo={`/admin/layout-blocks/${lb.id}`}
                          onDelete={isCustom ? () => setDeleteTarget(lb) : undefined}
                          disableDelete={!isCustom}
                          deleteTitle={isCustom ? "Delete" : "Built-in, cannot delete"}
                          extra={
                            !isCustom ? (
                              <button
                                type="button"
                                title="Detach from source"
                                onClick={() => handleDetach(lb)}
                                disabled={detachingId === lb.id}
                                className="w-[26px] h-[26px] grid place-items-center text-amber-600 hover:bg-amber-50 hover:border-amber-200 border border-transparent rounded-[2px] cursor-pointer bg-transparent disabled:opacity-40"
                              >
                                <Unplug className="w-3 h-3" />
                              </button>
                            ) : undefined
                          }
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </ListTable>
            {meta && (
              <ListFooter
                page={meta.page}
                totalPages={meta.total_pages}
                total={meta.total}
                perPage={meta.per_page}
                onPage={setPage}
                label="layout blocks"
              />
            )}
          </>
        )}
      </ListCard>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Layout Block</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageShell>
  );
}
