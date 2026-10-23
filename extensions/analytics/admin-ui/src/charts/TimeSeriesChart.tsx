import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useWidth } from "../hooks/useWidth";
import { compact, signedPercent, relativeDelta } from "../lib/format";
import { ChartTooltip, TooltipRow } from "./ChartTooltip";
import { Legend } from "./Legend";
import { linear, niceTicks, pickTickIndices } from "./scale";

export interface TSPoint {
  /** Tooltip heading, e.g. "Oct 3". */
  label: string;
  /** Short x-axis label. */
  axis: string;
  value: number;
  /** Compare-period value at the same position (null/undefined = none). */
  prev?: number | null;
  prevLabel?: string;
}

interface Props {
  points: TSPoint[];
  seriesLabel: string;
  prevSeriesLabel?: string;
  format?: (n: number) => string;
  height?: number;
  ariaLabel: string;
}

const M = { top: 12, right: 12, bottom: 26, left: 40 };
const CUR = "var(--an-c1)";
const PREV = "var(--an-s2)";

export function TimeSeriesChart({ points, seriesLabel, prevSeriesLabel, format = compact, height = 260, ariaLabel }: Props) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const hasPrev = points.some((p) => p.prev != null);

  const geo = useMemo(() => {
    const max = Math.max(1, ...points.map((p) => Math.max(p.value, p.prev ?? 0)));
    const ticks = niceTicks(max, height < 200 ? 3 : 4);
    const innerW = Math.max(10, width - M.left - M.right);
    const innerH = height - M.top - M.bottom;
    const n = points.length;
    const x = (i: number) => M.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = linear([0, ticks[ticks.length - 1]], [M.top + innerH, M.top]);
    const line = (get: (p: TSPoint) => number | null | undefined) => {
      let d = "";
      let pen = false;
      points.forEach((p, i) => {
        const v = get(p);
        if (v == null) {
          pen = false;
          return;
        }
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      });
      return d;
    };
    const curLine = line((p) => p.value);
    const base = M.top + innerH;
    const area = n > 0 ? `${curLine}L${x(n - 1).toFixed(1)},${base}L${x(0).toFixed(1)},${base}Z` : "";
    const xTicks = pickTickIndices(n, Math.max(2, Math.floor(innerW / 72)));
    return { ticks, x, y, curLine, prevLine: line((p) => p.prev), area, xTicks, innerW, base };
  }, [points, width, height]);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement ?? e.currentTarget).getBoundingClientRect();
    const px = e.clientX - rect.left - M.left;
    const n = points.length;
    if (n === 0) return;
    const i = n <= 1 ? 0 : Math.round((px / geo.innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!points.length) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setHover((h) => Math.max(0, Math.min(points.length - 1, (h ?? (d > 0 ? -1 : points.length)) + d)));
    } else if (e.key === "Escape") setHover(null);
  };

  const hp = hover != null ? points[hover] : null;
  const last = points.length - 1;

  return (
    <div className="w-full">
      {hasPrev && (
        <Legend
          className="mb-2"
          items={[
            { label: seriesLabel, color: CUR, shape: "line" },
            { label: prevSeriesLabel ?? "Previous period", color: PREV, shape: "line" },
          ]}
        />
      )}
      <div ref={wrapRef} className="relative w-full" style={{ height }}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="an-focus block overflow-visible"
        >
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + geo.innerW} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--an-grid)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={M.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--an-subtle)" className="an-num">
                {format(t)}
              </text>
            </g>
          ))}
          {geo.xTicks.map((i) => (
            <text
              key={i}
              x={geo.x(i)}
              y={height - 6}
              textAnchor={i === 0 && points.length > 1 ? "start" : i === last && points.length > 1 ? "end" : "middle"}
              fontSize={11}
              fill="var(--an-subtle)"
            >
              {points[i].axis}
            </text>
          ))}
          {hasPrev && <path d={geo.prevLine} fill="none" stroke={PREV} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          <path d={geo.area} fill={CUR} fillOpacity={0.1} />
          <path d={geo.curLine} fill="none" stroke={CUR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.length === 1 && <circle cx={geo.x(0)} cy={geo.y(points[0].value)} r={4} fill={CUR} stroke="var(--an-surface)" strokeWidth={2} />}
          {hp && hover != null && (
            <g pointerEvents="none">
              <line x1={geo.x(hover)} x2={geo.x(hover)} y1={M.top} y2={geo.base} stroke="var(--an-subtle)" strokeWidth={1} shapeRendering="crispEdges" />
              {hp.prev != null && <circle cx={geo.x(hover)} cy={geo.y(hp.prev)} r={4} fill={PREV} stroke="var(--an-surface)" strokeWidth={2} />}
              <circle cx={geo.x(hover)} cy={geo.y(hp.value)} r={4.5} fill={CUR} stroke="var(--an-surface)" strokeWidth={2} />
            </g>
          )}
          <rect
            x={M.left}
            y={M.top}
            width={geo.innerW}
            height={geo.base - M.top}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hp && hover != null && (
          <ChartTooltip x={geo.x(hover)} y={8} containerWidth={width}>
            <div className="mb-1 font-medium text-an-ink">{hp.label}</div>
            <TooltipRow color={CUR} shape="line" label={seriesLabel} value={format(hp.value)} />
            {hp.prev != null && (
              <>
                <TooltipRow color={PREV} shape="line" label={hp.prevLabel ?? prevSeriesLabel ?? "Previous"} value={format(hp.prev)} />
                <DeltaLine cur={hp.value} prev={hp.prev} />
              </>
            )}
          </ChartTooltip>
        )}
      </div>
    </div>
  );
}

function DeltaLine({ cur, prev }: { cur: number; prev: number }) {
  const d = relativeDelta(cur, prev);
  if (d == null) return null;
  return <div className="mt-1 border-t border-an-line pt-1 text-an-muted">Change: <span className="an-num text-an-ink">{signedPercent(d)}</span></div>;
}
