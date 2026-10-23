import { useMemo, useState } from "react";
import { useWidth } from "../hooks/useWidth";
import { compact, formatInt } from "../lib/format";
import { ChartTooltip, TooltipRow } from "./ChartTooltip";
import { Legend } from "./Legend";
import { columnPath, linear, niceTicks, pickTickIndices } from "./scale";

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

export interface StackBucket {
  label: string;
  axis: string;
  values: Record<string, number>;
}

interface Props {
  series: StackSeries[];
  buckets: StackBucket[];
  height?: number;
  ariaLabel: string;
}

const M = { top: 10, right: 8, bottom: 26, left: 40 };
const GAP = 2;

/** Stacked columns with 2px surface gaps between segments and a legend. */
export function StackedBars({ series, buckets, height = 240, ariaLabel }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const totals = buckets.map((b) => series.reduce((s, x) => s + (b.values[x.key] ?? 0), 0));
    const ticks = niceTicks(Math.max(1, ...totals), 4);
    const innerW = Math.max(10, width - M.left - M.right);
    const base = height - M.bottom;
    const y = linear([0, ticks[ticks.length - 1]], [base, M.top]);
    const slot = innerW / Math.max(1, buckets.length);
    const bw = Math.max(2, Math.min(24, slot - GAP));
    const xTicks = pickTickIndices(buckets.length, Math.max(2, Math.floor(innerW / 72)));
    return { totals, ticks, innerW, base, y, slot, bw, xTicks };
  }, [series, buckets, width, height]);

  const hb = hover != null ? buckets[hover] : null;

  return (
    <div className="w-full">
      <Legend className="mb-2" items={series.map((s) => ({ label: s.label, color: s.color }))} />
      <div ref={ref} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block" onPointerLeave={() => setHover(null)}>
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + geo.innerW} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--an-grid)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={M.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--an-subtle)">{compact(t)}</text>
            </g>
          ))}
          {buckets.map((b, i) => {
            const x = M.left + i * geo.slot + (geo.slot - geo.bw) / 2;
            let top = geo.base;
            const segs = series.filter((s) => (b.values[s.key] ?? 0) > 0);
            return (
              <g key={i} opacity={hover == null || hover === i ? 1 : 0.6}>
                {segs.map((s, si) => {
                  const v = b.values[s.key] ?? 0;
                  const full = geo.base - geo.y(v);
                  const gap = si > 0 ? GAP : 0;
                  const h = Math.max(0, full - gap);
                  const yTop = top - gap - h;
                  top = yTop;
                  const isTop = si === segs.length - 1;
                  return isTop ? (
                    <path key={s.key} d={columnPath(x, yTop, geo.bw, h, 4)} fill={s.color} />
                  ) : (
                    <rect key={s.key} x={x} y={yTop} width={geo.bw} height={h} fill={s.color} />
                  );
                })}
                <rect x={M.left + i * geo.slot} y={M.top} width={geo.slot} height={geo.base - M.top} fill="transparent" onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />
              </g>
            );
          })}
          {geo.xTicks.map((i) => (
            <text key={i} x={M.left + i * geo.slot + geo.slot / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--an-subtle)">
              {buckets[i].axis}
            </text>
          ))}
        </svg>
        {hb && hover != null && (
          <ChartTooltip x={M.left + hover * geo.slot + geo.slot / 2} y={4} containerWidth={width}>
            <div className="mb-1 font-medium">{hb.label}</div>
            {[...series].reverse().filter((s) => (hb.values[s.key] ?? 0) > 0).map((s) => (
              <TooltipRow key={s.key} color={s.color} label={s.label} value={formatInt(hb.values[s.key])} />
            ))}
            <div className="mt-1 border-t border-an-line pt-1">
              <TooltipRow label="Total" value={formatInt(geo.totals[hover])} />
            </div>
          </ChartTooltip>
        )}
      </div>
    </div>
  );
}
