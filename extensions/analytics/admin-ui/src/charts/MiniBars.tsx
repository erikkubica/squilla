import { useState } from "react";
import { useWidth } from "../hooks/useWidth";
import { ChartTooltip } from "./ChartTooltip";
import { columnPath } from "./scale";

export interface MiniBar {
  label: string;
  value: number;
}

/** Compact per-minute columns (realtime). 2px gaps, 4px rounded tops. */
export function MiniBars({ bars, height = 56, ariaLabel, unit = "pageviews" }: { bars: MiniBar[]; height?: number; ariaLabel: string; unit?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>(280);
  const [hover, setHover] = useState<number | null>(null);
  const n = bars.length || 1;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const slot = width / n;
  const bw = Math.min(24, Math.max(1, slot - 2));
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block" onPointerLeave={() => setHover(null)}>
        <line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke="var(--an-grid)" strokeWidth={1} />
        {bars.map((b, i) => {
          const h = (b.value / max) * (height - 4);
          const x = i * slot + (slot - bw) / 2;
          return (
            <g key={i}>
              <path d={columnPath(x, height - h, bw, h, 2)} fill="var(--an-c1)" opacity={hover == null || hover === i ? 1 : 0.55} />
              <rect x={i * slot} y={0} width={slot} height={height} fill="transparent" onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />
            </g>
          );
        })}
      </svg>
      {hover != null && bars[hover] && (
        <ChartTooltip x={hover * slot + slot / 2} y={-8} containerWidth={width}>
          <div className="font-medium">{bars[hover].label}</div>
          <div className="an-num text-an-muted">{bars[hover].value} {unit}</div>
        </ChartTooltip>
      )}
    </div>
  );
}
