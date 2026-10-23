import { useMemo, useState } from "react";
import { LineChart, Table2 } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { Interval, SeriesMetric } from "../api/types";
import { DataTable } from "../charts/DataTable";
import { TimeSeriesChart, type TSPoint } from "../charts/TimeSeriesChart";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { allowedIntervals, axisLabel, bucketLabel } from "../lib/dates";
import { formatInt } from "../lib/format";
import { ExportMenu } from "./ExportMenu";
import { ErrorNote, Panel, Skeleton } from "./Panel";
import { Segmented } from "./Segmented";

const METRIC_LABELS: Record<SeriesMetric, string> = {
  visitors: "Visitors",
  pageviews: "Pageviews",
  visits: "Visits",
  conversions: "Conversions",
};

const INTERVAL_LABELS: Record<Interval, string> = { hour: "Hour", day: "Day", week: "Week", month: "Month" };

export function MainChartCard({ vm }: { vm: ViewModel }) {
  const { state, interval, range, query, queryKey, update } = vm;
  const metric = state.metric;
  const [asTable, setAsTable] = useState(false);
  const ts = useAsync((s) => api.timeseries(query, interval, s), `${queryKey}|${interval}`);
  const allowed = allowedIntervals(range);
  const prevName = state.compare === "year" ? "Year ago" : "Previous period";

  const points: TSPoint[] = useMemo(() => {
    const d = ts.data;
    if (!d) return [];
    const iv = d.interval ?? interval;
    return d.points.map((p, i) => {
      const prev = d.previous_points?.[i];
      return {
        label: bucketLabel(p.t, iv),
        axis: axisLabel(p.t, iv),
        value: Number(p[metric] ?? 0),
        prev: prev ? Number(prev[metric] ?? 0) : null,
        prevLabel: prev ? `${prevName} (${bucketLabel(prev.t, iv)})` : undefined,
      };
    });
  }, [ts.data, metric, interval, prevName]);

  return (
    <Panel
      id="an-main-chart"
      title="Traffic trend"
      leading={
          <Segmented<SeriesMetric>
            label="Chart metric"
            value={metric}
            onChange={(m) => update({ metric: m }, true)}
            options={(Object.keys(METRIC_LABELS) as SeriesMetric[]).map((m) => ({ value: m, label: METRIC_LABELS[m] }))}
          />
      }
      actions={
        <>
          <Segmented<Interval>
            label="Interval"
            size="xs"
            value={interval}
            onChange={(iv) => update({ interval: iv }, true)}
            options={(Object.keys(INTERVAL_LABELS) as Interval[]).map((iv) => ({
              value: iv,
              label: INTERVAL_LABELS[iv],
              disabled: !allowed.includes(iv),
            }))}
          />
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            aria-label={asTable ? "View as chart" : "View as table"}
            title={asTable ? "View as chart" : "View as table"}
            className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink"
          >
            {asTable ? <LineChart className="size-3.5" aria-hidden="true" /> : <Table2 className="size-3.5" aria-hidden="true" />}
          </button>
          <ExportMenu label="Export time series" query={query} options={[{ label: "Time series", spec: { dataset: "timeseries", interval } }]} />
        </>
      }
    >
      {ts.error && !ts.data ? (
        <ErrorNote message={errorMessage(ts.error)} onRetry={() => ts.reload()} />
      ) : ts.loading && !ts.data ? (
        <Skeleton style={{ height: 260 }} />
      ) : asTable ? (
        <DataTable
          caption={`${METRIC_LABELS[metric]} by ${interval}`}
          columns={[INTERVAL_LABELS[interval], METRIC_LABELS[metric], ...(state.compare ? [prevName] : [])]}
          rows={points.map((p) => [p.label, formatInt(p.value), ...(state.compare ? [p.prev != null ? formatInt(p.prev) : "—"] : [])])}
        />
      ) : (
        <div className={ts.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <TimeSeriesChart
            points={points}
            seriesLabel={METRIC_LABELS[metric]}
            prevSeriesLabel={prevName}
            ariaLabel={`${METRIC_LABELS[metric]} per ${interval}. Use left and right arrow keys to inspect values, or switch to the table view.`}
          />
        </div>
      )}
    </Panel>
  );
}
