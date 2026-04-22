import { useEffect, useState, useCallback } from "react";
import { Square, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getBlockTypesPaginated,
  deleteBlockType,
  detachBlockType,
  type BlockType,
  type PaginationMeta,
} from "@/api/client";
import {
  ListPageShell,
  ListHeader,
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

export default function BlockTypesListPage() {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BlockType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [detachingId, setDetachingId] = useState<number | null>(null);

  const fetchBlockTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBlockTypesPaginated({ page, per_page: 25 });
      setBlockTypes(res.data);
      setMeta(res.meta);
    } catch {
      toast.error("Failed to load block types");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBlockTypes();
  }, [fetchBlockTypes]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBlockType(deleteTarget.id);
      toast.success("Block type deleted successfully");
      setDeleteTarget(null);
      fetchBlockTypes();
    } catch {
      toast.error("Failed to delete block type");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDetach(bt: BlockType) {
    setDetachingId(bt.id);
    try {
      await detachBlockType(bt.id);
      toast.success(`"${bt.label}" detached from ${bt.source}`);
      fetchBlockTypes();
    } catch {
      toast.error("Failed to detach block type");
    } finally {
      setDetachingId(null);
    }
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Block Types"
        count={meta?.total ?? blockTypes.length}
        newLabel="New Block Type"
        newHref="/admin/block-types/new"
      />

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : blockTypes.length === 0 ? (
          <EmptyState
            icon={Square}
            title="No block types found"
            description="Create your first block type to get started"
          />
        ) : (
          <>
            <ListTable>
              <thead>
                <tr>
                  <Th>Label</Th>
                  <Th width={200}>Slug</Th>
                  <Th width={90}>Fields</Th>
                  <Th width={160}>Source</Th>
                  <Th>Description</Th>
                  <Th width={140} align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {blockTypes.map((bt) => {
                  const isCustom = bt.source === "custom";
                  return (
                    <Tr key={bt.id}>
                      <Td>
                        <TitleCell to={`/admin/block-types/${bt.id}/edit`} title={bt.label} />
                      </Td>
                      <Td className="font-mono text-[12px] text-slate-500">{bt.slug}</Td>
                      <Td className="text-slate-500">{bt.field_schema?.length ?? 0}</Td>
                      <Td>
                        {bt.source === "theme" ? (
                          <Chip>{bt.theme_name || "Theme"}</Chip>
                        ) : bt.source === "extension" ? (
                          <Chip>Extension</Chip>
                        ) : (
                          <Chip>Custom</Chip>
                        )}
                      </Td>
                      <Td className="text-slate-500">
                        <span className="block max-w-xs truncate" title={bt.description || ""}>
                          {bt.description || "—"}
                        </span>
                      </Td>
                      <Td align="right" className="whitespace-nowrap">
                        <RowActions
                          editTo={`/admin/block-types/${bt.id}/edit`}
                          onDelete={isCustom ? () => setDeleteTarget(bt) : undefined}
                          disableDelete={!isCustom}
                          deleteTitle={isCustom ? "Delete" : "Built-in, cannot delete"}
                          extra={
                            !isCustom ? (
                              <button
                                type="button"
                                title="Detach from source"
                                onClick={() => handleDetach(bt)}
                                disabled={detachingId === bt.id}
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
                label="block types"
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
            <DialogTitle>Delete Block Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;?
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
