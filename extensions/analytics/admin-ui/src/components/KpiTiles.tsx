import type { ReactNode } from "react";
import type { CompareMode, Metrics, SeriesMetric, SummaryResponse } from "../api/types";
import { Sparkline } from "../charts/Sparkline";
import { compact, decimal, duration, formatInt, percent, relativeDelta } from "../lib/format";
import { Delta } from "./Delta";
import { InfoTip } from "./InfoTip";
import { Skeleton } from "./Panel";

interface TileDef {
  key: keyof Metrics;
  label: string;
  format: (m: Metrics) => string;
  spark?: (s: SummaryResponse["sparklines"]) => number[];
  metric?: SeriesMetric;
  invert?: boolean;
  how: ReactNode;
  sub?: (m: Metrics) => ReactNode;
}

const ratio = (a: number[], b: number[]) => a.map((v, i) => (b[i] ? v / b[i] : 0));

const TILES: TileDef[] = [
  {
    key: "visitors", label: "Visitors (est.)", metric: "visitors",
    format: (m) => compact(m.visitors), spark: (s) => s.visitors,
    how: <>Visitors are identified with a hash that changes every day and is never stored with its salt. Over a multi-day range, this number is the <strong>sum of daily unique visitors</strong>: someone who comes back on three days counts three times. Shared networks, private relays and reduced user agents make it an estimate.</>,
  },
  {
    key: "pageviews", label: "Pageviews", metric: "pageviews",
    format: (m) => compact(m.pageviews), spark: (s) => s.pageviews,
    how: <>Every successful HTML page load measured on the server, including cache revalidations (304). Bots, prefetches that were never shown and excluded paths are not counted. Pages served from a CDN cache or restored by back/forward cache are invisible.</>,
  },
  {
    key: "visits", label: "Visits", metric: "visits",
    format: (m) => compact(m.visits), spark: (s) => s.visits,
    sub: (m) => (m.median_visit_seconds != null ? <>Median length {duration(m.median_visit_seconds)}<span className="an-sr-only"> (multi-page visits only)</span></> : null),
    how: <>A visit is a run of pageviews by the same daily visitor with no gap longer than the session timeout (30 minutes by default). <strong>Median visit length</strong> uses multi-page visits only — a single pageview has no measurable length without JavaScript.</>,
  },
  {
    key: "pages_per_visit", label: "Pages / visit",
    format: (m) => decimal(m.pages_per_visit, 2), spark: (s) => ratio(s.pageviews, s.visits),
    how: <>Pageviews divided by visits for the selected range.</>,
  },
  {
    key: "single_page_rate", label: "Single-page visits", invert: true,
    format: (m) => percent(m.single_page_rate),
    how: <>Share of visits that viewed exactly one page. This is <strong>not a bounce rate</strong>: someone who reads one article for ten minutes and leaves is counted here too, because no time-on-page is measured.</>,
  },
  {
    key: "conversions", label: "Conversions", metric: "conversions",
    format: (m) => compact(m.conversions), spark: (s) => s.conversions,
    sub: (m) => <>{percent(m.conversion_rate)} of visits</>,
    how: <>Visits that completed at least one goal (a page, a request such as a form submission, or a tracked link). The rate is converting visits divided by all visits.</>,
  },
];

interface Props {
  data: SummaryResponse | null;
  loading: boolean;
  compare: CompareMode | null;
  activeMetric: SeriesMetric;
  onSelectMetric: (m: SeriesMetric) => void;
}

export function KpiTiles({ data, loading, compare, activeMetric, onSelectMetric }: Props) {
  const vs = compare === "year" ? "vs same period last year" : "vs previous period";
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {TILES.map((t) => {
        const cur = data?.current;
        const prev = data?.previous;
        const selectable = !!t.metric;
        const active = t.metric === activeMetric;
        const spark = data && t.spark ? t.spark(data.sparklines) : [];
        const body = (
          <>
            <div className="flex items-center gap-1 text-xs font-medium text-an-muted">
              <span>{t.label}</span>
            </div>
            {loading && !cur ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <div className="mt-1 text-2xl leading-tight font-semibold tracking-tight text-an-ink" title={cur ? formatInt(Number(cur[t.key] ?? 0)) : undefined}>
                {cur ? t.format(cur) : "—"}
              </div>
            )}
            <div className="mt-0.5 flex min-h-5 flex-wrap items-center gap-x-2 text-xs text-an-muted">
              {compare && cur && <Delta value={prev ? relativeDelta(Number(cur[t.key] ?? 0), Number(prev[t.key] ?? 0)) : null} invert={t.invert} vsLabel={vs} />}
              {cur && t.sub?.(cur)}
            </div>
            <div className="mt-2">
              {spark.length > 1 ? <Sparkline values={spark} label={`${t.label} trend`} height={28} /> : <div className="h-7" aria-hidden="true" />}
            </div>
          </>
        );
        return (
          <div
            key={t.key}
            className={`an-card relative min-w-0 p-3 transition-shadow ${active ? "outline-2 -outline-offset-1 outline-an-c1" : ""}`}
          >
            <span className="absolute top-2.5 right-2.5 z-10">
              <InfoTip label={`How we count ${t.label}`} align="right">{t.how}</InfoTip>
            </span>
            {selectable ? (
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelectMetric(t.metric!)}
                className="an-focus block w-full cursor-pointer pr-5 text-left"
                title={`Show ${t.label} in the chart`}
              >
                {body}
              </button>
            ) : (
              <div className="pr-5">{body}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
