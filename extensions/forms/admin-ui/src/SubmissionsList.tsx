import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Inbox, Pencil, Search, X } from "@squilla/icons";
import { Submission } from "./submissions/SubmissionRow";
import BulkActionsBar from "./submissions/BulkActionsBar";
import { BASE, EmptyBlock, FormsShell, SectionNav, SkeletonRows } from "./shell/FormsShell";
import { formatDateTime, inboxDate, initials, preview, sender } from "./shell/format";

const { Checkbox } = (window as any).__SQUILLA_SHARED__.ui;
const { Link, useSearchParams, useNavigate } = (window as any).__SQUILLA_SHARED__.ReactRouterDOM;
const { toast } = (window as any).__SQUILLA_SHARED__.Sonner;

interface StatusCounts {
  all: number;
  unread: number;
  read: number;
  archived: number;
}

interface PaginatedResult {
  rows: Submission[];
  total: number;
  total_pages: number;
  status_counts?: StatusCounts;
}

interface FormLite {
  id: number;
  name: string;
  slug: string;
}

const STATUS_TABS: { value: string; label: string; key: keyof StatusCounts }[] = [
  { value: "", label: "All", key: "all" },
  { value: "unread", label: "Unread", key: "unread" },
  { value: "read", label: "Read", key: "read" },
  { value: "archived", label: "Archived", key: "archived" },
];

const PER_PAGE = 25;

export default function SubmissionsList() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const formId = sp.get("form_id") || "";
  const status = sp.get("status") || "";
  const q = sp.get("q") || "";
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const update = useCallback(
    (patch: Record<string, string | number | null>, opts: { replace?: boolean; keepPage?: boolean } = {}) => {
      setSp(
        (prev: URLSearchParams) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === "" || v === undefined) next.delete(k);
            else next.set(k, String(v));
          }
          if (!opts.keepPage) next.delete("page");
          return next;
        },
        { replace: opts.replace },
      );
    },
    [setSp],
  );

  const [forms, setForms] = useState<FormLite[]>([]);
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, unread: 0, read: 0, archived: 0 });
  const [globalUnread, setGlobalUnread] = useState<number | undefined>(undefined);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => setSearchInput(q), [q]);
  useEffect(() => {
    if (searchInput === q) return;
    const t = setTimeout(() => update({ q: searchInput }, { replace: true }), 300);
    return () => clearTimeout(t);
  }, [searchInput, q, update]);

  useEffect(() => {
    fetch("/admin/api/ext/forms/", { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setForms((b.rows || []).map((f: any) => ({ id: f.id, name: f.name, slug: f.slug }))))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (formId) params.set("form_id", formId);
      if (status) params.set("status", status);
      if (q) params.set("search", q);
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);
      const res = await fetch(`/admin/api/ext/forms/submissions?${params}`, { credentials: "include" });
      const body: PaginatedResult = await res.json();
      setRows(body.rows || []);
      setTotal(body.total ?? 0);
      setTotalPages(body.total_pages ?? 1);
      if (body.status_counts) setCounts(body.status_counts);
      setSelected(new Set());
      // The nav badge counts unread across every form, whatever the filters.
      if (!formId && !q && !from && !to && body.status_counts) setGlobalUnread(body.status_counts.unread);
      else
        fetch("/admin/api/ext/forms/submissions?per_page=1", { credentials: "include" })
          .then((r) => r.json())
          .then((b) => setGlobalUnread(b.status_counts?.unread ?? 0))
          .catch(() => {});
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [page, formId, status, q, from, to]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const form = forms.find((f) => String(f.id) === formId);
  const formName = form?.name || rows[0]?.form_name || (formId ? `Form #${formId}` : "");
  const filtered = !!(q || from || to);
  const showMessage = rows.some((r) => {
    const w = sender(r.data);
    return !!preview(r.data, [w.name, w.email]);
  });

  const exportCSV = async () => {
    if (!formId) return;
    setExporting(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/submissions/export?form_id=${formId}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form?.slug || "form"}-submissions.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const open = (id: number) => navigate(`${BASE}/submissions/${id}`, { state: { from: window.location.pathname + window.location.search } });

  return (
    <FormsShell
      icon={Inbox}
      back={formId ? { to: BASE, label: "Back to forms" } : undefined}
      title={formId ? formName : "Submissions"}
      intro={
        formId
          ? "What people sent through this form, newest first."
          : "What people sent through your forms, newest first."
      }
      actions={
        formId ? (
          <>
            <Link to={`${BASE}/edit/${formId}`} className="fm-btn fm-focus" data-variant="outline">
              <Pencil aria-hidden="true" />
              <span className="fm-btn-label">Edit form</span>
            </Link>
            <button type="button" className="fm-btn fm-focus" data-variant="outline" onClick={exportCSV} disabled={exporting || counts.all === 0}>
              <Download aria-hidden="true" />
              <span className="fm-btn-label">{exporting ? "Exporting…" : "Export CSV"}</span>
            </button>
          </>
        ) : undefined
      }
      nav={<SectionNav active="submissions" unread={globalUnread} />}
      tools={
        <label className="inline-flex items-center">
          <span className="fm-sr-only">Form</span>
          <select className="fm-select fm-focus" value={formId} onChange={(e) => update({ form_id: e.target.value, status: null })}>
            <option value="">All forms</option>
            {forms.map((f) => (
              <option key={f.id} value={String(f.id)}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      }
    >
      <section className="fm-card" aria-label="Submissions">
        {selected.size > 0 ? (
          <BulkActionsBar selectedIds={selected} onClearSelection={() => setSelected(new Set())} onBulkComplete={fetchRows} />
        ) : (
          <div className="fm-toolbar">
            <div className="fm-seg" role="group" aria-label="Status">
              {STATUS_TABS.map((t) => (
                <button key={t.value} type="button" className="fm-focus" aria-pressed={status === t.value} onClick={() => update({ status: t.value })}>
                  {t.label}
                  <span className="fm-count" data-tone={t.value === "unread" && counts.unread > 0 ? "accent" : undefined}>
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>
            <label className="fm-search">
              <Search aria-hidden="true" />
              <span className="fm-sr-only">Search submissions</span>
              <input className="fm-input" type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search names, emails, messages…" />
            </label>
            <div className="fm-dates">
              <label className="inline-flex items-center gap-1.5">
                From
                <input className="fm-input fm-focus" type="date" value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value })} />
              </label>
              <label className="inline-flex items-center gap-1.5">
                to
                <input className="fm-input fm-focus" type="date" value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value })} />
              </label>
            </div>
            {filtered && (
              <button type="button" className="fm-btn fm-focus" data-variant="ghost" data-size="sm" onClick={() => update({ q: null, from: null, to: null })}>
                <X aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <SkeletonRows rows={5} />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon={Inbox}
            title={filtered ? "Nothing matches these filters" : status ? `No ${status} submissions` : "No submissions yet"}
            text={
              filtered
                ? "Try another search or a wider date range."
                : status
                  ? "Switch to All to see the rest."
                  : "When someone sends this form on your site, it shows up here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="fm-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th>From</th>
                  {showMessage && <th className="fm-col-wide">Message</th>}
                  {!formId && <th className="fm-col-xwide">Form</th>}
                  <th className="fm-right">Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const who = sender(s.data);
                  const unread = s.status === "unread";
                  return (
                    <tr
                      key={s.id}
                      data-clickable=""
                      data-unread={unread ? "" : undefined}
                      data-selected={selected.has(s.id) ? "" : undefined}
                      onClick={() => open(s.id)}
                      onKeyDown={(e) => e.key === "Enter" && open(s.id)}
                      tabIndex={0}
                      className="fm-focus"
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Select submission ${s.id}`} />
                      </td>
                      <td>
                        <div className="fm-from">
                          <span className="fm-avatar" aria-hidden="true">
                            {initials(who.name, who.email)}
                          </span>
                          <span className="fm-from-text">
                            <span className="fm-from-name">
                              {unread && <span className="fm-unread-dot" title="Unread" />}
                              {who.name || who.email || `Submission #${s.id}`}
                              {s.status === "archived" && (
                                <span className="fm-pill" data-tone="muted">
                                  Archived
                                </span>
                              )}
                            </span>
                            {who.name && who.email && <span className="fm-from-mail">{who.email}</span>}
                          </span>
                        </div>
                      </td>
                      {showMessage && (
                        <td className="fm-col-wide">
                          <span className="fm-preview">{preview(s.data, [who.name, who.email]) || "—"}</span>
                        </td>
                      )}
                      {!formId && (
                        <td className="fm-col-xwide">
                          <span className="fm-pill" data-tone="plain" style={{ background: "var(--fm-surface-2)", color: "var(--fm-ink-2)" }}>
                            {s.form_name}
                          </span>
                        </td>
                      )}
                      <td className="fm-right">
                        <span className="fm-when" title={formatDateTime(s.created_at)}>
                          {inboxDate(s.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="fm-pager">
            <span className="fm-num">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </span>
            {totalPages > 1 && (
              <span className="inline-flex gap-1">
                <button type="button" className="fm-btn fm-focus" data-variant="outline" data-size="sm" disabled={page <= 1} onClick={() => update({ page: page - 1 }, { keepPage: true })}>
                  <ChevronLeft aria-hidden="true" /> Newer
                </button>
                <button type="button" className="fm-btn fm-focus" data-variant="outline" data-size="sm" disabled={page >= totalPages} onClick={() => update({ page: page + 1 }, { keepPage: true })}>
                  Older <ChevronRight aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        )}
      </section>
    </FormsShell>
  );
}
