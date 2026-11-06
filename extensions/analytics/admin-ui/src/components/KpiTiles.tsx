import type { ReactNode } from "react";
import type { BehaviourSummary, CompareMode, SeriesMetric, SummaryResponse } from "../api/types";
import { Sparkline } from "../charts/Sparkline";
import { compact, decimal, duration, formatInt, percent, relativeDelta } from "../lib/format";
import { BASE_PATH, Link } from "../shared";
import { Delta } from "./Delta";
import { InfoTip } from "./InfoTip";
import { Skeleton } from "./Panel";

interface Props {
  data: SummaryResponse | null;
  loading: boolean;
  compare: CompareMode | null;
  behaviour: BehaviourSummary | null;
  /** null while unknown; 0 shows the "set up a goal" prompt. */
  goalCount: number | null;
  activeMetric: SeriesMetric;
  onSelectMetric: (m: SeriesMetric) => void;
}

interface Tile {
  key: string;
  label: string;
  metric?: SeriesMetric;
  value: string;
  exact?: string;
  delta?: { cur: number; prev: number | undefined };
  note: ReactNode;
  spark?: number[];
  how: ReactNode;
}

/** The four numbers a site owner checks first, plus a strip of secondary ones. */
export function KpiTiles({ data, loading, compare, behaviour, goalCount, activeMetric, onSelectMetric }: Props) {
  const cur = data?.current;
  const prev = data?.previous ?? undefined;
  const vs = compare === "year" ? "vs the same days last year" : "vs the previous period";

  if (!cur) {
    return (
      <>
        <div className="an-cells" aria-busy={loading}>
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="an-kpi"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-8 w-20" /><Skeleton className="mt-3 h-7" /></div>)}
        </div>
        <div className="an-report-foot"><Skeleton className="h-4 w-2/3" /></div>
      </>
    );
  }

  const engagedKnown = !!behaviour && behaviour.visits > 0;
  const noGoals = goalCount === 0;
  const tiles: Tile[] = [
    {
      key: "visitors", label: "Visitors", metric: "visitors",
      value: compact(cur.visitors), exact: formatInt(cur.visitors),
      delta: { cur: cur.visitors, prev: prev?.visitors },
      note: "People who visited",
      spark: data?.sparklines.visitors,
      how: <>Each person is counted once per day, without cookies: a daily random code that is never stored makes them recognisable until midnight. Over several days, someone who comes back on three days counts three times, so treat this as an estimate.</>,
    },
    {
      key: "pageviews", label: "Page views", metric: "pageviews",
      value: compact(cur.pageviews), exact: formatInt(cur.pageviews),
      delta: { cur: cur.pageviews, prev: prev?.pageviews },
      note: "Pages they opened",
      spark: data?.sparklines.pageviews,
      how: <>Every page a person opened. Bots, preloaded pages nobody looked at and pages you excluded in Settings are not counted.</>,
    },
    {
      key: "engaged", label: "Engaged visits",
      value: engagedKnown ? percent(behaviour!.engaged / behaviour!.visits, 0) : "—",
      note: engagedKnown ? `${formatInt(behaviour!.engaged)} of ${formatInt(behaviour!.visits)} finished visits` : "Shows up about 30 minutes after visits end",
      how: <>A visit is engaged when the person stayed at least 10 seconds, opened a second page, scrolled to the end or reached a goal. A visit is added here once it has ended (30 minutes without activity).</>,
    },
    {
      key: "conversions", label: "Conversions", metric: noGoals ? undefined : "conversions",
      value: noGoals ? "—" : compact(cur.conversions), exact: noGoals ? undefined : formatInt(cur.conversions),
      delta: noGoals ? undefined : { cur: cur.conversions, prev: prev?.conversions },
      note: noGoals ? <Link to={`${BASE_PATH}/goals?new=1`}>Set up your first goal</Link> : `${percent(cur.conversion_rate)} of visits reached a goal`,
      spark: noGoals ? undefined : data?.sparklines.conversions,
      how: <>Visits that reached at least one of your goals, such as a sent form, a thank-you page or a click on a tracked link. Set goals up on the Goals page.</>,
    },
  ];

  return (
    <>
      <div className="an-cells">
        {tiles.map((t) => {
          const selectable = !!t.metric;
          const active = selectable && t.metric === activeMetric;
          const body = (
            <>
              <span className="an-kpi-label">{t.label}</span>
              <span className="an-kpi-value" title={t.exact}>{t.value}</span>
              <span className="an-kpi-meta">
                {compare && t.delta && <Delta value={t.delta.prev == null ? null : relativeDelta(t.delta.cur, t.delta.prev)} vsLabel={vs} />}
                <span>{t.note}</span>
              </span>
              {t.spark && t.spark.length > 1 && <span className="an-kpi-spark block"><Sparkline values={t.spark} label={`${t.label} trend`} height={26} /></span>}
            </>
          );
          return (
            <div key={t.key}>
              {selectable ? (
                <button
                  type="button"
                  className="an-kpi an-focus"
                  data-active={active ? "" : undefined}
                  aria-pressed={active}
                  title={`Show ${t.label.toLowerCase()} in the chart`}
                  onClick={() => onSelectMetric(t.metric!)}
                >
                  {body}
                </button>
              ) : (
                <div className="an-kpi">{body}</div>
              )}
              <span className="an-kpi-info">
                <InfoTip label={`How ${t.label.toLowerCase()} are counted`} align="right">{t.how}</InfoTip>
              </span>
            </div>
          );
        })}
      </div>
      <div className="an-report-foot">
        <span>
          <b>{formatInt(cur.visits)}</b> visits
          <InfoTip label="What is a visit?">A visit is one sitting: the pages someone opens until they have been away for 30 minutes. One person can make several visits.</InfoTip>
        </span>
        <span><b>{decimal(cur.pages_per_visit, 1)}</b> pages per visit</span>
        <span>
          <b>{percent(cur.single_page_rate, 0)}</b> of visits saw one page
          <InfoTip label="About one-page visits">Visits that opened only one page. That isn’t always bad: someone may read a whole article and leave satisfied.</InfoTip>
        </span>
        {cur.median_visit_seconds != null && (
          <span>
            Typical visit <b>{duration(cur.median_visit_seconds)}</b>
            <InfoTip label="About visit length">The middle value for visits with two or more pages. The time spent on the last page can’t be measured without in-page measurement.</InfoTip>
          </span>
        )}
      </div>
    </>
  );
}
