// Number, percentage, duration and misc display helpers.

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return intFmt.format(n);
}

/** Compact: 950 → "950", 1200 → "1.2K", 12_900 → "12.9K", 4.2e6 → "4.2M". */
export function compact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [v, s] of units) {
    if (abs >= v) {
      const x = abs / v;
      const digits = x >= 100 ? 0 : 1;
      const str = x.toFixed(digits).replace(/\.0$/, "");
      return `${sign}${str}${s}`;
    }
  }
  if (abs > 0 && abs < 10 && !Number.isInteger(abs)) return `${sign}${abs.toFixed(1).replace(/\.0$/, "")}`;
  return `${sign}${Math.round(abs)}`;
}

export function percent(rate: number | null | undefined, digits = 1): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  const v = rate * 100;
  if (v !== 0 && Math.abs(v) < 0.1) return "<0.1%";
  return `${v.toFixed(digits).replace(/\.0$/, "")}%`;
}

export function decimal(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

export function duration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Relative change current vs previous; null when undefined (no baseline). */
export function relativeDelta(cur: number | null | undefined, prev: number | null | undefined): number | null {
  if (cur == null || prev == null || !Number.isFinite(cur) || !Number.isFinite(prev)) return null;
  if (prev === 0) return cur === 0 ? 0 : null;
  return (cur - prev) / Math.abs(prev);
}

export function signedPercent(delta: number): string {
  const v = delta * 100;
  const abs = Math.abs(v);
  const str = abs >= 100 ? abs.toFixed(0) : abs.toFixed(1).replace(/\.0$/, "");
  if (str === "0") return "0%";
  return `${v > 0 ? "+" : "−"}${str}%`;
}

/** ISO-3166 alpha-2 → flag emoji (regional indicators). Empty if invalid. */
export function flagEmoji(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "";
  const up = code.toUpperCase();
  return String.fromCodePoint(...[...up].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

let regionNames: Intl.DisplayNames | null = null;
let languageNames: Intl.DisplayNames | null = null;

export function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function languageName(code: string): string {
  try {
    languageNames ??= new Intl.DisplayNames(["en"], { type: "language" });
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.round((now - t) / 1000);
  if (sec < 0) {
    const ahead = -sec;
    if (ahead < 3600) return `in ${Math.max(1, Math.round(ahead / 60))}m`;
    return `in ${Math.round(ahead / 3600)}h`;
  }
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function humanize(s: string): string {
  if (!s) return s;
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
