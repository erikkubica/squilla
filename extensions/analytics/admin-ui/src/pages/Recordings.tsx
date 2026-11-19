import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { Device, HotspotsResponse, RecInsights, RecordingList, RecordingRow, RecSignal } from "../api/types";
import { InsightList } from "../components/Highlights";
import { InfoTip } from "../components/InfoTip";
import { Tile } from "../components/Tile";
import { channelInfo } from "../lib/channels";
import { METRIC_INFO, RATING_LABEL, fmtMetric, frustrationFindings, rate, type Metric } from "../lib/vitals";
import { NavButton, Notice } from "../components/Notice";
import { PageFrame, frameDoc } from "../components/PageFrame";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Segmented } from "../components/Segmented";
import { useAsync } from "../hooks/useAsync";
import { useViewState, type ViewModel } from "../hooks/useViewState";
import { reasonLabel } from "../lib/behaviour";
import { countryName, formatInt } from "../lib/format";
import { drawBands, drawDensity } from "../lib/heat";
import { withCarry } from "../lib/params";
import { clock, prettyHref, shortSelector } from "../lib/replay";
import { BASE_PATH, Link, toast, useSearchParams } from "../shared";

type Tab = "list" | "heatmaps" | "insights";
const PAGE_SIZE = 50;

/** Session recordings and the heatmaps built from them. */
export default function AnalyticsRecordings() {
  const vm = useViewState();
  const [sp, setSp] = useSearchParams();
  const view = sp.get("view");
  const tab: Tab = view === "heatmaps" || view === "insights" ? view : "list";
  const settings = useAsync((s) => api.settings(s).catch(() => null), "settings");
  const off = settings.data ? !settings.data.recordings : false;
  const setTab = (t: Tab) => {
    const next = new URLSearchParams(sp);
    if (t === "list") next.delete("view");
    else next.set("view", t);
    setSp(next, { replace: true });
  };
  return (
    <PageShell active="recordings" vm={vm}>
      <div className="an-stack">
        {off && (
          <Notice
            tone="warn"
            title="Session recording is off"
            actions={<NavButton to="/settings#recordings" size="sm" variant="primary">Turn on recordings</NavButton>}
          >
            New visits aren’t recorded. Recordings made before it was turned off stay until their retention ends.
          </Notice>
        )}
        <div className="an-tabs" role="tablist" aria-label="Recording reports">
          {([
            { key: "list", title: "Recordings", desc: "Watch single visits play back" },
            { key: "heatmaps", title: "Heatmaps", desc: "Clicks, scrolling and attention on one page" },
            { key: "insights", title: "Frustration & speed", desc: "Rage clicks, errors and Core Web Vitals" },
          ] as const).map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className="an-tab an-focus" onClick={() => setTab(t.key)}>
              <span className="an-tab-title">{t.title}</span>
              <span className="an-tab-desc">{t.desc}</span>
            </button>
          ))}
        </div>
        {tab === "list" ? <List vm={vm} /> : tab === "heatmaps" ? <Heatmaps vm={vm} /> : <Insights vm={vm} />}
      </div>
    </PageShell>
  );
}

function baseQuery(vm: ViewModel): URLSearchParams {
  const q = new URLSearchParams();
  q.set("from", vm.range.from);
  q.set("to", vm.range.to);
  return q;
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* ───────────────────────────── list ───────────────────────────── */

type MinLen = "0" | "10" | "30" | "60";
type DeviceFilter = "" | Device;

const SIGNALS: { value: "" | RecSignal; label: string }[] = [
  { value: "", label: "Any visit" },
  { value: "rage", label: "Rage clicks" },
  { value: "dead", label: "Dead clicks" },
  { value: "error", label: "JavaScript errors" },
  { value: "slow", label: "Slow page" },
];

function List({ vm }: { vm: ViewModel }) {
  const [sp, setSp] = useSearchParams();
  const signal = (SIGNALS.find((x) => x.value === sp.get("signal"))?.value ?? "") as "" | RecSignal;
  const setSignal = (v: string) => {
    const next = new URLSearchParams(sp);
    if (v) next.set("signal", v);
    else next.delete("signal");
    setSp(next, { replace: true });
  };
  const [channel, setChannel] = useState("");
  const [country, setCountry] = useState("");
  const [entry, setEntry] = useState(false);
  const [converted, setConverted] = useState(false);
  const [path, setPath] = useState(sp.get("path") ?? "");
  const [device, setDevice] = useState<DeviceFilter>("");
  const [minS, setMinS] = useState<MinLen>(signal ? "0" : "10");
  const [clicked, setClicked] = useState(false);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const q = baseQuery(vm);
  if (path) q.set("path", path);
  if (device) q.set("device", device);
  if (minS !== "0") q.set("min_s", minS);
  if (clicked) q.set("clicked", "1");
  if (signal) q.set("signal", signal);
  if (channel) q.set("channel", channel);
  if (country) q.set("country", country);
  if (entry) q.set("entry", "1");
  if (converted) q.set("converted", "1");
  q.set("limit", String(PAGE_SIZE));
  q.set("offset", String(page * PAGE_SIZE));
  const res = useAsync((s) => api.recordings(q, s), `recordings|${q}`);
  const d: RecordingList | null = res.data ?? null;
  useEffect(() => setPage(0), [path, device, minS, clicked, signal, channel, country, entry, converted, vm.range.from, vm.range.to]);

  const remove = async () => {
    if (!picked.size || !window.confirm(`Delete ${picked.size} recording${picked.size === 1 ? "" : "s"}? This can’t be undone.`)) return;
    try {
      await api.deleteRecordings([...picked]);
      setPicked(new Set());
      toast.success("Deleted");
      res.reload(true);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const toggle = (pid: string) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(pid)) n.delete(pid);
    else n.add(pid);
    return n;
  });

  return (
    <Panel
      title={d ? `${formatInt(d.total)} ${d.total === 1 ? "recording" : "recordings"}` : "Recordings"}
      subtitle="Newest first. Open one to watch it."
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select aria-label="Show" className="an-btn an-focus" data-variant={signal ? "outline" : "ghost"} data-size="sm" value={signal} onChange={(e) => setSignal(e.target.value)}>
            {SIGNALS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
          {d && d.channels.length > 1 && (
            <select aria-label="Came from" className="an-btn an-focus" data-variant="ghost" data-size="sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">Any source</option>
              {d.channels.map((c) => <option key={c} value={c}>{channelInfo(c)?.label ?? c}</option>)}
            </select>
          )}
          {d && d.countries.length > 1 && (
            <select aria-label="Country" className="an-btn an-focus max-w-[160px]" data-variant="ghost" data-size="sm" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Any country</option>
              {d.countries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
            </select>
          )}
          {d && d.pages.length > 1 && (
            <select aria-label="Page" className="an-btn an-focus max-w-[200px]" data-variant="ghost" data-size="sm" value={path} onChange={(e) => setPath(e.target.value)}>
              <option value="">All pages</option>
              {d.pages.map((p) => <option key={p.path} value={p.path}>{p.path} ({p.n})</option>)}
            </select>
          )}
          <Segmented<DeviceFilter> label="Device" size="xs" value={device} onChange={setDevice}
            options={[{ value: "", label: "Any device" }, { value: "desktop", label: "Desktop" }, { value: "tablet", label: "Tablet" }, { value: "mobile", label: "Mobile" }]} />
          <Segmented<MinLen> label="Shortest" size="xs" value={minS} onChange={setMinS}
            options={[{ value: "0", label: "Any length" }, { value: "10", label: "10 s+" }, { value: "30", label: "30 s+" }, { value: "60", label: "1 min+" }]} />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-an-muted">
            <input type="checkbox" checked={clicked} onChange={(e) => setClicked(e.target.checked)} /> With clicks
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-an-muted" title="Only the first page of each visit">
            <input type="checkbox" checked={entry} onChange={(e) => setEntry(e.target.checked)} /> Landing pages
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-an-muted" title="Only visits that reached a goal">
            <input type="checkbox" checked={converted} onChange={(e) => setConverted(e.target.checked)} /> Converted
          </label>
          {picked.size > 0 && (
            <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" onClick={() => void remove()}>
              <Trash2 className="size-4" aria-hidden="true" /> Delete {picked.size}
            </button>
          )}
        </div>
      }
      bodyClassName="px-2 py-2"
    >
      {res.error && !d ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !d ? (
        <Skeleton className="h-64" />
      ) : d.rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-an-muted">No recordings match. Try a longer period or fewer filters.</p>
      ) : (
        <>
          <table className="an-table">
            <caption className="an-sr-only">Recordings</caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: 28 }}><span className="an-sr-only">Select</span></th>
                <th scope="col" style={{ width: 120 }}>When</th>
                <th scope="col">Page</th>
                <th scope="col" className="an-r" style={{ width: 64 }}>Length</th>
                <th scope="col" className="an-r" style={{ width: 56 }}>Clicks</th>
                <th scope="col" className="an-r an-col-wide" style={{ width: 72 }} title="How much of the page they saw">Scrolled</th>
                <th scope="col" className="an-col-wide" style={{ width: "24%" }}>Visit</th>
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => <Row key={r.pid} r={r} vm={vm} picked={picked.has(r.pid)} onPick={() => toggle(r.pid)} />)}
            </tbody>
          </table>
          {d.total > PAGE_SIZE && (
            <div className="an-showall flex items-center justify-center gap-2">
              <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</button>
              <span className="text-xs text-an-muted">{page * PAGE_SIZE + 1}–{Math.min(d.total, (page + 1) * PAGE_SIZE)} of {formatInt(d.total)}</span>
              <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" disabled={(page + 1) * PAGE_SIZE >= d.total} onClick={() => setPage((p) => p + 1)}>Older</button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function Row({ r, vm, picked, onPick }: { r: RecordingRow; vm: ViewModel; picked: boolean; onPick: () => void }) {
  const to = withCarry(`${BASE_PATH}/recording?id=${r.pid}`, vm.searchParams);
  const scrolled = r.dh > 0 ? Math.min(100, Math.round((r.max_scroll / r.dh) * 100)) : null;
  return (
    <tr>
      <td><input type="checkbox" aria-label={`Select the recording of ${r.path}`} checked={picked} onChange={onPick} /></td>
      <td className="whitespace-nowrap text-an-muted">{fmtWhen(r.started_at)}</td>
      <td>
        <Link className="an-rowlink an-focus an-trunc block font-medium" to={to} title={`Watch this visit of ${r.path}`}>{r.path}</Link>
        <span className="an-trunc block text-xs text-an-muted">
          {[r.device, r.browser, r.country].filter(Boolean).join(" · ")}
          {r.referrer ? ` · from ${prettyHref(r.referrer)}` : r.channel ? ` · ${channelInfo(r.channel)?.label ?? r.channel}` : ""}
        </span>
        {(r.rage > 0 || r.dead > 0 || r.errors > 0 || rate("lcp", r.lcp) === "poor") && (
          <span className="mt-0.5 flex flex-wrap gap-1">
            {r.rage > 0 && <span className="an-pill" data-tone="bad">Rage click{r.rage > 1 ? ` ×${r.rage}` : ""}</span>}
            {r.dead > 0 && <span className="an-pill" data-tone="warn">Dead click{r.dead > 1 ? ` ×${r.dead}` : ""}</span>}
            {r.errors > 0 && <span className="an-pill" data-tone="bad">JS error{r.errors > 1 ? ` ×${r.errors}` : ""}</span>}
            {rate("lcp", r.lcp) === "poor" && <span className="an-pill" data-tone="warn">Slow ({fmtMetric("lcp", r.lcp)})</span>}
          </span>
        )}
      </td>
      <td className="an-r tabular-nums">{clock(r.duration_ms)}</td>
      <td className="an-r">{r.clicks > 0 ? formatInt(r.clicks) : <span className="an-dim">—</span>}</td>
      <td className="an-r an-col-wide">{scrolled == null ? "—" : `${scrolled}%`}</td>
      <td className="an-col-wide an-dim">
        <span className="an-trunc block">
          {r.visit_pages > 1 ? `${r.visit_pages} pages` : "1 page"}
          {r.converted ? " · converted" : r.exit_reason ? ` · ${reasonLabel(r.exit_reason).toLowerCase()}` : ""}
        </span>
      </td>
    </tr>
  );
}

/* ───────────────────────────── heatmaps ───────────────────────────── */

type Mode = "clicks" | "moves" | "scroll" | "attention";

const MODES: { value: Mode; label: string; help: string }[] = [
  { value: "clicks", label: "Clicks", help: "Where people click, links or not. Red is where most clicks land." },
  { value: "moves", label: "Cursor", help: "Where the mouse spends its time — a rough guide to where people look." },
  { value: "scroll", label: "Scroll reach", help: "How many visitors scroll down to each part of the page." },
  { value: "attention", label: "Attention", help: "How long each part of the page was on screen, added up over all visits." },
];

function Heatmaps({ vm }: { vm: ViewModel }) {
  const [sp, setSp] = useSearchParams();
  const pagesQ = baseQuery(vm);
  pagesQ.set("limit", "1");
  const pages = useAsync((s) => api.recordings(pagesQ, s), `recordings|${pagesQ}`);
  const list = pages.data?.pages ?? [];
  const path = sp.get("page") || list[0]?.path || "";
  const [device, setDevice] = useState<Device | "">("");
  const [mode, setMode] = useState<Mode>("clicks");
  const q = baseQuery(vm);
  if (path) q.set("path", path);
  if (device) q.set("device", device);
  const res = useAsync((s) => (path ? api.hotspots(q, s) : Promise.resolve(null)), `hotspots|${q}`);
  const d = res.data;
  const setPath = (p: string) => {
    const next = new URLSearchParams(sp);
    next.set("page", p);
    setSp(next, { replace: true });
    setDevice("");
  };

  if (pages.data && list.length === 0) {
    return <Panel><p className="py-10 text-center text-sm text-an-muted">No recordings in this period yet, so there is nothing to draw.</p></Panel>;
  }
  return (
    <div className="an-grid-side">
      <Panel
        title="Heatmap"
        subtitle={MODES.find((m) => m.value === mode)?.help}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {list.length > 0 && (
              <select aria-label="Page" className="an-btn an-focus max-w-[220px]" data-variant="ghost" data-size="sm" value={path} onChange={(e) => setPath(e.target.value)}>
                {list.map((p) => <option key={p.path} value={p.path}>{p.path} ({p.n})</option>)}
              </select>
            )}
            {d && d.devices.length > 1 && (
              <Segmented<Device | ""> label="Device" size="xs" value={(device || d.device) as Device | ""} onChange={setDevice}
                options={d.devices.map((x) => ({ value: x.device, label: `${x.device || "unknown"} (${x.n})` }))} />
            )}
            <Segmented<Mode> label="Show" size="xs" value={mode} onChange={setMode} options={MODES.map(({ value, label }) => ({ value, label }))} />
          </div>
        }
        bodyClassName="p-3"
      >
        {res.error && !d ? (
          <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
        ) : !d ? (
          <Skeleton className="h-[520px]" />
        ) : d.views === 0 ? (
          <p className="py-10 text-center text-sm text-an-muted">No recordings of this page on this device.</p>
        ) : (
          <HeatCanvas key={`${d.path}|${d.device}`} d={d} mode={mode} />
        )}
      </Panel>
      <aside className="an-stack min-w-0">
        <ClickedElements d={d ?? null} />
      </aside>
    </div>
  );
}

const RADIUS = { clicks: 22, moves: 28 } as const;

function HeatCanvas({ d, mode }: { d: HotspotsResponse; mode: Mode }) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [y, setY] = useState(0);
  const [docH, setDocH] = useState(d.dh);
  const w = d.w;
  const h = d.h;
  const views = d.views;

  const reachMarks = useMemo(() => {
    // Where the share of visitors still on screen drops below 75/50/25%,
    // and where nobody scrolled further. One line per spot, lowest share wins.
    const at = new Map<number, number>();
    for (const pct of [75, 50, 25, 0]) {
      let i = d.reach.findIndex((n) => (pct === 0 ? n <= 0 : n < (views * pct) / 100));
      if (i < 0 && pct === 0) i = d.reach.length;
      if (i > 0) at.set(i * d.bin, pct);
    }
    return [...at.entries()].map(([y, pct]) => ({ y, pct }));
  }, [d, views]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !ctx) return;
    c.width = w;
    c.height = h;
    const cx = w / 2;
    if (mode === "clicks" || mode === "moves") {
      const r = RADIUS[mode];
      const src = mode === "clicks" ? d.clicks : d.moves;
      const pts: [number, number][] = [];
      for (const p of src) {
        const py = p[1] - y;
        if (py > -r && py < h + r) pts.push([cx + p[0], py]);
      }
      drawDensity(ctx, pts, r);
    } else {
      const vals = mode === "scroll" ? d.reach : d.dwell;
      const first = Math.floor(y / d.bin);
      const rows = Math.ceil(h / d.bin) + 2;
      const slice = vals.slice(first, first + rows);
      ctx.save();
      ctx.translate(0, -(y % d.bin));
      drawBands(ctx, slice, d.bin, rows, mode === "scroll" ? views : Math.max(1, ...vals));
      ctx.restore();
    }
  }, [d, mode, y, w, h, views]);

  const onLoad = () => {
    const doc = frameDoc(frame);
    if (doc) setDocH(Math.max(d.dh, doc.documentElement.scrollHeight));
  };

  return (
    <div className="space-y-2">
      <PageFrame frameRef={frame} path={d.path} width={w} height={h} maxHeight={640} wheel onLoad={onLoad} onScroll={setY}>
        <canvas ref={canvas} />
        {mode === "scroll" && reachMarks.map((m) => m.y - y > 0 && m.y - y < h && (
          <div key={m.pct} className="an-reach-line" style={{ top: m.y - y }}>
            <span>{m.pct === 0 ? "Nobody scrolled past here" : `${m.pct}% of visitors scroll this far`}</span>
          </div>
        ))}
      </PageFrame>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="an-heat-legend"><span>Fewer</span><span aria-hidden="true" /><span>More</span></div>
        <span className="text-xs text-an-muted">
          {formatInt(views)} recorded views · {w}px wide · scroll over the page to move · {Math.round((y / Math.max(1, docH - h)) * 100) || 0}% down
        </span>
      </div>
    </div>
  );
}

function ClickedElements({ d }: { d: HotspotsResponse | null }) {
  const rows = useMemo(() => (d ? [...d.selectors].sort((a, b) => b.clicks - a.clicks).slice(0, 15) : []), [d]);
  const total = rows.reduce((n, r) => n + r.clicks, 0);
  return (
    <Panel title="Most clicked" subtitle="Elements on this page, by clicks" bodyClassName="px-2 py-2">
      {!d ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-an-muted">No clicks recorded on this page.</p>
      ) : (
        <table className="an-table">
          <thead><tr><th scope="col">Element</th><th scope="col" className="an-r" style={{ width: 56 }}>Clicks</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.selector}>
                <td>
                  <span className="an-trunc block font-medium" title={r.selector}>{r.href ? prettyHref(r.href) : shortSelector(r.selector)}</span>
                  <span className="an-trunc block text-xs text-an-muted">{r.href ? shortSelector(r.selector) : "not a link"} · {Math.round(r.y)}px down</span>
                </td>
                <td className="an-r">{formatInt(r.clicks)}<small className="block text-[11px] text-an-subtle">{total ? Math.round((r.clicks / total) * 100) : 0}%</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* ──────────────────────── frustration & speed ──────────────────────── */

const METRICS: Metric[] = ["lcp", "inp", "cls", "ttfb"];

function VitalCell({ m, v }: { m: Metric; v: number | null | undefined }) {
  const r = rate(m, v);
  return (
    <td className="an-r whitespace-nowrap tabular-nums">
      {r ? <span className="an-vital" data-rating={r} title={RATING_LABEL[r]}>{fmtMetric(m, v)}</span> : <span className="an-dim">—</span>}
    </td>
  );
}

function Insights({ vm }: { vm: ViewModel }) {
  const [sp] = useSearchParams();
  const q = baseQuery(vm);
  const res = useAsync((s) => api.recordingInsights(q, s), `rec-insights|${q}`);
  const d: RecInsights | null = res.data ?? null;
  const listLink = (signal: string) => {
    const next = new URLSearchParams(sp);
    next.delete("view");
    next.set("signal", signal);
    return `${BASE_PATH}/recordings?${next}`;
  };
  const heatLink = (path: string) => {
    const next = new URLSearchParams(sp);
    next.set("view", "heatmaps");
    next.set("page", path);
    return `${BASE_PATH}/recordings?${next}`;
  };
  const findings = useMemo(() => (d ? frustrationFindings(d, listLink) : []), [d]); // eslint-disable-line react-hooks/exhaustive-deps
  if (res.error && !d) return <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />;
  if (!d) return <Skeleton className="h-96" />;
  const t = d.totals;
  if (t.recordings === 0) {
    return (
      <Panel bodyClassName="px-4 py-10">
        <p className="text-center text-sm text-an-muted">No recordings in this period yet. Frustration signals and page speed come from recorded visits.</p>
      </Panel>
    );
  }
  const pct = (n: number) => `${Math.round((n / t.recordings) * 100)}%`;
  const sv = d.site_vitals;
  return (
    <div className="an-stack">
      <div className="an-kpis">
        <Tile label="Rage clicks" value={pct(t.rage)} hint={`${formatInt(t.rage)} of ${formatInt(t.recordings)} recorded visits`}
          info="Three or more clicks on the same spot within a second: something didn’t respond the way the visitor expected." />
        <Tile label="Dead clicks" value={pct(t.dead)} hint={`${formatInt(t.dead)} visits`}
          info="A click on something that isn’t a link or button, after which nothing on the page changed for a second." />
        <Tile label="JavaScript errors" value={pct(t.errors)} hint={`${formatInt(t.errors)} visits`}
          info="Script errors in the visitor’s browser. Only the message and file name are kept, never the page content." />
        <Tile label="Main content shows in" value={sv?.lcp != null ? fmtMetric("lcp", sv.lcp) : "—"}
          hint={sv?.lcp != null ? `${RATING_LABEL[rate("lcp", sv.lcp)!]} · 75th percentile` : "No measurements yet"}
          info={METRIC_INFO.lcp.what} />
      </div>
      <Panel title="What stands out" bodyClassName="p-0">
        <InsightList items={findings} cols={2} />
      </Panel>
      <div className="an-grid-2">
        <Panel title="Where people get stuck" subtitle="Elements with rage or dead clicks" bodyClassName="px-2 py-2">
          {d.elements.length === 0 ? (
            <p className="py-8 text-center text-sm text-an-muted">No rage or dead clicks.</p>
          ) : (
            <table className="an-table">
              <caption className="an-sr-only">Elements with rage or dead clicks</caption>
              <thead><tr><th scope="col">Element</th><th scope="col" style={{ width: 90 }}>Kind</th><th scope="col" className="an-r" style={{ width: 56 }}>Times</th></tr></thead>
              <tbody>
                {d.elements.map((e, i) => (
                  <tr key={i}>
                    <td>
                      <span className="an-trunc block font-medium" title={e.selector}>{shortSelector(e.selector)}</span>
                      <Link className="an-rowlink an-focus an-trunc block text-xs" to={heatLink(e.path)}>{e.path} · heatmap</Link>
                    </td>
                    <td><span className="an-pill" data-tone={e.kind === "rage" ? "bad" : "warn"}>{e.kind === "rage" ? "Rage" : "Dead"}</span></td>
                    <td className="an-r">{formatInt(e.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="JavaScript errors" subtitle="Message and file, most frequent first" bodyClassName="px-2 py-2">
          {d.errors.length === 0 ? (
            <p className="py-8 text-center text-sm text-an-muted">No errors recorded.</p>
          ) : (
            <table className="an-table">
              <caption className="an-sr-only">JavaScript errors</caption>
              <thead><tr><th scope="col">Error</th><th scope="col" className="an-r" style={{ width: 56 }}>Times</th></tr></thead>
              <tbody>
                {d.errors.map((e, i) => (
                  <tr key={i}>
                    <td>
                      <span className="an-trunc block font-mono text-[12px]" title={e.message}>{e.message}</span>
                      <span className="an-trunc block text-xs text-an-muted">{[e.file, e.pages > 1 ? `${e.pages} pages` : e.top_page].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td className="an-r">{formatInt(e.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      <Panel
        title="Page speed (Core Web Vitals)"
        subtitle="Measured in real visitors’ browsers, 75th percentile — the number Google uses for search ranking"
        bodyClassName="px-2 py-2"
      >
        <table className="an-table">
          <caption className="an-sr-only">Core Web Vitals per page</caption>
          <thead>
            <tr>
              <th scope="col">Page</th>
              {METRICS.map((m) => (
                <th key={m} scope="col" className="an-r" style={{ width: 120 }}>
                  <span className="inline-flex items-center gap-1">{METRIC_INFO[m].name}<InfoTip label={METRIC_INFO[m].name} align="right">{METRIC_INFO[m].what}</InfoTip></span>
                </th>
              ))}
              <th scope="col" className="an-r an-col-wide" style={{ width: 64 }}>Visits</th>
            </tr>
          </thead>
          <tbody>
            {sv && (
              <tr>
                <td className="font-medium">Whole site</td>
                {METRICS.map((m) => <VitalCell key={m} m={m} v={sv[m as keyof typeof sv] as number | null} />)}
                <td className="an-r an-col-wide">{formatInt(t.recordings)}</td>
              </tr>
            )}
            {d.vitals.map((v) => (
              <tr key={v.path}>
                <td><Link className="an-rowlink an-focus an-trunc block" to={heatLink(v.path)}>{v.path}</Link></td>
                {METRICS.map((m) => <VitalCell key={m} m={m} v={v[m]} />)}
                <td className="an-r an-col-wide">{formatInt(v.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-2 pt-2 text-xs text-an-subtle">
          Green is good, amber needs work, red is poor by Google’s thresholds. Safari and Firefox don’t report every metric, so some pages show fewer numbers.
        </p>
      </Panel>
    </div>
  );
}
