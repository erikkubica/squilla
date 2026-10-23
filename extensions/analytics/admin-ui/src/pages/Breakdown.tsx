import { ArrowLeft } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import { BREAKDOWN_DIMS, type BreakdownDim, type BreakdownRow } from "../api/types";
import { BreakdownTable } from "../components/BreakdownTable";
import { columnsFor, defaultSort, type ValueKey } from "../components/breakdownConfig";
import { ExportMenu } from "../components/ExportMenu";
import { FilterBar } from "../components/FilterBar";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { DIM_LABELS, filterDimFor } from "../lib/dims";
import { carryParams } from "../lib/params";
import { BASE_PATH, Link, ui, useParams } from "../shared";

const { ListFooter } = ui;
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function isDim(d: string | undefined): d is BreakdownDim {
  return !!d && (BREAKDOWN_DIMS as readonly string[]).includes(d);
}

export default function AnalyticsBreakdown() {
  const params = useParams();
  const vm = useViewState();
  const dim: BreakdownDim = isDim(params.dim) ? params.dim : "page";
  const sp = vm.searchParams;
  const columns = columnsFor(dim, true);
  const sortParam = sp.get("sort") as ValueKey | null;
  const sort: ValueKey = sortParam && columns.some((c) => c.key === sortParam) ? sortParam : defaultSort(dim);
  const perPage = PER_PAGE_OPTIONS.includes(Number(sp.get("per"))) ? Number(sp.get("per")) : 25;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const q = new URLSearchParams(vm.query);
  q.delete("compare");

  const res = useAsync(
    (s) => api.breakdown(dim, q, { limit: perPage, offset: (page - 1) * perPage, sort }, s),
    `${dim}|${vm.queryKey}|${sort}|${page}|${perPage}`,
  );

  const patch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    vm.setSearchParams(next);
  };

  const fdim = filterDimFor(dim);
  const onFilter = fdim ? (r: BreakdownRow) => vm.addFilter(fdim, r.value) : undefined;
  const total = res.data?.total_rows ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const exportQuery = q;

  return (
    <PageShell
      active="breakdown"
      title={
        <span className="inline-flex items-center gap-2">
          <Link to={`${BASE_PATH}${carryParams(sp)}`} aria-label="Back to overview" className="an-focus inline-flex size-7 items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          {DIM_LABELS[dim]}
        </span>
      }
    >
      <FilterBar vm={vm} showCompare={false} right={<ExportMenu compact={false} query={exportQuery} options={[{ label: `All ${DIM_LABELS[dim].toLowerCase()} rows`, spec: { dataset: "breakdown", dim } }]} />} />
      <Panel bodyClassName="p-2 sm:p-3">
        {res.error && !res.data ? (
          <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
        ) : res.loading && !res.data ? (
          <div className="space-y-1.5" aria-busy="true">
            {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-6" style={{ width: `${95 - i * 6}%` }} />)}
          </div>
        ) : total === 0 ? (
          <p className="py-12 text-center text-sm text-an-muted">No data for this range and filters.</p>
        ) : (
          <div className={res.loading ? "opacity-60" : ""}>
            <BreakdownTable
              dim={dim}
              rows={res.data?.rows ?? []}
              columns={columns}
              onFilter={onFilter}
              showShare
              compactNumbers={false}
              sort={sort}
              onSort={(k) => patch({ sort: k === defaultSort(dim) ? null : k, page: null })}
              caption={`${DIM_LABELS[dim]} breakdown, sorted by ${sort}`}
              dimLabel={DIM_LABELS[dim]}
            />
          </div>
        )}
      </Panel>
      {total > 0 && (
        <div className="mt-2">
          <ListFooter
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPage={(p: number) => patch({ page: p === 1 ? null : String(p) })}
            onPerPage={(n: number) => patch({ per: n === 25 ? null : String(n), page: null })}
            label="rows"
          />
        </div>
      )}
    </PageShell>
  );
}
