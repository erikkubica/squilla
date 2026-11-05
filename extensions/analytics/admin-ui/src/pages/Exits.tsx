import { useMemo } from "react";
import { api, errorMessage } from "../api/client";
import type { ExitSegmentRow, ExitStats } from "../api/types";
import { FilterBar } from "../components/FilterBar";
import { InfoTip } from "../components/InfoTip";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Tile } from "../components/Tile";
import { ShareBar } from "../charts/ShareBar";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { EXIT_REASONS, pct, reasonLabel, seconds } from "../lib/behaviour";
import { formatInt } from "../lib/format";
import { BASE_PATH, Link } from "../shared";

export default function AnalyticsExits() {
  const vm = useViewState();
  const res = useAsync((s) => api.exits(vm.query, s), `exits|${vm.queryKey}`);
  const d = res.data;
  return (
    <PageShell active="exits" title="Why they leave">
      <FilterBar vm={vm} showCompare={false} />
      <p className="mb-4 max-w-3xl text-sm text-an-muted">
        Every finished visit gets one exit reason, decided from what they did last. The labels are heuristics, not facts about intent.
      </p>
      {res.error && !d ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !d ? (
        <Skeleton className="h-72" />
      ) : d.total === 0 ? (
        <Panel><p className="py-10 text-center text-sm text-an-muted">No finished visits in this range yet. Visits are finalised about {"30"} minutes after the last page view.</p></Panel>
      ) : (
        <Body d={d} />
      )}
    </PageShell>
  );
}

function Body({ d }: { d: ExitStats }) {
  const max = Math.max(1, ...d.reasons.map((r) => r.visits));
  const lead = d.reasons[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Finished visits" value={formatInt(d.total)} />
        <Tile label="Most common ending" value={lead ? reasonLabel(lead.reason) : "—"} hint={lead ? pct(lead.visits, d.total) : undefined} />
        <Tile label="Median time on exit page" value={seconds(d.median_exit_dwell_s)} hint="Needs in-page signals" />
        <Tile label="Uncertain exit page" value={formatInt(d.ambiguous)} hint="Last page may have been prerendered" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="How visits end" bodyClassName="p-2 sm:p-3">
          <ul>
            {d.reasons.map((r) => (
              <li key={r.reason} className="flex items-center gap-2">
                <div className="min-w-0 flex-1"><ShareBar share={r.visits / max}>{reasonLabel(r.reason)}</ShareBar></div>
                <span className="w-16 text-right text-[13px] text-an-muted">{pct(r.visits, d.total)}</span>
                <span className="w-14 text-right text-[13px] text-an-ink">{formatInt(r.visits)}</span>
                <InfoTip label={`About ${reasonLabel(r.reason)}`} align="right">{EXIT_REASONS[r.reason]?.help ?? ""}</InfoTip>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Landing pages people leave quickly" subtitle="Single-page visits that ended fast or on an error (min. 3 visits)" bodyClassName="p-2 sm:p-3">
          {d.failing_pages.length === 0 ? <p className="py-6 text-center text-sm text-an-muted">Nothing stands out.</p> : (
            <table className="w-full text-[13px]">
              <thead><tr className="text-[11px] tracking-wide text-an-subtle uppercase"><th className="px-2 text-left font-medium">Page</th><th className="w-16 text-right font-medium">Visits</th><th className="w-16 text-right font-medium">Bad</th></tr></thead>
              <tbody>
                {d.failing_pages.map((p) => (
                  <tr key={p.path}>
                    <td className="max-w-0 truncate px-2 py-0.5"><Link className="an-focus text-an-ink underline-offset-2 hover:underline" to={`${BASE_PATH}/page?path=${encodeURIComponent(p.path)}`}>{p.path}</Link></td>
                    <td className="text-right">{formatInt(p.visits)}</td>
                    <td className="text-right">{pct(p.bad, p.visits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Segment title="By channel" rows={d.by_channel} />
        <Segment title="By device" rows={d.by_device} />
      </div>
      <Panel title="Where they went" subtitle="Last outbound click or tracked link before leaving" bodyClassName="p-2 sm:p-3">
        {d.destinations.length === 0 ? <p className="py-6 text-center text-sm text-an-muted">No outbound exits yet.</p> : (
          <table className="w-full text-[13px]">
            <tbody>
              {d.destinations.map((x) => (
                <tr key={x.dest + x.reason}><td className="max-w-0 truncate px-2 py-0.5">{x.dest}</td><td className="w-44 text-an-muted">{reasonLabel(x.reason)}</td><td className="w-14 text-right">{formatInt(x.visits)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

/** Per-segment table: total visits and the share that ended in each notable way. */
function Segment({ title, rows }: { title: string; rows: ExitSegmentRow[] }) {
  const data = useMemo(() => {
    const m = new Map<string, { total: number; by: Record<string, number> }>();
    for (const r of rows) {
      const e = m.get(r.value || "(unknown)") ?? { total: 0, by: {} };
      e.total += r.visits;
      e.by[r.reason] = (e.by[r.reason] ?? 0) + r.visits;
      m.set(r.value || "(unknown)", e);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  }, [rows]);
  return (
    <Panel title={title} bodyClassName="p-2 sm:p-3">
      <table className="w-full text-[13px]">
        <thead><tr className="text-[11px] tracking-wide text-an-subtle uppercase"><th className="px-2 text-left font-medium">Segment</th><th className="w-16 text-right font-medium">Visits</th><th className="w-20 text-right font-medium">Quick</th><th className="w-20 text-right font-medium">Browsed</th></tr></thead>
        <tbody>
          {data.map(([name, e]) => (
            <tr key={name}><td className="px-2 py-0.5">{name}</td><td className="text-right">{formatInt(e.total)}</td><td className="text-right">{pct(e.by.quick_exit ?? 0, e.total)}</td><td className="text-right">{pct(e.by.browsed_and_left ?? 0, e.total)}</td></tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
