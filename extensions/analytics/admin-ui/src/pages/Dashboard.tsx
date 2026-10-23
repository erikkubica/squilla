import { api } from "../api/client";
import type { StatusResponse } from "../api/types";
import { BreakdownCard } from "../components/BreakdownCard";
import { BREAKDOWN_CARDS } from "../components/breakdownConfig";
import { EmptyData } from "../components/EmptyData";
import { ExportMenu } from "../components/ExportMenu";
import { FilterBar } from "../components/FilterBar";
import { HeatmapCard } from "../components/HeatmapCard";
import { KpiTiles } from "../components/KpiTiles";
import { MainChartCard } from "../components/MainChartCard";
import { ErrorNote } from "../components/Panel";
import { PageShell } from "../components/PageShell";
import { RealtimeCard } from "../components/RealtimeCard";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { errorMessage } from "../api/client";

export default function AnalyticsDashboard() {
  const vm = useViewState();
  const summary = useAsync((s) => api.summary(vm.query, s), vm.queryKey);
  const status = useAsync<StatusResponse | null>((s) => api.status(s).catch(() => null), "status");

  const neverRecorded =
    !!status.data && !status.data.last_record_at && !!summary.data && summary.data.current.pageviews === 0;

  return (
    <PageShell active="overview">
      <FilterBar
        vm={vm}
        right={
          <ExportMenu
            compact={false}
            query={vm.query}
            options={[
              { label: "Summary", spec: { dataset: "summary" } },
              { label: "Time series", spec: { dataset: "timeseries", interval: vm.interval } },
              { label: "Raw events (safe columns)", spec: { dataset: "events" } },
            ]}
          />
        }
      />
      {neverRecorded ? (
        <EmptyData status={status.data} />
      ) : (
        <div className="space-y-4">
          {!!summary.error && !summary.data && <ErrorNote message={errorMessage(summary.error)} onRetry={() => summary.reload()} />}
          <KpiTiles
            data={summary.data}
            loading={summary.loading}
            compare={vm.state.compare}
            activeMetric={vm.state.metric}
            onSelectMetric={(m) => vm.update({ metric: m }, true)}
          />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <MainChartCard vm={vm} />
            <RealtimeCard />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {BREAKDOWN_CARDS.map((def) => (
              <BreakdownCard key={def.id} def={def} vm={vm} />
            ))}
          </div>
          <HeatmapCard vm={vm} />
        </div>
      )}
    </PageShell>
  );
}
