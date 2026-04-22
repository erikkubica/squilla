import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Crumbs = string[] | null;

interface PageMetaContextValue {
  crumbs: Crumbs;
  setCrumbs: (c: Crumbs) => void;
}

const PageMetaContext = createContext<PageMetaContextValue | null>(null);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumbs>(null);
  return (
    <PageMetaContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMetaContext(): PageMetaContextValue {
  const ctx = useContext(PageMetaContext);
  if (!ctx) {
    // Fallback no-op so pages rendered outside a provider don't crash.
    return { crumbs: null, setCrumbs: () => {} };
  }
  return ctx;
}

/**
 * Page hook: pages set their own breadcrumbs when data loads.
 * Pass `null` or `[]` (or skip calling) to fall back to auto breadcrumbs.
 */
export function usePageMeta(crumbs: string[] | null | undefined) {
  const ctx = useContext(PageMetaContext);
  useEffect(() => {
    if (!ctx) return;
    if (crumbs && crumbs.length > 0) {
      ctx.setCrumbs(crumbs);
    } else {
      ctx.setCrumbs(null);
    }
    return () => {
      ctx.setCrumbs(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(crumbs)]);
}
