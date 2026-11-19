// Core Web Vitals and frustration signals from session recordings, turned
// into ratings and plain-language findings. Thresholds are Google's
// (web.dev/vitals), applied to the 75th percentile as Search Console does.
import type { RecInsights } from "../api/types";
import { shortSelector } from "./replay";
import type { Insight } from "./insights";

export type Metric = "lcp" | "inp" | "cls" | "ttfb" | "fcp";
export type Rating = "good" | "ok" | "poor";

/** [good up to, poor above]; CLS is stored ×1000. */
export const THRESHOLDS: Record<Metric, [number, number]> = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [100, 250],
  ttfb: [800, 1800],
  fcp: [1800, 3000],
};

export const METRIC_INFO: Record<Metric, { name: string; what: string }> = {
  lcp: { name: "Largest paint", what: "How long until the main content (the biggest image or text block) shows. Google: good under 2.5 s." },
  inp: { name: "Responsiveness", what: "The slowest reaction to a click, tap or key press during the visit. Google: good under 200 ms." },
  cls: { name: "Layout shift", what: "How much the page jumps around while loading. Google: good under 0.1." },
  ttfb: { name: "Server response", what: "How long until the first byte of the page arrives. Good under 0.8 s." },
  fcp: { name: "First paint", what: "How long until anything appears on screen. Good under 1.8 s." },
};

export function rate(metric: Metric, v: number | null | undefined): Rating | null {
  if (v == null || !Number.isFinite(v)) return null;
  const [good, poor] = THRESHOLDS[metric];
  return v <= good ? "good" : v > poor ? "poor" : "ok";
}

export function fmtMetric(metric: Metric, v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (metric === "cls") return (v / 1000).toFixed(2);
  if (v >= 1000) return `${(v / 1000).toFixed(1)} s`;
  return `${Math.round(v)} ms`;
}

export const RATING_LABEL: Record<Rating, string> = { good: "Good", ok: "Needs work", poor: "Poor" };

const share = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

/** What a site owner should look at first, most important on top. */
export function frustrationFindings(d: RecInsights, listLink: (signal: string) => string): Insight[] {
  const out: Insight[] = [];
  const t = d.totals;
  if (t.recordings === 0) return out;
  const topErr = d.errors[0];
  if (t.errors > 0 && topErr) {
    out.push({
      id: "errors",
      tone: "bad",
      icon: "broken",
      parts: [
        { b: `${share(t.errors, t.recordings)}%` },
        ` of recorded visits hit a JavaScript error. The most common is “${topErr.message}”`,
        topErr.file ? ` in ${topErr.file}` : "",
        ` (${topErr.n}×${topErr.pages > 1 ? ` on ${topErr.pages} pages` : ` on ${topErr.top_page}`}).`,
      ],
      link: { to: listLink("error"), label: "Watch visits with errors" },
    });
  }
  const rage = d.elements.find((e) => e.kind === "rage");
  if (t.rage > 0) {
    out.push({
      id: "rage",
      tone: "bad",
      icon: "engaged",
      parts: [
        { b: `${t.rage}` },
        ` ${t.rage === 1 ? "visit" : "visits"} with rage clicks (clicking the same spot again and again)`,
        rage ? [`, most on `, { b: shortSelector(rage.selector) }, ` on ${rage.path}.`] : ".",
      ].flat(),
      link: { to: listLink("rage"), label: "Watch them" },
    });
  }
  const dead = d.elements.find((e) => e.kind === "dead");
  if (t.dead > 0) {
    out.push({
      id: "dead",
      tone: "warn",
      icon: "engaged",
      parts: [
        { b: `${share(t.dead, t.recordings)}%` },
        " of visits clicked something that does nothing",
        dead ? [" — most often ", { b: shortSelector(dead.selector) }, ` on ${dead.path}. People expect it to be a link or button.`] : ".",
      ].flat(),
      link: { to: listLink("dead"), label: "Watch them" },
    });
  }
  const sv = d.site_vitals;
  const lcp = rate("lcp", sv?.lcp);
  if (sv && lcp && lcp !== "good") {
    const mobile = sv.by_device?.mobile;
    out.push({
      id: "lcp",
      tone: lcp === "poor" ? "bad" : "warn",
      icon: "down",
      parts: [
        "Pages take ",
        { b: fmtMetric("lcp", sv.lcp) },
        " to show their main content for 1 in 4 visitors",
        mobile != null && rate("lcp", mobile) !== "good" ? [" (", { b: fmtMetric("lcp", mobile) }, " on phones)"] : "",
        ". Google calls under 2.5 s good, and slow pages rank and convert worse.",
      ].flat(),
      link: { to: listLink("slow"), label: "Watch slow visits" },
    });
  }
  if (sv && rate("inp", sv.inp) === "poor") {
    out.push({ id: "inp", tone: "warn", icon: "down", parts: ["Clicks feel sluggish: the slowest reaction is ", { b: fmtMetric("inp", sv.inp) }, " for 1 in 4 visitors (good is under 200 ms)."] });
  }
  if (sv && rate("cls", sv.cls) === "poor") {
    out.push({ id: "cls", tone: "warn", icon: "down", parts: ["Pages jump around while loading (layout shift ", { b: fmtMetric("cls", sv.cls) }, "). Give images and embeds a fixed size."] });
  }
  if (t.quick_back > 0 && share(t.quick_back, t.recordings) >= 5) {
    out.push({
      id: "quick_back",
      tone: "warn",
      icon: "page",
      parts: [{ b: `${share(t.quick_back, t.recordings)}%` }, " of page views were left within 5 seconds for another page: people didn’t find what they expected."],
    });
  }
  if (t.excessive_scroll > 0 && share(t.excessive_scroll, t.recordings) >= 5) {
    out.push({
      id: "scroll",
      tone: "info",
      icon: "page",
      parts: [{ b: `${share(t.excessive_scroll, t.recordings)}%` }, " scrolled straight to the bottom without clicking anything — often a sign they were searching for something."],
    });
  }
  if (out.length === 0) {
    out.push({ id: "calm", tone: "good", icon: "up", parts: ["No errors, rage clicks or slow pages in this period. "] });
  }
  return out;
}
