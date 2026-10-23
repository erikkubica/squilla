// Calendar math on plain `YYYY-MM-DD` strings. All arithmetic runs in UTC
// so DST never shifts a day; "today" is resolved in the site timezone.
import type { CompareMode, Interval } from "../api/types";

export type PresetKey =
  | "today" | "yesterday" | "7d" | "30d" | "90d"
  | "month" | "last_month" | "12mo" | "custom";

export const PRESETS: { key: PresetKey; label: string; short: string }[] = [
  { key: "today", label: "Today", short: "Today" },
  { key: "yesterday", label: "Yesterday", short: "Yesterday" },
  { key: "7d", label: "Last 7 days", short: "7d" },
  { key: "30d", label: "Last 30 days", short: "30d" },
  { key: "90d", label: "Last 90 days", short: "90d" },
  { key: "month", label: "This month", short: "This month" },
  { key: "last_month", label: "Last month", short: "Last month" },
  { key: "12mo", label: "Last 12 months", short: "12 months" },
  { key: "custom", label: "Custom range", short: "Custom" },
];

export const DEFAULT_PRESET: PresetKey = "30d";

export interface DateRange {
  from: string;
  to: string;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: string | null | undefined): s is string {
  if (!s || !ISO_RE.test(s)) return false;
  const d = parse(s);
  return !Number.isNaN(d.getTime()) && fmt(d) === s;
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's date in an IANA timezone (falls back to the browser zone). */
export function todayIn(tz?: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(now);
  }
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function addMonths(iso: string, n: number): string {
  const d = parse(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fmt(d);
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 8) + "01";
}

export function endOfMonth(iso: string): string {
  const d = parse(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return fmt(d);
}

/** Inclusive number of days in a range. */
export function rangeDays(r: DateRange): number {
  return Math.round((parse(r.to).getTime() - parse(r.from).getTime()) / 86_400_000) + 1;
}

export function resolveRange(
  preset: PresetKey,
  today: string,
  custom?: Partial<DateRange>,
): DateRange {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y };
    }
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "month":
      return { from: startOfMonth(today), to: today };
    case "last_month": {
      const prev = addMonths(startOfMonth(today), -1);
      return { from: prev, to: endOfMonth(prev) };
    }
    case "12mo":
      return { from: addDays(addMonths(today, -12), 1), to: today };
    case "custom": {
      if (isIsoDate(custom?.from) && isIsoDate(custom?.to)) {
        return custom.from <= custom.to
          ? { from: custom.from, to: custom.to }
          : { from: custom.to, to: custom.from };
      }
      return { from: addDays(today, -29), to: today };
    }
    case "30d":
    default:
      return { from: addDays(today, -29), to: today };
  }
}

/** The comparison window the backend uses for `compare=…`. */
export function compareRange(r: DateRange, mode: CompareMode): DateRange {
  if (mode === "year") return { from: addMonths(r.from, -12), to: addMonths(r.to, -12) };
  const n = rangeDays(r);
  return { from: addDays(r.from, -n), to: addDays(r.from, -1) };
}

export function allowedIntervals(r: DateRange): Interval[] {
  const n = rangeDays(r);
  const out: Interval[] = [];
  if (n <= 7) out.push("hour");
  if (n <= 400) out.push("day");
  if (n >= 14) out.push("week");
  if (n >= 60) out.push("month");
  return out;
}

export function autoInterval(r: DateRange): Interval {
  const n = rangeDays(r);
  if (n <= 2) return "hour";
  if (n <= 92) return "day";
  if (n <= 200) return "week";
  return "month";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 3" / "Oct 3, 2025" — short human label for an ISO day. */
export function shortDate(iso: string, withYear = false): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const base = `${MONTHS[m - 1]} ${d}`;
  return withYear ? `${base}, ${y}` : base;
}

export function rangeLabel(r: DateRange): string {
  const sameYear = r.from.slice(0, 4) === r.to.slice(0, 4);
  if (r.from === r.to) return shortDate(r.from, true);
  return `${shortDate(r.from, !sameYear)} – ${shortDate(r.to, true)}`;
}

/** Axis/tooltip label for a timeseries bucket key. */
export function bucketLabel(t: string, interval: Interval): string {
  if (interval === "hour") {
    const hh = t.length >= 13 ? t.slice(11, 13) : "00";
    return `${shortDate(t)} ${hh}:00`;
  }
  if (interval === "month") {
    const [y, m] = t.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  }
  if (interval === "week") return `Week of ${shortDate(t)}`;
  return shortDate(t);
}

export function axisLabel(t: string, interval: Interval): string {
  if (interval === "hour") return t.length >= 13 ? `${t.slice(11, 13)}:00` : t;
  if (interval === "month") {
    const [y, m] = t.split("-").map(Number);
    return m === 1 ? String(y) : MONTHS[m - 1];
  }
  return shortDate(t);
}
