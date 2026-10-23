import { ArrowDown, ArrowUp } from "@squilla/icons";
import type { BreakdownDim, BreakdownRow } from "../api/types";
import { ShareBar } from "../charts/ShareBar";
import { filterDimFor, valueLabel, valuePrefix } from "../lib/dims";
import { compact, formatInt, percent } from "../lib/format";
import { rowValue, type ValueColumn, type ValueKey } from "./breakdownConfig";

interface Props {
  dim: BreakdownDim;
  rows: BreakdownRow[];
  columns: ValueColumn[];
  onFilter?: (row: BreakdownRow) => void;
  /** Show the share % column (full page). */
  showShare?: boolean;
  sort?: ValueKey;
  onSort?: (k: ValueKey) => void;
  caption: string;
  /** Header for the label column. */
  dimLabel: string;
  compactNumbers?: boolean;
}

/** Breakdown rows with inline share bars; rows are click-to-filter. */
export function BreakdownTable({ dim, rows, columns, onFilter, showShare, sort, onSort, caption, dimLabel, compactNumbers = true }: Props) {
  const canFilter = !!onFilter && !!filterDimFor(dim);
  const fmt = compactNumbers ? compact : formatInt;
  return (
    <table className="w-full table-fixed border-separate border-spacing-y-0.5 text-[13px]">
      <caption className="an-sr-only">{caption}{canFilter ? ". Activate a row to filter the dashboard by it." : ""}</caption>
      <thead>
        <tr className="text-[11px] tracking-wide text-an-subtle uppercase">
          <th scope="col" className="px-2 pb-1 text-left font-medium">{dimLabel}</th>
          {columns.map((c, i) => (
            <th key={c.key} scope="col" aria-sort={sort === c.key ? "descending" : undefined} className={`pb-1 text-right font-medium ${i === 0 ? "w-20" : "hidden w-24 sm:table-cell"}`}>
              {onSort ? (
                <button type="button" onClick={() => onSort(c.key)} className={`an-focus inline-flex cursor-pointer items-center gap-1 uppercase ${sort === c.key ? "text-an-ink" : ""}`}>
                  {c.label}
                  {sort === c.key ? <ArrowDown className="size-3" aria-hidden="true" /> : <ArrowUp className="size-3 opacity-0" aria-hidden="true" />}
                </button>
              ) : (
                c.label
              )}
            </th>
          ))}
          {showShare && <th scope="col" className="hidden w-16 pb-1 text-right font-medium md:table-cell">Share</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const label = valueLabel(dim, r.value, r.label);
          const prefix = valuePrefix(dim, r.value);
          const content = (
            <ShareBar share={r.share}>
              {prefix && <span aria-hidden="true" className="mr-1.5">{prefix}</span>}
              <span title={r.value || label}>{label}</span>
            </ShareBar>
          );
          return (
            <tr key={r.value || "(none)"} className={canFilter ? "group" : ""}>
              <th scope="row" className="p-0 text-left font-normal">
                {canFilter ? (
                  <button
                    type="button"
                    onClick={() => onFilter!(r)}
                    className="an-focus block w-full cursor-pointer rounded-r text-left group-hover:bg-an-hover/60"
                    aria-label={`Filter by ${label}`}
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
              </th>
              {columns.map((c, i) => (
                <td key={c.key} className={`an-num pl-2 text-right text-an-ink ${i === 0 ? "" : "hidden text-an-muted sm:table-cell"}`} title={formatInt(rowValue(r, c.key))}>
                  {fmt(rowValue(r, c.key))}
                </td>
              ))}
              {showShare && <td className="an-num hidden pl-2 text-right text-an-muted md:table-cell">{percent(r.share)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
