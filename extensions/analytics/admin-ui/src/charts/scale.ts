// Minimal scale helpers for the hand-rolled SVG charts.

/** Clean 0-based ticks covering `max` (1/2/2.5/5 × 10^n steps). */
export function niceTicks(max: number, count = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const rough = max / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const steps = [1, 2, 2.5, 5, 10];
  let step = pow * 10;
  for (const s of steps) {
    if (rough <= s * pow) {
      step = s * pow;
      break;
    }
  }
  // Integer data never needs fractional ticks.
  if (step < 1 && max >= 1) step = 1;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** Evenly pick ≤ `max` indices from n items, always including the last. */
export function pickTickIndices(n: number, max: number): number[] {
  if (n <= 0) return [];
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  const step = Math.ceil((n - 1) / (max - 1));
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  const last = n - 1;
  if (out[out.length - 1] !== last) {
    if (last - out[out.length - 1] < step / 2) out[out.length - 1] = last;
    else out.push(last);
  }
  return out;
}

/** SVG path for a column with a 4px rounded data end and square baseline. */
export function columnPath(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/** Horizontal bar with rounded right (data) end, square left baseline. */
export function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, h / 2, w);
  return `M${x},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x}Z`;
}

export const SERIES_VARS = [
  "var(--an-c1)", "var(--an-c2)", "var(--an-c3)", "var(--an-c4)",
  "var(--an-c5)", "var(--an-c6)", "var(--an-c7)", "var(--an-c8)",
];

export const SEQ_VARS = [
  "var(--an-s1)", "var(--an-s2)", "var(--an-s3)", "var(--an-s4)",
  "var(--an-s5)", "var(--an-s6)", "var(--an-s7)",
];

/** Quantize a value into one of the 7 sequential steps (0 = empty). */
export function heatStep(v: number, max: number): number {
  if (v <= 0 || max <= 0) return 0;
  return Math.min(SEQ_VARS.length, Math.max(1, Math.ceil((v / max) * SEQ_VARS.length)));
}
