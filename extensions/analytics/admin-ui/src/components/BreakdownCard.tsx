import { ChevronRight } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { BreakdownRow } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { DIM_LABELS, filterDimFor } from "../lib/dims";
import { carryParams } from "../lib/params";
import { BASE_PATH, Link } from "../shared";
import { columnsFor, defaultSort, type BreakdownCardDef } from "./breakdownConfig";
import { BreakdownTable } from "./BreakdownTable";
import { ExportMenu } from "./ExportMenu";
import { ErrorNote, Panel, Skeleton } from "./Panel";
import { Segmented } from "./Segmented";

const LIMIT = 8;

export function BreakdownCard({ def, vm }: { def: BreakdownCardDef; vm: ViewModel }) {
  const { searchParams, query, queryKey } = vm;
  const tabParam = `t.${def.id}`;
  const active = def.tabs.find((t) => t.dim === searchParams.get(tabParam)) ?? def.tabs[0];
  const dim = active.dim;
  const res = useAsync(
    (s) => api.breakdown(dim, query, { limit: LIMIT, sort: defaultSort(dim) }, s),
    `${dim}|${queryKey}`,
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
  const empty = !res.loading && !res.error && rows.length === 0;

  return (
    <Panel
      id={`an-card-${def.id}`}
      title={def.title}
      actions={<ExportMenu label={`Export ${def.title}`} query={query} options={[{ label: `${def.title} · ${active.label}`, spec: { dataset: "breakdown", dim } }]} />}
      bodyClassName="flex min-h-[320px] flex-col px-2 pt-2 pb-2"
    >
      {def.tabs.length > 1 && (
        <div className="mb-2 px-2">
          <Segmented label={`${def.title} view`} size="xs" value={dim} onChange={setTab} options={def.tabs.map((t) => ({ value: t.dim, label: t.label }))} />
        </div>
      )}
      <div className={`flex-1 ${res.loading && res.data ? "opacity-60" : ""}`}>
        {res.error && !res.data ? (
          <div className="px-2"><ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} /></div>
        ) : res.loading && !res.data ? (
          <div className="space-y-1.5 px-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-6" style={{ width: `${92 - i * 11}%` }} />)}
          </div>
        ) : empty ? (
          <p className="px-2 py-8 text-center text-xs text-an-muted">No data for this range.</p>
        ) : (
          <BreakdownTable
            dim={dim}
            rows={rows}
            columns={columnsFor(dim)}
            onFilter={onFilter}
            caption={`${def.title}: ${active.label} by ${DIM_LABELS[dim].toLowerCase()}`}
            dimLabel={DIM_LABELS[dim]}
          />
        )}
      </div>
      {total > 0 && (
        <div className="mt-1 flex justify-end px-2">
          <Link
            to={`${BASE_PATH}/breakdown/${dim}${carryParams(searchParams)}`}
            className="an-focus inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-medium text-an-muted hover:text-an-ink"
          >
            View all{total > LIMIT ? ` ${total.toLocaleString("en-US")}` : ""}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </Panel>
  );
}

