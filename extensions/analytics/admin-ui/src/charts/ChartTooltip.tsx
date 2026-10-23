import type { ReactNode } from "react";

/** Floating tooltip positioned inside a `relative` chart container. */
export function ChartTooltip({
  x, y, containerWidth, children,
}: { x: number; y: number; containerWidth: number; children: ReactNode }) {
  const flip = x > containerWidth * 0.6;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-[140px] rounded-md bg-an-surface px-2.5 py-2 text-xs text-an-ink shadow-lg ring-1 ring-an-line"
      style={{
        left: flip ? undefined : x + 12,
        right: flip ? containerWidth - x + 12 : undefined,
        top: Math.max(0, y),
      }}
    >
      {children}
    </div>
  );
}

export function TooltipRow({ color, label, value, shape = "box" }: { color?: string; label: string; value: ReactNode; shape?: "box" | "line" }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="inline-flex items-center gap-1.5 text-an-muted">
        {color && (shape === "line" ? (
          <span aria-hidden="true" className="inline-block h-0.5 w-3 rounded" style={{ background: color }} />
        ) : (
          <span aria-hidden="true" className="inline-block size-2 rounded-[2px]" style={{ background: color }} />
        ))}
        {label}
      </span>
      <span className="an-num font-medium text-an-ink">{value}</span>
    </div>
  );
}
