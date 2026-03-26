import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ListTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getMenus,
  deleteMenu,
  getLanguages,
  type Menu,
  type Language,
} from "@/api/client";

export default function MenusListPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [langFilter, setLangFilter] = useState("");

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const params: { language_id?: number } = {};
      if (langFilter) params.language_id = Number(langFilter);
      const data = await getMenus(params);
      setMenus(data);
    } catch {
      toast.error("Failed to load menus");
    } finally {
      setLoading(false);
    }
  }, [langFilter]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    getLanguages(true)
      .then(setLanguages)
      .catch(() => {});
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMenu(deleteTarget.id);
      toast.success("Menu deleted successfully");
      setDeleteTarget(null);
      fetchMenus();
    } catch {
      toast.error("Failed to delete menu");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Menus</h1>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang.id} value={String(lang.id)}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium">
            <Link to="/admin/menus/new">
              <Plus className="mr-2 h-4 w-4" />
              New Menu
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden py-0 gap-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : menus.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
              <ListTree className="h-12 w-12" />
              <p className="text-lg font-medium">No menus found</p>
              <p className="text-sm">Create your first menu to get started</p>
              <Button asChild className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg font-medium">
                <Link to="/admin/menus/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Menu
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</TableHead>
                  <TableHead className="hidden text-xs font-semibold text-slate-500 uppercase tracking-wider sm:table-cell">Language</TableHead>
                  <TableHead className="hidden text-xs font-semibold text-slate-500 uppercase tracking-wider sm:table-cell">Version</TableHead>
                  <TableHead className="hidden text-xs font-semibold text-slate-500 uppercase tracking-wider md:table-cell">Items</TableHead>
                  <TableHead className="w-24 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id} className="hover:bg-slate-50">
                    <TableCell className="px-6 py-4 text-sm">
                      <Link
                        to={`/admin/menus/${menu.id}`}
                        className="font-medium text-slate-800 hover:text-indigo-600"
                      >
                        {menu.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-500">
                      {menu.slug}
                    </TableCell>
                    <TableCell className="hidden px-6 py-4 text-sm text-slate-500 sm:table-cell">
                      {menu.language_id != null ? (languages.find(l => l.id === menu.language_id)?.name || String(menu.language_id)) : "All"}
                    </TableCell>
                    <TableCell className="hidden px-6 py-4 text-sm text-slate-500 sm:table-cell">
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 text-xs">
                        v{menu.version}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden px-6 py-4 text-sm text-slate-500 md:table-cell">
                      {menu.items?.length ?? 0}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link to={`/admin/menus/${menu.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(menu)}
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

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
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
