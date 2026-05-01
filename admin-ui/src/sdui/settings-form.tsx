import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, RefreshCw } from "lucide-react";
import { useAdminLanguage } from "@/hooks/use-admin-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { SidebarCard } from "@/components/ui/sidebar-card";
import { LanguageSelect } from "@/components/ui/language-select";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getSiteSettings,
  updateSiteSettings,
  clearCache,
  getNodes,
  getRoles,
  type ContentNode,
  type Role,
} from "@/api/client";
import { iconMap } from "./sdui-components";

// SettingsForm renders a server-described settings page. The Go kernel emits
// a schema (sections + fields) and this component handles the load/save loop.
// The same component backs site settings, extension settings, theme settings —
// everything that's "load some settings, render a form, save the diff."

export interface SettingsFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "node_select" | "toggle" | "role_select";
  placeholder?: string;
  help?: string;
  /** Inline warning rendered in an amber callout below the help line. Use
   *  for settings that have non-obvious cross-cutting behaviour (e.g.
   *  per-language toggles where OFF on one language doesn't affect
   *  others). */
  warning?: string;
  rows?: number;
  font_mono?: boolean;
  // node_select-specific
  node_type?: string;
  empty_label?: string;
  // toggle-specific. Settings are stored as strings, so we map the
  // boolean state back to two configurable string values.
  true_value?: string;
  false_value?: string;
  default?: string;
}

export interface SettingsSectionDef {
  title: string;
  icon?: string;
  description?: string;
  full_width?: boolean;
  fields: SettingsFieldDef[];
}

export interface SettingsFormProps {
  title?: string;
  description?: string;
  schema: SettingsSectionDef[];
  show_clear_cache?: boolean;
  /** When true, the form reads/writes the language-agnostic row of
   *  site_settings (language_code=''). The Publish-card language picker is
   *  hidden and the API receives `X-Admin-Language: *`. Use for settings
   *  whose behaviour can't sensibly differ per locale (security policy,
   *  global feature flags, etc.). */
  language_agnostic?: boolean;
}

const ICON_COLORS: Record<string, string> = {
  Globe: "var(--accent-strong)",
  Home: "var(--success)",
  FileText: "var(--warning)",
  Code: "var(--warning)",
  Settings: "var(--muted-foreground)",
};

function renderIcon(name: string | undefined) {
  if (!name) return null;
  const Icon = iconMap[name];
  if (!Icon) return null;
  const color = ICON_COLORS[name] || "var(--accent-strong)";
  return <Icon className="h-4 w-4" style={{color}} />;
}

export function SettingsForm({
  title = "Settings",
  description,
  schema,
  show_clear_cache = false,
  language_agnostic = false,
}: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<ContentNode[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { languages, currentCode } = useAdminLanguage();
  // Per-form language override. Defaults to and follows the admin header
  // language; the in-form selector below pins a different value if the
  // operator wants to edit a specific language without affecting the rest
  // of the admin. For language-agnostic forms the locale is forced to "*"
  // so the API stores/reads the empty-locale row regardless of which
  // language the admin happens to be editing in.
  const [pageLocale, setPageLocale] = useState<string>(
    language_agnostic ? "*" : currentCode,
  );
  useEffect(() => {
    if (!language_agnostic) setPageLocale(currentCode);
  }, [currentCode, language_agnostic]);

  const needsPages = schema.some((s) => s.fields.some((f) => f.type === "node_select"));
  const needsRoles = schema.some((s) => s.fields.some((f) => f.type === "role_select"));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<unknown>[] = [getSiteSettings(pageLocale)];
      if (needsPages) {
        promises.push(getNodes({ page: 1, per_page: 200, status: "published" }));
      } else {
        promises.push(Promise.resolve(undefined));
      }
      if (needsRoles) {
        promises.push(getRoles());
      } else {
        promises.push(Promise.resolve(undefined));
      }
      const [settings, pagesRes, rolesRes] = await Promise.all(promises) as [
        Record<string, string>,
        { data: ContentNode[] } | undefined,
        Role[] | undefined,
      ];

      const initial: Record<string, string> = {};
      for (const section of schema) {
        for (const field of section.fields) {
          initial[field.key] = settings[field.key] ?? "";
        }
      }
      setValues(initial);
      setOriginal(initial);
      if (pagesRes) setPages(pagesRes.data);
      if (rolesRes) setRoles(rolesRes);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [schema, needsPages, needsRoles, pageLocale]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleSave() {
    setSaving(true);
    try {
      const diff: Record<string, string> = {};
      for (const key of Object.keys(values)) {
        if (values[key] !== original[key]) diff[key] = values[key];
      }
      if (Object.keys(diff).length === 0) {
        toast.info("No changes to save");
        return;
      }
      await updateSiteSettings(diff, pageLocale);
      setOriginal({ ...values });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearCache() {
    setClearing(true);
    try {
      await clearCache();
      toast.success("All caches cleared");
    } catch {
      toast.error("Failed to clear caches");
    } finally {
      setClearing(false);
    }
  }

  const hasChanges = JSON.stringify(values) !== JSON.stringify(original);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{color: "var(--accent-strong)"}} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title row — spans the full width above the 2-col grid. */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main content — section cards */}
        <div className="space-y-4 min-w-0">
          {schema.map((section, idx) => (
            <Card
              key={idx}
              className="rounded-xl border border-border shadow-sm"
            >
              <SectionHeader title={section.title} icon={renderIcon(section.icon)} />
              <CardContent className="space-y-4">
                {section.description && (
                  <p className="text-xs text-muted-foreground -mt-1">{section.description}</p>
                )}
                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <SettingsField
                      key={field.key}
                      field={field}
                      value={values[field.key] || ""}
                      pages={pages}
                      roles={roles}
                      onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar — Publish-style card matching the node editor */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <SidebarCard title="Publish">
            {!language_agnostic && languages.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Language
                </Label>
                <LanguageSelect
                  languages={languages}
                  value={pageLocale}
                  onChange={setPageLocale}
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Each setting stores a separate value per language. Languages
                  without an override read from the default language.
                </p>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm rounded-lg font-medium"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            {show_clear_cache && (
              <Button
                variant="outline"
                onClick={handleClearCache}
                disabled={clearing}
                className="w-full rounded-lg font-medium"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${clearing ? "animate-spin" : ""}`} />
                {clearing ? "Clearing..." : "Clear Cache"}
              </Button>
            )}
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

function SettingsField({
  field,
  value,
  pages,
  roles,
  onChange,
}: {
  field: SettingsFieldDef;
  value: string;
  pages: ContentNode[];
  roles: Role[];
  onChange: (v: string) => void;
}) {
  const inputClasses =
    "rounded-lg focus:ring-2";

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{field.label}</Label>
      {field.type === "text" && (
        <Input
          placeholder={field.placeholder}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className={inputClasses}
        />
      )}
      {field.type === "textarea" && (
        <Textarea
          placeholder={field.placeholder}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          rows={field.rows ?? 4}
          className={`${inputClasses} resize-none ${field.font_mono ? "font-mono text-xs" : ""}`}
        />
      )}
      {field.type === "toggle" && (() => {
        const trueVal = field.true_value ?? "true";
        const falseVal = field.false_value ?? "false";
        const effective = value === "" ? (field.default ?? falseVal) : value;
        const checked = effective === trueVal;
        return (
          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={checked}
              onCheckedChange={(v: boolean) => onChange(v ? trueVal : falseVal)}
            />
            <span className="text-xs text-muted-foreground">
              {checked ? "On" : "Off"}
            </span>
          </div>
        );
      })()}
      {field.type === "node_select" && (
        <Select
          value={value || "__none__"}
          onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
        >
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{field.empty_label ?? "None"}</SelectItem>
            {pages.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.title} ({p.full_url}) [{p.language_code.toUpperCase()}]
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.type === "role_select" && (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder={field.placeholder ?? "Select a role..."} />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.slug}>
                {r.name} ({r.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.help && <p className="text-[11px]" style={{color: "var(--fg-subtle)"}}>{field.help}</p>}
      {field.warning && (
        <div className="flex gap-2 rounded-md border px-2.5 py-1.5" style={{borderColor: "var(--warning)", background: "var(--warning-bg)"}}>
          <span className="text-[11px] leading-tight" style={{color: "var(--warning)"}} aria-hidden="true">⚠</span>
          <p className="text-[11px] leading-snug" style={{color: "var(--warning)"}}>{field.warning}</p>
        </div>
      )}
    </div>
  );
}
