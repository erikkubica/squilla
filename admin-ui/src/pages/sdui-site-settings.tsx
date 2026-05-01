import { SduiAdminShell } from "../sdui/admin-shell";
import { useLayout } from "../hooks/use-layout";
import { LayoutRenderer } from "../sdui/renderer";
import { getPageStore } from "../sdui/action-handler";

// SduiSiteSettingsPage renders one of the site-settings sub-pages
// (general, seo, advanced) by SDUI slug. The site settings surface used
// to be a single page with every section stacked into one form. Splitting
// into named sub-pages keeps the sidebar predictable as new sections
// land. Pass `section` from the route component so the same shell can
// resolve the matching SDUI layout.
export function SduiSiteSettingsPage({ section = "general" }: { section?: "general" | "seo" | "advanced" | "robots" }) {
  const slug = `site-settings-${section}`;
  const { data: layout, isLoading, isFetching, error } = useLayout(slug);
  const store = getPageStore(slug);

  const showSpinner = isLoading && !layout;

  return (
    <SduiAdminShell>
      {showSpinner ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{borderColor: "var(--accent-mid)"}} />
        </div>
      ) : error && !layout ? (
        <div className="rounded-lg border p-4 text-sm" style={{background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger)"}}>
          <p className="font-medium">Failed to load site settings</p>
          <p className="mt-1" style={{color: "var(--danger)"}}>{error.message}</p>
        </div>
      ) : layout ? (
        <div className={isFetching ? "opacity-90 transition-opacity" : undefined}>
          <LayoutRenderer layout={layout} pageId={slug} store={store} />
        </div>
      ) : null}
    </SduiAdminShell>
  );
}
