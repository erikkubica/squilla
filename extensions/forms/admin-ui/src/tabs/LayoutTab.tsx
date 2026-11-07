import React, { useCallback, useState } from "react";
import { RotateCcw } from "@squilla/icons";

const {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CodeWindow,
} = (window as any).__SQUILLA_SHARED__.ui;

const STARTER_TEMPLATES = [
  { value: "simple", label: "Simple (default)" },
  { value: "grid", label: "Grid (multi-column)" },
  { value: "card", label: "Card (shadowed box)" },
  { value: "inline", label: "Inline (compact, no labels)" },
];

async function fetchDefaultLayout(style?: string): Promise<string> {
  const url = style
    ? `/admin/api/ext/forms/defaults/layout?style=${encodeURIComponent(style)}`
    : "/admin/api/ext/forms/defaults/layout";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch default layout");
  const data = await res.json();
  return data.layout as string;
}

export default function LayoutTab({ form, setForm }: any) {
  const [starterStyle, setStarterStyle] = useState<string>("");

  const handleReset = useCallback(async () => {
    try {
      const layout = await fetchDefaultLayout();
      setForm({ ...form, layout });
      setStarterStyle("");
    } catch { /* ignore */ }
  }, [form, setForm]);

  const handleStarterChange = useCallback(
    async (style: string) => {
      if (!style) return;
      const currentLayout = form.layout || "";
      if (
        currentLayout.trim() !== "" &&
        !window.confirm("Replace the current layout with the selected starter template?")
      ) {
        return;
      }
      try {
        const layout = await fetchDefaultLayout(style === "simple" ? undefined : style);
        setForm({ ...form, layout });
        setStarterStyle(style);
      } catch { /* ignore */ }
    },
    [form, setForm],
  );

  return (
    <div className="fm-ed" style={{ gap: 14 }}>
      <div className="fm-sec-head" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <p className="fm-hint">
          The HTML around the fields, written with Go templates. Start from a ready layout or write your own.
        </p>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <Select value={starterStyle} onValueChange={handleStarterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Starter template…" />
              </SelectTrigger>
              <SelectContent>
                {STARTER_TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button type="button" data-slot="text-action" onClick={handleReset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>
      <CodeWindow
        title="layout.html"
        value={form.layout || ""}
        onChange={(v: string) => setForm((p: any) => ({ ...p, layout: v }))}
        height="500px"
      />

      <dl className="fm-ref">
        <dt>{"{{.form.name}}"}</dt>
        <dd>Form details: id, name, slug</dd>
        <dt>{"{{.fields.email.label}}"}</dt>
        <dd>One field by its key</dd>
        <dt>{"{{range .fields_list}}"}</dt>
        <dd>Every field, in order</dd>
      </dl>
    </div>
  );
}
