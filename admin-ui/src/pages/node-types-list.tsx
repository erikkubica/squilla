import { useEffect, useState, useCallback } from "react";
import { Boxes } from "lucide-react";
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
  getNodeTypes,
  deleteNodeType,
  type NodeType,
} from "@/api/client";
import {
  ListPageShell,
  ListHeader,
  ListCard,
  ListTable,
  Th,
  Tr,
  Td,
  TitleCell,
  RowActions,
  Chip,
  EmptyState,
  LoadingRow,
} from "@/components/ui/list-page";

const BUILT_IN_SLUGS = ["page", "post"];

export default function NodeTypesListPage() {
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<NodeType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNodeTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNodeTypes();
      setNodeTypes(data);
    } catch {
      toast.error("Failed to load content types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodeTypes();
  }, [fetchNodeTypes]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNodeType(deleteTarget.id);
      toast.success("Content type deleted successfully");
      setDeleteTarget(null);
      fetchNodeTypes();
    } catch {
      toast.error("Failed to delete content type");
    } finally {
      setDeleting(false);
    }
  }

  function isBuiltIn(slug: string): boolean {
    return BUILT_IN_SLUGS.includes(slug);
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Content Types"
        count={nodeTypes.length}
        newLabel="New Content Type"
        newHref="/admin/content-types/new"
      />

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : nodeTypes.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No content types found"
            description="Create your first content type to get started"
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th width={200}>Slug</Th>
                <Th width={100}>Fields</Th>
                <Th width={140}>Created</Th>
                <Th width={110} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {nodeTypes.map((nt) => {
                const builtIn = isBuiltIn(nt.slug);
                return (
                  <Tr key={nt.id}>
                    <Td>
                      <TitleCell
                        to={`/admin/content-types/${nt.id}/edit`}
                        title={nt.label}
                        extra={builtIn ? <Chip>Built-in</Chip> : undefined}
                      />
                    </Td>
                    <Td className="font-mono text-[12px] text-slate-500">{nt.slug}</Td>
                    <Td className="text-slate-500">{nt.field_schema?.length ?? 0}</Td>
                    <Td className="font-mono text-[12px] text-slate-500 tabular-nums">
                      {new Date(nt.created_at).toLocaleDateString()}
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <RowActions
                        editTo={`/admin/content-types/${nt.id}/edit`}
                        onDelete={builtIn ? undefined : () => setDeleteTarget(nt)}
                        disableDelete={builtIn}
                        deleteTitle={builtIn ? "Built-in, cannot delete" : "Delete"}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </ListTable>
        )}
      </ListCard>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;?
              This action cannot be undone. All content using this type may become inaccessible.
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
