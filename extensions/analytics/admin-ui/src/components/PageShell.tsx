import type { ReactNode } from "react";
import { BASE_PATH, Link, useSearchParams } from "../shared";
import { carryParams } from "../lib/params";

export type NavKey = "overview" | "bots" | "goals" | "settings" | "breakdown";

const NAV: { key: NavKey; label: string; path: string; carry: boolean }[] = [
  { key: "overview", label: "Overview", path: "", carry: true },
  { key: "bots", label: "Bots & AI", path: "/bots", carry: true },
  { key: "goals", label: "Goals & links", path: "/goals", carry: true },
  { key: "settings", label: "Settings", path: "/settings", carry: false },
];

interface Props {
  active: NavKey;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** `.an-root` token scope + section navigation shared by all pages. */
export function PageShell({ active, title, actions, children }: Props) {
  const [sp] = useSearchParams();
  const carry = carryParams(sp);
  return (
    <div className="an-root w-full pb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-an-ink">{title ?? "Analytics"}</h1>
          <nav aria-label="Analytics sections" className="-mx-1 mt-2 flex gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const current = n.key === active || (active === "breakdown" && n.key === "overview");
              return (
                <Link
                  key={n.key}
                  to={`${BASE_PATH}${n.path}${n.carry ? carry : ""}`}
                  aria-current={n.key === active ? "page" : undefined}
                  className={`an-focus rounded-md px-2.5 py-1 text-[13px] font-medium whitespace-nowrap transition-colors ${
                    current ? "bg-an-surface-2 text-an-ink" : "text-an-muted hover:text-an-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
