import { Sparkles } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { AnalyticsSettings, BehaviourSummary, Goal, StatusResponse } from "../api/types";
import { BreakdownCard } from "../components/BreakdownCard";
import { CARDS } from "../components/breakdownConfig";
import { EmptyData } from "../components/EmptyData";
import { ExportMenu } from "../components/ExportMenu";
import { Highlights, OVERVIEW_ROWS, SummaryLine, useInsightInput } from "../components/Highlights";
import { KpiTiles } from "../components/KpiTiles";
import { MainChartCard } from "../components/MainChartCard";
import { ErrorNote } from "../components/Panel";
import { PageShell } from "../components/PageShell";
import { RealtimeCard } from "../components/RealtimeCard";
import { SetupGuide } from "../components/SetupGuide";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";

export default function AnalyticsDashboard() {
  const vm = useViewState();
  const summary = useAsync((s) => api.summary(vm.query, s), vm.queryKey);
  const status = useAsync<StatusResponse | null>((s) => api.status(s).catch(() => null), "status");
  const settings = useAsync<AnalyticsSettings | null>((s) => api.settings(s).catch(() => null), "settings");
  const goals = useAsync<Goal[] | null>((s) => api.goals(s).catch(() => null), "goals");
  const bq = new URLSearchParams(vm.query);
  bq.delete("compare");
  const behaviour = useAsync<BehaviourSummary | null>((s) => api.behaviour(bq, s).catch(() => null), `behaviour|${bq}`);
  const input = useInsightInput(vm, { summary: summary.data, behaviour: behaviour.data, goals: goals.data });

  const neverRecorded = !!status.data && !status.data.last_record_at && !!summary.data && summary.data.current.pageviews === 0;
  const goalCount = goals.data ? goals.data.length : null;

  return (
    <PageShell
      active="overview"
      vm={vm}
      compare
      actions={
        <ExportMenu
          compact={false}
          label="Download data"
          query={vm.query}
          options={[
            { label: "Totals for this period", spec: { dataset: "summary" } },
            { label: "Numbers over time", spec: { dataset: "timeseries", interval: vm.interval } },
            { label: "Every page view (no personal data)", spec: { dataset: "events" } },
          ]}
        />
      }
    >
      <div className="an-stack">
        <SetupGuide
          status={status.data}
          settings={settings.data}
          goalCount={goalCount}
          hasVisits={!!summary.data && summary.data.current.pageviews > 0}
          onChanged={() => {
            settings.reload(true);
            status.reload(true);
          }}
        />
        {neverRecorded ? (
          <EmptyData status={status.data} />
        ) : (
          <>
            {!!summary.error && !summary.data && <ErrorNote message={errorMessage(summary.error)} onRetry={() => summary.reload()} />}
            <section className="an-card" aria-label="Summary of this period">
              <div className="an-report-lead">
                <span className="an-report-lead-icon" aria-hidden="true"><Sparkles /></span>
                <SummaryLine input={input} />
              </div>
              <KpiTiles
                data={summary.data}
                loading={summary.loading}
                compare={vm.state.compare}
                behaviour={behaviour.data}
                goalCount={goalCount}
                activeMetric={vm.state.metric}
                onSelectMetric={(m) => vm.update({ metric: m }, true)}
              />
            </section>
            <div className="an-grid-main an-fit">
              <MainChartCard vm={vm} height={300} />
              <div className="an-fit-side">
                <RealtimeCard />
              </div>
            </div>
            <Highlights input={input} />
            <div className="an-grid-3">
              <BreakdownCard def={CARDS.topPages} vm={vm} limit={OVERVIEW_ROWS} />
              <BreakdownCard def={CARDS.sources} vm={vm} limit={OVERVIEW_ROWS} />
              <BreakdownCard def={CARDS.locations} vm={vm} limit={OVERVIEW_ROWS} />
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
