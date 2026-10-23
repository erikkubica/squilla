import type { ReactNode } from "react";

/**
 * Row label with a horizontal share bar behind it (≤24px tall, 4px rounded
 * data end, square at the baseline). Text stays in ink, never the bar color.
 */
export function ShareBar({ share, children, height = 24 }: { share: number; children: ReactNode; height?: number }) {
  const pct = Math.max(0, Math.min(1, share || 0)) * 100;
  return (
    <div className="relative flex min-w-0 items-center" style={{ minHeight: height }}>
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-an-bar"
        style={{ width: `${pct}%`, borderRadius: "0 4px 4px 0", minWidth: pct > 0 ? 2 : 0, maxHeight: height }}
      />
      <div className="relative min-w-0 flex-1 truncate px-2 text-left text-[13px] text-an-ink">{children}</div>
    </div>
  );
}
