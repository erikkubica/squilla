import { CheckCircle2, RefreshCw, XCircle } from "@squilla/icons";
import { errorMessage } from "../../api/client";
import type { StatusResponse } from "../../api/types";
import { ErrorNote, Panel, Skeleton } from "../../components/Panel";
import { formatInt, relativeTime } from "../../lib/format";

function when(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.toLocaleString()} (${relativeTime(iso)})`;
}

export function StatusPanel({ status, error, onRefresh, loading }: { status: StatusResponse | null; error: unknown; onRefresh: () => void; loading: boolean }) {
  return (
    <Panel
      title="Status"
      actions={
        <button type="button" onClick={onRefresh} aria-label="Refresh status" className="an-focus inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-an-muted hover:bg-an-hover hover:text-an-ink">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      }
    >
      {error && !status ? (
        <ErrorNote message={errorMessage(error)} onRetry={onRefresh} />
      ) : !status ? (
        <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-24" /></div>
      ) : (
        <>
          <div className={`flex items-center gap-2 text-sm font-medium ${status.receiving ? "text-an-up" : "text-an-down"}`}>
            {status.receiving ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
            {status.receiving ? "Receiving requests" : "Not receiving requests"}
          </div>
          {!status.receiving && (
            <p className="mt-1 text-xs leading-relaxed text-an-muted">
              The collector has not seen a recent public request. Check that the extension is active and that requests reach the server (not only the CDN).
            </p>
          )}
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs">
            <dt className="text-an-muted">Last request</dt><dd className="text-an-ink">{when(status.last_record_at)}</dd>
            <dt className="text-an-muted">Requests today</dt><dd className="an-num text-an-ink">{formatInt(status.records_today)}</dd>
            <dt className="text-an-muted">Pageviews today</dt><dd className="an-num text-an-ink">{formatInt(status.pageviews_today)}</dd>
            <dt className="text-an-muted">Bot hits today</dt><dd className="an-num text-an-ink">{formatInt(status.bots_today)}</dd>
            <dt className="text-an-muted">Dropped (overload)</dt><dd className="an-num text-an-ink">{formatInt(status.dropped_total)}{status.dropped_total > 0 ? " — buffer was full" : ""}</dd>
            <dt className="text-an-muted">Salt rotates</dt><dd className="text-an-ink">{when(status.salt_rotates_at)}</dd>
            <dt className="text-an-muted">Enhanced mode</dt><dd className="text-an-ink">{status.enhanced_mode ? "On" : "Off"}</dd>
            <dt className="text-an-muted">GeoIP database</dt><dd className="text-an-ink">{status.geoip ? "Loaded" : "Not configured"}</dd>
          </dl>
        </>
      )}
    </Panel>
  );
}
