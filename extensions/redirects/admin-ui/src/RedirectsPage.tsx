import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, CornerUpRight, Download, FlaskConical, Upload } from "@squilla/icons";
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ListCard,
  ListFooter,
  ListHeader,
  ListPageShell,
  ListSearch,
  ListTable,
  ListToolbar,
  LoadingRow,
  RowActions,
  SortableTh,
  Switch,
  Td,
  Th,
  Tr,
} from "@squilla/ui";
import { toast } from "sonner";
import { API, bulkRules, deleteRule, getSettings, listRules, saveSettings, updateRule, type Rule, type RuleList } from "./api";
import RuleDialog from "./RuleDialog";
import { ImportDialog, TestDialog } from "./ToolDialogs";

const MATCH_LABEL: Record<string, string> = { prefix: "starts with", regex: "regex" };

function relativeTime(iso: string): string {
  if (!iso) return "Never";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Never";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  if (mins < 60 * 24 * 30) return `${Math.round(mins / 1440)} d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function RedirectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.max(1, Math.min(200, Number(searchParams.get("per_page")) || 25));
  const tab = searchParams.get("tab") || "all";
  const urlSearch = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "";

  const patchParams = useCallback(
    (patch: Record<string, string | null>, replace = false) => {
      setSearchParams(
        (prev: URLSearchParams) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === "") next.delete(k);
            else next.set(k, v);
          }
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  // Search box: local while typing, pushed to the URL after a pause.
  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => setSearchInput(urlSearch), [urlSearch]);
  useEffect(() => {
    if (searchInput === urlSearch) return;
    const t = setTimeout(() => patchParams({ search: searchInput || null, page: null }, true), 300);
    return () => clearTimeout(t);
  }, [searchInput, urlSearch, patchParams]);

  const [data, setData] = useState<RuleList>({ rows: [], total: 0, counts: {} });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [autoCreate, setAutoCreate] = useState(true);

  const [editing, setEditing] = useState<Rule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ ids: number[]; label: string } | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (tab !== "all") qs.set("tab", tab);
    if (urlSearch) qs.set("search", urlSearch);
    if (sort) qs.set("sort", sort);
    try {
      setData(await listRules(qs));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load redirects");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, tab, urlSearch, sort]);

  useEffect(() => {
    load();
    setSelected(new Set());
  }, [load]);

  useEffect(() => {
    getSettings()
      .then((s) => setAutoCreate(s.auto_create))
      .catch(() => {});
  }, []);

  async function toggleAutoCreate(on: boolean) {
    setAutoCreate(on);
    try {
      await saveSettings(on);
      toast.success(on ? "Automatic redirects on" : "Automatic redirects off");
    } catch {
      setAutoCreate(!on);
      toast.error("Could not save the setting");
    }
  }

  async function toggleEnabled(rule: Rule) {
    try {
      await updateRule(rule.id, { ...rule, enabled: !rule.enabled });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the redirect");
    }
  }

  async function bulk(action: "enable" | "disable") {
    try {
      await bulkRules([...selected], action);
      load();
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
    }
  }

  async function runDelete() {
    if (!confirm) return;
    setWorking(true);
    try {
      if (confirm.ids.length === 1) await deleteRule(confirm.ids[0]);
      else await bulkRules(confirm.ids, "delete");
      toast.success(confirm.ids.length === 1 ? "Redirect deleted" : `${confirm.ids.length} redirects deleted`);
      setConfirm(null);
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setWorking(false);
    }
  }

  const rows = data.rows;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const filtered = !!urlSearch || tab !== "all";
  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <ListPageShell>
      <ListHeader
        title="Redirects"
        tabs={[
          { value: "all", label: "All", count: data.counts.all ?? 0 },
          { value: "manual", label: "Manual", count: data.counts.manual ?? 0 },
          { value: "auto", label: "Automatic", count: data.counts.auto ?? 0 },
          { value: "disabled", label: "Disabled", count: data.counts.disabled ?? 0 },
        ]}
        activeTab={tab}
        onTabChange={(v: string) => patchParams({ tab: v === "all" ? null : v, page: null })}
        newLabel="Add redirect"
        onNew={openNew}
        extra={
          <>
            <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}>
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Test a URL
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`${API}/export`} download="redirects.csv">
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
              </a>
            </Button>
          </>
        }
      />

      <ListToolbar>
        {selected.size > 0 ? (
          <>
            <span className="text-[13px] font-medium">{selected.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => bulk("enable")}>
              Enable
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulk("disable")}>
              Disable
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={() => setConfirm({ ids: [...selected], label: `${selected.size} redirects` })}
            >
              Delete
            </Button>
          </>
        ) : (
          <ListSearch value={searchInput} onChange={setSearchInput} placeholder="Search URLs and notes…" />
        )}
        <label
          className="ml-auto flex items-center gap-2 text-[13px] text-muted-foreground"
          title="When the URL of a published page changes, a 301 from the old URL is added for you."
        >
          <Switch checked={autoCreate} onCheckedChange={toggleAutoCreate} />
          Redirect automatically when a page URL changes
        </label>
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CornerUpRight}
            title={filtered ? "No redirects match" : "No redirects yet"}
            description={
              filtered
                ? "Try a different search or tab."
                : "Add one to send an old URL to a new page, or import a list from a CSV file."
            }
            action={filtered ? undefined : <Button onClick={openNew}>Add redirect</Button>}
          />
        ) : (
          <ListTable minWidth={920}>
            <thead>
              <tr>
                <Th width={36}>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v: boolean) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())}
                    aria-label="Select all on this page"
                  />
                </Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th width={70}>Type</Th>
                <SortableTh
                  column="hits"
                  sortBy={sort}
                  sortOrder="desc"
                  onSort={() => patchParams({ sort: sort === "hits" ? null : "hits", page: null })}
                  defaultOrder="desc"
                  width={80}
                  align="right"
                >
                  Hits
                </SortableTh>
                <Th width={110}>Last hit</Th>
                <Th width={70}>On</Th>
                <Th width={90} align="right">
                  Actions
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((rule) => (
                <Tr key={rule.id}>
                  <Td>
                    <Checkbox
                      checked={selected.has(rule.id)}
                      onCheckedChange={() => toggleRow(rule.id)}
                      aria-label={`Select ${rule.source}`}
                    />
                  </Td>
                  <Td>
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        className="min-w-0 cursor-pointer truncate text-left font-mono text-[13px] font-medium hover:underline"
                        style={{ maxWidth: 340 }}
                        title={rule.note ? `${rule.source}\n${rule.note}` : rule.source}
                        onClick={() => {
                          setEditing(rule);
                          setFormOpen(true);
                        }}
                      >
                        {rule.source}
                      </button>
                      {MATCH_LABEL[rule.match_type] && <Chip>{MATCH_LABEL[rule.match_type]}</Chip>}
                      {rule.origin === "auto" && <Chip>auto</Chip>}
                    </div>
                  </Td>
                  <Td>
                    {rule.status_code === 410 ? (
                      <span className="text-[13px] text-muted-foreground">Gone, no target</span>
                    ) : (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate font-mono text-[13px]" style={{ maxWidth: 340 }} title={rule.target}>
                          {rule.target}
                        </span>
                      </div>
                    )}
                  </Td>
                  <Td className="font-mono text-[12px] tabular-nums">{rule.status_code}</Td>
                  <Td align="right" className="font-mono text-[12px] tabular-nums">
                    {rule.hits.toLocaleString()}
                  </Td>
                  <Td className="text-[12px] text-muted-foreground">{relativeTime(rule.last_hit_at)}</Td>
                  <Td>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleEnabled(rule)}
                      aria-label={rule.enabled ? "Disable redirect" : "Enable redirect"}
                    />
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <RowActions
                      onEdit={() => {
                        setEditing(rule);
                        setFormOpen(true);
                      }}
                      onDelete={() => setConfirm({ ids: [rule.id], label: rule.source })}
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
        totalPages={Math.max(1, Math.ceil(data.total / perPage))}
        total={data.total}
        perPage={perPage}
        onPage={(p: number) => patchParams({ page: p <= 1 ? null : String(p) })}
        onPerPage={(n: number) => patchParams({ per_page: n === 25 ? null : String(n), page: null })}
        label="redirects"
      />

      <RuleDialog open={formOpen} rule={editing} onClose={() => setFormOpen(false)} onSaved={load} />
      <TestDialog open={testOpen} onClose={() => setTestOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />

      <Dialog open={!!confirm} onOpenChange={(o: boolean) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirm && confirm.ids.length > 1 ? "redirects" : "redirect"}?</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{confirm?.label}</span> will stop redirecting right away. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={working}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={runDelete} disabled={working}>
              {working ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPageShell>
  );
}
