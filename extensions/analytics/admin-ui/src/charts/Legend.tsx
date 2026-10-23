export interface LegendItem {
  label: string;
  color: string;
  /** "line" draws a short stroke key, "box" a square swatch. */
  shape?: "line" | "box";
  faded?: boolean;
}

export function Legend({ items, className = "" }: { items: LegendItem[]; className?: string }) {
  if (items.length < 2) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-an-muted ${className}`} aria-label="Legend">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          {it.shape === "line" ? (
            <svg width="16" height="8" aria-hidden="true">
              <line x1="1" y1="4" x2="15" y2="4" stroke={it.color} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px]" style={{ background: it.color }} />
          )}
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
