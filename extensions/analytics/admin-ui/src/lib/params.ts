// Dashboard state <-> URL search params. Defaults are omitted from the URL.
import { FILTER_DIMS, type CompareMode, type FilterDim, type Interval, type SeriesMetric } from "../api/types";
import {
  DEFAULT_PRESET, PRESETS, allowedIntervals, autoInterval, isIsoDate, resolveRange,
  type DateRange, type PresetKey,
} from "./dates";

export interface ViewState {
  preset: PresetKey;
  custom: Partial<DateRange>;
  compare: CompareMode | null;
  filters: Partial<Record<FilterDim, string>>;
  interval: Interval | null; // null = auto
  metric: SeriesMetric;
}

const METRICS: SeriesMetric[] = ["visitors", "pageviews", "visits", "conversions"];
const INTERVALS: Interval[] = ["hour", "day", "week", "month"];

export function isFilterDim(d: string): d is FilterDim {
  return (FILTER_DIMS as readonly string[]).includes(d);
}

export function parseViewState(sp: URLSearchParams): ViewState {
  const rawPreset = sp.get("period");
  const preset = PRESETS.some((p) => p.key === rawPreset) ? (rawPreset as PresetKey) : DEFAULT_PRESET;
  const from = sp.get("from");
  const to = sp.get("to");
  const custom: Partial<DateRange> = {};
  if (isIsoDate(from)) custom.from = from;
  if (isIsoDate(to)) custom.to = to;
  const cmp = sp.get("compare");
  const compare = cmp === "previous" || cmp === "year" ? cmp : null;
  const filters: ViewState["filters"] = {};
  sp.forEach((value, key) => {
    if (!key.startsWith("f.") || !value) return;
    const dim = key.slice(2);
    if (isFilterDim(dim)) filters[dim] = value;
  });
  const iv = sp.get("interval");
  const interval = INTERVALS.includes(iv as Interval) ? (iv as Interval) : null;
  const m = sp.get("metric");
  const metric = METRICS.includes(m as SeriesMetric) ? (m as SeriesMetric) : "visitors";
  return { preset, custom, compare, filters, interval, metric };
}

/** Apply a patch to search params, deleting defaults. Returns a new instance. */
export function writeViewState(prev: URLSearchParams, patch: Partial<ViewState>): URLSearchParams {
  const next = new URLSearchParams(prev);
  if ("preset" in patch) {
    if (!patch.preset || patch.preset === DEFAULT_PRESET) next.delete("period");
    else next.set("period", patch.preset);
    if (patch.preset !== "custom") {
      next.delete("from");
      next.delete("to");
    }
    // Interval may no longer be valid for the new range.
    next.delete("interval");
  }
  if (patch.custom) {
    if (patch.custom.from) next.set("from", patch.custom.from);
    if (patch.custom.to) next.set("to", patch.custom.to);
  }
  if ("compare" in patch) {
    if (patch.compare) next.set("compare", patch.compare);
    else next.delete("compare");
  }
  if (patch.filters) {
    for (const key of [...next.keys()]) if (key.startsWith("f.")) next.delete(key);
    for (const [dim, value] of Object.entries(patch.filters)) {
      if (value) next.set(`f.${dim}`, value);
    }
  }
  if ("interval" in patch) {
    if (patch.interval) next.set("interval", patch.interval);
    else next.delete("interval");
  }
  if ("metric" in patch) {
    if (!patch.metric || patch.metric === "visitors") next.delete("metric");
    else next.set("metric", patch.metric);
  }
  return next;
}

export function effectiveRange(state: ViewState, today: string): DateRange {
  return resolveRange(state.preset, today, state.custom);
}

export function effectiveInterval(state: ViewState, range: DateRange): Interval {
  const allowed = allowedIntervals(range);
  if (state.interval && allowed.includes(state.interval)) return state.interval;
  const auto = autoInterval(range);
  return allowed.includes(auto) ? auto : allowed[0] ?? "day";
}

/** Query params shared by every read endpoint (§2.4). */
export function apiQuery(state: ViewState, range: DateRange, withCompare = true): URLSearchParams {
  const q = new URLSearchParams({ from: range.from, to: range.to });
  if (withCompare && state.compare) q.set("compare", state.compare);
  for (const [dim, value] of Object.entries(state.filters)) {
    if (value) q.set(`f.${dim}`, value);
  }
  return q;
}

/** Keep only the shared state (range/compare/filters) when linking between pages. */
export function carryParams(sp: URLSearchParams): string {
  const out = new URLSearchParams();
  sp.forEach((v, k) => {
    if (k === "period" || k === "from" || k === "to" || k === "compare" || k.startsWith("f.")) out.set(k, v);
  });
  const s = out.toString();
  return s ? `?${s}` : "";
}
