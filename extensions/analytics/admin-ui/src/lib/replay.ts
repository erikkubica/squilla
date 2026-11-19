// Turns a recording's raw events into what the player needs: cursor and
// scroll tracks, a list of notable moments, and idle stretches to skip.
// Pure functions so the timing rules are testable.
import type { RecEvent } from "../api/types";

export type Point = [t: number, x: number, y: number];

export interface Moment {
  t: number;
  kind: "click" | "rage" | "dead" | "error" | "focus" | "submit" | "hidden" | "visible" | "leave" | "exit" | "resize";
  label: string;
  detail?: string;
  x?: number;
  y?: number;
  selector?: string;
}

export interface Timeline {
  duration: number;
  mouse: Point[];
  scroll: Point[];
  /** [t, width, height] */
  viewport: Point[];
  clicks: { t: number; x: number; y: number; selector: string; href: string }[];
  moments: Moment[];
  /** Web Vitals measured during the view: ms, CLS ×1000 (last value wins). */
  vitals: Partial<Record<string, number>>;
  /** Stretches with nothing happening, longer than IDLE_MS: [start, end]. */
  idle: [number, number][];
}

export const IDLE_MS = 3000;
const RAGE_WINDOW = 1000;
const RAGE_RADIUS = 30;

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** "body>main:nth-of-type(1)>a:nth-of-type(2)" → "main › a" */
export function shortSelector(sel: string): string {
  if (!sel) return "";
  const parts = sel.split(">").map((p) => p.replace(/:nth-of-type\(\d+\)/g, ""));
  const tail = parts.filter((p) => p && p !== "body").slice(-3);
  return tail.join(" › ") || "page";
}

export function prettyHref(href: string): string {
  try {
    const u = new URL(href);
    return u.origin === window.location.origin ? u.pathname || "/" : u.host + u.pathname.replace(/\/$/, "");
  } catch {
    return href;
  }
}

export function buildTimeline(events: RecEvent[], vw: number, vh: number): Timeline {
  const ev = [...events].sort((a, b) => a[0] - b[0]);
  const tl: Timeline = { duration: 0, mouse: [], scroll: [[0, 0, 0]], viewport: [[0, vw, vh]], clicks: [], moments: [], idle: [], vitals: {} };
  let last = 0;
  for (const e of ev) {
    const t = e[0];
    const type = e[1];
    // Heartbeats and measurements are not activity.
    const quiet = type === "p" || type === "w" || type === "e";
    if (t - last > IDLE_MS && !quiet) tl.idle.push([last, t]);
    if (!quiet) last = Math.max(last, t);
    tl.duration = Math.max(tl.duration, t);
    switch (type) {
      case "m":
        tl.mouse.push([t, num(e[2]), num(e[3])]);
        break;
      case "s":
        tl.scroll.push([t, num(e[2]), num(e[3])]);
        break;
      case "r":
        if (num(e[2]) > 0 && num(e[3]) > 0) {
          tl.viewport.push([t, num(e[2]), num(e[3])]);
          tl.moments.push({ t, kind: "resize", label: "Resized the window", detail: `${num(e[2])} × ${num(e[3])}` });
        }
        break;
      case "c": {
        const c = { t, x: num(e[2]), y: num(e[3]), selector: str(e[4]), href: str(e[5]) };
        // Three or more clicks close together = frustration ("rage click").
        const near = tl.clicks.filter((p) => t - p.t <= RAGE_WINDOW && Math.hypot(p.x - c.x, p.y - c.y) <= RAGE_RADIUS);
        tl.clicks.push(c);
        // The mouse is where the click is, even between 10 Hz samples.
        tl.mouse.push([t, c.x, c.y]);
        const rage = near.length >= 2;
        tl.moments.push({
          t,
          kind: rage ? "rage" : "click",
          label: rage ? "Clicked repeatedly" : c.href ? "Clicked a link" : "Clicked",
          detail: c.href ? prettyHref(c.href) : shortSelector(c.selector),
          x: c.x,
          y: c.y,
          selector: c.selector,
        });
        break;
      }
      case "k":
        tl.moments.push({ t, kind: "dead", label: "Clicked, nothing happened", detail: shortSelector(str(e[4])), x: num(e[2]), y: num(e[3]), selector: str(e[4]) });
        break;
      case "e":
        tl.moments.push({ t, kind: "error", label: "JavaScript error", detail: [str(e[2]), str(e[3]) && `${str(e[3])}:${num(e[4])}`].filter(Boolean).join(" · ") });
        break;
      case "w":
        tl.vitals[str(e[2])] = num(e[3]);
        break;
      case "f":
        tl.moments.push({ t, kind: "focus", label: "Started typing in a field", detail: shortSelector(str(e[2])), selector: str(e[2]) });
        break;
      case "u":
        tl.moments.push({ t, kind: "submit", label: "Sent a form", detail: shortSelector(str(e[2])), selector: str(e[2]) });
        break;
      case "v":
        tl.moments.push({ t, kind: num(e[2]) ? "visible" : "hidden", label: num(e[2]) ? "Came back to the tab" : "Switched to another tab" });
        break;
      case "l":
        tl.moments.push({ t, kind: "leave", label: "Moved the cursor out of the window" });
        break;
      case "x":
        tl.moments.push({ t, kind: "exit", label: "Left the page" });
        break;
    }
  }
  // Collapse repeated "leave" moments: only the first in a row is useful.
  tl.moments = tl.moments.filter((m, i, all) => !(m.kind === "leave" && all[i - 1]?.kind === "leave"));
  return tl;
}

/** Index of the last sample at or before t (-1 when none). */
export function at<T extends { 0: number }>(list: T[], t: number): number {
  let lo = 0;
  let hi = list.length - 1;
  let r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (list[m][0] <= t) {
      r = m;
      lo = m + 1;
    } else hi = m - 1;
  }
  return r;
}

/** Position at t: samples come at 10 Hz, so interpolate between close neighbours and hold across pauses. */
export function lerp(list: Point[], t: number): [number, number] | null {
  const i = at(list, t);
  if (i < 0) return list.length ? [list[0][1], list[0][2]] : null;
  const a = list[i];
  const b = list[i + 1];
  if (!b || b[0] - a[0] > 400) return [a[1], a[2]];
  const k = (t - a[0]) / (b[0] - a[0] || 1);
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** Where to jump when skipping idle time: the end of the idle stretch t is in, else t. */
export function skipIdle(idle: [number, number][], t: number): number {
  for (const [s, e] of idle) if (t >= s + 500 && t < e - 500) return e - 500;
  return t;
}

export function clock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
