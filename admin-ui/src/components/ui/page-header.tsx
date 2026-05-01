import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  count?: number | string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

/**
 * PageHeader — the v2 listing/page header pattern. Big H1 with optional count
 * pill, optional subtitle below, actions on the right.
 */
export function PageHeader({ title, count, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      className="flex items-end justify-between"
      style={{ maxWidth: 1200, margin: "0 auto 14px", gap: 16 }}
    >
      <div>
        <h1
          className="flex items-center"
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--fg)",
            gap: 10,
            margin: 0,
          }}
        >
          {title}
          {count !== undefined && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 11,
                background: "var(--sub-bg)",
                color: "var(--fg-muted)",
                letterSpacing: 0,
              }}
            >
              {count}
            </span>
          )}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 3, letterSpacing: "-0.005em" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center" style={{ gap: 6 }}>{actions}</div>}
    </div>
  );
}
