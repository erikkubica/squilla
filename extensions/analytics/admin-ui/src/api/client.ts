// Tiny typed client for /admin/api/ext/analytics/ (contract: §2.4).
import type {
  AnalyticsSettings, BotsResponse, BreakdownDim, BreakdownResponse, ExportDataset, ExportFormat,
  Goal, GoalInput, GoalStatsResponse, HeatmapResponse, Interval, LinkInput, RealtimeResponse,
  StatusResponse, SummaryResponse, TimeseriesResponse, TrackedLink,
} from "./types";

export const API_BASE = "/admin/api/ext/analytics/";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Query = URLSearchParams | Record<string, string | number | undefined> | undefined;

export function buildUrl(path: string, query?: Query): string {
  const q = query instanceof URLSearchParams ? new URLSearchParams(query) : new URLSearchParams();
  if (query && !(query instanceof URLSearchParams)) {
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return `${API_BASE}${path}${s ? `?${s}` : ""}`;
}

async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(buildUrl(path, opts.query), {
    method,
    credentials: "same-origin",
    signal: opts.signal,
    headers: opts.body !== undefined
      ? { "Content-Type": "application/json", Accept: "application/json" }
      : { Accept: "application/json" },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; message?: string };
    throw new ApiError(res.status, err.error ?? `HTTP_${res.status}`, err.message ?? res.statusText ?? "Request failed");
  }
  return data as T;
}

const get = <T,>(path: string, query?: Query, signal?: AbortSignal) => request<T>("GET", path, { query, signal });

export const api = {
  summary: (q: URLSearchParams, signal?: AbortSignal) => get<SummaryResponse>("summary", q, signal),
  timeseries: (q: URLSearchParams, interval: Interval, signal?: AbortSignal) => {
    const qq = new URLSearchParams(q);
    qq.set("interval", interval);
    return get<TimeseriesResponse>("timeseries", qq, signal);
  },
  breakdown: (dim: BreakdownDim, q: URLSearchParams, page: { limit: number; offset?: number; sort?: string }, signal?: AbortSignal) => {
    const qq = new URLSearchParams(q);
    qq.set("limit", String(page.limit));
    if (page.offset) qq.set("offset", String(page.offset));
    if (page.sort) qq.set("sort", page.sort);
    return get<BreakdownResponse>(`breakdown/${dim}`, qq, signal);
  },
  realtime: (signal?: AbortSignal) => get<RealtimeResponse>("realtime", undefined, signal),
  heatmap: (q: URLSearchParams, signal?: AbortSignal) => get<HeatmapResponse>("heatmap", q, signal),
  bots: (q: URLSearchParams, signal?: AbortSignal) => get<BotsResponse>("bots", q, signal),

  goals: (signal?: AbortSignal) => get<Goal[] | { rows: Goal[] }>("goals", undefined, signal).then(unwrapRows),
  createGoal: (g: GoalInput) => request<Goal>("POST", "goals", { body: g }),
  updateGoal: (id: number, g: GoalInput) => request<Goal>("PUT", `goals/${id}`, { body: g }),
  deleteGoal: (id: number) => request<unknown>("DELETE", `goals/${id}`),
  goalStats: (q: URLSearchParams, signal?: AbortSignal) => get<GoalStatsResponse>("goals/stats", q, signal),

  links: (signal?: AbortSignal) => get<TrackedLink[] | { rows: TrackedLink[] }>("links", undefined, signal).then(unwrapRows),
  createLink: (l: LinkInput) => request<TrackedLink>("POST", "links", { body: l }),
  updateLink: (id: number, l: LinkInput) => request<TrackedLink>("PUT", `links/${id}`, { body: l }),
  deleteLink: (id: number) => request<unknown>("DELETE", `links/${id}`),

  settings: (signal?: AbortSignal) => get<AnalyticsSettings>("settings", undefined, signal),
  saveSettings: (s: AnalyticsSettings) => request<AnalyticsSettings>("PUT", "settings", { body: s }),
  status: (signal?: AbortSignal) => get<StatusResponse>("status", undefined, signal),
};

/** List endpoints: accept a bare array or `{rows: [...]}` (contract leaves the envelope open). */
function unwrapRows<T>(data: T[] | { rows: T[] } | null): T[] {
  if (Array.isArray(data)) return data;
  return data?.rows ?? [];
}

export interface ExportSpec {
  dataset: ExportDataset;
  format: ExportFormat;
  dim?: BreakdownDim;
  interval?: Interval;
}

export function exportUrl(base: URLSearchParams, spec: ExportSpec): string {
  const q = new URLSearchParams(base);
  q.set("dataset", spec.dataset);
  q.set("format", spec.format);
  if (spec.dim) q.set("dim", spec.dim);
  if (spec.interval) q.set("interval", spec.interval);
  return buildUrl("export", q);
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message || e.code;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
