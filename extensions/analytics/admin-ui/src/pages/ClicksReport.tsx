import { useMemo, useState } from "react";
import { api, errorMessage } from "../api/client";
import type { ClicksResponse } from "../api/types";
import { InsightList } from "../components/Highlights";
import { NeedsSignalsNotice } from "../components/Notice";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Segmented } from "../components/Segmented";
import { Tile } from "../components/Tile";
import { useAsync } from "../hooks/useAsync";
import type { ViewModel } from "../hooks/useViewState";
import { blockName, pct } from "../lib/behaviour";
import { DEST_KIND, clickFindings, groupLinks, prettyDest } from "../lib/clicks";
import { formatInt } from "../lib/format";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link } from "../shared";

const LINK_ROWS = 12;

type Scope = "content" | "nav" | "all";
type Grouping = "together" | "pages";

/** "What gets clicked": which links people use, in which section, and which they ignore. */
export function ClicksReport({ vm, enhanced }: { vm: ViewModel; enhanced: boolean }) {
  const q = new URLSearchParams(vm.query);
  q.delete("compare");
  const res = useAsync((s) => api.clicks(q, s), `clicks|${q}`);
  const d = res.data;
  if (res.error && !d) return <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />;
  if (!d) return <div className="an-stack"><div className="an-kpis">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-72" /></div>;
  const empty = d.totals.sections_seen + d.totals.clicks === 0;
  if (empty && !enhanced) return <NeedsSignalsNotice what="Which sections people see and which links they click" />;
  if (empty) {
    return (
      <Panel>
        <p className="py-10 text-center text-sm text-an-muted">
          Nothing recorded in this period yet. Section views and clicks appear within a minute of people browsing your site.
        </p>
      </Panel>
    );
  }
  return <Body d={d} vm={vm} enhanced={enhanced} />;
}

function Body({ d, vm, enhanced }: { d: ClicksResponse; vm: ViewModel; enhanced: boolean }) {
  const pageLink = (p: string) => withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(p)}`, vm.searchParams);
  const findings = useMemo(() => clickFindings(d, pageLink), [d]);
  const t = d.totals;
  return (
    <div className="an-stack">
      {!enhanced && <NeedsSignalsNotice what="New section views and clicks" />}
      <div className="an-kpis">
        <Tile
          label="Views with a click"
          value={pct(t.clicking_views, t.views)}
          hint={`${formatInt(t.clicking_views)} of ${formatInt(t.views)} measured page views`}
          info="Page views where the person clicked at least one link. Measured page views are the ones that sent in-page signals, so bots don’t count."
        />
        <Tile
          label="Link clicks"
          value={formatInt(t.clicks)}
          hint={t.clicks > 0 ? `${pct(t.nav_clicks, t.clicks)} on the menu, header or footer` : undefined}
          info="Some browsers (Firefox, and some ad blockers) don’t report link clicks, so the real number is a bit higher."
        />
        <Tile label="To get in touch" value={formatInt(t.contact_clicks)} hint="WhatsApp, email, phone and chat links" />
        <Tile label="To other sites" value={formatInt(t.outbound_clicks)} hint="Partners, maps, social and other sites" />
      </div>
      {findings.length > 0 && (
        <Panel title="What stands out" bodyClassName="p-0">
          <InsightList items={findings} cols={2} />
        </Panel>
      )}
      <LinksPanel d={d} pageLink={pageLink} />
      <div className="an-grid-2">
        <SectionsPanel d={d} pageLink={pageLink} />
        <IgnoredPanel d={d} pageLink={pageLink} />
      </div>
      <Panel title="Where clicks to other sites go" subtitle="Contact links and other sites" bodyClassName="px-2 py-2">
        {d.destinations.length === 0 ? (
          <p className="py-6 text-center text-sm text-an-muted">No clicks to other sites in this period.</p>
        ) : (
          <table className="an-table">
            <thead><tr><th scope="col">Destination</th><th scope="col" className="an-col-wide" style={{ width: "32%" }}>Most clicked from</th><th scope="col" className="an-r" style={{ width: 64 }}>Clicks</th><th scope="col" className="an-r" style={{ width: 64 }} title="Page views that clicked it">Views</th></tr></thead>
            <tbody>
              {d.destinations.map((x) => (
                <tr key={x.dest + x.class}>
                  <td>
                    <span className="an-trunc block" title={x.dest}>{prettyDest(x.dest)}</span>
                    <span className="block text-xs text-an-muted">{DEST_KIND[x.class]}</span>
                  </td>
                  <td className="an-col-wide an-dim"><Link className="an-rowlink an-focus an-trunc block" to={pageLink(x.top_page)} title={x.top_page}>{x.top_page}</Link></td>
                  <td className="an-r">{formatInt(x.clicks)}</td>
                  <td className="an-r">{formatInt(x.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function LinksPanel({ d, pageLink }: { d: ClicksResponse; pageLink: (p: string) => string }) {
  const [scope, setScope] = useState<Scope>("content");
  const [grouping, setGrouping] = useState<Grouping>("together");
  const [all, setAll] = useState(false);
  const rows = useMemo(() => {
    const picked = d.links.filter((l) => scope === "all" || (scope === "nav") === l.nav);
    return groupLinks(picked, grouping === "together");
  }, [d.links, scope, grouping]);
  const shown = all ? rows : rows.slice(0, LINK_ROWS);
  return (
    <Panel
      title="Most clicked links"
      subtitle={scope === "content" ? "Links inside your page content, by the text people see" : scope === "nav" ? "Menu, header and footer links" : "Every tracked link"}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<Scope>
            label="Which links"
            size="xs"
            value={scope}
            onChange={(v) => { setScope(v); setAll(false); }}
            options={[{ value: "content", label: "Page content" }, { value: "nav", label: "Menu & footer" }, { value: "all", label: "All" }]}
          />
          <Segmented<Grouping>
            label="Group links"
            size="xs"
            value={grouping}
            onChange={(v) => { setGrouping(v); setAll(false); }}
            options={[{ value: "together", label: "All pages" }, { value: "pages", label: "Per page" }]}
          />
        </div>
      }
      bodyClassName="px-2 py-2"
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-an-muted">No clicks on these links in this period.</p>
      ) : (
        <table className="an-table">
          <caption className="an-sr-only">Links ranked by clicks</caption>
          <thead>
            <tr>
              <th scope="col">Link</th>
              <th scope="col" className="an-col-wide" style={{ width: "30%" }}>Goes to</th>
              <th scope="col" className="an-r" style={{ width: 64 }}>Clicks</th>
              <th scope="col" className="an-r" style={{ width: 64 }} title="Page views that clicked it at least once">Views</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.key}>
                <td>
                  <span className="an-trunc block font-medium" title={r.text}>{r.text}</span>
                  <span className="an-trunc block text-xs text-an-muted">
                    {r.path ? (
                      <>
                        {r.block_key && <>{blockName(r.block_key, r.section)} · </>}
                        <Link className="an-rowlink an-focus" to={pageLink(r.path)} title={`Open the report for ${r.path}`}>{r.path}</Link>
                      </>
                    ) : (
                      <>{r.nav ? "Menu & footer" : "Content"} · on {formatInt(r.pages)} pages</>
                    )}
                  </span>
                </td>
                <td className="an-col-wide an-dim">
                  <span className="an-trunc block" title={r.dest}>{prettyDest(r.dest)}</span>
                  {DEST_KIND[r.class] && <span className="block text-xs text-an-subtle">{DEST_KIND[r.class]}</span>}
                </td>
                <td className="an-r">{formatInt(r.clicks)}</td>
                <td className="an-r">{formatInt(r.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length > LINK_ROWS && (
        <div className="an-showall">
          <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" aria-expanded={all} onClick={() => setAll((v) => !v)}>
            {all ? "Show fewer" : `Show all ${formatInt(rows.length)}`}
          </button>
        </div>
      )}
    </Panel>
  );
}

/** One page's sections in page order: how far people get and where they click. */
function SectionsPanel({ d, pageLink }: { d: ClicksResponse; pageLink: (p: string) => string }) {
  const paths = useMemo(() => {
    const has = new Set(d.sections.filter((s) => s.seen > 0).map((s) => s.path));
    const ordered = d.pages.map((p) => p.path).filter((p) => has.has(p));
    for (const p of has) if (!ordered.includes(p)) ordered.push(p);
    return ordered;
  }, [d]);
  const [path, setPath] = useState(paths[0] ?? "");
  const current = paths.includes(path) ? path : paths[0] ?? "";
  const rows = d.sections.filter((s) => s.path === current && s.seen > 0).sort((a, b) => a.pos - b.pos || a.block_key.localeCompare(b.block_key));
  const max = Math.max(1, ...rows.map((r) => r.seen));
  return (
    <Panel
      title="Sections, top to bottom"
      subtitle="How many views reached each section, and how many clicked in it"
      actions={
        paths.length > 1 ? (
          <select aria-label="Page" className="an-btn an-focus max-w-[220px] truncate" data-variant="ghost" data-size="sm" value={current} onChange={(e) => setPath(e.target.value)}>
            {paths.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        ) : undefined
      }
      bodyClassName="px-3 py-2"
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-an-muted">No sections measured yet.</p>
      ) : (
        <>
          <ul className="an-rank">
            {rows.map((s) => (
              <li key={s.block_key}>
                <span className="an-rank-name"><span className="an-trunc" title={s.block_key}>{blockName(s.block_key, s.label)}</span></span>
                <span className="an-rank-val">{formatInt(s.seen)}<small>{s.clicked > 0 ? `${pct(s.clicked, s.seen)} click` : "no clicks"}</small></span>
                <span className="an-rank-bar" data-tone={s.clicked > 0 ? "good" : undefined} aria-hidden="true"><span style={{ width: `${(s.seen / max) * 100}%` }} /></span>
                <span className="an-rank-help">
                  {s.clicked > 0 ? `${formatInt(s.clicked)} ${s.clicked === 1 ? "view" : "views"} clicked (${formatInt(s.clicks)} clicks)` : "Seen, not clicked"}
                  {s.links > 0 ? ` · ${formatInt(s.links)} ${s.links === 1 ? "link" : "links"}` : " · no links"}
                </span>
              </li>
            ))}
          </ul>
          <p className="an-panel-note">
            The bar shows views that reached the section; it shrinks as people stop scrolling.{" "}
            <Link className="an-rowlink an-focus underline" to={pageLink(current)}>Full report for {current}</Link>
          </p>
        </>
      )}
    </Panel>
  );
}

function IgnoredPanel({ d, pageLink }: { d: ClicksResponse; pageLink: (p: string) => string }) {
  return (
    <Panel title="Seen but never clicked" subtitle="Links in your content whose section people saw 5+ times, with no clicks" bodyClassName="px-2 py-2">
      {d.ignored.length === 0 ? (
        <p className="py-6 text-center text-sm text-an-muted">Every link in a well-seen section got clicked at least once.</p>
      ) : (
        <table className="an-table">
          <caption className="an-sr-only">Links nobody clicked</caption>
          <thead><tr><th scope="col">Link</th><th scope="col" className="an-r" style={{ width: 72 }} title="Views where its section was on screen">Seen</th></tr></thead>
          <tbody>
            {d.ignored.map((g) => (
              <tr key={g.path + g.block_key + g.dest}>
                <td>
                  <span className="an-trunc block font-medium" title={`${g.text || g.dest} → ${g.dest}`}>{g.text || prettyDest(g.dest)}</span>
                  <span className="an-trunc block text-xs text-an-muted">
                    {blockName(g.block_key, g.section)} · <Link className="an-rowlink an-focus" to={pageLink(g.path)}>{g.path}</Link> → {prettyDest(g.dest)}
                  </span>
                </td>
                <td className="an-r">{formatInt(g.seen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
