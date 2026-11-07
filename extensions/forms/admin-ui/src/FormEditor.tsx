import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Download,
  Eye,
  Inbox,
  Layout,
  ListPlus,
  Loader2,
  Mail,
  Save,
  Settings,
  Trash2,
  Webhook,
} from "@squilla/icons";
import { BASE } from "./shell/FormsShell";
import { copyText, formatDate, relativeTime } from "./shell/format";

const {
  Button,
  Card,
  CardContent,
  SectionHeader,
  Titlebar,
  TabsCard,
  PublishActions,
  MetaList,
  MetaRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} = (window as any).__SQUILLA_SHARED__.ui;
const { Link, useParams, useNavigate, useSearchParams } = (window as any).__SQUILLA_SHARED__.ReactRouterDOM;
const { toast } = (window as any).__SQUILLA_SHARED__.Sonner;

import BuilderTab from "./tabs/BuilderTab";
import LayoutTab from "./tabs/LayoutTab";
import PreviewTab from "./tabs/PreviewTab";
import NotificationsTab from "./tabs/NotificationsTab";
import SettingsTab from "./tabs/SettingsTab";
import WebhooksTab from "./tabs/WebhooksTab";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TabKey = "builder" | "layout" | "preview" | "notifications" | "settings" | "webhooks";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "builder", label: "Fields", icon: ListPlus },
  { key: "layout", label: "Layout", icon: Layout },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "notifications", label: "Emails", icon: Mail },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "webhooks", label: "Webhooks", icon: Webhook },
];

interface Stats {
  all: number;
  unread: number;
  latest: string | null;
}

export default function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const isEdit = !!(id && id !== "new");
  const tabParam = sp.get("tab") as TabKey | null;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "builder";
  const setTab = (t: TabKey) =>
    setSp(
      (prev: URLSearchParams) => {
        const next = new URLSearchParams(prev);
        if (t === "builder") next.delete("tab");
        else next.set("tab", t);
        return next;
      },
      { replace: true },
    );

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    fields: [] as any[],
    layout: "",
    notifications: [
      {
        name: "Admin Notification",
        enabled: true,
        recipients: "{{.site_email}}",
        subject: "New submission: {{.form.name}}",
        body: "You have a new submission.\n\n{{range .data}}\n{{.label}}: {{.value}}\n{{end}}",
        reply_to: "",
      },
    ] as any[],
    settings: {
      success_message: "Thank you! Your message has been sent.",
      error_message: "Oops! Something went wrong.",
      redirect_url: "",
    } as Record<string, any>,
    created_at: "" as string,
    updated_at: "" as string,
  });

  const initialFormRef = useRef<any>(null);
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  const isDirty = useMemo(() => {
    if (!initialFormRef.current) return false;
    return JSON.stringify(form) !== JSON.stringify(initialFormRef.current);
  }, [form]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (isEdit) {
      fetch(`/admin/api/ext/forms/${id}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          const loaded = {
            ...data,
            fields: data.fields || [],
            notifications: data.notifications || [],
            settings: data.settings || {},
          };
          setForm(loaded);
          setAutoSlug(false);
          initialFormRef.current = JSON.parse(JSON.stringify(loaded));
          setLoading(false);
        })
        .catch(() => {
          toast.error("Failed to load form");
          navigate(BASE);
        });
      fetch(`/admin/api/ext/forms/submissions?per_page=1&form_id=${id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((b) =>
          setStats({
            all: b.status_counts?.all ?? b.total ?? 0,
            unread: b.status_counts?.unread ?? 0,
            latest: b.rows?.[0]?.created_at ?? null,
          }),
        )
        .catch(() => {});
    } else {
      fetch("/admin/api/ext/forms/defaults/layout", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setForm((prev) => {
            const updated = { ...prev, layout: data.layout || "" };
            initialFormRef.current = JSON.parse(JSON.stringify(updated));
            return updated;
          });
        })
        .catch(() => {
          initialFormRef.current = JSON.parse(JSON.stringify(form));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateLocally = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const name = (form.name || "").trim();
    const slug = (form.slug || "").trim();
    if (!name) errs.name = "Give the form a name";
    if (!slug) errs.slug = "The slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errs.slug = "Use lowercase letters, numbers and hyphens only";
    return errs;
  };

  const handleNameChange = (val: string) => {
    setForm((prev: any) => {
      const next: any = { ...prev, name: val };
      if (autoSlug) next.slug = slugify(val);
      return next;
    });
    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
    if (autoSlug && fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
  };

  const handleSave = useCallback(async () => {
    const local = validateLocally();
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      toast.error(Object.values(local)[0]);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `/admin/api/ext/forms/${id}` : "/admin/api/ext/forms/";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Form saved");
        initialFormRef.current = JSON.parse(JSON.stringify(form));
        if (method === "POST") {
          const data = await res.json();
          navigate(`${BASE}/edit/${data.id}`);
        } else {
          setForm((f) => ({ ...f }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.fields && typeof err.fields === "object") {
          setFieldErrors(err.fields);
          const first = Object.values(err.fields)[0];
          toast.error(typeof first === "string" ? first : err.message || "Validation failed");
        } else {
          toast.error(err.message || err.error || "Failed to save form");
        }
      }
    } catch {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, id, isEdit]);

  // Cmd/Ctrl+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, saving]);

  const handleBack = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    navigate(BASE);
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    setDeleting(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast.success("Form deleted");
        initialFormRef.current = form;
        navigate(BASE);
      } else toast.error("Failed to delete form");
    } catch {
      toast.error("Failed to delete form");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const fieldsCount = form.fields?.length || 0;
  const notificationsCount = (form.notifications || []).filter((n: any) => n?.enabled !== false).length;
  const shortcode = `[form slug="${form.slug || "your-form"}"]`;
  const savedSlug: string = initialFormRef.current?.slug || "";
  const slugChanged = isEdit && !!savedSlug && form.slug !== savedSlug;
  const errorText = [fieldErrors.name, fieldErrors.slug].filter(Boolean).join(" · ");

  const toggleAutoSlug = () => {
    if (autoSlug) {
      setAutoSlug(false);
    } else {
      setAutoSlug(true);
      setForm((p: any) => ({ ...p, slug: slugify(p.name) }));
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent-strong)" }} />
      </div>
    );

  const tabLabel = (Icon: React.ComponentType<{ className?: string }>, text: string) => (
    <>
      <Icon className="mr-2 h-4 w-4" /> {text}
    </>
  );

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="fm-root grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-4 min-w-0">
          <Titlebar
            title={form.name}
            onTitleChange={handleNameChange}
            titleLabel="Form name"
            titlePlaceholder="e.g. Contact us"
            slug={form.slug}
            onSlugChange={(v: string) => {
              setAutoSlug(false);
              setForm((prev: any) => ({ ...prev, slug: v.replace(/\s+/g, "-").toLowerCase() }));
              if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
            }}
            slugPrefix="/"
            autoSlug={autoSlug}
            onAutoSlugToggle={toggleAutoSlug}
            onBack={handleBack}
            actions={
              isEdit ? (
                <Link
                  to={`${BASE}/submissions?form_id=${id}`}
                  className="inline-flex items-center"
                  style={{
                    height: 32,
                    padding: "0 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--fg)",
                    background: "var(--card-bg)",
                    borderRadius: "var(--radius-md)",
                    gap: 6,
                    boxShadow: "0 0 0 1px var(--border-input), 0 1px 2px rgba(15,23,42,0.05)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Inbox size={14} /> Submissions
                  {stats && stats.unread > 0 ? <span data-slot="count">{stats.unread}</span> : null}
                </Link>
              ) : undefined
            }
          />

          {(errorText || slugChanged) && (
            <div className="space-y-1.5" style={{ padding: "0 4px" }}>
              {errorText && (
                <p className="fm-ed-note" data-tone="danger" role="alert">
                  <AlertTriangle aria-hidden="true" /> {errorText}
                </p>
              )}
              {slugChanged && (
                <p className="fm-ed-note">
                  <AlertTriangle aria-hidden="true" />
                  <span>
                    Pages that use <code>[form slug="{savedSlug}"]</code> stop showing this form until you update them.
                  </span>
                </p>
              )}
            </div>
          )}

          <TabsCard
            value={tab}
            onValueChange={(v: string) => setTab(v as TabKey)}
            tabs={[
              { value: "builder", label: tabLabel(ListPlus, "Fields"), badge: fieldsCount, content: <BuilderTab form={form} setForm={setForm} /> },
              { value: "layout", label: tabLabel(Layout, "Layout"), content: <LayoutTab form={form} setForm={setForm} /> },
              { value: "preview", label: tabLabel(Eye, "Preview"), content: <PreviewTab form={form} /> },
              {
                value: "notifications",
                label: tabLabel(Mail, "Emails"),
                badge: notificationsCount || undefined,
                content: <NotificationsTab form={form} setForm={setForm} />,
              },
              { value: "settings", label: tabLabel(Settings, "Settings"), content: <SettingsTab form={form} setForm={setForm} /> },
              { value: "webhooks", label: tabLabel(Webhook, "Webhooks"), content: <WebhooksTab form={form} setForm={setForm} /> },
            ]}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeader title="Publish" />
            <CardContent className="space-y-4">
              <p className="fm-ed-status" data-state={!isEdit ? "new" : isDirty ? "dirty" : "clean"}>
                {!isEdit ? "Not created yet" : isDirty ? "Unsaved changes" : "All changes saved"}
              </p>
              <PublishActions>
                <Button type="submit" className="w-full" disabled={saving} title="Save (⌘S)">
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {saving ? "Saving…" : isEdit ? "Save" : "Create form"}
                </Button>
                {isEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    style={{ color: "var(--danger)" }}
                    onClick={() => setShowDelete(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </PublishActions>
              {isEdit && (
                <MetaList>
                  <MetaRow label="Fields" value={fieldsCount} />
                  <MetaRow label="Emails on" value={notificationsCount} />
                  {form.created_at && <MetaRow label="Created" value={formatDate(form.created_at)} />}
                  {form.updated_at && <MetaRow label="Updated" value={formatDate(form.updated_at)} />}
                </MetaList>
              )}
            </CardContent>
          </Card>

          <Card>
            <SectionHeader title="Put it on a page" />
            <CardContent className="space-y-3">
              <div className="fm-shortcode">
                <code>{shortcode}</code>
                <button
                  type="button"
                  data-slot="icon-button"
                  onClick={() => copyText(shortcode, toast, "Shortcode copied")}
                  aria-label="Copy shortcode"
                  title="Copy shortcode"
                  disabled={!form.slug}
                >
                  <Copy size={15} />
                </button>
              </div>
              <p className="fm-hint">Paste the shortcode into a page, or add the Form block and pick this form.</p>
            </CardContent>
          </Card>

          {isEdit && (
            <Card>
              <SectionHeader
                title="Submissions"
                count={stats ? stats.all : undefined}
              />
              <CardContent className="space-y-4">
                <MetaList>
                  <MetaRow label="Unread" value={stats ? stats.unread : "–"} />
                  <MetaRow
                    label="Latest"
                    value={stats?.latest ? relativeTime(stats.latest) : "None yet"}
                  />
                </MetaList>
                <PublishActions>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`${BASE}/submissions?form_id=${id}`}>
                      <Inbox className="mr-1.5 h-3.5 w-3.5" /> Open
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`/admin/api/ext/forms/submissions/export?form_id=${id}`} download={`${form.slug || "form"}-submissions.csv`}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                    </a>
                  </Button>
                </PublishActions>
                <Button asChild variant="ghost" className="w-full">
                  <a href={`/admin/api/ext/forms/${id}/export`}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export form as JSON
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </form>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{form.name}”?</DialogTitle>
            <DialogDescription>
              The form and {stats?.all ? `all ${stats.all} of its submissions` : "its submissions"} are deleted for good. Pages that use its shortcode will show nothing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
