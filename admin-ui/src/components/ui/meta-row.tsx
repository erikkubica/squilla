import type { ReactNode } from "react";

interface MetaRowProps {
  label: ReactNode;
  value: ReactNode;
}

/**
 * MetaRow — a compact key/value row used in sidebar cards (Created, Updated,
 * Version, etc.). Mono value, label in muted body type.
 */
export function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-baseline justify-between" style={{ padding: "3px 0" }}>
      <span style={{ fontSize: 11.5, color: "var(--fg-muted)", fontWeight: 400, letterSpacing: "-0.005em" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 11.5,
          color: "var(--fg-2)",
          fontWeight: 500,
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Row of meta items with no spacing — drop into a card body. */
export function MetaList({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 1 }}>
      {children}
    </div>
  );
}
