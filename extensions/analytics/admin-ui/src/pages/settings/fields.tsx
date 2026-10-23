import type { ChangeEvent, ReactNode } from "react";
import { ui } from "../../shared";

const { Label, Switch, Textarea } = ui;

export function Row({ id, label, hint, children, wide = false }: { id: string; label: string; hint?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`grid gap-1.5 py-3 ${wide ? "" : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start sm:gap-6"}`}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-an-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function ToggleRow({ id, label, hint, checked, onChange, children }: { id: string; label: string; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; children?: ReactNode }) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor={id}>{label}</Label>
          {hint && <p id={`${id}-hint`} className="mt-1 text-xs leading-relaxed text-an-muted">{hint}</p>}
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={hint ? `${id}-hint` : undefined} />
      </div>
      {children}
    </div>
  );
}

/** One entry per line ↔ string[]. */
export function ListInput({ id, value, onChange, placeholder, mono = true }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; mono?: boolean }) {
  return (
    <Textarea
      id={id}
      rows={Math.min(8, Math.max(3, value.length + 1))}
      value={value.join("\n")}
      placeholder={placeholder}
      aria-describedby={`${id}-hint`}
      className={mono ? "font-mono text-[13px]" : ""}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value.split("\n"))}
    />
  );
}

export function cleanList(v: string[], lower = false): string[] {
  const out = v.map((s) => (lower ? s.trim().toLowerCase() : s.trim())).filter(Boolean);
  return [...new Set(out)];
}
