import { useState } from "react";
import { CircleAlert, CircleCheck, Loader2, RefreshCw, RotateCcw, Sparkles, Zap } from "@squilla/icons";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SectionHeader,
} from "@squilla/ui";
import { humanFileSize } from "../library/helpers";
import type { BulkProgress, JobKind, JobStart, OptimizerStats } from "./api";

export interface Job extends BulkProgress {
  kind: JobKind;
}

interface OverviewCardProps {
  stats: OptimizerStats;
  job: Job | null;
  /** Unsaved encoding changes; they're saved before a job starts. */
  dirty: boolean;
  normalizeEnabled: boolean;
  /** Starts a bulk job; resolves false when it couldn't start. */
  onStart: (job: JobStart) => Promise<boolean>;
}

function share(n: number): string {
  if (n > 0 && n < 0.1) return "<0.1%";
  return `${n < 10 ? n.toFixed(1) : Math.round(n)}%`;
}

/** Library status: how much is optimized, what it saved, and the bulk jobs. */
export default function OverviewCard({ stats, job, dirty, normalizeEnabled, onStart }: OverviewCardProps) {
  const [confirm, setConfirm] = useState<"reoptimize-all" | "restore-all" | null>(null);
  const [starting, setStarting] = useState<JobStart | null>(null);
  const busy = Boolean(job?.running) || starting !== null;
  const pending = stats.unoptimized_count;
  const savedShare = stats.total_original_size > 0 ? (stats.total_savings / stats.total_original_size) * 100 : 0;

  const start = async (kind: JobStart) => {
    setStarting(kind);
    const started = await onStart(kind);
    setStarting(null);
    if (started) setConfirm(null);
  };

  const closeDialog = (open: boolean) => {
    if (!open && starting === null) setConfirm(null);
  };

  return (
    <Card>
      <SectionHeader
        title="Library"
        icon={<Sparkles className="h-4 w-4" />}
        actions={
          <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
            {pending > 0 && (
              <Button size="sm" onClick={() => start("optimize-pending")} disabled={busy}>
                {starting === "optimize-pending" ? <Loader2 className="animate-spin" /> : <Zap />}
                Optimize {pending} pending
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setConfirm("reoptimize-all")} disabled={busy}>
              <RefreshCw />
              Re-optimize all
            </Button>
            {stats.with_backup > 0 && (
              <Button size="sm" variant="outline" onClick={() => setConfirm("restore-all")} disabled={busy}>
                <RotateCcw />
                Restore originals
              </Button>
            )}
          </div>
        }
      />

      <div data-mm="stats">
        <div data-mm="stat">
          <span data-mm="stat-label">Optimized</span>
          <span data-mm="stat-value">
            {stats.optimized_count}
            <small> of {stats.total_images}</small>
          </span>
          {pending > 0 ? (
            <span data-mm="stat-note" data-tone="warning">
              <CircleAlert aria-hidden="true" />
              {pending} waiting
            </span>
          ) : (
            <span data-mm="stat-note" data-tone="success">
              <CircleCheck aria-hidden="true" />
              All images done
            </span>
          )}
        </div>
        <div data-mm="stat">
          <span data-mm="stat-label">Space saved</span>
          <span data-mm="stat-value">{humanFileSize(stats.total_savings)}</span>
          <span data-mm="stat-note">
            {savedShare > 0
              ? `${share(savedShare)} of ${humanFileSize(stats.total_original_size)}`
              : "Nothing saved yet"}
          </span>
        </div>
        <div data-mm="stat">
          <span data-mm="stat-label">Originals kept</span>
          <span data-mm="stat-value">{stats.with_backup}</span>
          <span data-mm="stat-note">Backups you can restore</span>
        </div>
      </div>

      {job?.running && <JobProgress job={job} />}

      <Dialog open={confirm === "reoptimize-all"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-optimize all images?</DialogTitle>
            <DialogDescription>
              All {stats.total_images} images are processed again from their originals with the current upload
              settings. The originals stay backed up, so you can restore them later. Large libraries take a while.
            </DialogDescription>
          </DialogHeader>
          {(dirty || !normalizeEnabled) && (
            <div data-mm="notice">
              {dirty && <p>Your unsaved changes to Upload &amp; encoding are saved first.</p>}
              {!normalizeEnabled && <p>“Optimize new uploads” is off, so the files stay as they are.</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={starting !== null}>
              Cancel
            </Button>
            <Button onClick={() => start("reoptimize-all")} disabled={starting !== null}>
              {starting === "reoptimize-all" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {dirty ? "Save and re-optimize" : "Re-optimize all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm === "restore-all"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore all originals?</DialogTitle>
            <DialogDescription>
              {stats.with_backup} images go back to the files as they were uploaded. The backups are kept, so you can
              optimize them again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={starting !== null}>
              Cancel
            </Button>
            <Button onClick={() => start("restore-all")} disabled={starting !== null}>
              {starting === "restore-all" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Restore originals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function JobProgress({ job }: { job: Job }) {
  const done = job.processed + job.failed;
  const pct = job.total > 0 ? Math.min(100, (done / job.total) * 100) : 0;
  const label = job.kind === "restore" ? "Restoring originals" : "Optimizing images";
  const aside = [
    job.total_saved > 0 ? `${humanFileSize(job.total_saved)} saved so far` : "",
    job.failed > 0 ? `${job.failed} failed` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div data-mm="job" role="status">
      <div data-mm="job-head">
        <Loader2 className="animate-spin" aria-hidden="true" />
        <span data-mm="job-title">{label}</span>
        <span data-mm="job-count">
          {done} of {job.total}
        </span>
        {aside && (
          <span data-mm="job-aside" data-tone={job.failed > 0 ? "warning" : undefined}>
            {aside}
          </span>
        )}
      </div>
      <div
        data-mm="meter"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={job.total}
        aria-valuenow={done}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
