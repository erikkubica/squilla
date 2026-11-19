import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Trash2 } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { Recording } from "../api/types";
import { PageFrame, frameWin } from "../components/PageFrame";
import { PageShell } from "../components/PageShell";
import { ErrorNote, Panel, Skeleton } from "../components/Panel";
import { Segmented } from "../components/Segmented";
import { useAsync } from "../hooks/useAsync";
import { reasonLabel } from "../lib/behaviour";
import { METRIC_INFO, fmtMetric, rate, type Metric } from "../lib/vitals";
import { countryName } from "../lib/format";
import { withCarry } from "../lib/params";
import { at, buildTimeline, clock, lerp, skipIdle, type Timeline } from "../lib/replay";
import { BASE_PATH, Link, toast, useNavigate, useSearchParams } from "../shared";

const SPEEDS = ["1", "2", "4", "8"] as const;
type Speed = (typeof SPEEDS)[number];

/** One recorded page view, played back over the live page. */
export default function AnalyticsRecording() {
  const [sp] = useSearchParams();
  const id = sp.get("id") ?? "";
  const res = useAsync((s) => api.recording(id, s), `recording|${id}`);
  const back = withCarry(`${BASE_PATH}/recordings`, sp);
  return (
    <PageShell
      active="recordings"
      title={res.data ? res.data.meta.path : "Recording"}
      intro={res.data ? `${new Date(res.data.meta.started_at).toLocaleString()} · ${clock(res.data.meta.duration_ms)} on the page` : "Loading…"}
      back={{ to: back, label: "All recordings" }}
    >
      {res.error && !res.data ? (
        <ErrorNote message={errorMessage(res.error)} onRetry={() => res.reload()} />
      ) : !res.data ? (
        <Skeleton className="h-[560px]" />
      ) : (
        <Player key={id} rec={res.data} back={back} />
      )}
    </PageShell>
  );
}

function Player({ rec, back }: { rec: Recording; back: string }) {
  const m = rec.meta;
  const tl: Timeline = useMemo(() => buildTimeline(rec.events, m.vw, m.vh), [rec, m.vw, m.vh]);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("2");
  const [skip, setSkip] = useState(true);
  const [ready, setReady] = useState(false);
  const tRef = useRef(0);
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const vp = tl.viewport[Math.max(0, at(tl.viewport, t))];
  const cursor = lerp(tl.mouse, t);
  const scroll = lerp(tl.scroll, t) ?? [0, 0];

  // Keep the frame's scroll position in step with the recording.
  useEffect(() => {
    if (!ready) return;
    frameWin(frame)?.scrollTo({ left: scroll[0], top: scroll[1], behavior: "instant" as ScrollBehavior });
  }, [ready, scroll[0], scroll[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(100, now - prev) * Number(speed);
      prev = now;
      let next = tRef.current + dt;
      if (skip) next = skipIdle(tl.idle, next);
      if (next >= tl.duration) {
        next = tl.duration;
        setPlaying(false);
      }
      tRef.current = next;
      setT(next);
      if (next < tl.duration) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, skip, tl]);

  const seek = useCallback((v: number) => {
    tRef.current = Math.max(0, Math.min(tl.duration, v));
    setT(tRef.current);
  }, [tl.duration]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable]")) return;
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => (tRef.current >= tl.duration ? (seek(0), true) : !p));
      } else if (e.key === "ArrowRight") seek(tRef.current + 5000);
      else if (e.key === "ArrowLeft") seek(tRef.current - 5000);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seek, tl.duration]);

  const ripples = tl.moments.filter((x) => (x.kind === "click" || x.kind === "rage" || x.kind === "dead") && t >= x.t && t - x.t < 700);
  const current = tl.moments.reduce((acc, x, i) => (x.t <= t ? i : acc), -1);
  const others = rec.visit.filter((v) => v.pid !== m.pid);

  const remove = async () => {
    if (!window.confirm("Delete this recording? This can’t be undone.")) return;
    try {
      await api.deleteRecordings([m.pid]);
      toast.success("Recording deleted");
      navigate(back);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="an-grid-side">
      <div className="an-stack min-w-0">
        <Panel bodyClassName="p-3">
          <PageFrame frameRef={frame} path={m.path} width={vp?.[1] ?? m.vw} height={vp?.[2] ?? m.vh} maxHeight={620} onLoad={() => setReady(true)}>
            {cursor && (
              <svg className="an-cursor" viewBox="0 0 24 24" style={{ transform: `translate(${cursor[0]}px, ${cursor[1]}px)` }} aria-hidden="true">
                <path d="M3 2l7.5 19 2.4-7.6L20.5 11z" fill="#111827" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            )}
            {ripples.map((r) => {
              const k = (t - r.t) / 700;
              return <span key={r.t} className="an-ripple" data-rage={r.kind === "rage" ? "" : undefined} data-dead={r.kind === "dead" ? "" : undefined} style={{ left: r.x, top: r.y, opacity: 1 - k, transform: `scale(${0.6 + k})` }} />;
            })}
          </PageFrame>
          <div className="mt-3 space-y-2">
            <div className="an-track">
              {tl.idle.map(([s, e]) => (
                <span key={s} className="an-track-idle" style={{ left: `${(s / (tl.duration || 1)) * 100}%`, width: `${((e - s) / (tl.duration || 1)) * 100}%` }} />
              ))}
              {tl.moments.filter((x) => ["click", "rage", "dead", "error", "submit", "focus"].includes(x.kind)).map((x, i) => (
                <span key={i} className="an-track-mark" data-kind={x.kind} style={{ left: `${(x.t / (tl.duration || 1)) * 100}%` }} />
              ))}
              <input type="range" min={0} max={tl.duration || 1} step={100} value={t} onChange={(e) => seek(Number(e.target.value))} aria-label="Position in the recording" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="an-btn an-focus"
                data-variant="primary"
                data-size="sm"
                onClick={() => { if (t >= tl.duration) seek(0); setPlaying((p) => !p); }}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                {playing ? "Pause" : t >= tl.duration && t > 0 ? "Replay" : "Play"}
              </button>
              <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" onClick={() => seek(0)} aria-label="Back to the start">
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
              <span className="text-xs tabular-nums text-an-muted">{clock(t)} / {clock(tl.duration)}</span>
              <span className="flex-1" />
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-an-muted">
                <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
                Skip pauses
              </label>
              <Segmented<Speed> label="Speed" size="xs" value={speed} onChange={setSpeed} options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} />
            </div>
            <p className="text-xs text-an-subtle">Space plays and pauses, arrow keys jump 5 seconds. The page is shown as it looks today.</p>
          </div>
        </Panel>
      </div>
      <aside className="an-stack min-w-0">
        <Panel title="What happened" subtitle="Click a moment to jump to it" bodyClassName="p-1.5">
          {tl.moments.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-an-muted">Only scrolling and cursor movement.</p>
          ) : (
            <ul className="an-moments">
              {tl.moments.map((x, i) => (
                <li key={i}>
                  <button type="button" className="an-focus cursor-pointer" data-current={i === current ? "" : undefined} onClick={() => seek(Math.max(0, x.t - 1500))}>
                    <time>{clock(x.t)}</time>
                    <span className="min-w-0">
                      <span className="block font-medium">{x.label}</span>
                      {x.detail && <span className="an-trunc block text-xs text-an-muted" title={x.detail}>{x.detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="About this visit" bodyClassName="px-4 py-3">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-an-muted">Device</dt><dd className="an-trunc">{[m.device, m.browser, m.os].filter(Boolean).join(" · ") || "—"}</dd>
            <dt className="text-an-muted">Screen</dt><dd>{m.vw} × {m.vh}</dd>
            {m.country && <><dt className="text-an-muted">Country</dt><dd>{countryName(m.country)}</dd></>}
            <dt className="text-an-muted">Came from</dt><dd className="an-trunc" title={m.referrer}>{m.referrer || "Direct or unknown"}</dd>
            <dt className="text-an-muted">Scrolled</dt><dd>{m.dh > 0 ? `${Math.min(100, Math.round((m.max_scroll / m.dh) * 100))}% of the page` : "—"}</dd>
            {m.exit_reason && <><dt className="text-an-muted">Visit ended</dt><dd>{reasonLabel(m.exit_reason)}</dd></>}
            {(["lcp", "inp", "cls"] as Metric[]).filter((k) => tl.vitals[k] != null).map((k) => {
              const r = rate(k, tl.vitals[k]);
              return (
                <Fragment key={k}>
                  <dt className="text-an-muted" title={METRIC_INFO[k].what}>{METRIC_INFO[k].name}</dt>
                  <dd><span className="an-vital" data-rating={r ?? undefined}>{fmtMetric(k, tl.vitals[k])}</span></dd>
                </Fragment>
              );
            })}
          </dl>
          {others.length > 0 && (
            <>
              <div className="mt-4 mb-1 text-[11.5px] font-semibold tracking-wide text-an-subtle uppercase">Same visit</div>
              <ol className="space-y-1 text-[13px]">
                {rec.visit.map((v) => (
                  <li key={v.pid} className="flex items-center gap-2">
                    {v.pid === m.pid ? (
                      <span className="an-trunc font-medium text-an-ink">{v.path} <span className="text-an-muted">(this one)</span></span>
                    ) : (
                      <Link className="an-rowlink an-focus an-trunc" to={withCarry(`${BASE_PATH}/recording?id=${v.pid}`, sp)}>{v.path}</Link>
                    )}
                    <span className="ml-auto text-xs tabular-nums text-an-muted">{clock(v.duration_ms)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          <button type="button" className="an-btn an-focus mt-4" data-variant="ghost" data-size="sm" onClick={() => void remove()}>
            <Trash2 className="size-4" aria-hidden="true" /> Delete recording
          </button>
        </Panel>
      </aside>
    </div>
  );
}
