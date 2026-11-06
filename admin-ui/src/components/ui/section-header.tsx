import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Optional count shown as a pill after the title (e.g. number of blocks). */
  count?: number;
}

/**
 * SectionHeader renders the v2 card-header style: clean type, no tinted bg,
 * just a hairline divider on the bottom. Used inside cards and as standalone
 * section markers in editors.
 */
export function SectionHeader({ title, icon, actions, count }: SectionHeaderProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between"
      style={{
        gap: "6px 12px",
        minHeight: 50,
        padding: "10px 16px",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div className="flex items-center min-w-0" style={{ gap: 8 }}>
        {icon && (
          <span style={{ color: "var(--fg-muted)", display: "inline-flex" }}>
            {icon}
          </span>
        )}
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--fg)",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {count !== undefined && <span data-slot="count">{count}</span>}
      </div>
      {actions && <div className="flex flex-wrap items-center" style={{ gap: 2 }}>{actions}</div>}
    </div>
  );
}
