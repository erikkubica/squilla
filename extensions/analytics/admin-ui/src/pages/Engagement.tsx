import { useMemo } from "react";
import { api, errorMessage } from "../api/client";
import type { ExitSegmentRow, ExitStats, StatusResponse } from "../api/types";
import { InfoTip } from "../components/InfoTip";
import { NavButton, Notice } from "../components/Notice";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Tile } from "../components/Tile";
import { useAsync } from "../hooks/useAsync";
import { useViewState, type ViewModel } from "../hooks/useViewState";
import { EXIT_REASONS, EXIT_TONE, pct, reasonLabel, seconds } from "../lib/behaviour";
import { valueLabel } from "../lib/dims";
import { formatInt } from "../lib/format";
import { withCarry } from "../lib/params";
import { BASE_PATH, Link, useSearchParams } from "../shared";
import { ClicksReport } from "./ClicksReport";

type Tab = "endings" | "clicks";

const TABS: { key: Tab; title: string; desc: string }[] = [
  { key: "endings", title: "How visits end", desc: "Did people get in touch, read and leave, or give up?" },
  { key: "clicks", title: "What gets clicked", desc: "Which links people use, and which they ignore" },
];

/** What people do on the site. `/exits` and `/clicks` open a tab directly. */
export function EngagementPage({ initial = "endings" }: { initial?: Tab }) {
  const vm = useViewState();
  const [sp, setSp] = useSearchParams();
  const tab: Tab = sp.get("view") === "clicks" ? "clicks" : sp.get("view") === "endings" ? "endings" : initial;
  const status = useAsync<StatusResponse | null>((s) => api.status(s).catch(() => null), "status");
  const enhanced = status.data ? status.data.enhanced_mode : true;

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(sp);
    if (t === initial) next.delete("view");
    else next.set("view", t);
    setSp(next, { replace: true });
  };

  return (
    <PageShell active="engagement" vm={vm}>
      <div className="an-stack">
        <div className="an-tabs" role="tablist" aria-label="Engagement reports">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" id={`an-tab-${t.key}`} aria-selected={tab === t.key} aria-controls="an-tabpanel" className="an-tab an-focus" onClick={() => setTab(t.key)}>
              <span className="an-tab-title">{t.title}</span>
              <span className="an-tab-desc">{t.desc}</span>
            </button>
          ))}
        </div>
        <div id="an-tabpanel" role="tabpanel" aria-labelledby={`an-tab-${tab}`}>
          {tab === "endings" ? <Endings vm={vm} enhanced={enhanced} /> : <ClicksReport vm={vm} enhanced={enhanced} />}
        </div>
      </div>
    </PageShell>
  );
}

export default function AnalyticsEngagement() {
  return <EngagementPage />;
}

function useQuery(vm: ViewModel): URLSearchParams {
  const q = new URLSearchParams(vm.query);
  q.delete("compare");
  return q;
}

/* ───────────────────────────── How visits end ───────────────────────────── */

function Endings({ vm, enhanced }: { vm: ViewModel; enhanced: boolean }) {
  const q = useQuery(vm);
  const res = useAsync((s) => api.exits(q, s), `exits|${q}`);
  const d = res.data;
  if (res.error && !d) return <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />;
  if (!d) return <div className="an-stack"><div className="an-kpis">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-72" /></div>;
  if (d.total === 0) {
    return (
      <Panel>
        <p className="py-10 text-center text-sm text-an-muted">
          No finished visits in this period yet. A visit counts as finished about 30 minutes after the person’s last page.
        </p>
      </Panel>
    );
  }
  return <EndingsBody d={d} enhanced={enhanced} vm={vm} />;
}

function EndingsBody({ d, enhanced, vm }: { d: ExitStats; enhanced: boolean; vm: ViewModel }) {
  const max = Math.max(1, ...d.reasons.map((r) => r.visits));
  const lead = d.reasons[0];
  const by = (reason: string) => d.reasons.find((r) => r.reason === reason)?.visits ?? 0;
  const contacted = by("left_to_contact") + by("converted");
  return (
    <div className="an-stack">
      {!enhanced && (
        <Notice
          title="Tell quick exits apart from people who read the whole page"
          actions={<NavButton to="/settings#in-page" size="sm" variant="primary">Turn on in-page measurement</NavButton>}
        >
          Right now one-page visits can’t be timed, so many show up as “One page (time unknown)”.
        </Notice>
      )}
      <div className="an-kpis">
        <Tile label="Finished visits" value={formatInt(d.total)} hint="Visits that ended in this period" />
        <Tile label="Most common ending" text value={lead ? reasonLabel(lead.reason) : "—"} hint={lead ? `${pct(lead.visits, d.total)} of visits` : undefined} />
        <Tile
          label="Got in touch or converted"
          value={pct(contacted, d.total)}
          hint={`${formatInt(contacted)} visits`}
          info="Visits that reached a goal, or whose last action was opening WhatsApp, Zalo, Messenger, a phone number or an email link."
        />
        <Tile
          label="Time on the last page"
          value={enhanced ? seconds(d.median_exit_dwell_s) : "—"}
          hint={enhanced ? "Typical, before leaving" : "Needs in-page measurement"}
          info="How long people typically stayed on the page where their visit ended."
        />
      </div>

      <div className="an-grid-2">
        <Panel title="How visits end" subtitle="Each finished visit gets one ending, from the last thing the person did. A good guess, not a fact." bodyClassName="px-3 py-2">
          <ul className="an-rank">
            {d.reasons.map((r) => (
              <li key={r.reason}>
                <span className="an-rank-name">{reasonLabel(r.reason)}</span>
                <span className="an-rank-val">{formatInt(r.visits)}<small>{pct(r.visits, d.total)}</small></span>
                <span className="an-rank-bar" data-tone={EXIT_TONE[r.reason]} aria-hidden="true"><span style={{ width: `${(r.visits / max) * 100}%` }} /></span>
                {EXIT_REASONS[r.reason] && <span className="an-rank-help">{EXIT_REASONS[r.reason].help}</span>}
              </li>
            ))}
          </ul>
          {d.ambiguous > 0 && (
            <p className="an-panel-note">
              For {formatInt(d.ambiguous)} visits the last page is uncertain: the browser loaded it in advance and may never have shown it.
            </p>
          )}
        </Panel>
        <div className="an-stack">
          <Panel title="Pages people leave quickly" subtitle="Landing pages where one-page visits often ended fast or on an error (3+ visits)" bodyClassName="px-2 py-2">
            {d.failing_pages.length === 0 ? (
              <p className="py-6 text-center text-sm text-an-muted">Nothing stands out. Good sign.</p>
            ) : (
              <table className="an-table">
                <caption className="an-sr-only">Landing pages with many quick exits</caption>
                <thead><tr><th scope="col">Page</th><th scope="col" className="an-r" style={{ width: 64 }}>Visits</th><th scope="col" className="an-r" style={{ width: 92 }}>Left quickly</th></tr></thead>
                <tbody>
                  {d.failing_pages.map((p) => (
                    <tr key={p.path}>
                      <td><Link className="an-rowlink an-focus an-trunc block" to={withCarry(`${BASE_PATH}/page?path=${encodeURIComponent(p.path)}`, vm.searchParams)} title={`Open the report for ${p.path}`}>{p.path}</Link></td>
                      <td className="an-r">{formatInt(p.visits)}</td>
                      <td className="an-r">{pct(p.bad, p.visits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel title="Where people went when they left" subtitle="The last link they followed to another site" bodyClassName="px-2 py-2">
            {d.destinations.length === 0 ? (
              <p className="py-6 text-center text-sm text-an-muted">Nobody left through a link in this period.</p>
            ) : (
              <table className="an-table">
                <thead><tr><th scope="col">Destination</th><th scope="col" className="an-col-wide" style={{ width: "38%" }}>Ending</th><th scope="col" className="an-r" style={{ width: 64 }}>Visits</th></tr></thead>
                <tbody>
                  {d.destinations.map((x) => (
                    <tr key={x.dest + x.reason}>
                      <td><span className="an-trunc block" title={x.dest}>{x.dest}</span></td>
                      <td className="an-col-wide an-dim"><span className="an-trunc block">{reasonLabel(x.reason)}</span></td>
                      <td className="an-r">{formatInt(x.visits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>

      <div className="an-grid-2">
        <Segment title="By how people found you" dim="channel" rows={d.by_channel} />
        <Segment title="By device" dim="device" rows={d.by_device} />
      </div>
    </div>
  );
}

/** Visits per group, and how many left quickly or browsed further. */
function Segment({ title, dim, rows }: { title: string; dim: "channel" | "device"; rows: ExitSegmentRow[] }) {
  const data = useMemo(() => {
    const m = new Map<string, { total: number; by: Record<string, number> }>();
    for (const r of rows) {
      const e = m.get(r.value) ?? { total: 0, by: {} };
      e.total += r.visits;
      e.by[r.reason] = (e.by[r.reason] ?? 0) + r.visits;
      m.set(r.value, e);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  }, [rows]);
  return (
    <Panel
      title={title}
      actions={<InfoTip label="About these columns" align="right">“Left quickly” is one page, gone in under 10 seconds. “Browsed more” means two or more pages, then left without reaching a goal.</InfoTip>}
      bodyClassName="px-2 py-2"
    >
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-an-muted">No finished visits.</p>
      ) : (
        <table className="an-table">
          <caption className="an-sr-only">{title}</caption>
          <thead><tr><th scope="col">{dim === "channel" ? "Channel" : "Device"}</th><th scope="col" className="an-r" style={{ width: 64 }}>Visits</th><th scope="col" className="an-r" style={{ width: 92 }}>Left quickly</th><th scope="col" className="an-r an-col-wide" style={{ width: 104 }}>Browsed more</th></tr></thead>
          <tbody>
            {data.map(([value, e]) => (
              <tr key={value || "none"}>
                <td><span className="an-trunc block">{valueLabel(dim, value)}</span></td>
                <td className="an-r">{formatInt(e.total)}</td>
                <td className="an-r">{pct(e.by.quick_exit ?? 0, e.total)}</td>
                <td className="an-r an-col-wide">{pct(e.by.browsed_and_left ?? 0, e.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
