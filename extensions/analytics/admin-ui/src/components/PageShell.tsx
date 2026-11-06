import { useEffect, useRef, type ComponentType, type ReactNode, type RefObject } from "react";
import { ArrowLeft, Bot, FileText, LayoutDashboard, MousePointerClick, Settings2, Target, Users } from "@squilla/icons";
import type { ViewModel } from "../hooks/useViewState";
import { carryParams } from "../lib/params";
import { BASE_PATH, Link, useSearchParams } from "../shared";
import { ActiveFilters, CompareControl, PeriodControl } from "./FilterBar";

export type NavKey = "overview" | "visitors" | "pages" | "engagement" | "goals" | "bots" | "settings";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

interface NavItem {
  key: NavKey;
  label: string;
  path: string;
}

/** Reports, in the order a beginner asks about them. Settings sits apart. */
export const NAV: NavItem[] = [
  { key: "overview", label: "Overview", path: "" },
  { key: "visitors", label: "Visitors", path: "/visitors" },
  { key: "pages", label: "Pages", path: "/pages" },
  { key: "engagement", label: "Engagement", path: "/engagement" },
  { key: "goals", label: "Goals", path: "/goals" },
  { key: "bots", label: "Bots & AI", path: "/bots" },
];

const ICONS: Record<NavKey, Icon> = {
  overview: LayoutDashboard,
  visitors: Users,
  pages: FileText,
  engagement: MousePointerClick,
  goals: Target,
  bots: Bot,
  settings: Settings2,
};

/** One-line answer to "what is this page for?", shown under the title. */
export const PAGE_INTRO: Record<NavKey, { title: string; intro: string }> = {
  overview: { title: "Analytics", intro: "How your website is doing at a glance. Measured on your own server, without cookies or tracking scripts." },
  visitors: { title: "Visitors", intro: "How people find your site, where they are and what they use to visit it." },
  pages: { title: "Pages", intro: "Which pages people open, where their visits start and end, and links that lead nowhere." },
  engagement: { title: "Engagement", intro: "What people do on your pages: how visits end, which sections they see and what they click." },
  goals: { title: "Goals", intro: "Count the moments that matter, such as a sent form, a WhatsApp chat or a booking click." },
  bots: { title: "Bots & AI", intro: "Search engines, AI assistants and link previews reading your site. They are never counted as visitors." },
  settings: { title: "Analytics settings", intro: "What gets measured, how long it is kept and what your visitors need to be told." },
};

interface Props {
  active: NavKey;
  /** Overrides the page title (e.g. a single page's report). */
  title?: ReactNode;
  /** Overrides the one-line intro. */
  intro?: ReactNode;
  /** Replaces the section icon with a back button. */
  back?: { to: string; label: string };
  actions?: ReactNode;
  /** Shows the period picker (and its filters) in the header bar. */
  vm?: ViewModel;
  /** Adds the "vs previous period" control next to the period. */
  compare?: boolean;
  children: ReactNode;
}

/**
 * `.an-root` token scope and the page header: one card with the title on
 * top and a bar under it (sections, period, active filters). The bar stays
 * at the top of the screen while the report scrolls under it.
 */
export function PageShell({ active, title, intro, back, actions, vm, compare = false, children }: Props) {
  const [sp] = useSearchParams();
  const carry = carryParams(sp);
  const meta = PAGE_INTRO[active];
  const SectionIcon = ICONS[active];
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useStickyBar(rootRef, barRef);

  return (
    <div ref={rootRef} className="an-root w-full pb-10">
      <header className="an-hero">
        {back ? (
          <Link to={back.to} aria-label={back.label} title={back.label} className="an-hero-back an-focus">
            <ArrowLeft aria-hidden="true" />
          </Link>
        ) : (
          <span className="an-hero-icon" aria-hidden="true">
            <SectionIcon />
          </span>
        )}
        <div className="an-hero-text">
          <h1>{title ?? meta.title}</h1>
          <p>{intro ?? meta.intro}</p>
        </div>
        <div className="an-hero-actions">
          {actions}
          {active !== "settings" && (
            <Link to={`${BASE_PATH}/settings`} className="an-btn an-focus" data-variant="outline" aria-label="Analytics settings" title="Analytics settings">
              <Settings2 aria-hidden="true" />
              <span className="an-btn-label">Settings</span>
            </Link>
          )}
        </div>
      </header>
      <div ref={barRef} className="an-bar">
        <div className="an-bar-in">
          <div className="an-bar-row">
            <nav aria-label="Analytics sections" className="an-nav">
              {NAV.map((n) => {
                const current = n.key === active;
                return (
                  <Link key={n.key} to={`${BASE_PATH}${n.path}${carry}`} aria-current={current ? "page" : undefined} data-active={current ? "" : undefined} className="an-focus">
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            {vm && (
              <div className="an-bar-tools">
                <PeriodControl vm={vm} />
                {compare && <CompareControl vm={vm} />}
              </div>
            )}
          </div>
          {vm && <ActiveFilters vm={vm} />}
        </div>
      </div>
      <div className="an-body">{children}</div>
    </div>
  );
}

/**
 * The admin's scroll area has top padding, and a sticky bar stops that far
 * below its edge, letting the report show through above it. Pull the bar up
 * by that padding, and publish the bar's height so `#anchor` jumps land below it.
 */
function useStickyBar(root: RefObject<HTMLDivElement | null>, bar: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    const b = bar.current;
    if (!el || !b) return;
    const scroller = el.closest("main");
    const cs = scroller ? getComputedStyle(scroller) : null;
    el.style.setProperty("--an-stick", `${cs ? parseFloat(cs.paddingTop) || 0 : 0}px`);
    el.style.setProperty("--an-stick-b", `${cs ? parseFloat(cs.paddingBottom) || 0 : 0}px`);
    const publish = () => el.style.setProperty("--an-bar-h", `${b.offsetHeight}px`);
    publish();
    const cleanups: (() => void)[] = [];
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(publish);
      ro.observe(b);
      cleanups.push(() => ro.disconnect());
    }
    // The bar is stuck once the title block above it has scrolled away.
    const hero = b.previousElementSibling;
    if (hero && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([e]) => b.toggleAttribute("data-stuck", !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)), {
        root: scroller,
      });
      io.observe(hero);
      cleanups.push(() => io.disconnect());
    }
    return () => {
      for (const c of cleanups) c();
    };
  }, [root, bar]);
}
