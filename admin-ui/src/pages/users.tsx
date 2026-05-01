import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { queryUsers, getRoles, type User, type Role } from "@/api/client";
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
  StatusPill,
  Chip,
  TitleCell,
  RowActions,
  EmptyState,
  LoadingRow,
  ListFooter,
} from "@/components/ui/list-page";

interface UserDetail extends User {
  role_id: number;
  is_active?: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || "An unexpected error occurred");
  }
  return body as T;
}

async function deleteUser(id: number): Promise<void> {
  await apiFetch<void>(`/admin/api/users/${id}`, { method: "DELETE" });
}

function getRoleName(role: User["role"]): string {
  if (!role) return "Unknown";
  if (typeof role === "string") return role;
  return role.name || "Unknown";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Never";
  return d.toLocaleDateString("en-GB");
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Never";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UsersPage() {
  // URL = source of truth so refresh / deep-link reproduces the view.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.max(1, Math.min(100, Number(searchParams.get("per_page") || "25")));
  const urlSearch = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const filterRole = searchParams.get("role") || "all";
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

  const [users, setUsers] = useState<UserDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const usersRes = await queryUsers({
        page,
        perPage,
        search: urlSearch,
        status,
        role: filterRole,
        sort: sortBy || undefined,
        order: sortBy ? sortOrder : undefined,
      });
      setUsers(usersRes.data as UserDetail[]);
      setTotal(usersRes.meta.total);
      setTotalPages(usersRes.meta.total_pages);
      setTotalAll(usersRes.meta.total_all ?? usersRes.meta.total);
      setActiveCount(usersRes.meta.active_count ?? 0);
      setInactiveCount(usersRes.meta.inactive_count ?? 0);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, status, filterRole, sortBy, sortOrder]);

  // Roles for the filter dropdown — load once. Uses the legacy unpaginated
  // shape so we get the full list regardless of how many roles exist.
  useEffect(() => {
    getRoles().then(setRoles).catch(() => {});
  }, []);

  function openDeleteDialog(user: UserDetail) {
    setDeletingUser(user);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      toast.success("User deleted successfully");
      setShowDelete(false);
      setDeletingUser(null);
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
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
  function setRoleFilter(next: string) {
    setSearchParams((prev) => {
      if (!next || next === "all") prev.delete("role");
      else prev.set("role", next);
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
        title="Users"
        tabs={[
          { value: "all", label: "All", count: totalAll },
          { value: "active", label: "Active", count: activeCount },
          { value: "inactive", label: "Inactive", count: inactiveCount },
        ]}
        activeTab={status}
        onTabChange={setStatusTab}
        newLabel="Add User"
        newHref="/admin/security/users/new"
      />

      <ListToolbar>
        <ListSearch value={searchInput} onChange={setSearchInput} placeholder="Search users…" />
        <Select value={filterRole} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((r) => <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description='Click "Add User" to create one.'
            action={
              <Link
                to="/admin/security/users/new"
                className="h-[30px] px-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-primary rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                Add User
              </Link>
            }
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="full_name" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Full Name</SortableTh>
                <SortableTh column="email" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Email</SortableTh>
                <Th width={140}>Role</Th>
                <Th width={110}>Status</Th>
                <SortableTh column="last_login_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={170}>Last Login</SortableTh>
                <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={130}>Created</SortableTh>
                <Th width={110} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isActive = user.is_active !== false;
                return (
                  <Tr key={user.id}>
                    <Td>
                      <TitleCell to={`/admin/security/users/${user.id}/edit`} title={user.full_name} />
                    </Td>
                    <Td className="text-muted-foreground">{user.email}</Td>
                    <Td>
                      <Chip>{getRoleName(user.role)}</Chip>
                    </Td>
                    <Td>
                      <StatusPill status={isActive ? "active" : "inactive"} />
                    </Td>
                    <Td className="font-mono text-[12px] text-muted-foreground tabular-nums">
                      {formatDateTime(user.last_login_at)}
                    </Td>
                    <Td className="font-mono text-[12px] text-muted-foreground tabular-nums">
                      {formatDate(user.created_at)}
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <RowActions
                        editTo={`/admin/security/users/${user.id}/edit`}
                        onDelete={() => openDeleteDialog(user)}
                      />
                    </Td>
                  </Tr>
                );
              })}
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
        label="users"
      />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingUser?.full_name}&quot; ({deletingUser?.email})? This action cannot be undone.
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
