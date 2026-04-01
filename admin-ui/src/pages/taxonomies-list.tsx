import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getTaxonomies,
  deleteTaxonomy,
  type Taxonomy,
} from "@/api/client";

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

  if (loading && taxonomies.length === 0) {
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
        <h1 className="text-2xl font-bold text-slate-900">Taxonomies</h1>
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium"
        >
          <Link to="/admin/taxonomies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Taxonomy
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search taxonomies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {filteredTaxonomies.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <Tag className="h-10 w-10" />
              <p className="text-sm font-medium">
                {search
                  ? "No taxonomies match your search"
                  : "No taxonomies yet"}
              </p>
              {!search && (
                <Button
                  asChild
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium"
                >
                  <Link to="/admin/taxonomies/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Taxonomy
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Label
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Slug
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Content Types
                  </TableHead>
                  <TableHead className="w-24 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaxonomies.map((tax) => (
                  <TableRow
                    key={tax.slug}
                    className="hover:bg-slate-50"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 shrink-0">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/taxonomies/${tax.slug}/edit`}
                            className="font-medium text-slate-800 hover:text-indigo-600"
                          >
                            {tax.label}
                          </Link>
                          {tax.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {tax.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 hidden sm:table-cell">
                      <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {tax.slug}
                      </code>
                    </TableCell>
                    <TableCell className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {tax.node_types?.length > 0 ? (
                          tax.node_types.map((nt) => (
                            <Badge
                              key={nt}
                              variant="secondary"
                              className="bg-slate-100 text-slate-600 border-0 text-[10px] uppercase font-bold tracking-tight"
                            >
                              {nt}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link to={`/admin/taxonomies/${tax.slug}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(tax)}
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

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Taxonomy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.label}</strong>? This will remove the
              definition and all associated terms.
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
