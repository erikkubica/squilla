import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
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
import { queryRoles, deleteRole, type Role } from "@/api/client";
import {
  ListPageShell,
  ListHeader,
  ListToolbar,
  ListSearch,
  ListCard,
  ListTable,
  Th,
  SortableTh,
  Tr,
  Td,
  Chip,
  TitleCell,
  RowActions,
  EmptyState,
  LoadingRow,
  ListFooter,
} from "@/components/ui/list-page";

interface RoleWithPerms extends Role {
  permissions?: unknown[] | Record<string, unknown>;
}

export default function RolesPage() {
  const navigate = useNavigate();

  // URL = source of truth.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.max(1, Math.min(200, Number(searchParams.get("per_page") || "25")));
  const urlSearch = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sort") || "";
  const sortOrder = (searchParams.get("order") as "asc" | "desc") || "asc";

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === (searchParams.get("search") || "")) return;
      setSearchParams((prev) => {
        if (searchInput) prev.set("search", searchInput);
        else prev.delete("search");
        prev.delete("page");
        return prev;
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [roles, setRoles] = useState<RoleWithPerms[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);
  const [systemCount, setSystemCount] = useState(0);
  const [customCount, setCustomCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await queryRoles({
        page,
        perPage,
        search: urlSearch,
        status,
        sort: sortBy || undefined,
        order: sortBy ? sortOrder : undefined,
      });
      setRoles(res.data as RoleWithPerms[]);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setTotalAll(res.meta.total_all ?? res.meta.total);
      setSystemCount(res.meta.system_count ?? 0);
      setCustomCount(res.meta.custom_count ?? 0);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, status, sortBy, sortOrder]);

  function openDeleteDialog(role: Role) {
    setDeletingRole(role);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      await deleteRole(deletingRole.id);
      toast.success("Role deleted successfully");
      setShowDelete(false);
      setDeletingRole(null);
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete role";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  function permissionCount(role: RoleWithPerms): number {
    const p = role.permissions;
    if (!p) return 0;
    if (Array.isArray(p)) return p.length;
    if (typeof p === "object") return Object.keys(p).length;
    return 0;
  }

  function setPage(next: number) {
    setSearchParams((prev) => {
      if (next <= 1) prev.delete("page");
      else prev.set("page", String(next));
      return prev;
    });
  }
  function setPerPage(next: number) {
    setSearchParams((prev) => {
      if (next === 25) prev.delete("per_page");
      else prev.set("per_page", String(next));
      prev.delete("page");
      return prev;
    });
  }
  function setStatusTab(next: string) {
    setSearchParams((prev) => {
      if (!next || next === "all") prev.delete("status");
      else prev.set("status", next);
      prev.delete("page");
      return prev;
    });
  }
  function setSort(col: string, order: "asc" | "desc") {
    setSearchParams((prev) => {
      prev.set("sort", col);
      prev.set("order", order);
      prev.delete("page");
      return prev;
    });
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Roles"
        tabs={[
          { value: "all", label: "All", count: totalAll },
          { value: "system", label: "System", count: systemCount },
          { value: "custom", label: "Custom", count: customCount },
        ]}
        activeTab={status}
        onTabChange={setStatusTab}
        newLabel="Add Role"
        onNew={() => navigate("/admin/security/roles/new")}
      />

      <ListToolbar>
        <ListSearch value={searchInput} onChange={setSearchInput} placeholder="Search roles…" />
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : roles.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No roles configured yet"
            description='Click "Add Role" to get started.'
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Name</SortableTh>
                <Th>Description</Th>
                <Th width={130}>Permissions</Th>
                <Th width={110}>Type</Th>
                <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={130}>Created</SortableTh>
                <Th width={110} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <Tr key={role.id}>
                  <Td>
                    <TitleCell
                      to={`/admin/security/roles/${role.id}/edit`}
                      title={role.name}
                      slug={role.slug}
                    />
                  </Td>
                  <Td className="text-muted-foreground">
                    <span className="block max-w-md truncate" title={role.description || ""}>
                      {role.description || <span className="" style={{color: "var(--fg-subtle)"}}>—</span>}
                    </span>
                  </Td>
                  <Td className="font-mono text-[12px] text-muted-foreground tabular-nums">
                    {permissionCount(role)}
                  </Td>
                  <Td>
                    {role.is_system ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-px text-[11px] font-medium text-foreground bg-muted border border-border rounded-[2px]">
                        <Lock className="w-3 h-3" />
                        System
                      </span>
                    ) : (
                      <Chip>Custom</Chip>
                    )}
                  </Td>
                  <Td className="font-mono text-[12px] text-muted-foreground tabular-nums">
                    {role.created_at ? new Date(role.created_at).toLocaleDateString("en-GB") : "—"}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      onEdit={() => navigate(`/admin/security/roles/${role.id}/edit`)}
                      onDelete={role.is_system ? undefined : () => openDeleteDialog(role)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </ListTable>
        )}
      </ListCard>

      <ListFooter
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPage={setPage}
        onPerPage={setPerPage}
        label="roles"
      />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingRole?.name}&quot;? This action cannot be undone. Users with this role will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
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
