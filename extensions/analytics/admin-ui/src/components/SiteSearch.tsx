import { api, errorMessage } from "../api/client";
import type { SearchStats } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { formatInt } from "../lib/format";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link } from "../shared";
import { InfoTip } from "./InfoTip";
import { ErrorNote, Panel, Skeleton } from "./Panel";

const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "—");

/** What visitors searched for on the site, and whether they found it. */
export function SiteSearch({ vm, limit = 12 }: { vm: ViewModel; limit?: number }) {
  const q = new URLSearchParams();
  q.set("from", vm.range.from);
  q.set("to", vm.range.to);
  const res = useAsync((s) => api.search(q, s), `search|${q}`);
  const d: SearchStats | null = res.data ?? null;
  const pageLink = (p: string) => withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(p)}`, vm.searchParams);
  const t = d?.totals;
  return (
    <Panel
      id="search"
      title="Site search"
      subtitle={
        t && t.searches > 0
          ? `${formatInt(t.searches)} searches · ${pct(t.search_visits, t.visits)} of visits searched · ${pct(t.exits, t.searches)} left right after`
          : "What people looked for with your site’s search box"
      }
      actions={
        <InfoTip label="About site search" align="right">
          Read from the search page’s address (?q=, ?s=, ?search=…). Anything that looks like an email address or a phone number is never stored. “Left” means the visit ended on the results; “searched again” means the next page was another search — both hint they didn’t find it.
        </InfoTip>
      }
      bodyClassName="px-2 py-2"
    >
      {res.error && !d ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !d ? (
        <Skeleton className="h-40" />
      ) : d.terms.length === 0 ? (
        <p className="py-8 text-center text-sm text-an-muted">No site searches in this period. If your site has a search box, its terms show up here.</p>
      ) : (
        <table className="an-table">
          <caption className="an-sr-only">Search terms</caption>
          <thead>
            <tr>
              <th scope="col">Searched for</th>
              <th scope="col" className="an-r" style={{ width: 72 }}>Searches</th>
              <th scope="col" className="an-r an-col-wide" style={{ width: 76 }} title="Visit ended on the results page">Left</th>
              <th scope="col" className="an-r an-col-wide" style={{ width: 96 }} title="Next page was another search">Searched again</th>
              <th scope="col" className="an-col-wide" style={{ width: "32%" }}>Then usually opened</th>
            </tr>
          </thead>
          <tbody>
            {d.terms.slice(0, limit).map((r) => {
              const lost = r.exits + r.refined;
              return (
                <tr key={r.term}>
                  <td><span className="an-trunc block font-medium" title={r.term}>{r.term}</span></td>
                  <td className="an-r">{formatInt(r.searches)}</td>
                  <td className="an-r an-col-wide">{r.exits > 0 ? pct(r.exits, r.searches) : <span className="an-dim">—</span>}</td>
                  <td className="an-r an-col-wide">{r.refined > 0 ? pct(r.refined, r.searches) : <span className="an-dim">—</span>}</td>
                  <td className="an-col-wide">
                    {r.top_next ? (
                      <Link className="an-rowlink an-focus an-trunc block" to={pageLink(r.top_next)}>{r.top_next}</Link>
                    ) : (
                      <span className="an-pill" data-tone={lost >= r.searches ? "warn" : undefined}>{lost >= r.searches ? "Didn’t find it" : "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
