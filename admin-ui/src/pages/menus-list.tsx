import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ListTree, Plus, Globe } from "lucide-react";
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
  getMenus,
  deleteMenu,
  getLanguages,
  type Menu,
  type Language,
} from "@/api/client";
import {
  ListPageShell,
  ListHeader,
  ListToolbar,
  ListCard,
  ListTable,
  Th,
  Tr,
  Td,
  Chip,
  TitleCell,
  RowActions,
  EmptyState,
  LoadingRow,
} from "@/components/ui/list-page";

export default function MenusListPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [langFilter, setLangFilter] = useState("all");

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const params: { language_id?: number } = {};
      if (langFilter && langFilter !== "all") params.language_id = Number(langFilter);
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
    <ListPageShell>
      <ListHeader
        title="Menus"
        count={menus.length}
        newLabel="New Menu"
        newHref="/admin/menus/new"
      />

      <ListToolbar>
        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="h-[30px] w-[200px] text-[13px] bg-white border-slate-300 rounded">
            <Globe className="mr-1 h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="Language" />
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
        ) : menus.length === 0 ? (
          <EmptyState
            icon={ListTree}
            title="No menus found"
            description="Create your first menu to get started"
            action={
              <Link
                to="/admin/menus/new"
                className="h-[30px] px-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                New Menu
              </Link>
            }
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th width={160}>Language</Th>
                <Th width={90}>Version</Th>
                <Th width={90}>Items</Th>
                <Th width={120} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => {
                const lang = menu.language_id != null ? languages.find((l) => l.id === menu.language_id) : null;
                return (
                  <Tr key={menu.id}>
                    <Td>
                      <TitleCell to={`/admin/menus/${menu.id}`} title={menu.name} slug={menu.slug} />
                    </Td>
                    <Td>
                      {lang ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-700">
                          <span>{lang.flag}</span>
                          {lang.name}
                        </span>
                      ) : menu.language_id != null ? (
                        <span className="font-mono text-[12px] text-slate-400">{menu.language_id}</span>
                      ) : (
                        <Chip>All</Chip>
                      )}
                    </Td>
                    <Td>
                      <Chip>v{menu.version}</Chip>
                    </Td>
                    <Td className="font-mono text-[12px] text-slate-500 tabular-nums">
                      {menu.items?.length ?? 0}
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <RowActions
                        editTo={`/admin/menus/${menu.id}`}
                        onDelete={() => setDeleteTarget(menu)}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </ListTable>
        )}
      </ListCard>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
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
