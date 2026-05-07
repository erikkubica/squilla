import React, { useState } from "react";
import { Code } from "@squilla/icons";

const { AccordionRow } = (window as any).__SQUILLA_SHARED__.ui;

const TEMPLATE_VARS = [
  { syntax: "{{.form.name}}", desc: "Form display name" },
  { syntax: "{{.form.slug}}", desc: "Form URL slug" },
  { syntax: "{{.form.id}}", desc: "Form database ID" },
  { syntax: "{{.submitted_at}}", desc: "Submission timestamp" },
  {
    syntax: "{{range .data}}",
    desc: "Loop all submitted fields",
    children: [
      { syntax: "  {{.label}}", desc: "Field label" },
      { syntax: "  {{.value}}", desc: "Submitted value" },
      { syntax: "  {{.key}}", desc: "Field key" },
      { syntax: "{{end}}", desc: "End loop" },
    ],
  },
  { syntax: "{{.field.email}}", desc: "Direct access to specific submitted value" },
  { syntax: "{{.field.name}}", desc: "Replace email/name with your field keys" },
];

export default function NotificationVariablesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <AccordionRow
      open={open}
      onToggle={() => setOpen(!open)}
      headerLeft={
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-foreground shrink-0" />
          <span className="text-[13px] font-semibold text-foreground">
            Template Variables Reference
          </span>
        </div>
      }
    >
      <div className="bg-muted rounded-lg p-4 font-mono text-xs leading-relaxed text-foreground border border-border">
        <p className="text-muted-foreground text-[11px] mb-2 font-sans font-medium">
          Available in Subject and Body:
        </p>
        {TEMPLATE_VARS.map((v, i) => (
          <React.Fragment key={i}>
            <div className="flex gap-3 py-0.5">
              <span className="text-foreground whitespace-nowrap min-w-[180px]">
                {v.syntax}
              </span>
              <span className="text-muted-foreground font-sans">— {v.desc}</span>
            </div>
            {v.children &&
              v.children.map((child, j) => (
                <div key={`${i}-${j}`} className="flex gap-3 py-0.5">
                  <span className="text-foreground whitespace-nowrap min-w-[180px]">
                    {child.syntax}
                  </span>
                  <span className="text-muted-foreground font-sans">— {child.desc}</span>
                </div>
              ))}
          </React.Fragment>
        ))}
      </div>
    </AccordionRow>
  );
}
