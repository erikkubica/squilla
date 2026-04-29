import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import CustomFieldInput from "@/components/ui/custom-field-input";
import { toast } from "sonner";
import {
  getThemeSettingsPage,
  saveThemeSettingsPage,
  type NodeTypeField,
  type ThemeSettingsField,
  type ThemeSettingsPageResponse,
} from "@/api/client";
import { SduiAdminShell } from "@/sdui/admin-shell";

// Adapt the theme-settings schema (key/label/type/default/config) to the
// NodeTypeField shape that CustomFieldInput already understands. Config keys
// (options, min, max, sub_fields, placeholder, ...) are spread directly into
// the field record so CustomFieldInput's switch on `type` picks them up.
function toNodeTypeField(f: ThemeSettingsField): NodeTypeField {
  const config = (f.config || {}) as Record<string, unknown>;
  return {
    name: f.key,
    key: f.key,
    label: f.label,
    type: f.type,
    default_value: f.default,
    ...config,
  } as NodeTypeField;
}

export function ThemeSettingsPage() {
  const { page: pageSlug } = useParams<{ page: string }>();
  const [data, setData] = useState<ThemeSettingsPageResponse | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageSlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getThemeSettingsPage(pageSlug)
      .then((resp) => {
        if (cancelled) return;
        setData(resp);
        const initial: Record<string, unknown> = {};
        for (const f of resp.page.fields) {
          initial[f.key] = resp.values[f.key]?.value ?? null;
        }
        setValues(initial);
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
  }, [pageSlug]);

  const handleSave = async () => {
    if (!pageSlug || !data) return;
    setSaving(true);
    try {
      await saveThemeSettingsPage(pageSlug, values);
      toast.success("Theme settings saved");
      const fresh = await getThemeSettingsPage(pageSlug);
      setData(fresh);
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

  return (
    <SduiAdminShell>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {loading && (
          <div className="flex h-64 items-center justify-center text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Failed to load theme settings</p>
            <p className="mt-1 text-red-600">{error}</p>
          </div>
        )}
        {!loading && !error && data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{data.page.name}</CardTitle>
                {data.page.description && (
                  <CardDescription>{data.page.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {adaptedFields.map((field, idx) => {
                  const original = data.page.fields[idx];
                  const v = data.values[original.key];
                  const incompatible =
                    v && v.compatible === false && v.raw !== "";
                  return (
                    <div key={original.key} className="space-y-2">
                      <Label htmlFor={`tf-${original.key}`}>
                        {original.label}
                      </Label>
                      <CustomFieldInput
                        field={field}
                        value={values[original.key]}
                        onChange={(val) =>
                          setValues((prev) => ({
                            ...prev,
                            [original.key]: val,
                          }))
                        }
                      />
                      {incompatible && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div>
                            Previous value was incompatible with the new field
                            type and will be replaced when you save:&nbsp;
                            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
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
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </>
        )}
      </div>
    </SduiAdminShell>
  );
}

export default ThemeSettingsPage;
