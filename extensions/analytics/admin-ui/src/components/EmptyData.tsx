import { BarChart3 } from "@squilla/icons";
import type { StatusResponse } from "../api/types";
import { relativeTime } from "../lib/format";
import { BASE_PATH, Link } from "../shared";

/** First-run state: nothing has been recorded yet. */
export function EmptyData({ status }: { status: StatusResponse | null }) {
  return (
    <div className="an-card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-an-surface-2">
        <BarChart3 className="size-6 text-an-muted" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-an-ink">No visits recorded yet</h2>
      <p className="mt-1.5 max-w-md text-sm text-an-muted">
        Analytics measures page requests on the server — there is no script to install. Visit a public page of your site in a
        private window (logged-in admins are excluded by default) and check back in a few seconds.
      </p>
      {status && (
        <p className="mt-3 text-xs text-an-muted">
          Collector: <strong className="text-an-ink">{status.receiving ? "receiving requests" : "not receiving requests"}</strong>
          {status.last_record_at ? ` · last request ${relativeTime(status.last_record_at)}` : ""}
        </p>
      )}
      <Link
        to={`${BASE_PATH}/settings`}
        className="an-focus mt-5 inline-flex h-8 items-center rounded-md bg-[var(--accent,#1f1f22)] px-3 text-[13px] font-medium text-[var(--accent-fg,#fff)]"
      >
        Open settings & status
      </Link>
    </div>
  );
}
