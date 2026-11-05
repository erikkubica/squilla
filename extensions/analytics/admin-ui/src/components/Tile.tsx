import type { ReactNode } from "react";

/** Small KPI card used by the behaviour pages. */
export function Tile({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="an-card p-3">
      <div className="text-xs font-medium text-an-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-an-ink">{value}</div>
      {hint && <div className="text-xs text-an-muted">{hint}</div>}
    </div>
  );
}
