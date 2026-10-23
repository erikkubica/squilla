import { useState } from "react";
import { api, errorMessage } from "../api/client";
import { DataTable } from "../charts/DataTable";
import { HEATMAP_DAYS, Heatmap } from "../charts/Heatmap";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { formatInt } from "../lib/format";
import { ErrorNote, Panel, Skeleton } from "./Panel";
import { Segmented } from "./Segmented";

type M = "pageviews" | "visitors";

export function HeatmapCard({ vm }: { vm: ViewModel }) {
  const [metric, setMetric] = useState<M>("pageviews");
  const q = new URLSearchParams(vm.query);
  q.delete("compare");
  const hm = useAsync((s) => api.heatmap(q, s), `heat|${vm.queryKey}`);
  const tz = vm.tz ? ` (${vm.tz})` : "";

  return (
    <Panel
      id="an-heatmap"
      title="When people visit"
      subtitle={`Hour of week${tz}`}
      actions={<Segmented<M> label="Heatmap metric" size="xs" value={metric} onChange={setMetric} options={[{ value: "pageviews", label: "Pageviews" }, { value: "visitors", label: "Visitors" }]} />}
    >
      {hm.error && !hm.data ? (
        <ErrorNote message={errorMessage(hm.error)} onRetry={() => hm.reload()} />
      ) : !hm.data ? (
        <Skeleton style={{ height: 200 }} />
      ) : (
        <>
          <Heatmap cells={hm.data.cells} metric={metric} ariaLabel={`${metric} by day of week and hour; table follows for screen readers`} />
          <DataTable
            hidden
            caption={`${metric} by weekday and hour`}
            columns={["Day", ...Array.from({ length: 24 }, (_, h) => `${h}:00`)]}
            rows={HEATMAP_DAYS.map((d, di) => [
              d,
              ...Array.from({ length: 24 }, (_, h) => formatInt(hm.data!.cells.find((c) => c.dow === di && c.hour === h)?.[metric] ?? 0)),
            ])}
          />
        </>
      )}
    </Panel>
  );
}
