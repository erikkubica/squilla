import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Settings } from "@squilla/icons";
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
  TitleCell,
  Chip,
  RowActions,
  EmptyState,
  LoadingRow,
  ListFooter,
  Button,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@squilla/ui";
import { toast } from "sonner";
import {
  updateEmailRule,
  deleteEmailRule,
  getEmailTemplates,
  getSystemActions,
} from "@squilla/api";

interface EmailTemplate {
  id: number;
  name: string;
}

interface SystemAction {
  slug: string;
  label: string;
}

interface EmailRule {
  id: number;
  action: string;
  node_type: string | null;
  template_id: number;
  recipient_type: string;
  recipient_value: string;
  enabled: boolean;
  updated_at: string;
}

interface RuleListMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  total_all?: number;
  enabled_count?: number;
  disabled_count?: number;
}

async function fetchRuleList(qs: URLSearchParams): Promise<{ data: EmailRule[]; meta: RuleListMeta }> {
  const url = `/admin/api/ext/email-manager/rules${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load rules");
  return res.json();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

export default function EmailRules() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.max(1, Math.min(100, Number(searchParams.get("per_page") || "25")));
  const urlSearch = searchParams.get("search") || "";
  const enabledTab = searchParams.get("enabled") || "all";
  const sortBy = searchParams.get("sort") || "";
  const sortOrder = (searchParams.get("order") as "asc" | "desc") || "asc";

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === (searchParams.get("search") || "")) return;
      setSearchParams((prev: URLSearchParams) => {
        if (searchInput) prev.set("search", searchInput);
        else prev.delete("search");
        prev.delete("page");
        return prev;
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [rules, setRules] = useState<EmailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);
  const [enabledCount, setEnabledCount] = useState(0);
  const [disabledCount, setDisabledCount] = useState(0);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [actions, setActions] = useState<SystemAction[]>([]);

  const [showDelete, setShowDelete] = useState(false);
  const [deletingRule, setDeletingRule] = useState<EmailRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchRules() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (urlSearch) qs.set("search", urlSearch);
      if (enabledTab && enabledTab !== "all") qs.set("enabled", enabledTab);
      if (sortBy) {
        qs.set("sort", sortBy);
        qs.set("order", sortOrder);
      }
      qs.set("page", String(page));
      qs.set("per_page", String(perPage));
      const res = await fetchRuleList(qs);
      setRules(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setTotalAll(res.meta.total_all ?? res.meta.total);
      setEnabledCount(res.meta.enabled_count ?? 0);
      setDisabledCount(res.meta.disabled_count ?? 0);
    } catch {
      toast.error("Failed to load email rules");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLookups() {
    try {
      const [tpls, acts] = await Promise.all([getEmailTemplates(), getSystemActions()]);
      setTemplates(tpls);
      setActions(acts);
    } catch {
      // Non-fatal
    }
  }

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, enabledTab, sortBy, sortOrder]);

  useEffect(() => {
    fetchLookups();
  }, []);

  function setEnabledTab(next: string) {
    setSearchParams((prev: URLSearchParams) => {
      if (!next || next === "all") prev.delete("enabled");
      else prev.set("enabled", next);
      prev.delete("page");
      return prev;
    });
  }
  function setSort(col: string, order: "asc" | "desc") {
    setSearchParams((prev: URLSearchParams) => {
      prev.set("sort", col);
      prev.set("order", order);
      prev.delete("page");
      return prev;
    });
  }
  function setPage(next: number) {
    setSearchParams((prev: URLSearchParams) => {
      if (next <= 1) prev.delete("page");
      else prev.set("page", String(next));
      return prev;
    });
  }
  function setPerPage(next: number) {
    setSearchParams((prev: URLSearchParams) => {
      if (next === 25) prev.delete("per_page");
      else prev.set("per_page", String(next));
      prev.delete("page");
      return prev;
    });
  }

  async function handleToggleEnabled(rule: EmailRule) {
    try {
      await updateEmailRule(rule.id, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
      // Refresh counts.
      fetchRules();
      toast.success(`Rule ${!rule.enabled ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update rule");
    }
  }

  function openDeleteDialog(rule: EmailRule) {
    setDeletingRule(rule);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deletingRule) return;
    setDeleting(true);
    try {
      await deleteEmailRule(deletingRule.id);
      toast.success("Email rule deleted successfully");
      setShowDelete(false);
      setDeletingRule(null);
      await fetchRules();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete email rule";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  function getTemplateName(id: number): string {
    return templates.find((t) => t.id === id)?.name || `Template #${id}`;
  }

  function getActionLabel(slug: string): string {
    return actions.find((a) => a.slug === slug)?.label || slug;
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Email Rules"
        tabs={[
          { value: "all", label: "All", count: totalAll },
          { value: "true", label: "Enabled", count: enabledCount },
          { value: "false", label: "Disabled", count: disabledCount },
        ]}
        activeTab={enabledTab}
        onTabChange={setEnabledTab}
        newLabel="Add Rule"
        newHref="/admin/ext/email-manager/rules/new"
      />

      <ListToolbar>
        <ListSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search rules…"
        />
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Settings}
            title="No email rules found"
            description={urlSearch || enabledTab !== "all" ? "Try a different search or filter." : 'Click "Add Rule" to get started.'}
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="action" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Action</SortableTh>
                <Th width={140}>Node Type</Th>
                <Th>Template</Th>
                <Th>Recipient</Th>
                <Th width={90}>Enabled</Th>
                <SortableTh column="updated_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={130}>Updated</SortableTh>
                <Th width={90} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <Tr key={rule.id}>
                  <Td>
                    <TitleCell
                      to={`/admin/ext/email-manager/rules/${rule.id}`}
                      title={getActionLabel(rule.action)}
                    />
                  </Td>
                  <Td>
                    {rule.node_type ? (
                      <Chip>{rule.node_type}</Chip>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">
                    {getTemplateName(rule.template_id)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Chip>{rule.recipient_type}</Chip>
                      {rule.recipient_value && (
                        <span className="text-[13px] text-muted-foreground">{rule.recipient_value}</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleEnabled(rule)}
                    />
                  </Td>
                  <Td className="font-mono text-[12px] text-muted-foreground tabular-nums">
                    {formatDate(rule.updated_at)}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      editTo={`/admin/ext/email-manager/rules/${rule.id}`}
                      onDelete={() => openDeleteDialog(rule)}
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
        label="rules"
      />

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Email Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this email rule? This action cannot be undone.
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
