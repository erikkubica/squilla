import { useMemo } from "react";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  label: string;
}

/** Decorative trend line for KPI tiles; the value is announced via `label`. */
export function Sparkline({ values, width = 120, height = 32, label }: Props) {
  const d = useMemo(() => {
    if (values.length < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const pad = 3;
    const sx = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
    const sy = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
    const line = values.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
    const area = `${line}L${sx(values.length - 1).toFixed(1)},${height}L${sx(0).toFixed(1)},${height}Z`;
    const last = { x: sx(values.length - 1), y: sy(values[values.length - 1]) };
    return { line, area, last };
  }, [values, width, height]);

  if (!d) return <div style={{ height }} aria-hidden="true" />;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={label} className="block overflow-visible">
      <path d={d.area} fill="var(--an-c1)" fillOpacity={0.1} />
      <path d={d.line} fill="none" stroke="var(--an-c1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
