import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  CopyPlus,
  Download,
  FileText,
  FormInput,
  Inbox,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "@squilla/icons";
import { BASE, EmptyBlock, FormsShell, SectionNav, SkeletonRows } from "./shell/FormsShell";
import { copyText, inboxDate, initials, preview, relativeTime, sender } from "./shell/format";

const { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } =
  (window as any).__SQUILLA_SHARED__.ui;
const { Link, useNavigate } = (window as any).__SQUILLA_SHARED__.ReactRouterDOM;
const { toast } = (window as any).__SQUILLA_SHARED__.Sonner;

interface Form {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at?: string;
  fields?: unknown[];
  submission_count?: number;
  last_submission_at?: string | null;
}

interface RecentSubmission {
  id: number;
  form_id: number;
  form_name?: string;
  data: Record<string, unknown>;
  created_at: string;
  status?: string;
}

interface Counts {
  all: number;
  unread: number;
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

async function getJSON(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export default function FormsList() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Counts>({ all: 0, unread: 0 });
  const [weekCount, setWeekCount] = useState(0);
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [unreadByForm, setUnreadByForm] = useState<Record<number, number>>({});

  const [deletingForm, setDeletingForm] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [formsBody, inbox, week] = await Promise.all([
        getJSON("/admin/api/ext/forms/"),
        getJSON("/admin/api/ext/forms/submissions?per_page=6"),
        getJSON(`/admin/api/ext/forms/submissions?per_page=1&date_from=${isoDaysAgo(6)}`),
      ]);
      const rows: Form[] = formsBody.rows || [];
      setForms(rows);
      setRecent(inbox.rows || []);
      setCounts({ all: inbox.status_counts?.all ?? 0, unread: inbox.status_counts?.unread ?? 0 });
      setWeekCount(week.total ?? 0);
      // Unread per form — one tiny request per form that has submissions.
      const withSubs = rows.filter((f) => (f.submission_count ?? 0) > 0);
      const pairs = await Promise.all(
        withSubs.map(async (f) => {
          try {
            const b = await getJSON(`/admin/api/ext/forms/submissions?per_page=1&form_id=${f.id}`);
            return [f.id, b.status_counts?.unread ?? 0] as const;
          } catch {
            return [f.id, 0] as const;
          }
        }),
      );
      setUnreadByForm(Object.fromEntries(pairs));
    } catch {
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((f) => f.name.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q));
  }, [forms, search]);

  const latest = useMemo(() => {
    let best: string | null = null;
    for (const f of forms) if (f.last_submission_at && (!best || f.last_submission_at > best)) best = f.last_submission_at;
    return best;
  }, [forms]);

  const handleDelete = async () => {
    if (!deletingForm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/${deletingForm.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast.success("Form deleted");
        setDeletingForm(null);
        load();
      } else toast.error("Failed to delete form");
    } catch {
      toast.error("Failed to delete form");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (form: Form) => {
    setDuplicating(form.id);
    try {
      const res = await fetch(`/admin/api/ext/forms/${form.id}/duplicate`, { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`"${data.name}" created`);
        load();
      } else toast.error("Failed to duplicate form");
    } catch {
      toast.error("Failed to duplicate form");
    } finally {
      setDuplicating(null);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await fetch("/admin/api/ext/forms/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: await file.text(),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`"${data.name}" imported`);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Import failed");
      }
    } catch {
      toast.error("Import failed");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <FormsShell
      icon={FormInput}
      title="Forms"
      intro="Your site's forms. Add one to a page with its shortcode or the Form block."
      actions={
        <>
          <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          <button type="button" className="fm-btn fm-focus" data-variant="outline" onClick={() => importInputRef.current?.click()} title="Import a form from a JSON export">
            <Upload aria-hidden="true" />
            <span className="fm-btn-label">Import</span>
          </button>
          <Link to={`${BASE}/new`} className="fm-btn fm-focus" data-variant="primary">
            <Plus aria-hidden="true" />
            <span className="fm-btn-label">New form</span>
          </Link>
        </>
      }
      nav={<SectionNav active="forms" unread={counts.unread} />}
    >
      <div className="fm-stack">
        <div className="fm-card">
          <div className="fm-cells">
            <div className="fm-cell">
              <span className="fm-cell-label">
                <FormInput aria-hidden="true" /> Forms
              </span>
              <span className="fm-cell-value">{loading ? "–" : forms.length}</span>
              <span className="fm-cell-meta">{forms.filter((f) => (f.submission_count ?? 0) > 0).length} have submissions</span>
            </div>
            <Link to={`${BASE}/submissions?status=unread`} className="fm-cell fm-focus" data-tone={counts.unread ? "accent" : undefined}>
              <span className="fm-cell-label">
                <Mail aria-hidden="true" /> Unread
              </span>
              <span className="fm-cell-value">{loading ? "–" : counts.unread}</span>
              <span className="fm-cell-meta">{counts.unread ? "Waiting for a reply" : "You're all caught up"}</span>
            </Link>
            <Link to={`${BASE}/submissions`} className="fm-cell fm-focus">
              <span className="fm-cell-label">
                <Inbox aria-hidden="true" /> Submissions
              </span>
              <span className="fm-cell-value">{loading ? "–" : counts.all}</span>
              <span className="fm-cell-meta">{weekCount} in the last 7 days</span>
            </Link>
            <div className="fm-cell">
              <span className="fm-cell-label">
                <FileText aria-hidden="true" /> Latest
              </span>
              <span className="fm-cell-value">{loading ? "–" : latest ? relativeTime(latest) : "None yet"}</span>
              <span className="fm-cell-meta">{latest ? new Date(latest).toLocaleString() : "No one has sent a form yet"}</span>
            </div>
          </div>
        </div>

        <div className="fm-grid-side">
          <section className="fm-card" aria-label="All forms">
            <div className="fm-toolbar">
              <label className="fm-search">
                <Search aria-hidden="true" />
                <span className="fm-sr-only">Search forms</span>
                <input className="fm-input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search forms…" />
              </label>
              <span className="ml-auto text-[12.5px] text-[color:var(--fm-muted)]">
                {filtered.length} {filtered.length === 1 ? "form" : "forms"}
              </span>
            </div>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              forms.length === 0 ? (
                <EmptyBlock
                  icon={FormInput}
                  title="No forms yet"
                  text="Create a contact, booking or newsletter form, then place it on any page."
                  action={
                    <Link to={`${BASE}/new`} className="fm-btn" data-variant="primary">
                      <Plus aria-hidden="true" /> New form
                    </Link>
                  }
                />
              ) : (
                <EmptyBlock icon={Search} title="No forms match your search" text="Try another name or slug." />
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="fm-table">
                  <thead>
                    <tr>
                      <th>Form</th>
                      <th className="fm-col-xwide">Shortcode</th>
                      <th>Submissions</th>
                      <th className="fm-col-wide">Last one</th>
                      <th className="fm-right">
                        <span className="fm-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((form) => {
                      const total = form.submission_count ?? 0;
                      const unread = unreadByForm[form.id] ?? 0;
                      const code = `[form slug="${form.slug}"]`;
                      return (
                        <tr key={form.id}>
                          <td>
                            <Link to={`${BASE}/edit/${form.id}`} className="fm-form-name fm-focus">
                              {form.name}
                            </Link>
                            <span className="fm-sub">
                              {Array.isArray(form.fields) ? `${form.fields.length} fields · ` : ""}
                              <span className="fm-mono">{form.slug}</span>
                            </span>
                          </td>
                          <td className="fm-col-xwide">
                            <span className="fm-code">
                              <code>{code}</code>
                              <button type="button" className="fm-copy fm-focus" onClick={() => copyText(code, toast, "Shortcode copied")} aria-label={`Copy shortcode for ${form.name}`} title="Copy shortcode">
                                <Copy aria-hidden="true" />
                              </button>
                            </span>
                          </td>
                          <td>
                            {total > 0 ? (
                              <Link to={`${BASE}/submissions?form_id=${form.id}`} className="inline-flex items-center gap-2 fm-focus rounded" title="Open submissions">
                                <span className="fm-stat">
                                  <b>{total}</b>
                                </span>
                                {unread > 0 && (
                                  <span className="fm-pill" data-tone="accent">
                                    {unread} new
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <span className="text-[12.5px] text-[color:var(--fm-subtle)]">None yet</span>
                            )}
                          </td>
                          <td className="fm-col-wide">
                            <span className="fm-when" title={form.last_submission_at ? new Date(form.last_submission_at).toLocaleString() : undefined}>
                              {form.last_submission_at ? relativeTime(form.last_submission_at) : "—"}
                            </span>
                          </td>
                          <td className="fm-right">
                            <div className="inline-flex items-center gap-1">
                              <span className="fm-row-act">
                                <Link to={`${BASE}/submissions?form_id=${form.id}`} className="fm-btn fm-focus" data-variant="ghost" data-size="sm" data-icon="" title="Submissions" aria-label={`Submissions for ${form.name}`}>
                                  <Inbox aria-hidden="true" />
                                </Link>
                                <button type="button" className="fm-btn fm-focus" data-variant="ghost" data-size="sm" data-icon="" onClick={() => handleDuplicate(form)} disabled={duplicating === form.id} title="Duplicate" aria-label={`Duplicate ${form.name}`}>
                                  <CopyPlus aria-hidden="true" />
                                </button>
                                <a href={`/admin/api/ext/forms/${form.id}/export`} className="fm-btn fm-focus" data-variant="ghost" data-size="sm" data-icon="" title="Export JSON" aria-label={`Export ${form.name}`}>
                                  <Download aria-hidden="true" />
                                </a>
                                <button type="button" className="fm-btn fm-focus" data-variant="danger" data-size="sm" data-icon="" onClick={() => setDeletingForm(form)} title="Delete" aria-label={`Delete ${form.name}`}>
                                  <Trash2 aria-hidden="true" />
                                </button>
                              </span>
                              <Link to={`${BASE}/edit/${form.id}`} className="fm-btn fm-focus" data-variant="outline" data-size="sm">
                                <Pencil aria-hidden="true" /> Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="fm-card" aria-labelledby="fm-latest">
            <div className="fm-card-head">
              <div>
                <h2 id="fm-latest">Latest submissions</h2>
                <p>Newest first, from every form.</p>
              </div>
            </div>
            {loading ? (
              <SkeletonRows rows={3} />
            ) : recent.length === 0 ? (
              <EmptyBlock icon={Inbox} title="Nothing yet" text="When someone sends a form, it shows up here." />
            ) : (
              <ul className="m-0 list-none p-0">
                {recent.map((s) => {
                  const who = sender(s.data);
                  const unread = s.status === "unread";
                  return (
                    <li key={s.id} className="border-b border-[color:var(--fm-grid)] last:border-b-0">
                      <button type="button" onClick={() => navigate(`${BASE}/submissions/${s.id}`)} className="fm-focus flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--fm-hover)]">
                        <span className="fm-avatar" aria-hidden="true">
                          {initials(who.name, who.email)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            {unread && <span className="fm-unread-dot" title="Unread" />}
                            <span className={`truncate text-[13.5px] text-[color:var(--fm-ink)] ${unread ? "font-semibold" : "font-medium"}`}>{who.name || who.email || `Submission #${s.id}`}</span>
                            <span className="fm-when ml-auto">{inboxDate(s.created_at)}</span>
                          </span>
                          <span className="block truncate text-[12.5px] text-[color:var(--fm-muted)]">{s.form_name}</span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-[color:var(--fm-subtle)]">{preview(s.data, [who.name, who.email])}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {recent.length > 0 && (
              <div className="flex justify-end border-t border-[color:var(--fm-grid)] px-3 py-2">
                <Link to={`${BASE}/submissions`} className="fm-btn fm-focus" data-variant="ghost" data-size="sm">
                  Open inbox
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={!!deletingForm} onOpenChange={(o: boolean) => !o && setDeletingForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deletingForm?.name}”?</DialogTitle>
            <DialogDescription>
              The form and all {deletingForm?.submission_count ?? 0} of its submissions are deleted for good. Pages that use its shortcode will show nothing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingForm(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormsShell>
  );
}
