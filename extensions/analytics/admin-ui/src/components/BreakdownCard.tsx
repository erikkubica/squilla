import { ChevronRight } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { BreakdownRow } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { DIM_LABELS, filterDimFor } from "../lib/dims";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link } from "../shared";
import { columnsFor, defaultSort, type BreakdownCardDef } from "./breakdownConfig";
import { BreakdownTable } from "./BreakdownTable";
import { ExportMenu } from "./ExportMenu";
import { ErrorNote, Panel, Skeleton } from "./Panel";
import { Segmented } from "./Segmented";

interface Props {
  def: BreakdownCardDef;
  vm: ViewModel;
  /** Rows to show (default 8). */
  limit?: number;
  /** "See all" target; defaults to the full table for the active tab. */
  more?: { to: string; label: string };
  /** Message when there is nothing to show. */
  empty?: string;
}

export function BreakdownCard({ def, vm, limit = 8, more, empty }: Props) {
  const { searchParams, queryKey } = vm;
  const tabParam = `t.${def.id}`;
  const active = def.tabs.find((t) => t.dim === searchParams.get(tabParam)) ?? def.tabs[0];
  const dim = active.dim;
  // Breakdowns have no comparison; leaving `compare` out lets the request be
  // shared with the Overview's highlights.
  const query = new URLSearchParams(vm.query);
  query.delete("compare");
  const res = useAsync(
    (s) => api.breakdown(dim, query, { limit, sort: defaultSort(dim) }, s),
    `${dim}|${limit}|${queryKey}`,
  );

  const setTab = (d: string) => {
    const next = new URLSearchParams(searchParams);
    if (d === def.tabs[0].dim) next.delete(tabParam);
    else next.set(tabParam, d);
    vm.setSearchParams(next, { replace: true });
  };

  const fdim = filterDimFor(dim);
  const onFilter = fdim ? (r: BreakdownRow) => vm.addFilter(fdim, r.value) : undefined;
  const rows = res.data?.rows ?? [];
  const total = res.data?.total_rows ?? 0;
  const isEmpty = !res.loading && !res.error && rows.length === 0;
  const target = more ?? { to: withCarry(`${BASE_PATH}/breakdown/${dim}`, searchParams), label: total > limit ? `See all ${total.toLocaleString("en-US")}` : "See all" };

  return (
    <Panel
      id={`an-card-${def.id}`}
      title={def.title}
      subtitle={active.hint ?? def.description}
      actions={<ExportMenu label={`Export ${def.title}`} query={query} options={[{ label: `${def.title} · ${active.label}`, spec: { dataset: "breakdown", dim } }]} />}
      bodyClassName="flex flex-col px-2 pt-2 pb-1"
    >
      {def.tabs.length > 1 && (
        <div className="mb-2 px-2">
          <Segmented label={`${def.title}: what to list`} size="xs" value={dim} onChange={setTab} options={def.tabs.map((t) => ({ value: t.dim, label: t.label }))} />
        </div>
      )}
      <div className={`flex-1 ${res.loading && res.data ? "opacity-60" : ""}`} style={res.data ? undefined : { minHeight: Math.min(limit, 8) * 26 + 24 }}>
        {res.error && !res.data ? (
          <div className="px-2"><ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} /></div>
        ) : res.loading && !res.data ? (
          <div className="space-y-1.5 px-2" aria-busy="true">
            {Array.from({ length: Math.min(limit, 6) }, (_, i) => <Skeleton key={i} className="h-6" style={{ width: `${92 - i * 11}%` }} />)}
          </div>
        ) : isEmpty ? (
          <p className="px-2 py-8 text-center text-[13px] text-an-muted">{active.empty ?? empty ?? "Nothing recorded in this period."}</p>
        ) : (
          <BreakdownTable
            dim={dim}
            rows={rows}
            columns={columnsFor(dim)}
            onFilter={onFilter}
            caption={`${def.title}: ${active.label}`}
            dimLabel={active.column ?? DIM_LABELS[dim]}
          />
        )}
      </div>
      {total > 0 && (
        <div className="an-card-foot">
          <Link to={target.to} className="an-more an-focus">
            {target.label}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </Panel>
  );
}
