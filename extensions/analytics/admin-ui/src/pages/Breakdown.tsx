import { api, errorMessage } from "../api/client";
import { BREAKDOWN_DIMS, type BreakdownDim, type BreakdownRow } from "../api/types";
import { BreakdownTable } from "../components/BreakdownTable";
import { FULL_TITLES, columnsFor, defaultSort, homeOf, type ValueKey } from "../components/breakdownConfig";
import { ExportMenu } from "../components/ExportMenu";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { DIM_LABELS, filterDimFor } from "../lib/dims";
import { withCarry } from "../lib/params";
import { BASE_PATH, ui, useParams } from "../shared";

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
  const home = homeOf(dim);
  const title = FULL_TITLES[dim] ?? DIM_LABELS[dim];

  return (
    <PageShell
      active={home.key}
      title={title}
      intro={fdim ? "The full list. Click a row to show only those visits in every report." : "The full list for the selected period."}
      back={{ to: withCarry(`${BASE_PATH}${home.path}`, sp), label: `Back to ${home.label}` }}
      vm={vm}
      actions={<ExportMenu compact={false} label="Download this list" query={exportQuery} options={[{ label: title, spec: { dataset: "breakdown", dim } }]} />}
    >
      <Panel bodyClassName="p-0">
        <div className="p-2">
          {res.error && !res.data ? (
            <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
          ) : res.loading && !res.data ? (
            <div className="space-y-1.5" aria-busy="true">
              {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-6" style={{ width: `${95 - i * 6}%` }} />)}
            </div>
          ) : total === 0 ? (
            <p className="py-12 text-center text-sm text-an-muted">Nothing recorded for this period and filters.</p>
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
                caption={`${title}, sorted by ${sort}`}
                dimLabel={DIM_LABELS[dim]}
              />
            </div>
          )}
        </div>
        {total > 0 && (
          <ListFooter
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPage={(p: number) => patch({ page: p === 1 ? null : String(p) })}
            onPerPage={(n: number) => patch({ per: n === 25 ? null : String(n), page: null })}
            label="rows"
          />
        )}
      </Panel>
    </PageShell>
  );
}
