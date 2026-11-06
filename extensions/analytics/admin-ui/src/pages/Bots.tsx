import { useMemo, type ReactNode } from "react";
import { Bot, Share2 } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { BotsResponse } from "../api/types";
import { DataTable } from "../charts/DataTable";
import { ShareBar } from "../charts/ShareBar";
import { StackedBars } from "../charts/StackedBars";
import { InfoTip } from "../components/InfoTip";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { BOT_GROUPS, categoryLabel, groupOf, groupTotals, pivotTimeseries } from "../lib/bots";
import { axisLabel, rangeDays } from "../lib/dates";
import { compact, formatInt } from "../lib/format";

export default function AnalyticsBots() {
  const vm = useViewState();
  const q = new URLSearchParams({ from: vm.range.from, to: vm.range.to });
  const res = useAsync((s) => api.bots(q, s), `bots|${q.toString()}`);
  const d = res.data;

  return (
    <PageShell active="bots" vm={vm}>
      {res.error && !d ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !d ? (
        <div className="an-stack">
          <div className="an-kpis">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <BotsBody data={d} days={rangeDays(vm.range)} />
      )}
    </PageShell>
  );
}

function BotsBody({ data, days }: { data: BotsResponse; days: number }) {
  const totals = useMemo(() => groupTotals(data.totals), [data.totals]);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const buckets = useMemo(
    () => pivotTimeseries(data.timeseries).map((b) => ({ label: b.t.slice(0, 10), axis: axisLabel(b.t, days > 400 ? "month" : "day"), values: b.values })),
    [data.timeseries, days],
  );
  const series = BOT_GROUPS.filter((g) => totals[g.key] > 0).map((g) => ({ key: g.key, label: g.label, color: g.color }));
  const top = useMemo(() => [...data.top].sort((a, b) => b.hits - a.hits), [data.top]);
  const assistants = top.filter((t) => t.category === "ai_assistant");
  const previews = top.filter((t) => t.category === "link_preview");
  const topMax = Math.max(1, ...top.map((x) => x.hits));

  return (
    <div className="an-stack">
      <section className="an-card" aria-label="Summary of this period">
        <div className="an-report-lead">
          <span className="an-report-lead-icon" aria-hidden="true"><Bot /></span>
          <p className="an-summary">
            <strong>{formatInt(grand)}</strong> automated requests {grand === 1 ? "was" : "were"} answered in this period
            {totals.ai_assistant > 0 && <>, including <strong>{formatInt(totals.ai_assistant)}</strong> by AI assistants answering someone’s question</>}
            {totals.link_preview > 0 && <>{totals.ai_assistant > 0 ? ", and " : ", including "}<strong>{formatInt(totals.link_preview)}</strong> link previews when someone shared your page</>}.
          </p>
        </div>
        <div className="an-cells">
          {BOT_GROUPS.map((g) => (
            <div key={g.key} className="an-kpi">
              <span className="an-kpi-label">
                <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-[3px]" style={{ background: g.color }} />
                <span className="truncate">{g.label}</span>
              </span>
              <span className="an-kpi-value" title={formatInt(totals[g.key])}>{compact(totals[g.key])}</span>
              <span className="an-kpi-meta">{grand ? `${((totals[g.key] / grand) * 100).toFixed(1).replace(/\.0$/, "")}% of bot requests` : "—"}</span>
              <span className="an-kpi-info"><InfoTip label={`About ${g.label}`} align="right">{g.description}</InfoTip></span>
            </div>
          ))}
        </div>
        <p className="an-report-foot">
          None of these count as visitors. Your server sees every request, so bots show up here even though they never run scripts.
        </p>
      </section>

      <div className="an-grid-2">
        <HighlightCard
          icon={<Bot className="size-4" aria-hidden="true" />}
          title="AI assistants reading your pages"
          hint="Each one is a person asking ChatGPT, Claude or another assistant something your page answers. A good sign of interest, even though no visit is recorded."
          rows={assistants}
          total={totals.ai_assistant}
        />
        <HighlightCard
          icon={<Share2 className="size-4" aria-hidden="true" />}
          title="Shared in apps"
          hint="When someone pastes your link into WhatsApp, Facebook, Slack and similar apps, the app fetches a preview. Roughly how often your pages are shared, by app."
          rows={previews}
          total={totals.link_preview}
        />
      </div>

      <Panel title="Automated requests per day" subtitle="By kind of bot">
        {buckets.length === 0 ? (
          <p className="py-10 text-center text-sm text-an-muted">No automated traffic in this period.</p>
        ) : (
          <>
            <StackedBars series={series} buckets={buckets} ariaLabel="Stacked daily bot hits by category; table follows for screen readers" />
            <DataTable hidden caption="Bot hits per day by category" columns={["Day", ...series.map((s) => s.label)]} rows={buckets.map((b) => [b.label, ...series.map((s) => formatInt(b.values[s.key] ?? 0))])} />
          </>
        )}
      </Panel>

      <Panel title="Most active bots" bodyClassName="p-2">
        {data.top.length === 0 ? (
          <p className="py-8 text-center text-sm text-an-muted">No bots identified yet.</p>
        ) : (
          <table className="w-full table-fixed text-[13px]">
            <caption className="an-sr-only">Top bots by hits</caption>
            <thead>
              <tr className="text-[11px] tracking-wide text-an-subtle uppercase">
                <th scope="col" className="px-2 pb-1 text-left font-medium">Bot</th>
                <th scope="col" className="an-col-wide w-48 pb-1 text-left font-medium">Kind</th>
                <th scope="col" className="w-20 pb-1 text-right font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {top.map((t) => {
                const g = groupOf(t.category);
                return (
                  <tr key={`${t.category}-${t.name}`}>
                    <th scope="row" className="py-0.5 text-left font-normal">
                      <ShareBar share={t.hits / topMax}>{t.name}</ShareBar>
                    </th>
                    <td className="an-col-wide pl-2 text-an-muted">
                      <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block size-2 rounded-[2px]" style={{ background: g.color }} />{categoryLabel(t.category)}</span>
                    </td>
                    <td className="an-num pl-2 text-right text-an-ink">{formatInt(t.hits)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function HighlightCard({ icon, title, hint, rows, total }: { icon: ReactNode; title: string; hint: string; rows: BotsResponse["top"]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.hits));
  return (
    <Panel title={<span className="inline-flex items-center gap-2">{icon}{title}</span>} actions={<span className="an-num text-sm font-semibold text-an-ink">{formatInt(total)}</span>}>
      <p className="mb-3 text-xs leading-relaxed text-an-muted">{hint}</p>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-an-muted">None in this range.</p>
      ) : (
        <ul className="space-y-0.5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.name} className="flex items-center gap-2">
              <div className="min-w-0 flex-1"><ShareBar share={r.hits / max}>{r.name}</ShareBar></div>
              <span className="an-num w-14 text-right text-[13px] text-an-ink">{formatInt(r.hits)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
