import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
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
  listTerms,
  deleteTerm,
  getNodeTypes,
  getTaxonomy,
  type NodeType,
  type Taxonomy,
  type TaxonomyTerm,
} from "@/api/client";
import { toast } from "sonner";
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
  EmptyState,
  LoadingRow,
} from "@/components/ui/list-page";

export default function TaxonomyTermsPage() {
  const { nodeType, taxonomy } = useParams<{
    nodeType: string;
    taxonomy: string;
  }>();
  const [terms, setTerms] = useState<TaxonomyTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nodeTypeDef, setNodeTypeDef] = useState<NodeType | null>(null);
  const [taxonomyDef, setTaxonomyDef] = useState<Taxonomy | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TaxonomyTerm | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!nodeType || !taxonomy) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeType, taxonomy]);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      listTerms(nodeType!, taxonomy!),
      getNodeTypes().then(
        (types) => types.find((t) => t.slug === nodeType) || null
      ),
      getTaxonomy(taxonomy!).catch(() => null),
    ])
      .then(([termsData, typeDef, taxDef]) => {
        setTerms(Array.isArray(termsData) ? termsData : []);
        setNodeTypeDef(typeDef);
        setTaxonomyDef(taxDef);
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTerm(deleteTarget.id);
      toast.success("Term deleted");
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete term");
    } finally {
      setDeleting(false);
    }
  };

  const filteredTerms = (terms || []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const taxLabel =
    taxonomyDef?.label ||
    nodeTypeDef?.taxonomies?.find((t: any) => t.slug === taxonomy)?.label ||
    taxonomy ||
    "Taxonomy";
  const taxLabelPlural = taxonomyDef?.label_plural || taxLabel;
  const basePath =
    nodeType === "page"
      ? "/admin/pages"
      : nodeType === "post"
        ? "/admin/posts"
        : `/admin/content/${nodeType}`;

  const backLink = (
    <Link
      to={basePath}
      className="h-[26px] px-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
    >
      <ArrowLeft className="w-3 h-3" />
      Back
    </Link>
  );

  return (
    <ListPageShell>
      <ListHeader
        title={taxLabelPlural}
        count={terms.length}
        newLabel={`New ${taxLabel}`}
        newHref={`/admin/content/${nodeType}/taxonomies/${taxonomy}/new`}
        extra={backLink}
      />

      <ListToolbar>
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder={`Search ${taxLabelPlural.toLowerCase()}…`}
        />
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : filteredTerms.length === 0 ? (
          <EmptyState
            icon={Tag}
            title={search ? "No terms match your search" : `No ${taxLabelPlural.toLowerCase()} yet`}
            description={search ? "Try a different search term" : `Create your first ${taxLabel.toLowerCase()} to get started`}
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th width={200}>Slug</Th>
                <Th width={80} align="center">Count</Th>
                <Th width={110} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.map((term) => (
                <Tr key={term.id}>
                  <Td>
                    <TitleCell
                      to={`/admin/content/${nodeType}/taxonomies/${taxonomy}/${term.id}/edit`}
                      title={term.name}
                    />
                    {term.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{term.description}</p>
                    )}
                  </Td>
                  <Td className="font-mono text-[12px] text-slate-500">{term.slug}</Td>
                  <Td align="center">
                    <Link
                      to={`${basePath}?${taxonomy}=${encodeURIComponent(term.name)}`}
                      className="inline-flex h-[22px] min-w-[24px] items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      {term.count}
                    </Link>
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      editTo={`/admin/content/${nodeType}/taxonomies/${taxonomy}/${term.id}/edit`}
                      onDelete={() => setDeleteTarget(term)}
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
            <DialogTitle>Delete {taxLabel}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              This will remove the term but existing content keeps its assignments.
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
