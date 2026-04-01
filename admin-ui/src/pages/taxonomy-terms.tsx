import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Search,
  Trash2,
  Pencil,
  Plus,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  type NodeType,
  type TaxonomyTerm,
} from "@/api/client";
import { toast } from "sonner";

export default function TaxonomyTermsPage() {
  const { nodeType, taxonomy } = useParams<{
    nodeType: string;
    taxonomy: string;
  }>();
  const [terms, setTerms] = useState<TaxonomyTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nodeTypeDef, setNodeTypeDef] = useState<NodeType | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyTerm | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!nodeType || !taxonomy) return;
    refresh();
  }, [nodeType, taxonomy]);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      listTerms(nodeType!, taxonomy!),
      getNodeTypes().then(
        (types) => types.find((t) => t.slug === nodeType) || null
      ),
    ])
      .then(([termsData, typeDef]) => {
        setTerms(Array.isArray(termsData) ? termsData : []);
        setNodeTypeDef(typeDef);
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
    nodeTypeDef?.taxonomies?.find((t: any) => t.slug === taxonomy)?.label ||
    taxonomy ||
    "Taxonomy";
  const typeLabel = nodeTypeDef?.label || nodeType;
  const basePath =
    nodeType === "page"
      ? "/admin/pages"
      : nodeType === "post"
        ? "/admin/posts"
        : `/admin/content/${nodeType}`;

  if (loading && terms.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-lg hover:bg-slate-200"
          >
            <Link to={basePath}>
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{taxLabel}</h1>
            <p className="text-sm text-slate-500">
              Manage {taxLabel.toLowerCase()} for {typeLabel}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium"
        >
          <Link to={`/admin/content/${nodeType}/taxonomies/${taxonomy}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New {taxLabel}
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={`Search ${taxLabel.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <Badge
          variant="secondary"
          className="h-9 px-3 rounded-lg bg-slate-100 text-slate-600 font-medium text-xs shrink-0 flex items-center"
        >
          {filteredTerms.length}{" "}
          {filteredTerms.length === 1 ? "term" : "terms"}
        </Badge>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {filteredTerms.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <Tag className="h-10 w-10" />
              <p className="text-sm font-medium">
                {search
                  ? "No terms match your search"
                  : `No ${taxLabel.toLowerCase()} yet`}
              </p>
              {!search && (
                <Button
                  asChild
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium"
                >
                  <Link to={`/admin/content/${nodeType}/taxonomies/${taxonomy}/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    New {taxLabel}
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Slug
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[80px]">
                    Count
                  </TableHead>
                  <TableHead className="w-24 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerms.map((term) => (
                  <TableRow key={term.id} className="hover:bg-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 shrink-0">
                          <Tag className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/content/${nodeType}/taxonomies/${taxonomy}/${term.id}/edit`}
                            className="font-medium text-slate-800 hover:text-indigo-600 truncate block"
                          >
                            {term.name}
                          </Link>
                          {term.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {term.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 hidden sm:table-cell">
                      <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {term.slug}
                      </code>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Link
                        to={`${basePath}?${taxonomy}=${encodeURIComponent(term.name)}`}
                        className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                      >
                        {term.count}
                      </Link>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link
                            to={`/admin/content/${nodeType}/taxonomies/${taxonomy}/${term.id}/edit`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(term)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {taxLabel}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This will remove the term
              but existing content keeps its assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
