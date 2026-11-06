import { useMemo, type ComponentType } from "react";
import { ArrowRight, Bot, FileText, Link2, MousePointerClick, Smartphone, Target, TrendingDown, TrendingUp, TriangleAlert } from "@squilla/icons";
import { api } from "../api/client";
import type { BehaviourSummary, Goal, SummaryResponse } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { comparePhrase, rangePhrase } from "../lib/dates";
import { buildInsights, buildSummary, type Insight, type InsightIcon, type InsightInput, type Part } from "../lib/insights";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link } from "../shared";
import { Panel, Skeleton } from "./Panel";

/** Rows the Overview cards also show: same size, so the requests are shared. */
export const OVERVIEW_ROWS = 6;

const ICONS: Record<InsightIcon, ComponentType<{ "aria-hidden"?: "true" }>> = {
  up: TrendingUp,
  down: TrendingDown,
  source: Link2,
  page: FileText,
  phone: Smartphone,
  ai: Bot,
  broken: TriangleAlert,
  goal: Target,
  engaged: MousePointerClick,
};

export function Parts({ parts }: { parts: Part[] }) {
  return <>{parts.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : <strong key={i}>{p.b}</strong>))}</>;
}

interface Data {
  summary: SummaryResponse | null;
  behaviour: BehaviourSummary | null;
  goals: Goal[] | null;
}

type Dim = Parameters<typeof api.breakdown>[0];

function useRows(vm: ViewModel, dim: Dim, sort: string, limit = OVERVIEW_ROWS) {
  const base = new URLSearchParams(vm.query);
  base.delete("compare");
  return useAsync((s) => api.breakdown(dim, base, { limit, sort }, s).catch(() => null), `${dim}|${sort}|${limit}|${base}`);
}

/** Loads the extra lists the highlights read and builds the input once. */
export function useInsightInput(vm: ViewModel, d: Data): InsightInput | null {
  const channels = useRows(vm, "channel", "visitors");
  const pages = useRows(vm, "page", "visitors");
  const devices = useRows(vm, "device", "visitors");
  const missing = useRows(vm, "not_found", "pageviews", 25);
  const goalRows = useRows(vm, "goal", "conversions");
  const bots = useAsync((s) => api.bots(new URLSearchParams({ from: vm.range.from, to: vm.range.to }), s).catch(() => null), `bots|${vm.range.from}|${vm.range.to}`);

  const ready = !!d.summary && !channels.loading && !pages.loading;
  return useMemo(() => {
    if (!ready) return null;
    const carry = (path: string) => withCarry(`${BASE_PATH}${path}`, vm.searchParams);
    return {
      rangePhrase: rangePhrase(vm.state.preset, vm.range),
      prevPhrase: comparePhrase(vm.range, vm.state.compare ?? "previous"),
      summary: d.summary,
      channels: channels.data?.rows ?? null,
      pages: pages.data?.rows ?? null,
      devices: devices.data?.rows ?? null,
      notFound: missing.data?.rows ?? null,
      notFoundTotal: missing.data?.total_rows ?? 0,
      goals: d.goals,
      goalRows: goalRows.data?.rows ?? null,
      bots: bots.data,
      behaviour: d.behaviour,
      links: {
        visitors: carry("/visitors"),
        pages: carry("/pages"),
        page: (p: string) => withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(p)}`, vm.searchParams),
        goals: carry("/goals"),
        newGoal: `${BASE_PATH}/goals?new=1`,
        bots: carry("/bots"),
        engagement: carry("/engagement"),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, d.summary, d.behaviour, d.goals, channels.data, pages.data, devices.data, missing.data, goalRows.data, bots.data, vm.state.preset, vm.state.compare, vm.range, vm.searchParams]);
}

/** "129 people visited your site in the last 30 days, 12% more than …" */
export function SummaryLine({ input }: { input: InsightInput | null }) {
  if (!input) {
    return (
      <div className="flex-1 space-y-2 pt-1" aria-hidden="true">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  const parts = buildSummary(input);
  if (!parts) return <p className="an-summary">No visits {input.rangePhrase}. Try a longer period, or remove the filters if you set any.</p>;
  return <p className="an-summary"><Parts parts={parts} /></p>;
}

/** "What stands out": the findings that didn't make the summary. */
export function Highlights({ input }: { input: InsightInput | null }) {
  const items: Insight[] = input ? buildInsights(input, 5, ["trend", "source"]) : [];
  return (
    <Panel title="What stands out" subtitle="Worth a look in this period" bodyClassName="p-0">
      {!input ? (
        <div className="space-y-3 p-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-an-muted">Nothing unusual. Check back when more people have visited.</p>
      ) : (
        <ul className="an-insights" data-cols="2">
          {items.map((x) => {
            const Icon = ICONS[x.icon];
            return (
              <li key={x.id} className="an-insight" data-tone={x.tone}>
                <span className="an-insight-icon"><Icon aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="an-insight-text"><Parts parts={x.parts} /></p>
                  {x.link && (
                    <Link to={x.link.to} className="an-insight-link an-focus">
                      {x.link.label}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
