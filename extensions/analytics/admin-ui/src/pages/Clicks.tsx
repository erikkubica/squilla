import { api, errorMessage } from "../api/client";
import { FilterBar } from "../components/FilterBar";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Tile } from "../components/Tile";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { blockName, pct } from "../lib/behaviour";
import { formatInt } from "../lib/format";
import { BASE_PATH, Link } from "../shared";

export default function AnalyticsClicks() {
  const vm = useViewState();
  const res = useAsync((s) => api.clicks(vm.query, s), `clicks|${vm.queryKey}`);
  const d = res.data;
  return (
    <PageShell active="clicks" title="Clicks & CTAs">
      <FilterBar vm={vm} showCompare={false} />
      <p className="mb-4 max-w-3xl text-sm text-an-muted">
        Impressions are sections scrolled into view; clicks are link clicks inside them. Click-through = clicks ÷ impressions.
        Both come from in-page signals (no JavaScript), so turn them on under Settings.
      </p>
      {res.error && !d ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !d ? (
        <Skeleton className="h-72" />
      ) : d.totals.sections_seen + d.totals.clicks === 0 ? (
        <Panel><p className="py-10 text-center text-sm text-an-muted">No in-page signals recorded in this range.</p></Panel>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Tile label="Section impressions" value={formatInt(d.totals.sections_seen)} />
            <Tile label="Link clicks" value={formatInt(d.totals.clicks)} hint={pct(d.totals.clicks, d.totals.sections_seen) + " of impressions"} />
            <Tile label="Outbound clicks" value={formatInt(d.totals.outbound_clicks)} hint="WhatsApp, mail, partners" />
          </div>
          <Panel title="Sections ranked by clicks" bodyClassName="p-2 sm:p-3">
            <table className="w-full table-fixed text-[13px]">
              <thead><tr className="text-[11px] tracking-wide text-an-subtle uppercase"><th className="px-2 text-left font-medium">Section</th><th className="hidden w-40 text-left font-medium sm:table-cell">Page</th><th className="w-20 text-right font-medium">Seen</th><th className="w-20 text-right font-medium">Clicks</th><th className="w-16 text-right font-medium">CTR</th></tr></thead>
              <tbody>
                {d.blocks.map((b) => (
                  <tr key={b.path + b.block_key}>
                    <td className="truncate px-2 py-0.5">{blockName(b.block_key, b.label)}</td>
                    <td className="hidden truncate sm:table-cell"><Link className="an-focus text-an-muted hover:underline" to={`${BASE_PATH}/page?path=${encodeURIComponent(b.path)}`}>{b.path}</Link></td>
                    <td className="text-right">{formatInt(b.seen)}</td>
                    <td className="text-right">{formatInt(b.clicks)}</td>
                    <td className="text-right">{b.ctr == null ? "—" : `${(b.ctr * 100).toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Where outbound clicks go" bodyClassName="p-2 sm:p-3">
            {d.destinations.length === 0 ? <p className="py-6 text-center text-sm text-an-muted">No outbound clicks.</p> : (
              <table className="w-full text-[13px]"><tbody>
                {d.destinations.map((x) => (
                  <tr key={x.dest + x.class}><td className="max-w-0 truncate px-2 py-0.5">{x.dest}</td><td className="w-40 truncate text-an-muted">{x.top_page}</td><td className="w-14 text-right">{formatInt(x.clicks)}</td></tr>
                ))}
              </tbody></table>
            )}
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
