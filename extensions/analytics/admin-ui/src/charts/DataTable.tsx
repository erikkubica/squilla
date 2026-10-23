import type { ReactNode } from "react";

export interface DataTableProps {
  caption: string;
  columns: string[];
  rows: ReactNode[][];
  /** Render visually hidden (screen readers only). */
  hidden?: boolean;
}

/** Accessible tabular fallback for any chart. */
export function DataTable({ caption, columns, rows, hidden = false }: DataTableProps) {
  return (
    <div className={hidden ? "an-sr-only" : "max-h-80 overflow-auto"}>
      <table className="w-full border-collapse text-xs">
        <caption className={hidden ? "" : "an-sr-only"}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={`sticky top-0 bg-an-surface px-2 py-1.5 font-medium text-an-muted ${i === 0 ? "text-left" : "text-right"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-an-line">
              {r.map((cell, ci) =>
                ci === 0 ? (
                  <th key={ci} scope="row" className="px-2 py-1 text-left font-normal text-an-ink">{cell}</th>
                ) : (
                  <td key={ci} className="an-num px-2 py-1 text-right text-an-ink">{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
