import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "@squilla/icons";
import { api, errorMessage } from "../api/client";
import type { RealtimeResponse } from "../api/types";
import { MiniBars } from "../charts/MiniBars";
import { useAsync } from "../hooks/useAsync";
import { usePolling } from "../hooks/usePolling";
import { flagEmoji, formatInt, humanize, relativeTime } from "../lib/format";
import { ErrorNote, Panel, Skeleton } from "./Panel";

const REFRESH_MS = 15_000;

function minuteLabel(t: string): string {
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function DeviceIcon({ device }: { device: string }) {
  const Icon = device === "mobile" ? Smartphone : device === "tablet" ? Tablet : Monitor;
  return <Icon className="size-3.5 shrink-0 text-an-subtle" aria-label={humanize(device || "desktop")} />;
}

export function RealtimeCard() {
  const rt = useAsync<RealtimeResponse>((s) => api.realtime(s), "realtime");
  const [, setNow] = useState(0);
  const visible = usePolling(() => {
    rt.reload(true);
    setNow(Date.now());
  }, REFRESH_MS);
  const d = rt.data;

  return (
    <Panel
      id="an-realtime"
      title="Realtime"
      actions={
        <span className="inline-flex items-center gap-1.5 text-xs text-an-muted" aria-live="polite">
          <span aria-hidden="true" className={`inline-block size-2 rounded-full ${visible ? "bg-an-up" : "bg-an-subtle"}`} style={visible ? { animation: "an-pulse 2s ease-in-out infinite" } : undefined} />
          {visible ? "Live · every 15s" : "Paused"}
        </span>
      }
    >
      {rt.error && !d ? (
        <ErrorNote message={errorMessage(rt.error)} onRetry={() => rt.reload()} />
      ) : !d ? (
        <div className="space-y-3"><Skeleton className="h-10 w-32" /><Skeleton className="h-14" /><Skeleton className="h-24" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <div className="text-3xl leading-none font-semibold tracking-tight text-an-ink">{formatInt(d.visitors_5m)}</div>
              <div className="mt-1 text-xs text-an-muted">visitors in the last 5 min</div>
            </div>
            <dl className="flex gap-5 text-xs">
              <div><dt className="text-an-muted">Visitors · 30 min</dt><dd className="an-num mt-0.5 text-sm font-medium text-an-ink">{formatInt(d.visitors_30m)}</dd></div>
              <div><dt className="text-an-muted">Pageviews · 30 min</dt><dd className="an-num mt-0.5 text-sm font-medium text-an-ink">{formatInt(d.pageviews_30m)}</dd></div>
            </dl>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-an-subtle">Pageviews per minute, last 30 minutes</div>
            <MiniBars
              bars={d.per_minute.map((p) => ({ label: minuteLabel(p.t), value: p.pageviews }))}
              ariaLabel={`Pageviews per minute over the last 30 minutes, ${formatInt(d.pageviews_30m)} in total`}
            />
          </div>
          <div>
            <h3 className="mb-1.5 text-xs font-medium text-an-muted">Recent activity</h3>
            {d.recent.length === 0 ? (
              <p className="py-3 text-xs text-an-muted">Nothing in the last 30 minutes.</p>
            ) : (
              <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                {d.recent.map((r, i) => (
                  <li key={`${r.ts}-${i}`} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-an-hover/60">
                    <DeviceIcon device={r.device} />
                    <span className="w-5 shrink-0 text-center" aria-label={r.country || "Unknown country"} title={r.country}>{flagEmoji(r.country) || "·"}</span>
                    <span className="min-w-0 flex-1 truncate text-an-ink" title={r.path}>
                      {r.kind && r.kind !== "pageview" && <span className="mr-1 rounded bg-an-surface-2 px-1 py-px text-[10px] text-an-muted uppercase">{humanize(r.kind)}</span>}
                      {r.path}
                    </span>
                    <span className="hidden max-w-24 truncate text-an-muted sm:inline" title={r.source}>{r.source || "Direct"}</span>
                    <span className="an-num w-14 shrink-0 text-right text-an-subtle">{relativeTime(r.ts)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {d.top_pages.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-an-muted">Active pages</h3>
              <ul className="space-y-0.5 text-xs">
                {d.top_pages.slice(0, 5).map((p) => (
                  <li key={p.value} className="flex justify-between gap-3 px-1">
                    <span className="truncate text-an-ink" title={p.value}>{p.value}</span>
                    <span className="an-num text-an-muted">{formatInt(p.visitors)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
