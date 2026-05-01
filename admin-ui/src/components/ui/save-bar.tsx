import type { ReactNode } from "react";

interface SaveBarProps {
  info?: ReactNode;
  children: ReactNode;
}

/**
 * SaveBar — sticky-bottom save dock for editors. Backdrop-blurred paper card
 * with shadow lift. `info` renders on the left (e.g. "Last saved 2m ago"),
 * `children` are the action buttons on the right.
 */
export function SaveBar({ info, children }: SaveBarProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        position: "sticky",
        bottom: 0,
        gap: 10,
        marginTop: 14,
        padding: "10px 14px",
        background: "color-mix(in oklab, var(--card-bg) 90%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lift)",
        zIndex: 10,
      }}
    >
      <div
        className="flex items-center"
        style={{ fontSize: 11.5, color: "var(--fg-muted)", gap: 6, letterSpacing: "-0.003em" }}
      >
        {info}
      </div>
      <div className="flex" style={{ gap: 6 }}>
        {children}
      </div>
    </div>
  );
}
