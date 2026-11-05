import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../api/client";
import type { PageInsightsResponse } from "../api/types";
import { FilterBar } from "../components/FilterBar";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Tile } from "../components/Tile";
import { ShareBar } from "../charts/ShareBar";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { blockName, pct, reasonLabel, seconds } from "../lib/behaviour";
import { formatInt } from "../lib/format";

export default function AnalyticsPageInsights() {
  const vm = useViewState();
  const [sp, setSp] = useSearchParams();
  const path = sp.get("path") ?? "";
  const [draft, setDraft] = useState(path);
  const res = useAsync((s) => (path ? api.pageInsights(path, vm.query, s) : Promise.resolve(null)), `page|${path}|${vm.queryKey}`);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(sp);
    next.set("path", draft.startsWith("/") ? draft : `/${draft}`);
    setSp(next);
  };
  const d = res.data;
  return (
    <PageShell active="page" title={path ? `Page: ${path}` : "Page insights"}>
      <FilterBar vm={vm} showCompare={false} />
      <form onSubmit={submit} className="mb-4 flex gap-2">
        <input aria-label="Page path" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="/en/experiences/hanoi-food-tour" className="an-focus w-full max-w-md rounded-md border border-an-line bg-an-surface px-2 py-1 text-sm" />
        <button className="an-focus rounded-md border border-an-line px-3 py-1 text-sm" type="submit">Show</button>
      </form>
      {!path ? (
        <Panel><p className="py-8 text-center text-sm text-an-muted">Enter a page path, or open one from Why they leave or Clicks &amp; CTAs.</p></Panel>
      ) : res.error && !d ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !d ? (
        <Skeleton className="h-72" />
      ) : (
        <Body d={d} />
      )}
    </PageShell>
  );
}

function Body({ d }: { d: PageInsightsResponse }) {
  const seenMax = Math.max(1, d.activated_views, ...d.blocks.map((b) => b.seen));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Views" value={formatInt(d.views)} hint={`${formatInt(d.entrances)} entrances`} />
        <Tile label="Exit rate" value={pct(d.exits, d.views)} hint={`${formatInt(d.quick_exits)} quick exits`} />
        <Tile label="Median view time" value={seconds(d.median_view_s)} hint="Gap to the next page" />
        <Tile label="Conversions" value={formatInt(d.conversions)} hint="Visits that included this page" />
      </div>
      <Panel title="Section funnel" subtitle={`${formatInt(d.activated_views)} views with in-page signals`} bodyClassName="p-2 sm:p-3">
        {d.blocks.length === 0 ? <p className="py-6 text-center text-sm text-an-muted">No section data. Turn on in-page signals in Settings.</p> : (
          <ul>
            {d.blocks.map((b) => (
              <li key={b.block_key} className="flex items-center gap-2">
                <div className="min-w-0 flex-1"><ShareBar share={b.seen / seenMax}>{blockName(b.block_key, b.label)}</ShareBar></div>
                <span className="w-20 text-right text-[13px]">{pct(b.seen, d.activated_views)}</span>
                <span className="w-24 text-right text-[13px] text-an-muted">{formatInt(b.clicks)} clicks</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Links on this page" subtitle="Links nobody clicked are listed last" bodyClassName="p-2 sm:p-3">
        <table className="w-full table-fixed text-[13px]"><tbody>
          {d.links.map((l) => (
            <tr key={l.block_key + l.href}>
              <td className="w-40 truncate px-2 py-0.5 text-an-muted">{blockName(l.block_key)}</td>
              <td className="truncate">{l.label || l.href}</td>
              <td className="hidden w-48 truncate text-an-muted sm:table-cell">{l.href}</td>
              <td className={`w-14 text-right ${l.clicks === 0 ? "text-an-subtle" : ""}`}>{formatInt(l.clicks)}</td>
            </tr>
          ))}
        </tbody></table>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="How long they stay" bodyClassName="p-2 sm:p-3">
          {d.stay.length === 0 ? <p className="py-4 text-center text-sm text-an-muted">No dwell marks yet.</p> : d.stay.map((s) => (
            <ShareBar key={s.sec} share={s.views / Math.max(1, d.activated_views)}>{seconds(s.sec)} · {pct(s.views, d.activated_views)}</ShareBar>
          ))}
        </Panel>
        <Panel title="Came from" bodyClassName="p-2 sm:p-3">{d.came_from.map((x) => <div key={x.path} className="flex justify-between px-2 text-[13px]"><span className="truncate">{x.path}</span><span>{formatInt(x.n)}</span></div>)}</Panel>
        <Panel title="Went to" bodyClassName="p-2 sm:p-3">{d.went_to.map((x) => <div key={x.path} className="flex justify-between px-2 text-[13px]"><span className="truncate">{x.path}</span><span>{formatInt(x.n)}</span></div>)}</Panel>
      </div>
      {d.exit_reasons.length > 0 && (
        <Panel title="Why they left from here" bodyClassName="p-2 sm:p-3">
          {d.exit_reasons.map((r) => <div key={r.reason} className="flex justify-between px-2 text-[13px]"><span>{reasonLabel(r.reason)}</span><span>{formatInt(r.n)}</span></div>)}
        </Panel>
      )}
    </div>
  );
}
