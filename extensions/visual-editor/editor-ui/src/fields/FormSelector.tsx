import * as React from "react";
import { useEffect, useState } from "react";

// FormSelectorField renders the `form_selector` field type that ships
// with the forms extension's vibe-form block. Without this, the editor
// falls back to the generic JSON textarea and shows the slug as a
// bare quoted string ("contact"), which is editable but neither
// validated nor friendly.
//
// The forms list is fetched from /admin/api/ext/forms/ — the same
// endpoint the forms extension's admin UI uses — so a freshly seeded
// form shows up here without any further wiring.

interface FormSummary {
  id: number;
  slug: string;
  name: string;
}

interface Props {
  value: unknown;
  onChange: (next: unknown) => void;
  id?: string;
}

export function FormSelectorField({ value, onChange, id }: Props): React.JSX.Element {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/admin/api/ext/forms/", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ data?: FormSummary[] }>;
      })
      .then((res) => {
        if (cancelled) return;
        setForms(Array.isArray(res?.data) ? res.data : []);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = typeof value === "string" ? value : "";
  const known = forms.some((f) => f.slug === current);

  return (
    <div>
      <select
        id={id}
        className="vedit-input vedit-select"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? "Loading forms…" : "— Select a form —"}</option>
        {forms.map((f) => (
          <option key={f.id} value={f.slug}>
            {f.name} ({f.slug})
          </option>
        ))}
        {/* Preserve a slug the editor entered before the form existed
            (or one for an inactive forms extension) so switching panels
            doesn't silently rewrite the value to "". */}
        {current && !known && !loading && (
          <option value={current}>{current} (not found)</option>
        )}
      </select>
      {error && (
        <div className="vedit-error" style={{ marginTop: 6 }}>
          Failed to load forms: {error}. The forms extension may be inactive.
        </div>
      )}
      {!loading && !error && forms.length === 0 && (
        <div className="vedit-help" style={{ marginTop: 6 }}>
          No forms yet. Create one in Admin → Forms.
        </div>
      )}
    </div>
  );
}
