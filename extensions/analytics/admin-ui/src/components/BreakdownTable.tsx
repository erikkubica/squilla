import { ArrowDown, ArrowUp, Funnel } from "@squilla/icons";
import type { ReactNode } from "react";
import type { BreakdownDim, BreakdownRow } from "../api/types";
import { ShareBar } from "../charts/ShareBar";
import { channelInfo } from "../lib/channels";
import { filterDimFor, valueLabel, valuePrefix } from "../lib/dims";
import { compact, formatInt, percent } from "../lib/format";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link, useSearchParams } from "../shared";
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

/** Pages people open — their names link to the page's own report. */
const PAGE_DIMS: BreakdownDim[] = ["page", "entry_page", "exit_page"];

/**
 * Breakdown rows with inline share bars. Page names open the page report;
 * other rows filter every report by their value (the funnel says so).
 */
export function BreakdownTable({ dim, rows, columns, onFilter, showShare, sort, onSort, caption, dimLabel, compactNumbers = true }: Props) {
  const [sp] = useSearchParams();
  const canFilter = !!onFilter && !!filterDimFor(dim);
  const isPage = PAGE_DIMS.includes(dim);
  const fmt = compactNumbers ? compact : formatInt;
  return (
    <table className="w-full table-fixed border-separate border-spacing-y-0.5 text-[13px]">
      <caption className="an-sr-only">
        {caption}
        {isPage ? ". Open a page to see its report." : canFilter ? ". Activate a row to show only matching visits in every report." : ""}
      </caption>
      <thead>
        <tr className="text-[11px] tracking-wide text-an-subtle uppercase">
          <th scope="col" className="px-2 pb-1 text-left font-medium">{dimLabel}</th>
          {columns.map((c, i) => (
            <th key={c.key} scope="col" aria-sort={sort === c.key ? "descending" : undefined} className={`${showShare ? "w-28" : "w-20"} pb-1 text-right font-medium whitespace-nowrap ${i === 0 ? "" : "an-col-wide"}`}>
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
          {showShare && <th scope="col" className="an-col-xwide w-16 pb-1 text-right font-medium">Share</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const label = valueLabel(dim, r.value, r.label);
          const prefix = valuePrefix(dim, r.value);
          const hint = dim === "channel" ? channelInfo(r.value)?.help : undefined;
          const showTitle = isPage && r.label && r.label !== r.value;
          const name = (
            <>
              {prefix && <span aria-hidden="true" className="mr-1.5">{prefix}</span>}
              <span title={hint ?? (r.value || label)}>{label}</span>
              {showTitle && <span className="ml-1.5 text-an-subtle">{r.value}</span>}
            </>
          );
          let cell: ReactNode;
          if (isPage && r.value) {
            cell = (
              <div className="flex min-w-0 items-center">
                <ShareBar share={r.share}>
                  <Link to={withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(r.value)}`, sp)} className="an-rowlink an-focus" title={`Open the report for ${r.value}`}>
                    {name}
                  </Link>
                </ShareBar>
                {canFilter && (
                  <button type="button" onClick={() => onFilter!(r)} className="an-row-act an-focus ml-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-an-muted hover:bg-an-hover hover:text-an-ink" aria-label={`Show only visits to ${label}`} title="Show only visits to this page">
                    <Funnel className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          } else if (canFilter) {
            cell = (
              <button type="button" onClick={() => onFilter!(r)} className="an-focus group/row flex w-full min-w-0 cursor-pointer items-center rounded-r text-left hover:bg-an-hover/60" aria-label={`Show only ${label}`} title={hint ? `${hint} Click to show only these visits.` : "Click to show only these visits"}>
                <ShareBar share={r.share}>{name}</ShareBar>
                <Funnel className="an-row-act mr-1 size-3.5 shrink-0 text-an-muted" aria-hidden="true" />
              </button>
            );
          } else {
            cell = <ShareBar share={r.share}>{name}</ShareBar>;
          }
          return (
            <tr key={r.value || "(none)"}>
              <th scope="row" className="p-0 text-left font-normal">{cell}</th>
              {columns.map((c, i) => (
                <td key={c.key} className={`an-num pl-2 text-right ${i === 0 ? "text-an-ink" : "an-col-wide text-an-muted"}`} title={formatInt(rowValue(r, c.key))}>
                  {fmt(rowValue(r, c.key))}
                </td>
              ))}
              {showShare && <td className="an-num an-col-xwide pl-2 text-right text-an-muted">{percent(r.share)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
