import { api } from "../api/client";
import type { ViewModel } from "../hooks/useViewState";
import { useAsync } from "../hooks/useAsync";
import { pct, seconds } from "../lib/behaviour";
import { formatInt } from "../lib/format";
import { BASE_PATH, Link } from "../shared";
import { Tile } from "./Tile";

/** Overview row for what visitors do: engaged visits, stay, reach, click-through. */
export function BehaviourTiles({ vm }: { vm: ViewModel }) {
  const res = useAsync((s) => api.behaviour(vm.query, s), `behaviour|${vm.queryKey}`);
  const d = res.data;
  if (!d || (d.visits === 0 && d.signals === 0)) return null;
  const hasSignals = d.signals > 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Visitor behaviour">
      <Tile label="Engaged visits" value={pct(d.engaged, d.visits)} hint={`${formatInt(d.engaged)} of ${formatInt(d.visits)} finished visits`} />
      <Tile label="Time on exit page" value={hasSignals ? seconds(d.median_exit_dwell_s) : "—"} hint={hasSignals ? "Median, last stay mark" : "Turn on in-page signals"} />
      <Tile label="Sections seen per visit" value={d.avg_reach == null ? "—" : String(d.avg_reach)} hint={hasSignals ? undefined : "Turn on in-page signals"} />
      <Link to={`${BASE_PATH}/clicks`} className="an-focus block rounded-lg">
        <Tile label="Click-through" value={pct(d.clicks, d.sections_seen)} hint={`${formatInt(d.clicks)} clicks · ${formatInt(d.sections_seen)} impressions`} />
      </Link>
    </div>
  );
}
