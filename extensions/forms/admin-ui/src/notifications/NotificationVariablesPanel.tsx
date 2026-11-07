import React from "react";
import { Code } from "@squilla/icons";

const { Popover, PopoverContent, PopoverTrigger } = (window as any).__SQUILLA_SHARED__.ui;

const TEMPLATE_VARS: { syntax: string; desc: string }[] = [
  { syntax: "{{.form.name}}", desc: "Form name" },
  { syntax: "{{.form.slug}}", desc: "Form slug" },
  { syntax: "{{.form.id}}", desc: "Form ID" },
  { syntax: "{{.submitted_at}}", desc: "When it was sent" },
  { syntax: "{{.site_email}}", desc: "Site email (Settings → General)" },
  { syntax: "{{.site.name}}", desc: "Site name" },
  { syntax: "{{.site.url}}", desc: "Site URL" },
  { syntax: "{{.field.email}}", desc: "One answer, by its field key" },
  { syntax: "{{range .data}}", desc: "Repeat for every answer…" },
  { syntax: "  {{.label}}", desc: "Question" },
  { syntax: "  {{.value}}", desc: "Answer" },
  { syntax: "  {{.key}}", desc: "Field key" },
  { syntax: "{{end}}", desc: "…end of the repeat" },
];

/** "Template variables" reference, opened from a text action beside the list. */
export default function NotificationVariablesPanel() {
  const list = (
    <dl className="fm-ref">
      {TEMPLATE_VARS.map((v) => (
        <React.Fragment key={v.syntax}>
          <dt>{v.syntax}</dt>
          <dd>{v.desc}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
  if (!Popover) return list;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" data-slot="text-action" className="shrink-0">
          <Code size={14} /> Template variables
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-3 space-y-2">
        <p className="fm-hint">Use these in the recipients, subject and body.</p>
        {list}
      </PopoverContent>
    </Popover>
  );
}
