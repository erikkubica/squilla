import type { CSSProperties, ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Controls rendered on the left of the header (title becomes screen-reader only). */
  leading?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}

/** Card surface used by every dashboard section. */
export function Panel({ title, subtitle, actions, leading, children, className = "", bodyClassName = "p-4", id }: PanelProps) {
  return (
    <section className={`an-card min-w-0 ${className}`} aria-labelledby={id && title ? `${id}-title` : undefined}>
      {(title || actions || leading) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-an-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 id={id ? `${id}-title` : undefined} className={leading ? "an-sr-only" : "text-sm font-semibold tracking-tight text-an-ink"}>{title}</h2>}
            {leading}
            {subtitle && <p className="mt-0.5 text-xs text-an-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden="true" className={`an-skeleton ${className}`} style={style} />;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md bg-an-surface-2 px-3 py-2 text-xs text-an-muted">
      <span>Couldn’t load: {message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="an-focus cursor-pointer font-medium text-an-ink underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}
