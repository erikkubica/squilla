import { useState } from "react";
import { ExternalLink } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { PageInsightsResponse, StatusResponse } from "../api/types";
import { InfoTip } from "../components/InfoTip";
import { NeedsSignalsNotice } from "../components/Notice";
import { PagePicker } from "../components/PagePicker";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Tile } from "../components/Tile";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { EXIT_REASONS, EXIT_TONE, blockName, pct, reasonLabel, seconds } from "../lib/behaviour";
import { formatInt } from "../lib/format";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link, useSearchParams } from "../shared";

/** Report for a single page: traffic, scroll depth, clicks and endings. */
export default function AnalyticsPageInsights() {
  const vm = useViewState();
  const sp = vm.searchParams;
  const path = sp.get("path") ?? "";
  const q = new URLSearchParams(vm.query);
  q.delete("compare");
  const res = useAsync((s) => (path ? api.pageInsights(path, q, s) : Promise.resolve(null)), `page|${path}|${q}`);
  const status = useAsync<StatusResponse | null>((s) => api.status(s).catch(() => null), "status");
  const d = res.data;
  const back = withCarry(`${BASE_PATH}/pages`, sp);

  return (
    <PageShell
      active="pages"
      title={path ? <span className="break-all">{path}</span> : "Look at one page"}
      intro={path ? "How this page did in the selected period." : "Pick a page to see how it performs."}
      back={{ to: back, label: "Back to Pages" }}
      vm={vm}
      actions={
        path ? (
          <a href={path} target="_blank" rel="noopener noreferrer" className="an-btn an-focus" data-variant="outline" title="Open this page on your site">
            <ExternalLink aria-hidden="true" />
            <span className="an-btn-label">Open on your site</span>
          </a>
        ) : undefined
      }
    >
      <div className="an-stack">
        <PagePicker key={path} vm={vm} current={path} compact={!!path} />
        {!path ? null : res.error && !d ? (
          <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
        ) : !d ? (
          <div className="an-stack"><div className="an-kpis">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div>
        ) : d.views === 0 ? (
          <Panel><p className="py-10 text-center text-sm text-an-muted">Nobody opened this page in the selected period. Check the address, or choose a longer period.</p></Panel>
        ) : (
          <Body d={d} enhanced={status.data?.enhanced_mode ?? true} />
        )}
      </div>
    </PageShell>
  );
}

/** Backend markers for "no page before / after this one". */
const NAV_MARKERS: Record<string, string> = {
  "(entry / external)": "Started here or came from another site",
  "(exit)": "Left your site",
};

function PathLink({ path }: { path: string }) {
  const [sp] = useSearchParams();
  if (NAV_MARKERS[path]) return <span className="an-trunc block italic text-an-muted">{NAV_MARKERS[path]}</span>;
  if (!path.startsWith("/")) return <span className="an-trunc block" title={path}>{path || "Unknown"}</span>;
  return (
    <Link to={withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(path)}`, sp)} className="an-rowlink an-focus an-trunc block" title={`Open the report for ${path}`}>
      {path}
    </Link>
  );
}

const LINK_ROWS = 10;

function Body({ d, enhanced }: { d: PageInsightsResponse; enhanced: boolean }) {
  // Views that sent in-page signals. A repeat view of the same page by the
  // same visitor isn't marked as activated, so never divide by less than the
  // most-seen section (keeps shares at or below 100%).
  const measured = Math.max(d.activated_views, ...d.blocks.map((b) => b.seen), ...d.stay.map((s) => s.views));
  const noSignals = measured === 0;
  const exitTotal = d.exit_reasons.reduce((a, r) => a + r.n, 0);
  const exitMax = Math.max(1, ...d.exit_reasons.map((r) => r.n));
  const links = [...d.links].sort((a, b) => b.clicks - a.clicks);
  const [allLinks, setAllLinks] = useState(false);
  const unclicked = links.filter((l) => l.clicks === 0).length;
  const shownLinks = allLinks ? links : links.slice(0, LINK_ROWS);
  return (
    <div className="an-stack">
      <div className="an-kpis">
        <Tile label="Views" value={formatInt(d.views)} hint={`${formatInt(d.entrances)} visits started here`} />
        <Tile
          label="Left from here"
          value={pct(d.exits, d.views)}
          hint={`${formatInt(d.exits)} visits ended on this page`}
          info="The share of views after which the person left your site. High is normal for contact or thank-you pages, and worth a look for pages meant to lead somewhere."
        />
        <Tile label="Typical time on page" value={seconds(d.median_view_s)} hint="Until they opened another page" info="The middle value for views followed by another page. The last page of a visit is timed only with in-page measurement." />
        <Tile label="Conversions" value={formatInt(d.conversions)} hint="Visits that saw this page and reached a goal" />
      </div>

      {noSignals && !enhanced && <NeedsSignalsNotice what="How far people scroll, how long they stay and what they click on this page" />}

      <div className="an-grid-2">
        <Panel title="How far people get" subtitle={noSignals ? "Sections of the page seen by visitors" : `Share of ${formatInt(measured)} measured views that reached each section`} bodyClassName="px-3 py-2">
          {d.blocks.length === 0 ? (
            <p className="py-6 text-center text-sm text-an-muted">{enhanced ? "No section data for this page yet." : "Turn on in-page measurement to see this."}</p>
          ) : (
            <ul className="an-rank">
              {d.blocks.map((b) => (
                <li key={b.block_key}>
                  <span className="an-rank-name"><span className="an-trunc">{blockName(b.block_key, b.label)}</span></span>
                  <span className="an-rank-val">{pct(b.seen, measured)}{b.clicks > 0 && <small>{formatInt(b.clicks)} clicks</small>}</span>
                  <span className="an-rank-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (b.seen / Math.max(1, measured)) * 100)}%` }} /></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="an-stack">
          <Panel title="How long people stay" subtitle="Share of measured views that stayed at least this long" bodyClassName="px-3 py-2">
            {d.stay.length === 0 ? (
              <p className="py-6 text-center text-sm text-an-muted">{enhanced ? "No time marks for this page yet." : "Turn on in-page measurement to see this."}</p>
            ) : (
              <ul className="an-rank">
                {d.stay.map((s) => (
                  <li key={s.sec}>
                    <span className="an-rank-name">{seconds(s.sec)} or longer</span>
                    <span className="an-rank-val">{pct(s.views, measured)}</span>
                    <span className="an-rank-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (s.views / Math.max(1, measured)) * 100)}%` }} /></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {d.exit_reasons.length > 0 && (
            <Panel title="How visits ended on this page" subtitle={`${formatInt(exitTotal)} visits ended here`} bodyClassName="px-3 py-2">
              <ul className="an-rank">
                {d.exit_reasons.map((r) => (
                  <li key={r.reason}>
                    <span className="an-rank-name">
                      {reasonLabel(r.reason)}
                      {EXIT_REASONS[r.reason] && <InfoTip label={`About ${reasonLabel(r.reason)}`}>{EXIT_REASONS[r.reason].help}</InfoTip>}
                    </span>
                    <span className="an-rank-val">{formatInt(r.n)}<small>{pct(r.n, exitTotal)}</small></span>
                    <span className="an-rank-bar" data-tone={EXIT_TONE[r.reason]} aria-hidden="true"><span style={{ width: `${(r.n / exitMax) * 100}%` }} /></span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <Panel
        title="Links on this page"
        subtitle={unclicked > 0 ? `Most clicked first. ${formatInt(unclicked)} of ${formatInt(links.length)} links were never clicked.` : "Most clicked first."}
        bodyClassName="px-2 py-2"
      >
        {links.length === 0 ? (
          <p className="py-6 text-center text-sm text-an-muted">{enhanced ? "No links recorded on this page yet." : "Turn on in-page measurement to see this."}</p>
        ) : (
          <table className="an-table">
            <caption className="an-sr-only">Links on this page and how often they were clicked</caption>
            <thead><tr><th scope="col">Link</th><th scope="col" className="an-col-wide" style={{ width: "30%" }}>Section</th><th scope="col" className="an-r" style={{ width: 72 }}>Clicks</th></tr></thead>
            <tbody>
              {shownLinks.map((l) => (
                <tr key={l.block_key + l.href}>
                  <td>
                    <span className="an-trunc block font-medium" title={l.label || l.href}>{l.label || l.href}</span>
                    <span className="an-trunc block text-xs text-an-muted" title={l.href}>{l.href}</span>
                  </td>
                  <td className="an-col-wide an-dim"><span className="an-trunc block">{blockName(l.block_key)}</span></td>
                  <td className="an-r">{l.clicks === 0 ? <span className="whitespace-nowrap text-xs text-an-subtle">None</span> : formatInt(l.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {links.length > LINK_ROWS && (
          <div className="an-showall">
            <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" aria-expanded={allLinks} onClick={() => setAllLinks((v) => !v)}>
              {allLinks ? "Show fewer" : `Show all ${formatInt(links.length)} links`}
            </button>
          </div>
        )}
      </Panel>

      <div className="an-grid-2">
        <Panel title="Where they came from" subtitle="The page or site they saw just before" bodyClassName="px-2 py-2">
          <NavList rows={d.came_from} empty="Every visit to this page started here." />
        </Panel>
        <Panel title="Where they went next" bodyClassName="px-2 py-2">
          <NavList rows={d.went_to} empty="Nobody went on to another page from here." />
        </Panel>
      </div>

    </div>
  );
}

function NavList({ rows, empty }: { rows: { path: string; n: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-an-muted">{empty}</p>;
  return (
    <table className="an-table">
      <thead><tr><th scope="col">Page</th><th scope="col" className="an-r" style={{ width: 72 }}>Visits</th></tr></thead>
      <tbody>
        {rows.map((x) => (
          <tr key={x.path}>
            <td><PathLink path={x.path} /></td>
            <td className="an-r">{formatInt(x.n)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
