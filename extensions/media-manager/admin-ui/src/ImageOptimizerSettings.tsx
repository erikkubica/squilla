import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "@squilla/icons";
import { toast } from "sonner";
import { humanFileSize } from "./library/helpers";
import * as api from "./optimizer/api";
import type { BulkProgress, JobKind, JobStart, OptimizerSettings, OptimizerStats, SizesData } from "./optimizer/api";
import EncodingCard from "./optimizer/EncodingCard";
import OverviewCard, { type Job } from "./optimizer/OverviewCard";
import SizesCard from "./optimizer/SizesCard";

function sameSettings(a: OptimizerSettings, b: OptimizerSettings): boolean {
  return (Object.keys(a) as (keyof OptimizerSettings)[]).every((key) => a[key] === b[key]);
}

function jobDoneMessage(kind: JobKind, progress: BulkProgress): string {
  const n = progress.processed;
  const failed = progress.failed > 0 ? ` (${progress.failed} failed)` : "";
  if (kind === "restore") return `Restored ${n} original${n === 1 ? "" : "s"}${failed}`;
  const saved = progress.total_saved > 0 ? `, ${humanFileSize(progress.total_saved)} saved` : "";
  return `Optimized ${n} image${n === 1 ? "" : "s"}${saved}${failed}`;
}

export default function ImageOptimizerSettings() {
  const [settings, setSettings] = useState<OptimizerSettings>(api.DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<OptimizerSettings>(api.DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sizes, setSizes] = useState<SizesData | null>(null);
  const [stats, setStats] = useState<OptimizerStats | null>(null);
  const [statsReady, setStatsReady] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setSaved(data);
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't load the optimizer settings"));
    } finally {
      setSettingsReady(true);
    }
  }, []);

  const loadSizes = useCallback(async () => {
    try {
      setSizes(await api.getSizes());
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't load the image sizes"));
      setSizes((current) => current ?? { sizes: [], webpFiles: 0, webpSize: 0 });
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.getStats());
    } catch {
      // The library overview is supplementary; the page works without it.
    } finally {
      setStatsReady(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadSizes();
    loadStats();
    // Pick up a bulk job still running from an earlier visit.
    let cancelled = false;
    (async () => {
      for (const kind of ["reoptimize", "restore"] as const) {
        const progress = await api.getProgress(kind).catch(() => null);
        if (cancelled) return;
        if (progress?.running) {
          setJob({ ...progress, kind });
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSettings, loadSizes, loadStats]);

  // Poll the running job once a second, then refresh what it changed.
  const runningKind = job?.running ? job.kind : null;
  useEffect(() => {
    if (!runningKind) return;
    let stopped = false;
    let timer = 0;
    const tick = async () => {
      try {
        const progress = await api.getProgress(runningKind);
        if (stopped) return;
        if (progress.running) {
          setJob({ ...progress, kind: runningKind });
          timer = window.setTimeout(tick, 1000);
          return;
        }
        setJob(null);
        toast.success(jobDoneMessage(runningKind, progress));
      } catch {
        if (stopped) return;
        setJob(null);
        toast.error("Lost track of the job. Reload the page to see how far it got.");
      }
      loadStats();
      loadSizes();
    };
    timer = window.setTimeout(tick, 1000);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [runningKind, loadStats, loadSizes]);

  const dirty = !sameSettings(settings, saved);
  const { min, max } = api.MAX_DIMENSION;
  const maxDimensionInvalid = settings.normalize_max_dimension < min || settings.normalize_max_dimension > max;
  const maxDimensionError =
    settings.normalize_enabled && maxDimensionInvalid
      ? `Enter a size between ${min} and ${max.toLocaleString("en")} px.`
      : null;

  const saveSettings = async (): Promise<boolean> => {
    if (maxDimensionError) {
      toast.error(maxDimensionError);
      return false;
    }
    // With uploads switched off the field can't be fixed, so keep its saved value.
    const next = maxDimensionInvalid
      ? { ...settings, normalize_max_dimension: saved.normalize_max_dimension }
      : settings;
    setSaving(true);
    try {
      await api.putSettings(next);
      setSettings(next);
      setSaved(next);
      toast.success("Settings saved");
      return true;
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't save the settings"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startJob = async (kind: JobStart): Promise<boolean> => {
    // Optimizing reads the saved upload settings, so unsaved edits go first.
    if (kind !== "restore-all" && dirty && !(await saveSettings())) return false;
    try {
      const snapshot = await api.startJob(kind);
      // Always poll at least once: a tiny job can finish before this returns.
      setJob({
        total: 0,
        processed: 0,
        failed: 0,
        total_saved: 0,
        status: "running",
        ...snapshot,
        running: true,
        kind: kind === "restore-all" ? "restore" : "reoptimize",
      });
      return true;
    } catch (err) {
      toast.error(api.errorMessage(err, "Couldn't start the job"));
      return false;
    }
  };

  if (!settingsReady || !statsReady) {
    return (
      <div className="flex items-center justify-center" style={{ padding: "96px 0" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--fg-hint)" }} aria-label="Loading" />
      </div>
    );
  }

  return (
    <div data-mm="page">
      <header data-mm="page-head">
        <h1>Image Optimizer</h1>
        <p>Compresses uploads, makes resized copies for your theme and serves WebP to browsers that support it.</p>
      </header>

      {stats && stats.total_images > 0 && (
        <OverviewCard
          stats={stats}
          job={job}
          dirty={dirty}
          normalizeEnabled={settings.normalize_enabled}
          onStart={startJob}
        />
      )}

      <EncodingCard
        value={settings}
        onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
        dirty={dirty}
        saving={saving}
        maxDimensionError={maxDimensionError}
        onSave={saveSettings}
        onDiscard={() => setSettings(saved)}
      />

      <SizesCard data={sizes} onChanged={loadSizes} />
    </div>
  );
}
