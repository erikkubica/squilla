import { useState } from "react";
import { CircleAlert, CircleCheck, RefreshCw } from "@squilla/icons";
import { errorMessage } from "../../api/client";
import type { StatusResponse } from "../../api/types";
import { ErrorNote, Skeleton } from "../../components/Panel";
import { formatInt, relativeTime } from "../../lib/format";

function when(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.toLocaleString()} (${relativeTime(iso)})`;
}

/** One line that answers "is it working?", with the technical facts on demand. */
export function StatusBanner({ status, error, onRefresh, loading }: { status: StatusResponse | null; error: unknown; onRefresh: () => void; loading: boolean }) {
  const [details, setDetails] = useState(false);
  if (error && !status) return <ErrorNote message={errorMessage(error)} onRetry={onRefresh} />;
  if (!status) return <Skeleton className="h-16" />;
  const ok = status.receiving;
  return (
    <section className="an-card an-status" data-state={ok ? "ok" : "off"} aria-live="polite">
      <span className="an-status-dot" aria-hidden="true">{ok ? <CircleCheck /> : <CircleAlert />}</span>
      <div className="min-w-0 flex-1" style={{ flexBasis: 240 }}>
        <div className="an-status-title">{ok ? "Analytics is recording visits" : "No visits are coming in right now"}</div>
        <div className="an-status-desc">
          {ok
            ? `Last page view ${relativeTime(status.last_record_at)} · ${formatInt(status.pageviews_today)} page views and ${formatInt(status.bots_today)} bot requests today`
            : status.last_record_at
              ? `The last page view was ${relativeTime(status.last_record_at)}. If your site had visitors since, see “Why is a visit missing?” below.`
              : "Nothing recorded yet. Open your website in a private window (your own logged-in visits are skipped) and refresh this page."}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className="an-btn an-focus" data-variant="ghost" data-size="sm" aria-expanded={details} onClick={() => setDetails((v) => !v)}>
          {details ? "Hide details" : "Technical details"}
        </button>
        <button type="button" onClick={onRefresh} aria-label="Check again" title="Check again" className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>
      {details && (
        <dl className="an-facts w-full border-t border-an-line pt-3">
          <dt>Last request</dt><dd>{when(status.last_record_at)}</dd>
          <dt>Requests today</dt><dd>{formatInt(status.records_today)}</dd>
          <dt>Page views today</dt><dd>{formatInt(status.pageviews_today)}</dd>
          <dt>Bot requests today</dt><dd>{formatInt(status.bots_today)}</dd>
          <dt>Dropped under load</dt><dd>{formatInt(status.dropped_total)}{status.dropped_total > 0 ? " (the buffer was full)" : ""}</dd>
          <dt>Daily code changes</dt><dd>{when(status.salt_rotates_at)}</dd>
          <dt>In-page measurement</dt><dd>{status.enhanced_mode ? "On" : "Off"}</dd>
          <dt>Page views in memory</dt><dd>{formatInt(status.views_indexed ?? 0)}</dd>
          <dt>Signals dropped</dt><dd>{formatInt(status.signals_lost ?? 0)}</dd>
          <dt>Country database</dt><dd>{status.geoip ? "Loaded" : "Not set (uses the CDN’s country header when present)"}</dd>
        </dl>
      )}
    </section>
  );
}
