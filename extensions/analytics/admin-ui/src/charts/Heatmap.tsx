import { useMemo, useState } from "react";
import type { HeatmapCell } from "../api/types";
import { useWidth } from "../hooks/useWidth";
import { formatInt } from "../lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { SEQ_VARS, heatStep } from "./scale";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LEFT = 34;
const TOP = 16;
const GAP = 2;

type Metric = "pageviews" | "visitors";

/** Hour-of-week heatmap, one-hue sequential ramp (site timezone). */
export function Heatmap({ cells, metric = "pageviews", ariaLabel }: { cells: HeatmapCell[]; metric?: Metric; ariaLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);

  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const c of cells) if (c.dow >= 0 && c.dow < 7 && c.hour >= 0 && c.hour < 24) g[c.dow][c.hour] = c[metric] ?? 0;
    const max = Math.max(0, ...g.flat());
    return { g, max };
  }, [cells, metric]);

  const cw = Math.max(6, (width - LEFT) / 24);
  const ch = Math.min(28, Math.max(12, cw * 0.8));
  const height = TOP + ch * 7;
  const hv = hover ? grid.g[hover.d][hover.h] : 0;

  return (
    <div>
      <div ref={ref} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block" onPointerLeave={() => setHover(null)}>
          {[0, 6, 12, 18].map((h) => (
            <text key={h} x={LEFT + h * cw} y={10} fontSize={10} fill="var(--an-subtle)">{String(h).padStart(2, "0")}:00</text>
          ))}
          {DAYS.map((d, di) => (
            <g key={d}>
              <text x={0} y={TOP + di * ch + ch / 2} dy="0.32em" fontSize={11} fill="var(--an-subtle)">{d}</text>
              {grid.g[di].map((v, h) => {
                const step = heatStep(v, grid.max);
                return (
                  <rect
                    key={h}
                    x={LEFT + h * cw}
                    y={TOP + di * ch}
                    width={Math.max(1, cw - GAP)}
                    height={Math.max(1, ch - GAP)}
                    rx={2}
                    fill={step === 0 ? "var(--an-surface-2)" : SEQ_VARS[step - 1]}
                    stroke={hover?.d === di && hover?.h === h ? "var(--an-ink)" : "none"}
                    strokeWidth={1.5}
                    onPointerEnter={() => setHover({ d: di, h })}
                    onPointerDown={() => setHover({ d: di, h })}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        {hover && (
          <ChartTooltip x={LEFT + hover.h * cw + cw / 2} y={TOP + hover.d * ch + ch} containerWidth={width}>
            <div className="font-medium">{DAYS[hover.d]} {String(hover.h).padStart(2, "0")}:00–{String(hover.h).padStart(2, "0")}:59</div>
            <div className="an-num text-an-muted">{formatInt(hv)} {metric}</div>
          </ChartTooltip>
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-an-muted" aria-hidden="true">
        <span>Fewer</span>
        <span className="inline-block size-3 rounded-[2px] bg-an-surface-2" />
        {SEQ_VARS.map((c) => <span key={c} className="inline-block size-3 rounded-[2px]" style={{ background: c }} />)}
        <span>More</span>
      </div>
    </div>
  );
}

export const HEATMAP_DAYS = DAYS;
