import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Save, Loader2, AlertCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { SidebarCard } from "@/components/ui/sidebar-card";
import { LanguagePicker } from "@/components/ui/language-select";
import CustomFieldInput from "@/components/ui/custom-field-input";
import { toast } from "sonner";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import {
  getThemeSettingsPages,
  getThemeSettingsPage,
  saveThemeSettingsPage,
  type NodeTypeField,
  type ThemeSettingsField,
  type ThemeSettingsPageResponse,
} from "@/api/client";
import { SduiAdminShell } from "@/sdui/admin-shell";
import { useAdminLanguage } from "@/hooks/use-admin-language";

// Adapt the theme-settings schema (name/title/type/initialValue/description/
// config) to the NodeTypeField shape that CustomFieldInput already
// understands. Config keys (options, min, max, fields, placeholder, ...) are
// spread directly into the field record so CustomFieldInput's switch on
// `type` picks them up.
function toNodeTypeField(f: ThemeSettingsField): NodeTypeField {
  const config = (f.config || {}) as Record<string, unknown>;
  return {
    name: f.name,
    title: f.title,
    type: f.type,
    initialValue: f.initialValue,
    description: f.description,
    ...config,
  } as NodeTypeField;
}

interface ThemePageLink {
  slug: string;
  name: string;
  icon?: string;
}

/**
 * Sub-nav for theme settings. The admin sidebar shows a single "Theme
 * settings" entry; this lists every settings page the theme declares —
 * a vertical list beside the form on wide screens, a select above it on
 * narrower ones.
 */
function ThemeSettingsNav({
  pages,
  current,
  confirmLeave,
}: {
  pages: ThemePageLink[];
  current: string;
  confirmLeave: () => boolean;
}) {
  const navigate = useNavigate();
  return (
    <>
      <nav aria-label="Theme settings pages" className="hidden xl:block xl:sticky xl:top-4 xl:self-start">
        <ul className="space-y-[2px]">
          {pages.map((p) => {
            const Icon = resolveLucideIcon(p.icon || "Palette");
            const active = p.slug === current;
            return (
              <li key={p.slug}>
                <Link
                  to={`/admin/theme-settings/${p.slug}`}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => {
                    if (!active && !confirmLeave()) e.preventDefault();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] font-medium transition-colors"
                  style={{
                    color: active ? "var(--fg)" : "var(--fg-muted)",
                    background: active ? "var(--card-bg)" : undefined,
                    boxShadow: active ? "0 0 0 1px var(--border), 0 1px 2px rgba(15,23,42,0.05)" : undefined,
                  }}
                >
                  {Icon && (
                    <Icon size={16} strokeWidth={1.75} className="shrink-0" style={{ color: active ? "var(--accent-strong)" : "var(--fg-subtle)" }} />
                  )}
                  <span className="truncate">{p.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="lg:col-span-2 xl:hidden">
        <Select
          value={current}
          onValueChange={(v) => {
            if (confirmLeave()) navigate(`/admin/theme-settings/${v}`);
          }}
        >
          <SelectTrigger id="theme-settings-page" aria-label="Theme settings page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pages.map((p) => (
              <SelectItem key={p.slug} value={p.slug}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/** /admin/theme-settings → the theme's first settings page. */
export function ThemeSettingsIndexPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["theme-settings-pages-index"],
    queryFn: getThemeSettingsPages,
  });
  const first = data?.pages?.[0]?.slug;
  if (first) return <Navigate to={`/admin/theme-settings/${first}`} replace />;
  return (
    <SduiAdminShell>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent-strong)" }} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {error ? (error as Error).message : "The active theme has no settings pages."}
        </p>
      )}
    </SduiAdminShell>
  );
}

export function ThemeSettingsPage() {
  const { page: pageSlug } = useParams<{ page: string }>();
  const { data: pageList } = useQuery({
    queryKey: ["theme-settings-pages-index"],
    queryFn: getThemeSettingsPages,
    staleTime: 60_000,
  });
  // Header language is the default; per-page selector below can override it.
  const { languages, currentCode } = useAdminLanguage();
  const [pageLocale, setPageLocale] = useState<string>(currentCode);
  // When the header default changes (e.g. user picks a different language
  // globally) and they haven't pinned a per-page override yet, follow it.
  useEffect(() => {
    setPageLocale(currentCode);
  }, [currentCode]);

  const [data, setData] = useState<ThemeSettingsPageResponse | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageSlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getThemeSettingsPage(pageSlug, pageLocale)
      .then((resp) => {
        if (cancelled) return;
        setData(resp);
        const initial: Record<string, unknown> = {};
        for (const f of resp.page.fields) {
          initial[f.name] = resp.values[f.name]?.value ?? null;
        }
        setValues(initial);
        setOriginal(initial);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageSlug, pageLocale]);

  const handleSave = async () => {
    if (!pageSlug || !data) return;
    setSaving(true);
    try {
      await saveThemeSettingsPage(pageSlug, values, pageLocale);
      toast.success("Theme settings saved");
      const fresh = await getThemeSettingsPage(pageSlug, pageLocale);
      setData(fresh);
      const refreshed: Record<string, unknown> = {};
      for (const f of fresh.page.fields) {
        refreshed[f.name] = fresh.values[f.name]?.value ?? null;
      }
      setValues(refreshed);
      setOriginal(refreshed);
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const adaptedFields = useMemo(
    () => (data ? data.page.fields.map(toNodeTypeField) : []),
    [data],
  );

  const hasChanges = JSON.stringify(values) !== JSON.stringify(original);
  const confirmLeave = () => !hasChanges || window.confirm("Discard unsaved changes on this page?");
  const navPages: ThemePageLink[] = pageList?.pages || [];

  if (loading && !data) {
    return (
      <SduiAdminShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{color: "var(--accent-strong)"}} />
        </div>
      </SduiAdminShell>
    );
  }

  if (error || !data) {
    return (
      <SduiAdminShell>
        <div className="rounded-lg border p-4 text-sm" style={{background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger)"}}>
          <p className="font-medium">Failed to load theme settings</p>
          {error && <p className="mt-1" style={{color: "var(--danger)"}}>{error}</p>}
        </div>
      </SduiAdminShell>
    );
  }

  return (
    <SduiAdminShell>
      <div className="space-y-4">
        {/* Title row — spans the full width above the 2-col grid. */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {data.page.name}
          </h1>
          {data.page.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.page.description}
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[200px_minmax(0,1fr)_300px]">
          {navPages.length > 1 && pageSlug && (
            <ThemeSettingsNav pages={navPages} current={pageSlug} confirmLeave={confirmLeave} />
          )}
          {/* Main content — fields card */}
          <div className="space-y-4 min-w-0">
            <Card className="rounded-xl border border-border shadow-sm">
              <SectionHeader
                title="Fields"
                icon={<Palette className="h-4 w-4" style={{color: "var(--accent-strong)"}} />}
              />
              <CardContent className="space-y-4">
                {adaptedFields.map((field, idx) => {
                  const originalField = data.page.fields[idx];
                  const v = data.values[originalField.name];
                  const incompatible =
                    v && v.compatible === false && v.raw !== "";
                  return (
                    <div key={originalField.name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`tf-${originalField.name}`}>
                          {originalField.title}
                        </Label>
                        {originalField.translatable ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset" style={{background: "var(--accent-weak)", boxShadow: "0 0 0 1px var(--accent-mid)", color: "var(--accent-strong)"}}
                            title="This field stores a separate value per language"
                          >
                            Translatable
                          </span>
                        ) : (
                          <span
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-slate-200"
                            title="This field applies to every language"
                          >
                            Global
                          </span>
                        )}
                      </div>
                      <CustomFieldInput
                        field={field}
                        value={values[originalField.name]}
                        onChange={(val) =>
                          setValues((prev) => ({
                            ...prev,
                            [originalField.name]: val,
                          }))
                        }
                      />
                      {incompatible && (
                        <div className="flex items-start gap-2 rounded-md border p-2 text-xs" style={{background: "var(--warning-bg)", borderColor: "var(--border)", color: "var(--warning)"}}>
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div>
                            Previous value was incompatible with the new field
                            type and will be replaced when you save:&nbsp;
                            <code className="rounded px-1 py-0.5 font-mono" style={{background: "var(--warning-bg)"}}>
                              {v.raw}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — Publish-style card matching the node editor */}
          <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
            <SidebarCard title="Publish">
              <LanguagePicker
                languages={languages}
                value={pageLocale}
                onChange={setPageLocale}
                hint="Each field stores a separate value per language. Languages without an override read from the default language."
              />

              <Button onClick={handleSave} disabled={saving || !hasChanges} className="w-full">
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </SduiAdminShell>
  );
}

export default ThemeSettingsPage;
