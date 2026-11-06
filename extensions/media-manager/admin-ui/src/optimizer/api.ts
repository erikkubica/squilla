// Image optimizer endpoints and payload types.

export interface OptimizerSettings {
  normalize_enabled: boolean;
  normalize_max_dimension: number;
  upload_quality: number;
  jpeg_quality: number;
  webp_enabled: boolean;
  webp_quality: number;
}

export interface ImageSize {
  id?: number;
  name: string;
  width: number;
  height: number;
  mode: string;
  source: string;
  quality: number;
  cached_files?: number;
  cache_size?: number;
}

export interface SizesData {
  sizes: ImageSize[];
  /** Full-size WebP copies of originals, cached outside the per-size folders. */
  webpFiles: number;
  webpSize: number;
}

export interface OptimizerStats {
  total_images: number;
  optimized_count: number;
  unoptimized_count: number;
  with_backup: number;
  total_original_size: number;
  total_current_size: number;
  total_savings: number;
}

export interface BulkProgress {
  running: boolean;
  total: number;
  processed: number;
  failed: number;
  total_saved: number;
  status: string;
}

export type NewSize = Pick<ImageSize, "name" | "width" | "height" | "mode">;
export type JobStart = "reoptimize-all" | "optimize-pending" | "restore-all";
export type JobKind = "reoptimize" | "restore";

export const DEFAULT_SETTINGS: OptimizerSettings = {
  normalize_enabled: true,
  normalize_max_dimension: 5000,
  upload_quality: 100,
  jpeg_quality: 80,
  webp_enabled: true,
  webp_quality: 75,
};

export const MAX_DIMENSION = { min: 100, max: 20000 };

const BASE = "/admin/api/ext/media-manager/optimizer";

/** Fetches an optimizer endpoint and returns its `data`. Errors carry the
 *  server's message ({ error: { code, message } }) when there is one. */
async function call<T>(path: string, init: RequestInit = {}, fallback = "Request failed", allowConflict = false): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: "include",
    ...init,
    headers: init.method ? { "Content-Type": "application/json" } : undefined,
  });
  const body = await res.json().catch(() => null);
  // 409 on the bulk jobs means one is already running: the caller polls it.
  if (!res.ok && !(allowConflict && res.status === 409)) {
    throw new Error(body?.error?.message || fallback);
  }
  return (body?.data ?? body) as T;
}

// The settings store keeps every value as a string ("true", "80"). Coerce
// them here: left as strings, a saved "false" is truthy and its switch would
// load switched on.
function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function getSettings(): Promise<OptimizerSettings> {
  const raw = await call<Record<string, unknown>>("/settings", {}, "Couldn't load the optimizer settings");
  const d = DEFAULT_SETTINGS;
  return {
    normalize_enabled: toBool(raw?.normalize_enabled, d.normalize_enabled),
    normalize_max_dimension: toInt(raw?.normalize_max_dimension, d.normalize_max_dimension),
    upload_quality: toInt(raw?.upload_quality, d.upload_quality),
    jpeg_quality: toInt(raw?.jpeg_quality, d.jpeg_quality),
    webp_enabled: toBool(raw?.webp_enabled, d.webp_enabled),
    webp_quality: toInt(raw?.webp_quality, d.webp_quality),
  };
}

export function putSettings(settings: OptimizerSettings): Promise<unknown> {
  return call("/settings", { method: "PUT", body: JSON.stringify(settings) }, "Couldn't save the settings");
}

export async function getSizes(): Promise<SizesData> {
  const res = await fetch(`${BASE}/sizes`, { credentials: "include" });
  if (!res.ok) throw new Error("Couldn't load the image sizes");
  const body = await res.json();
  return {
    sizes: Array.isArray(body?.data) ? body.data : [],
    webpFiles: body?.meta?.webp_files ?? 0,
    webpSize: body?.meta?.webp_size ?? 0,
  };
}

/** Sizes added here are tagged "custom" so a theme or extension declaring
 *  the same name on activation doesn't overwrite them. */
export function createSize(size: NewSize): Promise<ImageSize> {
  return call("/sizes", { method: "POST", body: JSON.stringify({ ...size, source: "custom" }) }, "Couldn't add the size");
}

export function deleteSize(name: string): Promise<unknown> {
  return call(`/sizes/${encodeURIComponent(name)}`, { method: "DELETE" }, "Couldn't delete the size");
}

export function clearAllCache(): Promise<unknown> {
  return call("/cache/clear", { method: "POST" }, "Couldn't clear the cache");
}

export function clearSizeCache(name: string): Promise<unknown> {
  return call(`/cache/clear/${encodeURIComponent(name)}`, { method: "POST" }, "Couldn't clear the cache");
}

export function getStats(): Promise<OptimizerStats> {
  return call("/stats", {}, "Couldn't load the optimizer stats");
}

/** Starts a bulk job and returns its first progress snapshot (or the running
 *  job's, when one is already going). */
export function startJob(job: JobStart): Promise<Partial<BulkProgress> | null> {
  return call(`/${job}`, { method: "POST" }, "Couldn't start the job", true);
}

export function getProgress(kind: JobKind): Promise<BulkProgress> {
  return call(`/${kind}-progress`, {}, "Couldn't read the job progress");
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
