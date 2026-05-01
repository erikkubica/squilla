import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

/**
 * SectionHeader renders the v2 card-header style: clean type, no tinted bg,
 * just a hairline divider on the bottom. Used inside cards and as standalone
 * section markers in editors.
 */
export function SectionHeader({ title, icon, actions }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "13px 16px 11px",
        borderBottom: "1px solid var(--divider)",
      }}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        {icon && (
          <span style={{ color: "var(--fg-muted)", opacity: 0.85, display: "inline-flex" }}>
            {icon}
          </span>
        )}
        <h2
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--fg)",
            letterSpacing: "-0.005em",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {actions && <div className="flex items-center" style={{ gap: 6 }}>{actions}</div>}
    </div>
  );
}
