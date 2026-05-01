import { SduiAdminShell } from "../sdui/admin-shell";
import { useLayout } from "../hooks/use-layout";
import { LayoutRenderer } from "../sdui/renderer";
import { getPageStore } from "../sdui/action-handler";

// SduiSecuritySettingsPage renders the language-agnostic security settings
// surface (registration toggle, default registration role). Mirrors
// sdui-site-settings.tsx but pinned to a single SDUI slug — security
// settings don't slice into sub-pages today.
export function SduiSecuritySettingsPage() {
  const slug = "security-settings";
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
          <p className="font-medium">Failed to load security settings</p>
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
