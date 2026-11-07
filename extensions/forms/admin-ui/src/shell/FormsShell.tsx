import React, { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowLeft, FormInput, Inbox } from "@squilla/icons";

const { Link, useLocation } = (window as any).__SQUILLA_SHARED__.ReactRouterDOM;

export const BASE = "/admin/ext/forms";

interface Props {
  /** Section icon; replaced by a back button when `back` is set. */
  icon?: React.ComponentType<{ className?: string }>;
  back?: { to?: string; onClick?: () => void; label: string };
  /** Plain title, or a custom node (the editor's editable name). */
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  /** Bar content on the left: section links or editor tabs. Defaults to Forms | Submissions. */
  nav?: ReactNode;
  /** Bar content on the right. */
  tools?: ReactNode;
  children: ReactNode;
}

/**
 * `.fm-root` token scope and the page header: one card with the title block
 * on top and a bar under it. The bar stays at the top of the screen while
 * the page scrolls under it — the same header Analytics uses.
 */
export function FormsShell({ icon: Icon = FormInput, back, title, intro, actions, nav, tools, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useStickyBar(rootRef, barRef);

  const backEl = back ? (
    back.to ? (
      <Link to={back.to} aria-label={back.label} title={back.label} className="fm-hero-back fm-focus">
        <ArrowLeft aria-hidden="true" />
      </Link>
    ) : (
      <button type="button" onClick={back.onClick} aria-label={back.label} title={back.label} className="fm-hero-back fm-focus">
        <ArrowLeft aria-hidden="true" />
      </button>
    )
  ) : null;

  return (
    <div ref={rootRef} className="fm-root w-full pb-10">
      <header className="fm-hero">
        {backEl ?? (
          <span className="fm-hero-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
        <div className="fm-hero-text">
          {typeof title === "string" ? <h1>{title}</h1> : title}
          {intro && <div className="fm-hero-intro">{intro}</div>}
        </div>
        {actions && <div className="fm-hero-actions">{actions}</div>}
      </header>
      <div ref={barRef} className="fm-bar">
        <div className="fm-bar-in">
          <div className="fm-bar-row">
            {nav ?? <SectionNav />}
            {tools && <div className="fm-bar-tools">{tools}</div>}
          </div>
        </div>
      </div>
      <div className="fm-body">{children}</div>
    </div>
  );
}

/** Forms | Submissions — mirrors the sidebar's sub-items. */
export function SectionNav({ active, unread }: { active?: "forms" | "submissions"; unread?: number }) {
  const path: string = useLocation().pathname;
  const fetched = useUnreadCount(unread === undefined);
  unread = unread ?? fetched;
  const current = active ?? (path.startsWith(`${BASE}/submissions`) ? "submissions" : "forms");
  return (
    <nav aria-label="Forms sections" className="fm-nav">
      <Link to={BASE} className="fm-focus" aria-current={current === "forms" ? "page" : undefined} data-active={current === "forms" ? "" : undefined}>
        <FormInput aria-hidden="true" /> Forms
      </Link>
      <Link
        to={`${BASE}/submissions`}
        className="fm-focus"
        aria-current={current === "submissions" ? "page" : undefined}
        data-active={current === "submissions" ? "" : undefined}
      >
        <Inbox aria-hidden="true" /> Submissions
        {unread ? (
          <span className="fm-count" data-tone="accent" title={`${unread} unread`}>
            {unread}
          </span>
        ) : null}
      </Link>
    </nav>
  );
}

/** Unread submissions across all forms (for the Submissions tab badge). */
export function useUnreadCount(enabled = true): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch("/admin/api/ext/forms/submissions?per_page=1", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => alive && b?.status_counts && setN(b.status_counts.unread || 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);
  return n;
}

/**
 * The admin's scroll area has top padding, and a sticky bar stops that far
 * below its edge. Pull the bar up by that padding, publish the bar height,
 * and mark the bar once the title block has scrolled away.
 */
function useStickyBar(root: RefObject<HTMLDivElement | null>, bar: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    const b = bar.current;
    if (!el || !b) return;
    const scroller = el.closest("main");
    const cs = scroller ? getComputedStyle(scroller) : null;
    el.style.setProperty("--fm-stick", `${cs ? parseFloat(cs.paddingTop) || 0 : 0}px`);
    const publish = () => el.style.setProperty("--fm-bar-h", `${b.offsetHeight}px`);
    publish();
    const cleanups: (() => void)[] = [];
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(publish);
      ro.observe(b);
      cleanups.push(() => ro.disconnect());
    }
    const hero = b.previousElementSibling;
    if (hero && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        ([e]) => b.toggleAttribute("data-stuck", !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)),
        { root: scroller },
      );
      io.observe(hero);
      cleanups.push(() => io.disconnect());
    }
    return () => {
      for (const c of cleanups) c();
    };
  }, [root, bar]);
}

export function EmptyBlock({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="fm-empty">
      <span className="fm-empty-icon" aria-hidden="true">
        <Icon />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="fm-skeleton h-9" />
      ))}
    </div>
  );
}
