import React, { useCallback, useEffect, useState } from "react";
import { Archive, ArchiveRestore, Inbox, Mail, MailOpen, MessageCircle, Paperclip, Trash2 } from "@squilla/icons";
import { Submission, SubmissionStatus } from "./submissions/SubmissionRow";
import { BASE, EmptyBlock, FormsShell, SectionNav, SkeletonRows } from "./shell/FormsShell";
import { deviceFromUA, formatDateTime, initials, relativeTime, sender } from "./shell/format";

const { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } =
  (window as any).__SQUILLA_SHARED__.ui;
const { Link, useParams, useNavigate, useLocation } = (window as any).__SQUILLA_SHARED__.ReactRouterDOM;
const { toast } = (window as any).__SQUILLA_SHARED__.Sonner;

interface FormField {
  id?: string;
  label?: string;
  type?: string;
  consent_text?: string;
  options?: Array<{ label?: string; value?: string } | string>;
}

interface EnrichedSubmission extends Submission {
  form_fields?: FormField[];
}

const STATUS_PILL: Record<SubmissionStatus, { tone: string; label: string }> = {
  unread: { tone: "accent", label: "Unread" },
  read: { tone: "good", label: "Read" },
  archived: { tone: "muted", label: "Archived" },
};

/** Option values become their labels; yes/no fields read as words. */
function optionLabel(field: FormField | undefined, v: unknown): string | null {
  if (!field?.options || v == null) return null;
  for (const o of field.options) {
    if (typeof o === "string") {
      if (o === String(v)) return o;
    } else if (o && String(o.value) === String(v)) return o.label || String(o.value);
  }
  return null;
}

// safeFileHref accepts only same-site paths and http(s) URLs for stored
// upload links.
function safeFileHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch {
    /* invalid URL */
  }
  return null;
}

function renderValue(value: unknown, field?: FormField): React.ReactNode {
  if (value === true || value === "true") return field?.type === "checkbox" ? "Yes, agreed" : "Yes";
  if (value === false || value === "false") return "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="fm-empty-val">Nothing chosen</span>;
    if (value.every((v) => typeof v !== "object")) return value.map((v) => optionLabel(field, v) ?? String(v)).join(", ");
    return (
      <div className="grid gap-2">
        {value.map((v, i) => (
          <div key={i}>{renderValue(v, field)}</div>
        ))}
      </div>
    );
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("label" in obj && "value" in obj && Object.keys(obj).length === 2) return String(obj.label);
    // Only real file fields render as a download link; anything else with
    // url/name keys came from the submitter and is shown as plain JSON.
    const fileHref = field?.type === "file" && "url" in obj && "name" in obj ? safeFileHref(obj.url) : null;
    if (fileHref) {
      const isImage = typeof obj.mime_type === "string" && obj.mime_type.startsWith("image/");
      const size = typeof obj.size === "number" ? `${(obj.size / 1024).toFixed(1)} KB` : "";
      return (
        <a href={fileHref} download={String(obj.name)} className="fm-focus inline-flex items-center gap-3 rounded-md p-1 pr-3" style={{ boxShadow: "inset 0 0 0 1px var(--fm-line)" }}>
          {isImage ? (
            <img src={fileHref} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <span className="fm-hero-icon" style={{ width: 40, height: 40 }} aria-hidden="true">
              <Paperclip />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium">{String(obj.name)}</span>
            {size && <span className="block text-[12px] text-[color:var(--fm-subtle)]">{size}</span>}
          </span>
        </a>
      );
    }
    return <pre className="fm-mono whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
  }
  const s = String(value ?? "").trim();
  if (!s) return <span className="fm-empty-val">Left empty</span>;
  const opt = optionLabel(field, s);
  if (opt) return opt;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return <a href={`mailto:${s}`}>{s}</a>;
  if (/^https?:\/\//i.test(s)) return <a href={s} target="_blank" rel="noreferrer">{s}</a>;
  return s;
}

const HIDDEN_KEYS = /^(website_url|honeypot|_.*)$/i;

function phoneOf(data: Record<string, unknown>): string {
  for (const [k, v] of Object.entries(data || {})) {
    if (/whats_?app|phone|tel|mobile/i.test(k) && typeof v === "string" && /\d{6,}/.test(v.replace(/\D/g, ""))) return v;
  }
  return "";
}

export default function SubmissionDetail() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = Number(idParam);
  const backTo: string = location.state?.from || `${BASE}/submissions`;

  const [sub, setSub] = useState<EnrichedSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [unread, setUnread] = useState<number | undefined>(undefined);

  const refreshUnread = useCallback(() => {
    fetch("/admin/api/ext/forms/submissions?per_page=1", { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setUnread(b.status_counts?.unread ?? 0))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/submissions/${id}`, { credentials: "include" });
      if (res.ok) {
        const body = await res.json();
        if (body.status === "unread") {
          // Opening it counts as reading it.
          await fetch(`/admin/api/ext/forms/submissions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "read" }),
            credentials: "include",
          }).catch(() => {});
          body.status = "read";
        }
        refreshUnread();
        setSub(body);
      } else if (res.status === 404) setSub(null);
      else toast.error("Failed to load submission");
    } catch {
      toast.error("Failed to load submission");
    } finally {
      setLoading(false);
    }
  }, [id, refreshUnread]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(next: SubmissionStatus) {
    if (!sub) return;
    setActing(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/submissions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setSub({ ...sub, status: next });
      refreshUnread();
      toast.success(next === "unread" ? "Marked as unread" : next === "archived" ? "Archived" : "Moved back to the inbox");
      if (next === "unread") navigate(backTo);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActing(false);
    }
  }

  async function remove() {
    if (!sub) return;
    setActing(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/submissions/${sub.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Submission deleted");
      navigate(backTo);
    } catch {
      toast.error("Failed to delete submission");
      setActing(false);
    }
  }

  const data = (sub?.data || {}) as Record<string, unknown>;
  const who = sender(data);
  const phone = phoneOf(data);
  const status = (sub?.status || "read") as SubmissionStatus;
  const fields = sub?.form_fields || [];
  const fieldById = new Map(fields.filter((f) => f.id).map((f) => [String(f.id), f]));

  // Answers in the form's own field order, then anything the form no longer has.
  const ordered: [string, unknown][] = [];
  for (const f of fields) if (f.id && f.id in data) ordered.push([String(f.id), data[String(f.id)]]);
  for (const [k, v] of Object.entries(data)) if (!fieldById.has(k)) ordered.push([k, v]);
  const answers = ordered.filter(([k, v]) => !(HIDDEN_KEYS.test(k) && !String(v ?? "").trim()));

  const meta = (sub?.metadata || {}) as Record<string, unknown>;
  const ua = typeof meta.user_agent === "string" ? meta.user_agent : "";
  const referer = typeof meta.referer === "string" ? meta.referer : "";
  let refererPath = referer;
  try {
    refererPath = referer ? new URL(referer).pathname : "";
  } catch {
    /* keep raw */
  }
  const otherMeta = Object.entries(meta).filter(([k]) => !["user_agent", "referer", "ip"].includes(k));

  const title = sub ? who.name || who.email || `Submission #${sub.id}` : "Submission";

  return (
    <FormsShell
      back={{ to: backTo, label: "Back to submissions" }}
      title={
        <div className="flex items-center gap-3">
          {sub && (
            <span className="fm-avatar" data-size="lg" aria-hidden="true">
              {initials(who.name, who.email)}
            </span>
          )}
          <div className="min-w-0">
            <h1>{loading ? "Loading…" : title}</h1>
            {sub && (
              <div className="fm-hero-intro">
                {who.name && who.email ? <>{who.email} · </> : null}
                Sent {relativeTime(sub.created_at)} through{" "}
                <Link to={`${BASE}/submissions?form_id=${sub.form_id}`} className="font-medium text-[color:var(--fm-ink-2)] hover:text-[color:var(--fm-accent)]">
                  {sub.form_name || `form #${sub.form_id}`}
                </Link>
              </div>
            )}
          </div>
        </div>
      }
      actions={
        sub ? (
          <>
            {who.email && (
              <a href={`mailto:${who.email}`} className="fm-btn fm-focus" data-variant="primary">
                <Mail aria-hidden="true" />
                <span className="fm-btn-label">Reply by email</span>
              </a>
            )}
            {phone && (
              <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="fm-btn fm-focus" data-variant="outline">
                <MessageCircle aria-hidden="true" />
                <span className="fm-btn-label">WhatsApp</span>
              </a>
            )}
          </>
        ) : undefined
      }
      nav={<SectionNav active="submissions" unread={unread ?? 0} />}
    >
      {loading ? (
        <div className="fm-card">
          <SkeletonRows rows={6} />
        </div>
      ) : !sub ? (
        <div className="fm-card">
          <EmptyBlock
            icon={Inbox}
            title="Submission not found"
            text="It may have been deleted."
            action={
              <Link to={`${BASE}/submissions`} className="fm-btn" data-variant="outline">
                Open inbox
              </Link>
            }
          />
        </div>
      ) : (
        <div className="fm-grid-side">
          <section className="fm-card" aria-labelledby="fm-answers">
            <div className="fm-card-head">
              <div>
                <h2 id="fm-answers">Answers</h2>
                <p>
                  {answers.length} {answers.length === 1 ? "answer" : "answers"}, in the order the form asks for them.
                </p>
              </div>
            </div>
            <dl className="fm-answers">
              {answers.map(([key, value]) => {
                const f = fieldById.get(key);
                const label = f?.type === "checkbox" && f.consent_text ? "Consent" : f?.label || key.replace(/_/g, " ");
                return (
                  <div className="fm-answer" key={key}>
                    <dt className={f ? "" : "capitalize"}>{label}</dt>
                    <dd>
                      {renderValue(value, f)}
                      {f?.type === "checkbox" && f.consent_text && (value === true || value === "true") && (
                        <span className="mt-1 block text-[12.5px] text-[color:var(--fm-muted)]">“{f.consent_text}”</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <aside className="fm-stack fm-side-sticky">
            <section className="fm-card" aria-labelledby="fm-details">
              <div className="fm-card-head">
                <h2 id="fm-details">Details</h2>
                <span className="fm-pill" data-tone={STATUS_PILL[status].tone}>
                  {STATUS_PILL[status].label}
                </span>
              </div>
              <dl className="fm-facts">
                <div className="fm-fact">
                  <dt>Received</dt>
                  <dd>{formatDateTime(sub.created_at)}</dd>
                </div>
                <div className="fm-fact">
                  <dt>Form</dt>
                  <dd>
                    <Link to={`${BASE}/edit/${sub.form_id}`}>{sub.form_name || `#${sub.form_id}`}</Link>
                  </dd>
                </div>
                {referer && (
                  <div className="fm-fact">
                    <dt>Sent from</dt>
                    <dd>
                      <a href={referer} target="_blank" rel="noreferrer" title={referer}>
                        {refererPath || referer}
                      </a>
                    </dd>
                  </div>
                )}
                {ua && (
                  <div className="fm-fact">
                    <dt>Device</dt>
                    <dd title={ua}>{deviceFromUA(ua)}</dd>
                  </div>
                )}
                {typeof meta.ip === "string" && meta.ip && (
                  <div className="fm-fact">
                    <dt>IP address</dt>
                    <dd className="fm-mono">{meta.ip}</dd>
                  </div>
                )}
                {otherMeta.map(([k, v]) => (
                  <div className="fm-fact" key={k}>
                    <dt className="capitalize">{k.replace(/_/g, " ")}</dt>
                    <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                  </div>
                ))}
                <div className="fm-fact">
                  <dt>ID</dt>
                  <dd className="fm-mono">#{sub.id}</dd>
                </div>
              </dl>
              <div className="fm-side-actions">
                {status !== "unread" && status !== "archived" && (
                  <button type="button" className="fm-btn fm-focus" data-variant="ghost" disabled={acting} onClick={() => setStatus("unread")}>
                    <MailOpen aria-hidden="true" /> Mark as unread
                  </button>
                )}
                {status !== "archived" ? (
                  <button type="button" className="fm-btn fm-focus" data-variant="ghost" disabled={acting} onClick={() => setStatus("archived")}>
                    <Archive aria-hidden="true" /> Archive
                  </button>
                ) : (
                  <button type="button" className="fm-btn fm-focus" data-variant="ghost" disabled={acting} onClick={() => setStatus("read")}>
                    <ArchiveRestore aria-hidden="true" /> Move back to inbox
                  </button>
                )}
                <button type="button" className="fm-btn fm-focus" data-variant="danger" disabled={acting} onClick={() => setConfirmDelete(true)}>
                  <Trash2 aria-hidden="true" /> Delete
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this submission?</DialogTitle>
            <DialogDescription>{title}’s answers and any uploaded files are deleted for good.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={acting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={acting}>
              {acting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormsShell>
  );
}
