import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
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
  getTaxonomies,
  deleteTaxonomy,
  type Taxonomy,
} from "@/api/client";
import {
  ListPageShell,
  ListHeader,
  ListToolbar,
  ListSearch,
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

export default function TaxonomiesListPage() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Taxonomy | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTaxonomies();
  }, []);

  async function fetchTaxonomies() {
    setLoading(true);
    try {
      const data = await getTaxonomies();
      setTaxonomies(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load taxonomies");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTaxonomy(deleteTarget.slug);
      toast.success("Taxonomy deleted");
      setDeleteTarget(null);
      fetchTaxonomies();
    } catch {
      toast.error("Failed to delete taxonomy");
    } finally {
      setDeleting(false);
    }
  }

  const filteredTaxonomies = taxonomies.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ListPageShell>
      <ListHeader
        title="Taxonomies"
        count={taxonomies.length}
        newLabel="New Taxonomy"
        newHref="/admin/taxonomies/new"
      />

      <ListToolbar>
        <ListSearch value={search} onChange={setSearch} placeholder="Search taxonomies…" />
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : filteredTaxonomies.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={search ? "No taxonomies match your search" : "No taxonomies yet"}
            description={search ? "Try a different search term" : "Create your first taxonomy to get started"}
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th width={200}>Slug</Th>
                <Th width={280}>Content Types</Th>
                <Th width={110} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxonomies.map((tax) => (
                <Tr key={tax.slug}>
                  <Td>
                    <TitleCell
                      to={`/admin/taxonomies/${tax.slug}/edit`}
                      title={tax.label}
                    />
                    {tax.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tax.description}</p>
                    )}
                  </Td>
                  <Td className="font-mono text-[12px] text-slate-500">{tax.slug}</Td>
                  <Td>
                    {tax.node_types?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tax.node_types.map((nt) => (
                          <Chip key={nt}>{nt}</Chip>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[12px] italic">Not assigned</span>
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      editTo={`/admin/taxonomies/${tax.slug}/edit`}
                      onDelete={() => setDeleteTarget(tax)}
                    />
                  </Td>
                </Tr>
              ))}
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
            <DialogTitle>Delete Taxonomy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.label}</strong>?
              This will remove the definition and all associated terms.
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
