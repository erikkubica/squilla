import type { ReactNode } from "react";
import { Info, TriangleAlert } from "@squilla/icons";
import { BASE_PATH, Link } from "../shared";

/** Inline callout: an explanation, or something the reader should do. */
export function Notice({ tone = "info", title, children, actions }: { tone?: "info" | "warn"; title?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <div className="an-note" data-tone={tone} role="note">
      <Icon className="an-note-icon" aria-hidden="true" />
      <div className="min-w-0">
        {title && <div className="an-note-title">{title}</div>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
        {actions && <div className="an-note-actions">{actions}</div>}
      </div>
    </div>
  );
}

/** Shown where a report needs in-page measurement and it is off. */
export function NeedsSignalsNotice({ what }: { what: string }) {
  return (
    <Notice
      title="Turn on in-page measurement to see this"
      actions={<NavButton to="/settings#in-page" variant="primary">Open settings</NavButton>}
    >
      {what} comes from in-page measurement, which is switched off. It adds no cookies and no scripts; you only add a short paragraph to your privacy page.
    </Notice>
  );
}


/** A link styled as a small button, for navigation inside Analytics. */
export function NavButton({ to, children, variant = "outline", size }: { to: string; children: ReactNode; variant?: "primary" | "outline" | "ghost"; size?: "sm" }) {
  return (
    <Link to={to.startsWith("/admin") ? to : `${BASE_PATH}${to}`} className="an-btn an-focus" data-variant={variant} data-size={size}>
      {children}
    </Link>
  );
}
