import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, RefreshCw, Loader2, Mail } from "@squilla/icons";
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
  ListFooter,
  EmptyState,
  LoadingRow,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@squilla/ui";
import { toast } from "sonner";
import { resendEmail, getSystemActions } from "@squilla/api";

interface EmailLog {
  id: number;
  action: string;
  recipient_email: string;
  subject: string;
  rendered_body: string;
  status: string;
  error_message: string;
  created_at: string;
}

interface SystemAction {
  slug: string;
  label: string;
}

interface LogListMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  total_all?: number;
  sent_count?: number;
  failed_count?: number;
  pending_count?: number;
}

// Bypass the Chromium srcDoc + sandbox="" rendering glitch by writing the
// HTML through contentWindow.document instead.
function PreviewIframe({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const win = ref.current?.contentWindow;
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [html]);
  return <iframe ref={ref} title={title} className="w-full h-full border-0" />;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusKind(status: string): string {
  switch (status) {
    case "sent":
      return "success";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

async function fetchLogList(params: URLSearchParams): Promise<{ data: EmailLog[]; meta: LogListMeta }> {
  const qs = params.toString();
  const res = await fetch(`/admin/api/ext/email-manager/logs${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load logs");
  return res.json();
}

export default function EmailLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const perPage = Math.max(1, Math.min(100, Number(searchParams.get("per_page") || "20")));
  const urlSearch = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const filterAction = searchParams.get("action") || "";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const sortBy = searchParams.get("sort") || "";
  const sortOrder = (searchParams.get("order") as "asc" | "desc") || "desc";

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

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAll, setTotalAll] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [actions, setActions] = useState<SystemAction[]>([]);

  const [showView, setShowView] = useState(false);
  const [viewingLog, setViewingLog] = useState<EmailLog | null>(null);
  const [resending, setResending] = useState<number | null>(null);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (filterAction) params.set("action", filterAction);
      if (urlSearch) params.set("recipient", urlSearch);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (sortBy) {
        params.set("sort", sortBy);
        params.set("order", sortOrder);
      }
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      const res = await fetchLogList(params);
      setLogs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.total_pages);
      setTotalAll(res.meta.total_all ?? res.meta.total);
      setSentCount(res.meta.sent_count ?? 0);
      setFailedCount(res.meta.failed_count ?? 0);
      setPendingCount(res.meta.pending_count ?? 0);
    } catch {
      toast.error("Failed to load email logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, urlSearch, status, filterAction, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    getSystemActions()
      .then((data: SystemAction[]) => setActions(data))
      .catch(() => {});
  }, []);

  function setUrlParam(key: string, value: string, resetPage: boolean = true) {
    setSearchParams((prev: URLSearchParams) => {
      if (!value) prev.delete(key);
      else prev.set(key, value);
      if (resetPage) prev.delete("page");
      return prev;
    });
  }
  function setStatusTab(next: string) {
    setUrlParam("status", next === "all" ? "" : next);
  }
  function setActionFilter(next: string) {
    setUrlParam("action", next);
  }
  function setDateFrom(next: string) {
    setUrlParam("date_from", next);
  }
  function setDateTo(next: string) {
    setUrlParam("date_to", next);
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
      if (next === 20) prev.delete("per_page");
      else prev.set("per_page", String(next));
      prev.delete("page");
      return prev;
    });
  }

  function openViewDialog(log: EmailLog) {
    setViewingLog(log);
    setShowView(true);
  }

  async function handleResend(id: number) {
    setResending(id);
    try {
      await resendEmail(id);
      toast.success("Email resent successfully");
      await fetchLogs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend email";
      toast.error(message);
    } finally {
      setResending(null);
    }
  }

  return (
    <ListPageShell>
      <ListHeader
        title="Email Logs"
        tabs={[
          { value: "all", label: "All", count: totalAll },
          { value: "sent", label: "Sent", count: sentCount },
          { value: "failed", label: "Failed", count: failedCount },
          { value: "pending", label: "Pending", count: pendingCount },
        ]}
        activeTab={status}
        onTabChange={setStatusTab}
      />

      <ListToolbar>
        <ListSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search recipient…"
        />
        <Select
          value={filterAction || "__all__"}
          onValueChange={(v: string) => setActionFilter(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-44 rounded-lg border-border h-9">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All actions</SelectItem>
            {actions.map((act) => (
              <SelectItem key={act.slug} value={act.slug}>
                {act.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
            className="w-36 rounded-lg border-border h-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
            className="w-36 rounded-lg border-border h-9"
          />
        </div>
      </ListToolbar>

      <ListCard>
        {loading ? (
          <LoadingRow />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No email logs found"
            description="Adjust filters or wait for new emails to be sent."
          />
        ) : (
          <ListTable>
            <thead>
              <tr>
                <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="desc" width={170}>Date</SortableTh>
                <SortableTh column="action" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Action</SortableTh>
                <SortableTh column="recipient_email" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc">Recipient</SortableTh>
                <Th>Subject</Th>
                <SortableTh column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={setSort} defaultOrder="asc" width={110}>Status</SortableTh>
                <Th width={90} align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td className="font-mono text-[12px] text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </Td>
                  <Td>{log.action}</Td>
                  <Td>{log.recipient_email}</Td>
                  <Td className="text-muted-foreground max-w-xs truncate">
                    {log.subject}
                  </Td>
                  <Td>
                    <StatusPill status={statusKind(log.status)} label={log.status} />
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <div className="inline-flex group-hover:opacity-100 transition-opacity" style={{ gap: 1, opacity: 0.55 }}>
                      <button
                        type="button"
                        title="View"
                        onClick={() => openViewDialog(log)}
                        style={{
                          width: 26,
                          height: 26,
                          display: "grid",
                          placeItems: "center",
                          color: "var(--fg-subtle)",
                          background: "transparent",
                          border: "none",
                          borderRadius: 5,
                          cursor: "pointer",
                          transition: "background 0.1s, color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--hover-bg)";
                          e.currentTarget.style.color = "var(--fg)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--fg-subtle)";
                        }}
                      >
                        <Eye style={{ width: 12, height: 12 }} />
                      </button>
                      <button
                        type="button"
                        title="Resend"
                        onClick={() => handleResend(log.id)}
                        disabled={resending === log.id}
                        style={{
                          width: 26,
                          height: 26,
                          display: "grid",
                          placeItems: "center",
                          color: "var(--fg-subtle)",
                          background: "transparent",
                          border: "none",
                          borderRadius: 5,
                          cursor: resending === log.id ? "not-allowed" : "pointer",
                          opacity: resending === log.id ? 0.4 : 1,
                          transition: "background 0.1s, color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (resending !== log.id) {
                            e.currentTarget.style.background = "var(--hover-bg)";
                            e.currentTarget.style.color = "var(--fg)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--fg-subtle)";
                        }}
                      >
                        {resending === log.id ? (
                          <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                        ) : (
                          <RefreshCw style={{ width: 12, height: 12 }} />
                        )}
                      </button>
                    </div>
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
        label="logs"
      />

      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Recipient:</span>{" "}
                  <span className="text-foreground">{viewingLog.recipient_email}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span>{" "}
                  <StatusPill status={statusKind(viewingLog.status)} label={viewingLog.status} />
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Subject:</span>{" "}
                  <span className="text-foreground">{viewingLog.subject}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Date:</span>{" "}
                  <span className="text-foreground">{formatDate(viewingLog.created_at)}</span>
                </div>
                {viewingLog.error_message && (
                  <div className="col-span-2">
                    <span className="font-medium text-red-600">Error:</span>{" "}
                    <span className="text-red-600">{viewingLog.error_message}</span>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card overflow-hidden" style={{ height: "400px" }}>
                <PreviewIframe html={viewingLog.rendered_body} title="Rendered Email" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ListPageShell>
  );
}
