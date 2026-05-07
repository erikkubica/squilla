import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Save,
  Layout,
  Settings,
  Mail,
  ListPlus,
  Eye,
  Webhook,
  Download,
  Trash2,
} from "@squilla/icons";

const {
  Button,
  LoadingRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Titlebar,
  TabsCard,
  SidebarCard,
  PublishActions,
  MetaRow,
  MetaList,
} = (window as any).__SQUILLA_SHARED__.ui;
const { useParams, useNavigate } = (window as any).__SQUILLA_SHARED__
  .ReactRouterDOM;
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

export default function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [autoSlug, setAutoSlug] = useState(!id || id === "new");

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
    if (id && id !== "new") {
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
          navigate("/admin/ext/forms");
        });
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
  }, [id]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateLocally = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const name = (form.name || "").trim();
    const slug = (form.slug || "").trim();
    if (!name) errs.name = "Name is required";
    if (!slug) errs.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      errs.slug = "Lowercase letters, numbers, and hyphens only";
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

  const handleSave = async () => {
    const local = validateLocally();
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      toast.error(Object.values(local)[0]);
      return;
    }
    setFieldErrors({});
    setSaving(true);

    const method = id && id !== "new" ? "PUT" : "POST";
    const url =
      id && id !== "new"
        ? `/admin/api/ext/forms/${id}`
        : "/admin/api/ext/forms/";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Form saved successfully");
        if (method === "POST") {
          const data = await res.json();
          initialFormRef.current = JSON.parse(JSON.stringify(form));
          navigate(`/admin/ext/forms/edit/${data.id}`);
        } else {
          initialFormRef.current = JSON.parse(JSON.stringify(form));
        }
      } else {
        const err = await res.json();
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
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    navigate("/admin/ext/forms");
  };

  const handleDelete = async () => {
    if (!id || id === "new") return;
    setDeleting(true);
    try {
      const res = await fetch(`/admin/api/ext/forms/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Form deleted");
        navigate("/admin/ext/forms");
      } else {
        toast.error("Failed to delete form");
      }
    } catch {
      toast.error("Failed to delete form");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading)
    return (
      <div className="w-full pb-8">
        <LoadingRow />
      </div>
    );

  const isEdit = !!(id && id !== "new");
  const fieldsCount = form.fields?.length || 0;
  const notificationsCount = form.notifications?.length || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        {/* Main column */}
        <div className="space-y-4 min-w-0">
          <Titlebar
            title={form.name}
            onTitleChange={(v: string) => handleNameChange(v)}
            titleLabel="Form name"
            titlePlaceholder="Contact Us"
            slug={form.slug}
            onSlugChange={(v: string) => {
              setAutoSlug(false);
              setForm((prev: any) => ({
                ...prev,
                slug: v.replace(/\s+/g, "-").toLowerCase(),
              }));
              if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
            }}
            slugPrefix="/"
            autoSlug={autoSlug}
            onAutoSlugToggle={() => setAutoSlug(!autoSlug)}
            id={(form as any).id ? Number((form as any).id) : undefined}
            onBack={handleCancel}
          />

          {/* Field errors below pill */}
          {(fieldErrors.name || fieldErrors.slug) && (
            <div className="flex gap-6 px-2 -mt-1">
              {fieldErrors.name && (
                <p className="text-xs text-rose-600">{fieldErrors.name}</p>
              )}
              {fieldErrors.slug && (
                <p className="text-xs text-rose-600">{fieldErrors.slug}</p>
              )}
            </div>
          )}

          <TabsCard
            tabs={[
              {
                value: "builder",
                label: (
                  <span className="inline-flex items-center">
                    <ListPlus className="mr-1.5 h-3.5 w-3.5" /> Builder
                  </span>
                ),
                badge: fieldsCount || undefined,
                content: <BuilderTab form={form} setForm={setForm} />,
              },
              {
                value: "layout",
                label: (
                  <span className="inline-flex items-center">
                    <Layout className="mr-1.5 h-3.5 w-3.5" /> Layout
                  </span>
                ),
                content: <LayoutTab form={form} setForm={setForm} />,
              },
              {
                value: "preview",
                label: (
                  <span className="inline-flex items-center">
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                  </span>
                ),
                content: <PreviewTab form={form} />,
              },
              {
                value: "notifications",
                label: (
                  <span className="inline-flex items-center">
                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Notifications
                  </span>
                ),
                badge: notificationsCount || undefined,
                content: <NotificationsTab form={form} setForm={setForm} />,
              },
              {
                value: "settings",
                label: (
                  <span className="inline-flex items-center">
                    <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
                  </span>
                ),
                content: <SettingsTab form={form} setForm={setForm} />,
              },
              {
                value: "webhooks",
                label: (
                  <span className="inline-flex items-center">
                    <Webhook className="mr-1.5 h-3.5 w-3.5" /> Webhooks
                  </span>
                ),
                content: <WebhooksTab form={form} setForm={setForm} />,
              },
            ]}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <SidebarCard title="Publish">
            <PublishActions>
              <div className="relative w-full">
                {isDirty && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 border border-white z-10" />
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
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
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    window.location.href = `/admin/api/ext/forms/${id}/export`;
                  }}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export JSON
                </Button>
              )}
            </PublishActions>

            {isEdit && (
              <MetaList>
                <MetaRow label="Fields" value={String(fieldsCount)} />
                {form.created_at && (
                  <MetaRow
                    label="Created"
                    value={new Date(form.created_at).toLocaleDateString("en-GB")}
                  />
                )}
                {form.updated_at && (
                  <MetaRow
                    label="Updated"
                    value={new Date(form.updated_at).toLocaleDateString("en-GB")}
                  />
                )}
              </MetaList>
            )}
          </SidebarCard>
        </aside>
      </form>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{form.name}&quot;? This will
              also delete all submissions for this form. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
